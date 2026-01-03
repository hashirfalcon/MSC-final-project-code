import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Node, Edge } from "@xyflow/react";

interface NaturalLanguagePreviewProps {
  nodes: Node[];
  edges: Edge[];
}

export const NaturalLanguagePreview = ({ nodes, edges }: NaturalLanguagePreviewProps) => {
  const generateNaturalLanguage = () => {
    if (nodes.length === 0) {
      return "Your rule will appear here as you build it...";
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
          const actionName = data.actionType.replace(/_/g, " ");
          return `${actionName} ${data.target}`;
        }
        return data.label || "action";
      });
      text += actionTexts.join(", ");
    }

    return text || "Add blocks to start building your rule...";
  };

  return (
    <Card className="w-80 p-4 m-4 space-y-4 bg-gradient-card">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-secondary" />
        <h3 className="font-semibold">Natural Language</h3>
      </div>
      
      <div className="p-4 bg-muted/50 rounded-lg min-h-[120px]">
        <p className="text-sm leading-relaxed">{generateNaturalLanguage()}</p>
      </div>

      <div className="pt-4 border-t space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Conditions:</span>
          <span className="font-medium">{nodes.filter((n) => n.type === "condition").length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Actions:</span>
          <span className="font-medium">{nodes.filter((n) => n.type === "action").length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Connections:</span>
          <span className="font-medium">{edges.length}</span>
        </div>
      </div>
    </Card>
  );
};
