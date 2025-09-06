import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { liquidityApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { 
  Droplets, 
  Plus, 
  Minus, 
  TrendingUp, 
  Coins,
  DollarSign,
  BarChart3,
  Wallet,
  ExternalLink
} from "lucide-react";

const Liquidity = () => {
  const [addAmount, setAddAmount] = useState("");
  const [removeAmount, setRemoveAmount] = useState("");
  const [selectedPoolId, setSelectedPoolId] = useState("");

  const queryClient = useQueryClient();
  const { wallet } = useWallet();

  const { data: pools = [], isLoading } = useQuery({
    queryKey: ['liquidity-pools'],
    queryFn: () => liquidityApi.pools().then(res => res.data),
  });

  const addLiquidityMutation = useMutation({
    mutationFn: (data: { poolId: string; amount: number }) => {
      if (wallet.isConnected && wallet.address) {
        return liquidityApi.add({
          ...data,
          walletAddress: wallet.address
        });
      }
      return liquidityApi.add(data);
    },
    onSuccess: () => {
      toast({
        title: "Liquidity Added Successfully",
        description: "Your liquidity has been added to the pool and recorded on the blockchain.",
      });
      queryClient.invalidateQueries({ queryKey: ['liquidity-pools'] });
      setAddAmount("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Add Liquidity",
        description: error.message || "Something went wrong",
      });
    },
  });

  const removeLiquidityMutation = useMutation({
    mutationFn: (data: { poolId: string; amount: number }) => {
      if (wallet.isConnected && wallet.address) {
        return liquidityApi.remove({
          ...data,
          walletAddress: wallet.address
        });
      }
      return liquidityApi.remove(data);
    },
    onSuccess: () => {
      toast({
        title: "Liquidity Removed Successfully", 
        description: "Your liquidity has been withdrawn from the pool and recorded on the blockchain.",
      });
      queryClient.invalidateQueries({ queryKey: ['liquidity-pools'] });
      setRemoveAmount("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Remove Liquidity",
        description: error.message || "Something went wrong",
      });
    },
  });

  const handleAddLiquidity = (pool: any) => {
    if (!wallet.isConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Required",
        description: "Please connect your wallet to add liquidity.",
      });
      return;
    }

    if (!addAmount || parseFloat(addAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount to add.",
      });
      return;
    }

    addLiquidityMutation.mutate({
      poolId: pool.id,
      amount: parseFloat(addAmount),
    });
  };

  const handleRemoveLiquidity = (pool: any) => {
    if (!wallet.isConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Required",
        description: "Please connect your wallet to remove liquidity.",
      });
      return;
    }

    if (!removeAmount || parseFloat(removeAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount to remove.",
      });
      return;
    }

    removeLiquidityMutation.mutate({
      poolId: pool.id,
      amount: parseFloat(removeAmount),
    });
  };

  const totalLiquidity = pools.reduce((sum: number, pool: any) => sum + pool.myLiquidity, 0);
  const totalEarnings = pools.reduce((sum: number, pool: any) => sum + pool.fees24h, 0);

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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Liquidity Pools
        </h1>
        <p className="text-muted-foreground">
          Provide liquidity to earn fees from asset token trading
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="gradient-card border-0 animate-float">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Total Liquidity
            </CardTitle>
            <Wallet className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalLiquidity.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3 mr-1 text-success" />
              Across {pools.length} pools
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 animate-float" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              24h Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ${totalEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From trading fees
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 animate-float" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average APR
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {pools.length > 0 
                ? (pools.reduce((sum: number, pool: any) => sum + pool.apr, 0) / pools.length).toFixed(1) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Weighted average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pools.map((pool: any, index: number) => (
          <Card key={pool.id} className="gradient-card border-0 hover:shadow-lg transition-all duration-300 animate-float" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{pool.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{pool.tokenA} / {pool.tokenB}</p>
                  </div>
                </div>
                <Badge className="bg-success/20 text-success border-success/20">
                  {pool.apr}% APR
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Liquidity</p>
                  <p className="font-semibold text-lg">${pool.totalLiquidity.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">24h Volume</p>
                  <p className="font-semibold text-lg">${pool.volume24h.toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">My Liquidity</p>
                  <p className="font-semibold">${pool.myLiquidity.toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">My 24h Fees</p>
                  <p className="font-semibold text-success">${pool.fees24h.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="flex-1 gradient-primary"
                      onClick={() => setSelectedPoolId(pool.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Liquidity
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Liquidity to {pool.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Amount (USD)</Label>
                        <Input
                          type="number"
                          value={addAmount}
                          onChange={(e) => setAddAmount(e.target.value)}
                          placeholder="Enter amount to add"
                          className="bg-muted/50 border-border/50"
                        />
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Pool APR: <span className="text-success font-semibold">{pool.apr}%</span></p>
                        <p>Current Share: {((pool.myLiquidity / pool.totalLiquidity) * 100).toFixed(2)}%</p>
                        <p>Expected daily earnings: ${((parseFloat(addAmount) || 0) * pool.apr / 365 / 100).toFixed(2)}</p>
                        <div className="flex items-center justify-between text-xs border-t border-border/50 pt-2 mt-2">
                          <span>Connected Wallet:</span>
                          <span className="font-mono">
                            {wallet.isConnected ? `${wallet.address?.slice(0, 6)}...${wallet.address?.slice(-4)}` : 'Not connected'}
                          </span>
                        </div>
                        {wallet.isConnected && (
                          <div className="flex items-center space-x-1 text-xs text-success">
                            <ExternalLink className="w-3 h-3" />
                            <span>Transaction will be recorded on-chain</span>
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={() => handleAddLiquidity(pool)} 
                        className="w-full gradient-primary"
                        disabled={addLiquidityMutation.isPending || !wallet.isConnected}
                      >
                        {addLiquidityMutation.isPending ? (
                          "Adding Liquidity..."
                        ) : !wallet.isConnected ? (
                          <>
                            <Wallet className="w-4 h-4 mr-2" />
                            Connect Wallet to Add
                          </>
                        ) : (
                          "Add Liquidity"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      disabled={pool.myLiquidity === 0}
                      onClick={() => setSelectedPoolId(pool.id)}
                    >
                      <Minus className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Remove Liquidity from {pool.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Amount (USD)</Label>
                        <Input
                          type="number"
                          value={removeAmount}
                          onChange={(e) => setRemoveAmount(e.target.value)}
                          placeholder="Enter amount to remove"
                          max={pool.myLiquidity}
                          className="bg-muted/50 border-border/50"
                        />
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Available to remove: ${pool.myLiquidity.toLocaleString()}</p>
                        <p>This will reduce your earnings proportionally</p>
                        <div className="flex items-center justify-between text-xs border-t border-border/50 pt-2 mt-2">
                          <span>Connected Wallet:</span>
                          <span className="font-mono">
                            {wallet.isConnected ? `${wallet.address?.slice(0, 6)}...${wallet.address?.slice(-4)}` : 'Not connected'}
                          </span>
                        </div>
                        {wallet.isConnected && (
                          <div className="flex items-center space-x-1 text-xs text-success">
                            <ExternalLink className="w-3 h-3" />
                            <span>Transaction will be recorded on-chain</span>
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={() => handleRemoveLiquidity(pool)} 
                        className="w-full"
                        variant="destructive"
                        disabled={removeLiquidityMutation.isPending || !wallet.isConnected}
                      >
                        {removeLiquidityMutation.isPending ? (
                          "Removing Liquidity..."
                        ) : !wallet.isConnected ? (
                          <>
                            <Wallet className="w-4 h-4 mr-2" />
                            Connect Wallet to Remove
                          </>
                        ) : (
                          "Remove Liquidity"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pools.length === 0 && (
        <Card className="gradient-card border-0">
          <CardContent className="py-16 text-center">
            <Droplets className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Liquidity Pools Available</h3>
            <p className="text-muted-foreground">
              Liquidity pools will appear here once assets are tokenized
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Liquidity;