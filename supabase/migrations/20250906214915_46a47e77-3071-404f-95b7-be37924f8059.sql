-- Create wallet_connections table for storing user wallet addresses
CREATE TABLE public.wallet_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_address TEXT NOT NULL UNIQUE,
  wallet_type TEXT NOT NULL DEFAULT 'metamask',
  chain_id INTEGER NOT NULL DEFAULT 1,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  signature TEXT,
  nonce TEXT,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet connections
CREATE POLICY "Users can view their own wallet connections" 
ON public.wallet_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet connections" 
ON public.wallet_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet connections" 
ON public.wallet_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create wallet_transactions table for blockchain transaction history
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL UNIQUE,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  value_wei TEXT NOT NULL,
  value_eth NUMERIC,
  gas_used BIGINT,
  gas_price TEXT,
  block_number BIGINT,
  block_hash TEXT,
  chain_id INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_type TEXT NOT NULL DEFAULT 'transfer',
  token_contract_address TEXT,
  token_symbol TEXT,
  token_decimals INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet transactions
CREATE POLICY "Users can view their own wallet transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet transactions" 
ON public.wallet_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_wallet_connections_updated_at
BEFORE UPDATE ON public.wallet_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallet_transactions_updated_at
BEFORE UPDATE ON public.wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_wallet_connections_user_id ON public.wallet_connections(user_id);
CREATE INDEX idx_wallet_connections_wallet_address ON public.wallet_connections(wallet_address);
CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_wallet_address ON public.wallet_transactions(wallet_address);
CREATE INDEX idx_wallet_transactions_hash ON public.wallet_transactions(transaction_hash);