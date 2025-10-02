import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get the user ID from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Query the profiles table to get user profile with password change requirement
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, first_name, last_name, email, must_change_password')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json({ error: 'Error fetching user profile' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error('Unexpected error in fetch-profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}