import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransactionRequest {
  transactionHash: string;
  walletAddress: string;
  fromAddress: string;
  toAddress: string;
  valueWei: string;
  valueEth?: number;
  gasUsed?: number;
  gasPrice?: string;
  blockNumber?: number;
  blockHash?: string;
  chainId?: number;
  transactionType?: string;
  tokenContractAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
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

    if (req.method === 'GET') {
      // Fetch user's wallet transactions
      const { data: transactions, error } = await supabaseClient
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          transactions 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    if (req.method === 'POST') {
      const body = await req.text()
      if (!body.trim()) {
        throw new Error('Request body is empty')
      }
      const transactionData: TransactionRequest = JSON.parse(body)

      // Validate required fields
      if (!transactionData.transactionHash || !transactionData.walletAddress) {
        throw new Error('Missing required transaction data')
      }

      // Verify the wallet belongs to the user
      const { data: walletConnection, error: walletError } = await supabaseClient
        .from('wallet_connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('wallet_address', transactionData.walletAddress.toLowerCase())
        .single()

      if (walletError || !walletConnection) {
        throw new Error('Wallet not connected to user account')
      }

      // Insert transaction record
      const { data: transaction, error: insertError } = await supabaseClient
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          wallet_address: transactionData.walletAddress.toLowerCase(),
          transaction_hash: transactionData.transactionHash,
          from_address: transactionData.fromAddress,
          to_address: transactionData.toAddress,
          value_wei: transactionData.valueWei,
          value_eth: transactionData.valueEth,
          gas_used: transactionData.gasUsed,
          gas_price: transactionData.gasPrice,
          block_number: transactionData.blockNumber,
          block_hash: transactionData.blockHash,
          chain_id: transactionData.chainId || 1,
          status: 'confirmed',
          transaction_type: transactionData.transactionType || 'transfer',
          token_contract_address: transactionData.tokenContractAddress,
          token_symbol: transactionData.tokenSymbol,
          token_decimals: transactionData.tokenDecimals,
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Log activity
      await supabaseClient
        .from('activities')
        .insert({
          user_id: user.id,
          type: 'blockchain_transaction',
          description: `Blockchain transaction recorded: ${transactionData.transactionHash}`,
          amount: transactionData.valueEth || 0,
          metadata: {
            transaction_hash: transactionData.transactionHash,
            wallet_address: transactionData.walletAddress,
            transaction_type: transactionData.transactionType,
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          transaction,
          message: 'Transaction recorded successfully' 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Wallet transactions error:', error)
    
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