-- Create user profiles table to store additional user data
CREATE TABLE public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_assets table
CREATE TABLE public.user_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_type TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_value DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'under_review' CHECK (status IN ('under_review', 'approved', 'rejected', 'tokenized')),
  documents TEXT[],
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  token_id UUID,
  contract_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create tokens table
CREATE TABLE public.tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.user_assets(id) ON DELETE CASCADE NOT NULL,
  token_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  total_supply DECIMAL(20,0) NOT NULL,
  price_per_token DECIMAL(15,2) NOT NULL,
  decimals INTEGER DEFAULT 18,
  fractional BOOLEAN DEFAULT false,
  token_type TEXT DEFAULT 'ERC20',
  contract_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create KYC submissions table
CREATE TABLE public.kyc_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  documents TEXT[],
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create marketplace listings table
CREATE TABLE public.marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID REFERENCES public.tokens(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(20,0) NOT NULL,
  price_per_token DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'mint', 'transfer', 'liquidity_add', 'liquidity_remove')),
  token_id UUID REFERENCES public.tokens(id),
  amount DECIMAL(20,0) NOT NULL,
  price DECIMAL(15,2),
  total_value DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  blockchain_tx_hash TEXT,
  blockchain_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create liquidity pools table
CREATE TABLE public.liquidity_pools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  token_a TEXT NOT NULL,
  token_b TEXT NOT NULL,
  token_a_id UUID REFERENCES public.tokens(id),
  token_b_id UUID REFERENCES public.tokens(id),
  total_liquidity DECIMAL(15,2) DEFAULT 0,
  apr DECIMAL(5,2) DEFAULT 0,
  volume_24h DECIMAL(15,2) DEFAULT 0,
  fees_24h DECIMAL(15,2) DEFAULT 0,
  contract_address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create liquidity positions table
CREATE TABLE public.liquidity_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pool_id UUID REFERENCES public.liquidity_pools(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(20,0) NOT NULL,
  lp_tokens DECIMAL(20,0) NOT NULL,
  entry_price DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidity_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidity_positions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_assets
CREATE POLICY "Users can view their own assets" ON public.user_assets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own assets" ON public.user_assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assets" ON public.user_assets
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for tokens (publicly viewable, owner can modify)
CREATE POLICY "Everyone can view tokens" ON public.tokens
  FOR SELECT USING (true);
CREATE POLICY "Asset owners can insert tokens" ON public.tokens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_assets 
      WHERE id = asset_id AND user_id = auth.uid()
    )
  );

-- Create RLS policies for activities
CREATE POLICY "Users can view their own activities" ON public.activities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activities" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for KYC submissions
CREATE POLICY "Users can view their own KYC" ON public.kyc_submissions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own KYC" ON public.kyc_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own KYC" ON public.kyc_submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for marketplace listings (publicly viewable)
CREATE POLICY "Everyone can view marketplace listings" ON public.marketplace_listings
  FOR SELECT USING (true);
CREATE POLICY "Users can insert their own listings" ON public.marketplace_listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update their own listings" ON public.marketplace_listings
  FOR UPDATE USING (auth.uid() = seller_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for liquidity pools (publicly viewable)
CREATE POLICY "Everyone can view liquidity pools" ON public.liquidity_pools
  FOR SELECT USING (true);

-- Create RLS policies for liquidity positions
CREATE POLICY "Users can view their own positions" ON public.liquidity_positions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own positions" ON public.liquidity_positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own positions" ON public.liquidity_positions
  FOR UPDATE USING (auth.uid() = user_id);

-- Add foreign key constraint for tokens.asset_id
ALTER TABLE public.tokens ADD CONSTRAINT fk_tokens_asset_id 
  FOREIGN KEY (asset_id) REFERENCES public.user_assets(id) ON DELETE CASCADE;

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_assets_updated_at BEFORE UPDATE ON public.user_assets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tokens_updated_at BEFORE UPDATE ON public.tokens 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kyc_submissions_updated_at BEFORE UPDATE ON public.kyc_submissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON public.marketplace_listings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_liquidity_pools_updated_at BEFORE UPDATE ON public.liquidity_pools 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_liquidity_positions_updated_at BEFORE UPDATE ON public.liquidity_positions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert sample data
INSERT INTO public.liquidity_pools (name, token_a, token_b, apr, total_liquidity, volume_24h, fees_24h) VALUES
('REI/USDC Pool', 'REI', 'USDC', 12.5, 5000000, 250000, 125),
('GOLD/ETH Pool', 'GOLD', 'ETH', 8.3, 2500000, 180000, 90);