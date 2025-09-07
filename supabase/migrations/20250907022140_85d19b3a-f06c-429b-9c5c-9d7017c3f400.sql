-- Add asset relationship and pool categorization to liquidity_pools
ALTER TABLE public.liquidity_pools 
ADD COLUMN source_asset_id uuid REFERENCES public.user_assets(id),
ADD COLUMN pool_type text NOT NULL DEFAULT 'general',
ADD COLUMN asset_name text,
ADD COLUMN asset_type text;

-- Create index for better performance
CREATE INDEX idx_liquidity_pools_source_asset ON public.liquidity_pools(source_asset_id);
CREATE INDEX idx_liquidity_pools_pool_type ON public.liquidity_pools(pool_type);

-- Update existing pools to be 'general' type
UPDATE public.liquidity_pools SET pool_type = 'general' WHERE pool_type IS NULL;

-- Add constraint for pool types
ALTER TABLE public.liquidity_pools 
ADD CONSTRAINT check_pool_type 
CHECK (pool_type IN ('individual', 'basket', 'general'));

-- Create function to auto-create liquidity pool when token is minted
CREATE OR REPLACE FUNCTION public.auto_create_liquidity_pool()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create pool for tokenized assets
  IF NEW.status = 'tokenized' AND NEW.token_id IS NOT NULL THEN
    
    -- Get token details
    INSERT INTO public.liquidity_pools (
      name,
      token_a,
      token_b,
      token_a_id,
      token_b_id,
      source_asset_id,
      pool_type,
      asset_name,
      asset_type,
      total_liquidity,
      apr,
      volume_24h,
      fees_24h,
      is_active
    )
    SELECT 
      t.token_symbol || '/USDC' as name,
      t.token_symbol as token_a,
      'USDC' as token_b,
      t.id as token_a_id,
      NULL as token_b_id, -- We'll handle USDC reference separately
      NEW.id as source_asset_id,
      'individual' as pool_type,
      COALESCE(a.asset_type, 'Asset') as asset_name,
      NEW.asset_type as asset_type,
      0 as total_liquidity,
      8.5 as apr, -- Default APR for new pools
      0 as volume_24h,
      0 as fees_24h,
      true as is_active
    FROM public.tokens t
    JOIN public.user_assets a ON a.id = NEW.id
    WHERE t.id = NEW.token_id;
    
    RAISE NOTICE 'Auto-created liquidity pool for asset % with token %', NEW.id, NEW.token_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create pools when assets are tokenized
CREATE TRIGGER trigger_auto_create_pool
  AFTER UPDATE ON public.user_assets
  FOR EACH ROW
  WHEN (OLD.status != NEW.status AND NEW.status = 'tokenized')
  EXECUTE FUNCTION public.auto_create_liquidity_pool();

-- Update existing pools with asset information where possible
UPDATE public.liquidity_pools lp
SET 
  source_asset_id = ua.id,
  pool_type = 'individual',
  asset_name = ua.asset_type,
  asset_type = ua.asset_type
FROM public.tokens t
JOIN public.user_assets ua ON ua.token_id = t.id
WHERE lp.token_a_id = t.id AND lp.source_asset_id IS NULL;