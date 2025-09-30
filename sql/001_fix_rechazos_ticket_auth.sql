-- Fix para el problema de autenticación en el endpoint /api/rechazos/ticket
-- Fecha: 30 de septiembre de 2025
-- Descripción: Actualización del manejo de autenticación para seguir el mismo patrón que otros endpoints que funcionan correctamente

-- Nota: Este cambio se implementó en el archivo src/app/api/rechazos/ticket/route.ts
-- para alinear el manejo de sesiones con el patrón utilizado en /api/upload-data/route.ts