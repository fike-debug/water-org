import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Eye,
  Users,
  Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileParsingService, ParsedTransaction } from "@/services/fileParsingService";
import { TransactionService } from "@/services/transactionService";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  code_name: string;
  agent_id: string;
  real_name: string;
}

interface ReceiptUploadProps {
  onUploadComplete?: () => void;
  preselectedAgentId?: string;
}

export function ReceiptUpload({ onUploadComplete, preselectedAgentId }: ReceiptUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{
    headers: string[];
    rows: string[][];
    transactions: ParsedTransaction[];
  } | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(preselectedAgentId || "");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agents for selection
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Upload and process file mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, agentId }: { file: File; agentId: string }) => {
      setIsProcessing(true);
      setError("");

      try {
        // Parse the file
        const parsed = await FileParsingService.parseFile(file);
        
        // Validate transactions
        const validation = FileParsingService.validateTransactions(parsed.transactions);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Upload file to storage
        const fileUrl = await TransactionService.uploadFile(file);
        
        // Create receipt record
        const receipt = await TransactionService.createReceipt(
          file.name,
          fileUrl,
          file.type,
          file.size
        );

        // Create transactions
        await TransactionService.createTransactions(
          receipt.id,
          agentId,
          parsed.transactions
        );

        return { receipt, transactionCount: parsed.transactions.length };
      } catch (error) {
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Successfully processed ${data.transactionCount} transactions from ${uploadedFile?.name}`,
      });
      
      // Reset form
      setUploadedFile(null);
      setParsedData(null);
      setSelectedAgentId("");
      setError("");
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['agents-summary'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      
      onUploadComplete?.();
    },
    onError: (error: any) => {
      setError(error.message || "Failed to upload and process file");
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload and process file",
        variant: "destructive",
      });
    }
  });

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError("");
    setUploadedFile(file);

    try {
      // Parse the file to preview
      const parsed = await FileParsingService.parseFile(file);
      setParsedData(parsed);
      setIsPreviewOpen(true);
    } catch (error: any) {
      setError(error.message || "Failed to parse file");
      setUploadedFile(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = () => {
    if (!uploadedFile || !selectedAgentId || !parsedData) return;
    
    uploadMutation.mutate({
      file: uploadedFile,
      agentId: selectedAgentId
    });
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setParsedData(null);
    setSelectedAgentId("");
    setError("");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📁';
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Receipt</h1>
        <p className="text-muted-foreground">Upload Word, PDF, or Excel files to extract transaction data</p>
      </div>

      {/* Upload Area */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardContent className="p-6">
          {!uploadedFile ? (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-smooth
                ${isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-secondary/20'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
              </h3>
              <p className="text-muted-foreground mb-4">
                or click to select a file
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary">PDF</Badge>
                <Badge variant="secondary">Word (.docx)</Badge>
                <Badge variant="secondary">Excel (.xls, .xlsx)</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Maximum file size: 10MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(uploadedFile.type)}</span>
                  <div>
                    <h4 className="font-semibold text-foreground">{uploadedFile.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(uploadedFile.size)} • {uploadedFile.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPreviewOpen(true)}
                    className="border-border hover:bg-secondary"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {parsedData && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Successfully parsed {parsedData.transactions.length} transactions from the file.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Select Agent
                    </label>
                    <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Choose an agent for these transactions" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>{agent.real_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {agent.code_name}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleUpload}
                    disabled={!selectedAgentId || isProcessing}
                    className="w-full bg-primary text-primary-foreground shadow-glow"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload & Process Transactions
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Transaction Preview</DialogTitle>
          </DialogHeader>
          
          {parsedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="secondary">
                  {parsedData.transactions.length} transactions found
                </Badge>
                <Badge variant="outline">
                  {uploadedFile?.name}
                </Badge>
              </div>

              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.transactions.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell>{transaction.bookDate}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {transaction.reference}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.debit > 0 ? `${transaction.debit.toLocaleString()} ETB` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.credit > 0 ? `${transaction.credit.toLocaleString()} ETB` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.closingBalance ? `${transaction.closingBalance.toLocaleString()} ETB` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
