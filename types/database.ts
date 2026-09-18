export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_assets: {
        Row: {
          campaign_id: string
          created_at: string
          created_by: string | null
          external_url: string | null
          file_path: string | null
          id: string
          notes: string
          title: string
          type: Database["public"]["Enums"]["asset_type"]
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          created_by?: string | null
          external_url?: string | null
          file_path?: string | null
          id?: string
          notes?: string
          title: string
          type: Database["public"]["Enums"]["asset_type"]
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          created_by?: string | null
          external_url?: string | null
          file_path?: string | null
          id?: string
          notes?: string
          title?: string
          type?: Database["public"]["Enums"]["asset_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_creators: {
        Row: {
          base_fee: number | null
          bonus_per_1000_views: number | null
          bonus_per_registrant: number | null
          campaign_id: string
          contents_committed: number
          created_at: string
          created_by: string | null
          creator_id: string
          id: string
          joined_at: string | null
          referral_code: string
          status: Database["public"]["Enums"]["assignment_status"]
          tracking_slug: string
          updated_at: string
          views_bonus_cap: number | null
        }
        Insert: {
          base_fee?: number | null
          bonus_per_1000_views?: number | null
          bonus_per_registrant?: number | null
          campaign_id: string
          contents_committed?: number
          created_at?: string
          created_by?: string | null
          creator_id: string
          id?: string
          joined_at?: string | null
          referral_code: string
          status?: Database["public"]["Enums"]["assignment_status"]
          tracking_slug: string
          updated_at?: string
          views_bonus_cap?: number | null
        }
        Update: {
          base_fee?: number | null
          bonus_per_1000_views?: number | null
          bonus_per_registrant?: number | null
          campaign_id?: string
          contents_committed?: number
          created_at?: string
          created_by?: string | null
          creator_id?: string
          id?: string
          joined_at?: string | null
          referral_code?: string
          status?: Database["public"]["Enums"]["assignment_status"]
          tracking_slug?: string
          updated_at?: string
          views_bonus_cap?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_creators_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_creators_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          brief: string
          client_id: string
          closing_notes: string
          code: string
          created_at: string
          created_by: string | null
          default_base_fee: number
          default_bonus_per_1000_views: number
          default_bonus_per_registrant: number
          default_views_bonus_cap: number | null
          end_date: string
          hashtags: string[]
          id: string
          landing_url: string | null
          min_live_days: number
          must_do: string[]
          must_not: string[]
          name: string
          objective: Database["public"]["Enums"]["campaign_objective"]
          package_price: number
          paid_label_required: boolean
          start_date: string
          status: Database["public"]["Enums"]["campaign_status"]
          target_contents: number
          target_registrants: number
          target_views: number
          updated_at: string
        }
        Insert: {
          brief?: string
          client_id: string
          closing_notes?: string
          code: string
          created_at?: string
          created_by?: string | null
          default_base_fee?: number
          default_bonus_per_1000_views?: number
          default_bonus_per_registrant?: number
          default_views_bonus_cap?: number | null
          end_date: string
          hashtags?: string[]
          id?: string
          landing_url?: string | null
          min_live_days?: number
          must_do?: string[]
          must_not?: string[]
          name: string
          objective?: Database["public"]["Enums"]["campaign_objective"]
          package_price?: number
          paid_label_required?: boolean
          start_date: string
          status?: Database["public"]["Enums"]["campaign_status"]
          target_contents?: number
          target_registrants?: number
          target_views?: number
          updated_at?: string
        }
        Update: {
          brief?: string
          client_id?: string
          closing_notes?: string
          code?: string
          created_at?: string
          created_by?: string | null
          default_base_fee?: number
          default_bonus_per_1000_views?: number
          default_bonus_per_registrant?: number
          default_views_bonus_cap?: number | null
          end_date?: string
          hashtags?: string[]
          id?: string
          landing_url?: string | null
          min_live_days?: number
          must_do?: string[]
          must_not?: string[]
          name?: string
          objective?: Database["public"]["Enums"]["campaign_objective"]
          package_price?: number
          paid_label_required?: boolean
          start_date?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          target_contents?: number
          target_registrants?: number
          target_views?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string
          id: string
          is_primary: boolean
          name: string
          phone_wa: string
          position: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string
          id?: string
          is_primary?: boolean
          name: string
          phone_wa?: string
          position?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string
          id?: string
          is_primary?: boolean
          name?: string
          phone_wa?: string
          position?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_payments: {
        Row: {
          amount: number
          campaign_id: string
          created_at: string
          created_by: string | null
          due_date: string
          id: string
          invoice_number: string
          paid_amount: number
          paid_at: string | null
          proof_path: string | null
          status: Database["public"]["Enums"]["client_payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          campaign_id: string
          created_at?: string
          created_by?: string | null
          due_date: string
          id?: string
          invoice_number: string
          paid_amount?: number
          paid_at?: string | null
          proof_path?: string | null
          status?: Database["public"]["Enums"]["client_payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          campaign_id?: string
          created_at?: string
          created_by?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          paid_amount?: number
          paid_at?: string | null
          proof_path?: string | null
          status?: Database["public"]["Enums"]["client_payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_payments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string
          city: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string
          province: string
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string
        }
        Insert: {
          address?: string
          city?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string
          province?: string
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string
          province?: string
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reviews: {
        Row: {
          checklist: Json
          content_id: string
          created_at: string
          decision: Database["public"]["Enums"]["review_decision"]
          draft_snapshot: Json
          id: string
          notes: string
          reviewer_id: string | null
        }
        Insert: {
          checklist?: Json
          content_id: string
          created_at?: string
          decision: Database["public"]["Enums"]["review_decision"]
          draft_snapshot?: Json
          id?: string
          notes?: string
          reviewer_id?: string | null
        }
        Update: {
          checklist?: Json
          content_id?: string
          created_at?: string
          decision?: Database["public"]["Enums"]["review_decision"]
          draft_snapshot?: Json
          id?: string
          notes?: string
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_reviews_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          campaign_creator_id: string
          caption_draft: string
          created_at: string
          created_by: string | null
          draft_file_path: string | null
          draft_url: string | null
          id: string
          live_status: Database["public"]["Enums"]["live_status"]
          platform: Database["public"]["Enums"]["social_platform"]
          posted_at: string | null
          posted_url: string | null
          removed_at: string | null
          review_status: Database["public"]["Enums"]["review_status"]
          revision_count: number
          updated_at: string
        }
        Insert: {
          campaign_creator_id: string
          caption_draft?: string
          created_at?: string
          created_by?: string | null
          draft_file_path?: string | null
          draft_url?: string | null
          id?: string
          live_status?: Database["public"]["Enums"]["live_status"]
          platform: Database["public"]["Enums"]["social_platform"]
          posted_at?: string | null
          posted_url?: string | null
          removed_at?: string | null
          review_status?: Database["public"]["Enums"]["review_status"]
          revision_count?: number
          updated_at?: string
        }
        Update: {
          campaign_creator_id?: string
          caption_draft?: string
          created_at?: string
          created_by?: string | null
          draft_file_path?: string | null
          draft_url?: string | null
          id?: string
          live_status?: Database["public"]["Enums"]["live_status"]
          platform?: Database["public"]["Enums"]["social_platform"]
          posted_at?: string | null
          posted_url?: string | null
          removed_at?: string | null
          review_status?: Database["public"]["Enums"]["review_status"]
          revision_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contents_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "campaign_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_bank_accounts: {
        Row: {
          account_holder: string
          account_number: string
          bank_name: string
          created_at: string
          creator_id: string
          id: string
          updated_at: string
        }
        Insert: {
          account_holder: string
          account_number: string
          bank_name: string
          created_at?: string
          creator_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          account_holder?: string
          account_number?: string
          bank_name?: string
          created_at?: string
          creator_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_bank_accounts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_social_accounts: {
        Row: {
          audience_proof_path: string | null
          created_at: string
          creator_id: string
          followers_count: number
          handle: string
          id: string
          kalimantan_audience_pct: number | null
          last_verified_at: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          profile_url: string
          top_cities: string
          updated_at: string
        }
        Insert: {
          audience_proof_path?: string | null
          created_at?: string
          creator_id: string
          followers_count?: number
          handle: string
          id?: string
          kalimantan_audience_pct?: number | null
          last_verified_at?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          profile_url?: string
          top_cities?: string
          updated_at?: string
        }
        Update: {
          audience_proof_path?: string | null
          created_at?: string
          creator_id?: string
          followers_count?: number
          handle?: string
          id?: string
          kalimantan_audience_pct?: number | null
          last_verified_at?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          profile_url?: string
          top_cities?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_social_accounts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          birth_date: string
          city: string
          created_at: string
          created_by: string | null
          email: string
          full_name: string
          id: string
          niches: string[]
          notes: string
          phone_wa: string
          province: string
          stage_name: string
          status: Database["public"]["Enums"]["creator_status"]
          terms_agreed_at: string | null
          terms_version: string | null
          tier: Database["public"]["Enums"]["creator_tier"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          birth_date: string
          city?: string
          created_at?: string
          created_by?: string | null
          email?: string
          full_name: string
          id?: string
          niches?: string[]
          notes?: string
          phone_wa?: string
          province?: string
          stage_name?: string
          status?: Database["public"]["Enums"]["creator_status"]
          terms_agreed_at?: string | null
          terms_version?: string | null
          tier?: Database["public"]["Enums"]["creator_tier"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          birth_date?: string
          city?: string
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          niches?: string[]
          notes?: string
          phone_wa?: string
          province?: string
          stage_name?: string
          status?: Database["public"]["Enums"]["creator_status"]
          terms_agreed_at?: string | null
          terms_version?: string | null
          tier?: Database["public"]["Enums"]["creator_tier"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creators_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creators_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      link_clicks: {
        Row: {
          campaign_creator_id: string
          clicked_at: string
          created_at: string
          id: string
          ip_hash: string | null
          is_bot: boolean
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_creator_id: string
          clicked_at?: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          is_bot?: boolean
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_creator_id?: string
          clicked_at?: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          is_bot?: boolean
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "campaign_creators"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_snapshots: {
        Row: {
          captured_at: string
          checkpoint: Database["public"]["Enums"]["metric_checkpoint"]
          comments: number
          content_id: string
          created_at: string
          entered_by: string | null
          id: string
          likes: number
          proof_path: string
          saves: number
          shares: number
          updated_at: string
          views: number
        }
        Insert: {
          captured_at: string
          checkpoint: Database["public"]["Enums"]["metric_checkpoint"]
          comments?: number
          content_id: string
          created_at?: string
          entered_by?: string | null
          id?: string
          likes?: number
          proof_path: string
          saves?: number
          shares?: number
          updated_at?: string
          views?: number
        }
        Update: {
          captured_at?: string
          checkpoint?: Database["public"]["Enums"]["metric_checkpoint"]
          comments?: number
          content_id?: string
          created_at?: string
          entered_by?: string | null
          id?: string
          likes?: number
          proof_path?: string
          saves?: number
          shares?: number
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "metric_snapshots_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_snapshots_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_time_logs: {
        Row: {
          activity: Database["public"]["Enums"]["ops_activity"]
          campaign_id: string
          created_at: string
          id: string
          log_date: string
          minutes: number
          notes: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity: Database["public"]["Enums"]["ops_activity"]
          campaign_id: string
          created_at?: string
          id?: string
          log_date: string
          minutes: number
          notes?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          activity?: Database["public"]["Enums"]["ops_activity"]
          campaign_id?: string
          created_at?: string
          id?: string
          log_date?: string
          minutes?: number
          notes?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_time_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_time_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          adjustment_amount: number
          adjustment_reason: string
          approved_at: string | null
          approved_by: string | null
          base_amount: number
          calculated_at: string
          calculation_snapshot: Json
          campaign_creator_id: string
          created_at: string
          created_by: string | null
          id: string
          paid_at: string | null
          registrant_bonus: number
          status: Database["public"]["Enums"]["payout_status"]
          total_amount: number
          transfer_proof_path: string | null
          updated_at: string
          views_bonus: number
        }
        Insert: {
          adjustment_amount?: number
          adjustment_reason?: string
          approved_at?: string | null
          approved_by?: string | null
          base_amount?: number
          calculated_at?: string
          calculation_snapshot?: Json
          campaign_creator_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          paid_at?: string | null
          registrant_bonus?: number
          status?: Database["public"]["Enums"]["payout_status"]
          total_amount?: number
          transfer_proof_path?: string | null
          updated_at?: string
          views_bonus?: number
        }
        Update: {
          adjustment_amount?: number
          adjustment_reason?: string
          approved_at?: string | null
          approved_by?: string | null
          base_amount?: number
          calculated_at?: string
          calculation_snapshot?: Json
          campaign_creator_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          paid_at?: string | null
          registrant_bonus?: number
          status?: Database["public"]["Enums"]["payout_status"]
          total_amount?: number
          transfer_proof_path?: string | null
          updated_at?: string
          views_bonus?: number
        }
        Relationships: [
          {
            foreignKeyName: "payouts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: true
            referencedRelation: "campaign_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      registrant_reports: {
        Row: {
          campaign_creator_id: string | null
          campaign_id: string
          created_at: string
          entered_by: string | null
          id: string
          notes: string
          period_end: string
          period_start: string
          proof_confirmed_no_personal_data: boolean
          proof_path: string | null
          registrant_count: number
          updated_at: string
        }
        Insert: {
          campaign_creator_id?: string | null
          campaign_id: string
          created_at?: string
          entered_by?: string | null
          id?: string
          notes?: string
          period_end: string
          period_start: string
          proof_confirmed_no_personal_data?: boolean
          proof_path?: string | null
          registrant_count: number
          updated_at?: string
        }
        Update: {
          campaign_creator_id?: string | null
          campaign_id?: string
          created_at?: string
          entered_by?: string | null
          id?: string
          notes?: string
          period_end?: string
          period_start?: string
          proof_confirmed_no_personal_data?: boolean
          proof_path?: string | null
          registrant_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrant_reports_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "campaign_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrant_reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrant_reports_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assert_campaign_editable: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      content_campaign_id: {
        Args: { p_campaign_creator_id: string }
        Returns: string
      }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_masked_bank_account: {
        Args: { p_creator_id: string }
        Returns: {
          account_number_masked: string
          bank_name: string
        }[]
      }
      is_active_member: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
    }
    Enums: {
      asset_type: "video" | "foto" | "dokumen" | "tautan"
      assignment_status: "diundang" | "bergabung" | "mundur" | "selesai"
      campaign_objective: "pendaftar" | "awareness" | "event"
      campaign_status: "draft" | "aktif" | "selesai" | "dibatalkan"
      client_payment_status: "belum_dibayar" | "sebagian" | "lunas"
      client_type:
        | "kampus_swasta"
        | "sekolah_swasta"
        | "bank_daerah"
        | "bumd"
        | "pemda"
        | "event_organizer"
        | "umkm"
        | "lainnya"
      creator_status:
        | "prospek"
        | "terverifikasi"
        | "aktif"
        | "nonaktif"
        | "diblokir"
      creator_tier: "nano" | "mikro" | "menengah"
      live_status: "belum_tayang" | "tayang" | "dihapus"
      metric_checkpoint: "H+1" | "H+3" | "H+7" | "akhir" | "lainnya"
      ops_activity:
        | "review"
        | "rekap_metrik"
        | "koordinasi_kreator"
        | "koordinasi_klien"
        | "pembayaran"
        | "laporan"
        | "lainnya"
      payout_status: "draf" | "disetujui" | "dibayar"
      review_decision: "disetujui" | "revisi" | "ditolak"
      review_status: "menunggu_review" | "disetujui" | "revisi" | "ditolak"
      social_platform: "tiktok" | "instagram" | "youtube" | "facebook"
      user_role: "owner" | "manager"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      asset_type: ["video", "foto", "dokumen", "tautan"],
      assignment_status: ["diundang", "bergabung", "mundur", "selesai"],
      campaign_objective: ["pendaftar", "awareness", "event"],
      campaign_status: ["draft", "aktif", "selesai", "dibatalkan"],
      client_payment_status: ["belum_dibayar", "sebagian", "lunas"],
      client_type: [
        "kampus_swasta",
        "sekolah_swasta",
        "bank_daerah",
        "bumd",
        "pemda",
        "event_organizer",
        "umkm",
        "lainnya",
      ],
      creator_status: [
        "prospek",
        "terverifikasi",
        "aktif",
        "nonaktif",
        "diblokir",
      ],
      creator_tier: ["nano", "mikro", "menengah"],
      live_status: ["belum_tayang", "tayang", "dihapus"],
      metric_checkpoint: ["H+1", "H+3", "H+7", "akhir", "lainnya"],
      ops_activity: [
        "review",
        "rekap_metrik",
        "koordinasi_kreator",
        "koordinasi_klien",
        "pembayaran",
        "laporan",
        "lainnya",
      ],
      payout_status: ["draf", "disetujui", "dibayar"],
      review_decision: ["disetujui", "revisi", "ditolak"],
      review_status: ["menunggu_review", "disetujui", "revisi", "ditolak"],
      social_platform: ["tiktok", "instagram", "youtube", "facebook"],
      user_role: ["owner", "manager"],
    },
  },
} as const

