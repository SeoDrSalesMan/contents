import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { userId, email } = await request.json()

  // Create server-side Supabase client with service role key
  const supabaseServer = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabaseServer
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      return NextResponse.json({ success: true, message: 'Profile already exists' })
    }

    // Create new profile
    const { data: newProfile, error: insertError } = await supabaseServer
      .from('profiles')
      .insert([{
        id: userId,
        full_name: email?.split('@')[0] || 'Usuario',
        avatar_url: null
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Profile creation error:', insertError)
      return NextResponse.json(
        { error: 'Error creating profile', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: newProfile,
      message: 'Profile created successfully'
    })
  } catch (error) {
    console.error('Server error creating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
