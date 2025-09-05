// Componente de lector de códigos de barras con área de recorte usando la API de Camera
'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import toast from 'react-hot-toast'

interface VideoCropperScannerProps {
  onScan: (barcode: string) => void
  onError?: (error: string) => void
}

export default function VideoCropperScanner({ onScan, onError }: VideoCropperScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const displayCroppedCanvasRef = useRef<HTMLCanvasElement>(null)
  const cropOverlayRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanningRef = useRef<boolean>(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const [isScanning, setIsScanning] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null)

  // Aspect ratio y factor de tamaño de recorte
  const DESIRED_CROP_ASPECT_RATIO = 3 / 2
  const CROP_SIZE_FACTOR = 0.4

  // Inicializar el lector de códigos de barras
  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader()
    
    return () => {
      stopCamera()
    }
  }, [])

  // Iniciar la cámara
  const startCamera = async () => {
    try {
      if (!videoRef.current) return
      
      console.log('VideoCropperScanner: Solicitando acceso a la cámara...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' }, // Preferir cámara trasera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      console.log('VideoCropperScanner: Acceso a la cámara concedido')
      streamRef.current = stream
      videoRef.current.srcObject = stream
      setIsScanning(true)
      setPermissionDenied(false)
      
      // Iniciar escaneo una vez que el video esté listo
      videoRef.current.onloadedmetadata = () => {
        console.log('VideoCropperScanner: Video cargado, iniciando escaneo...')
        scanBarcode()
      }
    } catch (error: unknown) {
      console.error('VideoCropperScanner: Error al acceder a la cámara:', error)
      setPermissionDenied(true)
      if (onError) {
        onError('No se pudo acceder a la cámara. Por favor, verifica los permisos.')
      }
      toast.error('No se pudo acceder a la cámara. Por favor, verifica los permisos.')
    }
  }

  // Detener la cámara
  const stopCamera = () => {
    console.log('VideoCropperScanner: Deteniendo cámara...')
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    scanningRef.current = false
    setIsScanning(false)
    setBarcodeResult(null)
    
    console.log('VideoCropperScanner: Cámara detenida')
  }

  // Capturar frame y recortar
  const captureFrameAndCrop = () => {
    if (!videoRef.current || !displayCroppedCanvasRef.current || !cropOverlayRef.current || !isScanning) return

    const video = videoRef.current
    const displayCanvas = displayCroppedCanvasRef.current
    const displayContext = displayCanvas.getContext('2d')
    const overlayDiv = cropOverlayRef.current

    if (!displayContext || video.videoWidth === 0 || video.videoHeight === 0) return

    // Crear canvas temporal
    const tempCanvas = document.createElement('canvas')
    const tempContext = tempCanvas.getContext('2d')
    if (!tempContext) return

    tempCanvas.width = video.videoWidth
    tempCanvas.height = video.videoHeight
    tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height)

    // Calcular dimensiones de recorte
    let cropWidth, cropHeight
    const videoRatio = video.videoWidth / video.videoHeight

    if (videoRatio / DESIRED_CROP_ASPECT_RATIO > 1) {
      cropHeight = video.videoHeight * CROP_SIZE_FACTOR
      cropWidth = cropHeight * DESIRED_CROP_ASPECT_RATIO
    } else {
      cropWidth = video.videoWidth * CROP_SIZE_FACTOR
      cropHeight = cropWidth / DESIRED_CROP_ASPECT_RATIO
    }

    cropWidth = Math.min(cropWidth, video.videoWidth)
    cropHeight = Math.min(cropHeight, video.videoHeight)

    const MIN_CROP_WIDTH = 240
    const MAX_CROP_WIDTH = 600
    const MIN_CROP_HEIGHT = 80
    const MAX_CROP_HEIGHT = 400

    cropWidth = Math.max(MIN_CROP_WIDTH, Math.min(MAX_CROP_WIDTH, cropWidth))
    cropHeight = Math.max(MIN_CROP_HEIGHT, Math.min(MAX_CROP_HEIGHT, cropHeight))

    const cropX = (video.videoWidth - cropWidth) / 2
    const cropY = (video.videoHeight - cropHeight) / 2

    // Establecer dimensiones del canvas de visualización
    displayCanvas.width = cropWidth
    displayCanvas.height = cropHeight

    // Dibujar la imagen recortada en el canvas de visualización
    displayContext.drawImage(
      tempCanvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    )

    // Posicionar el overlay
    overlayDiv.style.position = 'absolute'
    overlayDiv.style.left = `${(cropX / video.videoWidth) * 100}%`
    overlayDiv.style.top = `${(cropY / video.videoHeight) * 100}%`
    overlayDiv.style.width = `${(cropWidth / video.videoWidth) * 100}%`
    overlayDiv.style.height = `${(cropHeight / video.videoHeight) * 100}%`
    overlayDiv.style.border = '2px solid #2a9d8f'
    overlayDiv.style.borderRadius = '0.5rem'
    overlayDiv.style.pointerEvents = 'none'
    overlayDiv.style.boxSizing = 'border-box'

    // Decodificar el canvas recortado
    decodeCanvas()
  }

  // Decodificar el canvas
  const decodeCanvas = async () => {
    if (!displayCroppedCanvasRef.current || !isScanning) return

    try {
      if (codeReaderRef.current) {
        const result = await codeReaderRef.current.decodeFromCanvas(displayCroppedCanvasRef.current)
        console.log('VideoCropperScanner: Código de barras detectado:', result.getText())
        setBarcodeResult(result.getText())
        onScan(result.getText())
      }
    } catch (err: unknown) {
      // Solo mostrar errores que no sean de tipo NotFoundException (que es normal cuando no hay códigos)
      if (err instanceof Error && err.name !== 'NotFoundException') {
        console.error('VideoCropperScanner: Error decodificando:', err)
      }
    }
  }

  // Escanear códigos de barras
  const scanBarcode = () => {
    if (!videoRef.current || !isScanning) return
    
    scanningRef.current = true
    
    // Iniciar escaneo periódico
    intervalRef.current = setInterval(() => {
      captureFrameAndCrop()
    }, 100) // Escanear cada 100ms
    
    console.log('VideoCropperScanner: Escaneo iniciado')
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
          ref={displayCroppedCanvasRef}
          style={{ display: 'none' }}
        />
        
        {/* Overlay para guía de escaneo */}
        {isScanning && (
          <>
            {/* Área de recorte */}
            <div
              ref={cropOverlayRef}
              style={{
                position: 'absolute',
                border: '2px solid #2a9d8f',
                borderRadius: '0.5rem',
                pointerEvents: 'none',
                boxSizing: 'border-box'
              }}
            >
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
            </div>
            
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
              Enfoca el c&oacute;digo de barras aqu&iacute;
            </div>
          </>
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
            <p>Presiona &quot;Iniciar Esc&aacute;ner&quot; para comenzar</p>
          </div>
        )}
      </div>
      
      {/* Estilos para la animación */}
      <style jsx>{`
        @keyframes scanLine {
          0% { transform: translateY(0); }
          50% { transform: translateY(calc(100% - 2px)); }
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
            color: '#233D4D',
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
              color: '#CCCCCC',
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
          &#x26A0; Se requiere acceso a la c&aacute;mara para escanear c&oacute;digos de barras.
        </div>
      )}
      
      {barcodeResult && (
        <div style={{ 
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          &#x2705; &Uacute;ltimo c&oacute;digo escaneado: {barcodeResult}
        </div>
      )}
    </div>
  )
}