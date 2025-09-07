import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { marketplaceApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter,
  Building2,
  Gem,
  Palette,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Coins,
  Wallet,
  ExternalLink
} from "lucide-react";

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetType, setSelectedAssetType] = useState("all");
  const [sortBy, setSortBy] = useState("market_cap");
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("");

  const queryClient = useQueryClient();
  const { wallet } = useWallet();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['marketplace-listings'],
    queryFn: () => marketplaceApi.listings().then(res => res.data),
  });

  const buyMutation = useMutation({
    mutationFn: (data: { tokenId: string; amount: number }) => {
      if (wallet.isConnected && wallet.address) {
        return marketplaceApi.buy({
          ...data,
          walletAddress: wallet.address
        });
      }
      return marketplaceApi.buy(data);
    },
    onSuccess: () => {
      toast({
        title: "Purchase Successful",
        description: "Tokens have been added to your portfolio and recorded on the blockchain.",
      });
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      setBuyAmount("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: error.message || "Something went wrong",
      });
    },
  });

  const sellMutation = useMutation({
    mutationFn: (data: { tokenId: string; amount: number; price: number }) => {
      if (wallet.isConnected && wallet.address) {
        return marketplaceApi.sell({
          ...data,
          walletAddress: wallet.address
        });
      }
      return marketplaceApi.sell(data);
    },
    onSuccess: () => {
      toast({
        title: "Listing Created",
        description: "Your tokens have been listed for sale and recorded on the blockchain.",
      });
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      setSellAmount("");
      setSellPrice("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Listing Failed",
        description: error.message || "Something went wrong",
      });
    },
  });

  const handleBuy = (listing: any) => {
    if (!wallet.isConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Required",
        description: "Please connect your wallet to make purchases.",
      });
      return;
    }

    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount to purchase.",
      });
      return;
    }

    buyMutation.mutate({
      tokenId: listing.token_id || listing.id,
      amount: parseFloat(buyAmount),
    });
  };

  const handleSell = (listing: any) => {
    if (!wallet.isConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Required",
        description: "Please connect your wallet to create listings.",
      });
      return;
    }

    if (!sellAmount || !sellPrice || parseFloat(sellAmount) <= 0 || parseFloat(sellPrice) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please enter valid amount and price.",
      });
      return;
    }

    sellMutation.mutate({
      tokenId: listing.token_id || listing.id,
      amount: parseFloat(sellAmount),
      price: parseFloat(sellPrice),
    });
  };

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case "Real Estate":
        return Building2;
      case "Gold":
        return Gem;
      case "Art & Collectibles":
        return Palette;
      default:
        return Coins;
    }
  };

  const filteredListings = listings.filter((listing: any) => {
    // Safe property access with fallbacks
    const tokenName = listing.tokens?.token_name || listing.assetName || '';
    const tokenSymbol = listing.tokens?.token_symbol || listing.tokenSymbol || '';
    const assetType = listing.tokens?.asset_type || listing.assetType || '';
    
    const matchesSearch = tokenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAssetType = selectedAssetType === "all" || assetType === selectedAssetType;
    return matchesSearch && matchesAssetType;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted/50 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-muted/50 rounded-lg"></div>
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
          Asset Marketplace
        </h1>
        <p className="text-muted-foreground">
          Trade tokenized real-world assets with complete transparency
        </p>
      </div>

      {/* Filters */}
      <Card className="gradient-card border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-border/50"
                />
              </div>
            </div>
            
            <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
              <SelectTrigger className="w-full md:w-48 bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Asset Types</SelectItem>
                <SelectItem value="Real Estate">Real Estate</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Art & Collectibles">Art & Collectibles</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market_cap">Market Cap</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="change">24h Change</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map((listing: any) => {
          // Safe property access with fallbacks
          const tokenSymbol = listing.tokens?.token_symbol || listing.tokenSymbol || 'TOKEN';
          const tokenName = listing.tokens?.token_name || listing.assetName || 'Asset';
          const assetType = listing.tokens?.asset_type || listing.assetType || 'Other';
          const price = listing.price_per_token || listing.price || 0;
          const totalSupply = listing.tokens?.total_supply || listing.totalSupply || 0;
          const availableTokens = listing.amount || listing.availableTokens || 0;
          
          const IconComponent = getAssetIcon(assetType);
          return (
            <Card key={listing.id} className="gradient-card border-0 hover:shadow-lg transition-all duration-300 animate-float">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <IconComponent className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tokenSymbol}</CardTitle>
                      <p className="text-sm text-muted-foreground">{assetType}</p>
                    </div>
                  </div>
                  <Badge className={`${
                    (listing.change24h || 0) > 0 
                      ? 'bg-success/20 text-success border-success/20' 
                      : 'bg-destructive/20 text-destructive border-destructive/20'
                  }`}>
                    {(listing.change24h || 0) > 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {(listing.change24h || 0) > 0 ? '+' : ''}{(listing.change24h || 0)}%
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{tokenName}</p>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-success" />
                    <span className="text-2xl font-bold text-success">
                      ${price.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">NAV</p>
                    <p className="font-semibold">${(listing.nav || price * totalSupply || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Liquidity</p>
                    <p className="font-semibold">${(listing.liquidity || price * availableTokens || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground">Available Tokens</p>
                  <p className="font-semibold">
                    {availableTokens.toLocaleString()} / {totalSupply.toLocaleString()}
                  </p>
                  <div className="w-full bg-muted/50 rounded-full h-2 mt-1">
                    <div 
                      className="bg-accent h-2 rounded-full"
                      style={{ 
                        width: `${totalSupply > 0 ? (availableTokens / totalSupply) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex-1 gradient-primary">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Buy {tokenSymbol} Tokens</DialogTitle>
                        <DialogDescription>
                          Enter the amount of tokens you want to purchase from this asset.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Amount to Buy</Label>
                          <Input
                            type="number"
                            value={buyAmount}
                            onChange={(e) => setBuyAmount(e.target.value)}
                            placeholder="Enter number of tokens"
                            className="bg-muted/50 border-border/50"
                          />
                        </div>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span>Total Cost:</span>
                            <span className="font-semibold">${(parseFloat(buyAmount) * price || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
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
                          onClick={() => handleBuy(listing)} 
                          className="w-full gradient-primary"
                          disabled={buyMutation.isPending || !wallet.isConnected}
                        >
                          {buyMutation.isPending ? (
                            "Processing Purchase..."
                          ) : !wallet.isConnected ? (
                            <>
                              <Wallet className="w-4 h-4 mr-2" />
                              Connect Wallet to Buy
                            </>
                          ) : (
                            "Confirm Purchase"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="flex-1">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Sell
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Sell {tokenSymbol} Tokens</DialogTitle>
                        <DialogDescription>
                          Create a listing to sell your tokens at your desired price.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Amount to Sell</Label>
                          <Input
                            type="number"
                            value={sellAmount}
                            onChange={(e) => setSellAmount(e.target.value)}
                            placeholder="Enter number of tokens"
                            className="bg-muted/50 border-border/50"
                          />
                        </div>
                        <div>
                          <Label>Price per Token ($)</Label>
                          <Input
                            type="number"
                            value={sellPrice}
                            onChange={(e) => setSellPrice(e.target.value)}
                            placeholder="Enter price per token"
                            className="bg-muted/50 border-border/50"
                          />
                        </div>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span>Total Value:</span>
                            <span className="font-semibold">${(parseFloat(sellAmount) * parseFloat(sellPrice) || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Connected Wallet:</span>
                            <span className="font-mono">
                              {wallet.isConnected ? `${wallet.address?.slice(0, 6)}...${wallet.address?.slice(-4)}` : 'Not connected'}
                            </span>
                          </div>
                          {wallet.isConnected && (
                            <div className="flex items-center space-x-1 text-xs text-success">
                              <ExternalLink className="w-3 h-3" />
                              <span>Listing will be recorded on-chain</span>
                            </div>
                          )}
                        </div>
                        <Button 
                          onClick={() => handleSell(listing)} 
                          className="w-full gradient-primary"
                          disabled={sellMutation.isPending || !wallet.isConnected}
                        >
                          {sellMutation.isPending ? (
                            "Creating Listing..."
                          ) : !wallet.isConnected ? (
                            <>
                              <Wallet className="w-4 h-4 mr-2" />
                              Connect Wallet to Sell
                            </>
                          ) : (
                            "List for Sale"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredListings.length === 0 && (
        <Card className="gradient-card border-0">
          <CardContent className="py-16 text-center">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Assets Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Marketplace;