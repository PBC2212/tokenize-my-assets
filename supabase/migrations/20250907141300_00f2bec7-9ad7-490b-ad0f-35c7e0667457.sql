-- Fix storage RLS policies for wallet authentication

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload kyc documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their kyc documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their kyc documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their asset documents" ON storage.objects;

-- Create storage policies for wallet authentication
-- Allow wallet users to upload to kyc-documents bucket
CREATE POLICY "Wallet users can upload kyc documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'kyc-documents' AND 
  get_current_wallet_user() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow wallet users to view their kyc documents
CREATE POLICY "Wallet users can view their kyc documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'kyc-documents' AND 
  get_current_wallet_user() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow wallet users to delete their kyc documents
CREATE POLICY "Wallet users can delete their kyc documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'kyc-documents' AND 
  get_current_wallet_user() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow wallet users to upload to asset-documents bucket
CREATE POLICY "Wallet users can upload asset documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'asset-documents' AND 
  get_current_wallet_user() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow wallet users to view their asset documents
CREATE POLICY "Wallet users can view their asset documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'asset-documents' AND 
  get_current_wallet_user() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow wallet users to delete their asset documents
CREATE POLICY "Wallet users can delete their asset documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'asset-documents' AND 
  get_current_wallet_user() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);