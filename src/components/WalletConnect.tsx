import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Loader2, ExternalLink } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/context/AuthContext';

const WalletConnect = () => {
  const { wallet, connections, connectWallet, disconnectWallet, switchNetwork, addNetwork } = useWallet();
  const { isAuthenticated, user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    await connectWallet();
    setIsLoading(false);
  };

  const handleDisconnect = async () => {
    disconnectWallet();
    await signOut();
  };

  const getChainName = (chainId: number) => {
    const chains: { [key: number]: string } = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon Mainnet',
      80001: 'Mumbai Testnet',
      56: 'BSC Mainnet',
      97: 'BSC Testnet',
    };
    return chains[chainId] || `Chain ${chainId}`;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!wallet.isConnected ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Connect your wallet to access blockchain features
              </p>
              <Button
                onClick={handleConnect}
                disabled={isLoading || wallet.isConnecting}
                className="w-full"
              >
                {isLoading || wallet.isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect MetaMask
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Connected Address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {truncateAddress(wallet.address!)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://etherscan.io/address/${wallet.address}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Badge variant="default">Connected</Badge>
              </div>
              
              <div>
                <p className="font-medium mb-2">Network</p>
                <div className="flex items-center gap-2">
                  <div className="text-sm">
                    <span className="font-medium">Network:</span>{' '}
                    <span className={`px-2 py-1 rounded text-xs ${
                      wallet.chainId === 1 ? 'bg-green-100 text-green-800' :
                      wallet.chainId === 11155111 ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getChainName(wallet.chainId!)}
                    </span>
                  </div>
                </div>
                
                {/* Network Switch Buttons */}
                <div className="flex gap-2 mt-3">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addNetwork(11155111)}
                  >
                    Add Sepolia
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="w-full"
              >
                Disconnect Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {truncateAddress(connection.wallet_address)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getChainName(connection.chain_id)} • {connection.wallet_type}
                    </p>
                  </div>
                  <Badge variant={connection.is_verified ? 'default' : 'secondary'}>
                    {connection.is_verified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WalletConnect;