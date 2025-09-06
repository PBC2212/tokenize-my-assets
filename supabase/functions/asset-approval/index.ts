import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssetApprovalRequest {
  assetId: string;
  action: 'approve' | 'reject';
  rejectionReason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: AssetApprovalRequest = await req.json();
    const { assetId, action, rejectionReason } = body;

    if (!assetId || !action || (action !== 'approve' && action !== 'reject')) {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin privileges (you can implement your own admin logic here)
    // For now, we'll assume any authenticated user can approve (in production, add proper admin checks)
    
    // Get the asset first to verify it exists
    const { data: asset, error: fetchError } = await supabase
      .from('user_assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (fetchError || !asset) {
      console.error('Asset not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Asset not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update asset status
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      updateData.approved_at = new Date().toISOString();
    } else if (rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { data: updatedAsset, error: updateError } = await supabase
      .from('user_assets')
      .update(updateData)
      .eq('id', assetId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update asset:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update asset status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the activity
    const activityDescription = action === 'approve' 
      ? `Asset "${asset.asset_type}" approved for tokenization`
      : `Asset "${asset.asset_type}" rejected: ${rejectionReason || 'No reason provided'}`;

    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        user_id: asset.user_id,
        type: action === 'approve' ? 'asset_approved' : 'asset_rejected',
        description: activityDescription,
        amount: asset.estimated_value,
        status: 'completed',
        metadata: {
          asset_id: assetId,
          action,
          reviewed_by: user.id,
          rejection_reason: rejectionReason
        }
      });

    if (activityError) {
      console.error('Failed to log activity:', activityError);
    }

    console.log(`Asset ${assetId} ${action}d successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Asset ${action}d successfully`,
        asset: updatedAsset
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Asset approval error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});