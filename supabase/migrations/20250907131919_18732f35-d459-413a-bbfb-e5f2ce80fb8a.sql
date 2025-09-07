-- Drop the existing policies that aren't working
DROP POLICY IF EXISTS "Wallet users can upload asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Wallet users can view their own asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Wallet users can update their own asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Wallet users can delete their own asset documents" ON storage.objects;

-- Create simpler policies that check against the users table directly
-- For asset documents - INSERT (upload)
CREATE POLICY "Authenticated wallet users can upload asset documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'asset-documents' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- For asset documents - SELECT (view)  
CREATE POLICY "Authenticated wallet users can view asset documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'asset-documents' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- For asset documents - UPDATE
CREATE POLICY "Authenticated wallet users can update asset documents" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'asset-documents' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- For asset documents - DELETE
CREATE POLICY "Authenticated wallet users can delete asset documents" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'asset-documents' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id::text = (storage.foldername(name))[1]
  )
);