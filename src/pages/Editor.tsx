import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ReactFlow, Background, Controls, MiniMap, addEdge, Connection, Edge, Node, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Save, Play, CheckCircle, User, LogOut, Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BlockPalette } from "@/components/editor/BlockPalette";
import { NaturalLanguagePreview } from "@/components/editor/NaturalLanguagePreview";
import { ConditionNode } from "@/components/editor/nodes/ConditionNode";
import { ActionNode } from "@/components/editor/nodes/ActionNode";
import { OperatorNode } from "@/components/editor/nodes/OperatorNode";
import AlarmSettings from "@/components/editor/AlarmSettings";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, onSnapshot, collection, serverTimestamp, Timestamp } from "firebase/firestore";

const nodeTypes = {
  condition: ConditionNode,
  action: ActionNode,
  operator: OperatorNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Generate natural language description from nodes and edges
const generateNaturalLanguage = (nodes: Node[], edges: Edge[]) => {
  if (nodes.length === 0) {
    return "Empty rule";
  }

  const conditions = nodes.filter((n) => n.type === "condition");
  const actions = nodes.filter((n) => n.type === "action");
  const operators = nodes.filter((n) => n.type === "operator");

  let text = "";

  if (conditions.length > 0) {
    text += "IF ";
    const conditionTexts = conditions.map((c) => {
      const data = c.data as any;
      if (data.field && data.value) {
        const operatorMap: Record<string, string> = {
          equals: "equals",
          notEquals: "does not equal",
          greaterThan: "is greater than",
          lessThan: "is less than",
          greaterOrEqual: "is greater than or equal to",
          lessOrEqual: "is less than or equal to",
          contains: "contains",
        };
        const operatorText = operatorMap[data.operator || "equals"] || "equals";
        return `${data.field} ${operatorText} ${data.value}`;
      }
      return data.label || "condition";
    });
    
    // Use operators if present, otherwise default to AND
    const operatorData = operators.length > 0 ? (operators[0].data as any) : null;
    const joinOperator = operatorData ? ` ${operatorData.operatorType || "AND"} ` : " AND ";
    text += conditionTexts.join(joinOperator);
  }

  if (actions.length > 0) {
    text += " THEN ";
    const actionTexts = actions.map((a) => {
      const data = a.data as any;
      if (data.actionType && data.target) {
        return `${data.actionType} ${data.target}`;
      }
      return data.label || "action";
    });
    text += actionTexts.join(", ");
  }

  return text || "Empty rule";
};

const Editor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, logout } = useAuth();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [ruleName, setRuleName] = useState("");
  const [ruleId, setRuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [alarmConfig, setAlarmConfig] = useState({
    audioEnabled: true,
    audioFrequency: 1000,
    audioDuration: 300,
    audioVolume: 0.3,
    voiceEnabled: true,
    voiceRate: 1.0,
    voicePitch: 1.0,
    visualEnabled: true,
    visualDuration: 1700,
    notificationEnabled: true,
    alarmType: "critical",
  });

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Attach onChange handler to nodes
  const attachOnChangeToNodes = (nodes: Node[]) => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onChange: (newData: any) => handleNodeDataChange(node.id, newData),
      },
    }));
  };

  // Load rule from Firestore if ruleId is provided
  useEffect(() => {
    const loadRule = async () => {
      const ruleIdParam = searchParams.get("ruleId");
      
      // Check localStorage for temporary rule (from examples page)
      const savedRule = localStorage.getItem("currentRule");
      if (savedRule) {
        try {
          const rule = JSON.parse(savedRule);
          setRuleName(rule.name || "");
          const loadedNodes = attachOnChangeToNodes(rule.nodes || []);
          setNodes(loadedNodes);
          setEdges(rule.edges || []);
          toast.info("Loaded example rule - customize as needed!");
          localStorage.removeItem("currentRule");
          setLoading(false);
          return;
        } catch (e) {
          console.error("Failed to load rule from localStorage:", e);
        }
      }

      if (ruleIdParam && currentUser) {
        try {
          setRuleId(ruleIdParam);
          const ruleRef = doc(db, "rules", ruleIdParam);
          const ruleSnap = await getDoc(ruleRef);
          
          if (ruleSnap.exists()) {
            const ruleData = ruleSnap.data();
            
            // Check if user owns this rule
            if (ruleData.userId !== currentUser.uid) {
              toast.error("You don't have permission to edit this rule");
              navigate("/saved");
              return;
            }
            
            setRuleName(ruleData.name || "");
            const loadedNodes = attachOnChangeToNodes(ruleData.nodes || []);
            setNodes(loadedNodes);
            setEdges(ruleData.edges || []);
            if (ruleData.alarmConfig) {
              setAlarmConfig(ruleData.alarmConfig);
            }
            toast.success("Rule loaded successfully!");
          } else {
            toast.error("Rule not found");
            navigate("/saved");
          }
        } catch (error) {
          console.error("Error loading rule:", error);
          toast.error("Failed to load rule");
        }
      }
      
      setLoading(false);
    };

    loadRule();
  }, [searchParams, currentUser, navigate]);

  // Real-time listener for rule updates
  useEffect(() => {
    if (!ruleId || !currentUser) return;

    const ruleRef = doc(db, "rules", ruleId);
    const unsubscribe = onSnapshot(ruleRef, (snapshot) => {
      if (snapshot.exists()) {
        const ruleData = snapshot.data();
        
        // Only update if the change came from another source
        // (to avoid overwriting local changes)
        if (ruleData.updatedAt && ruleData.userId === currentUser.uid) {
          // You can add logic here to show a notification when rule is updated elsewhere
          console.log("Rule updated in Firestore");
        }
      }
    }, (error) => {
      console.error("Error listening to rule updates:", error);
    });

    return () => unsubscribe();
  }, [ruleId, currentUser]);

  // Mark changes as unsaved when nodes or edges change
  useEffect(() => {
    if (!loading && (nodes.length > 0 || edges.length > 0)) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, edges, loading]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const handleAddNode = (type: string) => {
    const nodeId = `${type}-${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        label: `New ${type}`,
        onChange: (newData: any) => handleNodeDataChange(nodeId, newData)
      },
      draggable: true,
    };
    setNodes((nds) => [...nds, newNode]);
    toast.success(`Added ${type} block`);
  };

  const handleNodeDataChange = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, ...newData },
          };
        }
        return node;
      })
    );
  };

  const validateRule = () => {
    if (nodes.length === 0) {
      return { isValid: false, message: "Add some blocks to validate" };
    }
    const hasCondition = nodes.some((n) => n.type === "condition");
    const hasAction = nodes.some((n) => n.type === "action");
    
    if (!hasCondition) {
      return { isValid: false, message: "Rule must have at least one condition" };
    }
    if (!hasAction) {
      return { isValid: false, message: "Rule must have at least one action" };
    }
    return { isValid: true, message: "Rule validation passed!" };
  };

  const handleValidate = async () => {
    const validation = validateRule();
    
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }
    
    toast.success(validation.message, {
      icon: <CheckCircle className="w-5 h-5" />,
    });

    // Update validation status in Firestore
    if (ruleId && currentUser) {
      try {
        const ruleRef = doc(db, "rules", ruleId);
        await setDoc(ruleRef, {
          isValid: true,
          lastValidated: serverTimestamp(),
        }, { merge: true });
      } catch (error) {
        console.error("Error updating validation status:", error);
      }
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to save rules");
      return;
    }

    if (!ruleName.trim()) {
      toast.error("Please enter a rule name");
      return;
    }

    setSaving(true);
    
    try {
      const naturalLanguage = generateNaturalLanguage(nodes, edges);
      const validation = validateRule();
      
      // Use existing ruleId or generate new one
      const docId = ruleId || `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ruleRef = doc(db, "rules", docId);
      
      // Clean nodes by removing onChange functions (Firestore can't store functions)
      const cleanedNodes = nodes.map((node) => {
        const { onChange, ...dataWithoutOnChange } = node.data as any;
        return {
          ...node,
          data: dataWithoutOnChange,
        };
      });
      
      const ruleData = {
        name: ruleName,
        userId: currentUser.uid,
        userName: currentUser.displayName || "Unknown User",
        userEmail: currentUser.email,
        nodes: cleanedNodes,
        edges: edges,
        naturalLanguage: naturalLanguage,
        isValid: validation.isValid,
        alarmConfig: alarmConfig,
        updatedAt: serverTimestamp(),
        ...(ruleId ? {} : { createdAt: serverTimestamp() })
      };

      await setDoc(ruleRef, ruleData, { merge: true });
      
      if (!ruleId) {
        setRuleId(docId);
        // Update URL without refreshing
        window.history.replaceState({}, '', `/editor?ruleId=${docId}`);
      }
      
      setHasUnsavedChanges(false);
      toast.success("Rule saved successfully!");
    } catch (error) {
      console.error("Error saving rule:", error);
      toast.error("Failed to save rule. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    const validation = validateRule();
    
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }
    
    toast.info("Test simulation running...");

    // Update lastTested in Firestore
    if (ruleId && currentUser) {
      try {
        const ruleRef = doc(db, "rules", ruleId);
        await setDoc(ruleRef, {
          lastTested: serverTimestamp(),
          isValid: validation.isValid,
        }, { merge: true });
        
        toast.success("Rule tested successfully!");
      } catch (error) {
        console.error("Error updating test status:", error);
        toast.error("Test completed but failed to update status");
      }
    } else {
      toast.warning("Save the rule first to track test history");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading rule editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter rule name..."
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="px-3 py-1.5 rounded-md border bg-background text-sm w-64"
            />
            {hasUnsavedChanges && (
              <span className="text-xs text-orange-500 font-medium">• Unsaved</span>
            )}
          </div>
          {currentUser && (
            <div className="text-xs text-muted-foreground">
              Editing as: <span className="font-medium">{currentUser.displayName || currentUser.email}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleValidate}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Validate
          </Button>
          <Button variant="outline" size="sm" onClick={handleTest}>
            <Play className="w-4 h-4 mr-2" />
            Test
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {ruleId ? "Save Changes" : "Save Rule"}
              </>
            )}
          </Button>
          
          {currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 ml-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                      {getInitials(currentUser.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {currentUser.displayName || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/saved")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Saved Rules</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <div className="flex-1 flex">
        <BlockPalette onAddNode={handleAddNode} />

        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>

          {/* Alarm Settings Panel */}
          <div className="max-h-[40vh] overflow-y-auto border-t bg-background">
            <AlarmSettings 
              alarmConfig={alarmConfig} 
              onAlarmConfigChange={setAlarmConfig}
            />
          </div>
        </div>

        <NaturalLanguagePreview nodes={nodes} edges={edges} />
      </div>
    </div>
  );
};

export default Editor;
