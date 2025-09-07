-- Complete RLS policies for marketplace listings, transactions, and profiles

-- ===================================================
-- MARKETPLACE LISTINGS POLICIES
-- ===================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can manage their listings" ON marketplace_listings;
DROP POLICY IF EXISTS "Everyone can view marketplace listings" ON marketplace_listings;
DROP POLICY IF EXISTS "Sellers can update their own listings" ON marketplace_listings;
DROP POLICY IF EXISTS "Users can insert their own listings" ON marketplace_listings;

-- Policy for viewing marketplace listings (everyone can view)
CREATE POLICY "Everyone can view marketplace listings" ON marketplace_listings
FOR SELECT USING (true);

-- Policy for inserting marketplace listings
CREATE POLICY "Users can insert their own listings" ON marketplace_listings
FOR INSERT WITH CHECK (
  seller_id = get_current_wallet_user()::uuid OR
  seller_id = auth.uid()
);

-- Policy for updating marketplace listings
CREATE POLICY "Sellers can update their own listings" ON marketplace_listings
FOR UPDATE USING (
  seller_id = get_current_wallet_user()::uuid OR
  seller_id = auth.uid()
);

-- Policy for deleting marketplace listings
CREATE POLICY "Sellers can delete their own listings" ON marketplace_listings
FOR DELETE USING (
  seller_id = get_current_wallet_user()::uuid OR
  seller_id = auth.uid()
);

-- ===================================================
-- TRANSACTIONS POLICIES
-- ===================================================

-- Drop existing transaction policies
DROP POLICY IF EXISTS "Users can view their transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their transactions" ON transactions;
DROP POLICY IF EXISTS "Wallet users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Wallet users can view their own transactions" ON transactions;

-- Policy for viewing transactions
CREATE POLICY "Users can view their transactions" ON transactions
FOR SELECT USING (
  user_id = get_current_wallet_user()::uuid OR
  user_id = auth.uid()
);

-- Policy for inserting transactions
CREATE POLICY "Users can insert their transactions" ON transactions
FOR INSERT WITH CHECK (
  user_id = get_current_wallet_user()::uuid OR
  user_id = auth.uid()
);

-- Policy for updating transactions (allow users to update their own transactions)
CREATE POLICY "Users can update their transactions" ON transactions
FOR UPDATE USING (
  user_id = get_current_wallet_user()::uuid OR
  user_id = auth.uid()
);

-- ===================================================
-- PROFILES POLICIES
-- ===================================================

-- Drop existing profiles policies
DROP POLICY IF EXISTS "Users can manage their profile" ON profiles;
DROP POLICY IF EXISTS "Wallet users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Wallet users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Wallet users can view their own profile" ON profiles;

-- Policy for viewing profiles (users can view their own)
CREATE POLICY "Users can view their profile" ON profiles
FOR SELECT USING (
  user_id = get_current_wallet_user()::uuid OR
  user_id = auth.uid()
);

-- Policy for inserting profiles
CREATE POLICY "Users can insert their profile" ON profiles
FOR INSERT WITH CHECK (
  user_id = get_current_wallet_user()::uuid OR
  user_id = auth.uid()
);

-- Policy for updating profiles
CREATE POLICY "Users can update their profile" ON profiles
FOR UPDATE USING (
  user_id = get_current_wallet_user()::uuid OR
  user_id = auth.uid()
);

-- Policy for deleting profiles
CREATE POLICY "Users can delete their profile" ON profiles
FOR DELETE USING (
  user_id = get_current_wallet_user()::uuid OR
  user_id = auth.uid()
);