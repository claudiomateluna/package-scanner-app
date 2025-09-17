// src/app/components/VersionChecker.tsx
'use client'

import { useEffect } from 'react'
import toast from 'react-hot-toast'

export default function VersionChecker() {
  useEffect(() => {
    // Verificar si hay una nueva versión disponible cada 5 minutos
    const checkForUpdates = async () => {
      try {
        // Obtener la versión actual del build
        const response = await fetch('/_next/static/build-manifest.json', {
          cache: 'no-cache'
        })
        
        if (response.ok) {
          const buildManifest = await response.json()
          const currentBuildId = buildManifest.buildId
          
          // Guardar la versión actual en localStorage
          const lastBuildId = localStorage.getItem('lastBuildId')
          
          if (lastBuildId && lastBuildId !== currentBuildId) {
            // Hay una nueva versión
            toast(
              (t) => (
                <div>
                  <p>Nueva versión disponible</p>
                  <button 
                    onClick={() => {
                      // Limpiar cache y recargar
                      if ('caches' in window) {
                        caches.keys().then(names => {
                          names.forEach(name => {
                            caches.delete(name);
                          });
                        });
                      }
                      localStorage.setItem('lastBuildId', currentBuildId);
                      window.location.reload();
                      toast.dismiss(t.id);
                    }}
                    style={{
                      marginTop: '10px',
                      padding: '5px 10px',
                      backgroundColor: '#FE7F2D',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Actualizar ahora
                  </button>
                </div>
              ),
              {
                duration: Infinity,
                id: 'version-update'
              }
            );
          }
          
          // Guardar la versión actual
          localStorage.setItem('lastBuildId', currentBuildId);
        }
      } catch (error) {
        console.log('No se pudo verificar la versión:', error);
      }
    };

    // Verificar inmediatamente al cargar
    checkForUpdates();

    // Verificar cada 5 minutos
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}