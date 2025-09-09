import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import ChunkErrorBoundary from './components/ChunkErrorBoundary';

export const metadata: Metadata = {
  title: "Recepciones",
  description: "Sistema de recepción de paquetes",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{ 
          backgroundColor: '#ffffff',
          color: '#000000',
          margin: 0,
          padding: 0,
          minHeight: '100vh'
        }}
      >
        <ChunkErrorBoundary>
          <Toaster position="bottom-center" />
          {children}
        </ChunkErrorBoundary>
      </body>
    </html>
  );
}