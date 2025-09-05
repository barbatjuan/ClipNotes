/** @type {import('next').NextConfig} */
const nextConfig = {
  // La configuración moderna de Next.js no requiere configuración i18n explícita
  // ya que usamos react-i18next que funciona en el cliente
  
  // Asegurar que Next.js siga las mejores prácticas para optimización
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  
  // Optimizaciones para mejora de rendimiento
  compiler: {
    // Eliminar console.logs en producción
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
