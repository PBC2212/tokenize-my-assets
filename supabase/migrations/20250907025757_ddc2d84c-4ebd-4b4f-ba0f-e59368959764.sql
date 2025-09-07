-- Fix Security Definer View issue
-- Drop the existing view and recreate it as SECURITY INVOKER to fix the security vulnerability

-- Drop the existing assets_public_summary view
DROP VIEW IF EXISTS public.assets_public_summary;

-- Recreate the view as SECURITY INVOKER (this is the default, but being explicit)
-- This ensures the view runs with the querying user's permissions, not the creator's
CREATE VIEW public.assets_public_summary
WITH (security_invoker = true)
AS
SELECT 6 AS total_assets,
    3 AS real_estate_count,
    3 AS commodities_count,
    14.2 AS average_roi,
    19.9 AS total_value_millions;

-- Set appropriate RLS policy - since this contains static public data, allow public access
-- No RLS needed on views, but we're being explicit about access
GRANT SELECT ON public.assets_public_summary TO anon, authenticated;