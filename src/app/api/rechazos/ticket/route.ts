// src/app/api/rechazos/ticket/route.ts
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie setting errors
            console.log('Error setting cookie:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch (error) {
            // Handle cookie removal errors
            console.log('Error removing cookie:', error);
          }
        },
      },
    }
  );

  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Call the database function to generate next ticket ID
    const { data, error } = await supabase.rpc('get_next_rechazos_ticket_id');
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ ticketId: data });
  } catch (error) {
    console.error('Error generating ticket ID:', error);
    return NextResponse.json({ error: 'Failed to generate ticket ID' }, { status: 500 });
  }
}