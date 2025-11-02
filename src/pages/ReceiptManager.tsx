import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppNavigation } from "@/components/AppNavigation";
import { Dashboard } from "@/components/Dashboard";
import { AgentManager } from "@/components/AgentManager";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { AgentDetails } from "@/components/AgentDetails";
import { Analytics } from "@/components/Analytics";
import { SearchComponent } from "@/components/Search";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ReceiptManager = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
    };

    checkAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setActiveTab("agent-details");
  };

  const handleBackFromAgentDetails = () => {
    setSelectedAgentId(null);
    setActiveTab("agents");
  };

  const handleCreateAgent = () => {
    setActiveTab("agents");
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard 
            onViewAgent={handleViewAgent}
            onCreateAgent={handleCreateAgent}
          />
        );
      case "agents":
        return <AgentManager onViewAgent={handleViewAgent} />;
      case "agent-details":
        return selectedAgentId ? (
          <AgentDetails 
            agentId={selectedAgentId}
            onBack={handleBackFromAgentDetails}
          />
        ) : null;
      case "upload":
        return <ReceiptUpload />;
      case "analytics":
        return <Analytics />;
      case "search":
        return <SearchComponent />;
      default:
        return null;
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Navigation */}
      <div className="w-80 p-6 border-r border-border">
        <AppNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default ReceiptManager;