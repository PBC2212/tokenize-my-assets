import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KYCRequest {
  documents?: string[];
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    nationality?: string;
    address?: string;
  };
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

    if (req.method === 'GET') {
      // Get KYC status
      const { data: kycStatus, error } = await supabaseClient
        .from('kyc_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: kycStatus || { 
            status: 'not_submitted', 
            submitted_at: null, 
            reviewed_at: null, 
            rejection_reason: null 
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

    if (req.method === 'POST') {
      // Submit KYC
      const body = await req.text()
      if (!body.trim()) {
        throw new Error('Request body is empty')
      }
      const { documents, personalInfo, walletAddress }: KYCRequest = JSON.parse(body)

      // Check if user already has a pending or approved KYC
      const { data: existingKYC } = await supabaseClient
        .from('kyc_submissions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'approved'])
        .single()

      if (existingKYC) {
        throw new Error('KYC already submitted or approved')
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

      // Create KYC submission
      const { data: kycSubmission, error: kycError } = await supabaseClient
        .from('kyc_submissions')
        .insert({
          user_id: user.id,
          status: 'pending',
          documents: documents || [],
        })
        .select()
        .single()

      if (kycError) {
        console.error('KYC submission error:', kycError)
        throw new Error('Failed to submit KYC')
      }

      // Update user profile with personal info if provided
      if (personalInfo) {
        await supabaseClient
          .from('profiles')
          .update({
            name: personalInfo.firstName && personalInfo.lastName 
              ? `${personalInfo.firstName} ${personalInfo.lastName}`
              : undefined
          })
          .eq('user_id', user.id)
      }

      // Create activity record
      await supabaseClient
        .from('activities')
        .insert({
          user_id: user.id,
          type: 'kyc_submitted',
          description: 'KYC documents submitted for verification',
          amount: 0,
          status: 'completed',
          metadata: {
            kyc_id: kycSubmission.id,
            documents_count: (documents || []).length,
            wallet_address: walletAddress,
            personal_info_provided: !!personalInfo
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: kycSubmission,
          message: 'KYC submitted successfully and is under review'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    throw new Error('Method not allowed')

  } catch (error) {
    console.error('KYC management error:', error)
    
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