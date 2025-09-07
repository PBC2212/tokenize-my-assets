-- Create enum for KYC status
CREATE TYPE public.kyc_status_enum AS ENUM ('pending', 'verified', 'rejected');

-- Create users table for wallet-based authentication
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  kyc_status kyc_status_enum NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own record" 
ON public.users 
FOR SELECT 
USING (wallet_address = current_setting('app.current_wallet_address', true));

CREATE POLICY "Users can update their own record" 
ON public.users 
FOR UPDATE 
USING (wallet_address = current_setting('app.current_wallet_address', true));

-- Create function to update timestamps
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get or create user by wallet address
CREATE OR REPLACE FUNCTION public.get_or_create_user_by_wallet(
  _wallet_address TEXT
)
RETURNS TABLE(
  id UUID,
  wallet_address TEXT,
  kyc_status kyc_status_enum,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to get existing user
  RETURN QUERY
  SELECT u.id, u.wallet_address, u.kyc_status, u.created_at, u.updated_at
  FROM public.users u
  WHERE u.wallet_address = _wallet_address;
  
  -- If no user found, create one
  IF NOT FOUND THEN
    INSERT INTO public.users (wallet_address)
    VALUES (_wallet_address)
    RETURNING public.users.id, public.users.wallet_address, public.users.kyc_status, public.users.created_at, public.users.updated_at
    INTO id, wallet_address, kyc_status, created_at, updated_at;
    
    RETURN NEXT;
  END IF;
END;
$$;