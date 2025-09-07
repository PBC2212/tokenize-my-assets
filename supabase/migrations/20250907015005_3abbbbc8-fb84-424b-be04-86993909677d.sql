-- Create storage buckets for document uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('kyc-documents', 'kyc-documents', false),
  ('asset-documents', 'asset-documents', false);

-- Create RLS policies for KYC documents bucket
CREATE POLICY "Users can upload their own KYC documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own KYC documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own KYC documents" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own KYC documents" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create RLS policies for asset documents bucket
CREATE POLICY "Users can upload their own asset documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'asset-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own asset documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'asset-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own asset documents" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'asset-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own asset documents" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'asset-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin policies for compliance review
CREATE POLICY "Admins can view all KYC documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'kyc-documents' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can view all asset documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'asset-documents' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);