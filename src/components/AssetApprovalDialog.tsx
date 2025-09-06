import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, DollarSign, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

interface AssetApprovalDialogProps {
  asset: UserAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onApprovalChange: () => void;
}

export const AssetApprovalDialog = ({ 
  asset, 
  isOpen, 
  onClose, 
  onApprovalChange 
}: AssetApprovalDialogProps) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApproval = async (action: 'approve' | 'reject') => {
    if (!asset) return;
    
    if (action === 'reject' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('asset-approval', {
        body: {
          assetId: asset.id,
          action,
          rejectionReason: rejectionReason.trim() || undefined
        }
      });

      if (error) throw error;

      toast.success(`Asset ${action}d successfully`);
      onApprovalChange();
      onClose();
      setRejectionReason('');
    } catch (error) {
      console.error(`Failed to ${action} asset:`, error);
      toast.error(`Failed to ${action} asset`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!asset) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5" />
            Asset Review - {asset.asset_type}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Asset Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{asset.asset_type}</h3>
              {getStatusBadge(asset.status)}
            </div>
            
            <p className="text-muted-foreground">{asset.description}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="text-muted-foreground">Estimated Value:</span>{' '}
                  <span className="font-semibold">${asset.estimated_value.toLocaleString()}</span>
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="text-muted-foreground">Submitted:</span>{' '}
                  <span className="font-medium">{formatDate(asset.submitted_at)}</span>
                </span>
              </div>
            </div>

            {asset.documents && asset.documents.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Documents:</p>
                <div className="flex flex-wrap gap-2">
                  {asset.documents.map((doc, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      Document {index + 1}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Compliance Assessment */}
          <div className="bg-blue-50/50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Compliance Assessment</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Asset documentation provided</li>
              <li>✓ Ownership verification required</li>
              <li>✓ Valuation assessment needed</li>
              <li>✓ Regulatory compliance check</li>
            </ul>
          </div>

          {/* Rejection Reason Input */}
          {asset.status === 'under_review' && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Rejection Reason (optional for approval, required for rejection)
              </label>
              <Textarea
                placeholder="Provide detailed reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          {/* Previous Decision Info */}
          {asset.status !== 'under_review' && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Previous Decision</h4>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Status:</span>{' '}
                  <span className="font-medium capitalize">{asset.status}</span>
                </p>
                {asset.reviewed_at && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Reviewed:</span>{' '}
                    <span className="font-medium">{formatDate(asset.reviewed_at)}</span>
                  </p>
                )}
                {asset.rejection_reason && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Reason:</span>{' '}
                    <span className="font-medium">{asset.rejection_reason}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            
            {asset.status === 'under_review' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleApproval('reject')}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Asset
                </Button>
                
                <Button
                  onClick={() => handleApproval('approve')}
                  disabled={isProcessing}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Asset
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};