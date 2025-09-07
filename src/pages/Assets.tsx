import { useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetsApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { AssetApprovalDialog } from "@/components/AssetApprovalDialog";
import { DocumentUpload, UploadedDocument } from "@/components/DocumentUpload";
import { 
  Building2, 
  Plus, 
  Upload, 
  FileText, 
  DollarSign,
  Calendar,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  Coins,
  Wallet,
  Settings,
  Shield
} from "lucide-react";
import { MintTokenDialog } from "@/components/MintTokenDialog";

const AssetsList = () => {
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  
  const { data: assets = [], isLoading, refetch } = useQuery({
    queryKey: ['my-assets'],
    queryFn: () => assetsApi.myAssets().then(res => res.data),
  });

  // Also fetch from alternative endpoints for complete data
  const { data: pledgedAssets = [] } = useQuery({
    queryKey: ['pledged-assets'], 
    queryFn: () => assetsApi.pledged().then(res => res.data),
  });

  const { data: mineAssets = [] } = useQuery({
    queryKey: ['mine-assets'],
    queryFn: () => assetsApi.mine().then(res => res.data),
  });

  const handleReviewAsset = (asset: any) => {
    setSelectedAsset(asset);
    setIsApprovalDialogOpen(true);
  };

  const handleApprovalChange = () => {
    refetch();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-warning/20 text-warning", icon: Clock, label: "Pending" },
      under_review: { color: "bg-accent/20 text-accent", icon: Clock, label: "Under Review" },
      approved: { color: "bg-success/20 text-success", icon: CheckCircle, label: "Approved" },
      rejected: { color: "bg-destructive/20 text-destructive", icon: AlertCircle, label: "Rejected" },
      tokenized: { color: "bg-primary/20 text-primary", icon: Coins, label: "Tokenized" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted/50 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-muted/50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            My Assets
          </h1>
          <p className="text-muted-foreground">
            Manage your pledged assets and tokenization status
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/assets">
              <Settings className="w-4 h-4 mr-2" />
              Admin Panel
            </Link>
          </Button>
          <Button asChild className="gradient-primary">
            <Link to="/assets/pledge">
              <Plus className="w-4 h-4 mr-2" />
              Pledge Asset
            </Link>
          </Button>
        </div>
      </div>

      {assets.length === 0 ? (
        <Card className="gradient-card border-0">
          <CardContent className="py-16 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Assets Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start by pledging your first real-world asset for tokenization
            </p>
            <Button asChild className="gradient-primary">
              <Link to="/assets/pledge">
                <Plus className="w-4 h-4 mr-2" />
                Pledge Your First Asset
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset: any) => (
            <Card key={asset.id} className="gradient-card border-0 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{asset.assetType}</CardTitle>
                  {getStatusBadge(asset.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{asset.description}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <span className="font-semibold text-success">
                    ${asset.estimatedValue?.toLocaleString() || 0}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Submitted {new Date(asset.submittedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Document Status */}
                {asset.documents && asset.documents.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span>
                      {asset.documents.length} compliance document{asset.documents.length !== 1 ? 's' : ''} uploaded
                    </span>
                  </div>
                )}

                {asset.status === 'approved' && (
                  <MintTokenDialog asset={asset}>
                    <Button size="sm" className="w-full gradient-primary">
                      <Coins className="w-4 h-4 mr-2" />
                      Mint Tokens
                    </Button>
                  </MintTokenDialog>
                )}
                
                {asset.status === 'under_review' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleReviewAsset(asset)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Review & Approve
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Asset Approval Dialog */}
      <AssetApprovalDialog
        asset={selectedAsset}
        isOpen={isApprovalDialogOpen}
        onClose={() => setIsApprovalDialogOpen(false)}
        onApprovalChange={handleApprovalChange}
      />
    </div>
  );
};

const PledgeAsset = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { wallet } = useWallet();
  const [formData, setFormData] = useState({
    assetType: "",
    estimatedValue: "",
    description: "",
  });
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  const pledgeMutation = useMutation({
    mutationFn: (data: any) => {
      if (wallet.isConnected && wallet.address) {
        return assetsApi.pledge({
          ...data,
          walletAddress: wallet.address
        });
      }
      return assetsApi.pledge(data);
    },
    onSuccess: () => {
      toast({
        title: "Asset Pledged Successfully",
        description: "Your asset has been submitted for review with all supporting documents.",
      });
      queryClient.invalidateQueries({ queryKey: ['my-assets'] });
      navigate('/assets');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Pledge Asset",
        description: error.message || "Something went wrong",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.isConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Required",
        description: "Please connect your wallet to pledge an asset.",
      });
      return;
    }

    if (documents.length === 0) {
      toast({
        variant: "destructive",
        title: "Documents Required",
        description: "Please upload at least one supporting document for compliance verification.",
      });
      return;
    }
    
    const data = {
      ...formData,
      estimatedValue: parseFloat(formData.estimatedValue),
      documents: documents.map(doc => ({
        name: doc.name,
        url: doc.url,
        type: doc.type,
        size: doc.size
      }))
    };
    
    pledgeMutation.mutate(data);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/assets')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assets
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Pledge New Asset
          </h1>
          <p className="text-muted-foreground">
            Submit your real-world asset for tokenization with compliance documentation
          </p>
        </div>

        <Card className="gradient-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>Asset Details & Compliance Documents</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              All information and documents are required for KYC and regulatory compliance
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="assetType">Asset Type *</Label>
                <Select 
                  value={formData.assetType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assetType: value }))}
                >
                  <SelectTrigger className="bg-muted/50 border-border/50">
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                    <SelectItem value="Gold">Gold & Precious Metals</SelectItem>
                    <SelectItem value="Art & Collectibles">Art & Collectibles</SelectItem>
                    <SelectItem value="Commodities">Commodities</SelectItem>
                    <SelectItem value="Equipment">Industrial Equipment</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedValue">Estimated Value (USD) *</Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedValue: e.target.value }))}
                  placeholder="Enter estimated value"
                  required
                  className="bg-muted/50 border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Asset Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide detailed information about your asset including location, condition, specifications, etc."
                  rows={4}
                  required
                  className="bg-muted/50 border-border/50"
                />
              </div>

              <div className="space-y-4">
                <DocumentUpload
                  bucketName="asset-documents"
                  onDocumentsChange={setDocuments}
                  existingDocuments={documents}
                  maxFiles={10}
                  maxSizeMB={10}
                  required={true}
                />
              </div>

              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <h4 className="font-semibold text-accent mb-2">Compliance Notice</h4>
                <p className="text-sm text-muted-foreground">
                  By submitting this asset, you confirm that you are the legal owner and have the right to tokenize this asset. 
                  All documents will be reviewed for compliance with applicable regulations.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary" 
                disabled={pledgeMutation.isPending || !wallet.isConnected || documents.length === 0}
              >
                {pledgeMutation.isPending 
                  ? "Submitting for Review..." 
                  : !wallet.isConnected 
                    ? "Connect Wallet to Submit"
                    : documents.length === 0
                      ? "Upload Documents to Continue"
                      : "Submit for Compliance Review"
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Assets = () => {
  return (
    <Routes>
      <Route path="/" element={<AssetsList />} />
      <Route path="/pledge" element={<PledgeAsset />} />
    </Routes>
  );
};

export default Assets;