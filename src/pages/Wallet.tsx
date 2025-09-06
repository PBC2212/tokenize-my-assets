import { useEffect, useState } from 'react';
import WalletConnect from '@/components/WalletConnect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { walletApi } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface WalletTransaction {
  id: string;
  transaction_hash: string;
  from_address: string;
  to_address: string;
  value_eth: number;
  status: string;
  transaction_type: string;
  block_number: number;
  created_at: string;
  token_symbol?: string;
}

const Wallet = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await walletApi.getTransactions() as any;
      setTransactions(response.transactions || response.data || []);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load wallet transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Wallet Management</h1>
        <p className="text-muted-foreground">
          Connect and manage your blockchain wallets for seamless asset tokenization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <WalletConnect />
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transaction History</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadTransactions}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found. Connect a wallet to see your transaction history.
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-sm font-mono">
                            {truncateHash(tx.transaction_hash)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => 
                              window.open(
                                `https://etherscan.io/tx/${tx.transaction_hash}`,
                                '_blank'
                              )
                            }
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            From: {formatAddress(tx.from_address)} → To: {formatAddress(tx.to_address)}
                          </div>
                          <div className="flex items-center gap-4">
                            <span>Value: {tx.value_eth} {tx.token_symbol || 'ETH'}</span>
                            {tx.block_number && (
                              <span>Block: {tx.block_number}</span>
                            )}
                            <span>Type: {tx.transaction_type}</span>
                          </div>
                          <div>
                            {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      
                      <Badge variant={getStatusColor(tx.status)}>
                        {tx.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Wallet;