import { TransactionService, Transaction } from './transactionService';

export interface AnalyticsData {
  totalCredit: number;
  totalDebit: number;
  netBalance: number;
  totalTransactions: number;
  agentCount: number;
  averageTransactionValue: number;
  topAgents: Array<{
    id: string;
    name: string;
    codeName: string;
    totalCredit: number;
    totalDebit: number;
    netBalance: number;
    transactionCount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    credit: number;
    debit: number;
    netBalance: number;
    transactionCount: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  }>;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

export class AnalyticsService {
  /**
   * Get comprehensive analytics data
   */
  static async getAnalyticsData(): Promise<AnalyticsData> {
    try {
      const agentsWithSummaries = await TransactionService.getAgentsWithSummaries();
      const allTransactions = await TransactionService.getAllTransactions();

      // Calculate totals
      const totalCredit = agentsWithSummaries.reduce((sum, agent) => sum + agent.totalCredit, 0);
      const totalDebit = agentsWithSummaries.reduce((sum, agent) => sum + agent.totalDebit, 0);
      const netBalance = totalCredit - totalDebit;
      const totalTransactions = allTransactions.length;
      const agentCount = agentsWithSummaries.length;
      const averageTransactionValue = totalTransactions > 0 ? (totalCredit + totalDebit) / totalTransactions : 0;

      // Get top agents by credit
      const topAgents = agentsWithSummaries
        .sort((a, b) => b.totalCredit - a.totalCredit)
        .slice(0, 10)
        .map(agent => ({
          id: agent.id,
          name: agent.real_name,
          codeName: agent.code_name,
          totalCredit: agent.totalCredit,
          totalDebit: agent.totalDebit,
          netBalance: agent.netBalance,
          transactionCount: agent.transactionCount
        }));

      // Calculate monthly trends
      const monthlyTrends = this.calculateMonthlyTrends(allTransactions);

      // Calculate category breakdown (by agent)
      const categoryBreakdown = this.calculateCategoryBreakdown(agentsWithSummaries);

      return {
        totalCredit,
        totalDebit,
        netBalance,
        totalTransactions,
        agentCount,
        averageTransactionValue,
        topAgents,
        monthlyTrends,
        categoryBreakdown
      };
    } catch (error) {
      throw new Error(`Failed to get analytics data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate monthly trends from transactions
   */
  private static calculateMonthlyTrends(transactions: Transaction[]): Array<{
    month: string;
    credit: number;
    debit: number;
    netBalance: number;
    transactionCount: number;
  }> {
    const monthlyData: { [key: string]: {
      credit: number;
      debit: number;
      transactionCount: number;
    } } = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.book_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          credit: 0,
          debit: 0,
          transactionCount: 0
        };
      }

      monthlyData[monthKey].credit += transaction.credit || 0;
      monthlyData[monthKey].debit += transaction.debit || 0;
      monthlyData[monthKey].transactionCount += 1;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: this.formatMonth(month),
        credit: data.credit,
        debit: data.debit,
        netBalance: data.credit - data.debit,
        transactionCount: data.transactionCount
      }));
  }

  /**
   * Calculate category breakdown by agent
   */
  private static calculateCategoryBreakdown(agentsWithSummaries: Array<any>): Array<{
    category: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  }> {
    const totalAmount = agentsWithSummaries.reduce((sum, agent) => sum + agent.totalCredit + agent.totalDebit, 0);
    const totalTransactions = agentsWithSummaries.reduce((sum, agent) => sum + agent.transactionCount, 0);

    return agentsWithSummaries.map(agent => ({
      category: agent.real_name,
      amount: agent.totalCredit + agent.totalDebit,
      percentage: totalAmount > 0 ? ((agent.totalCredit + agent.totalDebit) / totalAmount) * 100 : 0,
      transactionCount: agent.transactionCount
    })).sort((a, b) => b.amount - a.amount);
  }

  /**
   * Format month string for display
   */
  private static formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  /**
   * Get data for credit vs debit bar chart
   */
  static async getCreditDebitChartData(): Promise<ChartData> {
    try {
      const agentsWithSummaries = await TransactionService.getAgentsWithSummaries();
      
      const labels = agentsWithSummaries.map(agent => agent.real_name);
      const creditData = agentsWithSummaries.map(agent => agent.totalCredit);
      const debitData = agentsWithSummaries.map(agent => agent.totalDebit);

      return {
        labels,
        datasets: [
          {
            label: 'Credit',
            data: creditData,
            backgroundColor: 'hsl(142, 69%, 58%)',
            borderColor: 'hsl(142, 69%, 58%)',
            borderWidth: 1
          },
          {
            label: 'Debit',
            data: debitData,
            backgroundColor: 'hsl(0, 62%, 50%)',
            borderColor: 'hsl(0, 62%, 50%)',
            borderWidth: 1
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get credit/debit chart data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get data for agent performance pie chart
   */
  static async getAgentPerformanceChartData(): Promise<ChartData> {
    try {
      const agentsWithSummaries = await TransactionService.getAgentsWithSummaries();
      
      const labels = agentsWithSummaries.map(agent => agent.real_name);
      const data = agentsWithSummaries.map(agent => agent.totalCredit);
      
      // Generate colors for each agent
      const colors = this.generateColors(agentsWithSummaries.length);

      return {
        labels,
        datasets: [
          {
            label: 'Total Credit',
            data,
            backgroundColor: colors,
            borderColor: colors.map(color => color.replace('0.8', '1')),
            borderWidth: 2
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get agent performance chart data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get data for monthly trends line chart
   */
  static async getMonthlyTrendsChartData(): Promise<ChartData> {
    try {
      const allTransactions = await TransactionService.getAllTransactions();
      const monthlyTrends = this.calculateMonthlyTrends(allTransactions);
      
      const labels = monthlyTrends.map(trend => trend.month);
      const creditData = monthlyTrends.map(trend => trend.credit);
      const debitData = monthlyTrends.map(trend => trend.debit);
      const netBalanceData = monthlyTrends.map(trend => trend.netBalance);

      return {
        labels,
        datasets: [
          {
            label: 'Credit',
            data: creditData,
            borderColor: 'hsl(142, 69%, 58%)',
            backgroundColor: 'hsla(142, 69%, 58%, 0.1)',
            borderWidth: 2,
            fill: false
          },
          {
            label: 'Debit',
            data: debitData,
            borderColor: 'hsl(0, 62%, 50%)',
            backgroundColor: 'hsla(0, 62%, 50%, 0.1)',
            borderWidth: 2,
            fill: false
          },
          {
            label: 'Net Balance',
            data: netBalanceData,
            borderColor: 'hsl(217, 91%, 60%)',
            backgroundColor: 'hsla(217, 91%, 60%, 0.1)',
            borderWidth: 2,
            fill: false
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get monthly trends chart data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get data for transaction count chart
   */
  static async getTransactionCountChartData(): Promise<ChartData> {
    try {
      const agentsWithSummaries = await TransactionService.getAgentsWithSummaries();
      
      const labels = agentsWithSummaries.map(agent => agent.real_name);
      const data = agentsWithSummaries.map(agent => agent.transactionCount);

      return {
        labels,
        datasets: [
          {
            label: 'Transaction Count',
            data,
            backgroundColor: 'hsl(45, 93%, 58%)',
            borderColor: 'hsl(45, 93%, 58%)',
            borderWidth: 1
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get transaction count chart data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate colors for charts
   */
  private static generateColors(count: number): string[] {
    const baseColors = [
      'hsl(142, 69%, 58%)',   // Green
      'hsl(217, 91%, 60%)',   // Blue
      'hsl(45, 93%, 58%)',    // Yellow
      'hsl(0, 62%, 50%)',     // Red
      'hsl(280, 100%, 70%)',  // Purple
      'hsl(30, 100%, 60%)',   // Orange
      'hsl(180, 100%, 50%)',  // Cyan
      'hsl(300, 100%, 60%)',  // Magenta
    ];

    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      const baseColor = baseColors[i % baseColors.length];
      const alpha = 0.8;
      colors.push(baseColor.replace(')', `, ${alpha})`));
    }

    return colors;
  }

  /**
   * Get summary statistics for dashboard
   */
  static async getSummaryStats(): Promise<{
    totalCredit: number;
    totalDebit: number;
    netBalance: number;
    totalTransactions: number;
    agentCount: number;
    averageTransactionValue: number;
    topPerformingAgent: string;
    recentActivity: number;
  }> {
    try {
      const analyticsData = await this.getAnalyticsData();
      const allTransactions = await TransactionService.getAllTransactions();
      
      // Get top performing agent
      const topPerformingAgent = analyticsData.topAgents[0]?.name || 'N/A';
      
      // Calculate recent activity (transactions in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentActivity = allTransactions.filter(
        transaction => new Date(transaction.book_date) >= thirtyDaysAgo
      ).length;

      return {
        totalCredit: analyticsData.totalCredit,
        totalDebit: analyticsData.totalDebit,
        netBalance: analyticsData.netBalance,
        totalTransactions: analyticsData.totalTransactions,
        agentCount: analyticsData.agentCount,
        averageTransactionValue: analyticsData.averageTransactionValue,
        topPerformingAgent,
        recentActivity
      };
    } catch (error) {
      throw new Error(`Failed to get summary stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
