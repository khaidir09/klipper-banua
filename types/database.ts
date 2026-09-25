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
            foreignKeyName: "campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
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
          join_source: Database["public"]["Enums"]["assignment_join_source"]
          joined_at: string | null
          referral_code: string
          status: Database["public"]["Enums"]["assignment_status"]
          tracking_slug: string
          updated_at: string
          views_bonus_cap: number | null
          withdrawn_at: string | null
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
          join_source?: Database["public"]["Enums"]["assignment_join_source"]
          joined_at?: string | null
          referral_code?: string
          status?: Database["public"]["Enums"]["assignment_status"]
          tracking_slug?: string
          updated_at?: string
          views_bonus_cap?: number | null
          withdrawn_at?: string | null
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
          join_source?: Database["public"]["Enums"]["assignment_join_source"]
          joined_at?: string | null
          referral_code?: string
          status?: Database["public"]["Enums"]["assignment_status"]
          tracking_slug?: string
          updated_at?: string
          views_bonus_cap?: number | null
          withdrawn_at?: string | null
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
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
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
            referencedRelation: "creator_portal_account"
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
          access: Database["public"]["Enums"]["campaign_access"]
          allowed_platforms: Database["public"]["Enums"]["social_platform"][]
          brief: string
          claim_grace_days: number
          client_id: string
          closing_notes: string
          code: string
          cover_image_path: string | null
          created_at: string
          created_by: string | null
          creator_budget: number
          default_base_fee: number
          default_bonus_per_1000_views: number
          default_bonus_per_registrant: number
          default_views_bonus_cap: number | null
          end_date: string
          hashtags: string[]
          id: string
          landing_url: string | null
          local_only: boolean
          max_clips_per_creator: number
          max_payout_per_clip: number | null
          max_payout_per_creator: number | null
          min_live_days: number
          min_views_to_earn: number
          must_do: string[]
          must_not: string[]
          name: string
          objective: Database["public"]["Enums"]["campaign_objective"] | null
          package_price: number
          paid_label_required: boolean
          payout_model: Database["public"]["Enums"]["payout_model"]
          published_at: string | null
          rate_per_1000_views: number
          start_date: string
          status: Database["public"]["Enums"]["campaign_status"]
          target_contents: number
          target_registrants: number
          target_views: number
          updated_at: string
        }
        Insert: {
          access?: Database["public"]["Enums"]["campaign_access"]
          allowed_platforms?: Database["public"]["Enums"]["social_platform"][]
          brief?: string
          claim_grace_days?: number
          client_id: string
          closing_notes?: string
          code: string
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          creator_budget?: number
          default_base_fee?: number
          default_bonus_per_1000_views?: number
          default_bonus_per_registrant?: number
          default_views_bonus_cap?: number | null
          end_date: string
          hashtags?: string[]
          id?: string
          landing_url?: string | null
          local_only?: boolean
          max_clips_per_creator?: number
          max_payout_per_clip?: number | null
          max_payout_per_creator?: number | null
          min_live_days?: number
          min_views_to_earn?: number
          must_do?: string[]
          must_not?: string[]
          name: string
          objective?: Database["public"]["Enums"]["campaign_objective"] | null
          package_price?: number
          paid_label_required?: boolean
          payout_model?: Database["public"]["Enums"]["payout_model"]
          published_at?: string | null
          rate_per_1000_views?: number
          start_date: string
          status?: Database["public"]["Enums"]["campaign_status"]
          target_contents?: number
          target_registrants?: number
          target_views?: number
          updated_at?: string
        }
        Update: {
          access?: Database["public"]["Enums"]["campaign_access"]
          allowed_platforms?: Database["public"]["Enums"]["social_platform"][]
          brief?: string
          claim_grace_days?: number
          client_id?: string
          closing_notes?: string
          code?: string
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          creator_budget?: number
          default_base_fee?: number
          default_bonus_per_1000_views?: number
          default_bonus_per_registrant?: number
          default_views_bonus_cap?: number | null
          end_date?: string
          hashtags?: string[]
          id?: string
          landing_url?: string | null
          local_only?: boolean
          max_clips_per_creator?: number
          max_payout_per_clip?: number | null
          max_payout_per_creator?: number | null
          min_live_days?: number
          min_views_to_earn?: number
          must_do?: string[]
          must_not?: string[]
          name?: string
          objective?: Database["public"]["Enums"]["campaign_objective"] | null
          package_price?: number
          paid_label_required?: boolean
          payout_model?: Database["public"]["Enums"]["payout_model"]
          published_at?: string | null
          rate_per_1000_views?: number
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
            foreignKeyName: "client_payments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
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
          caption_code_checked: boolean
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
          posted_url_normalized: string | null
          proposed_at: string | null
          proposed_posted_at: string | null
          proposed_posted_url: string | null
          rejection_reason:
            | Database["public"]["Enums"]["clip_rejection_reason"]
            | null
          removed_at: string | null
          review_status: Database["public"]["Enums"]["review_status"]
          revision_count: number
          updated_at: string
          verified_views: number | null
        }
        Insert: {
          campaign_creator_id: string
          caption_code_checked?: boolean
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
          posted_url_normalized?: string | null
          proposed_at?: string | null
          proposed_posted_at?: string | null
          proposed_posted_url?: string | null
          rejection_reason?:
            | Database["public"]["Enums"]["clip_rejection_reason"]
            | null
          removed_at?: string | null
          review_status?: Database["public"]["Enums"]["review_status"]
          revision_count?: number
          updated_at?: string
          verified_views?: number | null
        }
        Update: {
          campaign_creator_id?: string
          caption_code_checked?: boolean
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
          posted_url_normalized?: string | null
          proposed_at?: string | null
          proposed_posted_at?: string | null
          proposed_posted_url?: string | null
          rejection_reason?:
            | Database["public"]["Enums"]["clip_rejection_reason"]
            | null
          removed_at?: string | null
          review_status?: Database["public"]["Enums"]["review_status"]
          revision_count?: number
          updated_at?: string
          verified_views?: number | null
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
            foreignKeyName: "contents_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
            referencedColumns: ["assignment_id"]
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
          changed_at: string | null
          created_at: string
          creator_id: string
          holder_matches_name: boolean
          id: string
          updated_at: string
        }
        Insert: {
          account_holder: string
          account_number: string
          bank_name: string
          changed_at?: string | null
          created_at?: string
          creator_id: string
          holder_matches_name?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          account_holder?: string
          account_number?: string
          bank_name?: string
          changed_at?: string | null
          created_at?: string
          creator_id?: string
          holder_matches_name?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_bank_accounts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "creator_portal_account"
            referencedColumns: ["id"]
          },
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
      creator_ledger_entries: {
        Row: {
          amount: number
          campaign_id: string | null
          content_id: string | null
          created_at: string
          created_by: string | null
          creator_id: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id: string
          metric_submission_id: string | null
          notes: string
          withdrawal_id: string | null
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          content_id?: string | null
          created_at?: string
          created_by?: string | null
          creator_id: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          metric_submission_id?: string | null
          notes?: string
          withdrawal_id?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          content_id?: string | null
          created_at?: string
          created_by?: string | null
          creator_id?: string
          entry_type?: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          metric_submission_id?: string | null
          notes?: string
          withdrawal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_ledger_entries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "client_portal_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "client_portal_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_metric_submission_id_fkey"
            columns: ["metric_submission_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_metric_submission_id_fkey"
            columns: ["metric_submission_id"]
            isOneToOne: false
            referencedRelation: "metric_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_withdrawals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawals"
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
            referencedRelation: "creator_portal_account"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "link_clicks_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
            referencedColumns: ["assignment_id"]
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
          credit_limited: boolean
          credited_amount: number | null
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
          verified_views: number | null
          views: number
        }
        Insert: {
          captured_at: string
          checkpoint: Database["public"]["Enums"]["metric_checkpoint"]
          comments?: number
          content_id: string
          created_at?: string
          credit_limited?: boolean
          credited_amount?: number | null
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
          verified_views?: number | null
          views?: number
        }
        Update: {
          captured_at?: string
          checkpoint?: Database["public"]["Enums"]["metric_checkpoint"]
          comments?: number
          content_id?: string
          created_at?: string
          credit_limited?: boolean
          credited_amount?: number | null
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
          verified_views?: number | null
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
            foreignKeyName: "ops_time_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
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
            foreignKeyName: "payouts_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: true
            referencedRelation: "creator_portal_catalog"
            referencedColumns: ["assignment_id"]
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
      platform_settings: {
        Row: {
          created_at: string
          id: boolean
          min_withdrawal: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: boolean
          min_withdrawal?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: boolean
          min_withdrawal?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
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
            foreignKeyName: "registrant_reports_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
            referencedColumns: ["assignment_id"]
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
            foreignKeyName: "registrant_reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
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
            foreignKeyName: "report_share_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
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
      withdrawals: {
        Row: {
          account_holder: string
          account_number: string
          amount: number
          bank_name: string
          created_at: string
          creator_id: string
          id: string
          paid_at: string | null
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          requested_at: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          transfer_fee: number
          transfer_proof_path: string | null
          updated_at: string
        }
        Insert: {
          account_holder: string
          account_number: string
          amount: number
          bank_name: string
          created_at?: string
          creator_id: string
          id?: string
          paid_at?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          transfer_fee?: number
          transfer_proof_path?: string | null
          updated_at?: string
        }
        Update: {
          account_holder?: string
          account_number?: string
          amount?: number
          bank_name?: string
          created_at?: string
          creator_id?: string
          id?: string
          paid_at?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          transfer_fee?: number
          transfer_proof_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_processed_by_fkey"
            columns: ["processed_by"]
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
          {
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
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
          {
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
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
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
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
      creator_portal_account: {
        Row: {
          blocked_at: string | null
          blocked_reason: string | null
          full_name: string | null
          id: string | null
          stage_name: string | null
          status: Database["public"]["Enums"]["creator_status"] | null
        }
        Insert: {
          blocked_at?: string | null
          blocked_reason?: string | null
          full_name?: string | null
          id?: string | null
          stage_name?: string | null
          status?: Database["public"]["Enums"]["creator_status"] | null
        }
        Update: {
          blocked_at?: string | null
          blocked_reason?: string | null
          full_name?: string | null
          id?: string | null
          stage_name?: string | null
          status?: Database["public"]["Enums"]["creator_status"] | null
        }
        Relationships: []
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
          {
            foreignKeyName: "campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_portal_assignments: {
        Row: {
          access: Database["public"]["Enums"]["campaign_access"] | null
          allowed_platforms:
            | Database["public"]["Enums"]["social_platform"][]
            | null
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
          claim_grace_days: number | null
          client_name: string | null
          contents_committed: number | null
          creator_confirmed_at: string | null
          end_date: string | null
          hashtags: string[] | null
          id: string | null
          join_source:
            | Database["public"]["Enums"]["assignment_join_source"]
            | null
          joined_at: string | null
          landing_url: string | null
          local_only: boolean | null
          max_clips_per_creator: number | null
          max_payout_per_clip: number | null
          max_payout_per_creator: number | null
          min_live_days: number | null
          min_views_to_earn: number | null
          must_do: string[] | null
          must_not: string[] | null
          paid_label_required: boolean | null
          payout_model: Database["public"]["Enums"]["payout_model"] | null
          rate_per_1000_views: number | null
          referral_code: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["assignment_status"] | null
          tracking_slug: string | null
          views_bonus_cap: number | null
          withdrawn_at: string | null
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
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_portal_balance: {
        Row: {
          available: number | null
          creator_id: string | null
          min_withdrawal: number | null
          total_earned: number | null
          total_withdrawn: number | null
        }
        Relationships: []
      }
      creator_portal_bank_account: {
        Row: {
          account_holder: string | null
          account_number_masked: string | null
          bank_name: string | null
          changed_at: string | null
          hold_until: string | null
          holder_matches_name: boolean | null
          updated_at: string | null
        }
        Insert: {
          account_holder?: string | null
          account_number_masked?: never
          bank_name?: string | null
          changed_at?: string | null
          hold_until?: never
          holder_matches_name?: boolean | null
          updated_at?: string | null
        }
        Update: {
          account_holder?: string | null
          account_number_masked?: never
          bank_name?: string | null
          changed_at?: string | null
          hold_until?: never
          holder_matches_name?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      creator_portal_catalog: {
        Row: {
          allowed_platforms:
            | Database["public"]["Enums"]["social_platform"][]
            | null
          asset_count: number | null
          assignment_id: string | null
          assignment_status:
            | Database["public"]["Enums"]["assignment_status"]
            | null
          brief: string | null
          budget_exhausted: boolean | null
          budget_remaining: number | null
          budget_remaining_pct: number | null
          budget_total: number | null
          budget_used: number | null
          claim_grace_days: number | null
          client_name: string | null
          code: string | null
          end_date: string | null
          hashtags: string[] | null
          id: string | null
          local_only: boolean | null
          max_clips_per_creator: number | null
          max_payout_per_clip: number | null
          max_payout_per_creator: number | null
          min_live_days: number | null
          min_views_to_earn: number | null
          must_do: string[] | null
          must_not: string[] | null
          name: string | null
          objective: Database["public"]["Enums"]["campaign_objective"] | null
          paid_label_required: boolean | null
          published_at: string | null
          rate_per_1000_views: number | null
          start_date: string | null
        }
        Relationships: []
      }
      creator_portal_contents: {
        Row: {
          campaign_creator_id: string | null
          campaign_id: string | null
          caption_draft: string | null
          created_at: string | null
          draft_file_path: string | null
          draft_url: string | null
          earned_amount: number | null
          id: string | null
          live_status: Database["public"]["Enums"]["live_status"] | null
          platform: Database["public"]["Enums"]["social_platform"] | null
          posted_at: string | null
          posted_url: string | null
          proposed_at: string | null
          proposed_posted_at: string | null
          proposed_posted_url: string | null
          rejection_reason:
            | Database["public"]["Enums"]["clip_rejection_reason"]
            | null
          removed_at: string | null
          review_status: Database["public"]["Enums"]["review_status"] | null
          revision_count: number | null
          updated_at: string | null
          verified_views: number | null
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
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
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
          {
            foreignKeyName: "contents_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
            referencedColumns: ["assignment_id"]
          },
        ]
      }
      creator_portal_ledger: {
        Row: {
          amount: number | null
          campaign_id: string | null
          campaign_name: string | null
          content_id: string | null
          created_at: string | null
          entry_type: Database["public"]["Enums"]["ledger_entry_type"] | null
          id: string | null
          notes: string | null
          withdrawal_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_ledger_entries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "client_portal_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "client_portal_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_withdrawals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ledger_entries_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawals"
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
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "creator_portal_catalog"
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
            foreignKeyName: "payouts_campaign_creator_id_fkey"
            columns: ["campaign_creator_id"]
            isOneToOne: true
            referencedRelation: "creator_portal_catalog"
            referencedColumns: ["assignment_id"]
          },
        ]
      }
      creator_portal_profile: {
        Row: {
          birth_date: string | null
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
          birth_date?: string | null
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
          birth_date?: string | null
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
          credit_limited: boolean | null
          credited_amount: number | null
          id: string | null
          likes: number | null
          proof_path: string | null
          review_notes: string | null
          reviewed_at: string | null
          saves: number | null
          shares: number | null
          status: Database["public"]["Enums"]["submission_status"] | null
          verified_views: number | null
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
      creator_portal_withdrawals: {
        Row: {
          account_holder: string | null
          account_number_masked: string | null
          amount: number | null
          bank_name: string | null
          id: string | null
          net_amount: number | null
          paid_at: string | null
          processed_at: string | null
          rejection_reason: string | null
          requested_at: string | null
          status: Database["public"]["Enums"]["withdrawal_status"] | null
          transfer_fee: number | null
        }
        Insert: {
          account_holder?: string | null
          account_number_masked?: never
          amount?: number | null
          bank_name?: string | null
          id?: string | null
          net_amount?: never
          paid_at?: string | null
          processed_at?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"] | null
          transfer_fee?: number | null
        }
        Update: {
          account_holder?: string | null
          account_number_masked?: never
          amount?: number | null
          bank_name?: string | null
          id?: string | null
          net_amount?: never
          paid_at?: string | null
          processed_at?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"] | null
          transfer_fee?: number | null
        }
        Relationships: []
      }
      public_campaign_catalog: {
        Row: {
          allowed_platforms:
            | Database["public"]["Enums"]["social_platform"][]
            | null
          budget_exhausted: boolean | null
          budget_remaining: number | null
          budget_remaining_pct: number | null
          budget_total: number | null
          budget_used: number | null
          client_name: string | null
          cover_image_path: string | null
          end_date: string | null
          id: string | null
          local_only: boolean | null
          max_clips_per_creator: number | null
          max_payout_per_clip: number | null
          min_views_to_earn: number | null
          name: string | null
          published_at: string | null
          rate_per_1000_views: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_creator_terms: { Args: never; Returns: string }
      adjust_balance: {
        Args: { p_amount: number; p_creator_id: string; p_reason: string }
        Returns: string
      }
      anonymize_creator: { Args: { target_id: string }; Returns: string[] }
      assert_campaign_editable: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      assignment_payout_model: {
        Args: { target_assignment_id: string }
        Returns: Database["public"]["Enums"]["payout_model"]
      }
      campaign_budget_exhausted: {
        Args: { target_campaign_id: string }
        Returns: boolean
      }
      campaign_creator_cost: {
        Args: { target_campaign_id: string }
        Returns: number
      }
      campaign_open_for_catalog: {
        Args: { target_campaign_id: string }
        Returns: boolean
      }
      campaign_today: { Args: never; Returns: string }
      cancel_clip: {
        Args: {
          p_content_id: string
          p_kind: string
          p_notes?: string
          p_rejection_reason?: Database["public"]["Enums"]["clip_rejection_reason"]
          p_removed_at?: string
        }
        Returns: number
      }
      client_owns_campaign: {
        Args: { target_campaign_id: string }
        Returns: boolean
      }
      clip_credited_amount: {
        Args: { target_content_id: string }
        Returns: number
      }
      content_campaign_id: {
        Args: { p_campaign_creator_id: string }
        Returns: string
      }
      creator_assigned_to_campaign: {
        Args: { target_campaign_id: string }
        Returns: boolean
      }
      creator_balance: { Args: { target_creator_id: string }; Returns: number }
      creator_can_view_campaign_assets: {
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
      current_creator_account_id: { Args: never; Returns: string }
      current_creator_id: { Args: never; Returns: string }
      current_creator_terms_version: { Args: never; Returns: string }
      current_min_withdrawal: { Args: never; Returns: number }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      generate_referral_code: { Args: never; Returns: string }
      generate_tracking_slug: { Args: { stage_name: string }; Returns: string }
      generate_verification_code: { Args: never; Returns: string }
      get_masked_bank_account: {
        Args: { p_creator_id: string }
        Returns: {
          account_number_masked: string
          bank_name: string
          holder_matches_name: boolean
        }[]
      }
      is_active_member: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      normalize_clip_url: { Args: { url: string }; Returns: string }
      normalize_person_name: { Args: { value: string }; Returns: string }
      open_report_share_link: {
        Args: { p_token_hash: string }
        Returns: string
      }
      process_withdrawal: {
        Args: {
          p_id: string
          p_paid_at?: string
          p_proof_path?: string
          p_reason?: string
          p_status: Database["public"]["Enums"]["withdrawal_status"]
          p_transfer_fee?: number
        }
        Returns: undefined
      }
      public_campaign_catalog_rows: {
        Args: never
        Returns: {
          allowed_platforms: Database["public"]["Enums"]["social_platform"][]
          budget_exhausted: boolean
          budget_remaining: number
          budget_remaining_pct: number
          budget_total: number
          budget_used: number
          client_name: string
          cover_image_path: string
          end_date: string
          id: string
          local_only: boolean
          max_clips_per_creator: number
          max_payout_per_clip: number
          min_views_to_earn: number
          name: string
          published_at: string
          rate_per_1000_views: number
        }[]
      }
      record_clip_cancellation: {
        Args: {
          p_campaign_id: string
          p_content_id: string
          p_creator_id: string
          p_notes: string
        }
        Returns: number
      }
      record_clip_credit: {
        Args: {
          p_campaign_id: string
          p_content_id: string
          p_creator_id: string
          p_credit: number
          p_submission_id: string
          p_verified_views: number
        }
        Returns: undefined
      }
      request_creator_account_deletion: { Args: never; Returns: undefined }
      request_withdrawal: { Args: { p_amount: number }; Returns: string }
      review_metric_submission: {
        Args: { p_accept: boolean; p_id: string; p_notes?: string }
        Returns: string
      }
      save_creator_bank_account: {
        Args: {
          p_account_holder: string
          p_account_number: string
          p_bank_name: string
        }
        Returns: undefined
      }
      set_own_birth_date: { Args: { p_birth_date: string }; Returns: undefined }
      submit_clip: {
        Args: {
          p_assignment_id: string
          p_comments: number
          p_likes: number
          p_platform: Database["public"]["Enums"]["social_platform"]
          p_posted_at: string
          p_posted_url: string
          p_proof_path: string
          p_shares: number
          p_views: number
        }
        Returns: string
      }
      verify_clip: {
        Args: {
          p_checklist: Json
          p_content_id: string
          p_credit: number
          p_credit_limited?: boolean
          p_decision: Database["public"]["Enums"]["review_decision"]
          p_notes: string
          p_rejection_reason: Database["public"]["Enums"]["clip_rejection_reason"]
          p_verified_views: number
        }
        Returns: string
      }
      verify_views_update: {
        Args: {
          p_accept: boolean
          p_credit: number
          p_credit_limited?: boolean
          p_notes: string
          p_submission_id: string
          p_verified_views: number
        }
        Returns: string
      }
    }
    Enums: {
      asset_type: "video" | "foto" | "dokumen" | "tautan"
      assignment_join_source: "mandiri" | "tim"
      assignment_status: "diundang" | "bergabung" | "mundur" | "selesai"
      campaign_access: "terbuka" | "undangan"
      campaign_objective: "pendaftar" | "awareness" | "event"
      campaign_status: "draft" | "aktif" | "selesai" | "dibatalkan"
      client_payment_status: "belum_dibayar" | "sebagian" | "lunas"
      client_type: "brand" | "umkm" | "instansi" | "personal" | "lainnya"
      clip_rejection_reason:
        | "bukan_pemilik"
        | "langgar_brief"
        | "di_luar_periode"
        | "duplikat"
        | "views_tidak_wajar"
        | "lainnya"
      creator_status:
        | "prospek"
        | "terverifikasi"
        | "aktif"
        | "nonaktif"
        | "diblokir"
      creator_tier: "nano" | "mikro" | "menengah"
      ledger_entry_type:
        | "honor_klip"
        | "pembatalan"
        | "penyesuaian"
        | "penarikan"
        | "pengembalian_penarikan"
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
        | "verifikasi_klip"
        | "penarikan"
      payout_model: "per_views" | "paket"
      payout_status: "draf" | "disetujui" | "dibayar"
      review_decision: "disetujui" | "revisi" | "ditolak"
      review_status: "menunggu_review" | "disetujui" | "revisi" | "ditolak"
      signup_source: "undangan" | "mandiri"
      social_platform: "tiktok" | "instagram" | "youtube" | "facebook"
      submission_status: "menunggu" | "diterima" | "ditolak"
      user_role: "owner" | "manager" | "creator" | "client"
      withdrawal_status: "diajukan" | "diproses" | "dibayar" | "ditolak"
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
      assignment_join_source: ["mandiri", "tim"],
      assignment_status: ["diundang", "bergabung", "mundur", "selesai"],
      campaign_access: ["terbuka", "undangan"],
      campaign_objective: ["pendaftar", "awareness", "event"],
      campaign_status: ["draft", "aktif", "selesai", "dibatalkan"],
      client_payment_status: ["belum_dibayar", "sebagian", "lunas"],
      client_type: ["brand", "umkm", "instansi", "personal", "lainnya"],
      clip_rejection_reason: [
        "bukan_pemilik",
        "langgar_brief",
        "di_luar_periode",
        "duplikat",
        "views_tidak_wajar",
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
      ledger_entry_type: [
        "honor_klip",
        "pembatalan",
        "penyesuaian",
        "penarikan",
        "pengembalian_penarikan",
      ],
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
        "verifikasi_klip",
        "penarikan",
      ],
      payout_model: ["per_views", "paket"],
      payout_status: ["draf", "disetujui", "dibayar"],
      review_decision: ["disetujui", "revisi", "ditolak"],
      review_status: ["menunggu_review", "disetujui", "revisi", "ditolak"],
      signup_source: ["undangan", "mandiri"],
      social_platform: ["tiktok", "instagram", "youtube", "facebook"],
      submission_status: ["menunggu", "diterima", "ditolak"],
      user_role: ["owner", "manager", "creator", "client"],
      withdrawal_status: ["diajukan", "diproses", "dibayar", "ditolak"],
    },
  },
} as const

