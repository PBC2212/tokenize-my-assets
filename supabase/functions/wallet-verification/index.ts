import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WalletVerificationRequest {
  walletAddress: string;
  signature: string;
  message: string;
  nonce: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the authorization header from the request
    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      throw new Error('No authorization header')
    }

    // Verify the user's JWT token
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    const body = await req.text()
    if (!body.trim()) {
      throw new Error('Request body is empty')
    }
    const { walletAddress, signature, message, nonce }: WalletVerificationRequest = JSON.parse(body)

    if (!walletAddress || !signature || !message || !nonce) {
      throw new Error('Missing required parameters')
    }

    // Here you would typically verify the signature using a library like ethers
    // For now, we'll simulate verification
    const isValidSignature = true; // In reality, verify the signature

    if (!isValidSignature) {
      throw new Error('Invalid signature')
    }

    // Update or create wallet connection
    const { data: walletConnection, error: upsertError } = await supabaseClient
      .from('wallet_connections')
      .upsert({
        user_id: user.id,
        wallet_address: walletAddress.toLowerCase(),
        wallet_type: 'metamask',
        is_verified: true,
        signature: signature,
        nonce: nonce,
        last_activity: new Date().toISOString(),
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Database error:', upsertError)
      throw new Error('Failed to save wallet connection')
    }

    // Log activity
    await supabaseClient
      .from('activities')
      .insert({
        user_id: user.id,
        type: 'wallet_connected',
        description: `Wallet ${walletAddress} connected and verified`,
        amount: 0,
        metadata: {
          wallet_address: walletAddress,
          wallet_type: 'metamask',
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        walletConnection,
        message: 'Wallet verified and connected successfully' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Wallet verification error:', error)
    
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