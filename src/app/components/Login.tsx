// src/app/components/MinimalLogin.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import '@/app/globals.css'
import styles from './Login.module.css'
import { formatTime } from '@/lib/authUtils'
import { incrementFailedLoginAttempts, isEmailBlocked } from '@/lib/rateLimitUtils'

interface LoginProps {
  onLoginSuccess: () => void
}

export default function MinimalLogin({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockTimeout, setBlockTimeout] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [activeTab, setActiveTab] = useState('developed') // Estado para tabs del footer

  // Verificar si hay un bloqueo guardado en el servidor
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Verificar estado de bloqueo cada vez que cambie el email, con debounce
  useEffect(() => {
    // Solo verificar bloqueo si hay un email válido (contiene @)
    if (!email || !email.includes('@')) {
      setIsBlocked(false); // Resetear estado de bloqueo si no hay email válido
      return;
    }
    
    // Usar debounce para evitar llamadas frecuentes a la API
    const timer = setTimeout(() => {
      const checkBlockStatus = async () => {
        try {
          // Solo verificar bloqueo si el email parece válido
          if (email && email.includes('@')) {
            const blockStatus = await isEmailBlocked(email);
            if (blockStatus.isBlocked) {
              setIsBlocked(true);
              setBlockTimeout(blockStatus.remainingTime);
              
              // Actualizar el temporizador
              const timer = setInterval(() => {
                setBlockTimeout(prev => {
                  const newTime = Math.max(0, prev - 1000);
                  if (newTime <= 0) {
                    clearInterval(timer);
                    setIsBlocked(false);
                    return 0;
                  }
                  return newTime;
                });
              }, 1000);
              
              return () => clearInterval(timer);
            } else {
              // Asegurarse de resetear el estado de bloqueo si el email no está bloqueado
              setIsBlocked(false);
            }
          }
        } catch (error) {
          console.error('Error verificando estado de bloqueo:', error);
          // No cambiar el estado de bloqueo en caso de error, pero resetear si hay error de autenticación
          if (error instanceof Error && error.message.includes('supabaseKey is required')) {
            // Si hay un error de configuración de Supabase, resetear el estado de bloqueo
            setIsBlocked(false);
          }
        }
      };
      
      checkBlockStatus();
    }, 500); // 500ms de delay después de dejar de escribir
    
    // Limpiar timeout si cambia el email antes del delay
    return () => clearTimeout(timer);
  }, [email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verificar si está bloqueado
    if (isBlocked) {
      toast.error(`Demasiados intentos fallidos. Intente nuevamente en ${formatTime(blockTimeout)}`)
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
        // Manejar errores de autenticación con mejor manejo de errores
        try {
          // Incrementar intentos fallidos en el servidor
          const newAttempts = await incrementFailedLoginAttempts(email)
          setLoginAttempts(newAttempts)
          
          // Verificar si hay que bloquear al usuario
          if (newAttempts >= 3) {
            const blockStatus = await isEmailBlocked(email)
            if (blockStatus.isBlocked) {
              setIsBlocked(true)
              setBlockTimeout(blockStatus.remainingTime)
              
              // Temporizador para actualizar UI cuando expire
              const timer = setInterval(() => {
                setBlockTimeout(prev => {
                  const newTime = Math.max(0, prev - 1000);
                  if (newTime <= 0) {
                    clearInterval(timer);
                    setIsBlocked(false);
                    return 0;
                  }
                  return newTime;
                });
              }, 1000);
              
              toast.error('Demasiados intentos fallidos. Cuenta bloqueada por 5 minutos.')
              return () => clearInterval(timer);
            }
          } else {
            // Mostrar mensaje de error de autenticación más específico
            if (error.message && error.message.includes('Invalid login credentials')) {
              toast.error('Credenciales inválidas. Verifique su email y contraseña.')
            } else {
              toast.error(`Credenciales incorrectas. Intento ${newAttempts}/3`)
            }
          }
        } catch (incrementError) {
          console.error('Error al incrementar intentos fallidos:', incrementError);
          // Mostrar mensaje genérico si falla el incremento de intentos
          toast.error('Error de autenticación. Por favor intente nuevamente.')
        }
        setLoading(false)
        return
      }
      
      // Login exitoso
      if (data.session) {
        toast.success('Inicio de sesión exitoso')
        // Llamar inmediatamente a onLoginSuccess
        onLoginSuccess()
        // Forzar una actualización inmediata del estado
        window.location.reload()
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión'
      // Manejar errores específicos de Supabase
      if (errorMessage.includes('supabaseKey is required')) {
        toast.error('Error de configuración. Por favor contacte al administrador.')
      } else {
        toast.error('Error al iniciar sesión. Por favor intente nuevamente.')
      }
      setLoading(false)
    }
  }

  // No renderizar nada hasta que estemos en el cliente
  if (!isClient) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <div className={styles.loadingContainer}>
            Cargando...
          </div>
        </div>
      </div>
    )
  }

  if (isBlocked) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <div className="notification-error">
            <h3 className={styles.lockedHeader}>Cuenta Bloqueada</h3>
            <p className={styles.lockedParagraph}>
              Demasiados intentos fallidos. 
              <br />
              Intente nuevamente en: <strong>{formatTime(blockTimeout)}</strong>
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
        {/* Tabs minimalistas */}
        <div className={styles.tabsContainer}>
          <button 
            onClick={() => setActiveTab('concept')}
            className={`${styles.tabButton} ${activeTab === 'concept' ? styles.tabButtonActive : ''}`}
          >
            Concept
          </button>
          <button 
            onClick={() => setActiveTab('prototype')}
            className={`${styles.tabButton} ${activeTab === 'prototype' ? styles.tabButtonActive : ''}`}
          >
            Prototype
          </button>
          <button 
            onClick={() => setActiveTab('developed')}
            className={`${styles.tabButton} ${activeTab === 'developed' ? styles.tabButtonActive : ''}`}
          >
            Developed
          </button>
        </div>
        
        {/* Contenido de los tabs */}
        <div className={styles.tabsContent}>
          {activeTab === 'concept' && (
            <div>
              Concept by <b>Andric Aular</b> | Shipping Supervisor | DC Chile
            </div>
          )}
          {activeTab === 'prototype' && (
            <div>
              Prototype by <b>Alejandro Oñate</b> | Shipping Specialist | DC Chile
            </div>
          )}
          {activeTab === 'developed' && (
            <div>
              Developed by <b>Claudio Mateluna González</b> | Local Tech | DC Chile
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}