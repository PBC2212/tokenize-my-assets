-- Fix remaining functions with mutable search paths
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';

-- Check and fix any other functions that might need search path set
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname as schema_name, p.proname as function_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.prosecdef = true 
        AND (p.proconfig IS NULL OR NOT 'search_path=public' = ANY(p.proconfig))
    LOOP
        EXECUTE format('ALTER FUNCTION %I.%I SET search_path = ''public''', 
                      func_record.schema_name, func_record.function_name);
    END LOOP;
END $$;