import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Square, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface ActionData {
  label?: string;
  actionType?: string;
  target?: string;
  parameters?: string;
  onChange?: (newData: any) => void;
}

export const ActionNode = memo(({ data, id }: NodeProps) => {
  const nodeData = data as ActionData;
  const [open, setOpen] = useState(false);
  const [actionType, setActionType] = useState(nodeData.actionType || "");
  const [target, setTarget] = useState(nodeData.target || "");
   const [parameters, setParameters] = useState(nodeData.parameters || "");

  const handleSave = () => {
    if (nodeData.onChange) {
      const label = actionType && target 
        ? `${actionType}: ${target}` 
        : actionType || "Action";
      nodeData.onChange({ actionType, target, parameters, label });
    }
    setOpen(false);
  };

  const getDisplayText = () => {
    if (nodeData.actionType) {
      const text = nodeData.target 
        ? `${nodeData.actionType}: ${nodeData.target}`
        : nodeData.actionType;
      return text;
    }
    return nodeData.label || "Click to define";
  };

  const getSubtext = () => {
    if (nodeData.parameters && nodeData.parameters.length > 0) {
      return nodeData.parameters.length > 30 
        ? nodeData.parameters.substring(0, 30) + "..."
        : nodeData.parameters;
    }
    return null;
  };

  return (
    <>
      <div className="px-4 py-3 shadow-lg rounded-xl border-2 border-green-500 bg-card min-w-[200px] hover:shadow-xl transition-shadow">
        <Handle type="target" position={Position.Top} className="w-3 h-3" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <div className="cursor-pointer group">
              <div className="flex items-center gap-2 mb-1">
                <Square className="w-4 h-4 text-green-500" />
                <div className="font-semibold text-xs text-muted-foreground uppercase">Action</div>
                <Edit2 className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="font-medium text-sm mt-1">{getDisplayText()}</div>
              {getSubtext() && (
                <div className="text-xs text-muted-foreground mt-1">{getSubtext()}</div>
              )}
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Define Action</DialogTitle>
              <DialogDescription>
                Set what should happen when conditions are met
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor={`action-type-${id}`}>Action Type</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger id={`action-type-${id}`}>
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send_notification">Send Notification</SelectItem>
                    <SelectItem value="turn_on">Turn On Device</SelectItem>
                    <SelectItem value="turn_off">Turn Off Device</SelectItem>
                    <SelectItem value="set_value">Set Value</SelectItem>
                    <SelectItem value="trigger_alarm">Trigger Alarm</SelectItem>
                    <SelectItem value="send_email">Send Email</SelectItem>
                    <SelectItem value="log_data">Log Data</SelectItem>
                    <SelectItem value="call_api">Call API</SelectItem>
                    <SelectItem value="custom">Custom Action</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`target-${id}`}>Target / Device</Label>
                <Input
                  id={`target-${id}`}
                  placeholder="e.g., light_1, user@email.com, sensor_main"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`parameters-${id}`}>Parameters (optional)</Label>
                <Textarea
                  id={`parameters-${id}`}
                  placeholder="e.g., brightness: 75, duration: 30s, message: Alert!"
                  value={parameters}
                  onChange={(e) => setParameters(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                Save Action
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      </div>
    </>
  );
});

ActionNode.displayName = "ActionNode";
