import type { Metadata } from "next";
import localFont from 'next/font/local';
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import ChunkErrorBoundary from './components/ChunkErrorBoundary';

// Font definitions
const fontTitulo = localFont({
  src: './fonts/titulo.woff2',
  display: 'swap',
  variable: '--font-titulo',
});

const fontTitulo2 = localFont({
  src: './fonts/titulo2.woff2',
  display: 'swap',
  variable: '--font-titulo2',
});

const fontCuerpo = localFont({
  src: './fonts/cuerpo.woff2',
  display: 'swap',
  variable: '--font-cuerpo',
});

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
    <html lang="es" className={`${fontTitulo.variable} ${fontTitulo2.variable} ${fontCuerpo.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={fontCuerpo.className}>
        <ChunkErrorBoundary>
          <Toaster position="bottom-center" />
          {children}
        </ChunkErrorBoundary>
      </body>
    </html>
  );
}
