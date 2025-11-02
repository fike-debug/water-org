import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Receipt,
  Users,
  FileText,
  Loader2,
  X
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { TransactionService } from "@/services/transactionService";

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
  agents: {
    code_name: string;
    agent_id: string;
    real_name: string;
  };
}

export function SearchComponent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "reference" | "description" | "agent">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "year">("all");
  const [amountFilter, setAmountFilter] = useState<"all" | "credit" | "debit">("all");
  const [isSearching, setIsSearching] = useState(false);

  // Search transactions
  const { data: searchResults = [], isLoading, refetch } = useQuery({
    queryKey: ['search-transactions', searchQuery, searchType],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      return TransactionService.searchTransactions(searchQuery);
    },
    enabled: false // Only search when manually triggered
  });

  // Get all transactions for filtering
  const { data: allTransactions = [] } = useQuery({
    queryKey: ['all-transactions'],
    queryFn: () => TransactionService.getAllTransactions()
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      await refetch();
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchType("all");
    setDateFilter("all");
    setAmountFilter("all");
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

  const getDateFilteredTransactions = (transactions: Transaction[]) => {
    if (dateFilter === "all") return transactions;

    const now = new Date();
    const filterDate = new Date();

    switch (dateFilter) {
      case "today":
        filterDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "month":
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return transactions.filter(transaction => 
      new Date(transaction.book_date) >= filterDate
    );
  };

  const getAmountFilteredTransactions = (transactions: Transaction[]) => {
    if (amountFilter === "all") return transactions;

    return transactions.filter(transaction => {
      if (amountFilter === "credit") return transaction.credit > 0;
      if (amountFilter === "debit") return transaction.debit > 0;
      return true;
    });
  };

  const filteredResults = getAmountFilteredTransactions(
    getDateFilteredTransactions(searchResults)
  );

  const getSearchPlaceholder = () => {
    switch (searchType) {
      case "reference":
        return "Search by reference number...";
      case "description":
        return "Search by description...";
      case "agent":
        return "Search by agent name...";
      default:
        return "Search transactions...";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Search Transactions</h1>
        <p className="text-muted-foreground">Find transactions by reference, description, or agent</p>
      </div>

      {/* Search Controls */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Search className="w-5 h-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getSearchPlaceholder()}
                className="bg-background border-border text-foreground"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="bg-primary text-primary-foreground shadow-glow"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
            {searchQuery && (
              <Button 
                onClick={handleClearSearch}
                variant="outline"
                className="border-border hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Search Type</label>
              <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="reference">Reference Number</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                  <SelectItem value="agent">Agent Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Date Filter</label>
              <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Amount Type</label>
              <Select value={amountFilter} onValueChange={(value: any) => setAmountFilter(value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="credit">Credit Only</SelectItem>
                  <SelectItem value="debit">Debit Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-foreground">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Search Results
            </div>
            {searchQuery && (
              <Badge variant="secondary">
                {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!searchQuery ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Start Your Search</h3>
              <p className="text-muted-foreground">
                Enter a search term to find transactions by reference, description, or agent name
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Searching transactions...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Results Found</h3>
              <p className="text-muted-foreground">
                No transactions match your search criteria. Try adjusting your search terms or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {formatDate(transaction.book_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-foreground">
                              {transaction.agents.real_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.agents.code_name}
                            </div>
                          </div>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {searchQuery && filteredResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Credit</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatAmount(filteredResults.reduce((sum, t) => sum + (t.credit || 0), 0))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Debit</CardTitle>
              <DollarSign className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatAmount(filteredResults.reduce((sum, t) => sum + (t.debit || 0), 0))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
              <Receipt className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                filteredResults.reduce((sum, t) => sum + (t.credit || 0) - (t.debit || 0), 0) >= 0 
                  ? 'text-success' 
                  : 'text-destructive'
              }`}>
                {formatAmount(filteredResults.reduce((sum, t) => sum + (t.credit || 0) - (t.debit || 0), 0))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
