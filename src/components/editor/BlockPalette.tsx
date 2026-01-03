import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Circle, Square, GitBranch, Clock } from "lucide-react";

interface BlockPaletteProps {
  onAddNode: (type: string) => void;
}

export const BlockPalette = ({ onAddNode }: BlockPaletteProps) => {
  const blocks = [
    {
      type: "condition",
      label: "Condition",
      icon: Circle,
      description: "IF / WHEN",
      color: "bg-primary/10 text-primary hover:bg-primary/20",
    },
    {
      type: "action",
      label: "Action",
      icon: Square,
      description: "THEN / DO",
      color: "bg-success/10 text-success hover:bg-success/20",
    },
    {
      type: "operator",
      label: "Operator",
      icon: GitBranch,
      description: "AND / OR / NOT",
      color: "bg-accent/10 text-accent hover:bg-accent/20",
    },
  ];

  return (
    <Card className="w-64 p-4 m-4 space-y-3 bg-gradient-card">
      <h3 className="font-semibold mb-4">Block Palette</h3>
      {blocks.map((block) => {
        const Icon = block.icon;
        return (
          <Button
            key={block.type}
            variant="outline"
            className={`w-full justify-start ${block.color} transition-colors`}
            onClick={() => onAddNode(block.type)}
          >
            <Icon className="w-4 h-4 mr-3" />
            <div className="text-left flex-1">
              <div className="font-medium">{block.label}</div>
              <div className="text-xs opacity-70">{block.description}</div>
            </div>
          </Button>
        );
      })}
      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Drag blocks onto the canvas and connect them to build your rule
        </p>
      </div>
    </Card>
  );
};
