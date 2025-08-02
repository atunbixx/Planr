export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          action_type: string
          couple_id: string
          created_at: string | null
          details: Json | null
          entity_id: string
          entity_name: string | null
          entity_type: string
          id: string
          is_read: boolean | null
          user_email: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          action_type: string
          couple_id: string
          created_at?: string | null
          details?: Json | null
          entity_id: string
          entity_name?: string | null
          entity_type: string
          id?: string
          is_read?: boolean | null
          user_email: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          action_type?: string
          couple_id?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          id?: string
          is_read?: boolean | null
          user_email?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_categories: {
        Row: {
          allocated_amount: number | null
          color: string | null
          couple_id: string
          created_at: string | null
          icon: string | null
          id: string
          industry_average_percentage: number | null
          market_trends: Json | null
          name: string
          percentage_of_total: number | null
          priority: string | null
          spent_amount: number | null
          updated_at: string | null
          vendor_insights: Json | null
        }
        Insert: {
          allocated_amount?: number | null
          color?: string | null
          couple_id: string
          created_at?: string | null
          icon?: string | null
          id?: string
          industry_average_percentage?: number | null
          market_trends?: Json | null
          name: string
          percentage_of_total?: number | null
          priority?: string | null
          spent_amount?: number | null
          updated_at?: string | null
          vendor_insights?: Json | null
        }
        Update: {
          allocated_amount?: number | null
          color?: string | null
          couple_id?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          industry_average_percentage?: number | null
          market_trends?: Json | null
          name?: string
          percentage_of_total?: number | null
          priority?: string | null
          spent_amount?: number | null
          updated_at?: string | null
          vendor_insights?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_expenses: {
        Row: {
          amount: number
          category_id: string
          couple_id: string
          created_at: string | null
          description: string
          due_date: string | null
          expense_type: string | null
          id: string
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          payment_status: string | null
          receipt_url: string | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          amount: number
          category_id: string
          couple_id: string
          created_at?: string | null
          description: string
          due_date?: string | null
          expense_type?: string | null
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          receipt_url?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          couple_id?: string
          created_at?: string | null
          description?: string
          due_date?: string | null
          expense_type?: string | null
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          receipt_url?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_expenses_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          allocated_amount: number
          category: string
          couple_id: string | null
          created_at: string | null
          id: string
          spent_amount: number | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          allocated_amount: number
          category: string
          couple_id?: string | null
          created_at?: string | null
          id?: string
          spent_amount?: number | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          allocated_amount?: number
          category?: string
          couple_id?: string | null
          created_at?: string | null
          id?: string
          spent_amount?: number | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          amount: number
          contract_url: string | null
          couple_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          signed_by: string | null
          signed_date: string | null
          status: string
          terms: string | null
          title: string
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          amount?: number
          contract_url?: string | null
          couple_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          signed_by?: string | null
          signed_date?: string | null
          status?: string
          terms?: string | null
          title: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          contract_url?: string | null
          couple_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          signed_by?: string | null
          signed_date?: string | null
          status?: string
          terms?: string | null
          title?: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "couple_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_collaborators: {
        Row: {
          accepted_at: string | null
          couple_id: string
          created_at: string | null
          email: string
          id: string
          invitation_token: string | null
          invited_at: string | null
          invited_by: string
          permissions: string[]
          role: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          couple_id: string
          created_at?: string | null
          email: string
          id?: string
          invitation_token?: string | null
          invited_at?: string | null
          invited_by: string
          permissions?: string[]
          role: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          couple_id?: string
          created_at?: string | null
          email?: string
          id?: string
          invitation_token?: string | null
          invited_at?: string | null
          invited_by?: string
          permissions?: string[]
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_collaborators_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_vendor_reviews: {
        Row: {
          cons: string[] | null
          content: string
          couple_id: string
          couple_vendor_id: string
          created_at: string | null
          event_date: string | null
          id: string
          pros: string[] | null
          rating: number
          title: string
          updated_at: string | null
          would_recommend: boolean | null
        }
        Insert: {
          cons?: string[] | null
          content: string
          couple_id: string
          couple_vendor_id: string
          created_at?: string | null
          event_date?: string | null
          id?: string
          pros?: string[] | null
          rating: number
          title: string
          updated_at?: string | null
          would_recommend?: boolean | null
        }
        Update: {
          cons?: string[] | null
          content?: string
          couple_id?: string
          couple_vendor_id?: string
          created_at?: string | null
          event_date?: string | null
          id?: string
          pros?: string[] | null
          rating?: number
          title?: string
          updated_at?: string | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_vendor_reviews_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_vendor_reviews_couple_vendor_id_fkey"
            columns: ["couple_vendor_id"]
            isOneToOne: false
            referencedRelation: "couple_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_vendor_tasks: {
        Row: {
          assigned_to: string | null
          completed: boolean | null
          completed_at: string | null
          couple_id: string
          couple_vendor_id: string
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          notes: string | null
          priority: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean | null
          completed_at?: string | null
          couple_id: string
          couple_vendor_id: string
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          notes?: string | null
          priority?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean | null
          completed_at?: string | null
          couple_id?: string
          couple_vendor_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          priority?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_vendor_tasks_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_vendor_tasks_couple_vendor_id_fkey"
            columns: ["couple_vendor_id"]
            isOneToOne: false
            referencedRelation: "couple_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_vendors: {
        Row: {
          actual_cost: number | null
          address: string | null
          availability_confirmed: boolean | null
          budget_allocated: number | null
          budget_spent: number | null
          business_name: string | null
          cancellation_policy: string | null
          category: string
          city: string | null
          contact_person: string | null
          contract_signed: boolean | null
          contract_terms: string | null
          contract_url: string | null
          country: string | null
          couple_id: string
          created_at: string | null
          deposit_amount: number | null
          deposit_due_date: string | null
          deposit_paid: boolean | null
          email: string | null
          estimated_cost: number | null
          final_payment_due: string | null
          id: string
          insurance_verified: boolean | null
          license_verified: boolean | null
          meeting_date: string | null
          meeting_notes: string | null
          name: string
          notes: string | null
          payment_schedule: Json | null
          phone: string | null
          portfolio_urls: string[] | null
          price_range: string | null
          proposal_details: string | null
          rating: number | null
          referral_source: string | null
          services_provided: string[] | null
          social_media_handles: Json | null
          specialty: string | null
          state: string | null
          status: string
          updated_at: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          actual_cost?: number | null
          address?: string | null
          availability_confirmed?: boolean | null
          budget_allocated?: number | null
          budget_spent?: number | null
          business_name?: string | null
          cancellation_policy?: string | null
          category?: string
          city?: string | null
          contact_person?: string | null
          contract_signed?: boolean | null
          contract_terms?: string | null
          contract_url?: string | null
          country?: string | null
          couple_id: string
          created_at?: string | null
          deposit_amount?: number | null
          deposit_due_date?: string | null
          deposit_paid?: boolean | null
          email?: string | null
          estimated_cost?: number | null
          final_payment_due?: string | null
          id?: string
          insurance_verified?: boolean | null
          license_verified?: boolean | null
          meeting_date?: string | null
          meeting_notes?: string | null
          name: string
          notes?: string | null
          payment_schedule?: Json | null
          phone?: string | null
          portfolio_urls?: string[] | null
          price_range?: string | null
          proposal_details?: string | null
          rating?: number | null
          referral_source?: string | null
          services_provided?: string[] | null
          social_media_handles?: Json | null
          specialty?: string | null
          state?: string | null
          status?: string
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          actual_cost?: number | null
          address?: string | null
          availability_confirmed?: boolean | null
          budget_allocated?: number | null
          budget_spent?: number | null
          business_name?: string | null
          cancellation_policy?: string | null
          category?: string
          city?: string | null
          contact_person?: string | null
          contract_signed?: boolean | null
          contract_terms?: string | null
          contract_url?: string | null
          country?: string | null
          couple_id?: string
          created_at?: string | null
          deposit_amount?: number | null
          deposit_due_date?: string | null
          deposit_paid?: boolean | null
          email?: string | null
          estimated_cost?: number | null
          final_payment_due?: string | null
          id?: string
          insurance_verified?: boolean | null
          license_verified?: boolean | null
          meeting_date?: string | null
          meeting_notes?: string | null
          name?: string
          notes?: string | null
          payment_schedule?: Json | null
          phone?: string | null
          portfolio_urls?: string[] | null
          price_range?: string | null
          proposal_details?: string | null
          rating?: number | null
          referral_source?: string | null
          services_provided?: string[] | null
          social_media_handles?: Json | null
          specialty?: string | null
          state?: string | null
          status?: string
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_vendors_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          country: string | null
          created_at: string | null
          currency: string | null
          date_format: string | null
          estimated_guests: number | null
          has_venue: boolean | null
          id: string
          language: string | null
          number_format: string | null
          onboarding_completed: boolean | null
          partner1_email: string | null
          partner1_name: string
          partner1_user_id: string | null
          partner2_email: string | null
          partner2_name: string
          partner2_user_id: string | null
          planning_style: string | null
          priorities: string[] | null
          region: string | null
          time_format: string | null
          timezone: string | null
          total_budget: number | null
          updated_at: string | null
          venue: string | null
          wedding_date: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          estimated_guests?: number | null
          has_venue?: boolean | null
          id?: string
          language?: string | null
          number_format?: string | null
          onboarding_completed?: boolean | null
          partner1_email?: string | null
          partner1_name: string
          partner1_user_id?: string | null
          partner2_email?: string | null
          partner2_name: string
          partner2_user_id?: string | null
          planning_style?: string | null
          priorities?: string[] | null
          region?: string | null
          time_format?: string | null
          timezone?: string | null
          total_budget?: number | null
          updated_at?: string | null
          venue?: string | null
          wedding_date?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          estimated_guests?: number | null
          has_venue?: boolean | null
          id?: string
          language?: string | null
          number_format?: string | null
          onboarding_completed?: boolean | null
          partner1_email?: string | null
          partner1_name?: string
          partner1_user_id?: string | null
          partner2_email?: string | null
          partner2_name?: string
          partner2_user_id?: string | null
          planning_style?: string | null
          priorities?: string[] | null
          region?: string | null
          time_format?: string | null
          timezone?: string | null
          total_budget?: number | null
          updated_at?: string | null
          venue?: string | null
          wedding_date?: string | null
        }
        Relationships: []
      }
      deadline_alerts: {
        Row: {
          action_url: string
          alert_type: string
          couple_id: string
          created_at: string | null
          days_until_deadline: number
          description: string
          entity_id: string
          entity_name: string
          entity_type: string
          id: string
          resolved: boolean
          severity: string
          target_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          action_url: string
          alert_type: string
          couple_id: string
          created_at?: string | null
          days_until_deadline?: number
          description: string
          entity_id: string
          entity_name: string
          entity_type: string
          id?: string
          resolved?: boolean
          severity: string
          target_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          action_url?: string
          alert_type?: string
          couple_id?: string
          created_at?: string | null
          days_until_deadline?: number
          description?: string
          entity_id?: string
          entity_name?: string
          entity_type?: string
          id?: string
          resolved?: boolean
          severity?: string
          target_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deadline_alerts_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          base_currency: string
          id: string
          last_updated: string | null
          rate: number
          target_currency: string
        }
        Insert: {
          base_currency: string
          id?: string
          last_updated?: string | null
          rate: number
          target_currency: string
        }
        Update: {
          base_currency?: string
          id?: string
          last_updated?: string | null
          rate?: number
          target_currency?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          budget_item_id: string | null
          couple_id: string | null
          created_at: string | null
          description: string
          expense_date: string
          id: string
          notes: string | null
          payment_method: string | null
          receipt_url: string | null
          vendor_id: string | null
        }
        Insert: {
          amount: number
          budget_item_id?: string | null
          couple_id?: string | null
          created_at?: string | null
          description: string
          expense_date: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          budget_item_id?: string | null
          couple_id?: string | null
          created_at?: string | null
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_budget_item_id_fkey"
            columns: ["budget_item_id"]
            isOneToOne: false
            referencedRelation: "budget_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_groups: {
        Row: {
          color: string | null
          couple_id: string
          created_at: string | null
          description: string | null
          guest_ids: string[] | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          couple_id: string
          created_at?: string | null
          description?: string | null
          guest_ids?: string[] | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          couple_id?: string
          created_at?: string | null
          description?: string | null
          guest_ids?: string[] | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_groups_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          accommodation_details: string | null
          accommodation_needed: boolean | null
          address: string | null
          category: string | null
          city: string | null
          country: string | null
          couple_id: string | null
          created_at: string | null
          dietary_restrictions: string | null
          email: string | null
          first_name: string
          guest_count: number | null
          id: string
          invitation_status: string | null
          last_name: string
          name: string
          notes: string | null
          phone: string | null
          plus_one_invited: boolean | null
          plus_one_name: string | null
          plus_one_rsvp: string | null
          relationship: string
          rsvp_date: string | null
          rsvp_status: string | null
          side: string | null
          state: string | null
          table_assignment: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          accommodation_details?: string | null
          accommodation_needed?: boolean | null
          address?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          couple_id?: string | null
          created_at?: string | null
          dietary_restrictions?: string | null
          email?: string | null
          first_name?: string
          guest_count?: number | null
          id?: string
          invitation_status?: string | null
          last_name?: string
          name: string
          notes?: string | null
          phone?: string | null
          plus_one_invited?: boolean | null
          plus_one_name?: string | null
          plus_one_rsvp?: string | null
          relationship?: string
          rsvp_date?: string | null
          rsvp_status?: string | null
          side?: string | null
          state?: string | null
          table_assignment?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          accommodation_details?: string | null
          accommodation_needed?: boolean | null
          address?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          couple_id?: string | null
          created_at?: string | null
          dietary_restrictions?: string | null
          email?: string | null
          first_name?: string
          guest_count?: number | null
          id?: string
          invitation_status?: string | null
          last_name?: string
          name?: string
          notes?: string | null
          phone?: string | null
          plus_one_invited?: boolean | null
          plus_one_name?: string | null
          plus_one_rsvp?: string | null
          relationship?: string
          rsvp_date?: string | null
          rsvp_status?: string | null
          side?: string | null
          state?: string | null
          table_assignment?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      inspiration_photos: {
        Row: {
          couple_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_favorite: boolean | null
          notes: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          couple_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean | null
          notes?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          couple_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean | null
          notes?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspiration_photos_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          content: string
          couple_id: string
          created_at: string | null
          id: string
          message_type: string
          metadata: Json | null
          parent_message_id: string | null
          read_at: string | null
          recipient_email: string | null
          recipient_id: string | null
          recipient_name: string | null
          sender_email: string
          sender_id: string
          sender_name: string
          sent_at: string
          status: string
          subject: string
          thread_id: string | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          attachments?: string[] | null
          content: string
          couple_id: string
          created_at?: string | null
          id?: string
          message_type?: string
          metadata?: Json | null
          parent_message_id?: string | null
          read_at?: string | null
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          sender_email: string
          sender_id: string
          sender_name: string
          sent_at: string
          status?: string
          subject: string
          thread_id?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          attachments?: string[] | null
          content?: string
          couple_id?: string
          created_at?: string | null
          id?: string
          message_type?: string
          metadata?: Json | null
          parent_message_id?: string | null
          read_at?: string | null
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          sender_email?: string
          sender_id?: string
          sender_name?: string
          sent_at?: string
          status?: string
          subject?: string
          thread_id?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "couple_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          color: string | null
          completed: boolean | null
          completed_at: string | null
          couple_id: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          target_date: string
          task_ids: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          completed?: boolean | null
          completed_at?: string | null
          couple_id: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          target_date: string
          task_ids?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          completed?: boolean | null
          completed_at?: string | null
          couple_id?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          target_date?: string
          task_ids?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          couple_id: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
        }
        Insert: {
          action_url?: string | null
          couple_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
        }
        Update: {
          action_url?: string | null
          couple_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          couple_id: string
          created_at: string | null
          data: Json | null
          id: string
          step: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          couple_id: string
          created_at?: string | null
          data?: Json | null
          id?: string
          step: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          couple_id?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          step?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          caption: string | null
          couple_id: string | null
          created_at: string | null
          id: string
          image_url: string
          location: string | null
          photo_date: string | null
          photographer: string | null
          tags: string[] | null
          title: string | null
        }
        Insert: {
          caption?: string | null
          couple_id?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          location?: string | null
          photo_date?: string | null
          photographer?: string | null
          tags?: string[] | null
          title?: string | null
        }
        Update: {
          caption?: string | null
          couple_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          location?: string | null
          photo_date?: string | null
          photographer?: string | null
          tags?: string[] | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number
          category: string | null
          couple_id: string
          created_at: string | null
          description: string | null
          expense_id: string | null
          id: string
          notes: string | null
          payment_method: string | null
          receipt_date: string
          receipt_url: string | null
          tax_amount: number | null
          title: string
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          amount?: number
          category?: string | null
          couple_id: string
          created_at?: string | null
          description?: string | null
          expense_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_date: string
          receipt_url?: string | null
          tax_amount?: number | null
          title: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          couple_id?: string
          created_at?: string | null
          description?: string | null
          expense_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_date?: string
          receipt_url?: string | null
          tax_amount?: number | null
          title?: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "budget_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "couple_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          capacity: number
          couple_id: string
          created_at: string | null
          guest_ids: string[] | null
          id: string
          name: string | null
          notes: string | null
          number: number
          shape: string | null
          updated_at: string | null
          x_position: number | null
          y_position: number | null
        }
        Insert: {
          capacity?: number
          couple_id: string
          created_at?: string | null
          guest_ids?: string[] | null
          id?: string
          name?: string | null
          notes?: string | null
          number: number
          shape?: string | null
          updated_at?: string | null
          x_position?: number | null
          y_position?: number | null
        }
        Update: {
          capacity?: number
          couple_id?: string
          created_at?: string | null
          guest_ids?: string[] | null
          id?: string
          name?: string | null
          notes?: string | null
          number?: number
          shape?: string | null
          updated_at?: string | null
          x_position?: number | null
          y_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tables_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_duration: number | null
          actual_duration_minutes: number | null
          assigned_to: string | null
          attachments: Json | null
          buffer_time_minutes: number | null
          category: string | null
          completed: boolean | null
          completed_at: string | null
          cost: number | null
          couple_id: string | null
          created_at: string | null
          dependencies: string[] | null
          description: string | null
          due_date: string | null
          estimated_duration: number | null
          estimated_duration_minutes: number | null
          icon: string | null
          id: string
          is_critical_path: boolean | null
          notes: string | null
          priority: string | null
          timeline_item_id: string | null
          title: string
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          actual_duration?: number | null
          actual_duration_minutes?: number | null
          assigned_to?: string | null
          attachments?: Json | null
          buffer_time_minutes?: number | null
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          cost?: number | null
          couple_id?: string | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_duration?: number | null
          estimated_duration_minutes?: number | null
          icon?: string | null
          id?: string
          is_critical_path?: boolean | null
          notes?: string | null
          priority?: string | null
          timeline_item_id?: string | null
          title: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          actual_duration?: number | null
          actual_duration_minutes?: number | null
          assigned_to?: string | null
          attachments?: Json | null
          buffer_time_minutes?: number | null
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          cost?: number | null
          couple_id?: string | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_duration?: number | null
          estimated_duration_minutes?: number | null
          icon?: string | null
          id?: string
          is_critical_path?: boolean | null
          notes?: string | null
          priority?: string | null
          timeline_item_id?: string | null
          title?: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_timeline_item_id_fkey"
            columns: ["timeline_item_id"]
            isOneToOne: false
            referencedRelation: "timeline_items"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          couple_id: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string | null
          id: string
          location: string | null
          notes: string | null
          start_time: string | null
          title: string
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          couple_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          start_time?: string | null
          title: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          couple_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_items: {
        Row: {
          assigned_to: string[] | null
          assigned_to_legacy: string | null
          assignee_type: string | null
          buffer_minutes: number | null
          category: string
          color: string | null
          completed: boolean | null
          completed_at: string | null
          completion_percentage: number | null
          couple_id: string
          created_at: string | null
          created_by: string | null
          dependencies: string[] | null
          description: string | null
          display_order: number | null
          due_date: string | null
          duration: number | null
          duration_minutes: number | null
          end_time: string
          estimated_cost: number | null
          id: string
          is_critical_path: boolean | null
          is_private: boolean | null
          location: string | null
          notes: string | null
          priority: string | null
          start_time: string
          status: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
          vendor_id: string | null
          vendor_ids: string[] | null
        }
        Insert: {
          assigned_to?: string[] | null
          assigned_to_legacy?: string | null
          assignee_type?: string | null
          buffer_minutes?: number | null
          category?: string
          color?: string | null
          completed?: boolean | null
          completed_at?: string | null
          completion_percentage?: number | null
          couple_id: string
          created_at?: string | null
          created_by?: string | null
          dependencies?: string[] | null
          description?: string | null
          display_order?: number | null
          due_date?: string | null
          duration?: number | null
          duration_minutes?: number | null
          end_time: string
          estimated_cost?: number | null
          id?: string
          is_critical_path?: boolean | null
          is_private?: boolean | null
          location?: string | null
          notes?: string | null
          priority?: string | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          vendor_id?: string | null
          vendor_ids?: string[] | null
        }
        Update: {
          assigned_to?: string[] | null
          assigned_to_legacy?: string | null
          assignee_type?: string | null
          buffer_minutes?: number | null
          category?: string
          color?: string | null
          completed?: boolean | null
          completed_at?: string | null
          completion_percentage?: number | null
          couple_id?: string
          created_at?: string | null
          created_by?: string | null
          dependencies?: string[] | null
          description?: string | null
          display_order?: number | null
          due_date?: string | null
          duration?: number | null
          duration_minutes?: number | null
          end_time?: string
          estimated_cost?: number | null
          id?: string
          is_critical_path?: boolean | null
          is_private?: boolean | null
          location?: string | null
          notes?: string | null
          priority?: string | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          vendor_id?: string | null
          vendor_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_items_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_tasks: {
        Row: {
          assigned_to: string | null
          category: string
          completed: boolean | null
          completed_at: string | null
          couple_id: string
          created_at: string | null
          description: string | null
          due_date: string
          estimated_cost: number | null
          id: string
          notes: string | null
          priority: string
          title: string
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          completed?: boolean | null
          completed_at?: string | null
          couple_id: string
          created_at?: string | null
          description?: string | null
          due_date: string
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          priority?: string
          title: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          completed?: boolean | null
          completed_at?: string | null
          couple_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          priority?: string
          title?: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_tasks_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      urgent_tasks: {
        Row: {
          action_required: string
          completed: boolean
          couple_id: string
          created_at: string | null
          days_remaining: number
          description: string
          due_date: string
          escalated: boolean
          id: string
          priority_score: number
          reminder_sent: boolean
          task_id: string | null
          task_type: string
          title: string
          updated_at: string | null
          urgency_level: string
        }
        Insert: {
          action_required: string
          completed?: boolean
          couple_id: string
          created_at?: string | null
          days_remaining?: number
          description: string
          due_date: string
          escalated?: boolean
          id?: string
          priority_score?: number
          reminder_sent?: boolean
          task_id?: string | null
          task_type: string
          title: string
          updated_at?: string | null
          urgency_level: string
        }
        Update: {
          action_required?: string
          completed?: boolean
          couple_id?: string
          created_at?: string | null
          days_remaining?: number
          description?: string
          due_date?: string
          escalated?: boolean
          id?: string
          priority_score?: number
          reminder_sent?: boolean
          task_id?: string | null
          task_type?: string
          title?: string
          updated_at?: string | null
          urgency_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "urgent_tasks_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "urgent_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          couple_id: string
          created_at: string | null
          id: string
          preference_key: string
          preference_type: string
          preference_value: Json
          updated_at: string | null
        }
        Insert: {
          couple_id: string
          created_at?: string | null
          id?: string
          preference_key: string
          preference_type: string
          preference_value: Json
          updated_at?: string | null
        }
        Update: {
          couple_id?: string
          created_at?: string | null
          id?: string
          preference_key?: string
          preference_type?: string
          preference_value?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_favorites: {
        Row: {
          couple_id: string
          created_at: string | null
          id: string
          notes: string | null
          vendor_id: string
        }
        Insert: {
          couple_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          vendor_id: string
        }
        Update: {
          couple_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_favorites_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_inquiries: {
        Row: {
          budget_range: string | null
          couple_id: string
          created_at: string | null
          event_date: string | null
          event_type: string | null
          guest_count: number | null
          id: string
          inquiry_type: string
          message: string
          quote_details: string | null
          quoted_at: string | null
          quoted_price: number | null
          responded_at: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
          vendor_id: string
          vendor_response: string | null
          venue_location: string | null
          venue_name: string | null
          viewed_at: string | null
        }
        Insert: {
          budget_range?: string | null
          couple_id: string
          created_at?: string | null
          event_date?: string | null
          event_type?: string | null
          guest_count?: number | null
          id?: string
          inquiry_type?: string
          message: string
          quote_details?: string | null
          quoted_at?: string | null
          quoted_price?: number | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          vendor_id: string
          vendor_response?: string | null
          venue_location?: string | null
          venue_name?: string | null
          viewed_at?: string | null
        }
        Update: {
          budget_range?: string | null
          couple_id?: string
          created_at?: string | null
          event_date?: string | null
          event_type?: string | null
          guest_count?: number | null
          id?: string
          inquiry_type?: string
          message?: string
          quote_details?: string | null
          quoted_at?: string | null
          quoted_price?: number | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          vendor_id?: string
          vendor_response?: string | null
          venue_location?: string | null
          venue_name?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_inquiries_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_reviews: {
        Row: {
          communication_rating: number | null
          cons: string | null
          couple_id: string
          created_at: string | null
          event_date: string | null
          event_type: string | null
          guest_count: number | null
          helpful_votes: number | null
          id: string
          is_featured: boolean | null
          is_verified: boolean | null
          overall_rating: number
          photos: string[] | null
          professionalism_rating: number | null
          pros: string | null
          quality_rating: number | null
          review_text: string | null
          reviewer_name: string | null
          title: string | null
          total_cost: number | null
          updated_at: string | null
          value_rating: number | null
          vendor_id: string
        }
        Insert: {
          communication_rating?: number | null
          cons?: string | null
          couple_id: string
          created_at?: string | null
          event_date?: string | null
          event_type?: string | null
          guest_count?: number | null
          helpful_votes?: number | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          overall_rating: number
          photos?: string[] | null
          professionalism_rating?: number | null
          pros?: string | null
          quality_rating?: number | null
          review_text?: string | null
          reviewer_name?: string | null
          title?: string | null
          total_cost?: number | null
          updated_at?: string | null
          value_rating?: number | null
          vendor_id: string
        }
        Update: {
          communication_rating?: number | null
          cons?: string | null
          couple_id?: string
          created_at?: string | null
          event_date?: string | null
          event_type?: string | null
          guest_count?: number | null
          helpful_votes?: number | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          overall_rating?: number
          photos?: string[] | null
          professionalism_rating?: number | null
          pros?: string | null
          quality_rating?: number | null
          review_text?: string | null
          reviewer_name?: string | null
          title?: string | null
          total_cost?: number | null
          updated_at?: string | null
          value_rating?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_reviews_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_tasks: {
        Row: {
          assigned_to: string | null
          completed: boolean | null
          completed_at: string | null
          couple_id: string
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          notes: string | null
          priority: string | null
          title: string
          type: string | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean | null
          completed_at?: string | null
          couple_id: string
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          notes?: string | null
          priority?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean | null
          completed_at?: string | null
          couple_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          priority?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_tasks_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          actual_cost: number | null
          address: string | null
          availability_confirmed: boolean | null
          business_name: string | null
          cancellation_policy: string | null
          category: string
          city: string | null
          contact_person: string | null
          contract_signed: boolean | null
          contract_terms: string | null
          contract_url: string | null
          country: string | null
          couple_id: string
          created_at: string | null
          deposit_amount: number | null
          deposit_due_date: string | null
          deposit_paid: boolean | null
          email: string | null
          estimated_cost: number | null
          final_payment_due: string | null
          id: string
          insurance_verified: boolean | null
          license_verified: boolean | null
          meeting_date: string | null
          meeting_notes: string | null
          name: string
          notes: string | null
          payment_schedule: Json | null
          phone: string | null
          portfolio_urls: string[] | null
          price_range: string | null
          proposal_details: string | null
          rating: number | null
          referral_source: string | null
          services_provided: string[] | null
          social_media_handles: Json | null
          specialty: string | null
          state: string | null
          status: string
          updated_at: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          actual_cost?: number | null
          address?: string | null
          availability_confirmed?: boolean | null
          business_name?: string | null
          cancellation_policy?: string | null
          category: string
          city?: string | null
          contact_person?: string | null
          contract_signed?: boolean | null
          contract_terms?: string | null
          contract_url?: string | null
          country?: string | null
          couple_id: string
          created_at?: string | null
          deposit_amount?: number | null
          deposit_due_date?: string | null
          deposit_paid?: boolean | null
          email?: string | null
          estimated_cost?: number | null
          final_payment_due?: string | null
          id?: string
          insurance_verified?: boolean | null
          license_verified?: boolean | null
          meeting_date?: string | null
          meeting_notes?: string | null
          name: string
          notes?: string | null
          payment_schedule?: Json | null
          phone?: string | null
          portfolio_urls?: string[] | null
          price_range?: string | null
          proposal_details?: string | null
          rating?: number | null
          referral_source?: string | null
          services_provided?: string[] | null
          social_media_handles?: Json | null
          specialty?: string | null
          state?: string | null
          status?: string
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          actual_cost?: number | null
          address?: string | null
          availability_confirmed?: boolean | null
          business_name?: string | null
          cancellation_policy?: string | null
          category?: string
          city?: string | null
          contact_person?: string | null
          contract_signed?: boolean | null
          contract_terms?: string | null
          contract_url?: string | null
          country?: string | null
          couple_id?: string
          created_at?: string | null
          deposit_amount?: number | null
          deposit_due_date?: string | null
          deposit_paid?: boolean | null
          email?: string | null
          estimated_cost?: number | null
          final_payment_due?: string | null
          id?: string
          insurance_verified?: boolean | null
          license_verified?: boolean | null
          meeting_date?: string | null
          meeting_notes?: string | null
          name?: string
          notes?: string | null
          payment_schedule?: Json | null
          phone?: string | null
          portfolio_urls?: string[] | null
          price_range?: string | null
          proposal_details?: string | null
          rating?: number | null
          referral_source?: string | null
          services_provided?: string[] | null
          social_media_handles?: Json | null
          specialty?: string | null
          state?: string | null
          status?: string
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_collaboration_invitation: {
        Args: { p_invitation_token: string }
        Returns: Json
      }
      auto_schedule_timeline: {
        Args: { input_couple_id: string; base_date?: string }
        Returns: undefined
      }
      calculate_critical_path: {
        Args: { input_couple_id: string }
        Returns: {
          item_id: string
          is_critical: boolean
          earliest_start: string
          latest_start: string
        }[]
      }
      check_collaboration_permission: {
        Args: {
          p_couple_id: string
          p_user_id: string
          p_required_permission: string
        }
        Returns: boolean
      }
      create_default_budget_categories: {
        Args: { p_couple_id: string }
        Returns: undefined
      }
      create_default_budget_categories_safe: {
        Args: { p_couple_id: string }
        Returns: undefined
      }
      get_exchange_rate: {
        Args: { from_currency: string; to_currency: string }
        Returns: number
      }
      initialize_default_timeline_data: {
        Args: { p_couple_id: string; p_wedding_date?: string }
        Returns: boolean
      }
      initialize_vendor_categories: {
        Args: { p_couple_id: string }
        Returns: undefined
      }
      is_couple_member: {
        Args: { couple_id: string }
        Returns: boolean
      }
      log_activity: {
        Args: {
          p_couple_id: string
          p_user_id: string
          p_action_type: string
          p_entity_type: string
          p_entity_id: string
          p_entity_name?: string
          p_details?: Json
        }
        Returns: string
      }
      update_couple_preferences: {
        Args: {
          p_couple_id: string
          p_country?: string
          p_language?: string
          p_currency?: string
          p_date_format?: string
          p_time_format?: string
          p_timezone?: string
          p_number_format?: string
        }
        Returns: boolean
      }
      update_exchange_rates_from_api: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      user_has_couple_access: {
        Args: { check_couple_id: string }
        Returns: boolean
      }
      verify_rls_fix: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          status: string
        }[]
      }
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
