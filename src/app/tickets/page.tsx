// src/app/tickets/page.tsx
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import TicketSearch from '../components/TicketSearch';

export default async function TicketsPage() {
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

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/'); // Redirigir si no hay sesión
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: 'var(--color-text-primary)',
        marginBottom: '30px'
      }}>
        Gestión de Tickets
      </h1>
      <TicketSearch session={session} />
    </div>
  );
}