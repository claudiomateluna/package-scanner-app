'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import ScannerView from './components/ScannerView'
import SelectionScreen from './components/SelectionScreen'
import AppLayout from './components/AppLayout'
import CustomLogin from './components/CustomLogin'
import FaltantesAdminView from './components/FaltantesAdminView'

// Definimos los tipos de datos que usaremos en este componente padre
type Profile = { role: string | null; first_name?: string | null; last_name?: string | null; }
type Selection = { local: string; fecha: string; }

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'scanner' | 'admin' | 'faltantes'>('scanner'); // Estado para la vista

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        try {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('role, first_name, last_name')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error('Error fetching profile:', error);
            setProfile(null);
          } else {
            setProfile(profileData);
          }
        } catch (err) {
          console.error('Unexpected error fetching profile:', err);
          setProfile(null);
        }
      } else {
        setProfile(null);
        setSelection(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSelectionComplete = (newSelection: Selection) => {
    setSelection(newSelection)
  }

  const handleBackToSelection = () => {
    setSelection(null)
    setCurrentView('scanner'); // Resetea la vista al volver a la selección
  }

  if (loading) {
    return <div style={{textAlign: 'center', paddingTop: '40px'}}>Cargando sesión...</div>
  }

  if (!session || !profile) {
    // Usar el componente de login personalizado
    return <CustomLogin onLoginSuccess={() => {}} />
  }

  // A partir de aquí, todo se renderiza dentro del AppLayout
  return (
    <AppLayout 
      session={session} 
      profile={profile} 
      onBack={selection ? handleBackToSelection : undefined}
      currentView={currentView}
      setCurrentView={setCurrentView}
    >
      {currentView === 'faltantes' ? (
        <FaltantesAdminView session={session} profile={profile} />
      ) : !selection && currentView === 'scanner' ? (
        <SelectionScreen profile={profile} onSelectionComplete={handleSelectionComplete} session={session} />
      ) : (
        <ScannerView 
          session={session} 
          profile={profile} 
          selection={selection || { local: '', fecha: '' }} 
          currentView={currentView} 
        />
      )}
    </AppLayout>
  )
}