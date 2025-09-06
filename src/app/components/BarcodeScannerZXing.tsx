"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Result } from "@zxing/library";

interface BarcodeScannerZXingProps {
  onScan?: (barcode: string) => void;
  isScanning?: boolean;
  onScanningChange?: (isScanning: boolean) => void;
}

// Aspect ratio and crop size factor
const DESIRED_CROP_ASPECT_RATIO = 3 / 2;
const CROP_SIZE_FACTOR = 0.4;

export default function BarcodeScannerZXing({ 
  onScan, 
  isScanning = true, 
  onScanningChange 
}: BarcodeScannerZXingProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCroppedCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropOverlayRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      // Detener cualquier escaneo previo
      stopScanning();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          // Solo iniciar el intervalo si isScanning es true
          if (isScanning) {
            intervalIdRef.current = setInterval(captureFrameAndCrop, 1000);
          }
        };
      }
      
      if (onScanningChange) {
        onScanningChange(true);
      }
    } catch (err) {
      console.error("Error de Camara:", err);
      setError("No es posible acceder a la cámara. Por favor, verifica los permisos.");
      
      if (onScanningChange) {
        onScanningChange(false);
      }
    }
  };

  const stopScanning = () => {
    // Limpiar intervalo
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    
    // Detener tracks de la cámara
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Limpiar el srcObject del video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (onScanningChange) {
      onScanningChange(false);
    }
  };

  const toggleScanning = () => {
    if (streamRef.current) {
      // Si ya hay una cámara activa, solo toggleamos el intervalo
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
        if (onScanningChange) {
          onScanningChange(false);
        }
      } else {
        intervalIdRef.current = setInterval(captureFrameAndCrop, 1000);
        if (onScanningChange) {
          onScanningChange(true);
        }
      }
    } else {
      // Si no hay cámara activa, la iniciamos
      startCamera();
    }
  };

  const captureFrameAndCrop = () => {
    if (!videoRef.current || !displayCroppedCanvasRef.current || !cropOverlayRef.current) return;

    const video = videoRef.current;
    const displayCanvas = displayCroppedCanvasRef.current;
    const displayContext = displayCanvas.getContext("2d");
    const overlayDiv = cropOverlayRef.current;

    if (!displayContext) return;

    const tempCanvas = document.createElement("canvas");
    const tempContext = tempCanvas.getContext("2d");
    if (!tempContext) return;

    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    let cropWidth, cropHeight;
    const videoRatio = video.videoWidth / video.videoHeight;

    if (videoRatio / DESIRED_CROP_ASPECT_RATIO > 1) {
      cropHeight = video.videoHeight * CROP_SIZE_FACTOR;
      cropWidth = cropHeight * DESIRED_CROP_ASPECT_RATIO;
    } else {
      cropWidth = video.videoWidth * CROP_SIZE_FACTOR;
      cropHeight = cropWidth / DESIRED_CROP_ASPECT_RATIO;
    }

    cropWidth = Math.min(cropWidth, video.videoWidth);
    cropHeight = Math.min(cropHeight, video.videoHeight);

    const MIN_CROP_WIDTH = 240;
    const MAX_CROP_WIDTH = 600;
    const MIN_CROP_HEIGHT = 80;
    const MAX_CROP_HEIGHT = 400;

    cropWidth = Math.max(MIN_CROP_WIDTH, Math.min(MAX_CROP_WIDTH, cropWidth));
    cropHeight = Math.max(MIN_CROP_HEIGHT, Math.min(MAX_CROP_HEIGHT, cropHeight));

    const cropX = (video.videoWidth - cropWidth) / 2;
    const cropY = (video.videoHeight - cropHeight) / 2;

    displayCanvas.width = cropWidth;
    displayCanvas.height = cropHeight;

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
    );

    overlayDiv.style.position = 'absolute';
    overlayDiv.style.left = `${(cropX / video.videoWidth) * 100}%`;
    overlayDiv.style.top = `${(cropY / video.videoHeight) * 100}%`;
    overlayDiv.style.width = `${(cropWidth / video.videoWidth) * 100}%`;
    overlayDiv.style.height = `${(cropHeight / video.videoHeight) * 100}%`;
    overlayDiv.style.border = '2px solid white';
    overlayDiv.style.borderRadius = '0.5rem';
    overlayDiv.style.pointerEvents = 'none';
    overlayDiv.style.boxSizing = 'border-box';

    const decodeCanvas = async () => {
      try {
        const result: Result = await codeReader.current.decodeFromCanvas(displayCanvas);
        console.log("Decoded barcode:", result.getText());
        setBarcodeResult(result.getText());
        
        // Llamar a la función onScan si está definida
        if (onScan) {
          onScan(result.getText());
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "NotFoundException") {
          console.error("Decoding error:", err);
        }
      }
    };

    decodeCanvas(); // Call the async function
  };

  // Efecto para manejar el cambio de estado de isScanning
  useEffect(() => {
    if (streamRef.current) {
      if (isScanning && !intervalIdRef.current) {
        intervalIdRef.current = setInterval(captureFrameAndCrop, 1000);
      } else if (!isScanning && intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    }
  }, [isScanning]);

  // Efecto para iniciar la cámara cuando el componente se monta
  useEffect(() => {
    startCamera();

    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'sans-serif',
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
      maxWidth: '100%',
      width: '100%'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '240px',
        overflow: 'hidden',
        borderRadius: '8px',
        border: '2px solid #333',
        backgroundColor: '#000'
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
        <div
          ref={cropOverlayRef}
        ></div>
      </div>

      {error && <p style={{ color: '#ef4444', marginTop: '12px', fontSize: '0.875rem' }}>{error}</p>}

      <div style={{
        marginTop: '12px',
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: '0.75rem',
        lineHeight: '1.3'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '4px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}></div>
          <span>Escaneando...</span>
        </div>
        <p style={{ margin: 0 }}>
          Apunta la cámara hacia el código de barras
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
