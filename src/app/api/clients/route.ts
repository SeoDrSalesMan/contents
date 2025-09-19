import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/utils/supabase-server'
import { Database } from '@/utils/supabase-client'

type ClientRow = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']

// GET /api/clients - Fetch all clients
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: clients, error, count } = await supabaseServer
      .from('clients')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: clients,
      count,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < (count || 0)
      }
    })

  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/clients - Update client data
export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json()

    // Validate required fields
    if (!body.clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      )
    }

    // Extract client data from body, excluding clientId which should be mapped to name
    const clientData = {
      // Map clientId to name for Supabase
      name: body.nombre || body.clientId, // Use nombre first, then fallback to clientId
      web: body.web || '',
      sector: body.sector || '',
      propuesta_valor: body.propuesta_valor || '',
      publico_objetivo: body.publico_objetivo || '',
      // Convert keywords to array if it's a string
      keywords: Array.isArray(body.keywords)
        ? body.keywords
        : (body.keywords ? body.keywords.split(',').map((k: string) => k.trim()) : []),
      numero_contenidos_blog: body.numero_contenidos_blog || 0,
      frecuencia_mensual_blog: body.frecuencia_mensual_blog || '',
      numero_contenidos_rrss: body.numero_contenidos_rrss || 0,
      frecuencia_mensual_rrss: body.frecuencia_mensual_rrss || '',
      porcentaje_educar: body.porcentaje_educar || 0,
      porcentaje_inspirar: body.porcentaje_inspirar || 0,
      porcentaje_entretener: body.porcentaje_entretener || 0,
      porcentaje_promocionar: body.porcentaje_promocionar || 0,
      verticales_interes: body.verticales_interes || '',
      audiencia_no_deseada: body.audiencia_no_deseada || '',
      estilo_comunicacion: body.estilo_comunicacion || '',
      tono_voz: body.tono_voz || '',
      updated_at: new Date().toISOString()
    };

    console.log('📝 Attempting to save client:', { clientId: body.clientId, data: clientData });

    // Check if client already exists
    console.log('🔍 Checking if client exists...');
    const { data: existingClient, error: fetchError } = await supabaseServer
      .from('clients')
      .select('*')
      .eq('name', clientData.name)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('❌ Error checking for existing client:', fetchError);
      return NextResponse.json({ error: 'Error checking for existing client' }, { status: 500 });
    }

    if (existingClient) {
      // Update existing client
      console.log('📝 Client exists, updating existing record...');
      const { data, error } = await supabaseServer
        .from('clients')
        .update({
          ...clientData,
          updated_at: new Date().toISOString()
        })
        .eq('name', clientData.name)
        .select()
        .single();

      if (error) {
        console.error('❌ Update failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('✅ Client updated successfully');
      return NextResponse.json({ success: true, data, operation: 'update' }, { status: 200 });
    } else {
      // Insert new client
      console.log('🚀 Client does not exist, creating new record...');
      const { data, error } = await supabaseServer
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (error) {
        console.error('❌ Insert failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('✅ Client created successfully');
      return NextResponse.json({ success: true, data, operation: 'insert' }, { status: 201 });
    }

    // This code is unreachable and should be removed

  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
