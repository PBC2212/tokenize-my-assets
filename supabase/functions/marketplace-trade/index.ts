import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TradeRequest {
  type: 'buy' | 'sell';
  tokenId: string;
  amount: number;
  price?: number;
  walletAddress: string;
  transactionHash?: string;
}

// ERC20 ABI for token transfers
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
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
    const { type, tokenId, amount, price, walletAddress, transactionHash }: TradeRequest = JSON.parse(body)

    if (!type || !tokenId || !amount || !walletAddress || amount <= 0) {
      throw new Error('Missing or invalid required fields')
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

    // Connect to Ethereum network
    const rpcUrl = Deno.env.get('ETHEREUM_RPC_URL')
    if (!rpcUrl) {
      throw new Error('Ethereum RPC URL not configured')
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl)

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

      // Generate a demo transaction hash if not provided (for testing purposes)
      const finalTransactionHash = transactionHash || `0xdemo${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

      // Verify transaction on blockchain only if transaction hash is provided and not a demo hash
      if (transactionHash && !transactionHash.startsWith('0xdemo')) {
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

          // Verify this is a token transfer to the buyer
          const tokenContract = new ethers.Contract(listing.tokens.contract_address, ERC20_ABI, provider)
          
          // Parse Transfer events from the transaction
          const transferLogs = receipt.logs.filter(log => {
            try {
              const parsed = tokenContract.interface.parseLog(log)
              return parsed?.name === 'Transfer'
            } catch {
              return false
            }
          })

          if (transferLogs.length === 0) {
            throw new Error('No token transfer found in transaction')
          }

          const transferEvent = tokenContract.interface.parseLog(transferLogs[0])
          const transferAmount = ethers.formatUnits(transferEvent.args.value, listing.tokens.decimals)
          
          console.log(`Verified token transfer: ${transferAmount} ${listing.tokens.token_symbol} to ${transferEvent.args.to}`)
          
          if (parseFloat(transferAmount) < amount) {
            throw new Error(`Insufficient token transfer amount: expected ${amount}, got ${transferAmount}`)
          }

        } catch (error) {
          console.error('Blockchain verification error:', error)
          throw new Error(`Failed to verify blockchain transaction: ${error.message}`)
        }
      } else {
        console.log(`Processing demo purchase: ${amount} ${listing.tokens.token_symbol} tokens for ${walletAddress}`)
      }

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
          status: 'confirmed',
          blockchain_tx_hash: finalTransactionHash
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

      // Record blockchain transaction
      await supabaseClient
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          wallet_address: walletAddress.toLowerCase(),
          transaction_hash: finalTransactionHash,
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
            transaction_hash: finalTransactionHash
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            transaction,
            transactionHash: finalTransactionHash,
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

      // Generate a demo transaction hash if not provided (for testing purposes)  
      const finalTransactionHash = transactionHash || `0xdemo${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

      // Verify transaction on blockchain only if transaction hash is provided and not a demo hash
      if (transactionHash && !transactionHash.startsWith('0xdemo')) {
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

          // Verify token approval or transfer
          const tokenContract = new ethers.Contract(tokenInfo.contract_address, ERC20_ABI, provider)
          
          // Check for Transfer or Approval events
          const relevantLogs = receipt.logs.filter(log => {
            try {
              const parsed = tokenContract.interface.parseLog(log)
              return parsed?.name === 'Transfer' || parsed?.name === 'Approval'
            } catch {
              return false
            }
          })

          if (relevantLogs.length === 0) {
            throw new Error('No token transfer or approval found in transaction')
          }

          console.log(`Verified token listing transaction for ${amount} ${tokenInfo.token_symbol}`)

        } catch (error) {
          console.error('Blockchain verification error:', error)
          throw new Error(`Failed to verify blockchain transaction: ${error.message}`)
        }
      } else {
        console.log(`Processing demo listing: ${amount} ${tokenInfo.token_symbol} tokens at $${price} each for ${walletAddress}`)
      }

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

      // Record blockchain transaction
      await supabaseClient
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          wallet_address: walletAddress.toLowerCase(),
          transaction_hash: finalTransactionHash,
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
            transaction_hash: finalTransactionHash
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            listing,
            transactionHash: finalTransactionHash,
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