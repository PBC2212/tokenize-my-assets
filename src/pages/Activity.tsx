import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { activityApi } from "@/lib/api";
import { 
  Activity as ActivityIcon, 
  Building2, 
  ShoppingCart, 
  Droplets, 
  Coins,
  TrendingUp,
  TrendingDown,
  Filter,
  Calendar,
  DollarSign
} from "lucide-react";

const Activity = () => {
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['my-activity'],
    queryFn: () => activityApi.myActivity().then(res => res.data),
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "asset_pledged":
        return Building2;
      case "token_purchase":
      case "token_listing":
      case "marketplace_buy":
      case "marketplace_sell":
        return ShoppingCart;
      case "liquidity_added":
      case "liquidity_removed":
        return Droplets;
      case "token_minted":
        return Coins;
      case "asset_approved":
      case "asset_rejected":
        return TrendingUp;
      case "kyc_submitted":
      case "kyc_approved":
        return ActivityIcon;
      default:
        return ActivityIcon;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "asset_pledged":
        return "text-primary";
      case "token_purchase":
      case "marketplace_buy":
      case "liquidity_added":
        return "text-success";
      case "token_listing":
      case "marketplace_sell":
      case "liquidity_removed":
        return "text-warning";
      case "token_minted":
        return "text-accent";
      case "asset_approved":
      case "kyc_approved":
        return "text-success";
      case "asset_rejected":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: "bg-success/20 text-success", label: "Completed" },
      pending: { color: "bg-warning/20 text-warning", label: "Pending" },
      failed: { color: "bg-destructive/20 text-destructive", label: "Failed" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const filteredActivities = activities.filter((activity: any) => {
    const matchesType = filterType === "all" || activity.type === filterType;
    const matchesStatus = filterStatus === "all" || activity.status === filterStatus;
    return matchesType && matchesStatus;
  });

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups: any, activity: any) => {
    const date = new Date(activity.created_at || activity.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {});

  // Calculate stats
  const totalValue = activities
    .filter((a: any) => a.status === 'completed')
    .reduce((sum: number, activity: any) => sum + (activity.amount || 0), 0);

  const completedActivities = activities.filter((a: any) => a.status === 'completed').length;
  const pendingActivities = activities.filter((a: any) => a.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted/50 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-muted/50 rounded-lg"></div>
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
          Activity History
        </h1>
        <p className="text-muted-foreground">
          Track all your transactions and interactions on the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="gradient-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transaction Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All completed transactions
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {completedActivities}
            </div>
            <p className="text-xs text-muted-foreground">
              Successful transactions
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {pendingActivities}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="gradient-card border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters</span>
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48 bg-muted/50 border-border/50">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="asset_pledged">Asset Pledged</SelectItem>
                <SelectItem value="token_purchase">Token Purchase</SelectItem>
                <SelectItem value="token_listing">Token Listing</SelectItem>
                <SelectItem value="marketplace_buy">Marketplace Buy</SelectItem>
                <SelectItem value="marketplace_sell">Marketplace Sell</SelectItem>
                <SelectItem value="liquidity_added">Liquidity Added</SelectItem>
                <SelectItem value="liquidity_removed">Liquidity Removed</SelectItem>
                <SelectItem value="token_minted">Token Minted</SelectItem>
                <SelectItem value="asset_approved">Asset Approved</SelectItem>
                <SelectItem value="kyc_submitted">KYC Submitted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48 bg-muted/50 border-border/50">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <div className="space-y-6">
        {Object.entries(groupedActivities).length === 0 ? (
          <Card className="gradient-card border-0">
            <CardContent className="py-16 text-center">
              <ActivityIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Activity Found</h3>
              <p className="text-muted-foreground">
                {filterType !== "all" || filterStatus !== "all" 
                  ? "Try adjusting your filters to see more activities"
                  : "Your activity history will appear here as you use the platform"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedActivities).map(([date, dayActivities]: [string, any]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{date}</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>
              
              <div className="space-y-3">
                {dayActivities.map((activity: any, index: number) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <Card key={activity.id} className="gradient-card border-0">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center ${getActivityColor(activity.type)}`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold">
                                  {activity.type.split('_').map((word: string) => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                  ).join(' ')}
                                </h4>
                                {getStatusBadge(activity.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {activity.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            {activity.amount && (
                              <div className="text-lg font-semibold">
                                ${activity.amount.toLocaleString()}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {new Date(activity.created_at || activity.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Activity;