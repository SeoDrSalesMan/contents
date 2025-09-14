import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client (works in browser)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
        }
      }
      clients: {
        Row: {
          id: string
          // Keep both name and nombre for backward compatibility
          name: string
          nombre?: string
          created_by?: string  // Optional for existing data
          web?: string
          sector?: string
          propuesta_valor?: string
          publico_objetivo?: string
          keywords?: string | string[]  // Allow both string and string[] for compatibility
          numero_contenidos_blog?: number
          frecuencia_mensual_blog?: string
          numero_contenidos_rrss?: number
          frecuencia_mensual_rrss?: string
          porcentaje_educar?: number
          porcentaje_inspirar?: number
          porcentaje_entretener?: number
          porcentaje_promocionar?: number
          verticales_interes?: string
          audiencia_no_deseada?: string
          estilo_comunicacion?: string
          tono_voz?: string
          brief?: { [key: string]: any }
          created_at: string
          updated_at?: string
        }
        Insert: {
          id: string
          created_by?: string  // Optional for backward compatibility
          name?: string
          nombre?: string  // Keep for backward compatibility
          web?: string
          sector?: string
          propuesta_valor?: string
          publico_objetivo?: string
          keywords?: string | string[]
          numero_contenidos_blog?: number
          frecuencia_mensual_blog?: string
          numero_contenidos_rrss?: number
          frecuencia_mensual_rrss?: string
          porcentaje_educar?: number
          porcentaje_inspirar?: number
          porcentaje_entretener?: number
          porcentaje_promocionar?: number
          verticales_interes?: string
          audiencia_no_deseada?: string
          estilo_comunicacion?: string
          tono_voz?: string
          brief?: { [key: string]: any }
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          nombre?: string  // Add for backward compatibility
          web?: string
          sector?: string
          propuesta_valor?: string
          publico_objetivo?: string
          keywords?: string | string[]
          numero_contenidos_blog?: number
          frecuencia_mensual_blog?: string
          numero_contenidos_rrss?: number
          frecuencia_mensual_rrss?: string
          porcentaje_educar?: number
          porcentaje_inspirar?: number
          porcentaje_entretener?: number
          porcentaje_promocionar?: number
          verticales_interes?: string
          audiencia_no_deseada?: string
          estilo_comunicacion?: string
          tono_voz?: string
          brief?: { [key: string]: any }
          created_at?: string
          updated_at?: string
        }
      }
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
