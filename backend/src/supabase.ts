import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gmirigexmcukcbvzywtc.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtaXJpZ2V4bWN1a2Nidnp5d3RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjY1MjE0MiwiZXhwIjoyMDcyMjI4MTQyfQ.qUEJKo4C0Mx8jtkfDbOzZsDUk5Ktq-eLLeW_6xajHoU";

// Create Supabase client with service role for backend operations
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types based on our Supabase schema
export interface UserAsset {
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

export interface Token {
  id: string;
  asset_id: string;
  token_name: string;
  token_symbol: string;
  total_supply: number;
  price_per_token: number;
  decimals: number;
  fractional: boolean;
  token_type: string;
  contract_address: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
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

export interface KycSubmission {
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

export interface MarketplaceListing {
  id: string;
  token_id: string;
  seller_id: string;
  amount: number;
  price_per_token: number;
  total_price: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LiquidityPool {
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

export interface LiquidityPosition {
  id: string;
  user_id: string;
  pool_id: string;
  amount: number;
  lp_tokens: number;
  entry_price: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: string;
  token_id: string | null;
  amount: number;
  price: number | null;
  total_value: number;
  status: string;
  blockchain_tx_hash: string | null;
  blockchain_status: string | null;
  created_at: string;
  updated_at: string;
}