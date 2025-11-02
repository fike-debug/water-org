import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  Plus,
  TrendingUp,
  TrendingDown,
  Receipt,
  Calendar,
  DollarSign,
  FileText
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TransactionService } from "@/services/transactionService";
import { useToast } from "@/hooks/use-toast";
import { ReceiptUpload } from "./ReceiptUpload";

interface Agent {
  id: string;
  code_name: string;
  agent_id: string;
  real_name: string;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  book_date: string;
  value_date?: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  closing_balance?: number;
  created_at: string;
}

interface AgentDetailsProps {
  agentId: string;
  onBack: () => void;
}

export function AgentDetails({ agentId, onBack }: AgentDetailsProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    description: "",
    debit: "",
    credit: "",
    closing_balance: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agent details
  const { data: agent, isLoading: agentLoading } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .eq('user_id', user.user.id)
        .single();

      if (error) throw error;
      return data as Agent;
    }
  });

  // Fetch agent transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['agent-transactions', agentId],
    queryFn: () => TransactionService.getAgentTransactions(agentId)
  });

  // Fetch agent summary
  const { data: summary } = useQuery({
    queryKey: ['agent-summary', agentId],
    queryFn: () => TransactionService.getAgentSummary(agentId)
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: (transactionId: string) => TransactionService.deleteTransaction(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-transactions', agentId] });
      queryClient.invalidateQueries({ queryKey: ['agent-summary', agentId] });
      queryClient.invalidateQueries({ queryKey: ['agents-summary'] });
      toast({
        title: "Transaction Deleted",
        description: "Transaction has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete transaction.",
        variant: "destructive",
      });
    }
  });

  // Update transaction mutation
  const updateTransactionMutation = useMutation({
    mutationFn: ({ transactionId, updates }: { transactionId: string; updates: any }) =>
      TransactionService.updateTransaction(transactionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-transactions', agentId] });
      queryClient.invalidateQueries({ queryKey: ['agent-summary', agentId] });
      queryClient.invalidateQueries({ queryKey: ['agents-summary'] });
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
      toast({
        title: "Transaction Updated",
        description: "Transaction has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction.",
        variant: "destructive",
      });
    }
  });

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      description: transaction.description,
      debit: transaction.debit.toString(),
      credit: transaction.credit.toString(),
      closing_balance: transaction.closing_balance?.toString() || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTransaction = () => {
    if (!editingTransaction) return;

    const updates = {
      description: editForm.description,
      debit: parseFloat(editForm.debit) || 0,
      credit: parseFloat(editForm.credit) || 0,
      closing_balance: editForm.closing_balance ? parseFloat(editForm.closing_balance) : null
    };

    updateTransactionMutation.mutate({
      transactionId: editingTransaction.id,
      updates
    });
  };

  const handleUploadComplete = () => {
    setIsUploadDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['agent-transactions', agentId] });
    queryClient.invalidateQueries({ queryKey: ['agent-summary', agentId] });
    queryClient.invalidateQueries({ queryKey: ['agents-summary'] });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()} ETB`;
  };

  if (agentLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading agent details...</div>;
  }

  if (!agent) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">Agent Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested agent could not be found.</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Agents
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{agent.real_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{agent.code_name}</Badge>
              <Badge variant="outline">{agent.agent_id}</Badge>
            </div>
          </div>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground shadow-glow">
              <Upload className="w-4 h-4 mr-2" />
              Upload Receipt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Upload Receipt for {agent.real_name}</DialogTitle>
            </DialogHeader>
            <ReceiptUpload 
              onUploadComplete={handleUploadComplete}
              preselectedAgentId={agentId}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Credit</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatAmount(summary.totalCredit)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Debit</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatAmount(summary.totalDebit)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatAmount(summary.netBalance)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{summary.transactionCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="w-5 h-5" />
            Transactions ({transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload receipt files to start tracking transactions for this agent
              </p>
              <Button 
                onClick={() => setIsUploadDialogOpen(true)}
                className="bg-primary text-primary-foreground"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload First Receipt
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {formatDate(transaction.book_date)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {transaction.reference}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={transaction.description}>
                          {transaction.description}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.debit > 0 ? (
                          <span className="text-destructive font-medium">
                            {formatAmount(transaction.debit)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.credit > 0 ? (
                          <span className="text-success font-medium">
                            {formatAmount(transaction.credit)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.closing_balance ? (
                          <span className="font-medium">
                            {formatAmount(transaction.closing_balance)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTransaction(transaction)}
                            className="border-border hover:bg-secondary"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                            disabled={deleteTransactionMutation.isPending}
                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <Input
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="debit" className="text-foreground">Debit (ETB)</Label>
                <Input
                  id="debit"
                  type="number"
                  step="0.01"
                  value={editForm.debit}
                  onChange={(e) => setEditForm(prev => ({ ...prev, debit: e.target.value }))}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="credit" className="text-foreground">Credit (ETB)</Label>
                <Input
                  id="credit"
                  type="number"
                  step="0.01"
                  value={editForm.credit}
                  onChange={(e) => setEditForm(prev => ({ ...prev, credit: e.target.value }))}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="closing_balance" className="text-foreground">Closing Balance (ETB)</Label>
              <Input
                id="closing_balance"
                type="number"
                step="0.01"
                value={editForm.closing_balance}
                onChange={(e) => setEditForm(prev => ({ ...prev, closing_balance: e.target.value }))}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleUpdateTransaction}
                disabled={updateTransactionMutation.isPending}
                className="bg-primary text-primary-foreground flex-1"
              >
                {updateTransactionMutation.isPending ? "Updating..." : "Update Transaction"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="border-border hover:bg-secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
