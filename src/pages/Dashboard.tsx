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
  Zap,
  PieChart
} from "lucide-react";
import { MintTokenDialog } from "@/components/MintTokenDialog";
import { Link } from "react-router-dom";

// Add dashboard API functions to your api.ts file or create them here
const dashboardApi = {
  stats: () => fetch('/api/dashboard/stats', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(res => res.json()),
  
  portfolioBreakdown: () => fetch('/api/dashboard/portfolio-breakdown', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(res => res.json()),
  
  recentActivity: (page = 1, limit = 5) => fetch(`/api/dashboard/recent-activity?page=${page}&limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(res => res.json()),
  
  assetPerformance: () => fetch('/api/dashboard/asset-performance', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(res => res.json()),
  
  marketOverview: () => fetch('/api/dashboard/market-overview', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(res => res.json())
};

const Dashboard = () => {
  const { user } = useAuth();

  // Use new dashboard endpoints
  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.stats,
  });

  const { data: portfolioBreakdown = [] } = useQuery({
    queryKey: ['portfolio-breakdown'],
    queryFn: dashboardApi.portfolioBreakdown,
  });

  const { data: recentActivityData } = useQuery({
    queryKey: ['dashboard-recent-activity'],
    queryFn: () => dashboardApi.recentActivity(1, 5),
  });

  const { data: assetPerformance = [] } = useQuery({
    queryKey: ['asset-performance'],
    queryFn: dashboardApi.assetPerformance,
  });

  const { data: marketOverview } = useQuery({
    queryKey: ['market-overview'],
    queryFn: dashboardApi.marketOverview,
  });

  // Keep existing queries for backward compatibility
  const { data: assets = [] } = useQuery({
    queryKey: ['my-assets'],
    queryFn: () => assetsApi.myAssets().then(res => res.data),
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['marketplace-listings'],
    queryFn: () => marketplaceApi.listings().then(res => res.data),
  });

  // Use new dashboard data with fallbacks
  const stats = dashboardStats || {};
  const recentActivities = recentActivityData?.activities || [];
  const readyToMint = assets.filter((asset: any) => asset.status === 'approved');

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Welcome back, {user?.user_metadata?.name || user?.email?.split('@')[0]}!
        </h1>
        <p className="text-muted-foreground">
          Manage your tokenized assets and explore new investment opportunities.
        </p>
      </div>

      {/* Stats Cards - Now using real API data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="gradient-card border-0 animate-float">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Portfolio Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${(stats.portfolioValue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className={`inline w-3 h-3 mr-1 ${
                (stats.change24h || 0) >= 0 ? 'text-success' : 'text-destructive'
              }`} />
              {(stats.change24h || 0) >= 0 ? '+' : ''}{(stats.change24h || 0).toFixed(1)}% (${(stats.changeAmount || 0).toLocaleString()})
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
            <div className="text-2xl font-bold text-foreground">{stats.activeAssets || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAssets || 0} total assets • {stats.pendingAssets || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 animate-float" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invested
            </CardTitle>
            <Wallet className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${(stats.totalInvested || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTokens || 0} tokens • {stats.totalTransactions || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 animate-float" style={{ animationDelay: '0.6s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Liquidity Provided
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ${(stats.totalLiquidity || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Active liquidity positions
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

        {/* Portfolio Breakdown */}
        <Card className="gradient-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-accent" />
              <span>Portfolio Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {portfolioBreakdown.length > 0 ? (
              portfolioBreakdown.slice(0, 3).map((item: any) => (
                <div key={item.type} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                  <div>
                    <p className="text-sm font-medium">{item.type}</p>
                    <p className="text-xs text-muted-foreground">{item.count} assets</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${item.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <PieChart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No assets yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ready to Mint Assets */}
        {readyToMint.length > 0 && (
          <Card className="gradient-card border-0 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-primary" />
                <span>Ready to Mint</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You have {readyToMint.length} approved asset{readyToMint.length !== 1 ? 's' : ''} ready for tokenization
              </p>
              {readyToMint.slice(0, 2).map((asset: any) => (
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
              {readyToMint.length > 2 && (
                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link to="/assets">
                    View All Assets <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity - Now using paginated endpoint */}
      <Card className="gradient-card border-0">
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
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-medium text-foreground">
                      ${(activity.amount || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
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

      {/* Market Overview & Trending Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Overview */}
        <Card className="gradient-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <span>Market Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketOverview ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/20">
                    <p className="text-lg font-bold">${marketOverview.totalMarketValue?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Market Value</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/20">
                    <p className="text-lg font-bold">{marketOverview.totalAssets || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Assets</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/20">
                    <p className="text-lg font-bold">${marketOverview.total24hVolume?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">24h Volume</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/20">
                    <p className="text-lg font-bold">{marketOverview.totalUsers || 0}</p>
                    <p className="text-xs text-muted-foreground">Active Users</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Loading market data...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trending Assets */}
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
            <div className="space-y-3">
              {listings.slice(0, 4).map((listing: any) => (
                <div key={listing.id || listing._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <div>
                    <p className="font-medium text-sm">{listing.tokenSymbol}</p>
                    <p className="text-xs text-muted-foreground">{listing.assetName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${listing.price}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      listing.change24h > 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                    }`}>
                      {listing.change24h > 0 ? '+' : ''}{listing.change24h}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;