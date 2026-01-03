import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Eye, Download, Trash2, Loader2, CheckCircle, XCircle, Play, Zap, StopCircle, Activity } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, Timestamp, setDoc, serverTimestamp } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SavedRule {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
  createdAt: any;
  updatedAt?: any;
  naturalLanguage?: string;
  isValid?: boolean;
  lastTested?: any;
  userId: string;
  userName?: string;
  alarmConfig?: {
    audioEnabled: boolean;
    audioFrequency: number;
    audioDuration: number;
    audioVolume: number;
    voiceEnabled: boolean;
    voiceRate: number;
    voicePitch: number;
    visualEnabled: boolean;
    visualDuration: number;
    notificationEnabled: boolean;
    alarmType: string;
  };
}

const Saved = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [rules, setRules] = useState<SavedRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewRule, setPreviewRule] = useState<SavedRule | null>(null);
  const [testInputs, setTestInputs] = useState<Record<string, any>>({});
  const [previewResult, setPreviewResult] = useState<{
    matched: boolean;
    actions: string[];
    evaluationPath: string[];
  } | null>(null);
  const [autoMode, setAutoMode] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<Record<string, any>>({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alertActive, setAlertActive] = useState(false);

  useEffect(() => {
    const loadRules = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const rulesRef = collection(db, "rules");
        
        // Try with index, fall back to simple query if index not ready
        let querySnapshot;
        try {
          const q = query(
            rulesRef,
            where("userId", "==", currentUser.uid),
            orderBy("updatedAt", "desc")
          );
          querySnapshot = await getDocs(q);
        } catch (indexError: any) {
          // Index not ready, use simple query and sort client-side
          console.warn("Index not ready, using fallback query");
          const qSimple = query(
            rulesRef,
            where("userId", "==", currentUser.uid)
          );
          querySnapshot = await getDocs(qSimple);
        }
        
        const loadedRules: SavedRule[] = [];
        
        querySnapshot.forEach((doc) => {
          loadedRules.push({
            id: doc.id,
            ...doc.data(),
          } as SavedRule);
        });
        
        // Sort client-side by updatedAt (newest first)
        loadedRules.sort((a, b) => {
          const aTime = a.updatedAt?.toMillis?.() || 0;
          const bTime = b.updatedAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        
        setRules(loadedRules);
      } catch (error) {
        console.error("Error loading rules:", error);
        toast.error("Failed to load rules");
      } finally {
        setLoading(false);
      }
    };

    loadRules();
  }, [currentUser]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "rules", id));
      setRules(rules.filter((r) => r.id !== id));
      toast.success("Rule deleted successfully");
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast.error("Failed to delete rule");
    }
  };

  const handleExport = (rule: SavedRule) => {
    const exportData = {
      name: rule.name,
      nodes: rule.nodes,
      edges: rule.edges,
      naturalLanguage: rule.naturalLanguage,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rule.name.replace(/\s+/g, "-")}.json`;
    a.click();
    toast.success("Rule exported");
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleDateString();
    }
    
    if (typeof timestamp === "string") {
      return new Date(timestamp).toLocaleDateString();
    }
    
    return "Unknown";
  };

  const getInputVariables = (rule: SavedRule): string[] => {
    const variables = new Set<string>();
    rule.nodes.forEach((node: any) => {
      if (node.type === "condition") {
        // Check multiple possible field names for the variable
        const variableName = node.data?.field || node.data?.variable || node.data?.label?.split(' ')[0];
        if (variableName) {
          variables.add(variableName);
        }
      }
    });
    return Array.from(variables);
  };

  const evaluateCondition = (condition: any, inputs: Record<string, any>): boolean => {
    const variable = condition.field || condition.variable;
    const operator = condition.operator;
    const value = condition.value;
    
    const inputValue = inputs[variable];

    if (inputValue === undefined) {
      console.log(`No input value found for variable: ${variable}`);
      return false;
    }

    console.log(`Evaluating: ${variable} ${operator} ${value} with input: ${inputValue}`);

    // Handle different operator formats
    let result = false;
    switch (operator) {
      case "greaterThan":
      case ">":
        result = parseFloat(inputValue) > parseFloat(value);
        break;
      case "lessThan":
      case "<":
        result = parseFloat(inputValue) < parseFloat(value);
        break;
      case "greaterOrEqual":
      case ">=":
        result = parseFloat(inputValue) >= parseFloat(value);
        break;
      case "lessOrEqual":
      case "<=":
        result = parseFloat(inputValue) <= parseFloat(value);
        break;
      case "equals":
      case "==":
        result = inputValue == value;
        break;
      case "notEquals":
      case "!=":
        result = inputValue != value;
        break;
      case "===":
        result = inputValue === value;
        break;
      case "!==":
        result = inputValue !== value;
        break;
      default:
        result = false;
    }
    
    console.log(`Result: ${result}`); 
    return result;
  };

  const evaluateRule = (rule: SavedRule, inputs: Record<string, any>) => {
    const actions: string[] = [];
    const evaluationPath: string[] = [];
    let matched = false;

    // Find starting nodes (nodes with no incoming edges)
    const targetNodeIds = new Set(rule.edges.map((e: any) => e.target));
    const startNodes = rule.nodes.filter((n: any) => !targetNodeIds.has(n.id));

    const evaluateNode = (nodeId: string, depth = 0): boolean => {
      const node = rule.nodes.find((n: any) => n.id === nodeId);
      if (!node) return false;

      const indent = "  ".repeat(depth);

      if (node.type === "condition") {
        const result = evaluateCondition(node.data, inputs);
        const variable = node.data.field || node.data.variable || "undefined";
        const operator = node.data.operator || "undefined";
        const value = node.data.value || "undefined";
        
        evaluationPath.push(
          `${indent}Condition: ${variable} ${operator} ${value} → ${result ? "✓ TRUE" : "✗ FALSE"}`
        );
        
        // Find connected nodes
        const outgoingEdges = rule.edges.filter((e: any) => e.source === nodeId);
        
        if (result && outgoingEdges.length > 0) {
          // Evaluate all connected nodes
          outgoingEdges.forEach((edge: any) => {
            evaluateNode(edge.target, depth + 1);
          });
        }
        
        return result;
      } else if (node.type === "operator") {
        const connectedSources = rule.edges
          .filter((e: any) => e.target === nodeId)
          .map((e: any) => e.source);
        
        const results = connectedSources.map((sourceId) => {
          const sourceNode = rule.nodes.find((n: any) => n.id === sourceId);
          if (sourceNode?.type === "condition") {
            return evaluateCondition(sourceNode.data, inputs);
          }
          return false;
        });

        let operatorResult = false;
        const operatorType = node.data.operatorType || node.data.operator || "AND";
        
        if (operatorType === "AND") {
          operatorResult = results.every((r) => r);
          evaluationPath.push(`${indent}Operator: AND → ${operatorResult ? "✓ TRUE" : "✗ FALSE"}`);
        } else if (operatorType === "OR") {
          operatorResult = results.some((r) => r);
          evaluationPath.push(`${indent}Operator: OR → ${operatorResult ? "✓ TRUE" : "✗ FALSE"}`);
        }

        if (operatorResult) {
          const outgoingEdges = rule.edges.filter((e: any) => e.source === nodeId);
          outgoingEdges.forEach((edge: any) => {
            evaluateNode(edge.target, depth + 1);
          });
        }

        return operatorResult;
      } else if (node.type === "action") {
        // Format action display with actionType, target, and parameters
        let actionDisplay = "Action not fully defined - click to edit";
        
        if (node.data.actionType && node.data.target) {
          // Format action type by replacing underscores with spaces
          const actionTypeFormatted = node.data.actionType.replace(/_/g, " ");
          actionDisplay = `${actionTypeFormatted}: ${node.data.target}`;
          
          if (node.data.parameters) {
            actionDisplay += ` (${node.data.parameters})`;
          }
        } else if (node.data.actionType) {
          const actionTypeFormatted = node.data.actionType.replace(/_/g, " ");
          actionDisplay = `${actionTypeFormatted} (target not specified)`;
        } else if (node.data.label && node.data.label !== "Action" && node.data.label !== "New action") {
          // Use label only if it's meaningful
          actionDisplay = node.data.label;
        }
        
        actions.push(actionDisplay);
        evaluationPath.push(`${indent}Action: ${actionDisplay} → ✓ EXECUTED`);
        matched = true;
        return true;
      }

      return false;
    };

    startNodes.forEach((node: any) => {
      evaluateNode(node.id);
    });

    return { matched, actions, evaluationPath };
  };

  const generatePseudoCode = (rule: SavedRule): string => {
    const lines: string[] = [];
    
    const conditions = rule.nodes.filter((n: any) => n.type === "condition");
    const operators = rule.nodes.filter((n: any) => n.type === "operator");
    const actions = rule.nodes.filter((n: any) => n.type === "action");

    // Build English-style pseudo code
    if (conditions.length > 0) {
      lines.push("IF");
      
      conditions.forEach((cond, idx) => {
        const field = cond.data.field || cond.data.variable || "variable";
        const operator = cond.data.operator || "equals";
        const value = cond.data.value || "value";
        
        const operatorMap: Record<string, string> = {
          equals: "equals",
          notEquals: "does not equal",
          greaterThan: "is greater than",
          lessThan: "is less than",
          greaterOrEqual: "is greater than or equal to",
          lessOrEqual: "is less than or equal to",
          contains: "contains",
        };
        
        const op = operatorMap[operator] || operator;
        lines.push(`  ${field} ${op} ${value}`);
        
        if (idx < conditions.length - 1) {
          const operatorType = operators.length > 0 ? (operators[0].data.operatorType || "AND") : "AND";
          lines.push(operatorType);
        }
      });
      
      lines.push("THEN");
      
      // Add actions
      if (actions.length > 0) {
        actions.forEach((action) => {
          const actionType = action.data.actionType;
          const target = action.data.target || "";
          const params = action.data.parameters || "";
          
          if (actionType && target) {
            // Format action in English style
            const actionTypeFormatted = actionType.replace(/_/g, " ");
            
            if (params) {
              lines.push(`  ${actionTypeFormatted}: ${target} with parameters (${params})`);
            } else {
              lines.push(`  ${actionTypeFormatted}: ${target}`);
            }
          } else if (actionType) {
            const actionTypeFormatted = actionType.replace(/_/g, " ");
            lines.push(`  ${actionTypeFormatted} (target not specified)`);
          } else if (action.data.label && action.data.label !== "Action" && action.data.label !== "New action") {
            lines.push(`  ${action.data.label}`);
          } else {
            lines.push(`  (Action not fully defined - click to edit)`);
          }
        });
      } else {
        lines.push("  (No actions defined)");
      }
      
      lines.push("END IF");
    } else {
      lines.push("(No conditions defined)");
      if (actions.length > 0) {
        lines.push("");
        lines.push("EXECUTE:");
        actions.forEach((action) => {
          const actionType = action.data.actionType;
          const target = action.data.target || "";
          
          if (actionType && target) {
            const actionTypeFormatted = actionType.replace(/_/g, " ");
            lines.push(`  ${actionTypeFormatted}: ${target}`);
          } else if (actionType) {
            const actionTypeFormatted = actionType.replace(/_/g, " ");
            lines.push(`  ${actionTypeFormatted} (target not specified)`);
          } else {
            lines.push(`  (Action not fully defined)`);
          }
        });
      }
    }

    return lines.join("\n");
  };

  const getSystemMetrics = async (): Promise<Record<string, any>> => {
    const metrics: Record<string, any> = {};

    try {
      // Get memory info (browser only - approximation)
      if ('memory' in performance && (performance as any).memory) {
        const memory = (performance as any).memory;
        metrics.memoryUsedMB = Math.round(memory.usedJSHeapSize / 1048576);
        metrics.memoryTotalMB = Math.round(memory.jsHeapSizeLimit / 1048576);
        metrics.memoryPercent = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
      }

      // Get battery info
      if ('getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        metrics.batteryLevel = Math.round(battery.level * 100);
        metrics.batteryCharging = battery.charging ? "yes" : "no";
      }

      // Get time-based metrics
      const now = new Date();
      metrics.hour = now.getHours();
      metrics.minute = now.getMinutes();
      metrics.dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      metrics.dayOfMonth = now.getDate();

      // Get connection info
      if ('connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator) {
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        if (connection) {
          metrics.connectionType = connection.effectiveType || connection.type || "unknown";
          metrics.downlink = connection.downlink || 0;
        }
      }

      // Simulated CPU usage (random for demo - in real app would need backend)
      metrics.cpuPercent = Math.round(Math.random() * 100);
      
      // Get device info
      metrics.screenWidth = window.screen.width;
      metrics.screenHeight = window.screen.height;
      metrics.online = navigator.onLine ? "yes" : "no";

      // Storage API (if available)
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage && estimate.quota) {
          metrics.storageUsedGB = (estimate.usage / 1073741824).toFixed(2);
          metrics.storageTotalGB = (estimate.quota / 1073741824).toFixed(2);
          metrics.storagePercent = Math.round((estimate.usage / estimate.quota) * 100);
        }
      }

    } catch (error) {
      console.error("Error getting system metrics:", error);
    }

    return metrics;
  };

  const playAlertSound = (frequency = 800, duration = 500, volume = 0.3) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.error("Error playing alert sound:", error);
    }
  };

  const speakAlert = (text: string, rate = 1.0, pitch = 1.0) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const triggerVisualAlert = (duration = 1700) => {
    setAlertActive(true);
    
    // Flash effect - scale timing based on duration
    const times = [0.3, 0.35, 0.65, 0.7, 1.0].map(t => t * duration);
    setTimeout(() => setAlertActive(false), times[0]);
    setTimeout(() => setAlertActive(true), times[1]);
    setTimeout(() => setAlertActive(false), times[2]);
    setTimeout(() => setAlertActive(true), times[3]);
    setTimeout(() => setAlertActive(false), times[4]);
  };

  const handlePreview = async (rule: SavedRule) => {
    setPreviewRule(rule);
    setTestInputs({});
    setPreviewResult(null);
    setAutoMode(false);
    setIsMonitoring(false);
    
    // Load initial system metrics
    const metrics = await getSystemMetrics();
    setSystemMetrics(metrics);
  };

  const createExampleMonitoringRule = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to create rules");
      navigate("/login");
      return;
    }

    try {
      const exampleRule = {
        name: "Example: High Memory Alert",
        userId: currentUser.uid,
        userName: currentUser.displayName || "Unknown User",
        userEmail: currentUser.email,
        nodes: [
          {
            id: "condition-1",
            type: "condition",
            position: { x: 250, y: 100 },
            data: {
              label: "memoryPercent > 50",
              variable: "memoryPercent",
              operator: ">",
              value: "50",
            },
          },
          {
            id: "action-1",
            type: "action",
            position: { x: 250, y: 250 },
            data: {
              label: "Alert: High memory usage detected!",
              action: "Alert: High memory usage detected!",
            },
          },
        ],
        edges: [
          {
            id: "edge-1",
            source: "condition-1",
            target: "action-1",
            sourceHandle: null,
            targetHandle: null,
          },
        ],
        naturalLanguage: "IF memoryPercent > 50 THEN Alert: High memory usage detected!",
        isValid: true,
        alarmConfig: {
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
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ruleRef = doc(db, "rules", docId);
      await setDoc(ruleRef, exampleRule);

      // Reload rules
      const rulesRef = collection(db, "rules");
      const q = query(rulesRef, where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const loadedRules: SavedRule[] = [];
      querySnapshot.forEach((doc) => {
        loadedRules.push({ id: doc.id, ...doc.data() } as SavedRule);
      });
      loadedRules.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setRules(loadedRules);

      toast.success("Example rule created! Click the eye icon to test it.");
    } catch (error) {
      console.error("Error creating example rule:", error);
      toast.error("Failed to create example rule");
    }
  };

  const createMarksExampleRule = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to create rules");
      navigate("/login");
      return;
    }

    try {
      const exampleRule = {
        name: "Example: Marks Achievement - 20 Points",
        userId: currentUser.uid,
        userName: currentUser.displayName || "Unknown User",
        userEmail: currentUser.email,
        nodes: [
          {
            id: "condition-1",
            type: "condition",
            position: { x: 250, y: 100 },
            data: {
              label: "marks >= 20",
              variable: "marks",
              operator: ">=",
              value: "20",
            },
          },
          {
            id: "action-1",
            type: "action",
            position: { x: 250, y: 250 },
            data: {
              label: "Congratulations! You scored 20 or more marks! 🎉",
              action: "Congratulations! You scored 20 or more marks! 🎉",
            },
          },
        ],
        edges: [
          {
            id: "edge-1",
            source: "condition-1",
            target: "action-1",
            sourceHandle: null,
            targetHandle: null,
          },
        ],
        naturalLanguage: "IF marks >= 20 THEN Congratulations! You scored 20 or more marks! 🎉",
        isValid: true,
        alarmConfig: {
          audioEnabled: true,
          audioFrequency: 1200,
          audioDuration: 500,
          audioVolume: 0.5,
          voiceEnabled: true,
          voiceRate: 1.0,
          voicePitch: 1.2,
          visualEnabled: true,
          visualDuration: 2000,
          notificationEnabled: true,
          alarmType: "info",
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ruleRef = doc(db, "rules", docId);
      await setDoc(ruleRef, exampleRule);

      // Reload rules
      const rulesRef = collection(db, "rules");
      const q = query(rulesRef, where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const loadedRules: SavedRule[] = [];
      querySnapshot.forEach((doc) => {
        loadedRules.push({ id: doc.id, ...doc.data() } as SavedRule);
      });
      loadedRules.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setRules(loadedRules);

      toast.success("Marks rule created! Enter '20' in the test to trigger it.");
    } catch (error) {
      console.error("Error creating marks example rule:", error);
      toast.error("Failed to create example rule");
    }
  };

  const createWorkingExampleRule = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to create rules");
      navigate("/login");
      return;
    }

    try {
      const exampleRule = {
        name: "Working Example: Test Score Alert",
        userId: currentUser.uid,
        userName: currentUser.displayName || "Unknown User",
        userEmail: currentUser.email,
        nodes: [
          {
            id: "condition-1",
            type: "condition",
            position: { x: 250, y: 100 },
            data: {
              label: "score == 20",
              field: "score",
              operator: "equals",
              value: "20",
            },
          },
          {
            id: "action-1",
            type: "action",
            position: { x: 250, y: 250 },
            data: {
              label: "Perfect Score Alert! 🎯",
              action: "Perfect Score Alert! You got exactly 20 points! 🎯",
            },
          },
        ],
        edges: [
          {
            id: "edge-1",
            source: "condition-1",
            target: "action-1",
            sourceHandle: null,
            targetHandle: null,
          },
        ],
        naturalLanguage: "IF score == 20 THEN Perfect Score Alert! 🎯",
        isValid: true,
        alarmConfig: {
          audioEnabled: true,
          audioFrequency: 800,
          audioDuration: 400,
          audioVolume: 0.4,
          voiceEnabled: true,
          voiceRate: 0.9,
          voicePitch: 1.1,
          visualEnabled: true,
          visualDuration: 1500,
          notificationEnabled: true,
          alarmType: "warning",
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ruleRef = doc(db, "rules", docId);
      await setDoc(ruleRef, exampleRule);

      // Reload rules
      const rulesRef = collection(db, "rules");
      const q = query(rulesRef, where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const loadedRules: SavedRule[] = [];
      querySnapshot.forEach((doc) => {
        loadedRules.push({ id: doc.id, ...doc.data() } as SavedRule);
      });
      loadedRules.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setRules(loadedRules);

      toast.success("Working example created! Test with score = 20");
    } catch (error) {
      console.error("Error creating working example rule:", error);
      toast.error("Failed to create example rule");
    }
  };

  const createSmartCookerRule = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to create rules");
      navigate("/login");
      return;
    }

    try {
      const exampleRule = {
        name: "Smart Cooker Safety Rule",
        userId: currentUser.uid,
        userName: currentUser.displayName || "Unknown User",
        userEmail: currentUser.email,
        nodes: [
          {
            id: "condition-1",
            type: "condition",
            position: { x: 250, y: 100 },
            data: {
              label: "pot_placed == true",
              field: "pot_placed",
              operator: "equals",
              value: "true",
            },
          },
          {
            id: "condition-2",
            type: "condition",
            position: { x: 250, y: 200 },
            data: {
              label: "cooker_time <= 60",
              field: "cooker_time",
              operator: "lessOrEqual",
              value: "60",
            },
          },
          {
            id: "action-1",
            type: "action",
            position: { x: 250, y: 300 },
            data: {
              label: "Allow cooker to switch ON",
              action: "Cooker can be safely turned ON - Pot placed and within 1-hour limit!",
            },
          },
        ],
        edges: [
          {
            id: "edge-1",
            source: "condition-1",
            target: "condition-2",
          },
          {
            id: "edge-2",
            source: "condition-2",
            target: "action-1",
          },
        ],
        naturalLanguage: "IF pot_placed equals true AND cooker_time <= 60 THEN Allow cooker to switch ON",
        isValid: true,
        alarmConfig: {
          audioEnabled: true,
          audioFrequency: 1000,
          audioDuration: 400,
          audioVolume: 0.4,
          voiceEnabled: true,
          voiceRate: 1.0,
          voicePitch: 1.0,
          visualEnabled: true,
          visualDuration: 2000,
          notificationEnabled: true,
          alarmType: "warning",
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ruleRef = doc(db, "rules", docId);
      await setDoc(ruleRef, exampleRule);

      // Reload rules
      const rulesRef = collection(db, "rules");
      const q = query(rulesRef, where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const loadedRules: SavedRule[] = [];
      querySnapshot.forEach((doc) => {
        loadedRules.push({ id: doc.id, ...doc.data() } as SavedRule);
      });
      loadedRules.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setRules(loadedRules);

      toast.success("Smart Cooker rule created! Test with: pot_placed=true, cooker_time=30");
    } catch (error) {
      console.error("Error creating smart cooker rule:", error);
      toast.error("Failed to create example rule");
    }
  };

  const createBathroomRule = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to create rules");
      navigate("/login");
      return;
    }

    try {
      const exampleRule = {
        name: "Bathroom Routine Rule",
        userId: currentUser.uid,
        userName: currentUser.displayName || "Unknown User",
        userEmail: currentUser.email,
        nodes: [
          {
            id: "condition-1",
            type: "condition",
            position: { x: 250, y: 100 },
            data: {
              label: "in_bathroom == true",
              field: "in_bathroom",
              operator: "equals",
              value: "true",
            },
          },
          {
            id: "condition-2",
            type: "condition",
            position: { x: 250, y: 200 },
            data: {
              label: "bathroom_time <= 30",
              field: "bathroom_time",
              operator: "lessOrEqual",
              value: "30",
            },
          },
          {
            id: "action-1",
            type: "action",
            position: { x: 250, y: 300 },
            data: {
              label: "Complete bathroom routine",
              action: "Time to complete bathroom routine: wash, brush teeth, and comb hair!",
            },
          },
        ],
        edges: [
          {
            id: "edge-1",
            source: "condition-1",
            target: "condition-2",
          },
          {
            id: "edge-2",
            source: "condition-2",
            target: "action-1",
          },
        ],
        naturalLanguage: "IF in_bathroom equals true AND bathroom_time <= 30 THEN Complete bathroom routine",
        isValid: true,
        alarmConfig: {
          audioEnabled: true,
          audioFrequency: 800,
          audioDuration: 300,
          audioVolume: 0.3,
          voiceEnabled: true,
          voiceRate: 0.9,
          voicePitch: 1.1,
          visualEnabled: true,
          visualDuration: 1500,
          notificationEnabled: true,
          alarmType: "info",
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ruleRef = doc(db, "rules", docId);
      await setDoc(ruleRef, exampleRule);

      // Reload rules
      const rulesRef = collection(db, "rules");
      const q = query(rulesRef, where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const loadedRules: SavedRule[] = [];
      querySnapshot.forEach((doc) => {
        loadedRules.push({ id: doc.id, ...doc.data() } as SavedRule);
      });
      loadedRules.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setRules(loadedRules);

      toast.success("Bathroom rule created! Test with: in_bathroom=true, bathroom_time=15");
    } catch (error) {
      console.error("Error creating bathroom rule:", error);
      toast.error("Failed to create example rule");
    }
  };

  const createMedicationRule = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to create rules");
      navigate("/login");
      return;
    }

    try {
      const exampleRule = {
        name: "Medication Safety Rule",
        userId: currentUser.uid,
        userName: currentUser.displayName || "Unknown User",
        userEmail: currentUser.email,
        nodes: [
          {
            id: "condition-1",
            type: "condition",
            position: { x: 250, y: 100 },
            data: {
              label: "wake_up == true",
              field: "wake_up",
              operator: "equals",
              value: "true",
            },
          },
          {
            id: "condition-2",
            type: "condition",
            position: { x: 250, y: 200 },
            data: {
              label: "time_since_wake <= 60",
              field: "time_since_wake",
              operator: "lessOrEqual",
              value: "60",
            },
          },
          {
            id: "condition-3",
            type: "condition",
            position: { x: 250, y: 300 },
            data: {
              label: "food_eaten == true",
              field: "food_eaten",
              operator: "equals",
              value: "true",
            },
          },
          {
            id: "action-1",
            type: "action",
            position: { x: 250, y: 400 },
            data: {
              label: "Take medication safely",
              action: "Safe to take medication - You've eaten food and it's within 1 hour of waking up!",
            },
          },
        ],
        edges: [
          {
            id: "edge-1",
            source: "condition-1",
            target: "condition-2",
          },
          {
            id: "edge-2",
            source: "condition-2",
            target: "condition-3",
          },
          {
            id: "edge-3",
            source: "condition-3",
            target: "action-1",
          },
        ],
        naturalLanguage: "IF wake_up equals true AND time_since_wake <= 60 AND food_eaten equals true THEN Take medication safely",
        isValid: true,
        alarmConfig: {
          audioEnabled: true,
          audioFrequency: 600,
          audioDuration: 500,
          audioVolume: 0.5,
          voiceEnabled: true,
          voiceRate: 0.8,
          voicePitch: 1.2,
          visualEnabled: true,
          visualDuration: 2500,
          notificationEnabled: true,
          alarmType: "critical",
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ruleRef = doc(db, "rules", docId);
      await setDoc(ruleRef, exampleRule);

      // Reload rules
      const rulesRef = collection(db, "rules");
      const q = query(rulesRef, where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const loadedRules: SavedRule[] = [];
      querySnapshot.forEach((doc) => {
        loadedRules.push({ id: doc.id, ...doc.data() } as SavedRule);
      });
      loadedRules.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setRules(loadedRules);

      toast.success("Medication rule created! Test with: wake_up=true, time_since_wake=30, food_eaten=true");
    } catch (error) {
      console.error("Error creating medication rule:", error);
      toast.error("Failed to create example rule");
    }
  };

  const handleRunTest = () => {
    if (!previewRule) return;

    const inputData = autoMode ? systemMetrics : testInputs;
    const result = evaluateRule(previewRule, inputData);
    setPreviewResult(result);

    // Trigger alerts if rule matched (works for both manual and auto mode)
    if (result.matched) {
      const alarmConfig = previewRule.alarmConfig || {
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
      };

      console.log("Rule matched! Triggering alarms with config:", alarmConfig);

      if (alarmConfig.audioEnabled) {
        console.log("Playing audio alarm");
        playAlertSound(alarmConfig.audioFrequency, alarmConfig.audioDuration, alarmConfig.audioVolume);
      }
      
      if (alarmConfig.visualEnabled) {
        console.log("Triggering visual alarm");
        triggerVisualAlert(alarmConfig.visualDuration);
      }
      
      // Speak the first action
      if (alarmConfig.voiceEnabled && result.actions.length > 0) {
        console.log("Speaking alert");
        speakAlert(`Alert! ${result.actions[0]}`, alarmConfig.voiceRate, alarmConfig.voicePitch);
      }
      
      // Browser notification
      if (alarmConfig.notificationEnabled && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          console.log("Showing notification");
          new Notification('Rule Matched!', {
            body: result.actions.join(', '),
            icon: '/favicon.ico'
          });
        } else if (Notification.permission !== 'denied') {
          console.log("Requesting notification permission");
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Rule Matched!', {
                body: result.actions.join(', '),
                icon: '/favicon.ico'
              });
            }
          });
        }
      }
    } else {
      console.log("Rule did not match, no alarms triggered");
    }
  };

  const toggleAutoMode = async () => {
    if (!autoMode) {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
    setAutoMode(!autoMode);
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  // Auto-monitoring effect
  useEffect(() => {
    if (!isMonitoring || !previewRule || !autoMode) return;

    const interval = setInterval(async () => {
      const metrics = await getSystemMetrics();
      setSystemMetrics(metrics);
      
      // Auto-evaluate
      const result = evaluateRule(previewRule, metrics);
      setPreviewResult(result);

      // Trigger alerts if matched
      if (result.matched) {
        const alarmConfig = previewRule.alarmConfig || {
          audioEnabled: true,
          audioFrequency: 1000,
          audioDuration: 200,
          audioVolume: 0.3,
          voiceEnabled: true,
          voiceRate: 1.0,
          voicePitch: 1.0,
          visualEnabled: true,
          visualDuration: 1700,
          notificationEnabled: true,
        };

        if (alarmConfig.audioEnabled) {
          playAlertSound(alarmConfig.audioFrequency, alarmConfig.audioDuration, alarmConfig.audioVolume);
        }
        
        if (alarmConfig.visualEnabled) {
          triggerVisualAlert(alarmConfig.visualDuration);
        }
        
        if (alarmConfig.voiceEnabled && result.actions.length > 0) {
          speakAlert(`Alert! ${result.actions[0]}`, alarmConfig.voiceRate, alarmConfig.voicePitch);
        }

        if (alarmConfig.notificationEnabled && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Rule Matched!', {
            body: result.actions.join(', '),
            icon: '/favicon.ico'
          });
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [isMonitoring, previewRule, autoMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-8">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <Header />
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading your rules...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Full-Screen Alert Overlay */}
      {alertActive && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-red-500/30 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-600 text-white px-8 py-6 rounded-lg shadow-2xl animate-bounce">
              <div className="text-6xl mb-4 text-center">🚨</div>
              <div className="text-2xl font-bold text-center">ALERT!</div>
              <div className="text-lg text-center mt-2">Rule Condition Met</div>
            </div>
          </div>
          {/* Flashing border effect */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 animate-pulse" />
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 animate-pulse" />
          <div className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-b from-red-500 via-yellow-500 to-red-500 animate-pulse" />
          <div className="absolute top-0 bottom-0 right-0 w-4 bg-gradient-to-b from-red-500 via-yellow-500 to-red-500 animate-pulse" />
        </div>
      )}
      
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <Header />
        </div>

        <header className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">Saved Rules</h1>
          <p className="text-xl text-muted-foreground">
            Manage and export your created decision rules
          </p>
        </header>

        {/* Quick Start Guide for Auto-Monitoring */}
        <Card className="mb-8 p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-blue-200 animate-scale-in">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 text-white p-3 rounded-lg">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                🚨 New: Automatic System Monitoring!
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Create rules that automatically monitor your PC's system metrics (memory, CPU, battery, etc.) 
                and trigger visual + audio alarms when conditions are met!
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline" className="bg-white">
                  <Activity className="w-3 h-3 mr-1" />
                  Live Metrics
                </Badge>
                <Badge variant="outline" className="bg-white">
                  🔊 Voice Alerts
                </Badge>
                <Badge variant="outline" className="bg-white">
                  🚨 Visual Warnings
                </Badge>
                <Badge variant="outline" className="bg-white">
                  📬 Notifications
                </Badge>
              </div>
              <div className="text-sm space-y-1">
                <p className="font-medium">Quick Start:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Create a rule in the Editor using variables like <code className="bg-white px-1 rounded">memoryPercent</code>, <code className="bg-white px-1 rounded">batteryLevel</code>, etc.</li>
                  <li>Click the 👁️ Preview button on your saved rule</li>
                  <li>Enable "Auto Mode" and click "Start Monitoring"</li>
                  <li>Get real-time alerts when conditions are met!</li>
                </ol>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white hover:bg-blue-50"
                  onClick={() => {
                    const guide = window.open('/AUTOMATIC_MONITORING_GUIDE.md', '_blank');
                    if (!guide) {
                      toast.info("Check AUTOMATIC_MONITORING_GUIDE.md in the project root for detailed instructions");
                    }
                  }}
                >
                  📖 View Full Guide
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={createExampleMonitoringRule}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Memory Alert
                </Button>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={createMarksExampleRule}
                >
                  📚 Marks Rule
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={createWorkingExampleRule}
                >
                  ✅ Working Example
                </Button>
                <Button
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={createSmartCookerRule}
                >
                  🍳 Smart Cooker
                </Button>
                <Button
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  onClick={createBathroomRule}
                >
                  🚿 Bathroom
                </Button>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={createMedicationRule}
                >
                  💊 Medication
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {rules.length === 0 ? (
          <Card className="p-12 text-center animate-scale-in">
            <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">No saved rules yet</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate("/editor")} variant="outline">
                Create Your First Rule
              </Button>
              <Button onClick={createExampleMonitoringRule} className="bg-blue-600 hover:bg-blue-700">
                <Zap className="w-4 h-4 mr-2" />
                Memory Alert
              </Button>
              <Button onClick={createMarksExampleRule} className="bg-purple-600 hover:bg-purple-700">
                📚 Marks Rule
              </Button>
              <Button onClick={createWorkingExampleRule} className="bg-green-600 hover:bg-green-700">
                ✅ Working Example
              </Button>
              <Button onClick={createSmartCookerRule} className="bg-orange-600 hover:bg-orange-700">
                🍳 Smart Cooker
              </Button>
              <Button onClick={createBathroomRule} className="bg-cyan-600 hover:bg-cyan-700">
                🚿 Bathroom
              </Button>
              <Button onClick={createMedicationRule} className="bg-purple-600 hover:bg-purple-700">
                💊 Medication
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 animate-scale-in">
            {rules.map((rule) => (
              <Card key={rule.id} className="p-6 hover:shadow-elevated transition-all duration-300 bg-gradient-card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{rule.name}</h3>
                      {rule.isValid !== undefined && (
                        rule.isValid ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-red-500/10 text-red-600 border-red-500/20">
                            <XCircle className="w-3 h-3 mr-1" />
                            Invalid
                          </Badge>
                        )
                      )}
                    </div>
                    
                    {rule.naturalLanguage && (
                      <p className="text-sm text-muted-foreground mb-3 italic">
                        {rule.naturalLanguage}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <Badge variant="outline">
                        {rule.nodes.length} blocks
                      </Badge>
                      <span>Created: {formatDate(rule.createdAt)}</span>
                      {rule.updatedAt && (
                        <span>Updated: {formatDate(rule.updatedAt)}</span>
                      )}
                      {rule.lastTested && (
                        <span>Last tested: {formatDate(rule.lastTested)}</span>
                      )}
                    </div>

                    {/* Alarm Configuration Display */}
                    {rule.alarmConfig && (
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground">Alarms:</span>
                        {rule.alarmConfig.audioEnabled && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            🔊 Audio
                          </Badge>
                        )}
                        {rule.alarmConfig.voiceEnabled && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            🗣️ Voice
                          </Badge>
                        )}
                        {rule.alarmConfig.visualEnabled && (
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            🚨 Visual
                          </Badge>
                        )}
                        {rule.alarmConfig.notificationEnabled && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            📬 Notify
                          </Badge>
                        )}
                        {rule.alarmConfig.alarmType && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              rule.alarmConfig.alarmType === "critical" 
                                ? "bg-red-100 text-red-800 border-red-300" 
                                : rule.alarmConfig.alarmType === "warning"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                : "bg-blue-100 text-blue-800 border-blue-300"
                            }`}
                          >
                            {rule.alarmConfig.alarmType === "critical" ? "🔴" : rule.alarmConfig.alarmType === "warning" ? "🟡" : "🔵"} {rule.alarmConfig.alarmType}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(rule)}
                      title="Preview & Test rule"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/editor?ruleId=${rule.id}`)}
                      title="Edit rule"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(rule)}
                      title="Export rule"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewRule} onOpenChange={(open) => {
          if (!open) {
            setPreviewRule(null);
            setIsMonitoring(false);
          }
        }}>
          <DialogContent className={`max-w-3xl max-h-[80vh] overflow-y-auto transition-all duration-300 ${
            alertActive ? 'ring-4 ring-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)] bg-red-50' : ''
          }`}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className={`w-5 h-5 ${isMonitoring ? 'animate-pulse text-green-500' : ''}`} />
                Preview & Test Rule
              </DialogTitle>
              <DialogDescription>
                Test your rule with sample inputs or use automatic system monitoring
              </DialogDescription>
            </DialogHeader>

            {previewRule && (
              <div className="space-y-6">
                {/* Rule Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{previewRule.name}</h3>
                  {previewRule.naturalLanguage && (
                    <p className="text-sm text-muted-foreground italic">
                      {previewRule.naturalLanguage}
                    </p>
                  )}
                </div>

                {/* Auto Mode Toggle */}
                <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="auto-mode" className="text-base font-semibold flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        Automatic System Monitoring
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get real-time system metrics (CPU, Memory, Battery, etc.)
                      </p>
                    </div>
                    <Switch
                      id="auto-mode"
                      checked={autoMode}
                      onCheckedChange={toggleAutoMode}
                    />
                  </div>
                </Card>

                {/* System Metrics Display (Auto Mode) */}
                {autoMode && (
                  <Card className="p-4 bg-gradient-to-br from-slate-50 to-blue-50 border-blue-200">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
                          Live System Metrics
                        </h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const metrics = await getSystemMetrics();
                            setSystemMetrics(metrics);
                            toast.success("Metrics refreshed!");
                          }}
                          className="h-7"
                        >
                          <Activity className="w-3 h-3 mr-1" />
                          Refresh
                        </Button>
                      </div>
                      {Object.keys(systemMetrics).length === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Loading system metrics...</span>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(systemMetrics).map(([key, value]) => (
                              <div key={key} className="flex flex-col bg-white p-2 rounded border border-blue-100 hover:border-blue-300 transition-colors">
                                <span className="text-xs font-medium text-muted-foreground uppercase">{key}</span>
                                <Badge variant="outline" className="font-mono text-sm font-semibold text-blue-700 mt-1 w-fit">
                                  {typeof value === 'number' && !Number.isInteger(value) 
                                    ? value.toFixed(2) 
                                    : String(value)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-blue-700 bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="font-semibold mb-1 flex items-center gap-1">
                              💡 Tip: Use these variables in your rules
                            </p>
                            <p className="text-muted-foreground">
                              Available: memoryPercent, memoryUsedMB, batteryLevel, batteryCharging, hour, minute, dayOfWeek, cpuPercent, storagePercent, online, screenWidth, screenHeight, and more
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                )}

                {/* Manual Input Variables (Manual Mode) */}
                {!autoMode && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Test Inputs</h4>
                    {getInputVariables(previewRule).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        This rule has no condition variables to test
                      </p>
                    ) : (
                      <div className="grid gap-4">
                        {getInputVariables(previewRule).map((variable) => (
                          <div key={variable} className="space-y-2">
                            <Label htmlFor={variable}>{variable}</Label>
                            <Input
                              id={variable}
                              type="text"
                              placeholder={`Enter value for ${variable}`}
                              value={testInputs[variable] || ""}
                              onChange={(e) =>
                                setTestInputs({
                                  ...testInputs,
                                  [variable]: e.target.value,
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Control Buttons */}
                <div className="flex gap-2">
                  {autoMode ? (
                    <>
                      {!isMonitoring ? (
                        <Button
                          onClick={startMonitoring}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Continuous Monitoring
                        </Button>
                      ) : (
                        <Button
                          onClick={stopMonitoring}
                          variant="destructive"
                          className="flex-1"
                        >
                          <StopCircle className="w-4 h-4 mr-2" />
                          Stop Monitoring
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      onClick={handleRunTest}
                      disabled={getInputVariables(previewRule).length === 0}
                      className="flex-1"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Run Test
                    </Button>
                  )}
                </div>

                {/* Monitoring Status */}
                {isMonitoring && (
                  <Card className="p-3 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <Activity className="w-4 h-4 animate-pulse" />
                      <span className="text-sm font-medium">
                        Monitoring active - Checking every 2 seconds
                      </span>
                    </div>
                  </Card>
                )}

                {/* Debug Information */}
                {/* <Card className="p-3 bg-yellow-50 border-yellow-200">
                  <h5 className="text-sm font-medium text-yellow-900 mb-2">🔍 Debug Information:</h5>
                  <div className="space-y-1 text-xs">
                    <div><strong>Rule Variables:</strong> {getInputVariables(previewRule).join(', ') || 'None detected'}</div>
                    <div><strong>Test Inputs:</strong> {JSON.stringify(testInputs)}</div>
                    <div><strong>Auto Mode:</strong> {autoMode ? 'ON' : 'OFF'}</div>
                    {previewRule?.alarmConfig && (
                      <div><strong>Alarms:</strong> Audio: {previewRule.alarmConfig.audioEnabled ? 'ON' : 'OFF'}, Voice: {previewRule.alarmConfig.voiceEnabled ? 'ON' : 'OFF'}, Visual: {previewRule.alarmConfig.visualEnabled ? 'ON' : 'OFF'}, Notification: {previewRule.alarmConfig.notificationEnabled ? 'ON' : 'OFF'}</div>
                    )}
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">
                    💡 Check browser console (F12) for detailed logs
                  </p>
                </Card> */}

                {/* Results */}
                {previewResult && (
                  <div className={`space-y-4 p-4 border rounded-lg transition-all duration-300 ${
                    previewResult.matched 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-muted/50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">Test Results</h4>
                      <Badge
                        variant={previewResult.matched ? "default" : "secondary"}
                        className={
                          previewResult.matched
                            ? "bg-green-500/10 text-green-600 border-green-500/20 animate-pulse"
                            : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                        }
                      >
                        {previewResult.matched ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Rule Matched
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            No Match
                          </>
                        )}
                      </Badge>
                      {isMonitoring && previewResult.matched && (
                        <Badge variant="destructive" className="animate-pulse">
                          🔊 ALERT ACTIVE
                        </Badge>
                      )}
                    </div>

                    {/* Evaluation Path */}
                    {previewResult.evaluationPath.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Evaluation Path:</h5>
                        <div className="bg-background p-3 rounded border font-mono text-xs space-y-1">
                          {previewResult.evaluationPath.map((step, idx) => (
                            <div
                              key={idx}
                              className={
                                step.includes("✓")
                                  ? "text-green-600"
                                  : step.includes("✗")
                                  ? "text-red-600"
                                  : "text-foreground"
                              }
                            >
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions Triggered */}
                    {previewResult.actions.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Actions Triggered:</h5>
                        <div className="space-y-2">
                          {previewResult.actions.map((action, idx) => (
                            <Card key={idx} className="p-3 bg-green-500/5 border-green-500/20">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm">{action}</span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {previewResult.actions.length === 0 && !previewResult.matched && (
                      <p className="text-sm text-muted-foreground">
                        No actions were triggered. Try adjusting your test inputs.
                      </p>
                    )}

                    {/* Pseudo Code */}
                    {previewRule && (
                      <div className="space-y-2 mt-4">
                        <h5 className="text-sm font-medium">Pseudo Code:</h5>
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                          <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                            <code>{generatePseudoCode(previewRule)}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Saved;
