import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { kycApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { 
  Shield, 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Camera,
  CreditCard,
  Home,
  User,
  Wallet,
  ExternalLink
} from "lucide-react";

const KYC = () => {
  const [documents, setDocuments] = useState<{
    identity?: File;
    address?: File;
    selfie?: File;
  }>({});
  const [uploadMethod, setUploadMethod] = useState<'submit' | 'upload'>('upload');
  const { wallet } = useWallet();

  const queryClient = useQueryClient();

  const { data: kycStatus, isLoading } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => kycApi.status().then(res => res.data),
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => {
      if (wallet.isConnected && wallet.address) {
        return kycApi.submit({
          ...data,
          walletAddress: wallet.address
        });
      }
      return kycApi.submit(data);
    },
    onSuccess: () => {
      toast({
        title: "KYC Documents Submitted",
        description: "Your documents have been submitted for review and linked to your wallet.",
      });
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
      setDocuments({});
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Something went wrong",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: kycApi.upload,
    onSuccess: () => {
      toast({
        title: "KYC Documents Uploaded",
        description: "Your documents have been uploaded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
      setDocuments({});
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.response?.data?.error || "Something went wrong",
      });
    },
  });

  const handleFileChange = (type: 'identity' | 'address' | 'selfie', file: File | null) => {
    if (file) {
      setDocuments(prev => ({ ...prev, [type]: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet.isConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Required",
        description: "Please connect your wallet to submit KYC information.",
      });
      return;
    }
    
    const formData = new FormData();
    if (documents.identity) formData.append('documents', documents.identity);
    if (documents.address) formData.append('documents', documents.address);
    if (documents.selfie) formData.append('documents', documents.selfie);

    if (uploadMethod === 'submit') {
      submitMutation.mutate({ documents: [] });
    } else {
      uploadMutation.mutate(formData);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-warning/20 text-warning border-warning/20", icon: Clock, label: "Pending Review" },
      approved: { color: "bg-success/20 text-success border-success/20", icon: CheckCircle, label: "Verified" },
      rejected: { color: "bg-destructive/20 text-destructive border-destructive/20", icon: AlertCircle, label: "Rejected" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const completionSteps = [
    { id: 'identity', label: 'Identity Document', completed: !!documents.identity },
    { id: 'address', label: 'Proof of Address', completed: !!documents.address },
    { id: 'selfie', label: 'Identity Verification', completed: !!documents.selfie },
  ];

  const completionPercentage = (completionSteps.filter(step => step.completed).length / completionSteps.length) * 100;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted/50 rounded w-1/4"></div>
          <div className="h-64 bg-muted/50 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Identity Verification (KYC)
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Complete your identity verification to access all platform features and comply with regulatory requirements.
        </p>
      </div>

      {/* Current Status */}
      {kycStatus && (
        <Card className="gradient-card border-0 max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Verification Status</CardTitle>
              {getStatusBadge(kycStatus.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {kycStatus.status === 'approved' && (
              <Alert className="border-success/20 bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  Your identity has been successfully verified. You have full access to all platform features.
                </AlertDescription>
              </Alert>
            )}
            
            {kycStatus.status === 'rejected' && kycStatus.rejection_reason && (
              <Alert className="border-destructive/20 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  <strong>Rejection Reason:</strong> {kycStatus.rejection_reason}
                </AlertDescription>
              </Alert>
            )}

            {kycStatus.submitted_at && (
              <div className="text-sm text-muted-foreground">
                <p>Submitted: {new Date(kycStatus.submitted_at).toLocaleString()}</p>
                {kycStatus.reviewed_at && (
                  <p>Reviewed: {new Date(kycStatus.reviewed_at).toLocaleString()}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document Upload Form */}
      {(!kycStatus || kycStatus.status !== 'approved') && (
        <Card className="gradient-card border-0 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Document Upload</span>
            </CardTitle>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion Progress</span>
                <span>{Math.round(completionPercentage)}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Method Selection */}
              <div className="space-y-2">
                <Label>Upload Method</Label>
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant={uploadMethod === 'upload' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUploadMethod('upload')}
                  >
                    Standard Upload
                  </Button>
                  <Button
                    type="button"
                    variant={uploadMethod === 'submit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUploadMethod('submit')}
                  >
                    Submit for Review
                  </Button>
                </div>
              </div>

              {/* Identity Document */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-primary" />
                  <Label>Government-Issued ID</Label>
                  {documents.identity && <CheckCircle className="w-4 h-4 text-success" />}
                </div>
                <div className="border-2 border-dashed border-border/50 rounded-lg p-6">
                  <div className="text-center space-y-2">
                    <CreditCard className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Passport, Driver's License, or National ID
                    </p>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange('identity', e.target.files?.[0] || null)}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                </div>
              </div>

              {/* Proof of Address */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Home className="w-4 h-4 text-primary" />
                  <Label>Proof of Address</Label>
                  {documents.address && <CheckCircle className="w-4 h-4 text-success" />}
                </div>
                <div className="border-2 border-dashed border-border/50 rounded-lg p-6">
                  <div className="text-center space-y-2">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Utility bill, bank statement (issued within 3 months)
                    </p>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange('address', e.target.files?.[0] || null)}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                </div>
              </div>

              {/* Selfie Verification */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-primary" />
                  <Label>Identity Verification Photo</Label>
                  {documents.selfie && <CheckCircle className="w-4 h-4 text-success" />}
                </div>
                <div className="border-2 border-dashed border-border/50 rounded-lg p-6">
                  <div className="text-center space-y-2">
                    <Camera className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Clear photo of yourself holding your ID document
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('selfie', e.target.files?.[0] || null)}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                </div>
              </div>

              {/* Wallet Integration Notice */}
              <div className="p-4 rounded-lg bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="font-medium">Blockchain Integration</span>
                  </div>
                  {wallet.isConnected ? (
                    <Badge className="bg-success/20 text-success">Connected</Badge>
                  ) : (
                    <Badge variant="outline">Not Connected</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {wallet.isConnected 
                    ? `Your KYC will be linked to wallet: ${wallet.address?.slice(0, 6)}...${wallet.address?.slice(-4)}`
                    : 'Connect your wallet to link KYC verification with your blockchain identity'
                  }
                </p>
                {wallet.isConnected && (
                  <div className="flex items-center space-x-1 text-xs text-success">
                    <ExternalLink className="w-3 h-3" />
                    <span>KYC status will be recorded on-chain</span>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary" 
                disabled={submitMutation.isPending || uploadMutation.isPending || completionPercentage < 100 || (!wallet.isConnected && process.env.NODE_ENV === 'production')}
              >
                {submitMutation.isPending || uploadMutation.isPending ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    {uploadMethod === 'submit' ? 'Submitting...' : 'Uploading...'}
                  </>
                ) : !wallet.isConnected ? (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet to Submit
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    {uploadMethod === 'submit' ? 'Submit for Verification' : 'Upload Documents'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card className="gradient-card border-0 max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold">Your Privacy & Security</h3>
              <p className="text-sm text-muted-foreground">
                All documents are encrypted and securely stored. We comply with international data protection standards 
                and only use your information for identity verification purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KYC;