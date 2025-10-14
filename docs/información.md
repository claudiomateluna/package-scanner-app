# Documentación Completa de la Aplicación Recepciones

## Descripción General

La aplicación Recepciones (anteriormente Scanner App) es una aplicación web desarrollada con Next.js que permite a los operarios de un almacén escanear códigos de barras de paquetes para registrar su recepción. La aplicación incluye un sistema de roles y permisos de acceso, autenticación de usuarios, manejo de locales, y funcionalidades de escaneo para dispositivos móviles y desktop.

## Arquitectura

### Tecnologías utilizadas
- Next.js 15.5.2
- React 18
- TypeScript
- Supabase (autenticación y base de datos)
- Tailwind CSS (estilos)
- react-hot-toast (notificaciones)
- uuid (generación de IDs únicos)

### Estructura de carpetas
```
C:\Users\matelcla\qwenRecepciones\
├── .gitignore
├── APP_DESCRIPTION.md
├── eslint.config.mjs
├── masinfo.md
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── QWEN.md
├── tsconfig.json
├── .next/ (generado por Next.js)
├── .vercel/ (configuración de despliegue)
├── docs/ (documentación)
├── node_modules/ (dependencias)
├── public/ (archivos estáticos)
├── scripts/ (scripts de utilidad)
├── sql/ (archivos SQL para migración)
├── src/ (código fuente)
│   ├── app/ (componentes de la aplicación)
│   │   ├── api/ (endpoints API)
│   │   └── components/ (componentes reutilizables)
│   ├── hooks/ (hooks personalizados)
│   ├── lib/ (funciones utilitarias)
│   └── types/ (definiciones de tipos)
```

## Componentes Principales

### 1. Login (src/app/components/Login.tsx)
- Componente encargado de la autenticación de usuarios
- Utiliza el cliente de Supabase para verificar credenciales
- Implementa un sistema de rate limiting con límite de 3 intentos fallidos en 5 minutos
- Verifica el estado de bloqueo del usuario antes de permitir el acceso
- Se oculta si el usuario ya está autenticado

### 2. Layout (src/app/components/AppLayout.tsx)
- Componente que envuelve la aplicación con barras de navegación
- Muestra el nombre del usuario en la cabecera
- Implementa lógica de autorización basada en roles para mostrar u ocultar el botón de administración
- Incluye funcionalidades de logout y navegación entre pantallas

### 3. ScannerView (src/app/components/ScannerView.tsx)
- Página principal para escanear paquetes
- Permite ingresar manualmente código de barras o usar funcionalidad de escaneo con cámara
- Implementa un sistema de paginación para mostrar datos
- Muestra un resumen con totales de DN/Facturas, OLPN/Bultos y Unidades
- Utiliza un estado de sesión para mantener los datos entre navegaciones
- Incluye lógica para marcar DN como completados

### 4. SelectionScreen (src/app/components/SelectionScreen.tsx)
- Página para seleccionar locales disponibles
- Solo accesible para usuarios con roles específicos
- Permite al usuario elegir un local donde quiere trabajar
- Filtra locales según el rol del usuario

### 5. AdminPanel (src/app/components/AdminPanel.tsx)
- Panel de administración para gestionar usuarios
- Permite crear, actualizar y eliminar usuarios
- Incluye asignación de roles y locales
- Implementa jerarquía de roles con verificación de permisos

### 6. LocalesAdmin (src/app/components/LocalesAdmin.tsx)
- Componente para gestionar locales
- Permite crear, actualizar y eliminar locales
- Solo accesible para usuarios con roles elevados
- Verifica permisos de usuario antes de permitir operaciones

### 7. BarcodeScannerZXing (src/app/components/BarcodeScannerZXing.tsx)
- Componente para escaneo de códigos de barras
- Utiliza la cámara del dispositivo para detectar códigos de barras
- Implementa un overlay visual con línea de escaneo animada
- Compatible con múltiples tipos de códigos de barras
- Incluye soporte para iOS/Safari mediante jsQR como fallback

## Funcionalidades del Sistema

### 1. Autenticación de Usuarios
- Sistema basado en Supabase con roles jerárquicos
- Roles disponibles: administrador, Warehouse Supervisor, Warehouse Operator, Store Supervisor, Store Operator, SKA Operator
- Manejo de sesiones con tokens JWT
- Sistema de rate limiting para prevenir intentos de fuerza bruta
- Forzamiento de cambio de contraseña para nuevos usuarios

### 2. Sistema de Roles y Permisos
- Jerarquía definida donde roles superiores pueden gestionar roles inferiores
- Verificación de permisos basada en el rol del usuario
- Control de acceso a funcionalidades según el rol del usuario
- Usuarios Store Supervisor pueden acceder al panel de administración

### 3. Gestión de Locales
- Sistema de asignación de locales a usuarios
- Usuarios pueden ver solo los locales que tienen asignados
- Los roles Warehouse y Store tienen diferentes niveles de acceso a locales
- Filtrado de locales según rol y permisos

### 4. Escaneo de Paquetes
- Registro de paquetes mediante escaneo de códigos de barras
- Soporte para DN, OLPN y cantidades de unidades
- Visualización del estado de recepción (Pendiente/Recepción Completada)
- Sincronización de datos con la base de datos de Supabase

### 5. Responsive Design
- Adaptación para dispositivos móviles (iPad, iPhone, Android)
- Detección automática de dispositivo para optimizar UI
- Implementación de cámara como lector de códigos de barras en dispositivos móviles
- Interfaz optimizada para diferentes tamaños de pantalla

## Base de Datos (Supabase)

### Tablas Principales

#### 1. profiles
- Almacena la información de perfil de los usuarios
- Incluye ID, email, rol, nombre, apellido y preferencias
- Campos adicionales para el manejo de contraseñas y CSRF

#### 2. user_locals
- Relación muchos a muchos entre usuarios y locales
- Asocia usuarios a locales específicos
- Permite filtrado de información según el local del usuario

#### 3. locales
- Define los distintos locales disponibles en el almacén
- Incluye nombre y tipo de local
- Referenciado por la tabla user_locals

#### 4. data
- Almacena los datos de recepción de paquetes
- Campo principal: OLPN (código único de paquete)
- Campos adicionales: DN, Local, Unidades, Fecha, Recepción Completada

#### 5. recepciones_completadas
- Registra DN que han sido marcados como completamente recibidos
- Evita duplicación de registros y mejora la eficiencia

#### 6. failed_login_attempts
- Maneja el sistema de rate limiting
- Almacena intentos fallidos de login por email
- Incluye contador de intentos y tiempo de bloqueo

## API Endpoints

### 1. auth endpoints
- `/api/check-password-change-requirement` - Verifica si el usuario debe cambiar contraseña
- `/api/fetch-profile` - Obtiene el perfil del usuario
- `/api/create-user` - Crea nuevos usuarios (requiere permisos de admin)
- `/api/update-user` - Actualiza información de usuarios (requiere permisos apropiados)
- `/api/delete-user` - Elimina usuarios (requiere permisos de admin)

### 2. locales endpoints
- `/api/locales` - Gestiona los locales (GET, POST, PUT, DELETE)
- Requiere autenticación y permisos adecuados

### 3. rate limiting endpoints
- `/api/increment-failed-attempts` - Incrementa contador de intentos fallidos
- `/api/check-email-blocked` - Verifica si un email está bloqueado

### 4. datos endpoints
- `/api/upload-data` - Sube datos de recepción (solo para roles autorizados)
- `/api/tickets` - Obtiene datos de tickets (solo para roles autorizados)

## Hooks Personalizados

### 1. useDeviceDetection (src/hooks/useDeviceDetection.ts)
- Detecta el tipo de dispositivo (iPad, iPhone, Android, Desktop)
- Retorna información sobre el dispositivo y soporte de características

### 2. useSessionState (src/app/components/SessionStateContext.tsx)
- Maneja el estado de sesión para mantener datos entre navegaciones
- Utiliza contexto de React para compartir datos entre componentes

## Seguridad Implementada

### 1. Autenticación
- Uso de tokens JWT de Supabase
- Validación de tokens en tiempo de ejecución
- Sistema de refresh automático de tokens

### 2. Autorización
- Control basado en roles para diferentes funcionalidades
- Verificación de permisos antes de operaciones sensibles
- Filtrado de datos según rol y locales asignados

### 3. Rate Limiting
- Sistema de bloqueo después de 3 intentos fallidos
- Bloqueo temporal de 5 minutos
- Almacenamiento seguro en base de datos

### 4. Protección CSRF
- Generación y validación de tokens CSRF
- Almacenamiento seguro en base de datos
- Verificación en operaciones sensibles

## Estilos y Tema

### Paleta de Colores
- Fondo: #FFFFFF
- Texto: #000000
- Énfasis: #000000
- Progreso: #A1C181
- Advertencias: #FE7F2D
- Errores: #E63946

### Personalización
- Scrollbars con colores del tema
- Estilos personalizados para dispositivos móviles
- Adaptable a diferentes resoluciones de pantalla

## Configuración del Proyecto

### Variables de Entorno
- NEXT_PUBLIC_SUPABASE_URL: URL de la instancia de Supabase
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Clave anónima de Supabase
- SUPABASE_SERVICE_ROLE_KEY: Clave de rol de servicio de Supabase (solo disponible en servidor)

### Dependencias Clave
- @supabase/supabase-js: Cliente de Supabase
- next: Framework de React
- react: Biblioteca de UI
- @types/node, @types/react: Tipos de TypeScript

## Flujo de Trabajo

### Flujo de Login
1. El usuario ingresa email y contraseña
2. La aplicación verifica credenciales con Supabase
3. Si falla, incrementa contador de intentos
4. Si el usuario está bloqueado, lo informa
5. Si es exitoso, verifica si debe cambiar contraseña
6. Establece sesión y redirige según permisos

### Flujo de Escaneo
1. El operario selecciona un local
2. Ingresa código de barras manualmente o escanea
3. La aplicación valida el formato
4. Registra el paquete en la base de datos
5. Actualiza el resumen de datos
6. Marca DN como completado si se han registrado todos los paquetes

### Flujo de Administración
1. Usuario con permisos accede al panel
2. Visualiza usuarios según su nivel de acceso
3. Realiza operaciones de CRUD según permisos
4. Sincroniza cambios con la base de datos

## Mecanismos de Seguridad

### Prevención de Fuerza Bruta
- Límite de 3 intentos fallidos
- Bloqueo temporal de 5 minutos
- Almacenamiento seguro de intentos fallidos

### Control de Acceso
- Verificación de roles para operaciones sensibles
- Filtrado de recursos según permisos
- Validación de autorización en cada request

### Protección de Datos
- Separación de clave de servicio (no disponible en cliente)
- Validación de entradas en endpoints
- Sanitización de datos antes de almacenar

## Consideraciones de Despliegue

### Configuración de Supabase
- Políticas de RLS configuradas para cada tabla
- Funciones de autenticación y autorización
- Claves API configuradas con permisos mínimos necesarios

### Servidor
- Compilación con `npm run build`
- Servidor compatible con Next.js
- Variables de entorno configuradas en entorno de producción

### Cache y Rendimiento
- Estrategias de cache implementadas
- Optimización de imágenes
- Minimización de bundles

## Solución de Problemas Comunes

### Problemas de Autenticación
- Verificar que las variables de entorno estén correctamente configuradas
- Confirmar que las políticas de Supabase permiten las operaciones requeridas
- Comprobar que el usuario tenga los permisos adecuados

### Problemas de Escaneo
- Verificar permisos de cámara en dispositivos móviles
- Probar con diferentes tipos de códigos de barras
- Asegurar buena iluminación para el escaneo

### Problemas de Rendimiento
- Limpiar caché del navegador
- Verificar conexión a internet
- Asegurar que el servidor tenga suficientes recursos