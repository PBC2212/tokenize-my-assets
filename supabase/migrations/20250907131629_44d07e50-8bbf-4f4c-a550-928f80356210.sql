-- Create a function to set the current wallet address for the session
CREATE OR REPLACE FUNCTION public.set_current_wallet_address(wallet_addr TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_wallet_address', wallet_addr, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;