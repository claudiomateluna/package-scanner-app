'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

interface SessionInfo {
  user: User;
  profile: Profile | null;
}

export default function TestPage() {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessionInfo()
    fetchProfiles()
  }, [])

  async function fetchSessionInfo() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      setSessionInfo({
        user: session.user,
        profile: profile
      })
    }
    setLoading(false)
  }

  async function fetchProfiles() {
    const { data, error } = await supabase.from('profiles').select('*')
    if (!error) {
      setProfiles(data || [])
    }
  }

  async function testDeleteUser(userId: string) {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      toast.error('No se pudo obtener la sesión')
      return
    }

    const loadingToast = toast.loading('Eliminando usuario...')
    const response = await fetch('/api/delete-user', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: userId })
    })
    toast.dismiss(loadingToast)

    if (response.ok) {
      toast.success('Usuario eliminado')
      fetchProfiles()
    } else {
      const { error } = await response.json()
      toast.error(`Error: ${error}`)
    }
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Página de Prueba</h1>
      
      {sessionInfo && (
        <div style={{ 
          border: '1px solid #ccc', 
          padding: '15px', 
          borderRadius: '5px', 
          marginBottom: '20px' 
        }}>
          <h2>Información de Sesión</h2>
          <p><strong>Email:</strong> {sessionInfo.user.email}</p>
          <p><strong>Rol:</strong> {sessionInfo.profile?.role}</p>
          <p><strong>Nombre:</strong> {sessionInfo.profile?.first_name} {sessionInfo.profile?.last_name}</p>
        </div>
      )}

      <h2>Lista de Usuarios</h2>
      <div style={{ 
        border: '1px solid #ccc', 
        padding: '15px', 
        borderRadius: '5px' 
      }}>
        {profiles.length === 0 ? (
          <p>No hay usuarios</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ccc' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Nombre</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Rol</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(profile => (
                <tr key={profile.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{profile.email}</td>
                  <td style={{ padding: '8px' }}>{profile.first_name} {profile.last_name}</td>
                  <td style={{ padding: '8px' }}>{profile.role}</td>
                  <td style={{ padding: '8px' }}>
                    <button 
                      onClick={() => testDeleteUser(profile.id)}
                      style={{ 
                        padding: '5px 10px', 
                        backgroundColor: '#e63946', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}