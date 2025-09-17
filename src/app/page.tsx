'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import ScannerView from './components/ScannerView'
import SelectionScreenWithLocales from './components/SelectionScreenWithLocales'
import AppLayout, { View as AppView } from './components/AppLayout'
import MinimalLogin from './components/MinimalLogin'
import FaltantesAdminView from './components/FaltantesAdminView'
import RechazosView from './components/RechazosView'
import RechazoFormView from './components/RechazoFormView'

// Definimos los tipos de datos que usaremos en este componente padre
type Profile = { role: string | null; first_name?: string | null; last_name?: string | null; }
type Selection = { local: string; fecha: string; }

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<AppView>('scanner')
  const [selectedPackage, setSelectedPackage] = useState<{ OLPN: string; DN: string; Unidades: number; Local: string; Fecha: string; } | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        setSession(currentSession)
        
        if (currentSession) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('role, first_name, last_name')
            .eq('id', currentSession.user.id)
            .single()
          
          if (!error && profileData) {
            setProfile(profileData)
          }
        }
      } catch (err) {
        console.error('Error checking session:', err)
      } finally {
        setLoading(false)
      }
    }
    
    checkSession()
    
    // Listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        setProfile(null)
        setSelection(null)
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Efecto para cargar el perfil cuando hay sesión
  useEffect(() => {
    if (session && !profile) {
      const fetchProfile = async () => {
        try {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('role, first_name, last_name')
            .eq('id', session.user.id)
            .single()
          
          if (!error && profileData) {
            setProfile(profileData)
          }
        } catch (err) {
          console.error('Error fetching profile:', err)
        }
      }
      
      fetchProfile()
    }
  }, [session, profile])

  const handleSelectionComplete = (newSelection: Selection) => {
    setSelection(newSelection)
  }

  const handleBackToSelection = () => {
    setSelection(null)
    setCurrentView('scanner')
  }

  const handleNavigateToRechazos = (packageData: { OLPN: string; DN: string; Unidades: number; Local: string; Fecha: string; }) => {
    setSelectedPackage(packageData)
    setCurrentView('rechazos')
  }

  const handleBackFromRechazos = () => {
    setCurrentView('scanner')
    setSelectedPackage(null)
  }

  const handleLoginSuccess = () => {
    // Recargar la página para forzar una actualización completa del estado
    window.location.reload()
  }

  if (loading) {
    return <div style={{textAlign: 'center', paddingTop: '40px'}}>Cargando sesión...</div>
  }

  if (!session || !profile) {
    return <MinimalLogin onLoginSuccess={handleLoginSuccess} />
  }

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
      ) : currentView === 'rechazos' ? (
        selectedPackage ? (
          <RechazoFormView 
            session={session} 
            profile={profile} 
            packageData={selectedPackage} 
            onBack={handleBackFromRechazos}
          />
        ) : (
          <RechazosView session={session} profile={profile} />
        )
      ) : currentView === 'ticket-search' ? (
        <div></div>
      ) : !selection && currentView === 'scanner' ? (
        <SelectionScreenWithLocales profile={profile} onSelectionComplete={handleSelectionComplete} session={session} setCurrentView={setCurrentView} />
      ) : (
        <ScannerView 
          session={session} 
          profile={profile} 
          selection={selection || { local: '', fecha: '' }} 
          currentView={currentView} 
          setCurrentView={setCurrentView}
          navigateToRechazos={handleNavigateToRechazos}
        />
      )}
    </AppLayout>
  )
}