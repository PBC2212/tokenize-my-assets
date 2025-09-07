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
  documents?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
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

    // Validate required fields
    if (!assetType || !description || !estimatedValue || estimatedValue <= 0) {
      throw new Error('Missing required fields: assetType, description, and estimatedValue are required')
    }

    // Validate documents for compliance
    if (!documents || documents.length === 0) {
      throw new Error('At least one supporting document is required for compliance')
    }

    console.log(`Processing asset pledge for user ${user.id}:`, {
      assetType,
      estimatedValue,
      documentCount: documents.length
    })

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

    // Prepare document URLs array for database storage
    const documentUrls = documents.map(doc => doc.url);
    const documentMetadata = documents.map(doc => ({
      name: doc.name,
      type: doc.type,
      size: doc.size,
      url: doc.url,
      uploadedAt: new Date().toISOString()
    }));

    // Create asset record
    const { data: assetData, error: assetError } = await supabaseClient
      .from('user_assets')
      .insert({
        user_id: user.id,
        asset_type: assetType,
        description,
        estimated_value: estimatedValue,
        documents: documentUrls, // Store URLs as array
        status: 'under_review',
        contract_address: verifiedWallet ? walletAddress.toLowerCase() : null,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (assetError) {
      console.error('Database insert error:', assetError)
      throw new Error('Failed to store asset information')
    }

    console.log('Asset pledge created successfully:', assetData.id)

    // Create activity record
    await supabaseClient
      .from('activities')
      .insert({
        user_id: user.id,
        type: 'asset_pledged',
        description: `Pledged ${assetType} asset valued at $${estimatedValue.toLocaleString()}`,
        amount: estimatedValue,
        status: 'completed',
        metadata: {
          asset_id: assetData.id,
          asset_type: assetType,
          document_count: documents.length,
          wallet_address: walletAddress,
          documents: documentMetadata
        }
      })

    // Record wallet transaction if wallet connected
    if (verifiedWallet) {
      await supabaseClient
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          wallet_address: walletAddress.toLowerCase(),
          transaction_hash: `asset-pledge-${assetData.id}`,
          from_address: walletAddress.toLowerCase(),
          to_address: 'platform',
          value_wei: '0',
          value_eth: 0,
          transaction_type: 'asset_pledge',
          status: 'confirmed',
          chain_id: 1
        })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          assetId: assetData.id,
          status: 'under_review',
          documentsUploaded: documents.length,
          estimatedValue: estimatedValue,
          message: 'Asset pledge submitted successfully for compliance review'
        }
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