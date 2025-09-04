// next.config.js - Configuración adicional para manejo de cache
const nextConfig = {
  // Otras configuraciones existentes...
  
  // Configuración para evitar problemas de cache
  experimental: {
    // Desactivar cache agresivo en desarrollo
    disableCache: process.env.NODE_ENV === 'development',
  },
  
  // Configuración de encabezados para controlar cache
  async headers() {
    return [
      {
        // Aplicar a todas las rutas
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
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
};

module.exports = nextConfig;