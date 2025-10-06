// src/app/components/MinimalLogin.tsx
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

export default function MinimalLogin({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimeout, setLockTimeout] = useState(0)
  const [isClient, setIsClient] = useState(false)

  // Verificar si hay un bloqueo guardado en localStorage
  useEffect(() => {
    setIsClient(true)
    
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
        setLoading(false)
        return
      }
      
      // Login exitoso
      if (data.session) {
        resetLoginAttempts()
        setLoginAttempts(0)
        toast.success('Inicio de sesión exitoso')
        // Llamar inmediatamente a onLoginSuccess
        onLoginSuccess()
        // Forzar una actualización inmediata del estado
        window.location.reload()
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión'
      toast.error(errorMessage)
      setLoading(false)
    }
  }

  // No renderizar nada hasta que estemos en el cliente
  if (!isClient) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            Cargando...
          </div>
        </div>
      </div>
    )
  }

  if (isLocked) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <div className="notification-error">
            <h3 style={{ margin: '0 0 10px 0' }}>Cuenta Bloqueada</h3>
            <p style={{ margin: '0' }}>
              Demasiados intentos fallidos. 
              <br />
              Intente nuevamente en: <strong>{formatTime(lockTimeout)}</strong>
            </p>
          </div>
        </div>
        <footer className={styles.footer}>
          Desarrollado por Claudio Mateluna González <br /> Warehouse Local Tech
        </footer>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
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
            {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        {loginAttempts > 0 && loginAttempts < 3 && (
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