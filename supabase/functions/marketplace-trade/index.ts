import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TradeRequest {
  type: 'buy' | 'sell';
  tokenId: string;
  amount: number;
  price?: number;
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

    const body = await req.text()
    if (!body.trim()) {
      throw new Error('Request body is empty')
    }
    const { type, tokenId, amount, price, walletAddress, transactionHash }: TradeRequest = JSON.parse(body)

    if (!type || !tokenId || !amount || amount <= 0) {
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

    if (type === 'buy') {
      // Handle buy order
      const { data: listing, error: listingError } = await supabaseClient
        .from('marketplace_listings')
        .select(`
          *,
          tokens (*)
        `)
        .eq('token_id', tokenId)
        .eq('status', 'active')
        .gte('amount', amount)
        .single()

      if (listingError || !listing) {
        throw new Error('Listing not found or insufficient tokens available')
      }

      const totalCost = amount * listing.price_per_token;

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'buy',
          token_id: tokenId,
          amount: amount,
          price: listing.price_per_token,
          total_value: totalCost,
          status: 'confirmed'
        })
        .select()
        .single()

      if (transactionError) {
        throw new Error('Failed to create transaction record')
      }

      // Update listing amount
      const newAmount = listing.amount - amount;
      if (newAmount === 0) {
        await supabaseClient
          .from('marketplace_listings')
          .update({ status: 'completed' })
          .eq('id', listing.id)
      } else {
        await supabaseClient
          .from('marketplace_listings')
          .update({ amount: newAmount, total_price: newAmount * listing.price_per_token })
          .eq('id', listing.id)
      }

      // Record blockchain transaction if provided
      if (walletAddress && transactionHash) {
        await supabaseClient
          .from('wallet_transactions')
          .insert({
            user_id: user.id,
            wallet_address: walletAddress.toLowerCase(),
            transaction_hash: transactionHash,
            from_address: walletAddress.toLowerCase(),
            to_address: listing.tokens.contract_address,
            value_wei: (totalCost * 1e18).toString(),
            value_eth: totalCost,
            transaction_type: 'token_purchase',
            status: 'confirmed',
            token_contract_address: listing.tokens.contract_address,
            token_symbol: listing.tokens.token_symbol,
            token_decimals: listing.tokens.decimals
          })
      }

      // Create activity record
      await supabaseClient
        .from('activities')
        .insert({
          user_id: user.id,
          type: 'token_purchase',
          description: `Purchased ${amount} ${listing.tokens.token_symbol} tokens for $${totalCost.toLocaleString()}`,
          amount: totalCost,
          status: 'completed',
          metadata: {
            token_id: tokenId,
            amount_purchased: amount,
            price_per_token: listing.price_per_token,
            total_cost: totalCost,
            transaction_hash: transactionHash
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            transaction,
            message: `Successfully purchased ${amount} ${listing.tokens.token_symbol} tokens`
          }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )

    } else if (type === 'sell') {
      // Handle sell order
      if (!price || price <= 0) {
        throw new Error('Price is required for sell orders')
      }

      // Get token info
      const { data: tokenInfo, error: tokenError } = await supabaseClient
        .from('tokens')
        .select('*')
        .eq('id', tokenId)
        .single()

      if (tokenError || !tokenInfo) {
        throw new Error('Token not found')
      }

      const totalValue = amount * price;

      // Create listing
      const { data: listing, error: listingError } = await supabaseClient
        .from('marketplace_listings')
        .insert({
          token_id: tokenId,
          seller_id: user.id,
          amount: amount,
          price_per_token: price,
          total_price: totalValue,
          status: 'active'
        })
        .select()
        .single()

      if (listingError) {
        throw new Error('Failed to create listing')
      }

      // Record blockchain transaction if provided
      if (walletAddress && transactionHash) {
        await supabaseClient
          .from('wallet_transactions')
          .insert({
            user_id: user.id,
            wallet_address: walletAddress.toLowerCase(),
            transaction_hash: transactionHash,
            from_address: walletAddress.toLowerCase(),
            to_address: tokenInfo.contract_address,
            value_wei: '0',
            value_eth: 0,
            transaction_type: 'token_listing',
            status: 'confirmed',
            token_contract_address: tokenInfo.contract_address,
            token_symbol: tokenInfo.token_symbol,
            token_decimals: tokenInfo.decimals
          })
      }

      // Create activity record
      await supabaseClient
        .from('activities')
        .insert({
          user_id: user.id,
          type: 'token_listing',
          description: `Listed ${amount} ${tokenInfo.token_symbol} tokens for sale at $${price} each`,
          amount: totalValue,
          status: 'completed',
          metadata: {
            token_id: tokenId,
            amount_listed: amount,
            price_per_token: price,
            total_value: totalValue,
            listing_id: listing.id,
            transaction_hash: transactionHash
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            listing,
            message: `Successfully listed ${amount} ${tokenInfo.token_symbol} tokens for sale`
          }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    throw new Error('Invalid trade type')

  } catch (error) {
    console.error('Marketplace trade error:', error)
    
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