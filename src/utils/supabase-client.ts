import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client (works in browser)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Types for better TypeScript support
export type Database = {
  // Define your database schema here
  // This will be populated based on your actual Supabase schema
  public: {
    Tables: {
      // Example table definitions - replace with your actual schema
      clients: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Add other tables as needed
    }
    Views: {
      // Define views if any
    }
    Functions: {
      // Define stored procedures/functions if any
    }
    Enums: {
      // Define enums if any
    }
  }
}
