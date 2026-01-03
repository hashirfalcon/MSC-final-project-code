import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Circle, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ConditionData {
  label?: string;
  field?: string;
  operator?: string;
  value?: string;
  onChange?: (newData: any) => void;
}

export const ConditionNode = memo(({ data, id }: NodeProps) => {
  const nodeData = data as ConditionData;
  const [open, setOpen] = useState(false);
  const [field, setField] = useState(nodeData.field || "");
  const [operator, setOperator] = useState(nodeData.operator || "equals");
  const [value, setValue] = useState(nodeData.value || "");

  const handleSave = () => {
    if (nodeData.onChange) {
      const label = field && value ? `${field} ${operator} ${value}` : "Condition";
      nodeData.onChange({ field, operator, value, label });
    }
    setOpen(false);
  };

  const getDisplayText = () => {
    if (nodeData.field && nodeData.value) {
      const operatorSymbol = {
        equals: "=",
        notEquals: "≠",
        greaterThan: ">",
        lessThan: "<",
        greaterOrEqual: "≥",
        lessOrEqual: "≤",
        contains: "contains",
      }[nodeData.operator || "equals"];
      return `${nodeData.field} ${operatorSymbol} ${nodeData.value}`;
    }
    return nodeData.label || "Click to define";
  };

  return (
    <>
      <div className="px-4 py-3 shadow-lg rounded-xl border-2 border-primary bg-card min-w-[200px] hover:shadow-xl transition-shadow">
        <Handle type="target" position={Position.Top} className="w-3 h-3" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <div className="cursor-pointer group">
              <div className="flex items-center gap-2 mb-1">
                <Circle className="w-4 h-4 text-primary" />
                <div className="font-semibold text-xs text-muted-foreground uppercase">Condition</div>
                <Edit2 className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="font-medium text-sm mt-1">{getDisplayText()}</div>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Define Condition</DialogTitle>
              <DialogDescription>
                Set the condition that needs to be met
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor={`field-${id}`}>Field / Variable</Label>
                <Input
                  id={`field-${id}`}
                  placeholder="e.g., memoryPercent, batteryLevel, cpuPercent, hour"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  💡 For auto-monitoring, use: memoryPercent, batteryLevel, cpuPercent, hour, online, etc.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`operator-${id}`}>Operator</Label>
                <Select value={operator} onValueChange={setOperator}>
                  <SelectTrigger id={`operator-${id}`}>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals (=)</SelectItem>
                    <SelectItem value="notEquals">Not Equals (≠)</SelectItem>
                    <SelectItem value="greaterThan">Greater Than (&gt;)</SelectItem>
                    <SelectItem value="lessThan">Less Than (&lt;)</SelectItem>
                    <SelectItem value="greaterOrEqual">Greater or Equal (≥)</SelectItem>
                    <SelectItem value="lessOrEqual">Less or Equal (≤)</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`value-${id}`}>Value</Label>
                <Input
                  id={`value-${id}`}
                  placeholder="e.g., 25, true, 'high'"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                Save Condition
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      </div>
    </>
  );
});

ConditionNode.displayName = "ConditionNode";
