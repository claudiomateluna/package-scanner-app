// src/app/components/ChunkErrorBoundary.tsx
'use client'

import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ChunkErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    // Verificar si es un error de ChunkLoadError
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk') || error.message.includes('chunk')) {
      return { hasError: true, error }
    }
    // Para otros errores, no los manejamos aquí
    return { hasError: false, error: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ChunkErrorBoundary caught an error:', error, errorInfo)
    
    // Verificar si es un error de ChunkLoadError
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk') || error.message.includes('chunk')) {
      // Intentar recargar la página después de un corto retraso
      setTimeout(() => {
        // Limpiar el cache y recargar
        if (typeof window !== 'undefined') {
          // Limpiar el cache de la aplicación antes de recargar
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => {
                caches.delete(name);
              });
            });
          }
          
          // Recargar la página con un timestamp para evitar cache
          window.location.href = window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'v=' + Date.now();
        }
      }, 2000)
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#233D4D',
          color: '#CCCCCC',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#FE7F2D', marginBottom: '20px' }}>Actualizando aplicación...</h2>
          <p>Se está cargando una nueva versión de la aplicación.</p>
          <p>Por favor, espere un momento...</p>
          <div style={{
            marginTop: '20px',
            width: '50px',
            height: '50px',
            border: '5px solid rgba(254, 127, 45, 0.3)',
            borderTop: '5px solid #FE7F2D',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )
    }

    return this.props.children
  }
}