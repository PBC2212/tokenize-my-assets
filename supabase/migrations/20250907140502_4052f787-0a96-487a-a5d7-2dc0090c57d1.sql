-- Fix storage RLS policies to work with wallet authentication system

-- Drop existing storage policies
DROP POLICY IF EXISTS "Authenticated wallet users can upload asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated wallet users can view asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated wallet users can update asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated wallet users can delete asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated wallet users can upload kyc documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated wallet users can view kyc documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated wallet users can update kyc documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated wallet users can delete kyc documents" ON storage.objects;

-- Create new storage policies that work with wallet authentication
-- Asset documents policies
CREATE POLICY "Wallet users can upload asset documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'asset-documents' 
  AND get_current_wallet_user() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "Wallet users can view asset documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'asset-documents' 
  AND get_current_wallet_user() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "Wallet users can update asset documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'asset-documents' 
  AND get_current_wallet_user() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "Wallet users can delete asset documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'asset-documents' 
  AND get_current_wallet_user() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

-- KYC documents policies
CREATE POLICY "Wallet users can upload kyc documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND get_current_wallet_user() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "Wallet users can view kyc documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'kyc-documents' 
  AND get_current_wallet_user() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "Wallet users can update kyc documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'kyc-documents' 
  AND get_current_wallet_user() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "Wallet users can delete kyc documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'kyc-documents' 
  AND get_current_wallet_user() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);