import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { GitBranch, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface OperatorData {
  label?: string;
  operatorType?: string;
  onChange?: (newData: any) => void;
}

export const OperatorNode = memo(({ data, id }: NodeProps) => {
  const nodeData = data as OperatorData;
  const [open, setOpen] = useState(false);
  const [operatorType, setOperatorType] = useState(nodeData.operatorType || "AND");

  const handleSave = () => {
    if (nodeData.onChange) {
      nodeData.onChange({ operatorType, label: operatorType });
    }
    setOpen(false);
  };

  const getDisplayText = () => {
    return nodeData.operatorType || nodeData.label || "AND";
  };

  const getOperatorColor = () => {
    const colors = {
      AND: "border-blue-500 text-blue-600",
      OR: "border-purple-500 text-purple-600",
      NOT: "border-orange-500 text-orange-600",
      XOR: "border-pink-500 text-pink-600",
    };
    return colors[nodeData.operatorType as keyof typeof colors] || "border-accent text-accent";
  };

  const getOperatorIcon = () => {
    const operator = nodeData.operatorType || "AND";
    return operator;
  };

  return (
    <>
      <div className={`px-4 py-3 shadow-lg rounded-xl border-2 bg-card min-w-[140px] hover:shadow-xl transition-all ${getOperatorColor()}`}>
        <Handle type="target" position={Position.Top} className="w-3 h-3" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <div className="cursor-pointer group">
              <div className="flex items-center gap-2 mb-1">
                <GitBranch className="w-4 h-4" />
                <div className="font-semibold text-xs text-muted-foreground uppercase">Logic</div>
                <Edit2 className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="font-bold text-lg text-center mt-1">{getOperatorIcon()}</div>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Define Logic Operator</DialogTitle>
              <DialogDescription>
                Choose how conditions should be combined
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor={`operator-${id}`}>Operator Type</Label>
                <Select value={operatorType} onValueChange={setOperatorType}>
                  <SelectTrigger id={`operator-${id}`}>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">
                      <div className="flex flex-col">
                        <span className="font-semibold">AND</span>
                        <span className="text-xs text-muted-foreground">All conditions must be true</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="OR">
                      <div className="flex flex-col">
                        <span className="font-semibold">OR</span>
                        <span className="text-xs text-muted-foreground">At least one condition must be true</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="NOT">
                      <div className="flex flex-col">
                        <span className="font-semibold">NOT</span>
                        <span className="text-xs text-muted-foreground">Inverts the condition result</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="XOR">
                      <div className="flex flex-col">
                        <span className="font-semibold">XOR</span>
                        <span className="text-xs text-muted-foreground">Exactly one condition must be true</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">How it works:</h4>
                <p className="text-xs text-muted-foreground">
                  {operatorType === "AND" && "All incoming conditions must be satisfied for the output to trigger."}
                  {operatorType === "OR" && "Any one of the incoming conditions being satisfied will trigger the output."}
                  {operatorType === "NOT" && "Inverts the result - if condition is true, output is false and vice versa."}
                  {operatorType === "XOR" && "Only one condition should be true. If multiple are true, output is false."}
                </p>
              </div>
              <Button onClick={handleSave} className="w-full">
                Save Operator
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      </div>
    </>
  );
});

OperatorNode.displayName = "OperatorNode";
