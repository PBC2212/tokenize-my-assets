import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LiquidityRequest {
  type: 'add' | 'remove';
  poolId: string;
  amount: number;
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
    const { type, poolId, amount, walletAddress, transactionHash }: LiquidityRequest = JSON.parse(body)

    if (!type || !poolId || !amount || amount <= 0) {
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

    // Get pool information
    const { data: pool, error: poolError } = await supabaseClient
      .from('liquidity_pools')
      .select('*')
      .eq('id', poolId)
      .single()

    if (poolError || !pool) {
      throw new Error('Liquidity pool not found')
    }

    if (type === 'add') {
      // Handle add liquidity
      const lpTokens = amount; // Simplified 1:1 ratio
      const entryPrice = 1.0; // Simplified entry price

      // Create or update liquidity position
      const { data: existingPosition } = await supabaseClient
        .from('liquidity_positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('pool_id', poolId)
        .single()

      let position;
      if (existingPosition) {
        // Update existing position
        const newAmount = parseFloat(existingPosition.amount) + amount;
        const newLpTokens = parseFloat(existingPosition.lp_tokens) + lpTokens;
        
        const { data: updatedPosition, error: updateError } = await supabaseClient
          .from('liquidity_positions')
          .update({
            amount: newAmount,
            lp_tokens: newLpTokens,
            entry_price: (parseFloat(existingPosition.entry_price) + entryPrice) / 2 // Average
          })
          .eq('id', existingPosition.id)
          .select()
          .single()

        if (updateError) {
          throw new Error('Failed to update liquidity position')
        }
        position = updatedPosition;
      } else {
        // Create new position
        const { data: newPosition, error: createError } = await supabaseClient
          .from('liquidity_positions')
          .insert({
            user_id: user.id,
            pool_id: poolId,
            amount: amount,
            lp_tokens: lpTokens,
            entry_price: entryPrice
          })
          .select()
          .single()

        if (createError) {
          throw new Error('Failed to create liquidity position')
        }
        position = newPosition;
      }

      // Update pool total liquidity
      await supabaseClient
        .from('liquidity_pools')
        .update({
          total_liquidity: (pool.total_liquidity || 0) + amount
        })
        .eq('id', poolId)

      // Record blockchain transaction if provided
      if (walletAddress && transactionHash) {
        await supabaseClient
          .from('wallet_transactions')
          .insert({
            user_id: user.id,
            wallet_address: walletAddress.toLowerCase(),
            transaction_hash: transactionHash,
            from_address: walletAddress.toLowerCase(),
            to_address: pool.contract_address || '0x0000000000000000000000000000000000000000',
            value_wei: (amount * 1e18).toString(),
            value_eth: amount,
            transaction_type: 'liquidity_add',
            status: 'confirmed'
          })
      }

      // Create activity record
      await supabaseClient
        .from('activities')
        .insert({
          user_id: user.id,
          type: 'liquidity_added',
          description: `Added $${amount.toLocaleString()} liquidity to ${pool.name}`,
          amount: amount,
          status: 'completed',
          metadata: {
            pool_id: poolId,
            pool_name: pool.name,
            amount_added: amount,
            lp_tokens_received: lpTokens,
            transaction_hash: transactionHash
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            position,
            pool: { ...pool, total_liquidity: (pool.total_liquidity || 0) + amount },
            message: `Successfully added $${amount.toLocaleString()} to ${pool.name}`
          }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )

    } else if (type === 'remove') {
      // Handle remove liquidity
      const { data: position, error: positionError } = await supabaseClient
        .from('liquidity_positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('pool_id', poolId)
        .single()

      if (positionError || !position) {
        throw new Error('No liquidity position found for this pool')
      }

      const currentAmount = parseFloat(position.amount);
      if (amount > currentAmount) {
        throw new Error('Insufficient liquidity to remove')
      }

      const remainingAmount = currentAmount - amount;
      const lpTokensToRemove = (amount / currentAmount) * parseFloat(position.lp_tokens);
      const remainingLpTokens = parseFloat(position.lp_tokens) - lpTokensToRemove;

      if (remainingAmount === 0) {
        // Remove position entirely
        await supabaseClient
          .from('liquidity_positions')
          .delete()
          .eq('id', position.id)
      } else {
        // Update position
        await supabaseClient
          .from('liquidity_positions')
          .update({
            amount: remainingAmount,
            lp_tokens: remainingLpTokens
          })
          .eq('id', position.id)
      }

      // Update pool total liquidity
      await supabaseClient
        .from('liquidity_pools')
        .update({
          total_liquidity: Math.max(0, (pool.total_liquidity || 0) - amount)
        })
        .eq('id', poolId)

      // Record blockchain transaction if provided
      if (walletAddress && transactionHash) {
        await supabaseClient
          .from('wallet_transactions')
          .insert({
            user_id: user.id,
            wallet_address: walletAddress.toLowerCase(),
            transaction_hash: transactionHash,
            from_address: pool.contract_address || '0x0000000000000000000000000000000000000000',
            to_address: walletAddress.toLowerCase(),
            value_wei: (amount * 1e18).toString(),
            value_eth: amount,
            transaction_type: 'liquidity_remove',
            status: 'confirmed'
          })
      }

      // Create activity record
      await supabaseClient
        .from('activities')
        .insert({
          user_id: user.id,
          type: 'liquidity_removed',
          description: `Removed $${amount.toLocaleString()} liquidity from ${pool.name}`,
          amount: amount,
          status: 'completed',
          metadata: {
            pool_id: poolId,
            pool_name: pool.name,
            amount_removed: amount,
            lp_tokens_burned: lpTokensToRemove,
            transaction_hash: transactionHash
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            remainingAmount,
            pool: { ...pool, total_liquidity: Math.max(0, (pool.total_liquidity || 0) - amount) },
            message: `Successfully removed $${amount.toLocaleString()} from ${pool.name}`
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

    throw new Error('Invalid liquidity operation type')

  } catch (error) {
    console.error('Liquidity management error:', error)
    
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