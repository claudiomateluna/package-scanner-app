# Recepciones - Aplicación de Gestión de Paquetes

## Descripción General

Recepciones es una aplicación web PWA desarrollada en Next.js para la gestión de recepción de paquetes, faltantes y rechazos. La aplicación permite a los usuarios escanear paquetes, marcarlos como recibidos, generar reportes de faltantes y rechazos, y administrar usuarios con diferentes niveles de permisos.

## Características Principales

### 1. Autenticación y Seguridad

- Sistema de login con correo y contraseña
- Protección contra intentos fallidos de login (bloqueo después de 3 intentos por 5 minutos)
- Jerarquía de roles con diferentes niveles de permisos:
  * Administrador (acceso y control completo)
  * Warehouse Supervisor
  * Warehouse Specialist
  * Warehouse Operator
  * Store Supervisor
  * Store Operator
  * SKA Operator
  * Conductor

### 2. Funcionalidades Principales

#### 2a. Pantalla de Bienvenida
- Pantalla principal con acceso para todos los usuarios
- Pantalla de selección para elegir local y fecha
- Botón para reportar Unidades Faltantes o Sobrantes
- Botón para reportar Rechazos

#### 2b. Restablecimiento de contraseña
- Todo usuario puede restablecer su propia contraseña
- Requisitos de Seguridad:
  - Mínimo 8 caracteres
  - Debe incluir al menos 1 minúscula, 1 mayúscula, 1 Carácter Especial y 1 número
- Opción disponible en el menú

#### 2c. Panel de administración
- Gestión de usuarios (CRUD)
- Campos de Usuarios:
  * Rol (role, enum: 'Conductor' | 'SKA Operator' | 'Store Operator' | 'Store Supervisor' | 'Warehouse Operator' | 'Warehouse Specialist' | 'Warehouse Supervisor' | 'Administrador')
  * Nombre (first_name, string)
  * Apellido (last_name, string)
  * Email (email, string)
- Gestión de locales (CRUD)
- Campos de Locales:
  * Tipo de Local (tipo_local, enum: 'FRA' | 'RTL' | 'SKA' | 'WHS')
  * Nombre de Local (nombre_local, string)

#### 2d. Sistema de Recepción de paquetes
- Selección de local y fecha
- Lectura de códigos de barras para recepción de paquetes en computadores
- Escaneo de códigos de barras para recepción de paquetes en dispositivos móviles (iPad, iPhone, Android)
- Vista de progreso de recepción por DN (Delivery Note)

#### 2e. Generación de reportes
- Reportes de faltantes
- Reportes de rechazos
- Historial de recepciones completadas
- Estadísticas de recepción

### 3. Interfaz de Usuario

- Diseño responsive que funciona en desktop y dispositivos móviles
- Detección automática de dispositivo (iPad, iPhone, Android, Desktop)
- Interfaz optimizada para dispositivos móviles con cámara integrada para escaneo
- Paleta de colores personalizada:
  * Fondo: #FFFFFF
  * Texto principal: #000000
  * Fondo de botones: #000000
  * Texto de botones: #FFFFFF
  * Éxito: #A1C181
- Fuentes personalizadas para títulos y cuerpo
- Iconos SVG personalizados

### 4. Tecnologías y Características Técnicas

- Desarrollado con Next.js 13+ usando App Router
- Backend con Supabase (autenticación y base de datos)
- Escaneo de códigos de barras con BarcodeDetector API y fallback a jsQR
- Componentes modulares con CSS Modules
- Manejo de estado con React Hooks
- Estilos globales con CSS personalizado
- Optimización de fuentes locales con next/font
- Manejo de errores y fallbacks para compatibilidad cross-browser

## Componentes Clave

### CustomLogin
Formulario de autenticación con protección contra intentos fallidos

### AppLayout
Layout principal con menú deslizante y navegación

### ScannerView
Vista principal de escaneo con funcionalidad de cámara

### AdminView
Panel de administración de usuarios y locales

### DNProgressCard
Tarjeta de progreso por Delivery Note

### ReceptionSummary
Resumen de recepción con detalles

### ReceptionHistory
Historial de recepciones completadas

### ReceptionStatistics
Estadísticas de recepción

### MissingReportForm
Formulario de reporte de faltantes

### RechazoForm
Formulario de reporte de rechazos

## Requisitos Especiales

- Cache busting para evitar problemas de cache en navegadores
- Compatibilidad con Safari/iOS para escaneo de códigos de barras
- Feedback visual claro durante el proceso de escaneo
- Overlay de enfoque en la cámara similar a PowerApps
- Línea de escaneo animada
- Protección contra errores de red y fallos de conexión

## Arquitectura Técnica

### Tecnologías Utilizadas

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase (Base de datos PostgreSQL, autenticación, almacenamiento)
- **Estilos**: CSS Modules, variables CSS
- **Componentes UI**: React Hot Toast para notificaciones
- **Escaneo**: @zxing/browser, @zxing/library, jsQR
- **Otros**: barcode-detector

### Estructura del Proyecto

```
src/
├── app/                 # Páginas y componentes de la aplicación
│   ├── api/            # Endpoints API
│   ├── components/     # Componentes reutilizables
│   ├── diagnostic/     # Herramientas de diagnóstico
│   ├── rechazos/       # Funcionalidades de rechazos
│   ├── tickets/        # Sistema de tickets
│   └── ...             # Otras páginas
├── hooks/              # Hooks personalizados
├── lib/                # Utilidades y servicios
└── ...                 # Configuración y assets
```

## Sistema de Notificaciones

### Descripción

El sistema de notificaciones permite informar a los usuarios con roles "Warehouse Operator" y "Warehouse Supervisor" cuando se completa una recepción.

### Características

- **Notificaciones en tiempo real**: Usando canales de Supabase
- **Idempotencia**: Evita notificaciones duplicadas
- **Conteo de notificaciones no leídas**: Con actualización en tiempo real
- **Historial persistente**: Almacenado en la base de datos
- **Toast notifications**: Notificaciones emergentes dentro de la aplicación
- **Centro de notificaciones**: Historial con paginación
- **Notificaciones push**: Soporte opcional

### Componentes

1. **NotificationBell**: Ícono de campana con badge de notificaciones
2. **NotificationCenter**: Centro de notificaciones con historial
3. **NotificationToast**: Componente para mostrar toasts in-app
4. **notificationService**: Servicio backend para manejo de notificaciones

### Tablas de Base de Datos

```sql
-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  olpn VARCHAR(255),
  delivery_note VARCHAR(255),
  nombre_local VARCHAR(255) NOT NULL,
  tipo_local VARCHAR(50),
  unidades INTEGER,
  bultos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_user_id UUID REFERENCES auth.users(id),
  created_by_user_name VARCHAR(255),
  dedup_key VARCHAR(255) UNIQUE NOT NULL
);

-- Tabla de lecturas de notificaciones
CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  read_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (notification_id, user_id)
);

-- Tabla de suscripciones push (opcional)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE
);
```

## Roles y Permisos

La aplicación implementa una jerarquía de roles con diferentes niveles de acceso:

1. **Administrador**: Acceso completo a todas las funcionalidades
2. **Warehouse Supervisor**: Gestión de recepciones, faltantes y rechazos
3. **Warehouse Specialist**: Funciones especializadas de almacén
4. **Warehouse Operator**: Operaciones de recepción, reporte de faltantes y rechazos
5. **Store Supervisor**: Gestión básica de recepciones en su local
6. **Store Operator**: Operaciones básicas de recepción
7. **SKA Operator**: Funciones específicas de SKA
8. **Conductor**: Funciones limitadas

### Permisos por Rol

- **Administración**: Administrador, Warehouse Supervisor, Warehouse Specialist, Warehouse Operator, Store Supervisor
- **Reporte de Faltantes**: Administrador, Warehouse Supervisor, Warehouse Specialist, Warehouse Operator
- **Gestión de Rechazos**: Administrador, Warehouse Supervisor, Warehouse Specialist, Warehouse Operator
- **Escaneo de Paquetes**: Todos los roles excepto Conductor

## Diseño Responsivo

La aplicación está optimizada para diferentes dispositivos:

- **Desktop**: Layout de dos columnas con panel lateral
- **Tablet**: Layout adaptativo con elementos reorganizados
- **Móvil**: Layout vertical con controles táctiles optimizados

### Detección de Dispositivos

Implementación de detección automática de dispositivos:

- Escritorio (Windows, macOS, Linux)
- Tablets (iPad)
- Móviles (iPhone, Android)

## Seguridad

### Autenticación

- Sistema de login con email y contraseña
- Protección contra intentos fallidos (3 intentos, 5 minutos de bloqueo)
- Gestión de sesiones segura con Supabase Auth

### Autorización

- Row Level Security (RLS) en la base de datos
- Verificación de roles en el frontend y backend
- Políticas específicas por tabla y operación

## Base de Datos

### Tablas Principales

1. **data**: Información de paquetes esperados
2. **recepcion**: Registro de paquetes escaneados
3. **recepciones_completadas**: Historial de recepciones finalizadas
4. **faltantes**: Reportes de unidades faltantes
5. **rechazos**: Reportes de paquetes rechazados
6. **profiles**: Información de usuarios
7. **locales**: Listado de locales disponibles
8. **ticket_counters**: Contadores para generación de IDs de tickets

### Relaciones

- `profiles` ↔ `auth.users` (usuarios autenticados)
- `recepcion` → `data` (paquetes escaneados referencian paquetes esperados)
- `faltantes` y `rechazos` → `profiles` (reportes vinculados a usuarios)
- `notification_reads` → `notifications` (lecturas vinculadas a notificaciones)

## Desarrollo Local

### Instalación

```bash
npm install
```

### Ejecución

```bash
# Modo desarrollo
npm run dev

# Construcción de producción
npm run build

# Ejecutar en producción
npm run start
```

### Scripts Útiles

```bash
# Limpiar caché
npm run clean

# Desarrollo con limpieza de caché
npm run dev:clean
```

## Solución de Problemas

### Errores Comunes

1. **"supabase is not defined"**: Verificar configuración del cliente de Supabase
2. **Problemas de permisos**: Revisar políticas RLS en la base de datos
3. **Notificaciones no funcionan**: Verificar que las tablas de notificaciones existen
4. **Errores de escaneo**: Revisar permisos de cámara en dispositivos móviles

## Mantenimiento

### Actualización de Políticas

Para actualizar las políticas de seguridad:

1. Ejecutar scripts de actualización de políticas
2. Verificar funcionamiento en ambiente de prueba
3. Desplegar en producción

## Personalización

### Paleta de Colores

```css
:root {
  --color-background: #ffffff;
  --color-text-primary: #000000;
  --color-text-secondary: #333333;
  --color-accent: #000000;
  --color-success: #a1c181;
  --color-warning: #ff9e00;
  --color-error: #e63946;
}
```

### Fuentes

- **Títulos**: Fuente personalizada 'fontTitulo'
- **Cuerpo**: Fuente personalizada 'fontCuerpo'

## Futuras Mejoras

1. **Notificaciones Push**: Implementación completa de Web Push API
2. **Exportación de Datos**: Funcionalidad para exportar reportes en CSV/Excel
3. **Dashboard de Métricas**: Panel de indicadores clave de desempeño
4. **Integración con Sistemas Externos**: APIs para conectar con ERPs y WMS
5. **Multi-idioma**: Soporte para diferentes idiomas
6. **Offline Support**: Funcionalidad sin conexión a internet

## Contacto

Desarrollado por Claudio Mateluna