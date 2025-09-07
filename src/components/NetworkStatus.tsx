import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Network, AlertTriangle, CheckCircle } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';

const NetworkStatus = () => {
  const { wallet, switchNetwork, addNetwork } = useWallet();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSepolia = async () => {
    setIsAdding(true);
    try {
      await addNetwork(11155111);  // Sepolia chain ID
      toast.success('Sepolia network added successfully!');
    } catch (error) {
      toast.error('Failed to add Sepolia network');
    } finally {
      setIsAdding(false);
    }
  };

  const getSupportedNetworks = () => [
    { id: 1, name: 'Ethereum Mainnet', supported: true },
    { id: 11155111, name: 'Sepolia Testnet', supported: true },
    { id: 137, name: 'Polygon Mainnet', supported: true },
  ];

  const getCurrentNetworkStatus = () => {
    if (!wallet.chainId) return null;
    
    const supportedNetworks = getSupportedNetworks();
    const currentNetwork = supportedNetworks.find(n => n.id === wallet.chainId);
    
    return {
      isSupported: !!currentNetwork,
      name: currentNetwork?.name || `Unknown Network (${wallet.chainId})`,
      chainId: wallet.chainId
    };
  };

  const networkStatus = getCurrentNetworkStatus();

  if (!wallet.isConnected) {
    return null;
  }

  return (
    <Card className="gradient-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Network Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {networkStatus && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Network:</span>
              <Badge variant={networkStatus.isSupported ? "default" : "destructive"}>
                {networkStatus.name}
              </Badge>
            </div>

            {!networkStatus.isSupported && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This network is not supported. Please switch to a supported network.
                </AlertDescription>
              </Alert>
            )}

            {networkStatus.isSupported && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Connected to supported network.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Quick Network Switch:</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => switchNetwork(1)}
              disabled={wallet.chainId === 1}
            >
              Mainnet
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => switchNetwork(11155111)}
              disabled={wallet.chainId === 11155111}
            >
              Sepolia
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Having trouble with Sepolia?</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddSepolia}
            disabled={isAdding}
            className="w-full"
          >
            {isAdding ? 'Adding...' : 'Add Sepolia Network'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkStatus;