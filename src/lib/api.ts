import { supabase } from '@/integrations/supabase/client';
import { calculationEngine } from './calculations';
import { priceOracle } from './oracles';

// Database types based on our Supabase schema
interface UserAsset {
  id: string;
  user_id: string;
  asset_type: string;
  description: string;
  estimated_value: number;
  status: string;
  documents: string[] | null;
  submitted_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  token_id: string | null;
  contract_address: string | null;
  created_at: string;
  updated_at: string;
}

interface Token {
  id: string;
  asset_id: string;
  token_name: string;
  token_symbol: string;
  total_supply: string;
  price_per_token: number;
  decimals: number;
  fractional: boolean;
  token_type: string;
  contract_address: string;
  created_at: string;
  updated_at: string;
}

interface Activity {
  id: string;
  user_id: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  timestamp: string;
  metadata: any;
  created_at: string;
}

interface KycSubmission {
  id: string;
  user_id: string;
  status: string;
  documents: string[] | null;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface MarketplaceListing {
  id: string;
  token_id: string;
  seller_id: string;
  amount: string;
  price_per_token: number;
  total_price: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface LiquidityPool {
  id: string;
  name: string;
  token_a: string;
  token_b: string;
  token_a_id: string | null;
  token_b_id: string | null;
  total_liquidity: number;
  apr: number;
  volume_24h: number;
  fees_24h: number;
  contract_address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LiquidityPosition {
  id: string;
  user_id: string;
  pool_id: string;
  amount: string;
  lp_tokens: string;
  entry_price: number;
  created_at: string;
  updated_at: string;
}

// Auth API - using Supabase directly, keeping these for compatibility
export const authApi = {
  register: async (data: { email: string; password: string; name: string }) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name: data.name }
      }
    });
    
    if (error) throw error;
    return { data: { success: true, message: 'User registered successfully' } };
  },
  
  login: async (data: { email: string; password: string }) => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    
    if (error) throw error;
    return { data: { success: true, user: authData.user } };
  },
  
  me: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { data: user };
  },
};

// Enhanced KYC API
export const kycApi = {
  submit: async (data: { documents?: string[]; personalInfo?: any; walletAddress?: string }) => {
    const { data: result, error } = await supabase.functions.invoke('kyc-management', {
      body: data
    });
    
    if (error) throw error;
    return { data: result.data };
  },
  
  upload: async (formData: FormData) => {
    // For now, just return success - file upload would need storage setup
    return { data: { success: true } };
  },
  
  status: async () => {
    const { data: result, error } = await supabase.functions.invoke('kyc-management', {
      method: 'GET'
    });
    
    if (error) throw error;
    return { data: result.data };
  },
};

// Enhanced Assets API
export const assetsApi = {
  pledge: async (data: { assetType: string; description: string; estimatedValue: number; documents?: Array<{name: string; url: string; type: string; size: number}>; walletAddress?: string }) => {
    const { data: result, error } = await supabase.functions.invoke('asset-pledge', {
      body: data
    });
    
    if (error) throw error;
    return { data: result.data };
  },
  
  mine: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('user_assets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return { data: data || [] };
  },

  // Approve or reject an asset (admin function)
  approve: async (assetId: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    const response = await supabase.functions.invoke('asset-approval', {
      body: { assetId, action, rejectionReason }
    });
    if (response.error) throw response.error;
    return response;
  },
  
  pledged: async () => {
    return assetsApi.mine();
  },
  
  myAssets: async () => {
    return assetsApi.mine();
  },
  
  marketplace: async () => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return { data: data || [] };
  },
  
  mint: async (assetId: string, tokenData: { 
    tokenName: string; 
    tokenSymbol: string; 
    totalSupply: number; 
    pricePerToken: number; 
    decimals?: number;
    walletAddress?: string;
    transactionHash?: string;
  }) => {
    const { data: result, error } = await supabase.functions.invoke('token-mint', {
      body: {
        assetId,
        ...tokenData,
        decimals: tokenData.decimals || 18
      }
    });
    
    if (error) throw error;
    return { data: result.data };
  },
};

// Enhanced Marketplace API
export const marketplaceApi = {
  listings: async () => {
    const { data, error } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        tokens (*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Update listings with current market prices
    const listingsWithCurrentPrices = await Promise.all(
      (data || []).map(async (listing) => {
        const currentPrice = await calculationEngine.calculateMarketPrice(listing.token_id);
        const change24h = ((currentPrice - listing.price_per_token) / listing.price_per_token) * 100;
        
        return {
          ...listing,
          current_price: currentPrice,
          change24h: change24h,
          // Calculate market metrics
          nav: currentPrice * parseFloat(listing.amount.toString()),
          liquidity: currentPrice * parseFloat(listing.amount.toString()) * 0.8 // 80% liquidity assumption
        };
      })
    );
    
    return { data: listingsWithCurrentPrices };
  },
  
  buy: async (data: { tokenId: string; amount: number; walletAddress?: string; transactionHash?: string }) => {
    const { data: result, error } = await supabase.functions.invoke('marketplace-trade', {
      body: {
        type: 'buy',
        ...data
      }
    });
    
    if (error) throw error;
    return { data: result };
  },
  
  buyWithId: async (tokenId: string, data: { amount: number; walletAddress?: string; transactionHash?: string }) => {
    return marketplaceApi.buy({ tokenId, ...data });
  },
  
  sell: async (data: { tokenId: string; amount: number; price: number; walletAddress?: string; transactionHash?: string }) => {
    const { data: result, error } = await supabase.functions.invoke('marketplace-trade', {
      body: {
        type: 'sell',
        ...data
      }
    });
    
    if (error) throw error;
    return { data: result };
  },
  
  sellWithId: async (tokenId: string, data: { amount: number; price: number; walletAddress?: string; transactionHash?: string }) => {
    return marketplaceApi.sell({ tokenId, ...data });
  },
};

// Enhanced Liquidity API
export const liquidityApi = {
  pools: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get all pools
    const { data: pools, error } = await supabase
      .from('liquidity_pools')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Calculate real-time metrics for each pool
    const poolsWithMetrics = await Promise.all(
      (pools || []).map(async (pool) => {
        const metrics = await calculationEngine.calculateLiquidityMetrics(pool.id, user?.id);
        return {
          ...pool,
          total_liquidity: metrics.totalLiquidity,
          apr: metrics.apr,
          volume_24h: metrics.volume24h,
          fees_24h: metrics.fees24h,
          my_liquidity: metrics.userLiquidity,
          user_fees_24h: metrics.userFees24h
        };
      })
    );
    
    return { data: poolsWithMetrics };
  },
  
  provide: async (data: { poolId: string; amount: number; walletAddress?: string; transactionHash?: string }) => {
    const { data: result, error } = await supabase.functions.invoke('liquidity-management', {
      body: {
        type: 'add',
        ...data
      }
    });
    
    if (error) throw error;
    return { data: result };
  },
  
  add: async (data: { poolId: string; amount: number; walletAddress?: string; transactionHash?: string }) => {
    return liquidityApi.provide(data);
  },
  
  withdraw: async (data: { poolId: string; amount: number; walletAddress?: string; transactionHash?: string }) => {
    const { data: result, error } = await supabase.functions.invoke('liquidity-management', {
      body: {
        type: 'remove',
        ...data
      }
    });
    
    if (error) throw error;
    return { data: result };
  },
  
  remove: async (data: { poolId: string; amount: number; walletAddress?: string; transactionHash?: string }) => {
    return liquidityApi.withdraw(data);
  },
};

// Activity API
export const activityApi = {
  mine: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(50);
      
    if (error) throw error;
    return { data: data || [] };
  },
  
  myActivity: async () => {
    return activityApi.mine();
  },
};

// Wallet API
export const walletApi = {
  verify: async (data: { 
    walletAddress: string; 
    signature: string; 
    message: string; 
    nonce: string; 
  }): Promise<{ data: any }> => {
    const { data: result, error } = await supabase.functions.invoke('wallet-verification', {
      body: data
    });
    
    if (error) throw error;
    return { data: result };
  },

  getTransactions: async (): Promise<{ data: any[] }> => {
    const { data, error } = await supabase.functions.invoke('wallet-transactions', {
      method: 'GET'
    });
    
    if (error) throw error;
    return { data: data.transactions || [] };
  },

  recordTransaction: async (transactionData: {
    transactionHash: string;
    walletAddress: string;
    fromAddress: string;
    toAddress: string;
    valueWei: string;
    valueEth?: number;
    gasUsed?: number;
    gasPrice?: string;
    blockNumber?: number;
    blockHash?: string;
    chainId?: number;
    transactionType?: string;
    tokenContractAddress?: string;
    tokenSymbol?: string;
    tokenDecimals?: number;
  }): Promise<{ data: any }> => {
    const { data, error } = await supabase.functions.invoke('wallet-transactions', {
      body: transactionData,
    });
    
    if (error) throw error;
    return { data };
  },
};

// Dashboard API
export const dashboardApi = {
  stats: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Use calculation engine for accurate, real-time data
    const portfolioMetrics = await calculationEngine.calculatePortfolioValue(user.id);

    // Get asset counts and IDs
    const { data: assets } = await supabase
      .from('user_assets')
      .select('id, status')
      .eq('user_id', user.id);

    // Get transaction totals from activities table (where actual data is stored)
    const { data: activities } = await supabase
      .from('activities')
      .select('amount, type')
      .eq('user_id', user.id);

    // Get token data for token count
    const { data: tokens } = await supabase
      .from('tokens')
      .select('id, total_supply')
      .in('asset_id', assets?.map(a => a.id) || []);

    // Get liquidity positions
    const { data: positions } = await supabase
      .from('liquidity_positions')
      .select('amount')
      .eq('user_id', user.id);

    const totalAssets = assets?.length || 0;
    const activeAssets = assets?.filter(a => a.status === 'approved').length || 0;
    const pendingAssets = assets?.filter(a => a.status === 'under_review').length || 0;
    
    // Calculate total invested from activities (pledged assets + token investments)
    const totalInvested = activities?.filter(activity => 
      ['asset_pledged', 'token_purchased', 'token_minted'].includes(activity.type)
    ).reduce((sum, activity) => sum + (activity.amount || 0), 0) || 0;
    
    // Calculate total transactions from activities
    const totalTransactions = activities?.length || 0;
    
    // Calculate total tokens minted
    const totalTokens = tokens?.reduce((sum, token) => sum + parseFloat(token.total_supply?.toString() || '0'), 0) || 0;

    // Calculate total liquidity
    const totalLiquidity = positions?.reduce((sum, pos) => sum + parseFloat(pos.amount?.toString() || '0'), 0) || 0;

    return {
      data: {
        portfolioValue: portfolioMetrics.totalValue,
        activeAssets,
        totalAssets,
        pendingAssets,
        totalInvested,
        totalLiquidity,
        totalTokens,
        totalTransactions,
        change24h: portfolioMetrics.change24h,
        changeAmount: portfolioMetrics.changeAmount,
        assetBreakdown: portfolioMetrics.assetBreakdown
      }
    };
  },

  portfolioBreakdown: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: assets } = await supabase
      .from('user_assets')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'approved');

    const breakdown = assets?.reduce((acc, asset) => {
      const type = asset.asset_type;
      if (!acc[type]) {
        acc[type] = { type, count: 0, value: 0 };
      }
      acc[type].count++;
      acc[type].value += asset.estimated_value || 0;
      return acc;
    }, {} as Record<string, any>) || {};

    const total = Object.values(breakdown).reduce((sum: number, item: any) => sum + item.value, 0);
    
    return {
      data: Object.values(breakdown).map((item: any) => ({
        ...item,
        percentage: total > 0 ? (item.value / total) * 100 : 0
      }))
    };
  },

  recentActivity: async (page = 1, limit = 5) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    return {
      data: {
        activities: activities || [],
        totalCount: activities?.length || 0,
        page,
        limit
      }
    };
  },

  marketOverview: async () => {
    // Get total market stats
    const { data: allAssets } = await supabase
      .from('user_assets')
      .select('estimated_value')
      .eq('status', 'approved');

    const { data: totalUsers } = await supabase
      .from('profiles')
      .select('id');

    const { data: transactions } = await supabase
      .from('transactions')
      .select('total_value, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const totalMarketValue = allAssets?.reduce((sum, asset) => sum + (asset.estimated_value || 0), 0) || 0;
    const total24hVolume = transactions?.reduce((sum, tx) => sum + (tx.total_value || 0), 0) || 0;

    return {
      data: {
        totalMarketValue,
        totalAssets: allAssets?.length || 0,
        total24hVolume,
        totalUsers: totalUsers?.length || 0
      }
    };
  }
};

// Health API
export const healthApi = {
  check: async () => {
    try {
      const { data, error } = await supabase
        .from('liquidity_pools')
        .select('count')
        .limit(1);
        
      if (error) throw error;
      
      return { 
        data: { 
          status: 'ok', 
          timestamp: new Date().toISOString(), 
          version: '2.0.0',
          database: 'connected'
        } 
      };
    } catch (error) {
      return { 
        data: { 
          status: 'error', 
          timestamp: new Date().toISOString(), 
          version: '2.0.0',
          database: 'disconnected'
        } 
      };
    }
  },
};
