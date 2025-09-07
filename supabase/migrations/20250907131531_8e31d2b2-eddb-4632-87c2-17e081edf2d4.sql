-- First, let's create a function to get the current wallet user
CREATE OR REPLACE FUNCTION public.get_current_wallet_user_id()
RETURNS UUID AS $$
DECLARE
  current_wallet TEXT;
  user_id UUID;
BEGIN
  -- Get the current wallet address from the session
  current_wallet := current_setting('app.current_wallet_address', true);
  
  IF current_wallet IS NULL OR current_wallet = '' THEN
    RETURN NULL;
  END IF;
  
  -- Find the user by wallet address
  SELECT id INTO user_id 
  FROM public.users 
  WHERE wallet_address = current_wallet;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing storage policies for asset-documents
DROP POLICY IF EXISTS "Users can upload their own asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own asset documents" ON storage.objects;

-- Create new storage policies that work with wallet authentication
-- For asset documents - INSERT (upload)
CREATE POLICY "Wallet users can upload asset documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'asset-documents' 
  AND get_current_wallet_user_id() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user_id()::text
);

-- For asset documents - SELECT (view)
CREATE POLICY "Wallet users can view their own asset documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'asset-documents' 
  AND get_current_wallet_user_id() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user_id()::text
);

-- For asset documents - UPDATE
CREATE POLICY "Wallet users can update their own asset documents" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'asset-documents' 
  AND get_current_wallet_user_id() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user_id()::text
);

-- For asset documents - DELETE
CREATE POLICY "Wallet users can delete their own asset documents" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'asset-documents' 
  AND get_current_wallet_user_id() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user_id()::text
);