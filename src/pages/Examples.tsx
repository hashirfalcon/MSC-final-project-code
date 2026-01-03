import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CookingPot, Droplet, Pill } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";

const Examples = () => {
  const navigate = useNavigate();

  const examples = [
    {
      id: "smart-cooker",
      title: "Smart Cooker Safety Rule",
      domain: "Smart Home",
      icon: CookingPot,
      description: "The cooker should not be switched on until food is added AND pot is placed. Maximum 1 hour operation.",
      rule: {
        name: "Smart Cooker Safety Rule",
        nodes: [
          {
            id: "condition-1",
            type: "condition",
            position: { x: 250, y: 100 },
            data: {
              label: "food_added == true",
              field: "food_added",
              operator: "equals",
              value: "true",
            },
          },
          {
            id: "condition-2",
            type: "condition",
            position: { x: 450, y: 100 },
            data: {
              label: "pot_placed == true",
              field: "pot_placed",
              operator: "equals",
              value: "true",
            },
          },
          {
            id: "operator-1",
            type: "operator",
            position: { x: 350, y: 200 },
            data: {
              label: "AND",
              operatorType: "AND",
            },
          },
          {
            id: "condition-3",
            type: "condition",
            position: { x: 350, y: 300 },
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
            position: { x: 350, y: 400 },
            data: {
              label: "Allow cooker to switch ON",
              action: "Cooker can be safely turned ON - Food added, pot placed, and within 1-hour limit!",
            },
          },
        ],
        edges: [
          {
            id: "edge-1",
            source: "condition-1",
            target: "operator-1",
          },
          {
            id: "edge-2",
            source: "condition-2",
            target: "operator-1",
          },
          {
            id: "edge-3",
            source: "operator-1",
            target: "condition-3",
          },
          {
            id: "edge-4",
            source: "condition-3",
            target: "action-1",
          },
        ],
        naturalLanguage: "IF food_added equals true AND pot_placed equals true AND cooker_time <= 60 THEN Allow cooker to switch ON",
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
      }
    },
    {
      id: "bathroom-routine",
      title: "Bathroom Routine Rule",
      domain: "Healthcare",
      icon: Droplet,
      description: "Once in bathroom, must wash, brush teeth, and comb hair within 30 minutes.",
      rule: {
        name: "Bathroom Routine Rule",
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
      }
    },
    {
      id: "medication-reminder",
      title: "Medication Safety Rule",
      domain: "Healthcare",
      icon: Pill,
      description: "Take medication within 1 hour after waking up, but only after eating food.",
      rule: {
        name: "Medication Safety Rule",
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
      }
    }
  ];

  const handleLoadExample = (example: typeof examples[0]) => {
    localStorage.setItem("currentRule", JSON.stringify(example.rule));
    toast.success(`Loaded: ${example.title}`);
    navigate("/editor");
  };

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case "Smart Home":
        return "bg-primary/10 text-primary";
      case "Healthcare":
        return "bg-success/10 text-success";
      case "Safety":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <Header />
        </div>

        <header className="mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">Example Scenarios</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Explore pre-built rules for various domains. Click "Load in Editor" to customize any example.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 animate-scale-in">
          {examples.map((example) => {
            const Icon = example.icon;
            return (
              <Card key={example.id} className="p-6 hover:shadow-elevated transition-all duration-300 bg-gradient-card">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold">{example.title}</h3>
                      <Badge className={getDomainColor(example.domain)}>{example.domain}</Badge>
                    </div>
                    <p className="text-muted-foreground mb-4">{example.description}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleLoadExample(example)}
                  className="w-full"
                >
                  Load in Editor
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Examples;
