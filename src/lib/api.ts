import { supabase } from '@/integrations/supabase/client';

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

// KYC API - using Supabase
export const kycApi = {
  submit: async (data: { documents?: string[] }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data: kycData, error } = await supabase
      .from('kyc_submissions')
      .insert({
        user_id: user.id,
        documents: data.documents || [],
        status: 'pending'
      })
      .select()
      .single();
      
    if (error) throw error;
    return { data: kycData };
  },
  
  upload: async (formData: FormData) => {
    // For now, just return success - file upload would need storage setup
    return { data: { success: true } };
  },
  
  status: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error) throw error;
    return { data: data || { status: 'pending', submitted_at: null, reviewed_at: null, rejection_reason: null } };
  },
};

// Assets API - using Supabase
export const assetsApi = {
  pledge: async (data: { assetType: string; description: string; estimatedValue: number; documents?: string[] }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data: assetData, error } = await supabase
      .from('user_assets')
      .insert({
        user_id: user.id,
        asset_type: data.assetType,
        description: data.description,
        estimated_value: data.estimatedValue,
        documents: data.documents || [],
        status: 'under_review'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Create activity record
    await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        type: 'Asset Pledged',
        description: `Pledged ${data.assetType} worth $${data.estimatedValue.toLocaleString()}`,
        amount: data.estimatedValue,
        status: 'completed'
      });
      
    return { data: assetData };
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
  
  pledged: async () => {
    return assetsApi.mine(); // Same as mine for now
  },
  
  myAssets: async () => {
    return assetsApi.mine(); // Same as mine for now
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
    decimals?: number 
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // Check if user owns the asset
    const { data: asset } = await supabase
      .from('user_assets')
      .select('*')
      .eq('id', assetId)
      .eq('user_id', user.id)
      .single();
      
    if (!asset) throw new Error('Asset not found or not owned by user');
    
    const { data: tokenResult, error } = await supabase
      .from('tokens')
      .insert({
        asset_id: assetId,
        token_name: tokenData.tokenName,
        token_symbol: tokenData.tokenSymbol,
        total_supply: tokenData.totalSupply,
        price_per_token: tokenData.pricePerToken,
        decimals: tokenData.decimals || 18,
        contract_address: `0x${Math.random().toString(16).substr(2, 40)}` // Mock address
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Update asset status to tokenized
    await supabase
      .from('user_assets')
      .update({ 
        status: 'tokenized',
        token_id: tokenResult.id 
      })
      .eq('id', assetId);
      
    // Create activity record
    await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        type: 'Token Minted',
        description: `Minted ${tokenData.totalSupply} ${tokenData.tokenSymbol} tokens`,
        amount: tokenData.totalSupply * tokenData.pricePerToken,
        status: 'completed'
      });
      
    return { data: tokenResult };
  },
};

// Marketplace API - using Supabase
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
    return { data: data || [] };
  },
  
  buy: async (data: { tokenId: string; amount: number }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // This would need more complex logic for actual trading
    return { data: { success: true } };
  },
  
  buyWithId: async (tokenId: string, data: { amount: number }) => {
    return marketplaceApi.buy({ tokenId, amount: data.amount });
  },
  
  sell: async (data: { tokenId: string; amount: number; price: number }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data: listing, error } = await supabase
      .from('marketplace_listings')
      .insert({
        token_id: data.tokenId,
        seller_id: user.id,
        amount: data.amount,
        price_per_token: data.price,
        total_price: data.amount * data.price,
        status: 'active'
      })
      .select()
      .single();
      
    if (error) throw error;
    return { data: listing };
  },
  
  sellWithId: async (tokenId: string, data: { amount: number; price: number }) => {
    return marketplaceApi.sell({ tokenId, amount: data.amount, price: data.price });
  },
};

// Liquidity API - using Supabase
export const liquidityApi = {
  pools: async () => {
    const { data, error } = await supabase
      .from('liquidity_pools')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return { data: data || [] };
  },
  
  provide: async (data: { poolId: string; amount: number }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data: position, error } = await supabase
      .from('liquidity_positions')
      .insert({
        user_id: user.id,
        pool_id: data.poolId,
        amount: data.amount,
        lp_tokens: data.amount,
        entry_price: 1.0 // Simplified
      })
      .select()
      .single();
      
    if (error) throw error;
    return { data: position };
  },
  
  add: async (data: { poolId: string; amount: number }) => {
    return liquidityApi.provide(data);
  },
  
  withdraw: async (data: { poolId: string; amount: number }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // This would need more complex logic for actual withdrawal
    return { data: { success: true } };
  },
  
  remove: async (data: { poolId: string; amount: number }) => {
    return liquidityApi.withdraw(data);
  },
};

// Activity API - using Supabase
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
    const { data, error } = await supabase.functions.invoke('wallet-transactions');
    
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

// Health API - using Supabase
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