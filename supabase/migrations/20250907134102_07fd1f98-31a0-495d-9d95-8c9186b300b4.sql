-- Fix storage policies to work with wallet-based authentication

-- Drop existing conflicting policies for asset-documents bucket
DROP POLICY IF EXISTS "Users can upload their own asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own asset documents" ON storage.objects;

-- Create new storage policies for asset-documents bucket that work with wallet authentication
-- Policy for uploading documents
CREATE POLICY "Wallet users can upload asset documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'asset-documents' AND 
  get_current_wallet_user() IS NOT NULL AND
  (storage.foldername(name))[1] = get_current_wallet_user()::text
);

-- Policy for viewing documents
CREATE POLICY "Wallet users can view their asset documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'asset-documents' AND 
  get_current_wallet_user() IS NOT NULL AND
  (storage.foldername(name))[1] = get_current_wallet_user()::text
);

-- Policy for updating documents
CREATE POLICY "Wallet users can update their asset documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'asset-documents' AND 
  get_current_wallet_user() IS NOT NULL AND
  (storage.foldername(name))[1] = get_current_wallet_user()::text
);

-- Policy for deleting documents
CREATE POLICY "Wallet users can delete their asset documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'asset-documents' AND 
  get_current_wallet_user() IS NOT NULL AND
  (storage.foldername(name))[1] = get_current_wallet_user()::text
);

-- Also fix KYC documents bucket policies
DROP POLICY IF EXISTS "Users can upload KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own KYC documents" ON storage.objects;

-- Create new KYC storage policies
CREATE POLICY "Wallet users can upload KYC documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'kyc-documents' AND 
  get_current_wallet_user() IS NOT NULL AND
  (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "Wallet users can view their KYC documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'kyc-documents' AND 
  get_current_wallet_user() IS NOT NULL AND
  (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "Wallet users can delete their KYC documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'kyc-documents' AND 
  get_current_wallet_user() IS NOT NULL AND
  (storage.foldername(name))[1] = get_current_wallet_user()::text
);