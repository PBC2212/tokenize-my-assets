-- Fix functions with mutable search paths for security
ALTER FUNCTION public.get_current_wallet_user_id() SET search_path = 'public';
ALTER FUNCTION public.get_current_wallet_user() SET search_path = 'public';
ALTER FUNCTION public.get_or_create_user_by_wallet(text) SET search_path = 'public';
ALTER FUNCTION public.set_current_wallet_address(text) SET search_path = 'public';