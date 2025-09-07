-- Complete the marketplace listings policy that was cut off
CREATE POLICY "Users can manage their listings" ON marketplace_listings
FOR ALL USING (
  seller_id = get_current_wallet_user()::uuid OR
  seller_id = auth.uid()
);

-- ===================================================
-- TRANSACTIONS POLICIES
-- ===================================================

-- Drop existing transactions policies
DROP POLICY IF EXISTS "Users can view their transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their transactions" ON transactions;

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

-- ===================================================
-- PROFILES POLICIES
-- ===================================================

-- Drop existing profiles policies
DROP POLICY IF EXISTS "Users can manage their profile" ON profiles;

-- Policy for profiles (all operations)
CREATE POLICY "Users can manage their profile" ON profiles
FOR ALL USING (
  user_id = get_current_wallet_user()::uuid OR
  user_id = auth.uid()
);