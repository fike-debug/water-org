import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Receipt,
  Users,
  Activity,
  Download
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { AnalyticsService } from "@/services/analyticsService";

export function Analytics() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("all");

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics-data'],
    queryFn: () => AnalyticsService.getAnalyticsData()
  });

  // Fetch chart data
  const { data: creditDebitData } = useQuery({
    queryKey: ['credit-debit-chart'],
    queryFn: () => AnalyticsService.getCreditDebitChartData()
  });

  const { data: agentPerformanceData } = useQuery({
    queryKey: ['agent-performance-chart'],
    queryFn: () => AnalyticsService.getAgentPerformanceChartData()
  });

  const { data: monthlyTrendsData } = useQuery({
    queryKey: ['monthly-trends-chart'],
    queryFn: () => AnalyticsService.getMonthlyTrendsChartData()
  });

  const { data: transactionCountData } = useQuery({
    queryKey: ['transaction-count-chart'],
    queryFn: () => AnalyticsService.getTransactionCountChartData()
  });

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()} ETB`;
  };

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString()} ETB`;
  };

  const COLORS = [
    'hsl(142, 69%, 58%)',   // Green
    'hsl(217, 91%, 60%)',   // Blue
    'hsl(45, 93%, 58%)',    // Yellow
    'hsl(0, 62%, 50%)',     // Red
    'hsl(280, 100%, 70%)',  // Purple
    'hsl(30, 100%, 60%)',   // Orange
    'hsl(180, 100%, 50%)',  // Cyan
    'hsl(300, 100%, 60%)',  // Magenta
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>;
  }

  if (!analyticsData) {
    return <div className="p-8 text-center text-muted-foreground">No analytics data available</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Financial insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {analyticsData.agentCount} Agents
          </Badge>
          <Badge variant="outline" className="text-sm">
            {analyticsData.totalTransactions} Transactions
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Credit</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatAmount(analyticsData.totalCredit)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all agents
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Debit</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatAmount(analyticsData.totalDebit)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all agents
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analyticsData.netBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatAmount(analyticsData.netBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall position
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Transaction</CardTitle>
            <Receipt className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{formatAmount(analyticsData.averageTransactionValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-secondary">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Performance
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Trends
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Breakdown
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Credit vs Debit Chart */}
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <BarChart3 className="w-5 h-5" />
                  Credit vs Debit by Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                {creditDebitData ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={creditDebitData.datasets[0].data.map((value, index) => ({
                      agent: creditDebitData.labels[index],
                      credit: value,
                      debit: creditDebitData.datasets[1].data[index]
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="agent" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={formatCurrency}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                        formatter={(value: number) => [formatCurrency(value), '']}
                      />
                      <Legend />
                      <Bar dataKey="credit" fill="hsl(142, 69%, 58%)" name="Credit" />
                      <Bar dataKey="debit" fill="hsl(0, 62%, 50%)" name="Debit" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction Count Chart */}
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Activity className="w-5 h-5" />
                  Transaction Count by Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactionCountData ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={transactionCountData.datasets[0].data.map((value, index) => ({
                      agent: transactionCountData.labels[index],
                      count: value
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="agent" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(45, 93%, 58%)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <PieChart className="w-5 h-5" />
                Agent Performance Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agentPerformanceData ? (
                <ResponsiveContainer width="100%" height={400}>
                  <RechartsPieChart>
                    <Pie
                      data={agentPerformanceData.datasets[0].data.map((value, index) => ({
                        name: agentPerformanceData.labels[index],
                        value: value
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {agentPerformanceData.datasets[0].data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Credit']}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TrendingUp className="w-5 h-5" />
                Monthly Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyTrendsData ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyTrendsData.datasets[0].data.map((value, index) => ({
                    month: monthlyTrendsData.labels[index],
                    credit: value,
                    debit: monthlyTrendsData.datasets[1].data[index],
                    netBalance: monthlyTrendsData.datasets[2].data[index]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="credit" 
                      stroke="hsl(142, 69%, 58%)" 
                      strokeWidth={2}
                      name="Credit"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="debit" 
                      stroke="hsl(0, 62%, 50%)" 
                      strokeWidth={2}
                      name="Debit"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="netBalance" 
                      stroke="hsl(217, 91%, 60%)" 
                      strokeWidth={2}
                      name="Net Balance"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Agents */}
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Users className="w-5 h-5" />
                  Top Performing Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topAgents.slice(0, 5).map((agent, index) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{agent.name}</h4>
                          <p className="text-sm text-muted-foreground">{agent.codeName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-success">
                          +{formatAmount(agent.totalCredit)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {agent.transactionCount} transactions
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <BarChart3 className="w-5 h-5" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.categoryBreakdown.slice(0, 5).map((category, index) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{category.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {category.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatAmount(category.amount)}</span>
                        <span>{category.transactionCount} transactions</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
