import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TokenMintRequest {
  assetId: string;
  tokenName: string;
  tokenSymbol: string;
  totalSupply: number;
  pricePerToken: number;
  decimals: number;
  walletAddress?: string;
  transactionHash?: string;
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

    const { 
      assetId, 
      tokenName, 
      tokenSymbol, 
      totalSupply, 
      pricePerToken, 
      decimals,
      walletAddress,
      transactionHash 
    }: TokenMintRequest = await req.json()

    // Validate input
    if (!assetId || !tokenName || !tokenSymbol || !totalSupply || !pricePerToken || totalSupply <= 0 || pricePerToken <= 0) {
      throw new Error('Missing or invalid required fields')
    }

    // Verify asset ownership
    const { data: asset, error: assetError } = await supabaseClient
      .from('user_assets')
      .select('*')
      .eq('id', assetId)
      .eq('user_id', user.id)
      .single()

    if (assetError || !asset) {
      throw new Error('Asset not found or not owned by user')
    }

    if (asset.status !== 'approved') {
      throw new Error('Asset must be approved before minting tokens')
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

    // Generate mock contract address (in production, this would be a real deployed contract)
    const contractAddress = `0x${Math.random().toString(16).substr(2, 40)}`;

    // Create token record
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('tokens')
      .insert({
        asset_id: assetId,
        token_name: tokenName,
        token_symbol: tokenSymbol.toUpperCase(),
        total_supply: totalSupply,
        price_per_token: pricePerToken,
        decimals: decimals || 18,
        contract_address: contractAddress,
        fractional: true,
        token_type: 'ERC20'
      })
      .select()
      .single()

    if (tokenError) {
      console.error('Token creation error:', tokenError)
      throw new Error('Failed to create token record')
    }

    // Update asset status to tokenized
    await supabaseClient
      .from('user_assets')
      .update({ 
        status: 'tokenized',
        token_id: tokenData.id,
        contract_address: contractAddress
      })
      .eq('id', assetId)

    // Record blockchain transaction if provided
    if (walletAddress && transactionHash) {
      await supabaseClient
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          wallet_address: walletAddress.toLowerCase(),
          transaction_hash: transactionHash,
          from_address: walletAddress.toLowerCase(),
          to_address: contractAddress,
          value_wei: '0',
          value_eth: 0,
          transaction_type: 'token_deployment',
          status: 'confirmed',
          token_contract_address: contractAddress,
          token_symbol: tokenSymbol.toUpperCase(),
          token_decimals: decimals || 18
        })
    }

    // Create activity record
    await supabaseClient
      .from('activities')
      .insert({
        user_id: user.id,
        type: 'token_minted',
        description: `Minted ${totalSupply.toLocaleString()} ${tokenSymbol} tokens for ${asset.asset_type}`,
        amount: totalSupply * pricePerToken,
        status: 'completed',
        metadata: {
          asset_id: assetId,
          token_id: tokenData.id,
          token_symbol: tokenSymbol,
          total_supply: totalSupply,
          price_per_token: pricePerToken,
          contract_address: contractAddress,
          wallet_address: walletAddress,
          transaction_hash: transactionHash
        }
      })

    // Create marketplace listing (asset becomes available for trading)
    await supabaseClient
      .from('marketplace_listings')
      .insert({
        token_id: tokenData.id,
        seller_id: user.id,
        amount: totalSupply,
        price_per_token: pricePerToken,
        total_price: totalSupply * pricePerToken,
        status: 'active'
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          token: tokenData,
          asset: { ...asset, status: 'tokenized', token_id: tokenData.id },
          contractAddress
        },
        message: 'Tokens minted successfully and listed on marketplace' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Token mint error:', error)
    
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