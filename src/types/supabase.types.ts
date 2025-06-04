export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          role?: string
          // Add other user fields as needed
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          role?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          role?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          amount: number
          status: 'pending' | 'paid' | 'overdue'
          due_date: string
          created_at: string
          // Add other invoice fields as needed
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          status?: 'pending' | 'paid' | 'overdue'
          due_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          status?: 'pending' | 'paid' | 'overdue'
          due_date?: string
          created_at?: string
        }
      }
      // Add more tables as needed
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

// This makes the file a module
export {};
