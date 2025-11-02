import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Receipt, 
  DollarSign,
  Eye,
  Plus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Agent {
  id: string;
  code_name: string;
  agent_id: string;
  real_name: string;
  total_credit: number;
  total_debit: number;
  transaction_count: number;
}

interface DashboardProps {
  onViewAgent: (agentId: string) => void;
  onCreateAgent: () => void;
}

export function Dashboard({ onViewAgent, onCreateAgent }: DashboardProps) {  
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents-summary'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      // Get agents with transaction summaries
      const { data, error } = await supabase
        .from('agents')
        .select(`
          *,
          transactions(credit, debit)
        `)
        .eq('user_id', user.user.id);

      if (error) throw error;

      return data.map(agent => ({
        ...agent,
        total_credit: agent.transactions.reduce((sum: number, t: any) => sum + (t.credit || 0), 0),
        total_debit: agent.transactions.reduce((sum: number, t: any) => sum + (t.debit || 0), 0),
        transaction_count: agent.transactions.length
      }));
    }
  });

  const totalCredit = agents.reduce((sum, agent) => sum + agent.total_credit, 0);
  const totalDebit = agents.reduce((sum, agent) => sum + agent.total_debit, 0);
  const totalTransactions = agents.reduce((sum, agent) => sum + agent.transaction_count, 0);
  const netBalance = totalCredit - totalDebit;

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Financial overview and agent performance</p>
        </div>
        <Button onClick={onCreateAgent} className="bg-primary text-primary-foreground shadow-glow">
          <Plus className="w-4 h-4 mr-2" />
          Add Agent
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Credit</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalCredit.toLocaleString()} ETB</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Debit</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalDebit.toLocaleString()} ETB</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {netBalance.toLocaleString()} ETB
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{totalTransactions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Rankings */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5" />
            Agent Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Agents Yet</h3>
              <p className="text-muted-foreground mb-4">Create your first agent to start managing receipts</p>
              <Button onClick={onCreateAgent} className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {agents
                .sort((a, b) => b.total_credit - a.total_credit)
                .map((agent, index) => (
                  <div key={agent.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{agent.real_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {agent.code_name} • {agent.agent_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-success font-medium">
                          +{agent.total_credit.toLocaleString()} ETB
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {agent.transaction_count} transactions
                        </p>
                      </div>
                      <Badge variant="secondary">{index === 0 ? "Top" : `#${index + 1}`}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewAgent(agent.id)}
                        className="border-border hover:bg-secondary"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}