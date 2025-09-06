import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetApprovalDialog } from '@/components/AssetApprovalDialog';
import { supabase } from '@/integrations/supabase/client';
import { FileText, DollarSign, Calendar, Search, Filter } from 'lucide-react';

interface UserAsset {
  id: string;
  user_id: string;
  asset_type: string;
  description: string;
  estimated_value: number;
  status: string;
  documents: string[] | null;
  submitted_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

const AdminAssets = () => {
  const [selectedAsset, setSelectedAsset] = useState<UserAsset | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: assets, isLoading, refetch } = useQuery({
    queryKey: ['admin-assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_assets')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data as UserAsset[];
    }
  });

  const filteredAssets = assets?.filter(asset => {
    const matchesSearch = asset.asset_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReviewAsset = (asset: UserAsset) => {
    setSelectedAsset(asset);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedAsset(null);
  };

  const handleApprovalChange = () => {
    refetch();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'under_review':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusCounts = () => {
    if (!assets) return { total: 0, pending: 0, approved: 0, rejected: 0 };
    
    return {
      total: assets.length,
      pending: assets.filter(a => a.status === 'under_review').length,
      approved: assets.filter(a => a.status === 'approved').length,
      rejected: assets.filter(a => a.status === 'rejected').length,
    };
  };

  const counts = getStatusCounts();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Asset Management
          </h1>
          <p className="text-muted-foreground">
            Review and approve asset pledges for tokenization
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="gradient-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold text-foreground">{counts.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{counts.approved}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{counts.rejected}</p>
                </div>
                <FileText className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="gradient-card border-0">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assets List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAssets?.map((asset) => (
            <Card key={asset.id} className="gradient-card border-0 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {asset.asset_type}
                  </CardTitle>
                  {getStatusBadge(asset.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {asset.description}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-semibold">${asset.estimated_value.toLocaleString()}</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formatDate(asset.submitted_at)}
                    </span>
                  </div>
                </div>

                {asset.documents && asset.documents.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {asset.documents.length} document(s) attached
                    </span>
                  </div>
                )}

                <Button 
                  onClick={() => handleReviewAsset(asset)}
                  className="w-full"
                  variant={asset.status === 'under_review' ? 'default' : 'outline'}
                >
                  {asset.status === 'under_review' ? 'Review Asset' : 'View Details'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAssets?.length === 0 && (
          <Card className="gradient-card border-0">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No assets found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No assets have been pledged yet'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Asset Approval Dialog */}
        <AssetApprovalDialog
          asset={selectedAsset}
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          onApprovalChange={handleApprovalChange}
        />
      </div>
    </div>
  );
};

export default AdminAssets;