-- Add missing RLS policies that don't already exist

-- Check and add marketplace listings delete policy if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'marketplace_listings' 
        AND policyname = 'Sellers can delete their own listings'
    ) THEN
        CREATE POLICY "Sellers can delete their own listings" ON marketplace_listings
        FOR DELETE USING (
          seller_id = get_current_wallet_user()::uuid OR
          seller_id = auth.uid()
        );
    END IF;
END $$;

-- Add transactions update policy if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' 
        AND policyname = 'Users can update their transactions'
    ) THEN
        CREATE POLICY "Users can update their transactions" ON transactions
        FOR UPDATE USING (
          user_id = get_current_wallet_user()::uuid OR
          user_id = auth.uid()
        );
    END IF;
END $$;

-- Update profiles policies to have granular access
DO $$ 
BEGIN
    -- Drop the broad "Users can manage their profile" policy if it exists
    DROP POLICY IF EXISTS "Users can manage their profile" ON profiles;
    
    -- Create specific policies for profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can view their profile'
    ) THEN
        CREATE POLICY "Users can view their profile" ON profiles
        FOR SELECT USING (
          user_id = get_current_wallet_user()::uuid OR
          user_id = auth.uid()
        );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can insert their profile'
    ) THEN
        CREATE POLICY "Users can insert their profile" ON profiles
        FOR INSERT WITH CHECK (
          user_id = get_current_wallet_user()::uuid OR
          user_id = auth.uid()
        );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update their profile'
    ) THEN
        CREATE POLICY "Users can update their profile" ON profiles
        FOR UPDATE USING (
          user_id = get_current_wallet_user()::uuid OR
          user_id = auth.uid()
        );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can delete their profile'
    ) THEN
        CREATE POLICY "Users can delete their profile" ON profiles
        FOR DELETE USING (
          user_id = get_current_wallet_user()::uuid OR
          user_id = auth.uid()
        );
    END IF;
END $$;