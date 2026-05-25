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
  public: {
    Tables: {
      demo_write_logs: {
        Row: {
          action: string
          company_id: string
          created_at: string
          id: string
          table_name: string
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          id?: string
          table_name: string
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_write_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      companies: {
        Row: {
          address: string | null
          contract_alert_days: number
          created_at: string
          estate_agent_license: string | null
          estate_agent_name: string | null
          estate_license: string | null
          id: string
          is_demo: boolean
          max_units: number
          name: string
          phone: string | null
          plan: string
          postal_code: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_current_period_end: string | null
          subscription_status: string
          updated_at: string
          usage_type: string
        }
        Insert: {
          address?: string | null
          contract_alert_days?: number
          created_at?: string
          estate_agent_license?: string | null
          estate_agent_name?: string | null
          estate_license?: string | null
          id?: string
          is_demo?: boolean
          max_units?: number
          name: string
          phone?: string | null
          plan?: string
          postal_code?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_current_period_end?: string | null
          subscription_status?: string
          updated_at?: string
          usage_type?: string
        }
        Update: {
          address?: string | null
          contract_alert_days?: number
          created_at?: string
          estate_agent_license?: string | null
          estate_agent_name?: string | null
          estate_license?: string | null
          id?: string
          is_demo?: boolean
          max_units?: number
          name?: string
          phone?: string | null
          plan?: string
          postal_code?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_current_period_end?: string | null
          subscription_status?: string
          updated_at?: string
          usage_type?: string
        }
        Relationships: []
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
        ]
      }
      contracts: {
        Row: {
          brokerage_fee: number | null
          company_id: string
          contract_type: string
          created_at: string
          deposit: number
          end_date: string | null
          expiry_notified_at: string | null
          guarantor_name: string | null
          guarantor_phone: string | null
          id: string
          important_explanation_date: string | null
          insurance_company: string | null
          key_money: number
          management_fee: number
          move_in_date: string | null
          move_out_date: string | null
          notes: string | null
          payment_due_day: number | null
          payment_method: string | null
          renewal_fee: number
          rent: number
          signed_date: string | null
          special_terms: string | null
          start_date: string
          status: string
          tenant_id: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          brokerage_fee?: number | null
          company_id: string
          contract_type?: string
          created_at?: string
          deposit?: number
          end_date?: string | null
          expiry_notified_at?: string | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          id?: string
          important_explanation_date?: string | null
          insurance_company?: string | null
          key_money?: number
          management_fee?: number
          move_in_date?: string | null
          move_out_date?: string | null
          notes?: string | null
          payment_due_day?: number | null
          payment_method?: string | null
          renewal_fee?: number
          rent: number
          signed_date?: string | null
          special_terms?: string | null
          start_date: string
          status?: string
          tenant_id: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          brokerage_fee?: number | null
          company_id?: string
          contract_type?: string
          created_at?: string
          deposit?: number
          end_date?: string | null
          expiry_notified_at?: string | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          id?: string
          important_explanation_date?: string | null
          insurance_company?: string | null
          key_money?: number
          management_fee?: number
          move_in_date?: string | null
          move_out_date?: string | null
          notes?: string | null
          payment_due_day?: number | null
          payment_method?: string | null
          renewal_fee?: number
          rent?: number
          signed_date?: string | null
          special_terms?: string | null
          start_date?: string
          status?: string
          tenant_id?: string
          unit_id?: string
          updated_at?: string
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
      move_out_checklist_items: {
        Row: {
          id: string
          company_id: string
          contract_id: string
          category: string
          item_name: string
          is_checked: boolean
          notes: string | null
          checked_at: string | null
          checked_by: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          contract_id: string
          category?: string
          item_name: string
          is_checked?: boolean
          notes?: string | null
          checked_at?: string | null
          checked_by?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          contract_id?: string
          category?: string
          item_name?: string
          is_checked?: boolean
          notes?: string | null
          checked_at?: string | null
          checked_by?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "move_out_checklist_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
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
      expenses: {
        Row: {
          amount: number
          category: string
          company_id: string
          created_at: string
          description: string
          expense_date: string
          id: string
          invoice_number: string | null
          is_owner_charge: boolean
          notes: string | null
          owner_id: string | null
          property_id: string | null
          unit_id: string | null
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          category: string
          company_id: string
          created_at?: string
          description: string
          expense_date: string
          id?: string
          invoice_number?: string | null
          is_owner_charge?: boolean
          notes?: string | null
          owner_id?: string | null
          property_id?: string | null
          unit_id?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          category?: string
          company_id?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          invoice_number?: string | null
          is_owner_charge?: boolean
          notes?: string | null
          owner_id?: string | null
          property_id?: string | null
          unit_id?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
      inquiries: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          inquiry_type: string
          notes: string | null
          priority: string
          property_id: string | null
          status: string
          tenant_id: string | null
          title: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          inquiry_type?: string
          notes?: string | null
          priority?: string
          property_id?: string | null
          status?: string
          tenant_id?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          inquiry_type?: string
          notes?: string | null
          priority?: string
          property_id?: string | null
          status?: string
          tenant_id?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_logs: {
        Row: {
          action_type: string
          company_id: string
          content: string | null
          created_at: string
          id: string
          inquiry_id: string
          logged_at: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          company_id: string
          content?: string | null
          created_at?: string
          id?: string
          inquiry_id: string
          logged_at?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          company_id?: string
          content?: string | null
          created_at?: string
          id?: string
          inquiry_id?: string
          logged_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_logs_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Relationships: []
      }
      maintenance_logs: {
        Row: {
          action: string
          company_id: string
          id: string
          logged_at: string
          request_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          company_id: string
          id?: string
          logged_at?: string
          request_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string
          id?: string
          logged_at?: string
          request_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
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
          priority: string
          property_id: string
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
          priority?: string
          property_id: string
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
          priority?: string
          property_id?: string
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
            foreignKeyName: "maintenance_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
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
          unit_id: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          description: string
          id?: string
          item_type: string
          remittance_id: string
          unit_id: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          item_type?: string
          remittance_id?: string
          unit_id?: string
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
          manual_net_amount: number | null
          manual_override: boolean
          net_amount: number
          notes: string | null
          owner_id: string
          payment_method: string
          remittance_month: string
          sent_date: string | null
          status: string
          total_rent: number
          transfer_date: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          expense_deducted?: number
          id?: string
          management_fee_deducted?: number
          manual_net_amount?: number | null
          manual_override?: boolean
          net_amount?: number
          notes?: string | null
          owner_id: string
          payment_method?: string
          remittance_month: string
          sent_date?: string | null
          status?: string
          total_rent?: number
          transfer_date?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          expense_deducted?: number
          id?: string
          management_fee_deducted?: number
          manual_net_amount?: number | null
          manual_override?: boolean
          net_amount?: number
          notes?: string | null
          owner_id?: string
          payment_method?: string
          remittance_month?: string
          sent_date?: string | null
          status?: string
          total_rent?: number
          transfer_date?: string | null
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
          bank_account_number: string | null
          bank_account_type: string | null
          bank_branch: string | null
          bank_branch_code: string | null
          bank_code: string | null
          bank_name: string | null
          company_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_branch?: string | null
          bank_branch_code?: string | null
          bank_code?: string | null
          bank_name?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_branch?: string | null
          bank_branch_code?: string | null
          bank_code?: string | null
          bank_name?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          appeal_points: string | null
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
          management_fee_rate: number
          management_form: string | null
          mortgage_amount: number | null
          mortgage_exists: boolean | null
          mortgagee: string | null
          name: string
          name_kana: string | null
          nearest_station: string | null
          nearest_station_2: string | null
          nearest_station_3: string | null
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
          management_fee_rate?: number
          management_form?: string | null
          mortgage_amount?: number | null
          mortgage_exists?: boolean | null
          mortgagee?: string | null
          name: string
          name_kana?: string | null
          nearest_station?: string | null
          nearest_station_2?: string | null
          nearest_station_3?: string | null
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
          management_fee_rate?: number
          management_form?: string | null
          mortgage_amount?: number | null
          mortgage_exists?: boolean | null
          mortgagee?: string | null
          name?: string
          name_kana?: string | null
          nearest_station?: string | null
          nearest_station_2?: string | null
          nearest_station_3?: string | null
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
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
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
            foreignKeyName: "rent_billings_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
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
          guarantor_address: string | null
          guarantor_annual_income: number | null
          guarantor_date_of_birth: string | null
          guarantor_name: string | null
          guarantor_name_kana: string | null
          guarantor_phone: string | null
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
          guarantor_address?: string | null
          guarantor_annual_income?: number | null
          guarantor_date_of_birth?: string | null
          guarantor_name?: string | null
          guarantor_name_kana?: string | null
          guarantor_phone?: string | null
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
          guarantor_address?: string | null
          guarantor_annual_income?: number | null
          guarantor_date_of_birth?: string | null
          guarantor_name?: string | null
          guarantor_name_kana?: string | null
          guarantor_phone?: string | null
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
        ]
      }
      units: {
        Row: {
          area_sqm: number | null
          company_id: string
          created_at: string
          deposit: number
          equipment: string[] | null
          floor: number | null
          id: string
          key_money: number
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
          deposit?: number
          equipment?: string[] | null
          floor?: number | null
          id?: string
          key_money?: number
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
          deposit?: number
          equipment?: string[] | null
          floor?: number | null
          id?: string
          key_money?: number
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
        ]
      }
      payees: {
        Row: {
          id: string
          company_id: string
          name: string
          name_kana: string | null
          category: string
          phone: string | null
          notes: string | null
          bank_code: string | null
          bank_name: string | null
          branch_code: string | null
          branch_name: string | null
          account_type: string
          account_number: string | null
          account_holder_kana: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          name_kana?: string | null
          category?: string
          phone?: string | null
          notes?: string | null
          bank_code?: string | null
          bank_name?: string | null
          branch_code?: string | null
          branch_name?: string | null
          account_type?: string
          account_number?: string | null
          account_holder_kana?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          name_kana?: string | null
          category?: string
          phone?: string | null
          notes?: string | null
          bank_code?: string | null
          bank_name?: string | null
          branch_code?: string | null
          branch_name?: string | null
          account_type?: string
          account_number?: string | null
          account_holder_kana?: string | null
          created_at?: string
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
      [_ in never]: never
    }
    Functions: {
      company_id: { Args: never; Returns: string }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
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
  public: {
    Enums: {},
  },
} as const
