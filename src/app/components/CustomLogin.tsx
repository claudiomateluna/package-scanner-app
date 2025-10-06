'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import '@/app/globals.css'
import styles from './CustomLogin.module.css'
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

  // Función para limpiar el estado de sesión y forzar un refresco
  const handleSessionCleanup = async () => {
    try {
      // Cerrar cualquier sesión existente
      await supabase.auth.signOut()
      
      // Limpiar localStorage
      localStorage.removeItem('login_attempts')
      localStorage.removeItem('lock_time')
      
      // Resetear estado
      setLoginAttempts(0)
      setIsLocked(false)
      
      toast.success('Sesión limpiada correctamente')
    } catch (error) {
      console.error('Error al limpiar sesión:', error)
    }
  }

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
      const { error } = await supabase.auth.signInWithPassword({
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Función para forzar un refresco completo de la aplicación
  const handleForceRefresh = () => {
    // Limpiar todos los caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name)
        })
      })
    }
    
    // Limpiar localStorage y sessionStorage
    localStorage.clear()
    sessionStorage.clear()
    
    // Refrescar la página con un parámetro para evitar cache
    window.location.href = window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'refresh=' + Date.now()
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        {isLocked ? (
          <div className="notification-error">
            <h3 style={{ margin: '0 0 10px 0' }}>Cuenta Bloqueada</h3>
            <p style={{ margin: '0' }}>
              Demasiados intentos fallidos. 
              <br />
              Intente nuevamente en: <strong>{formatTime(lockTimeout)}</strong>
            </p>
            
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <button 
                onClick={handleSessionCleanup}
                style={{
                  backgroundColor: 'transparent',
                  color: '#FE7F2D',
                  border: '1px solid #FE7F2D',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Limpiar Sesión
              </button>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleLogin} className={styles.form}>
              <div>
                <label 
                  htmlFor="email" 
                  className={styles.label}
                >
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              
              <div>
                <label 
                  htmlFor="password" 
                  className={styles.label}
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={styles.submitButton}
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
                      className={styles.spinner}
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
            
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <button 
                onClick={handleForceRefresh}
                style={{
                  backgroundColor: 'transparent',
                  color: '#A1C181',
                  border: '1px solid #A1C181',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Refrescar Aplicación
              </button>
            </div>
          </>
        )}
        
        {loginAttempts > 0 && loginAttempts < 3 && !isLocked && (
          <p className={styles.attemptsText}>
            Intento {loginAttempts}/3
          </p>
        )}
      </div>
      
      <footer className={styles.footer}>
        Desarrollado por Claudio Mateluna González <br /> Warehouse Local Tech
      </footer>
    </div>
  )
}