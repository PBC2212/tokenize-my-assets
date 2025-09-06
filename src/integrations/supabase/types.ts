export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          metadata: Json | null
          status: string | null
          timestamp: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          status?: string | null
          timestamp?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          status?: string | null
          timestamp?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          available_tokens: number
          created_at: string
          description: string
          highlights: string[]
          id: number
          image_url: string | null
          investors_count: number
          location: string
          minimum_investment: number
          name: string
          roi_percentage: number
          status: string
          token_price: number
          tokenized_percentage: number
          total_tokens: number
          type: string
          updated_at: string
          value_amount: number
          value_currency: string
        }
        Insert: {
          available_tokens?: number
          created_at?: string
          description?: string
          highlights?: string[]
          id?: number
          image_url?: string | null
          investors_count?: number
          location: string
          minimum_investment?: number
          name: string
          roi_percentage: number
          status: string
          token_price?: number
          tokenized_percentage?: number
          total_tokens: number
          type: string
          updated_at?: string
          value_amount: number
          value_currency?: string
        }
        Update: {
          available_tokens?: number
          created_at?: string
          description?: string
          highlights?: string[]
          id?: number
          image_url?: string | null
          investors_count?: number
          location?: string
          minimum_investment?: number
          name?: string
          roi_percentage?: number
          status?: string
          token_price?: number
          tokenized_percentage?: number
          total_tokens?: number
          type?: string
          updated_at?: string
          value_amount?: number
          value_currency?: string
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          created_at: string
          documents: string[] | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          status: string | null
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          documents?: string[] | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: string | null
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          documents?: string[] | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: string | null
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      liquidity_pools: {
        Row: {
          apr: number | null
          contract_address: string | null
          created_at: string
          fees_24h: number | null
          id: string
          is_active: boolean | null
          name: string
          token_a: string
          token_a_id: string | null
          token_b: string
          token_b_id: string | null
          total_liquidity: number | null
          updated_at: string
          volume_24h: number | null
        }
        Insert: {
          apr?: number | null
          contract_address?: string | null
          created_at?: string
          fees_24h?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          token_a: string
          token_a_id?: string | null
          token_b: string
          token_b_id?: string | null
          total_liquidity?: number | null
          updated_at?: string
          volume_24h?: number | null
        }
        Update: {
          apr?: number | null
          contract_address?: string | null
          created_at?: string
          fees_24h?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          token_a?: string
          token_a_id?: string | null
          token_b?: string
          token_b_id?: string | null
          total_liquidity?: number | null
          updated_at?: string
          volume_24h?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "liquidity_pools_token_a_id_fkey"
            columns: ["token_a_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidity_pools_token_b_id_fkey"
            columns: ["token_b_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      liquidity_positions: {
        Row: {
          amount: number
          created_at: string
          entry_price: number
          id: string
          lp_tokens: number
          pool_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          entry_price: number
          id?: string
          lp_tokens: number
          pool_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          entry_price?: number
          id?: string
          lp_tokens?: number
          pool_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liquidity_positions_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "liquidity_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          amount: number
          created_at: string
          id: string
          price_per_token: number
          seller_id: string
          status: string | null
          token_id: string
          total_price: number
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          price_per_token: number
          seller_id: string
          status?: string | null
          token_id: string
          total_price: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          price_per_token?: number
          seller_id?: string
          status?: string | null
          token_id?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tokens: {
        Row: {
          asset_id: string
          contract_address: string
          created_at: string
          decimals: number | null
          fractional: boolean | null
          id: string
          price_per_token: number
          token_name: string
          token_symbol: string
          token_type: string | null
          total_supply: number
          updated_at: string
        }
        Insert: {
          asset_id: string
          contract_address: string
          created_at?: string
          decimals?: number | null
          fractional?: boolean | null
          id?: string
          price_per_token: number
          token_name: string
          token_symbol: string
          token_type?: string | null
          total_supply: number
          updated_at?: string
        }
        Update: {
          asset_id?: string
          contract_address?: string
          created_at?: string
          decimals?: number | null
          fractional?: boolean | null
          id?: string
          price_per_token?: number
          token_name?: string
          token_symbol?: string
          token_type?: string | null
          total_supply?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tokens_asset_id"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "user_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tokens_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "user_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          blockchain_status: string | null
          blockchain_tx_hash: string | null
          created_at: string
          id: string
          price: number | null
          status: string | null
          token_id: string | null
          total_value: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          blockchain_status?: string | null
          blockchain_tx_hash?: string | null
          created_at?: string
          id?: string
          price?: number | null
          status?: string | null
          token_id?: string | null
          total_value: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          blockchain_status?: string | null
          blockchain_tx_hash?: string | null
          created_at?: string
          id?: string
          price?: number | null
          status?: string | null
          token_id?: string | null
          total_value?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      user_assets: {
        Row: {
          approved_at: string | null
          asset_type: string
          contract_address: string | null
          created_at: string
          description: string
          documents: string[] | null
          estimated_value: number
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          status: string | null
          submitted_at: string
          token_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          asset_type: string
          contract_address?: string | null
          created_at?: string
          description: string
          documents?: string[] | null
          estimated_value: number
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: string | null
          submitted_at?: string
          token_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          asset_type?: string
          contract_address?: string | null
          created_at?: string
          description?: string
          documents?: string[] | null
          estimated_value?: number
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: string | null
          submitted_at?: string
          token_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      assets_public_summary: {
        Row: {
          average_roi: number | null
          commodities_count: number | null
          real_estate_count: number | null
          total_assets: number | null
          total_value_millions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
