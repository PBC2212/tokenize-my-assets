import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AssetPledgeRequest {
  assetType: string;
  description: string;
  estimatedValue: number;
  documents?: string[];
  walletAddress?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      throw new Error('No authorization header')
    }

    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    const body = await req.text()
    if (!body.trim()) {
      throw new Error('Request body is empty')
    }
    const { assetType, description, estimatedValue, documents, walletAddress }: AssetPledgeRequest = JSON.parse(body)

    // Validate input
    if (!assetType || !description || !estimatedValue || estimatedValue <= 0) {
      throw new Error('Missing or invalid required fields')
    }

    // Verify wallet connection if provided
    let verifiedWallet = null;
    if (walletAddress) {
      const { data: walletConnection, error: walletError } = await supabaseClient
        .from('wallet_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('is_verified', true)
        .single()

      if (walletError || !walletConnection) {
        throw new Error('Wallet not connected or verified')
      }
      verifiedWallet = walletConnection;
    }

    // Create asset record
    const { data: assetData, error: assetError } = await supabaseClient
      .from('user_assets')
      .insert({
        user_id: user.id,
        asset_type: assetType,
        description,
        estimated_value: estimatedValue,
        documents: documents || [],
        status: 'under_review'
      })
      .select()
      .single()

    if (assetError) {
      console.error('Asset creation error:', assetError)
      throw new Error('Failed to create asset record')
    }

    // Create activity record
    await supabaseClient
      .from('activities')
      .insert({
        user_id: user.id,
        type: 'asset_pledged',
        description: `Pledged ${assetType} worth $${estimatedValue.toLocaleString()}`,
        amount: estimatedValue,
        status: 'completed',
        metadata: {
          asset_id: assetData.id,
          asset_type: assetType,
          wallet_address: walletAddress,
          estimated_value: estimatedValue
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: assetData,
        message: 'Asset pledged successfully and submitted for review' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Asset pledge error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})