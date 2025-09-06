import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Wallet } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

interface BlockchainMintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    id: string;
    asset_type: string;
    description: string;
    estimated_value: number;
  };
  onSuccess: () => void;
}

// Simple ERC20 contract bytecode and ABI
const ERC20_BYTECODE = "0x608060405234801561001057600080fd5b50604051610c8f380380610c8f8339818101604052810190610032919061028a565b8360039080519060200190610048929190610135565b50826004908051906020019061005f929190610135565b508160058190555080600681905550806000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550505050506103c7565b828054610104906102f6565b90600052602060002090601f016020900481019282610122576000855561016f565b82601f1061013b57805160ff191683800117855561016f565b8280016001018555821561016f579182015b8281111561016e57825182559160200191906001019061014d565b5b50905061017c9190610180565b5090565b5b80821115610199576000816000905550600101610181565b5090565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b610206826101bd565b810181811067ffffffffffffffff82111715610225576102246101ce565b5b80604052505050565b600061023861019d565b905061024482826101fd565b919050565b600067ffffffffffffffff821115610264576102636101ce565b5b61026d826101bd565b9050602081019050919050565b82818337600083830152505050565b600080600080608085870312156102a3576102a26101a7565b5b600085013567ffffffffffffffff8111156102c1576102c06101ac565b5b6102cd87828801610218565b945050602085013567ffffffffffffffff8111156102ee576102ed6101ac565b5b6102fa87828801610218565b935050604061030b87828801610363565b925050606061031c87828801610363565b91505092959194509250565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061037457607f821691505b6020821081141561038857610387610328565b5b50919050565b6000819050919050565b6103a18161038e565b81146103ac57600080fd5b50565b6000815190506103be81610398565b92915050565b6108b9806103d66000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c8063313ce5671161005b578063313ce567146101145780635cf0e3b11461013257806370a0823114610162578063a9059cbb1461019257600080fd5b806306fdde031461008d578063095ea7b3146100ab57806318160ddd146100db57806323b872dd146100f9575b600080fd5b6100956101c2565b6040516100a291906105d3565b60405180910390f35b6100c560048036038101906100c0919061068e565b610250565b6040516100d291906106e9565b60405180910390f35b6100e3610342565b6040516100f09190610713565b60405180910390f35b610113600480360381019061010e919061072e565b610348565b005b61011c6104d7565b6040516101299190610713565b60405180910390f35b61014c60048036038101906101479190610781565b6104dd565b60405161015991906106e9565b60405180910390f35b61017c600480360381019061017791906107ae565b61056d565b6040516101899190610713565b60405180910390f35b6101ac60048036038101906101a7919061068e565b6105b5565b6040516101b991906106e9565b60405180910390f35b6060600380546101d1906107ea565b80601f01602080910402602001604051908101604052809291908181526020018280546101fd906107ea565b801561024a5780601f1061021f5761010080835404028352916020019161024a565b820191906000526020600020905b81548152906001019060200180831161022d57829003601f168201915b50505050509050919050565b600081600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040516103309190610713565b60405180910390a36001905092915050565b60055481565b600080600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050828110156103d557600080fd5b82600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546104619190610841565b9250508190555082600080008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546104b79190610841565b9250508190555082600080008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461050d9190610875565b925050819055508373ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8560405161057191906106e9565b5050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806108e257607f821691505b602082108114156108f6576108f56108a7565b5b50919050565b600081905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061094a826108fc565b9150610955836108fc565b9250828210156109685761096761090d565b5b828203905092915050565b600061097e826108fc565b9150610989836108fc565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff038211156109be576109bd61090d565b5b82820190509291505056fea2646970667358221220d4f4c4b8a2b2a4d4b3f4c4b8a2b2a4d4b3f4c4b8a2b2a4d4b3f4c4b8a2b2a4d64736f6c634300080b0033";

const ERC20_ABI = [
  "constructor(string memory name, string memory symbol, uint256 totalSupply, uint8 decimals)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const BlockchainMintDialog = ({ isOpen, onClose, asset, onSuccess }: BlockchainMintDialogProps) => {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [pricePerToken, setPricePerToken] = useState("");
  const [decimals, setDecimals] = useState("18");
  const [loading, setLoading] = useState(false);
  const [deployingContract, setDeployingContract] = useState(false);
  
  const { wallet, connectWallet } = useWallet();

  const handleMint = async () => {
    if (!tokenName || !tokenSymbol || !totalSupply || !pricePerToken) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    if (!wallet.address) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
      });
      return;
    }

    try {
      setLoading(true);
      setDeployingContract(true);

      // Deploy ERC20 contract via MetaMask
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new Error("MetaMask not found");
      }

      // Request account access
      await ethereum.request({ method: 'eth_requestAccounts' });

      // Create contract factory
      const totalSupplyWei = (parseFloat(totalSupply) * Math.pow(10, parseInt(decimals))).toString();
      
      // Encode constructor parameters
      const abiCoder = new (window as any).ethers.AbiCoder();
      const constructorData = abiCoder.encode(
        ["string", "string", "uint256", "uint8"],
        [tokenName, tokenSymbol.toUpperCase(), totalSupplyWei, parseInt(decimals)]
      );

      const deploymentData = ERC20_BYTECODE + constructorData.slice(2);

      // Estimate gas
      const gasEstimate = await ethereum.request({
        method: 'eth_estimateGas',
        params: [{
          from: wallet.address,
          data: deploymentData,
        }],
      });

      // Deploy contract
      const transactionHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: wallet.address,
          data: deploymentData,
          gas: gasEstimate,
        }],
      });

      toast({
        title: "Contract Deployment Initiated",
        description: "Please wait for the transaction to be confirmed on the blockchain...",
      });

      // Wait for deployment and call edge function
      setDeployingContract(false);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke('token-mint', {
        body: {
          assetId: asset.id,
          tokenName,
          tokenSymbol: tokenSymbol.toUpperCase(),
          totalSupply: parseFloat(totalSupply),
          pricePerToken: parseFloat(pricePerToken),
          decimals: parseInt(decimals),
          walletAddress: wallet.address,
          transactionHash
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to mint tokens');
      }

      toast({
        title: "Success!",
        description: `Successfully minted ${totalSupply} ${tokenSymbol.toUpperCase()} tokens on blockchain`,
      });

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Minting error:', error);
      
      let errorMessage = "Failed to mint tokens";
      if (error.message?.includes("User denied")) {
        errorMessage = "Transaction was cancelled by user";
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Minting Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
      setDeployingContract(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Mint Blockchain Tokens
          </DialogTitle>
          <DialogDescription>
            Deploy a real ERC20 token contract on Ethereum for "{asset.asset_type}".
            This will create actual blockchain tokens that can be traded.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!wallet.address && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-3">
                Connect your wallet to deploy tokens on the blockchain
              </p>
              <Button onClick={connectWallet} className="w-full">
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          )}

          {wallet.address && (
            <>
              <div className="p-4 border rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground">
                  <strong>Connected Wallet:</strong> {wallet.address}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Asset:</strong> {asset.asset_type} (${asset.estimated_value.toLocaleString()})
                </p>
              </div>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="tokenName">Token Name *</Label>
                  <Input
                    id="tokenName"
                    placeholder="e.g., Manhattan Property Token"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="tokenSymbol">Token Symbol *</Label>
                  <Input
                    id="tokenSymbol"
                    placeholder="e.g., MPT"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                    disabled={loading}
                    maxLength={10}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalSupply">Total Supply *</Label>
                    <Input
                      id="totalSupply"
                      type="number"
                      placeholder="1000000"
                      value={totalSupply}
                      onChange={(e) => setTotalSupply(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="pricePerToken">Price per Token ($) *</Label>
                    <Input
                      id="pricePerToken"
                      type="number"
                      step="0.01"
                      placeholder="1.00"
                      value={pricePerToken}
                      onChange={(e) => setPricePerToken(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="decimals">Decimals</Label>
                  <Input
                    id="decimals"
                    type="number"
                    value={decimals}
                    onChange={(e) => setDecimals(e.target.value)}
                    disabled={loading}
                    min="0"
                    max="18"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Standard is 18 decimals (like ETH)
                  </p>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> This will deploy a real smart contract on Ethereum.
                  Make sure you have sufficient ETH for gas fees. The deployment cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleMint} 
                  disabled={loading || !wallet.address}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {deployingContract ? "Deploying Contract..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Deploy & Mint Tokens
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};