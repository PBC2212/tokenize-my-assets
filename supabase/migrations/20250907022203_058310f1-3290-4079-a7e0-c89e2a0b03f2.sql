-- Fix security issues with the auto_create_liquidity_pool function
CREATE OR REPLACE FUNCTION public.auto_create_liquidity_pool()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql 
AS $$
BEGIN
  -- Only create pool for tokenized assets
  IF NEW.status = 'tokenized' AND NEW.token_id IS NOT NULL THEN
    
    -- Get token details and create liquidity pool
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
    
  END IF;
  
  RETURN NEW;
END;
$$;