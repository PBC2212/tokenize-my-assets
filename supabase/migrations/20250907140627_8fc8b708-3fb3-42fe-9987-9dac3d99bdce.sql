-- Drop ALL storage.objects policies to start fresh
DO $$
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON storage.objects';
    END LOOP;
END $$;

-- Now create the correct storage policies using wallet authentication
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