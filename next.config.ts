import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gkqebmqtmjeinjuoivvu.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Configuración de encabezados para controlar cache
  async headers() {
    // "No cache" agresivo para todo
    const noCacheHeaders = [
      { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0' },
      { key: 'Pragma', value: 'no-cache' },
      { key: 'Expires', value: '0' },
    ];

    return [
      // 1) Todas las rutas de la app (páginas, APIs y archivos del /public)
      {
        source: '/:path*',
        headers: noCacheHeaders,
      },

      // 2) Service Worker (si existiera en /public)
      {
        source: '/service-worker.js',
        headers: noCacheHeaders,
      },
      {
        source: '/sw.js',
        headers: noCacheHeaders,
      },

      // 3) Manifiesto PWA
      {
        source: '/manifest.webmanifest',
        headers: noCacheHeaders,
      },
      {
        source: '/manifest.json',
        headers: noCacheHeaders,
      },

      // 4) Íconos de la app
      {
        source: '/icon-192x192.png',
        headers: noCacheHeaders,
      },
      {
        source: '/icon-512x512.png',
        headers: noCacheHeaders,
      },
      
      // 5) Favicon
      {
        source: '/favicon.ico',
        headers: noCacheHeaders,
      },
      
      // 6) Archivos SVG
      {
        source: '/adidas_shp.svg',
        headers: noCacheHeaders,
      },
      {
        source: '/barcode_icon.svg',
        headers: noCacheHeaders,
      },
    ];
  },
  
  // Configuración para webpack
  webpack: (config, { dev, isServer }) => {
    // En desarrollo, desactivar cache de chunks
    if (dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Reducir la fragmentación de chunks en desarrollo
            default: {
              chunks: 'all',
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Configuración para evitar problemas de cache en navegadores
  poweredByHeader: false,
  generateEtags: false,
};

export default nextConfig;
