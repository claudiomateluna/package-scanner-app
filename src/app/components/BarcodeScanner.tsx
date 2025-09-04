// Componente de lector de códigos de barras usando la API de Camera
'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import jsQR from 'jsqr'

// Definir tipos para BarcodeDetector
interface BarcodeDetectorFormat {
  format: string;
  rawValue: string;
}

interface BarcodeDetector {
  detect: (image: HTMLCanvasElement) => Promise<BarcodeDetectorFormat[]>;
}

// Verificar si BarcodeDetector está disponible
const isBarcodeDetectorSupported = () => {
  // En iOS Safari, BarcodeDetector puede estar presente pero no funcionar correctamente
  // Vamos a verificar si realmente podemos crear una instancia
  if (!('BarcodeDetector' in window)) {
    console.log('BarcodeDetector no está presente en window');
    return false;
  }
  
  // En iOS, incluso si BarcodeDetector existe, puede no funcionar
  // Vamos a hacer una prueba real
  try {
    // Intentar crear una instancia simple para verificar compatibilidad
    // @ts-expect-error - BarcodeDetector puede no estar definido correctamente en algunos navegadores
    new window['BarcodeDetector']({ formats: ['qr_code'] });
    
    // Si llegamos aquí sin error, parece que funciona
    console.log('BarcodeDetector está disponible y funciona');
    return true;
  } catch (error) {
    // Si hay un error al crear la instancia, no está realmente disponible
    console.warn('BarcodeDetector está presente pero no se puede usar:', error);
    return false;
  }
}

// Crear un BarcodeDetector con formatos comunes
const createBarcodeDetector = (): BarcodeDetector | null => {
  // Verificar si BarcodeDetector está disponible y funciona
  if (!isBarcodeDetectorSupported()) {
    return null
  }
  
  try {
    // @ts-expect-error - BarcodeDetector puede no estar definido correctamente en algunos navegadores
    return new window['BarcodeDetector']({
      formats: ['qr_code', 'code_128', 'code_39', 'code_93', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'data_matrix']
    })
  } catch (error) {
    console.error('Error al crear BarcodeDetector:', error);
    return null;
  }
}

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onError?: (error: string) => void
}

// MediaDeviceInfo se eliminó ya que no se usaba

export default function BarcodeScanner({ onScan, onError }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const barcodeDetectorRef = useRef<BarcodeDetector | null>(null)
  const scanningRef = useRef<boolean>(false)
  const useJsQRFallback = useRef<boolean>(false) // Nuevo estado para usar jsQR como fallback
  
  const [isSupported, setIsSupported] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  // Inicializar el detector de códigos de barras
  useEffect(() => {
    const supported = isBarcodeDetectorSupported()
    setIsSupported(supported)
    
    if (supported) {
      barcodeDetectorRef.current = createBarcodeDetector()
      useJsQRFallback.current = false // No usar fallback si hay soporte
    } else {
      // Usar jsQR como fallback
      useJsQRFallback.current = true
      barcodeDetectorRef.current = null // Asegurarse de que sea null
    }
    
    // Siempre permitir el uso de la cámara, independientemente del soporte de BarcodeDetector
    // Esto permite que los usuarios intenten usar la cámara incluso en navegadores con soporte limitado
    setIsSupported(true)
    
    return () => {
      stopCamera()
    }
  }, [])

  // Iniciar la cámara
  const startCamera = async () => {
    try {
      if (!videoRef.current) return
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Preferir cámara trasera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      streamRef.current = stream
      videoRef.current.srcObject = stream
      setIsScanning(true)
      setPermissionDenied(false)
      
      // Iniciar escaneo una vez que el video esté listo
      videoRef.current.onloadedmetadata = () => {
        scanBarcode()
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setPermissionDenied(true)
      if (onError) {
        onError('No se pudo acceder a la cámara. Por favor, verifica los permisos.')
      }
      toast.error('No se pudo acceder a la cámara. Por favor, verifica los permisos.')
    }
  }

  // Detener la cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    scanningRef.current = false
    setIsScanning(false)
  }

  // Escanear códigos de barras
  const scanBarcode = async () => {
    if (!videoRef.current || !isScanning) {
      console.log('scanBarcode: Salir temprano - videoRef:', !!videoRef.current, 'isScanning:', isScanning);
      return;
    }
    
    scanningRef.current = true;
    console.log('scanBarcode: Iniciando escaneo...');
    
    try {
      // Capturar frame del video
      if (canvasRef.current && videoRef.current.videoWidth > 0) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          console.log('scanBarcode: Frame capturado - Dimensiones:', canvas.width, 'x', canvas.height);
          
          // Usar BarcodeDetector si está disponible
          if (barcodeDetectorRef.current) {
            console.log('scanBarcode: Usando BarcodeDetector nativo');
            // Detectar códigos de barras
            const barcodes = await barcodeDetectorRef.current.detect(canvas);
            
            if (barcodes.length > 0) {
              const barcode = barcodes[0].rawValue;
              console.log('Código de barras detectado con BarcodeDetector:', barcode);
              onScan(barcode);
              
              // Pausar brevemente antes de continuar escaneando
              setTimeout(() => {
                if (isScanning) {
                  requestAnimationFrame(scanBarcode);
                }
              }, 1000);
              return;
            } else {
              console.log('scanBarcode: No se detectaron códigos con BarcodeDetector');
            }
          } 
          // Usar jsQR como fallback si BarcodeDetector no está disponible o es null
          else if (useJsQRFallback.current || !barcodeDetectorRef.current) {
            console.log('scanBarcode: Usando jsQR como fallback');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
              console.log('Código QR detectado con jsQR:', code.data);
              onScan(code.data);
              
              // Pausar brevemente antes de continuar escaneando
              setTimeout(() => {
                if (isScanning) {
                  requestAnimationFrame(scanBarcode);
                }
              }, 1000);
              return;
            } else {
              console.log('scanBarcode: No se detectó código QR con jsQR');
            }
          } else {
            console.log('scanBarcode: No hay método de detección disponible');
          }
        } else {
          console.log('scanBarcode: No se pudo obtener contexto 2D del canvas');
        }
      } else {
        console.log('scanBarcode: Canvas o video no disponible - canvasRef:', !!canvasRef.current, 'videoWidth:', videoRef.current?.videoWidth);
      }
      
      // Continuar escaneando
      if (isScanning) {
        console.log('scanBarcode: Continuando escaneo...');
        requestAnimationFrame(scanBarcode);
      } else {
        console.log('scanBarcode: Escaneo detenido');
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);
      if (isScanning) {
        requestAnimationFrame(scanBarcode);
      }
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

  // Si no hay soporte, mostrar mensaje pero permitir el uso de la cámara
  if (!isSupported && !useJsQRFallback.current) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fff3cd', 
        color: '#856404', 
        borderRadius: '5px',
        textAlign: 'center'
      }}>
        <p>⚠️ Tu navegador no soporta la detección nativa de códigos de barras.</p>
        <p>Puedes intentar usar la cámara para escanear códigos QR.</p>
        <button
          onClick={startCamera}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            backgroundColor: '#2a9d8f',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Intentar Escanear con Cámara
        </button>
      </div>
    )
  }

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      maxWidth: '500px',
      margin: '0 auto'
    }}>
      {/* Video y Canvas para escaneo */}
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
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
          width="640"
          height="480"
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
        
        {/* Estilos para la animación */}
        <style jsx>{`
          @keyframes scanLine {
            0% { transform: translateY(0); }
            50% { transform: translateY(76px); }
            100% { transform: translateY(0); }
          }
        `}</style>
      </div>
      
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
    </div>
  )
}