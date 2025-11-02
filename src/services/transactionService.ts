import { supabase } from '@/integrations/supabase/client';
import { ParsedTransaction } from './fileParsingService';

export interface Transaction {
  id: string;
  user_id: string;
  agent_id: string;
  receipt_id: string;
  book_date: string;
  value_date?: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  closing_balance?: number;
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  id: string;
  user_id: string;
  filename: string;
  file_url: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  processed: boolean;
  created_at: string;
}

export interface Agent {
  id: string;
  user_id: string;
  code_name: string;
  agent_id: string;
  real_name: string;
  created_at: string;
  updated_at: string;
}

export class TransactionService {
  /**
   * Upload a file to Supabase storage
   */
  static async uploadFile(file: File): Promise<string> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (error) throw error;

      return data.path;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a receipt record in the database
   */
  static async createReceipt(
    filename: string,
    fileUrl: string,
    fileType: string,
    fileSize: number
  ): Promise<Receipt> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('receipts')
        .insert({
          user_id: user.user.id,
          filename,
          file_url: fileUrl,
          file_type: fileType,
          file_size: fileSize,
          processed: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create transactions from parsed data
   */
  static async createTransactions(
    receiptId: string,
    agentId: string,
    transactions: ParsedTransaction[]
  ): Promise<Transaction[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const transactionData = transactions.map(transaction => ({
        user_id: user.user.id,
        agent_id: agentId,
        receipt_id: receiptId,
        book_date: transaction.bookDate,
        value_date: transaction.valueDate,
        reference: transaction.reference,
        description: transaction.description,
        debit: transaction.debit,
        credit: transaction.credit,
        closing_balance: transaction.closingBalance
      }));

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select();

      if (error) throw error;

      // Mark receipt as processed
      await supabase
        .from('receipts')
        .update({ processed: true })
        .eq('id', receiptId);

      return data;
    } catch (error) {
      throw new Error(`Failed to create transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transactions for a specific agent
   */
  static async getAgentTransactions(agentId: string): Promise<Transaction[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('agent_id', agentId)
        .order('book_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all transactions for the user
   */
  static async getAllTransactions(): Promise<Transaction[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          agents!inner(code_name, agent_id, real_name)
        `)
        .eq('user_id', user.user.id)
        .order('book_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search transactions by reference or description
   */
  static async searchTransactions(query: string): Promise<Transaction[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          agents!inner(code_name, agent_id, real_name)
        `)
        .eq('user_id', user.user.id)
        .or(`reference.ilike.%${query}%,description.ilike.%${query}%`)
        .order('book_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to search transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transaction summary for an agent
   */
  static async getAgentSummary(agentId: string): Promise<{
    totalCredit: number;
    totalDebit: number;
    transactionCount: number;
    netBalance: number;
  }> {
    try {
      const transactions = await this.getAgentTransactions(agentId);
      
      const totalCredit = transactions.reduce((sum, t) => sum + (t.credit || 0), 0);
      const totalDebit = transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
      const transactionCount = transactions.length;
      const netBalance = totalCredit - totalDebit;

      return {
        totalCredit,
        totalDebit,
        transactionCount,
        netBalance
      };
    } catch (error) {
      throw new Error(`Failed to get agent summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all agents with their transaction summaries
   */
  static async getAgentsWithSummaries(): Promise<Array<Agent & {
    totalCredit: number;
    totalDebit: number;
    transactionCount: number;
    netBalance: number;
  }>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.user.id);

      if (agentsError) throw agentsError;

      const agentsWithSummaries = await Promise.all(
        (agents || []).map(async (agent) => {
          const summary = await this.getAgentSummary(agent.id);
          return { ...agent, ...summary };
        })
      );

      return agentsWithSummaries;
    } catch (error) {
      throw new Error(`Failed to get agents with summaries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(transactionId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user.user.id);

      if (error) throw error;
    } catch (error) {
      throw new Error(`Failed to delete transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a transaction
   */
  static async updateTransaction(
    transactionId: string,
    updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<Transaction> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', transactionId)
        .eq('user_id', user.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get receipts for a user
   */
  static async getUserReceipts(): Promise<Receipt[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', user.user.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch receipts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a receipt and its associated transactions
   */
  static async deleteReceipt(receiptId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Get the receipt to delete the file from storage
      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .select('file_url')
        .eq('id', receiptId)
        .eq('user_id', user.user.id)
        .single();

      if (receiptError) throw receiptError;

      // Delete the file from storage
      if (receipt?.file_url) {
        const { error: storageError } = await supabase.storage
          .from('receipts')
          .remove([receipt.file_url]);

        if (storageError) {
          console.warn('Failed to delete file from storage:', storageError);
        }
      }

      // Delete the receipt (transactions will be deleted due to CASCADE)
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', receiptId)
        .eq('user_id', user.user.id);

      if (error) throw error;
    } catch (error) {
      throw new Error(`Failed to delete receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
