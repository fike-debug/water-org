import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Receipt } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  code_name: string;
  agent_id: string;
  real_name: string;
  created_at: string;
  transaction_count?: number;
}

interface AgentManagerProps {
  onViewAgent: (agentId: string) => void;
}

export function AgentManager({ onViewAgent }: AgentManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({
    codeName: "",
    agentId: "",
    realName: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('agents')
        .select(`
          *,
          transactions(id)
        `)
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(agent => ({
        ...agent,
        transaction_count: agent.transactions.length
      }));
    }
  });

  const createAgentMutation = useMutation({
    mutationFn: async (agent: typeof newAgent) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('agents')
        .insert({
          user_id: user.user.id,
          code_name: agent.codeName,
          agent_id: agent.agentId,
          real_name: agent.realName
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agents-summary'] });
      setIsCreateDialogOpen(false);
      setNewAgent({ codeName: "", agentId: "", realName: "" });
      toast({
        title: "Agent Created",
        description: "New agent has been successfully created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create agent.",
        variant: "destructive",
      });
    }
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agents-summary'] });
      toast({
        title: "Agent Deleted",
        description: "Agent has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete agent.",
        variant: "destructive",
      });
    }
  });

  const handleCreateAgent = () => {
    if (!newAgent.codeName || !newAgent.agentId || !newAgent.realName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    createAgentMutation.mutate(newAgent);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading agents...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agent Management</h1>
          <p className="text-muted-foreground">Manage your financial agents and their information</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="codeName" className="text-foreground">Code Name</Label>
                <Input
                  id="codeName"
                  value={newAgent.codeName}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, codeName: e.target.value }))}
                  placeholder="Enter agent code name"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="agentId" className="text-foreground">Agent ID</Label>
                <Input
                  id="agentId"
                  value={newAgent.agentId}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, agentId: e.target.value }))}
                  placeholder="Enter unique agent ID"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="realName" className="text-foreground">Real Name</Label>
                <Input
                  id="realName"
                  value={newAgent.realName}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, realName: e.target.value }))}
                  placeholder="Enter agent's real name"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateAgent}
                  disabled={createAgentMutation.isPending}
                  className="bg-primary text-primary-foreground flex-1"
                >
                  {createAgentMutation.isPending ? "Creating..." : "Create Agent"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="border-border hover:bg-secondary"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="bg-gradient-card border-border shadow-card hover:shadow-elevated transition-smooth">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-foreground">
                <div>
                  <h3 className="text-lg font-semibold">{agent.real_name}</h3>
                  <p className="text-sm text-muted-foreground font-normal">{agent.code_name}</p>
                </div>
                <Badge variant="secondary">{agent.agent_id}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Receipt className="w-4 h-4" />
                  <span className="text-sm">{agent.transaction_count || 0} transactions</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewAgent(agent.id)}
                    className="flex-1 border-border hover:bg-secondary"
                  >
                    <Receipt className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteAgentMutation.mutate(agent.id)}
                    disabled={deleteAgentMutation.isPending}
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <Card className="bg-gradient-card border-border shadow-card">
          <CardContent className="text-center py-12">
            <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Agents Created</h3>
            <p className="text-muted-foreground mb-4">
              Create your first agent to start managing financial receipts
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}