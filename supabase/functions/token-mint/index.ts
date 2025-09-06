import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6.7.1'

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
  walletAddress: string;
  transactionHash: string;
}

// ERC20 Token Contract ABI (minimal for deployment verification)
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Simple ERC20 Token Contract Bytecode (for deployment)
const ERC20_BYTECODE = "0x608060405234801561001057600080fd5b506040516108fc3803806108fc8339818101604052810190610032919061018b565b8360039080519060200190610048929190610268565b50826004908051906020019061005f929190610268565b508160058190555080600681905550806000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550505050506103c7565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b610118826100cf565b810181811067ffffffffffffffff82111715610137576101366100e0565b5b80604052505050565b600061014a6100a6565b9050610156828261010f565b919050565b600067ffffffffffffffff821115610176576101756100e0565b5b61017f826100cf565b9050602081019050919050565b6000815190506101a08161035b565b92915050565b6000815190506101b581610362565b92915050565b6000815190506101ca81610369565b92915050565b6000602082840312156101e6576101e56100b0565b5b60006101f4848285016101bb565b91505092915050565b60008115159050919050565b610212816101fd565b811461021d57600080fd5b50565b60008151905061022f81610209565b92915050565b60006020828403121561024b5761024a6100b0565b5b600061025984828501610220565b91505092915050565b828054610274906102f6565b90600052602060002090601f01602090048101928261029657600085556102dd565b82601f106102af57805160ff19168380011785556102dd565b828001600101855582156102dd579182015b828111156102dc5782518255916020019190600101906102c1565b5b5090506102ea91906102ee565b5090565b5b808211156103075760008160009055506001016102ef565b5090565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061035457607f821691505b602082108114156103685761036761030d565b5b50919050565b61037181610191565b811461037c57600080fd5b50565b61038881610191565b811461039357600080fd5b50565b61039f816101fd565b81146103aa57600080fd5b50565b6105268061041c6000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c8063313ce5671161005b578063313ce567146101145780635cf0e3b11461013257806370a0823114610162578063a9059cbb1461019257600080fd5b806306fdde031461008d578063095ea7b3146100ab57806318160ddd146100db57806323b872dd146100f9575b600080fd5b6100956101c2565b6040516100a29190610350565b60405180910390f35b6100c560048036038101906100c09190610404565b610250565b6040516100d2919061045f565b60405180910390f35b6100e3610342565b6040516100f0919061048a565b60405180910390f35b610113600480360381019061010e91906104a5565b610348565b005b61011c610430565b604051610129919061048a565b60405180910390f35b61014c600480360381019061014791906104f8565b610436565b604051610159919061045f565b60405180910390f35b61017c60048036038101906101779190610525565b610469565b604051610189919061048a565b60405180910390f35b6101ac60048036038101906101a79190610404565b6104b1565b6040516101b9919061045f565b60405180910390f35b6060600380546101d190610581565b80601f01602080910402602001604051908101604052809291908181526020018280546101fd90610581565b801561024a5780601f1061021f5761010080835404028352916020019161024a565b820191906000526020600020905b81548152906001019060200180831161022d57829003601f168201915b50505050509050919050565b600081600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92584604051610330919061048a565b60405180910390a36001905092915050565b60055481565b60008060008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054831115610394576103e7565b816000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546103e291906105e2565b925050819055505b505050565b60065481565b600081600020600085815260200190815260200160002054821115610459576000806101000a81549073ffffffffffffffffffffffffffffffffffffffff021916905581905061046057506000610463565b60015b9392505050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b600081600080600001337310000000000000000000000000000000000000000152549050919050565b600081905092915050565b60008190508192915050565b600081905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610399575060405180910390fd5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006105da826104d4565b91506105e5836104d4565b9250828210156105f8576105f7610617565b5b828203905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061066c82610641565b9050919050565b61067c81610661565b811461068757600080fd5b50565b60008135905061069981610673565b92915050565b6000819050919050565b6106b28161069f565b81146106bd57600080fd5b50565b6000813590506106cf816106a9565b92915050565b6000604082840312156106eb576106ea61063c565b5b60006106f98482850161068a565b915050602061070a848285016106c0565b9150509250929050565b60008115159050919050565b61072981610714565b82525050565b60006020820190506107446000830184610720565b92915050565b6107538161069f565b82525050565b600060208201905061076e600083018461074a565b92915050565b60006060828403121561078a5761078961063c565b5b600061079884828501610400565b91505060206107a984828501610400565b91505060406107ba848285016106c0565b9150509250925092565b600080fd5b600080fd5b600080fd5b60008083601f8401126108e95761088561036a565b5b8235905067ffffffffffffffff81111561090157610900610385565b5b60208301915083600182028301111561091d5761091c61038a565b5b9250929050565b6000806020838503121561093b5761093a61063c565b5b600083013567ffffffffffffffff81111561095957610958610641565b5b610965858286016108d3565b92509250509250929050565b60006020828403121561098757610986610636565b5b6000610995848285016106c0565b91505092915050565b610999"

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
    const { 
      assetId, 
      tokenName, 
      tokenSymbol, 
      totalSupply, 
      pricePerToken, 
      decimals,
      walletAddress,
      transactionHash 
    }: TokenMintRequest = JSON.parse(body)

    // Validate input
    if (!assetId || !tokenName || !tokenSymbol || !totalSupply || !pricePerToken || totalSupply <= 0 || pricePerToken <= 0) {
      throw new Error('Missing or invalid required fields')
    }

    // Check if this is a demo token (non-blockchain) request
    const isDemoToken = !transactionHash || transactionHash.startsWith('demo-') || !walletAddress || walletAddress === 'demo'
    
    if (!isDemoToken && (!walletAddress || !transactionHash)) {
      throw new Error('Missing wallet address and transaction hash for blockchain deployment')
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

    // For demo tokens, skip wallet verification
    if (!isDemoToken) {
      // Verify wallet connection for real blockchain tokens only
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
    }

    // Verify blockchain transaction for real tokens only
    let contractAddress = '';
    
    if (!isDemoToken) {
      // Connect to Ethereum network
      const rpcUrl = Deno.env.get('ETHEREUM_RPC_URL')
      if (!rpcUrl) {
        throw new Error('Ethereum RPC URL not configured')
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl)
      
      try {
        const transaction = await provider.getTransaction(transactionHash)
        if (!transaction) {
          throw new Error('Transaction not found on blockchain')
        }

        // Get transaction receipt to get contract address
        const receipt = await provider.getTransactionReceipt(transactionHash)
        if (!receipt) {
          throw new Error('Transaction receipt not found')
        }

        if (receipt.status !== 1) {
          throw new Error('Transaction failed on blockchain')
        }

        contractAddress = receipt.contractAddress || '';
        if (!contractAddress) {
          throw new Error('No contract address found in transaction receipt')
        }

        console.log(`Token contract deployed at: ${contractAddress}`)

        // Verify contract is ERC20 token by checking methods exist
        const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider)
        
        try {
          const name = await contract.name()
          const symbol = await contract.symbol()
          const supply = await contract.totalSupply()
          const decimalsValue = await contract.decimals()
          
          console.log(`Verified ERC20 token: ${name} (${symbol}), Supply: ${supply.toString()}, Decimals: ${decimalsValue}`)
          
          // Validate token details match request
          if (symbol !== tokenSymbol.toUpperCase()) {
            console.warn(`Token symbol mismatch: expected ${tokenSymbol}, got ${symbol}`)
          }
          
        } catch (error) {
          console.error('Error verifying contract:', error)
          throw new Error('Invalid ERC20 contract or contract not yet available')
        }

      } catch (error) {
        console.error('Blockchain verification error:', error)
        throw new Error(`Failed to verify blockchain transaction: ${error.message}`)
      }
    } else {
      // For demo tokens, generate a mock contract address
      contractAddress = `0xdemo${Math.random().toString(16).substr(2, 8)}`
      console.log(`Demo token created with mock contract address: ${contractAddress}`)
    }

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
        token_type: isDemoToken ? 'Demo' : 'ERC20'
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

    // Record transaction for both demo and real tokens
    if (!isDemoToken) {
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
        description: `Minted ${totalSupply.toLocaleString()} ${tokenSymbol} ${isDemoToken ? 'demo ' : ''}tokens for ${asset.asset_type}`,
        amount: totalSupply * pricePerToken,
        status: 'completed',
        metadata: {
          asset_id: assetId,
          token_id: tokenData.id,
          token_symbol: tokenSymbol,
          total_supply: totalSupply,
          price_per_token: pricePerToken,
          contract_address: contractAddress,
          wallet_address: walletAddress || 'demo',
          transaction_hash: transactionHash || 'demo'
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
          contractAddress,
          transactionHash
        },
        message: `${isDemoToken ? 'Demo tokens' : 'Tokens'} minted successfully${isDemoToken ? '' : ' on blockchain'} and listed on marketplace` 
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