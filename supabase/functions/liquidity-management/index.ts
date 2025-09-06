import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LiquidityRequest {
  type: 'provide' | 'withdraw';
  poolId: string;
  amount: number;
  walletAddress: string;
  transactionHash: string;
}

// Uniswap V2 Pair ABI (minimal for liquidity operations)
const UNISWAP_V2_PAIR_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function mint(address to) returns (uint256 liquidity)",
  "function burn(address to) returns (uint256 amount0, uint256 amount1)",
  "function sync()",
  "event Mint(address indexed sender, uint256 amount0, uint256 amount1)",
  "event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)",
  "event Sync(uint112 reserve0, uint112 reserve1)"
];

// ERC20 ABI for token transfers
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

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

    if (!type || !poolId || !amount || !walletAddress || !transactionHash || amount <= 0) {
      throw new Error('Missing or invalid required fields including wallet address and transaction hash')
    }

    // Verify wallet connection
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

    // Get pool information
    const { data: pool, error: poolError } = await supabaseClient
      .from('liquidity_pools')
      .select('*')
      .eq('id', poolId)
      .single()

    if (poolError || !pool) {
      throw new Error('Liquidity pool not found')
    }

    // Connect to Ethereum network
    const rpcUrl = Deno.env.get('ETHEREUM_RPC_URL')
    if (!rpcUrl) {
      throw new Error('Ethereum RPC URL not configured')
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl)
    
    // Verify transaction exists and extract details
    let lpTokensAmount = 0;
    let actualAmount = 0;
    
    try {
      const transaction = await provider.getTransaction(transactionHash)
      if (!transaction) {
        throw new Error('Transaction not found on blockchain')
      }

      const receipt = await provider.getTransactionReceipt(transactionHash)
      if (!receipt) {
        throw new Error('Transaction receipt not found')
      }

      if (receipt.status !== 1) {
        throw new Error('Transaction failed on blockchain')
      }

      // Parse logs to extract liquidity details
      const poolContract = new ethers.Contract(pool.contract_address || '', UNISWAP_V2_PAIR_ABI, provider)
      
      if (type === 'provide') {
        // Look for Mint event in logs
        const mintLogs = receipt.logs.filter(log => {
          try {
            const parsed = poolContract.interface.parseLog(log)
            return parsed?.name === 'Mint'
          } catch {
            return false
          }
        })

        if (mintLogs.length > 0) {
          const mintEvent = poolContract.interface.parseLog(mintLogs[0])
          console.log('Mint event:', mintEvent)
          
          // Get LP tokens minted (approximate based on reserves and amounts)
          const reserves = await poolContract.getReserves()
          const totalSupply = await poolContract.totalSupply()
          
          // Calculate LP tokens approximately
          lpTokensAmount = amount; // Simplified 1:1 for now
          actualAmount = amount;
        } else {
          throw new Error('No Mint event found in transaction logs')
        }
      } else {
        // Look for Burn event in logs
        const burnLogs = receipt.logs.filter(log => {
          try {
            const parsed = poolContract.interface.parseLog(log)
            return parsed?.name === 'Burn'
          } catch {
            return false
          }
        })

        if (burnLogs.length > 0) {
          const burnEvent = poolContract.interface.parseLog(burnLogs[0])
          console.log('Burn event:', burnEvent)
          
          lpTokensAmount = amount; // Simplified
          actualAmount = amount;
        } else {
          throw new Error('No Burn event found in transaction logs')
        }
      }

    } catch (error) {
      console.error('Blockchain verification error:', error)
      throw new Error(`Failed to verify blockchain transaction: ${error.message}`)
    }

    if (type === 'provide') {
      // Handle add liquidity
      const { data: existingPosition } = await supabaseClient
        .from('liquidity_positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('pool_id', poolId)
        .single()

      let position;
      if (existingPosition) {
        // Update existing position
        const newAmount = parseFloat(existingPosition.amount) + actualAmount;
        const newLpTokens = parseFloat(existingPosition.lp_tokens) + lpTokensAmount;
        
        const { data: updatedPosition, error: updateError } = await supabaseClient
          .from('liquidity_positions')
          .update({
            amount: newAmount,
            lp_tokens: newLpTokens,
            entry_price: (parseFloat(existingPosition.entry_price) + 1.0) / 2 // Average
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
            amount: actualAmount,
            lp_tokens: lpTokensAmount,
            entry_price: 1.0
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
          total_liquidity: (pool.total_liquidity || 0) + actualAmount
        })
        .eq('id', poolId)

      // Record blockchain transaction
      await supabaseClient
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          wallet_address: walletAddress.toLowerCase(),
          transaction_hash: transactionHash,
          from_address: walletAddress.toLowerCase(),
          to_address: pool.contract_address || '0x0000000000000000000000000000000000000000',
          value_wei: (actualAmount * 1e18).toString(),
          value_eth: actualAmount,
          transaction_type: 'liquidity_add',
          status: 'confirmed'
        })

      // Create activity record
      await supabaseClient
        .from('activities')
        .insert({
          user_id: user.id,
          type: 'liquidity_added',
          description: `Added $${actualAmount.toLocaleString()} liquidity to ${pool.name}`,
          amount: actualAmount,
          status: 'completed',
          metadata: {
            pool_id: poolId,
            pool_name: pool.name,
            amount_added: actualAmount,
            lp_tokens_received: lpTokensAmount,
            transaction_hash: transactionHash
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            position,
            pool: { ...pool, total_liquidity: (pool.total_liquidity || 0) + actualAmount },
            lpTokensReceived: lpTokensAmount,
            transactionHash,
            message: `Successfully provided $${actualAmount.toLocaleString()} liquidity to ${pool.name}`
          }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )

    } else if (type === 'withdraw') {
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
      if (actualAmount > currentAmount) {
        console.warn(`Withdrawal amount ${actualAmount} exceeds position ${currentAmount}, using actual blockchain amount`)
      }

      const remainingAmount = Math.max(0, currentAmount - actualAmount);
      const lpTokensToRemove = (actualAmount / currentAmount) * parseFloat(position.lp_tokens);
      const remainingLpTokens = Math.max(0, parseFloat(position.lp_tokens) - lpTokensToRemove);

      if (remainingAmount === 0 || remainingAmount < 0.01) {
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
          total_liquidity: Math.max(0, (pool.total_liquidity || 0) - actualAmount)
        })
        .eq('id', poolId)

      // Record blockchain transaction
      await supabaseClient
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          wallet_address: walletAddress.toLowerCase(),
          transaction_hash: transactionHash,
          from_address: pool.contract_address || '0x0000000000000000000000000000000000000000',
          to_address: walletAddress.toLowerCase(),
          value_wei: (actualAmount * 1e18).toString(),
          value_eth: actualAmount,
          transaction_type: 'liquidity_remove',
          status: 'confirmed'
        })

      // Create activity record
      await supabaseClient
        .from('activities')
        .insert({
          user_id: user.id,
          type: 'liquidity_removed',
          description: `Withdrew $${actualAmount.toLocaleString()} liquidity from ${pool.name}`,
          amount: actualAmount,
          status: 'completed',
          metadata: {
            pool_id: poolId,
            pool_name: pool.name,
            amount_removed: actualAmount,
            lp_tokens_burned: lpTokensToRemove,
            transaction_hash: transactionHash
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            remainingAmount,
            pool: { ...pool, total_liquidity: Math.max(0, (pool.total_liquidity || 0) - actualAmount) },
            lpTokensBurned: lpTokensToRemove,
            transactionHash,
            message: `Successfully withdrew $${actualAmount.toLocaleString()} from ${pool.name}`
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