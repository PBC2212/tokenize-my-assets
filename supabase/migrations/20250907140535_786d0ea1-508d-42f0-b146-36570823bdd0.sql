-- Clean up all existing storage policies and recreate them properly
DROP POLICY IF EXISTS "Authenticated wallet users can delete asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated wallet users can update asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated wallet users can upload asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated wallet users can view asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Wallet users can delete their KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Wallet users can delete their asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Wallet users can delete their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Wallet users can update their asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Wallet users can upload KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Wallet users can upload asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Wallet users can upload their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Wallet users can upload their own asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Wallet users can view their KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Wallet users can view their asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Wallet users can view their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Wallet users can view their own asset documents" ON storage.objects;

-- Create clean storage policies for asset documents
CREATE POLICY "Asset documents upload policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'asset-documents' 
  AND get_current_wallet_user() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "Asset documents view policy" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'asset-documents' 
  AND get_current_wallet_user() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "Asset documents update policy" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'asset-documents' 
  AND get_current_wallet_user() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "Asset documents delete policy" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'asset-documents' 
  AND get_current_wallet_user() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

-- Create clean storage policies for KYC documents
CREATE POLICY "KYC documents upload policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND get_current_wallet_user() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "KYC documents view policy" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'kyc-documents' 
  AND get_current_wallet_user() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "KYC documents update policy" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'kyc-documents' 
  AND get_current_wallet_user() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "KYC documents delete policy" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'kyc-documents' 
  AND get_current_wallet_user() IS NOT NULL 
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);