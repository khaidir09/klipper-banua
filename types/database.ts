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
            foreignKeyName: "campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "client_portal_campaigns"
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
          creator_confirmed_at: string | null
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
          creator_confirmed_at?: string | null
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
          creator_confirmed_at?: string | null
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
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "client_portal_campaigns"
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
            referencedRelation: "creator_portal_profile"
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
          portal_invited_at: string | null
          position: string
          profile_id: string | null
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
          portal_invited_at?: string | null
          position?: string
          profile_id?: string | null
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
          portal_invited_at?: string | null
          position?: string
          profile_id?: string | null
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
          {
            foreignKeyName: "client_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
            foreignKeyName: "client_payments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "client_portal_campaigns"
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
            referencedRelation: "client_portal_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reviews_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reviews_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_contents"
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
          proposed_at: string | null
          proposed_posted_at: string | null
          proposed_posted_url: string | null
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
          proposed_at?: string | null
          proposed_posted_at?: string | null
          proposed_posted_url?: string | null
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
          proposed_at?: string | null
          proposed_posted_at?: string | null
          proposed_posted_url?: string | null
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
            foreignKeyName: "contents_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "client_portal_contents"
            referencedColumns: ["campaign_creator_id"]
          },
          {
            foreignKeyName: "contents_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "client_portal_creators"
            referencedColumns: ["campaign_creator_id"]
          },
          {
            foreignKeyName: "contents_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_assignments"
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
            referencedRelation: "creator_portal_profile"
            referencedColumns: ["id"]
          },
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
          badge_requested_at: string | null
          badge_review_notes: string | null
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
          badge_requested_at?: string | null
          badge_review_notes?: string | null
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
          badge_requested_at?: string | null
          badge_review_notes?: string | null
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
            referencedRelation: "creator_portal_profile"
            referencedColumns: ["id"]
          },
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
          anonymized_at: string | null
          birth_date: string | null
          blocked_at: string | null
          blocked_reason: string | null
          city: string
          created_at: string
          created_by: string | null
          deletion_requested_at: string | null
          email: string
          full_name: string
          id: string
          niches: string[]
          notes: string
          phone_wa: string
          portal_invited_at: string | null
          profile_id: string | null
          province: string
          signup_source: Database["public"]["Enums"]["signup_source"]
          stage_name: string
          status: Database["public"]["Enums"]["creator_status"]
          terms_agreed_at: string | null
          terms_version: string | null
          tier: Database["public"]["Enums"]["creator_tier"]
          updated_at: string
          verification_code: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          anonymized_at?: string | null
          birth_date?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          city?: string
          created_at?: string
          created_by?: string | null
          deletion_requested_at?: string | null
          email?: string
          full_name: string
          id?: string
          niches?: string[]
          notes?: string
          phone_wa?: string
          portal_invited_at?: string | null
          profile_id?: string | null
          province?: string
          signup_source?: Database["public"]["Enums"]["signup_source"]
          stage_name?: string
          status?: Database["public"]["Enums"]["creator_status"]
          terms_agreed_at?: string | null
          terms_version?: string | null
          tier?: Database["public"]["Enums"]["creator_tier"]
          updated_at?: string
          verification_code?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          anonymized_at?: string | null
          birth_date?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          city?: string
          created_at?: string
          created_by?: string | null
          deletion_requested_at?: string | null
          email?: string
          full_name?: string
          id?: string
          niches?: string[]
          notes?: string
          phone_wa?: string
          portal_invited_at?: string | null
          profile_id?: string | null
          province?: string
          signup_source?: Database["public"]["Enums"]["signup_source"]
          stage_name?: string
          status?: Database["public"]["Enums"]["creator_status"]
          terms_agreed_at?: string | null
          terms_version?: string | null
          tier?: Database["public"]["Enums"]["creator_tier"]
          updated_at?: string
          verification_code?: string
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
            foreignKeyName: "creators_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
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
          {
            foreignKeyName: "link_clicks_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "client_portal_contents"
            referencedColumns: ["campaign_creator_id"]
          },
          {
            foreignKeyName: "link_clicks_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "client_portal_creators"
            referencedColumns: ["campaign_creator_id"]
          },
          {
            foreignKeyName: "link_clicks_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_assignments"
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
            referencedRelation: "client_portal_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_snapshots_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_snapshots_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_contents"
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
      metric_submissions: {
        Row: {
          captured_at: string
          checkpoint: Database["public"]["Enums"]["metric_checkpoint"]
          comments: number
          content_id: string
          created_at: string
          id: string
          likes: number
          proof_path: string
          review_notes: string
          reviewed_at: string | null
          reviewed_by: string | null
          saves: number
          shares: number
          snapshot_id: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submitted_by: string | null
          updated_at: string
          views: number
        }
        Insert: {
          captured_at: string
          checkpoint: Database["public"]["Enums"]["metric_checkpoint"]
          comments?: number
          content_id: string
          created_at?: string
          id?: string
          likes?: number
          proof_path: string
          review_notes?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          saves?: number
          shares?: number
          snapshot_id?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_by?: string | null
          updated_at?: string
          views?: number
        }
        Update: {
          captured_at?: string
          checkpoint?: Database["public"]["Enums"]["metric_checkpoint"]
          comments?: number
          content_id?: string
          created_at?: string
          id?: string
          likes?: number
          proof_path?: string
          review_notes?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          saves?: number
          shares?: number
          snapshot_id?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_by?: string | null
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "metric_submissions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "client_portal_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_submissions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_submissions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_submissions_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "client_portal_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_submissions_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_submissions_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "metric_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_submissions_submitted_by_fkey"
            columns: ["submitted_by"]
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
            foreignKeyName: "ops_time_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "client_portal_campaigns"
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
            foreignKeyName: "payouts_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: true
            referencedRelation: "client_portal_contents"
            referencedColumns: ["campaign_creator_id"]
          },
          {
            foreignKeyName: "payouts_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: true
            referencedRelation: "client_portal_creators"
            referencedColumns: ["campaign_creator_id"]
          },
          {
            foreignKeyName: "payouts_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: true
            referencedRelation: "creator_portal_assignments"
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
            foreignKeyName: "registrant_reports_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "client_portal_contents"
            referencedColumns: ["campaign_creator_id"]
          },
          {
            foreignKeyName: "registrant_reports_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "client_portal_creators"
            referencedColumns: ["campaign_creator_id"]
          },
          {
            foreignKeyName: "registrant_reports_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_assignments"
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
            foreignKeyName: "registrant_reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "client_portal_campaigns"
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
      report_share_links: {
        Row: {
          campaign_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          last_viewed_at: string | null
          revoked_at: string | null
          revoked_by: string | null
          token_hash: string
          view_count: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          token_hash: string
          view_count?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          token_hash?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_share_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_share_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "client_portal_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_share_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_share_links_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      client_portal_campaigns: {
        Row: {
          brief: string | null
          code: string | null
          created_at: string | null
          end_date: string | null
          id: string | null
          min_live_days: number | null
          name: string | null
          objective: Database["public"]["Enums"]["campaign_objective"] | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          target_contents: number | null
          target_registrants: number | null
          target_views: number | null
        }
        Insert: {
          brief?: string | null
          code?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string | null
          min_live_days?: number | null
          name?: string | null
          objective?: Database["public"]["Enums"]["campaign_objective"] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          target_contents?: number | null
          target_registrants?: number | null
          target_views?: number | null
        }
        Update: {
          brief?: string | null
          code?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string | null
          min_live_days?: number | null
          name?: string | null
          objective?: Database["public"]["Enums"]["campaign_objective"] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          target_contents?: number | null
          target_registrants?: number | null
          target_views?: number | null
        }
        Relationships: []
      }
      client_portal_contents: {
        Row: {
          campaign_creator_id: string | null
          campaign_id: string | null
          creator_name: string | null
          id: string | null
          live_status: Database["public"]["Enums"]["live_status"] | null
          platform: Database["public"]["Enums"]["social_platform"] | null
          posted_at: string | null
          posted_url: string | null
          removed_at: string | null
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
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "client_portal_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_creators: {
        Row: {
          campaign_creator_id: string | null
          campaign_id: string | null
          clicks_human: number | null
          clicks_total: number | null
          creator_name: string | null
          live_contents: number | null
          referral_code: string | null
          registrants: number | null
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
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "client_portal_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_metrics: {
        Row: {
          campaign_id: string | null
          captured_at: string | null
          checkpoint: Database["public"]["Enums"]["metric_checkpoint"] | null
          comments: number | null
          content_id: string | null
          id: string | null
          likes: number | null
          saves: number | null
          shares: number | null
          views: number | null
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
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "client_portal_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_snapshots_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "client_portal_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_snapshots_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_snapshots_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_portal_assets: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          external_url: string | null
          file_path: string | null
          id: string | null
          notes: string | null
          title: string | null
          type: Database["public"]["Enums"]["asset_type"] | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          external_url?: string | null
          file_path?: string | null
          id?: string | null
          notes?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["asset_type"] | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          external_url?: string | null
          file_path?: string | null
          id?: string | null
          notes?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["asset_type"] | null
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
            foreignKeyName: "campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "client_portal_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_portal_assignments: {
        Row: {
          base_fee: number | null
          bonus_per_1000_views: number | null
          bonus_per_registrant: number | null
          brief: string | null
          campaign_code: string | null
          campaign_id: string | null
          campaign_name: string | null
          campaign_objective:
            | Database["public"]["Enums"]["campaign_objective"]
            | null
          campaign_status: Database["public"]["Enums"]["campaign_status"] | null
          client_name: string | null
          contents_committed: number | null
          creator_confirmed_at: string | null
          end_date: string | null
          hashtags: string[] | null
          id: string | null
          joined_at: string | null
          landing_url: string | null
          min_live_days: number | null
          must_do: string[] | null
          must_not: string[] | null
          paid_label_required: boolean | null
          referral_code: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["assignment_status"] | null
          tracking_slug: string | null
          views_bonus_cap: number | null
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
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "client_portal_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_portal_contents: {
        Row: {
          campaign_creator_id: string | null
          campaign_id: string | null
          caption_draft: string | null
          created_at: string | null
          draft_file_path: string | null
          draft_url: string | null
          id: string | null
          live_status: Database["public"]["Enums"]["live_status"] | null
          platform: Database["public"]["Enums"]["social_platform"] | null
          posted_at: string | null
          posted_url: string | null
          proposed_at: string | null
          proposed_posted_at: string | null
          proposed_posted_url: string | null
          removed_at: string | null
          review_status: Database["public"]["Enums"]["review_status"] | null
          revision_count: number | null
          updated_at: string | null
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
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "client_portal_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "campaign_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "client_portal_contents"
            referencedColumns: ["campaign_creator_id"]
          },
          {
            foreignKeyName: "contents_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "client_portal_creators"
            referencedColumns: ["campaign_creator_id"]
          },
          {
            foreignKeyName: "contents_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_portal_metrics: {
        Row: {
          captured_at: string | null
          checkpoint: Database["public"]["Enums"]["metric_checkpoint"] | null
          comments: number | null
          content_id: string | null
          created_at: string | null
          id: string | null
          likes: number | null
          saves: number | null
          shares: number | null
          views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metric_snapshots_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "client_portal_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_snapshots_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_snapshots_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_portal_payouts: {
        Row: {
          adjustment_amount: number | null
          adjustment_reason: string | null
          base_amount: number | null
          calculated_at: string | null
          campaign_creator_id: string | null
          campaign_id: string | null
          id: string | null
          paid_at: string | null
          registrant_bonus: number | null
          status: Database["public"]["Enums"]["payout_status"] | null
          total_amount: number | null
          views_bonus: number | null
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
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "client_portal_campaigns"
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
            foreignKeyName: "payouts_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: true
            referencedRelation: "client_portal_contents"
            referencedColumns: ["campaign_creator_id"]
          },
          {
            foreignKeyName: "payouts_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: true
            referencedRelation: "client_portal_creators"
            referencedColumns: ["campaign_creator_id"]
          },
          {
            foreignKeyName: "payouts_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: true
            referencedRelation: "creator_portal_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_portal_profile: {
        Row: {
          city: string | null
          deletion_requested_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          local_badge_at: string | null
          phone_wa: string | null
          portal_invited_at: string | null
          province: string | null
          signup_source: Database["public"]["Enums"]["signup_source"] | null
          stage_name: string | null
          status: Database["public"]["Enums"]["creator_status"] | null
          terms_agreed_at: string | null
          terms_version: string | null
          tier: Database["public"]["Enums"]["creator_tier"] | null
          verification_code: string | null
        }
        Insert: {
          city?: string | null
          deletion_requested_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          local_badge_at?: string | null
          phone_wa?: string | null
          portal_invited_at?: string | null
          province?: string | null
          signup_source?: Database["public"]["Enums"]["signup_source"] | null
          stage_name?: string | null
          status?: Database["public"]["Enums"]["creator_status"] | null
          terms_agreed_at?: string | null
          terms_version?: string | null
          tier?: Database["public"]["Enums"]["creator_tier"] | null
          verification_code?: string | null
        }
        Update: {
          city?: string | null
          deletion_requested_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          local_badge_at?: string | null
          phone_wa?: string | null
          portal_invited_at?: string | null
          province?: string | null
          signup_source?: Database["public"]["Enums"]["signup_source"] | null
          stage_name?: string | null
          status?: Database["public"]["Enums"]["creator_status"] | null
          terms_agreed_at?: string | null
          terms_version?: string | null
          tier?: Database["public"]["Enums"]["creator_tier"] | null
          verification_code?: string | null
        }
        Relationships: []
      }
      creator_portal_reviews: {
        Row: {
          content_id: string | null
          created_at: string | null
          decision: Database["public"]["Enums"]["review_decision"] | null
          id: string | null
          notes: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_reviews_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "client_portal_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reviews_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reviews_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_portal_social_accounts: {
        Row: {
          audience_proof_path: string | null
          badge_requested_at: string | null
          badge_review_notes: string | null
          created_at: string | null
          followers_count: number | null
          handle: string | null
          id: string | null
          kalimantan_audience_pct: number | null
          last_verified_at: string | null
          platform: Database["public"]["Enums"]["social_platform"] | null
          profile_url: string | null
          top_cities: string | null
        }
        Insert: {
          audience_proof_path?: string | null
          badge_requested_at?: string | null
          badge_review_notes?: string | null
          created_at?: string | null
          followers_count?: number | null
          handle?: string | null
          id?: string | null
          kalimantan_audience_pct?: number | null
          last_verified_at?: string | null
          platform?: Database["public"]["Enums"]["social_platform"] | null
          profile_url?: string | null
          top_cities?: string | null
        }
        Update: {
          audience_proof_path?: string | null
          badge_requested_at?: string | null
          badge_review_notes?: string | null
          created_at?: string | null
          followers_count?: number | null
          handle?: string | null
          id?: string | null
          kalimantan_audience_pct?: number | null
          last_verified_at?: string | null
          platform?: Database["public"]["Enums"]["social_platform"] | null
          profile_url?: string | null
          top_cities?: string | null
        }
        Relationships: []
      }
      creator_portal_submissions: {
        Row: {
          captured_at: string | null
          checkpoint: Database["public"]["Enums"]["metric_checkpoint"] | null
          comments: number | null
          content_id: string | null
          created_at: string | null
          id: string | null
          likes: number | null
          proof_path: string | null
          review_notes: string | null
          reviewed_at: string | null
          saves: number | null
          shares: number | null
          status: Database["public"]["Enums"]["submission_status"] | null
          views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metric_submissions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "client_portal_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_submissions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_submissions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_contents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      anonymize_creator: { Args: { target_id: string }; Returns: string[] }
      assert_campaign_editable: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      client_owns_campaign: {
        Args: { target_campaign_id: string }
        Returns: boolean
      }
      content_campaign_id: {
        Args: { p_campaign_creator_id: string }
        Returns: string
      }
      creator_assigned_to_campaign: {
        Args: { target_campaign_id: string }
        Returns: boolean
      }
      creator_joined_assignment: {
        Args: { target_assignment_id: string }
        Returns: boolean
      }
      creator_joined_content: {
        Args: { target_content_id: string }
        Returns: boolean
      }
      creator_owns_assignment: {
        Args: { target_assignment_id: string }
        Returns: boolean
      }
      creator_owns_content: {
        Args: { target_content_id: string }
        Returns: boolean
      }
      current_client_id: { Args: never; Returns: string }
      current_creator_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      generate_verification_code: { Args: never; Returns: string }
      get_masked_bank_account: {
        Args: { p_creator_id: string }
        Returns: {
          account_number_masked: string
          bank_name: string
        }[]
      }
      is_active_member: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      open_report_share_link: {
        Args: { p_token_hash: string }
        Returns: string
      }
      request_creator_account_deletion: { Args: never; Returns: undefined }
      review_metric_submission: {
        Args: { p_accept: boolean; p_id: string; p_notes?: string }
        Returns: string
      }
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
      signup_source: "undangan" | "mandiri"
      social_platform: "tiktok" | "instagram" | "youtube" | "facebook"
      submission_status: "menunggu" | "diterima" | "ditolak"
      user_role: "owner" | "manager" | "creator" | "client"
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
      signup_source: ["undangan", "mandiri"],
      social_platform: ["tiktok", "instagram", "youtube", "facebook"],
      submission_status: ["menunggu", "diterima", "ditolak"],
      user_role: ["owner", "manager", "creator", "client"],
    },
  },
} as const

