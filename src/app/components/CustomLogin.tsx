'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import '@/app/globals.css'
import { isUserLocked, incrementLoginAttempts, resetLoginAttempts, lockUser, formatTime } from '@/lib/authUtils'

interface LoginProps {
  onLoginSuccess: () => void
}

export default function CustomLogin({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimeout, setLockTimeout] = useState(0)

  // Verificar si hay un bloqueo guardado en localStorage
  useEffect(() => {
    const { isLocked: locked, remainingTime } = isUserLocked()
    
    if (locked) {
      setIsLocked(true)
      setLockTimeout(remainingTime)
      
      // Actualizar el temporizador
      const timer = setInterval(() => {
        const { isLocked: stillLocked, remainingTime: timeLeft } = isUserLocked()
        if (!stillLocked) {
          clearInterval(timer)
          setIsLocked(false)
          setLoginAttempts(0)
          resetLoginAttempts()
        } else {
          setLockTimeout(timeLeft)
        }
      }, 1000)
      
      return () => clearInterval(timer)
    }
    
    // Obtener intentos guardados
    const savedAttempts = localStorage.getItem('login_attempts')
    if (savedAttempts) {
      setLoginAttempts(parseInt(savedAttempts))
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verificar si está bloqueado
    if (isLocked) {
      toast.error(`Demasiados intentos fallidos. Intente nuevamente en ${formatTime(lockTimeout)}`)
      return
    }
    
    // Validar campos
    if (!email || !password) {
      toast.error('Por favor, complete todos los campos')
      return
    }
    
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        // Incrementar intentos fallidos
        const newAttempts = incrementLoginAttempts()
        setLoginAttempts(newAttempts)
        
        // Bloquear después de 3 intentos
        if (newAttempts >= 3) {
          lockUser(5) // Bloquear por 5 minutos
          setIsLocked(true)
          setLockTimeout(5 * 60 * 1000)
          
          // Temporizador para desbloquear
          setTimeout(() => {
            setIsLocked(false)
            setLoginAttempts(0)
            resetLoginAttempts()
            toast.success('Puede intentar iniciar sesión nuevamente')
          }, 5 * 60 * 1000)
          
          toast.error('Demasiados intentos fallidos. Cuenta bloqueada por 5 minutos.')
        } else {
          toast.error(`Credenciales incorrectas. Intento ${newAttempts}/3`)
        }
        return
      }
      
      // Login exitoso
      resetLoginAttempts()
      setLoginAttempts(0)
      toast.success('Inicio de sesión exitoso')
      onLoginSuccess()
    } catch (error) {
      toast.error('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#233D4D',
      position: 'relative'
    }}>
      <div style={{ 
        width: '400px', 
        backgroundColor: 'rgba(0,0,0,0.2)', 
        padding: '40px', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        {isLocked ? (
          <div className="notification-error">
            <h3 style={{ margin: '0 0 10px 0' }}>Cuenta Bloqueada</h3>
            <p style={{ margin: '0' }}>
              Demasiados intentos fallidos. 
              <br />
              Intente nuevamente en: <strong>{formatTime(lockTimeout)}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label 
                htmlFor="email" 
                style={{ 
                  display: 'block', 
                  textAlign: 'left', 
                  fontWeight: 'bold', 
                  marginBottom: '5px',
                  color: '#CCCCCC'
                }}
              >
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#CCCCCC',
                  border: '1px solid #CCCCCC',
                  borderRadius: '5px',
                  fontSize: '1em',
                  boxSizing: 'border-box'
                }}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            
            <div>
              <label 
                htmlFor="password" 
                style={{ 
                  display: 'block', 
                  textAlign: 'left', 
                  fontWeight: 'bold', 
                  marginBottom: '5px',
                  color: '#CCCCCC'
                }}
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#CCCCCC',
                  border: '1px solid #CCCCCC',
                  borderRadius: '5px',
                  fontSize: '1em',
                  boxSizing: 'border-box'
                }}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 20px',
                backgroundColor: '#FE7F2D',
                color: '#233D4D',
                border: 'none',
                borderRadius: '5px',
                fontWeight: 'bold',
                fontSize: '1.2em',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {loading ? (
                <>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ animation: 'spin 1s linear infinite' }}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Iniciando Sesión...
                </>
              ) : (
                <>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>
        )}
        
        {loginAttempts > 0 && loginAttempts < 3 && !isLocked && (
          <p style={{ 
            color: '#FE7F2D', 
            fontSize: '0.9em', 
            marginTop: '10px',
            marginBottom: '0'
          }}>
            Intento {loginAttempts}/3
          </p>
        )}
      </div>
      
      <footer className="footer">
        Desarrollado por Claudio Mateluna
      </footer>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}