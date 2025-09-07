import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6.15.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WalletAuthRequest {
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

    const body = await req.text()
    if (!body.trim()) {
      throw new Error('Request body is empty')
    }
    
    const { walletAddress, signature, message, nonce }: WalletAuthRequest = JSON.parse(body)

    if (!walletAddress || !signature || !message || !nonce) {
      throw new Error('Missing required parameters')
    }

    // Verify the signature
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Invalid signature - address mismatch')
      }
    } catch (error) {
      console.error('Signature verification failed:', error)
      throw new Error('Invalid signature')
    }

    // Get or create user
    const { data: userData, error: userError } = await supabaseClient.rpc(
      'get_or_create_user_by_wallet',
      { _wallet_address: walletAddress.toLowerCase() }
    )

    if (userError || !userData || userData.length === 0) {
      console.error('User creation/retrieval failed:', userError)
      throw new Error('Failed to authenticate user')
    }

    const user = userData[0]

    // Update wallet connection
    const { error: connectionError } = await supabaseClient
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

    if (connectionError) {
      console.error('Wallet connection update failed:', connectionError)
    }

    // Generate a custom JWT token for the wallet session
    const sessionToken = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'fallback-secret'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ).then(async (key) => {
      const payload = {
        wallet_address: walletAddress.toLowerCase(),
        user_id: user.id,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }
      
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payloadStr = btoa(JSON.stringify(payload))
      const data = header + '.' + payloadStr
      
      const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
      const signatureStr = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
      
      return data + '.' + signatureStr
    })

    // Log activity
    await supabaseClient
      .from('activities')
      .insert({
        user_id: user.id,
        type: 'wallet_authenticated',
        description: `Wallet ${walletAddress} authenticated successfully`,
        amount: 0,
        metadata: {
          wallet_address: walletAddress,
          authentication_method: 'wallet_signature',
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        user: user,
        sessionToken: sessionToken,
        message: 'Wallet authenticated successfully'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Wallet authentication error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Authentication failed',
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