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

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const body: ClientInsert = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      )
    }

    const { data: client, error } = await supabaseServer
      .from('clients')
      .insert([{
        ...body,
        id: body.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(client, { status: 201 })

  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
