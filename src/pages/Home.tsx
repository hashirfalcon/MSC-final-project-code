import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, BookOpen, Save, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleProtectedAction = (path: string, actionName: string) => {
    if (!currentUser) {
      toast.error(`Please login or signup to ${actionName}`);
      return;
    }
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Top Navigation */}
        <Header />

        {/* Authentication Notice */}
        {!currentUser && (
          <div className="max-w-2xl mx-auto mb-8 animate-fade-in">
            <Card className="bg-primary/5 border-primary/20">
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Please <strong>login or signup</strong> to access all features
                </p>
                <div className="flex gap-2 justify-center">
                  <Link to="/login">
                    <Button size="sm" variant="outline">Login</Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Header */}
        <header className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Decision Support System</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Visual Rule Editor
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create, test, and visualize logical rules for activity-based scenarios.
            No coding required—just drag, drop, and connect.
          </p>
        </header>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 animate-scale-in">
          <Card className="p-6 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 bg-gradient-card">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
              Create New Rule
              {!currentUser && <Lock className="w-4 h-4 text-muted-foreground" />}
            </h3>
            <p className="text-muted-foreground mb-4">
              Start building a new decision rule from scratch with our visual editor
            </p>
            {currentUser ? (
              <Link to="/editor">
                <Button className="w-full" size="lg">
                  Get Started
                </Button>
              </Link>
            ) : (
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleProtectedAction('/editor', 'create rules')}
                variant="secondary"
              >
                <Lock className="w-4 h-4 mr-2" />
                Login to Start
              </Button>
            )}
          </Card>

          <Card className="p-6 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 bg-gradient-card">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
              Example Scenarios
              {!currentUser && <Lock className="w-4 h-4 text-muted-foreground" />}
            </h3>
            <p className="text-muted-foreground mb-4">
              Explore pre-built rules for healthcare, smart home, and personal assistance
            </p>
            {currentUser ? (
              <Link to="/examples">
                <Button variant="outline" className="w-full" size="lg">
                  View Examples
                </Button>
              </Link>
            ) : (
              <Button 
                variant="outline" 
                className="w-full" 
                size="lg"
                onClick={() => handleProtectedAction('/examples', 'view examples')}
              >
                <Lock className="w-4 h-4 mr-2" />
                Login to View
              </Button>
            )}
          </Card>

          <Card className="p-6 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 bg-gradient-card">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
              <Save className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
              Saved Rules
              {!currentUser && <Lock className="w-4 h-4 text-muted-foreground" />}
            </h3>
            <p className="text-muted-foreground mb-4">
              Access and manage your previously created decision rules
            </p>
            {currentUser ? (
              <Link to="/saved">
                <Button variant="outline" className="w-full" size="lg">
                  View Saved
                </Button>
              </Link>
            ) : (
              <Button 
                variant="outline" 
                className="w-full" 
                size="lg"
                onClick={() => handleProtectedAction('/saved', 'view saved rules')}
              >
                <Lock className="w-4 h-4 mr-2" />
                Login to View
              </Button>
            )}
          </Card>
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-2">Define Conditions</h3>
                <p className="text-muted-foreground">
                  Drag condition blocks (IF, WHEN) to specify when rules should trigger
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-2">Add Actions</h3>
                <p className="text-muted-foreground">
                  Connect action blocks (THEN, DO) to define what should happen
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-2">Validate & Test</h3>
                <p className="text-muted-foreground">
                  Check your rule logic and test with simulated data
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-2">Save & Export</h3>
                <p className="text-muted-foreground">
                  Save your rules and export in multiple formats (JSON, YAML, text)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
