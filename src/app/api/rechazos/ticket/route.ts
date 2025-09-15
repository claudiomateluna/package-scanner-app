// src/app/api/rechazos/ticket/route.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError.message 
      }, { status: 500 });
    }
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
    }

    try {
      // Call the database function to generate next ticket ID
      const { data, error } = await supabase.rpc('get_next_ticket_id', { p_prefix: 'REC' });
      
      if (error) {
        console.error('Database error in get_next_ticket_id:', error);
        throw error;
      }
      
      return NextResponse.json({ ticketId: data });
    } catch (error) {
      console.error('Error generating ticket ID:', error);
      // Return more detailed error information
      if (error instanceof Error) {
        return NextResponse.json({ 
          error: 'Failed to generate ticket ID', 
          details: error.message,
          name: error.name
        }, { status: 500 });
      }
      return NextResponse.json({ error: 'Failed to generate ticket ID' }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in POST handler:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}