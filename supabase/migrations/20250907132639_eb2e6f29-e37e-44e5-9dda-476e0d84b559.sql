-- CRITICAL SECURITY FIX: Update all RLS policies to use wallet authentication instead of auth.uid()

-- Fix activities table policies
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.activities;

CREATE POLICY "Wallet users can view their own activities" 
ON public.activities FOR SELECT 
USING (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

CREATE POLICY "Wallet users can insert their own activities" 
ON public.activities FOR INSERT 
WITH CHECK (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

-- Fix kyc_submissions table policies
DROP POLICY IF EXISTS "Users can view their own KYC" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Users can insert their own KYC" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Users can update their own KYC" ON public.kyc_submissions;

CREATE POLICY "Wallet users can view their own KYC" 
ON public.kyc_submissions FOR SELECT 
USING (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

CREATE POLICY "Wallet users can insert their own KYC" 
ON public.kyc_submissions FOR INSERT 
WITH CHECK (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

CREATE POLICY "Wallet users can update their own KYC" 
ON public.kyc_submissions FOR UPDATE 
USING (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

-- Fix liquidity_positions table policies
DROP POLICY IF EXISTS "Users can view their own positions" ON public.liquidity_positions;
DROP POLICY IF EXISTS "Users can insert their own positions" ON public.liquidity_positions;
DROP POLICY IF EXISTS "Users can update their own positions" ON public.liquidity_positions;

CREATE POLICY "Wallet users can view their own positions" 
ON public.liquidity_positions FOR SELECT 
USING (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

CREATE POLICY "Wallet users can insert their own positions" 
ON public.liquidity_positions FOR INSERT 
WITH CHECK (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

CREATE POLICY "Wallet users can update their own positions" 
ON public.liquidity_positions FOR UPDATE 
USING (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

-- Fix transactions table policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;

CREATE POLICY "Wallet users can view their own transactions" 
ON public.transactions FOR SELECT 
USING (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

CREATE POLICY "Wallet users can insert their own transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

-- Fix user_assets table policies
DROP POLICY IF EXISTS "Users can view their own assets" ON public.user_assets;
DROP POLICY IF EXISTS "Users can insert their own assets" ON public.user_assets;
DROP POLICY IF EXISTS "Users can update their own assets" ON public.user_assets;

CREATE POLICY "Wallet users can view their own assets" 
ON public.user_assets FOR SELECT 
USING (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

CREATE POLICY "Wallet users can insert their own assets" 
ON public.user_assets FOR INSERT 
WITH CHECK (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

CREATE POLICY "Wallet users can update their own assets" 
ON public.user_assets FOR UPDATE 
USING (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

-- Fix wallet_connections table policies
DROP POLICY IF EXISTS "Users can view their own wallet connections" ON public.wallet_connections;
DROP POLICY IF EXISTS "Users can insert their own wallet connections" ON public.wallet_connections;
DROP POLICY IF EXISTS "Users can update their own wallet connections" ON public.wallet_connections;

CREATE POLICY "Wallet users can view their own wallet connections" 
ON public.wallet_connections FOR SELECT 
USING (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

CREATE POLICY "Wallet users can insert their own wallet connections" 
ON public.wallet_connections FOR INSERT 
WITH CHECK (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

CREATE POLICY "Wallet users can update their own wallet connections" 
ON public.wallet_connections FOR UPDATE 
USING (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

-- Fix wallet_transactions table policies
DROP POLICY IF EXISTS "Users can view their own wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can insert their own wallet transactions" ON public.wallet_transactions;

CREATE POLICY "Wallet users can view their own wallet transactions" 
ON public.wallet_transactions FOR SELECT 
USING (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

CREATE POLICY "Wallet users can insert their own wallet transactions" 
ON public.wallet_transactions FOR INSERT 
WITH CHECK (
  get_current_wallet_user() IS NOT NULL 
  AND user_id = get_current_wallet_user()
);

-- Fix storage policies for kyc-documents bucket to use wallet authentication
-- First, drop existing policies that use auth.uid()
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Create wallet-compatible storage policies for kyc-documents
CREATE POLICY "Wallet users can view their own KYC documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'kyc-documents' 
  AND get_current_wallet_user() IS NOT NULL
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "Wallet users can upload their own KYC documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND get_current_wallet_user() IS NOT NULL
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "Wallet users can delete their own KYC documents" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'kyc-documents' 
  AND get_current_wallet_user() IS NOT NULL
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

-- Fix asset-documents bucket policies for consistency
DROP POLICY IF EXISTS "Users can view their own asset documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own asset documents" ON storage.objects;

CREATE POLICY "Wallet users can view their own asset documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'asset-documents' 
  AND get_current_wallet_user() IS NOT NULL
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);

CREATE POLICY "Wallet users can upload their own asset documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'asset-documents' 
  AND get_current_wallet_user() IS NOT NULL
  AND (storage.foldername(name))[1] = get_current_wallet_user()::text
);