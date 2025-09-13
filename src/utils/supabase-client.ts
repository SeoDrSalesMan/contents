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
      clients: {
        Row: {
          id: string
          nombre: string
          web?: string
          sector?: string
          propuesta_valor?: string
          publico_objetivo?: string
          keywords?: string
          numero_contenidos_blog: number
          frecuencia_mensual_blog?: string
          numero_contenidos_rrss: number
          frecuencia_mensual_rrss?: string
          porcentaje_educar: number
          porcentaje_inspirar: number
          porcentaje_entretener: number
          porcentaje_promocionar: number
          verticales_interes?: string
          audiencia_no_deseada?: string
          estilo_comunicacion?: string
          tono_voz?: string
          workflow_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nombre?: string
          web?: string
          sector?: string
          propuesta_valor?: string
          publico_objetivo?: string
          keywords?: string
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
          workflow_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          web?: string
          sector?: string
          propuesta_valor?: string
          publico_objetivo?: string
          keywords?: string
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
          workflow_id?: string
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
