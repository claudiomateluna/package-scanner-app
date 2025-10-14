import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createSupabaseServerClient();

    // Query the profiles table to check if user must change password
    const { data, error } = await supabase
      .from('profiles')
      .select('must_change_password')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json({ error: 'Error checking password change requirement' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ mustChangePassword: data.must_change_password });
  } catch (error) {
    console.error('Unexpected error in check-password-change-requirement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}