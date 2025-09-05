"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Result } from "@zxing/library";

interface BarcodeScannerZXingProps {
  onScan?: (barcode: string) => void;
}

// Aspect ratio and crop size factor
const DESIRED_CROP_ASPECT_RATIO = 3 / 2;
const CROP_SIZE_FACTOR = 0.4;

export default function BarcodeScannerZXing({ onScan }: BarcodeScannerZXingProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCroppedCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropOverlayRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            intervalId = setInterval(captureFrameAndCrop, 100);
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError("Unable to access the camera. Please check permissions.");
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

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (intervalId) clearInterval(intervalId);
    };
  }, [onScan]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#1f2937'
      }}>
        Camera View for Barcode Scanning
      </h2>

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '400px',
        overflow: 'hidden',
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

      {error && <p style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.875rem' }}>{error}</p>}

      <p style={{
        color: '#4b5563',
        fontSize: '0.875rem',
        textAlign: 'center'
      }}>
        Camera active. The white border indicates the barcode scanning area.
      </p>

      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 'semibold',
        color: '#1f2937'
      }}>
        Cropped Barcode Scan Area:
      </h3>

      <canvas
        ref={displayCroppedCanvasRef}
        style={{
          border: '2px solid #3b82f6',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          minWidth: '240px',
          minHeight: '80px'
        }}
      >
        Your browser does not support the canvas element.
      </canvas>

      <p style={{
        color: '#9ca3af',
        fontSize: '0.75rem',
      }}>
        This canvas updates every 0.1 seconds with the focused area.
      </p>
        <div style={{
          padding: '1rem',
          border: '2px dashed #10b981',
          borderRadius: '0.5rem',
          backgroundColor: '#ecfdf5',
          color: '#065f46',
          fontSize: '1rem',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          ✅ Barcode : {barcodeResult}
        </div>
    </div>
  );
}
