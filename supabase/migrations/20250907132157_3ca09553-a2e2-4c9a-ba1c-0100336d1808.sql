-- Fix profiles table RLS policies to work with wallet authentication
-- First, drop the existing policies that don't work with wallet auth
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;  
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a function to get the current wallet user from the users table
CREATE OR REPLACE FUNCTION public.get_current_wallet_user()
RETURNS UUID AS $$
DECLARE
  current_wallet TEXT;
  wallet_user_id UUID;
BEGIN
  -- Get the current wallet address from session
  current_wallet := current_setting('app.current_wallet_address', true);
  
  IF current_wallet IS NULL OR current_wallet = '' THEN
    RETURN NULL;
  END IF;
  
  -- Find the user by wallet address
  SELECT id INTO wallet_user_id 
  FROM public.users 
  WHERE wallet_address = current_wallet;
  
  RETURN wallet_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create new secure RLS policies for profiles
-- SELECT: Users can only view their own profile
CREATE POLICY "Wallet users can view their own profile" 
ON public.profiles FOR SELECT 
USING (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

-- INSERT: Users can only insert their own profile  
CREATE POLICY "Wallet users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

-- UPDATE: Users can only update their own profile
CREATE POLICY "Wallet users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);