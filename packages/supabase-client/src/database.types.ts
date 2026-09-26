export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      auth_audit_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      benefits: {
        Row: {
          allowed_locations: string[] | null
          allowed_provider_categories: string[] | null
          budget_cap_per_employee: number | null
          co_pay_percentage: number | null
          created_at: string | null
          id: string
          is_family_eligible: boolean | null
          max_monthly_visits: number | null
          name: string
          org_id: string
          updated_at: string | null
        }
        Insert: {
          allowed_locations?: string[] | null
          allowed_provider_categories?: string[] | null
          budget_cap_per_employee?: number | null
          co_pay_percentage?: number | null
          created_at?: string | null
          id?: string
          is_family_eligible?: boolean | null
          max_monthly_visits?: number | null
          name: string
          org_id: string
          updated_at?: string | null
        }
        Update: {
          allowed_locations?: string[] | null
          allowed_provider_categories?: string[] | null
          budget_cap_per_employee?: number | null
          co_pay_percentage?: number | null
          created_at?: string | null
          id?: string
          is_family_eligible?: boolean | null
          max_monthly_visits?: number | null
          name?: string
          org_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benefits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      eligibility: {
        Row: {
          activated_at: string | null
          benefit_id: string
          employee_id: string
          expires_at: string | null
          id: string
          status: Database["public"]["Enums"]["eligibility_status"] | null
        }
        Insert: {
          activated_at?: string | null
          benefit_id: string
          employee_id: string
          expires_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["eligibility_status"] | null
        }
        Update: {
          activated_at?: string | null
          benefit_id?: string
          employee_id?: string
          expires_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["eligibility_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          employee_id_external: string | null
          full_name: string
          id: string
          org_id: string
          status: Database["public"]["Enums"]["employee_status"] | null
          tier: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          employee_id_external?: string | null
          full_name: string
          id?: string
          org_id: string
          status?: Database["public"]["Enums"]["employee_status"] | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          employee_id_external?: string | null
          full_name?: string
          id?: string
          org_id?: string
          status?: Database["public"]["Enums"]["employee_status"] | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string | null
          provider_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          org_id?: string | null
          provider_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string | null
          provider_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          created_at: string | null
          id: string
          invoice_id: string
          per_visit_rate: number
          provider_id: string
          subtotal: number
          updated_at: string | null
          visit_count: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_id: string
          per_visit_rate: number
          provider_id: string
          subtotal: number
          updated_at?: string | null
          visit_count?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_id?: string
          per_visit_rate?: number
          provider_id?: string
          subtotal?: number
          updated_at?: string | null
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          created_at: string | null
          due_date: string | null
          id: string
          org_id: string
          paid_at: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          tax_amount: number
          total_amount: number
          total_visits: number
          updated_at: string | null
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          org_id: string
          paid_at?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tax_amount?: number
          total_amount?: number
          total_visits?: number
          updated_at?: string | null
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          org_id?: string
          paid_at?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tax_amount?: number
          total_amount?: number
          total_visits?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_email: string | null
          contact_email: string | null
          country: string | null
          created_at: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          status: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          billing_email?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_email?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string | null
          description: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      provider_contracts: {
        Row: {
          access_hours: Json | null
          created_at: string | null
          effective_from: string
          effective_to: string | null
          id: string
          monthly_cap: number | null
          org_id: string
          per_visit_rate: number
          provider_id: string
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string | null
        }
        Insert: {
          access_hours?: Json | null
          created_at?: string | null
          effective_from: string
          effective_to?: string | null
          id?: string
          monthly_cap?: number | null
          org_id: string
          per_visit_rate: number
          provider_id: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string | null
        }
        Update: {
          access_hours?: Json | null
          created_at?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          monthly_cap?: number | null
          org_id?: string
          per_visit_rate?: number
          provider_id?: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_contracts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_contracts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_locations: {
        Row: {
          address: string | null
          amenities: string[] | null
          capacity: number | null
          city: string | null
          country: string | null
          created_at: string | null
          geo: unknown
          id: string
          lat: number | null
          lng: number | null
          name: string
          operating_hours: Json | null
          photos: string[] | null
          provider_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          capacity?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          geo?: unknown
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          operating_hours?: Json | null
          photos?: string[] | null
          provider_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          capacity?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          geo?: unknown
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          operating_hours?: Json | null
          photos?: string[] | null
          provider_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_locations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          bank_details: Json | null
          category: Database["public"]["Enums"]["provider_category"]
          contact_email: string | null
          created_at: string | null
          id: string
          name: string
          settlement_email: string | null
          status: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          bank_details?: Json | null
          category: Database["public"]["Enums"]["provider_category"]
          contact_email?: string | null
          created_at?: string | null
          id?: string
          name: string
          settlement_email?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_details?: Json | null
          category?: Database["public"]["Enums"]["provider_category"]
          contact_email?: string | null
          created_at?: string | null
          id?: string
          name?: string
          settlement_email?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      settlements: {
        Row: {
          created_at: string | null
          id: string
          paid_at: string | null
          payment_reference: string | null
          provider_id: string
          settlement_period_end: string
          settlement_period_start: string
          status: Database["public"]["Enums"]["settlement_status"]
          total_amount: number
          total_visits: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_reference?: string | null
          provider_id: string
          settlement_period_end: string
          settlement_period_start: string
          status?: Database["public"]["Enums"]["settlement_status"]
          total_amount?: number
          total_visits?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_reference?: string | null
          provider_id?: string
          settlement_period_end?: string
          settlement_period_start?: string
          status?: Database["public"]["Enums"]["settlement_status"]
          total_amount?: number
          total_visits?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlements_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          org_id: string | null
          provider_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id?: string | null
          provider_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string | null
          provider_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_disputes: {
        Row: {
          created_at: string | null
          id: string
          raised_by_role: Database["public"]["Enums"]["dispute_raised_by_role"]
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string | null
          visit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          raised_by_role: Database["public"]["Enums"]["dispute_raised_by_role"]
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string | null
          visit_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          raised_by_role?: Database["public"]["Enums"]["dispute_raised_by_role"]
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_disputes_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          check_in_at: string
          check_out_at: string | null
          created_at: string | null
          device_fingerprint: string | null
          employee_id: string
          geo_lat: number | null
          geo_lng: number | null
          id: string
          org_id: string
          provider_location_id: string
          status: Database["public"]["Enums"]["visit_status"]
          totp_token_hash: string | null
          updated_at: string | null
          verification_method: Database["public"]["Enums"]["visit_verification_method"]
        }
        Insert: {
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          employee_id: string
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          org_id: string
          provider_location_id: string
          status?: Database["public"]["Enums"]["visit_status"]
          totp_token_hash?: string | null
          updated_at?: string | null
          verification_method?: Database["public"]["Enums"]["visit_verification_method"]
        }
        Update: {
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          employee_id?: string
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          org_id?: string
          provider_location_id?: string
          status?: Database["public"]["Enums"]["visit_status"]
          totp_token_hash?: string | null
          updated_at?: string | null
          verification_method?: Database["public"]["Enums"]["visit_verification_method"]
        }
        Relationships: [
          {
            foreignKeyName: "visits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_provider_location_id_fkey"
            columns: ["provider_location_id"]
            isOneToOne: false
            referencedRelation: "provider_locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      check_anti_passback: {
        Args: {
          p_employee_id: string
          p_provider_location_id: string
          p_window_minutes?: number
        }
        Returns: {
          allowed: boolean
          cooldown_window_minutes: number
          last_visit_at: string | null
          minutes_remaining: number
        }[]
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      is_org_admin: { Args: { org_id: string }; Returns: boolean }
      is_provider_admin: { Args: { check_provider_id: string }; Returns: boolean }
      verify_geofence: {
        Args: {
          p_location_id: string
          p_max_radius?: number
          p_user_lat?: number
          p_user_lng?: number
        }
        Returns: {
          distance_meters: number | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          within_geofence: boolean
        }[]
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "polyfit_ops"
        | "org_admin"
        | "provider_admin"
        | "employee"
      contract_status: "draft" | "active" | "suspended" | "terminated"
      dispute_raised_by_role: "employee" | "provider" | "admin"
      dispute_status:
        | "open"
        | "investigating"
        | "resolved_approved"
        | "resolved_rejected"
      eligibility_status: "active" | "suspended" | "expired"
      employee_status: "active" | "frozen" | "terminated"
      invitation_status: "pending" | "accepted" | "revoked" | "expired"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "disputed"
      provider_category:
        | "gym"
        | "pool"
        | "studio"
        | "clinic"
        | "wellness_center"
      settlement_status: "pending" | "processing" | "paid" | "failed"
      visit_status: "verified" | "disputed" | "rejected" | "pending"
      visit_verification_method: "totp_qr" | "manual" | "nfc"
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]
