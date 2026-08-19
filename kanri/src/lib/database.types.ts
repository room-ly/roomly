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
    PostgrestVersion: "14.5"
  }
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
      affiliate_clicks: {
        Row: {
          affiliate_id: string | null
          clicked_at: string
          code: string
          id: string
          ip_hash: string | null
          landing_path: string | null
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string
        }
        Insert: {
          affiliate_id?: string | null
          clicked_at?: string
          code: string
          id?: string
          ip_hash?: string | null
          landing_path?: string | null
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id: string
        }
        Update: {
          affiliate_id?: string | null
          clicked_at?: string
          code?: string
          id?: string
          ip_hash?: string | null
          landing_path?: string | null
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          affiliate_id: string
          amount_jpy: number
          approved_at: string | null
          approved_by: string | null
          company_id: string
          conversion_type: string
          created_at: string
          id: string
          mrr_at_conversion_jpy: number | null
          notes: string | null
          occurred_at: string
          paid_at: string | null
          payout_id: string | null
          recurring_month_index: number | null
          status: string
        }
        Insert: {
          affiliate_id: string
          amount_jpy: number
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          conversion_type: string
          created_at?: string
          id?: string
          mrr_at_conversion_jpy?: number | null
          notes?: string | null
          occurred_at?: string
          paid_at?: string | null
          payout_id?: string | null
          recurring_month_index?: number | null
          status?: string
        }
        Update: {
          affiliate_id?: string
          amount_jpy?: number
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          conversion_type?: string
          created_at?: string
          id?: string
          mrr_at_conversion_jpy?: number | null
          notes?: string | null
          occurred_at?: string
          paid_at?: string | null
          payout_id?: string | null
          recurring_month_index?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
        ]
      }
      affiliate_login_attempts: {
        Row: {
          affiliate_code: string | null
          attempted_at: string
          city: string | null
          country: string | null
          email: string | null
          ga_client_id: string | null
          gclid: string | null
          id: string
          ip_address: string | null
          landing_path: string | null
          referrer: string | null
          region: string | null
          success: boolean
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          affiliate_code?: string | null
          attempted_at?: string
          city?: string | null
          country?: string | null
          email?: string | null
          ga_client_id?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          landing_path?: string | null
          referrer?: string | null
          region?: string | null
          success?: boolean
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          affiliate_code?: string | null
          attempted_at?: string
          city?: string | null
          country?: string | null
          email?: string | null
          ga_client_id?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          landing_path?: string | null
          referrer?: string | null
          region?: string | null
          success?: boolean
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          conversion_count: number
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          payout_reference: string | null
          period_end: string
          period_start: string
          scheduled_at: string | null
          status: string
          total_amount_jpy: number
        }
        Insert: {
          affiliate_id: string
          conversion_count: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payout_reference?: string | null
          period_end: string
          period_start: string
          scheduled_at?: string | null
          status?: string
          total_amount_jpy: number
        }
        Update: {
          affiliate_id?: string
          conversion_count?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payout_reference?: string | null
          period_end?: string
          period_start?: string
          scheduled_at?: string | null
          status?: string
          total_amount_jpy?: number
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_prospects: {
        Row: {
          category: string | null
          contact_email: string | null
          contact_form_url: string | null
          contact_phone: string | null
          converted_affiliate_id: string | null
          created_at: string
          followers_count: number | null
          id: string
          last_contacted_at: string | null
          name: string
          next_action: string | null
          next_action_at: string | null
          notes: string | null
          organization: string | null
          priority: number | null
          prospect_type: string | null
          social_url: string | null
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          category?: string | null
          contact_email?: string | null
          contact_form_url?: string | null
          contact_phone?: string | null
          converted_affiliate_id?: string | null
          created_at?: string
          followers_count?: number | null
          id?: string
          last_contacted_at?: string | null
          name: string
          next_action?: string | null
          next_action_at?: string | null
          notes?: string | null
          organization?: string | null
          priority?: number | null
          prospect_type?: string | null
          social_url?: string | null
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          category?: string | null
          contact_email?: string | null
          contact_form_url?: string | null
          contact_phone?: string | null
          converted_affiliate_id?: string | null
          created_at?: string
          followers_count?: number | null
          id?: string
          last_contacted_at?: string | null
          name?: string
          next_action?: string | null
          next_action_at?: string | null
          notes?: string | null
          organization?: string | null
          priority?: number | null
          prospect_type?: string | null
          social_url?: string | null
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_prospects_converted_affiliate_id_fkey"
            columns: ["converted_affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_signup_attempts: {
        Row: {
          affiliate_code: string | null
          attempted_at: string
          city: string | null
          country: string | null
          email: string | null
          error_code: string | null
          error_message: string | null
          ga_client_id: string | null
          gclid: string | null
          id: string
          ip_address: string | null
          landing_path: string | null
          referrer: string | null
          region: string | null
          success: boolean
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          affiliate_code?: string | null
          attempted_at?: string
          city?: string | null
          country?: string | null
          email?: string | null
          error_code?: string | null
          error_message?: string | null
          ga_client_id?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          landing_path?: string | null
          referrer?: string | null
          region?: string | null
          success?: boolean
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          affiliate_code?: string | null
          attempted_at?: string
          city?: string | null
          country?: string | null
          email?: string | null
          error_code?: string | null
          error_message?: string | null
          ga_client_id?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          landing_path?: string | null
          referrer?: string | null
          region?: string | null
          success?: boolean
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_account_type: string | null
          bank_branch: string | null
          bank_name: string | null
          code: string
          commission_initial_jpy: number
          commission_recurring_months: number
          commission_recurring_rate: number
          created_at: string
          email: string
          id: string
          invoice_registration_number: string | null
          name: string
          notes: string | null
          payout_method: string | null
          phone: string | null
          prospect_type: string | null
          rejected_at: string | null
          rejected_reason: string | null
          social_url: string | null
          source: string
          status: string
          updated_at: string
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          code: string
          commission_initial_jpy?: number
          commission_recurring_months?: number
          commission_recurring_rate?: number
          created_at?: string
          email: string
          id?: string
          invoice_registration_number?: string | null
          name: string
          notes?: string | null
          payout_method?: string | null
          phone?: string | null
          prospect_type?: string | null
          rejected_at?: string | null
          rejected_reason?: string | null
          social_url?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          code?: string
          commission_initial_jpy?: number
          commission_recurring_months?: number
          commission_recurring_rate?: number
          created_at?: string
          email?: string
          id?: string
          invoice_registration_number?: string | null
          name?: string
          notes?: string | null
          payout_method?: string | null
          phone?: string | null
          prospect_type?: string | null
          rejected_at?: string | null
          rejected_reason?: string | null
          social_url?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          after_values: Json | null
          before_values: Json | null
          company_id: string
          created_at: string
          id: string
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          after_values?: Json | null
          before_values?: Json | null
          company_id: string
          created_at?: string
          id?: string
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          after_values?: Json | null
          before_values?: Json | null
          company_id?: string
          created_at?: string
          id?: string
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
        ]
      }
      case_logs: {
        Row: {
          action: string
          case_id: string
          company_id: string
          id: string
          logged_at: string
          user_id: string | null
        }
        Insert: {
          action: string
          case_id: string
          company_id: string
          id?: string
          logged_at?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          case_id?: string
          company_id?: string
          id?: string
          logged_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_logs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "case_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          actual_cost: number | null
          category: string
          company_id: string
          completed_date: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          notes: string | null
          payee_id: string | null
          priority: string
          property_id: string | null
          reported_date: string
          scheduled_date: string | null
          source: string
          status: string
          tenant_id: string | null
          title: string
          unit_id: string | null
          updated_at: string
          vendor_name: string | null
          vendor_phone: string | null
        }
        Insert: {
          actual_cost?: number | null
          category?: string
          company_id: string
          completed_date?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          payee_id?: string | null
          priority?: string
          property_id?: string | null
          reported_date?: string
          scheduled_date?: string | null
          source?: string
          status?: string
          tenant_id?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string
          vendor_name?: string | null
          vendor_phone?: string | null
        }
        Update: {
          actual_cost?: number | null
          category?: string
          company_id?: string
          completed_date?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          payee_id?: string | null
          priority?: string
          property_id?: string | null
          reported_date?: string
          scheduled_date?: string | null
          source?: string
          status?: string
          tenant_id?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string
          vendor_name?: string | null
          vendor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "cases_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "payees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          affiliate_code: string | null
          affiliate_id: string | null
          attribution_visitor_id: string | null
          contract_alert_days: number
          created_at: string
          default_approver_user_id: string | null
          estate_agent_license: string | null
          estate_agent_name: string | null
          estate_license: string | null
          expense_approval_threshold: number | null
          ga_client_id: string | null
          id: string
          is_demo: boolean
          is_tax_invoice_issuer: boolean
          landing_path: string | null
          loan_feature_enabled: boolean
          logo_path: string | null
          management_fee_tax_rate: number
          max_units: number
          name: string
          phone: string | null
          plan: string
          postal_code: string | null
          referrer: string | null
          seal_column_enabled: boolean
          signup_gclid: string | null
          signup_path: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_current_period_end: string | null
          subscription_started_at: string | null
          subscription_status: string
          updated_at: string
          usage_type: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          address?: string | null
          affiliate_code?: string | null
          affiliate_id?: string | null
          attribution_visitor_id?: string | null
          contract_alert_days?: number
          created_at?: string
          default_approver_user_id?: string | null
          estate_agent_license?: string | null
          estate_agent_name?: string | null
          estate_license?: string | null
          expense_approval_threshold?: number | null
          ga_client_id?: string | null
          id?: string
          is_demo?: boolean
          is_tax_invoice_issuer?: boolean
          landing_path?: string | null
          loan_feature_enabled?: boolean
          logo_path?: string | null
          management_fee_tax_rate?: number
          max_units?: number
          name: string
          phone?: string | null
          plan?: string
          postal_code?: string | null
          referrer?: string | null
          seal_column_enabled?: boolean
          signup_gclid?: string | null
          signup_path?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_current_period_end?: string | null
          subscription_started_at?: string | null
          subscription_status?: string
          updated_at?: string
          usage_type?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          address?: string | null
          affiliate_code?: string | null
          affiliate_id?: string | null
          attribution_visitor_id?: string | null
          contract_alert_days?: number
          created_at?: string
          default_approver_user_id?: string | null
          estate_agent_license?: string | null
          estate_agent_name?: string | null
          estate_license?: string | null
          expense_approval_threshold?: number | null
          ga_client_id?: string | null
          id?: string
          is_demo?: boolean
          is_tax_invoice_issuer?: boolean
          landing_path?: string | null
          loan_feature_enabled?: boolean
          logo_path?: string | null
          management_fee_tax_rate?: number
          max_units?: number
          name?: string
          phone?: string | null
          plan?: string
          postal_code?: string | null
          referrer?: string | null
          seal_column_enabled?: boolean
          signup_gclid?: string | null
          signup_path?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_current_period_end?: string | null
          subscription_started_at?: string | null
          subscription_status?: string
          updated_at?: string
          usage_type?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_default_approver_user_id_fkey"
            columns: ["default_approver_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      company_bank_accounts: {
        Row: {
          account_holder: string
          account_number: string
          account_type: string
          bank_code: string
          bank_name: string
          branch_code: string
          branch_name: string
          company_id: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          updated_at: string
        }
        Insert: {
          account_holder: string
          account_number: string
          account_type?: string
          bank_code: string
          bank_name: string
          branch_code: string
          branch_name: string
          company_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          updated_at?: string
        }
        Update: {
          account_holder?: string
          account_number?: string
          account_type?: string
          bank_code?: string
          bank_name?: string
          branch_code?: string
          branch_name?: string
          company_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
        ]
      }
      contracts: {
        Row: {
          brokerage_fee: number | null
          closing_day: number
          company_id: string
          contract_type: string
          created_at: string
          deposit: number
          deposit_unit: string
          end_date: string | null
          expiry_notified_at: string | null
          guarantor_name: string | null
          guarantor_phone: string | null
          id: string
          important_explanation_date: string | null
          insurance_company: string | null
          key_money: number
          key_money_unit: string
          management_fee: number
          move_in_date: string | null
          move_out_date: string | null
          notes: string | null
          payment_due_day: number | null
          payment_method: string | null
          payment_month_offset: number
          renewal_effective_date: string | null
          renewal_end_date: string | null
          renewal_fee: number
          renewal_fee_next: number | null
          renewal_fee_unit: string
          renewal_management_fee: number | null
          renewal_notes: string | null
          renewal_rent: number | null
          rent: number
          signed_date: string | null
          special_terms: string | null
          start_date: string
          status: string
          tenant_id: string
          unit_id: string
          updated_at: string
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          brokerage_fee?: number | null
          closing_day?: number
          company_id: string
          contract_type?: string
          created_at?: string
          deposit?: number
          deposit_unit?: string
          end_date?: string | null
          expiry_notified_at?: string | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          id?: string
          important_explanation_date?: string | null
          insurance_company?: string | null
          key_money?: number
          key_money_unit?: string
          management_fee?: number
          move_in_date?: string | null
          move_out_date?: string | null
          notes?: string | null
          payment_due_day?: number | null
          payment_method?: string | null
          payment_month_offset?: number
          renewal_effective_date?: string | null
          renewal_end_date?: string | null
          renewal_fee?: number
          renewal_fee_next?: number | null
          renewal_fee_unit?: string
          renewal_management_fee?: number | null
          renewal_notes?: string | null
          renewal_rent?: number | null
          rent: number
          signed_date?: string | null
          special_terms?: string | null
          start_date: string
          status?: string
          tenant_id: string
          unit_id: string
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          brokerage_fee?: number | null
          closing_day?: number
          company_id?: string
          contract_type?: string
          created_at?: string
          deposit?: number
          deposit_unit?: string
          end_date?: string | null
          expiry_notified_at?: string | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          id?: string
          important_explanation_date?: string | null
          insurance_company?: string | null
          key_money?: number
          key_money_unit?: string
          management_fee?: number
          move_in_date?: string | null
          move_out_date?: string | null
          notes?: string | null
          payment_due_day?: number | null
          payment_method?: string | null
          payment_month_offset?: number
          renewal_effective_date?: string | null
          renewal_end_date?: string | null
          renewal_fee?: number
          renewal_fee_next?: number | null
          renewal_fee_unit?: string
          renewal_management_fee?: number | null
          renewal_notes?: string | null
          renewal_rent?: number | null
          rent?: number
          signed_date?: string | null
          special_terms?: string | null
          start_date?: string
          status?: string
          tenant_id?: string
          unit_id?: string
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_clicks: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          ip: string | null
          location: string
          project: string
          referrer: string | null
          region: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          ip?: string | null
          location?: string
          project?: string
          referrer?: string | null
          region?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          ip?: string | null
          location?: string
          project?: string
          referrer?: string | null
          region?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      demo_share_events: {
        Row: {
          action: string
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          ip: string | null
          project: string
          recipient_email: string | null
          referrer: string | null
          region: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          ip?: string | null
          project?: string
          recipient_email?: string | null
          referrer?: string | null
          region?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          ip?: string | null
          project?: string
          recipient_email?: string | null
          referrer?: string | null
          region?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      deposit_transactions: {
        Row: {
          amount: number
          billing_id: string | null
          company_id: string
          contract_id: string
          created_at: string
          created_by: string | null
          expense_id: string | null
          id: string
          notes: string | null
          occurred_at: string
          reason: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          billing_id?: string | null
          company_id: string
          contract_id: string
          created_at?: string
          created_by?: string | null
          expense_id?: string | null
          id?: string
          notes?: string | null
          occurred_at?: string
          reason?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          billing_id?: string | null
          company_id?: string
          contract_id?: string
          created_at?: string
          created_by?: string | null
          expense_id?: string | null
          id?: string
          notes?: string | null
          occurred_at?: string
          reason?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_transactions_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "rent_billings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "deposit_transactions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_transactions_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          company_id: string
          contract_id: string | null
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_primary: boolean
          mime_type: string | null
          notes: string | null
          property_id: string | null
          tenant_id: string | null
          unit_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          contract_id?: string | null
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_primary?: boolean
          mime_type?: string | null
          notes?: string | null
          property_id?: string | null
          tenant_id?: string | null
          unit_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          contract_id?: string | null
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_primary?: boolean
          mime_type?: string | null
          notes?: string | null
          property_id?: string | null
          tenant_id?: string | null
          unit_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_followup_logs: {
        Row: {
          company_id: string | null
          email: string
          id: string
          resend_id: string | null
          sent_at: string
          template: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          email: string
          id?: string
          resend_id?: string | null
          sent_at?: string
          template: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          email?: string
          id?: string
          resend_id?: string | null
          sent_at?: string
          template?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_followup_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_followup_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
        ]
      }
      email_unsubscribes: {
        Row: {
          category: string
          created_at: string
          email: string
          id: string
          resubscribed_at: string | null
          token: string
          unsubscribed_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          email: string
          id?: string
          resubscribed_at?: string | null
          token: string
          unsubscribed_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          email?: string
          id?: string
          resubscribed_at?: string | null
          token?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      expense_allocations: {
        Row: {
          allocation_method: string
          amount: number
          company_amount: number
          company_id: string
          created_at: string
          expense_id: string
          id: string
          notes: string | null
          owner_amount: number
          owner_id: string | null
          share_ratio: number | null
          tenant_amount: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          allocation_method?: string
          amount?: number
          company_amount?: number
          company_id: string
          created_at?: string
          expense_id: string
          id?: string
          notes?: string | null
          owner_amount?: number
          owner_id?: string | null
          share_ratio?: number | null
          tenant_amount?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          allocation_method?: string
          amount?: number
          company_amount?: number
          company_id?: string
          created_at?: string
          expense_id?: string
          id?: string
          notes?: string | null
          owner_amount?: number
          owner_id?: string | null
          share_ratio?: number | null
          tenant_amount?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_allocations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_allocations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "expense_allocations_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_allocations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_allocations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          case_id: string | null
          category: string
          company_amount: number
          company_id: string
          contract_id: string | null
          created_at: string
          description: string
          expense_date: string
          id: string
          invoice_number: string | null
          notes: string | null
          owner_amount: number
          owner_id: string | null
          paid_at: string | null
          paid_by: string
          payee_id: string | null
          payment_due_date: string | null
          property_id: string | null
          rejected_reason: string | null
          remittance_id: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          tax_category: string
          tenant_amount: number
          unit_id: string | null
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          case_id?: string | null
          category: string
          company_amount?: number
          company_id: string
          contract_id?: string | null
          created_at?: string
          description: string
          expense_date: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          owner_amount?: number
          owner_id?: string | null
          paid_at?: string | null
          paid_by?: string
          payee_id?: string | null
          payment_due_date?: string | null
          property_id?: string | null
          rejected_reason?: string | null
          remittance_id?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          tax_category?: string
          tenant_amount?: number
          unit_id?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          case_id?: string | null
          category?: string
          company_amount?: number
          company_id?: string
          contract_id?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          owner_amount?: number
          owner_id?: string | null
          paid_at?: string | null
          paid_by?: string
          payee_id?: string | null
          payment_due_date?: string | null
          property_id?: string | null
          rejected_reason?: string | null
          remittance_id?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          tax_category?: string
          tenant_amount?: number
          unit_id?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "expenses_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "payees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_remittance_id_fkey"
            columns: ["remittance_id"]
            isOneToOne: false
            referencedRelation: "owner_remittances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_properties: {
        Row: {
          allocation_ratio: number | null
          company_id: string
          created_at: string
          id: string
          loan_id: string
          property_id: string
        }
        Insert: {
          allocation_ratio?: number | null
          company_id: string
          created_at?: string
          id?: string
          loan_id: string
          property_id: string
        }
        Update: {
          allocation_ratio?: number | null
          company_id?: string
          created_at?: string
          id?: string
          loan_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "loan_properties_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_repayments: {
        Row: {
          balance_after: number | null
          company_id: string
          created_at: string
          entry_type: string
          id: string
          installment_no: number | null
          interest_amount: number
          is_paid: boolean
          loan_id: string
          notes: string | null
          paid_at: string | null
          payment_date: string
          principal_amount: number
          source: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          balance_after?: number | null
          company_id: string
          created_at?: string
          entry_type?: string
          id?: string
          installment_no?: number | null
          interest_amount?: number
          is_paid?: boolean
          loan_id: string
          notes?: string | null
          paid_at?: string | null
          payment_date: string
          principal_amount?: number
          source?: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          balance_after?: number | null
          company_id?: string
          created_at?: string
          entry_type?: string
          id?: string
          installment_no?: number | null
          interest_amount?: number
          is_paid?: boolean
          loan_id?: string
          notes?: string | null
          paid_at?: string | null
          payment_date?: string
          principal_amount?: number
          source?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_repayments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_repayments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "loan_repayments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          bank_account_label: string | null
          company_id: string
          created_at: string
          disbursement_date: string | null
          final_payment_date: string | null
          first_payment_date: string | null
          id: string
          interest_rate: number | null
          interest_type: string
          lender_name: string
          loan_number: string | null
          name: string
          notes: string | null
          owner_id: string | null
          payment_day: number | null
          principal_amount: number
          repayment_method: string
          status: string
          term_months: number | null
          updated_at: string
        }
        Insert: {
          bank_account_label?: string | null
          company_id: string
          created_at?: string
          disbursement_date?: string | null
          final_payment_date?: string | null
          first_payment_date?: string | null
          id?: string
          interest_rate?: number | null
          interest_type?: string
          lender_name: string
          loan_number?: string | null
          name: string
          notes?: string | null
          owner_id?: string | null
          payment_day?: number | null
          principal_amount: number
          repayment_method?: string
          status?: string
          term_months?: number | null
          updated_at?: string
        }
        Update: {
          bank_account_label?: string | null
          company_id?: string
          created_at?: string
          disbursement_date?: string | null
          final_payment_date?: string | null
          first_payment_date?: string | null
          id?: string
          interest_rate?: number | null
          interest_type?: string
          lender_name?: string
          loan_number?: string | null
          name?: string
          notes?: string | null
          owner_id?: string | null
          payment_day?: number | null
          principal_amount?: number
          repayment_method?: string
          status?: string
          term_months?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "loans_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string
          city: string | null
          company_id: string | null
          country: string | null
          email: string
          ga_client_id: string | null
          gclid: string | null
          id: string
          ip_address: string | null
          landing_path: string | null
          referrer: string | null
          region: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          attempted_at?: string
          city?: string | null
          company_id?: string | null
          country?: string | null
          email: string
          ga_client_id?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          landing_path?: string | null
          referrer?: string | null
          region?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          attempted_at?: string
          city?: string | null
          company_id?: string | null
          country?: string | null
          email?: string
          ga_client_id?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          landing_path?: string | null
          referrer?: string | null
          region?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      move_out_checklist_items: {
        Row: {
          category: string
          checked_at: string | null
          checked_by: string | null
          company_id: string
          contract_id: string
          created_at: string
          id: string
          is_checked: boolean
          item_name: string
          notes: string | null
          sort_order: number
        }
        Insert: {
          category?: string
          checked_at?: string | null
          checked_by?: string | null
          company_id: string
          contract_id: string
          created_at?: string
          id?: string
          is_checked?: boolean
          item_name: string
          notes?: string | null
          sort_order?: number
        }
        Update: {
          category?: string
          checked_at?: string | null
          checked_by?: string | null
          company_id?: string
          contract_id?: string
          created_at?: string
          id?: string
          is_checked?: boolean
          item_name?: string
          notes?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "move_out_checklist_items_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "move_out_checklist_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "move_out_checklist_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "move_out_checklist_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      move_out_requests: {
        Row: {
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_account_type: string | null
          bank_branch: string | null
          bank_name: string | null
          change_log: string | null
          company_id: string
          contract_id: string
          created_at: string
          desired_move_out_date: string
          forwarding_address: string | null
          forwarding_phone: string | null
          forwarding_postal_code: string | null
          id: string
          reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          change_log?: string | null
          company_id: string
          contract_id: string
          created_at?: string
          desired_move_out_date: string
          forwarding_address?: string | null
          forwarding_phone?: string | null
          forwarding_postal_code?: string | null
          id?: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          change_log?: string | null
          company_id?: string
          contract_id?: string
          created_at?: string
          desired_move_out_date?: string
          forwarding_address?: string | null
          forwarding_phone?: string | null
          forwarding_postal_code?: string | null
          id?: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "move_out_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "move_out_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "move_out_requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "move_out_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "move_out_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          company_id: string
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_remittance_items: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          description: string
          id: string
          item_type: string
          remittance_id: string
          unit_id: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          description: string
          id?: string
          item_type: string
          remittance_id: string
          unit_id?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          item_type?: string
          remittance_id?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_remittance_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_remittance_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "owner_remittance_items_remittance_id_fkey"
            columns: ["remittance_id"]
            isOneToOne: false
            referencedRelation: "owner_remittances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_remittance_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_remittances: {
        Row: {
          company_id: string
          created_at: string
          expense_deducted: number
          id: string
          management_fee_deducted: number
          management_fee_tax: number
          manual_net_amount: number | null
          manual_override: boolean
          net_amount: number
          notes: string | null
          owner_bill_amount: number
          owner_id: string
          payment_method: string
          remittance_month: string
          sent_date: string | null
          status: string
          total_rent: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          expense_deducted?: number
          id?: string
          management_fee_deducted?: number
          management_fee_tax?: number
          manual_net_amount?: number | null
          manual_override?: boolean
          net_amount?: number
          notes?: string | null
          owner_bill_amount?: number
          owner_id: string
          payment_method?: string
          remittance_month: string
          sent_date?: string | null
          status?: string
          total_rent?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          expense_deducted?: number
          id?: string
          management_fee_deducted?: number
          management_fee_tax?: number
          manual_net_amount?: number | null
          manual_override?: boolean
          net_amount?: number
          notes?: string | null
          owner_bill_amount?: number
          owner_id?: string
          payment_method?: string
          remittance_month?: string
          sent_date?: string | null
          status?: string
          total_rent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_remittances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_remittances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "owner_remittances_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          address: string | null
          bank_account_holder: string | null
          bank_account_holder_kana: string | null
          bank_account_number: string | null
          bank_account_type: string | null
          bank_branch: string | null
          bank_branch_code: string | null
          bank_code: string | null
          bank_name: string | null
          birth_date: string | null
          company_id: string
          company_name: string | null
          company_name_kana: string | null
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          fax: string | null
          id: string
          invoice_number: string | null
          mailing_address: string | null
          mailing_postal_code: string | null
          mobile_phone: string | null
          name: string
          name_kana: string | null
          notes: string | null
          owner_type: string
          phone: string | null
          postal_code: string | null
          representative_name: string | null
          updated_at: string
          withholding_required: boolean
        }
        Insert: {
          address?: string | null
          bank_account_holder?: string | null
          bank_account_holder_kana?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_branch?: string | null
          bank_branch_code?: string | null
          bank_code?: string | null
          bank_name?: string | null
          birth_date?: string | null
          company_id: string
          company_name?: string | null
          company_name_kana?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          fax?: string | null
          id?: string
          invoice_number?: string | null
          mailing_address?: string | null
          mailing_postal_code?: string | null
          mobile_phone?: string | null
          name: string
          name_kana?: string | null
          notes?: string | null
          owner_type?: string
          phone?: string | null
          postal_code?: string | null
          representative_name?: string | null
          updated_at?: string
          withholding_required?: boolean
        }
        Update: {
          address?: string | null
          bank_account_holder?: string | null
          bank_account_holder_kana?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_branch?: string | null
          bank_branch_code?: string | null
          bank_code?: string | null
          bank_name?: string | null
          birth_date?: string | null
          company_id?: string
          company_name?: string | null
          company_name_kana?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          fax?: string | null
          id?: string
          invoice_number?: string | null
          mailing_address?: string | null
          mailing_postal_code?: string | null
          mobile_phone?: string | null
          name?: string
          name_kana?: string | null
          notes?: string | null
          owner_type?: string
          phone?: string | null
          postal_code?: string | null
          representative_name?: string | null
          updated_at?: string
          withholding_required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "owners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
        ]
      }
      payees: {
        Row: {
          account_holder_kana: string | null
          account_number: string | null
          account_type: string
          bank_code: string | null
          bank_name: string | null
          branch_code: string | null
          branch_name: string | null
          category: string
          company_id: string
          created_at: string
          id: string
          name: string
          name_kana: string | null
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          account_holder_kana?: string | null
          account_number?: string | null
          account_type?: string
          bank_code?: string | null
          bank_name?: string | null
          branch_code?: string | null
          branch_name?: string | null
          category?: string
          company_id: string
          created_at?: string
          id?: string
          name: string
          name_kana?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          account_holder_kana?: string | null
          account_number?: string | null
          account_type?: string
          bank_code?: string | null
          bank_name?: string | null
          branch_code?: string | null
          branch_name?: string | null
          category?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          name_kana?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
        ]
      }
      payment_batch_items: {
        Row: {
          account_holder_kana: string
          account_number: string
          account_type: string
          amount: number
          bank_code: string
          branch_code: string
          company_id: string
          created_at: string
          expense_id: string | null
          id: string
          item_type: string
          label: string | null
          owner_remittance_id: string | null
          payment_batch_id: string
          recipient_name: string
        }
        Insert: {
          account_holder_kana: string
          account_number: string
          account_type?: string
          amount: number
          bank_code: string
          branch_code: string
          company_id: string
          created_at?: string
          expense_id?: string | null
          id?: string
          item_type: string
          label?: string | null
          owner_remittance_id?: string | null
          payment_batch_id: string
          recipient_name: string
        }
        Update: {
          account_holder_kana?: string
          account_number?: string
          account_type?: string
          amount?: number
          bank_code?: string
          branch_code?: string
          company_id?: string
          created_at?: string
          expense_id?: string | null
          id?: string
          item_type?: string
          label?: string | null
          owner_remittance_id?: string | null
          payment_batch_id?: string
          recipient_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_batch_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_batch_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "payment_batch_items_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_batch_items_owner_remittance_id_fkey"
            columns: ["owner_remittance_id"]
            isOneToOne: false
            referencedRelation: "owner_remittances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_batch_items_payment_batch_id_fkey"
            columns: ["payment_batch_id"]
            isOneToOne: false
            referencedRelation: "payment_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_batches: {
        Row: {
          batch_date: string
          company_id: string
          created_at: string
          created_by: string | null
          executed_at: string | null
          id: string
          notes: string | null
          sender_account_id: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          batch_date: string
          company_id: string
          created_at?: string
          created_by?: string | null
          executed_at?: string | null
          id?: string
          notes?: string | null
          sender_account_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          batch_date?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          executed_at?: string | null
          id?: string
          notes?: string | null
          sender_account_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_batches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_batches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "payment_batches_sender_account_id_fkey"
            columns: ["sender_account_id"]
            isOneToOne: false
            referencedRelation: "company_bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          appeal_points: string | null
          approver_user_id: string | null
          asbestos_survey: string | null
          bicycle_parking: string | null
          bike_parking: string | null
          building_area_sqm: number | null
          building_coverage_ratio: number | null
          building_number: string | null
          built_month: number | null
          built_year: number | null
          bus_minutes: number | null
          bus_station: string | null
          city: string | null
          common_facilities: string[] | null
          company_id: string
          created_at: string
          default_allocation_method: string
          earthquake_resistance: string | null
          electricity: string | null
          flood_hazard_zone: boolean | null
          floor_area_ratio: number | null
          floors: number | null
          gas_type: string | null
          id: string
          internal_memo: string | null
          land_area_sqm: number | null
          land_rights: string | null
          land_use_zone: string | null
          landslide_hazard_zone: boolean | null
          latitude: number | null
          longitude: number | null
          management_company: string | null
          management_fee_amount: number
          management_fee_rate: number
          management_fee_type: string
          management_form: string | null
          mortgage_amount: number | null
          mortgage_exists: boolean | null
          mortgagee: string | null
          name: string
          name_kana: string | null
          nearest_station: string | null
          nearest_station_2: string | null
          nearest_station_2_id: string | null
          nearest_station_3: string | null
          nearest_station_3_id: string | null
          nearest_station_id: string | null
          notes: string | null
          owner_id: string | null
          parking: string | null
          parking_fee: number | null
          postal_code: string | null
          prefecture: string | null
          property_code: string | null
          property_type: string
          registered_owner_name: string | null
          renovation_month: number | null
          renovation_year: number | null
          septic_tank: boolean | null
          sewage: string | null
          structure: string | null
          total_area_sqm: number | null
          total_units: number | null
          town: string | null
          transaction_type: string | null
          tsunami_hazard_zone: boolean | null
          underground_floors: number | null
          updated_at: string
          walk_minutes: number | null
          walk_minutes_2: number | null
          walk_minutes_3: number | null
          water_supply: string | null
          zoning: string | null
        }
        Insert: {
          address: string
          appeal_points?: string | null
          approver_user_id?: string | null
          asbestos_survey?: string | null
          bicycle_parking?: string | null
          bike_parking?: string | null
          building_area_sqm?: number | null
          building_coverage_ratio?: number | null
          building_number?: string | null
          built_month?: number | null
          built_year?: number | null
          bus_minutes?: number | null
          bus_station?: string | null
          city?: string | null
          common_facilities?: string[] | null
          company_id: string
          created_at?: string
          default_allocation_method?: string
          earthquake_resistance?: string | null
          electricity?: string | null
          flood_hazard_zone?: boolean | null
          floor_area_ratio?: number | null
          floors?: number | null
          gas_type?: string | null
          id?: string
          internal_memo?: string | null
          land_area_sqm?: number | null
          land_rights?: string | null
          land_use_zone?: string | null
          landslide_hazard_zone?: boolean | null
          latitude?: number | null
          longitude?: number | null
          management_company?: string | null
          management_fee_amount?: number
          management_fee_rate?: number
          management_fee_type?: string
          management_form?: string | null
          mortgage_amount?: number | null
          mortgage_exists?: boolean | null
          mortgagee?: string | null
          name: string
          name_kana?: string | null
          nearest_station?: string | null
          nearest_station_2?: string | null
          nearest_station_2_id?: string | null
          nearest_station_3?: string | null
          nearest_station_3_id?: string | null
          nearest_station_id?: string | null
          notes?: string | null
          owner_id?: string | null
          parking?: string | null
          parking_fee?: number | null
          postal_code?: string | null
          prefecture?: string | null
          property_code?: string | null
          property_type?: string
          registered_owner_name?: string | null
          renovation_month?: number | null
          renovation_year?: number | null
          septic_tank?: boolean | null
          sewage?: string | null
          structure?: string | null
          total_area_sqm?: number | null
          total_units?: number | null
          town?: string | null
          transaction_type?: string | null
          tsunami_hazard_zone?: boolean | null
          underground_floors?: number | null
          updated_at?: string
          walk_minutes?: number | null
          walk_minutes_2?: number | null
          walk_minutes_3?: number | null
          water_supply?: string | null
          zoning?: string | null
        }
        Update: {
          address?: string
          appeal_points?: string | null
          approver_user_id?: string | null
          asbestos_survey?: string | null
          bicycle_parking?: string | null
          bike_parking?: string | null
          building_area_sqm?: number | null
          building_coverage_ratio?: number | null
          building_number?: string | null
          built_month?: number | null
          built_year?: number | null
          bus_minutes?: number | null
          bus_station?: string | null
          city?: string | null
          common_facilities?: string[] | null
          company_id?: string
          created_at?: string
          default_allocation_method?: string
          earthquake_resistance?: string | null
          electricity?: string | null
          flood_hazard_zone?: boolean | null
          floor_area_ratio?: number | null
          floors?: number | null
          gas_type?: string | null
          id?: string
          internal_memo?: string | null
          land_area_sqm?: number | null
          land_rights?: string | null
          land_use_zone?: string | null
          landslide_hazard_zone?: boolean | null
          latitude?: number | null
          longitude?: number | null
          management_company?: string | null
          management_fee_amount?: number
          management_fee_rate?: number
          management_fee_type?: string
          management_form?: string | null
          mortgage_amount?: number | null
          mortgage_exists?: boolean | null
          mortgagee?: string | null
          name?: string
          name_kana?: string | null
          nearest_station?: string | null
          nearest_station_2?: string | null
          nearest_station_2_id?: string | null
          nearest_station_3?: string | null
          nearest_station_3_id?: string | null
          nearest_station_id?: string | null
          notes?: string | null
          owner_id?: string | null
          parking?: string | null
          parking_fee?: number | null
          postal_code?: string | null
          prefecture?: string | null
          property_code?: string | null
          property_type?: string
          registered_owner_name?: string | null
          renovation_month?: number | null
          renovation_year?: number | null
          septic_tank?: boolean | null
          sewage?: string | null
          structure?: string | null
          total_area_sqm?: number | null
          total_units?: number | null
          town?: string | null
          transaction_type?: string | null
          tsunami_hazard_zone?: boolean | null
          underground_floors?: number | null
          updated_at?: string
          walk_minutes?: number | null
          walk_minutes_2?: number | null
          walk_minutes_3?: number | null
          water_supply?: string | null
          zoning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_approver_user_id_fkey"
            columns: ["approver_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "properties_nearest_station_2_id_fkey"
            columns: ["nearest_station_2_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["station_cd"]
          },
          {
            foreignKeyName: "properties_nearest_station_3_id_fkey"
            columns: ["nearest_station_3_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["station_cd"]
          },
          {
            foreignKeyName: "properties_nearest_station_id_fkey"
            columns: ["nearest_station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["station_cd"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_billings: {
        Row: {
          billing_month: string
          company_id: string
          contract_id: string
          created_at: string
          due_date: string
          id: string
          management_fee: number
          other_amount: number
          other_description: string | null
          overdue_notified_at: string | null
          rent: number
          status: string
          total_amount: number
          updated_at: string
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          billing_month: string
          company_id: string
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          management_fee?: number
          other_amount?: number
          other_description?: string | null
          overdue_notified_at?: string | null
          rent: number
          status?: string
          total_amount: number
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          billing_month?: string
          company_id?: string
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          management_fee?: number
          other_amount?: number
          other_description?: string | null
          overdue_notified_at?: string | null
          rent?: number
          status?: string
          total_amount?: number
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rent_billings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_billings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "rent_billings_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_billings_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_payments: {
        Row: {
          amount: number
          billing_id: string
          company_id: string
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
        }
        Insert: {
          amount: number
          billing_id: string
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string
        }
        Update: {
          amount?: number
          billing_id?: string
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_payments_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "rent_billings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
        ]
      }
      signup_attempts: {
        Row: {
          attempted_at: string
          city: string | null
          company_name: string | null
          country: string | null
          created_company_id: string | null
          email: string | null
          error_code: string | null
          error_message: string | null
          ga_client_id: string | null
          gclid: string | null
          id: string
          ip_address: string | null
          landing_path: string | null
          name: string | null
          referrer: string | null
          region: string | null
          signup_path: string | null
          success: boolean
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          attempted_at?: string
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_company_id?: string | null
          email?: string | null
          error_code?: string | null
          error_message?: string | null
          ga_client_id?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          landing_path?: string | null
          name?: string | null
          referrer?: string | null
          region?: string | null
          signup_path?: string | null
          success?: boolean
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          attempted_at?: string
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_company_id?: string | null
          email?: string | null
          error_code?: string | null
          error_message?: string | null
          ga_client_id?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          landing_path?: string | null
          name?: string | null
          referrer?: string | null
          region?: string | null
          signup_path?: string | null
          success?: boolean
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      stations: {
        Row: {
          created_at: string | null
          lat: number | null
          line_cd: number | null
          lon: number | null
          pref_cd: string | null
          station_cd: string
          station_g_cd: string | null
          station_name: string
        }
        Insert: {
          created_at?: string | null
          lat?: number | null
          line_cd?: number | null
          lon?: number | null
          pref_cd?: string | null
          station_cd: string
          station_g_cd?: string | null
          station_name: string
        }
        Update: {
          created_at?: string | null
          lat?: number | null
          line_cd?: number | null
          lon?: number | null
          pref_cd?: string | null
          station_cd?: string
          station_g_cd?: string | null
          station_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "stations_line_cd_fkey"
            columns: ["line_cd"]
            isOneToOne: false
            referencedRelation: "train_lines"
            referencedColumns: ["line_cd"]
          },
        ]
      }
      subscription_events: {
        Row: {
          company_id: string
          created_at: string
          event_type: string
          from_status: string | null
          id: string
          metadata: Json | null
          occurred_at: string
          plan: string | null
          stripe_event_id: string | null
          stripe_subscription_id: string | null
          to_status: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          event_type: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string
          plan?: string | null
          stripe_event_id?: string | null
          stripe_subscription_id?: string | null
          to_status?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          event_type?: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string
          plan?: string | null
          stripe_event_id?: string | null
          stripe_subscription_id?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
        ]
      }
      tenant_auth_users: {
        Row: {
          auth_user_id: string
          company_id: string
          id: string
          invited_at: string
          last_login_at: string | null
          tenant_id: string
        }
        Insert: {
          auth_user_id: string
          company_id: string
          id?: string
          invited_at?: string
          last_login_at?: string | null
          tenant_id: string
        }
        Update: {
          auth_user_id?: string
          company_id?: string
          id?: string
          invited_at?: string
          last_login_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_auth_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_auth_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tenant_auth_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          annual_income: number | null
          company_id: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          gender: string | null
          guarantee_company_name: string | null
          guarantee_contract_number: string | null
          guarantee_fee: number | null
          guarantee_type: string | null
          guarantor_address: string | null
          guarantor_annual_income: number | null
          guarantor_date_of_birth: string | null
          guarantor_name: string | null
          guarantor_name_kana: string | null
          guarantor_phone: string | null
          guarantor_postal_code: string | null
          guarantor_relation: string | null
          guarantor_workplace: string | null
          guarantor_workplace_phone: string | null
          id: string
          name: string
          name_kana: string | null
          nationality: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string
          workplace: string | null
          workplace_phone: string | null
        }
        Insert: {
          address?: string | null
          annual_income?: number | null
          company_id: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          gender?: string | null
          guarantee_company_name?: string | null
          guarantee_contract_number?: string | null
          guarantee_fee?: number | null
          guarantee_type?: string | null
          guarantor_address?: string | null
          guarantor_annual_income?: number | null
          guarantor_date_of_birth?: string | null
          guarantor_name?: string | null
          guarantor_name_kana?: string | null
          guarantor_phone?: string | null
          guarantor_postal_code?: string | null
          guarantor_relation?: string | null
          guarantor_workplace?: string | null
          guarantor_workplace_phone?: string | null
          id?: string
          name: string
          name_kana?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          workplace?: string | null
          workplace_phone?: string | null
        }
        Update: {
          address?: string | null
          annual_income?: number | null
          company_id?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          gender?: string | null
          guarantee_company_name?: string | null
          guarantee_contract_number?: string | null
          guarantee_fee?: number | null
          guarantee_type?: string | null
          guarantor_address?: string | null
          guarantor_annual_income?: number | null
          guarantor_date_of_birth?: string | null
          guarantor_name?: string | null
          guarantor_name_kana?: string | null
          guarantor_phone?: string | null
          guarantor_postal_code?: string | null
          guarantor_relation?: string | null
          guarantor_workplace?: string | null
          guarantor_workplace_phone?: string | null
          id?: string
          name?: string
          name_kana?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          workplace?: string | null
          workplace_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
        ]
      }
      tool_logs: {
        Row: {
          created_at: string
          id: number
          inputs: Json
          ip: string | null
          referer: string | null
          result: Json | null
          tool_slug: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          inputs: Json
          ip?: string | null
          referer?: string | null
          result?: Json | null
          tool_slug: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          inputs?: Json
          ip?: string | null
          referer?: string | null
          result?: Json | null
          tool_slug?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      train_lines: {
        Row: {
          company_name: string | null
          created_at: string | null
          lat: number | null
          line_cd: number
          line_name: string
          lon: number | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          lat?: number | null
          line_cd: number
          line_name: string
          lon?: number | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          lat?: number | null
          line_cd?: number
          line_name?: string
          lon?: number | null
        }
        Relationships: []
      }
      units: {
        Row: {
          area_sqm: number | null
          company_id: string
          created_at: string
          damage_notes: string | null
          equipment: string[] | null
          floor: number | null
          id: string
          layout: string | null
          management_fee: number
          notes: string | null
          property_id: string
          rent: number
          status: string
          unit_number: string
          updated_at: string
        }
        Insert: {
          area_sqm?: number | null
          company_id: string
          created_at?: string
          damage_notes?: string | null
          equipment?: string[] | null
          floor?: number | null
          id?: string
          layout?: string | null
          management_fee?: number
          notes?: string | null
          property_id: string
          rent?: number
          status?: string
          unit_number: string
          updated_at?: string
        }
        Update: {
          area_sqm?: number | null
          company_id?: string
          created_at?: string
          damage_notes?: string | null
          equipment?: string[] | null
          floor?: number | null
          id?: string
          layout?: string | null
          management_fee?: number
          notes?: string | null
          property_id?: string
          rent?: number
          status?: string
          unit_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          company_id: string
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          deleted_at?: string | null
          email: string
          id: string
          is_active?: boolean
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
        ]
      }
      vacancies: {
        Row: {
          ad_comment: string | null
          available_from: string
          company_id: string
          created_at: string
          id: string
          listing_status: string
          unit_id: string
          updated_at: string
          viewing_available: boolean
        }
        Insert: {
          ad_comment?: string | null
          available_from: string
          company_id: string
          created_at?: string
          id?: string
          listing_status?: string
          unit_id: string
          updated_at?: string
          viewing_available?: boolean
        }
        Update: {
          ad_comment?: string | null
          available_from?: string
          company_id?: string
          created_at?: string
          id?: string
          listing_status?: string
          unit_id?: string
          updated_at?: string
          viewing_available?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "vacancies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_activity"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "vacancies_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_company_activity: {
        Row: {
          activity_status: string | null
          company_id: string | null
          days_since_last_op: number | null
          is_demo: boolean | null
          last_login_at: string | null
          last_op_at: string | null
          logins_ok: number | null
          max_units: number | null
          name: string | null
          ops_30d: number | null
          ops_7d: number | null
          ops_total: number | null
          plan: string | null
          signed_up_at: string | null
          user_count: number | null
        }
        Relationships: []
      }
      v_login_by_geo: {
        Row: {
          city: string | null
          country: string | null
          failure_count: number | null
          last_seen_at: string | null
          region: string | null
          success_count: number | null
          unique_emails: number | null
          unique_ips: number | null
        }
        Relationships: []
      }
      v_login_by_source: {
        Row: {
          last_seen_at: string | null
          success_count: number | null
          unique_success_emails: number | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Relationships: []
      }
      v_login_daily: {
        Row: {
          day: string | null
          failure_count: number | null
          success_count: number | null
          total_attempts: number | null
          unique_success_emails: number | null
          unique_success_ips: number | null
        }
        Relationships: []
      }
      v_signup_attribution: {
        Row: {
          attempts: number | null
          conversions: number | null
          cv_rate_percent: number | null
          last_seen_at: string | null
          unique_countries: number | null
          unique_ips: number | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Relationships: []
      }
      v_signup_by_geo: {
        Row: {
          attempts: number | null
          city: string | null
          conversions: number | null
          country: string | null
          last_seen_at: string | null
          region: string | null
          unique_ips: number | null
        }
        Relationships: []
      }
      v_signup_funnel: {
        Row: {
          auth_failures: number | null
          company_insert_failures: number | null
          day: string | null
          duplicate_email_failures: number | null
          other_failures: number | null
          profile_failures: number | null
          success_count: number | null
          success_rate_percent: number | null
          total_attempts: number | null
          validation_failures: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _recalc_unit_status: { Args: { p_unit_id: string }; Returns: undefined }
      company_id: { Args: never; Returns: string }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      generate_affiliate_code: { Args: never; Returns: string }
      is_subscription_active: { Args: { company_id: string }; Returns: boolean }
      tenant_id: { Args: never; Returns: string }
      user_role: { Args: never; Returns: string }
      user_type: { Args: never; Returns: string }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
