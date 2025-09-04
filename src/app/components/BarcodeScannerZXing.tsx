// Componente de lector de códigos de barras usando la librería ZXing
'use client'

import { useState, useEffect, useRef } from 'react'
import { BrowserMultiFormatReader, Result } from '@zxing/library'
import toast from 'react-hot-toast'

interface BarcodeScannerZXingProps {
  onScan: (barcode: string) => void
  onError?: (error: string) => void
}

export default function BarcodeScannerZXing({ onScan, onError }: BarcodeScannerZXingProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    // Inicializar el lector de códigos de barras
    const codeReader = new BrowserMultiFormatReader()
    codeReaderRef.current = codeReader

    return () => {
      // Limpiar el lector cuando el componente se desmonte
      if (codeReaderRef.current) {
        codeReaderRef.current.reset()
      }
      stopCamera()
    }
  }, [])

  // Iniciar la cámara
  const startCamera = async () => {
    try {
      if (!videoRef.current) return
      
      // Solicitar acceso a la cámara trasera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Preferir cámara trasera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
        setPermissionDenied(false)
        
        // Iniciar escaneo una vez que el video esté listo
        videoRef.current.onloadedmetadata = () => {
          scanBarcode()
        }
      }
    } catch (err: unknown) {
      console.error('Error accessing camera:', err)
      setPermissionDenied(true)
      if (onError) {
        onError('No se pudo acceder a la cámara. Por favor, verifica los permisos.')
      }
      toast.error('No se pudo acceder a la cámara. Por favor, verifica los permisos.')
    }
  }

  // Detener la cámara
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
    
    // Resetear el lector de códigos de barras
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
    }
  }

  // Escanear códigos de barras
  const scanBarcode = async () => {
    if (!videoRef.current || !isScanning) return
    
    try {
      if (codeReaderRef.current && videoRef.current) {
        // Decodificar continuamente desde el dispositivo de video
        await codeReaderRef.current.decodeFromVideoDevice(
          null, 
          videoRef.current, 
          (result: Result | undefined, err?: Error) => {
            if (result) {
              // Código de barras detectado
              const barcode = result.getText()
              console.log('Código de barras detectado:', barcode)
              setResult(barcode)
              onScan(barcode)
              
              // Detener el escaneo después de detectar un código
              stopCamera()
            }
            
            if (err && !(err instanceof Error && err.name === 'NotFoundException')) {
              console.error('Error scanning barcode:', err)
              setError(err.message)
            }
          }
        )
      }
    } catch (err: unknown) {
      console.error('Error scanning barcode:', err)
      setError((err as Error).message)
      if (onError) {
        onError(`Error al escanear: ${(err as Error).message}`)
      }
      toast.error(`Error al escanear: ${(err as Error).message}`)
    }
  }

  // Toggle de escaneo
  const toggleScanning = () => {
    if (isScanning) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      maxWidth: '500px',
      margin: '0 auto'
    }}>
      {/* Video para escaneo */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '300px',
        backgroundColor: '#000',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ 
            width: '100%', 
            height: '100%',
            objectFit: 'cover'
          }}
        />
        
        {/* Overlay para guía de escaneo */}
        {isScanning && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '10%',
            right: '10%',
            height: '80px',
            border: '2px solid #2a9d8f',
            borderRadius: '8px',
            boxShadow: '0 0 0 1000px rgba(0,0,0,0.3)',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Línea de escaneo animada */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                backgroundColor: '#2a9d8f',
                animation: 'scanLine 2s ease-in-out infinite'
              }}
            />
            <div style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              zIndex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              Enfoca el código de barras aquí
            </div>
          </div>
        )}
        
        {!isScanning && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}>
            <p>Presiona &quot;Iniciar Escáner&quot; para comenzar</p>
          </div>
        )}
      </div>
      
      {/* Estilos para la animación */}
      <style jsx>{`
        @keyframes scanLine {
          0% { transform: translateY(0); }
          50% { transform: translateY(76px); }
          100% { transform: translateY(0); }
        }
      `}</style>
      
      {/* Controles */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginTop: '15px',
        justifyContent: 'center'
      }}>
        <button
          onClick={toggleScanning}
          style={{
            padding: '10px 20px',
            backgroundColor: isScanning ? '#e63946' : '#2a9d8f',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isScanning ? 'Detener Escáner' : 'Iniciar Escáner'}
        </button>
        
        {permissionDenied && (
          <button
            onClick={startCamera}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1d3557',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reintentar Permiso
          </button>
        )}
      </div>
      
      {permissionDenied && (
        <div style={{ 
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#fff3cd',
          color: '#856404',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          ⚠️ Se requiere acceso a la cámara para escanear códigos de barras.
        </div>
      )}
      
      {result && (
        <div style={{ 
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          ✅ Código escaneado: {result}
        </div>
      )}
      
      {error && (
        <div style={{ 
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          ❌ Error: {error}
        </div>
      )}
    </div>
  )
}