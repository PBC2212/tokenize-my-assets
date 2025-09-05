import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { assetsApi, marketplaceApi, activityApi } from "@/lib/api";
import { 
  TrendingUp, 
  Wallet, 
  Building2, 
  Activity,
  Plus,
  ArrowUpRight,
  DollarSign,
  Coins,
  Zap
} from "lucide-react";
import { MintTokenDialog } from "@/components/MintTokenDialog";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();

  const { data: assets = [] } = useQuery({
    queryKey: ['my-assets'],
    queryFn: () => assetsApi.myAssets().then(res => res.data),
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['marketplace-listings'],
    queryFn: () => marketplaceApi.listings().then(res => res.data),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['my-activity'],
    queryFn: () => activityApi.myActivity().then(res => res.data),
  });

  const totalAssetValue = assets.reduce((sum: number, asset: any) => sum + (asset.estimatedValue || 0), 0);
  const activeAssets = assets.filter((asset: any) => asset.status === 'approved').length;
  const readyToMint = assets.filter((asset: any) => asset.status === 'approved').length;
  const recentActivities = activities.slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Welcome back, {user?.name}
        </h1>
        <p className="text-muted-foreground">
          Manage your tokenized assets and explore new investment opportunities.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="gradient-card border-0 animate-float">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Asset Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalAssetValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3 mr-1 text-success" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 animate-float" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Assets
            </CardTitle>
            <Building2 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeAssets}</div>
            <p className="text-xs text-muted-foreground">
              {assets.length} total pledged
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 animate-float" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Portfolio Tokens
            </CardTitle>
            <Wallet className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">24</div>
            <p className="text-xs text-muted-foreground">
              Across {listings.length} different assets
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 animate-float" style={{ animationDelay: '0.6s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month's Yield
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">$2,450</div>
            <p className="text-xs text-muted-foreground">
              +8.2% yield rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="gradient-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-accent" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full gradient-primary">
              <Link to="/assets/pledge">
                <Building2 className="w-4 h-4 mr-2" />
                Pledge New Asset
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/marketplace">
                <TrendingUp className="w-4 h-4 mr-2" />
                Browse Marketplace
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/liquidity">
                <Wallet className="w-4 h-4 mr-2" />
                Add Liquidity
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Ready to Mint Assets */}
        {readyToMint > 0 && (
          <Card className="gradient-card border-0 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-primary" />
                <span>Ready to Mint</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You have {readyToMint} approved asset{readyToMint !== 1 ? 's' : ''} ready for tokenization
              </p>
              {assets
                .filter((asset: any) => asset.status === 'approved')
                .slice(0, 2)
                .map((asset: any) => (
                  <div key={asset.id} className="p-3 rounded-lg bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{asset.assetType}</span>
                      <span className="text-sm text-success font-semibold">
                        ${asset.estimatedValue?.toLocaleString()}
                      </span>
                    </div>
                    <MintTokenDialog asset={asset}>
                      <Button size="sm" className="w-full gradient-primary">
                        <Coins className="w-4 h-4 mr-2" />
                        Mint Tokens
                      </Button>
                    </MintTokenDialog>
                  </div>
                ))}
              {readyToMint > 2 && (
                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link to="/assets">
                    View All Assets <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="gradient-card border-0 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-accent" />
                <span>Recent Activity</span>
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/activity">
                  View All <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity: any) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/20">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activity.type}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent activity</p>
                <p className="text-sm text-muted-foreground">Start by pledging your first asset</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Featured Marketplace Items */}
      <Card className="gradient-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <span>Trending Assets</span>
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/marketplace">
                View All <ArrowUpRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {listings.slice(0, 3).map((listing: any) => (
              <div key={listing.id} className="p-4 rounded-lg bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{listing.tokenSymbol}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    listing.change24h > 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                  }`}>
                    {listing.change24h > 0 ? '+' : ''}{listing.change24h}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{listing.assetName}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">${listing.price}</span>
                  <Button size="sm" variant="secondary">
                    Trade
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;