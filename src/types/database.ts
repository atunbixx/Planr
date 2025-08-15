/**
 * Database type definitions for Supabase
 * Generated for Wedding Planner v2 schema
 */

export interface Database {
  public: {
    Tables: {
      // User-related tables
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      
      // Couple table (main entity)
      couple: {
        Row: {
          id: string
          partner1Name: string
          partner2Name: string | null
          weddingDate: string | null
          venueName: string | null
          venueLocation: string | null
          guestCountEstimate: number | null
          totalBudget: number | null
          currency: string | null
          weddingStyle: string | null
          onboardingCompleted: boolean | null
          userId: string | null
          partner1UserId: string | null
          partner2UserId: string | null
          createdAt: string | null
          updatedAt: string | null
        }
        Insert: {
          id?: string
          partner1Name: string
          partner2Name?: string | null
          weddingDate?: string | null
          venueName?: string | null
          venueLocation?: string | null
          guestCountEstimate?: number | null
          totalBudget?: number | null
          currency?: string | null
          weddingStyle?: string | null
          onboardingCompleted?: boolean | null
          userId?: string | null
          partner1UserId?: string | null
          partner2UserId?: string | null
          createdAt?: string | null
          updatedAt?: string | null
        }
        Update: {
          id?: string
          partner1Name?: string
          partner2Name?: string | null
          weddingDate?: string | null
          venueName?: string | null
          venueLocation?: string | null
          guestCountEstimate?: number | null
          totalBudget?: number | null
          currency?: string | null
          weddingStyle?: string | null
          onboardingCompleted?: boolean | null
          userId?: string | null
          partner1UserId?: string | null
          partner2UserId?: string | null
          createdAt?: string | null
          updatedAt?: string | null
        }
      }

      // Guest table
      guest: {
        Row: {
          id: string
          coupleId: string
          firstName: string
          lastName: string | null
          email: string | null
          phone: string | null
          rsvpStatus: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          coupleId: string
          firstName: string
          lastName?: string | null
          email?: string | null
          phone?: string | null
          rsvpStatus?: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          coupleId?: string
          firstName?: string
          lastName?: string | null
          email?: string | null
          phone?: string | null
          rsvpStatus?: string
          createdAt?: string
          updatedAt?: string
        }
      }

      // Vendor table
      vendor: {
        Row: {
          id: string
          coupleId: string
          name: string
          category: string
          email: string | null
          phone: string | null
          website: string | null
          status: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          coupleId: string
          name: string
          category: string
          email?: string | null
          phone?: string | null
          website?: string | null
          status?: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          coupleId?: string
          name?: string
          category?: string
          email?: string | null
          phone?: string | null
          website?: string | null
          status?: string
          createdAt?: string
          updatedAt?: string
        }
      }

      // Budget tables
      budgetCategory: {
        Row: {
          id: string
          coupleId: string
          name: string
          allocatedAmount: number
          icon: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          coupleId: string
          name: string
          allocatedAmount: number
          icon?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          coupleId?: string
          name?: string
          allocatedAmount?: number
          icon?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }

      budgetExpense: {
        Row: {
          id: string
          coupleId: string
          budgetCategoryId: string | null
          description: string
          amount: number
          date: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          coupleId: string
          budgetCategoryId?: string | null
          description: string
          amount: number
          date: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          coupleId?: string
          budgetCategoryId?: string | null
          description?: string
          amount?: number
          date?: string
          createdAt?: string
          updatedAt?: string
        }
      }

      // Other tables
      tasks: {
        Row: {
          id: string
          couple_id: string
          title: string
          completed: boolean
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          title: string
          completed?: boolean
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          couple_id?: string
          title?: string
          completed?: boolean
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      photo: {
        Row: {
          id: string
          coupleId: string
          imageUrl: string
          thumbnailUrl: string | null
          caption: string | null
          isFavorite: boolean
          photoAlbumId: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          coupleId: string
          imageUrl: string
          thumbnailUrl?: string | null
          caption?: string | null
          isFavorite?: boolean
          photoAlbumId?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          coupleId?: string
          imageUrl?: string
          thumbnailUrl?: string | null
          caption?: string | null
          isFavorite?: boolean
          photoAlbumId?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }

      photoAlbum: {
        Row: {
          id: string
          coupleId: string
          name: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          coupleId: string
          name: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          coupleId?: string
          name?: string
          createdAt?: string
          updatedAt?: string
        }
      }

      message: {
        Row: {
          id: string
          coupleId: string
          subject: string | null
          messageType: string
          status: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          coupleId: string
          subject?: string | null
          messageType: string
          status?: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          coupleId?: string
          subject?: string | null
          messageType?: string
          status?: string
          createdAt?: string
          updatedAt?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Export commonly used types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']