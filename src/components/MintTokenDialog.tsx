import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assetsApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { 
  Coins, 
  DollarSign, 
  Building2, 
  Percent,
  Info,
  TrendingUp,
  Shield
} from "lucide-react";

interface MintTokenDialogProps {
  asset: {
    id: string;
    assetType: string;
    description: string;
    estimatedValue: number;
    status: string;
  };
  children: React.ReactNode;
}

export const MintTokenDialog = ({ asset, children }: MintTokenDialogProps) => {
  const [open, setOpen] = useState(false);
  const [mintData, setMintData] = useState({
    tokenSymbol: "",
    totalSupply: "",
    decimals: "18",
    tokenName: "",
    pricePerToken: ""
  });

  const queryClient = useQueryClient();

  const mintMutation = useMutation({
    mutationFn: (data: any) => assetsApi.mint(asset.id, data),
    onSuccess: () => {
      toast({
        title: "Tokens Minted Successfully",
        description: `${mintData.totalSupply} ${mintData.tokenSymbol} tokens have been created for your asset.`,
      });
      queryClient.invalidateQueries({ queryKey: ['my-assets'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Minting Failed",
        description: error.response?.data?.error || "Failed to mint tokens",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...mintData,
      totalSupply: parseInt(mintData.totalSupply),
      decimals: parseInt(mintData.decimals),
      pricePerToken: parseFloat(mintData.pricePerToken)
    };
    
    mintMutation.mutate(data);
  };

  const suggestedTokenSymbol = asset.assetType === 'Real Estate' ? 'RET' : 
                               asset.assetType === 'Gold' ? 'GLD' :
                               asset.assetType === 'Art & Collectibles' ? 'ART' : 'RWA';

  const suggestedSupply = Math.floor(asset.estimatedValue / 100); // $100 per token suggestion
  const suggestedPrice = asset.estimatedValue / suggestedSupply;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-primary" />
            <span>Mint Asset Tokens</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Asset Overview */}
          <div className="p-4 rounded-lg bg-muted/20 space-y-3">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-accent" />
              <span className="font-medium">{asset.assetType}</span>
            </div>
            <p className="text-sm text-muted-foreground">{asset.description}</p>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-success" />
              <span className="font-semibold text-success">
                ${asset.estimatedValue.toLocaleString()}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tokenName">Token Name</Label>
                <Input
                  id="tokenName"
                  value={mintData.tokenName}
                  onChange={(e) => setMintData(prev => ({ ...prev, tokenName: e.target.value }))}
                  placeholder={`${asset.assetType} Token`}
                  required
                  className="bg-muted/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokenSymbol">Token Symbol</Label>
                <Input
                  id="tokenSymbol"
                  value={mintData.tokenSymbol}
                  onChange={(e) => setMintData(prev => ({ ...prev, tokenSymbol: e.target.value.toUpperCase() }))}
                  placeholder={suggestedTokenSymbol}
                  required
                  className="bg-muted/50 border-border/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalSupply">Total Supply</Label>
                <Input
                  id="totalSupply"
                  type="number"
                  value={mintData.totalSupply}
                  onChange={(e) => setMintData(prev => ({ ...prev, totalSupply: e.target.value }))}
                  placeholder={suggestedSupply.toString()}
                  required
                  className="bg-muted/50 border-border/50"
                />
                <p className="text-xs text-muted-foreground">
                  Suggested: {suggestedSupply.toLocaleString()} tokens
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricePerToken">Price per Token (USD)</Label>
                <Input
                  id="pricePerToken"
                  type="number"
                  step="0.01"
                  value={mintData.pricePerToken}
                  onChange={(e) => setMintData(prev => ({ ...prev, pricePerToken: e.target.value }))}
                  placeholder={suggestedPrice.toFixed(2)}
                  required
                  className="bg-muted/50 border-border/50"
                />
                <p className="text-xs text-muted-foreground">
                  Suggested: ${suggestedPrice.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="decimals">Token Decimals</Label>
              <Select 
                value={mintData.decimals} 
                onValueChange={(value) => setMintData(prev => ({ ...prev, decimals: value }))}
              >
                <SelectTrigger className="bg-muted/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18">18 (Standard)</SelectItem>
                  <SelectItem value="6">6 (USDC-like)</SelectItem>
                  <SelectItem value="0">0 (No decimals)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Token Economics Preview */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span>Token Economics Preview</span>
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-muted/20">
                  <div className="text-muted-foreground">Market Cap</div>
                  <div className="font-semibold">
                    ${((parseInt(mintData.totalSupply) || 0) * (parseFloat(mintData.pricePerToken) || 0)).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20">
                  <div className="text-muted-foreground">Ownership %</div>
                  <div className="font-semibold">100%</div>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Info className="w-4 h-4 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary">Important Notice</p>
                <p className="text-muted-foreground">
                  Once tokens are minted, they will be available for trading on the marketplace. 
                  You'll retain full ownership initially and can choose to sell portions or provide liquidity.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 gradient-primary"
                disabled={mintMutation.isPending}
              >
                {mintMutation.isPending ? (
                  <>
                    <Shield className="w-4 h-4 mr-2 animate-spin" />
                    Minting Tokens...
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 mr-2" />
                    Mint Tokens
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};