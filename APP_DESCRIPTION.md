# Aplicación de Gestión de Recepción de Paquetes

Desarrolla una aplicación web PWA completa para la gestión de recepción de paquetes, gestión de faltantes y gestión de rechazos con las siguientes características:

## 1. Autenticación y Seguridad

- Sistema de login con correo y contraseña
- Protección contra intentos fallidos de login (bloqueo después de 3 intentos por 5 minutos)
- Jerarquía de roles con diferentes niveles de permisos:
  * Administrador (acceso y control completo)
  * Warehouse Supervisor ()
  * Warehouse Specialist ()
  * Warehouse Operator ()
  * Store Supervisor ()
  * Store Operator ()
  * SKA Operator ()
  * Conductor ()

## 2. Funcionalidades Principales

- 2a. Pantalla de Bienvenida
- 2b. Restablecimiento de contraseña
- 2c. Panel de administración
- 2d. Sistema de Recepción de paquetes. escaneo de códigos de barras para recepción de paquetes
- 2e. Vista de progreso de recepción por DN (Delivery Note)
- 2f. Generación de reportes de faltantes
- 2g. Historial de recepciones completadas
- 2h. Estadísticas de recepción

  ### 2a. Pantalla de Bienvenida
    - Pantalla principal con acceso para todos los usuarios.
    - Tendrá la pantalla de selección para elegir local y fecha, de acuerdo a esa selección ir a la pantalla de Recepción de Paquetes.
    - Tendrá un botón para reportar Unidades Faltantes o Sobrantes.
    - Tendrá un botón para reportar Rechazos.

  ### 2b. Restablecimiento de contraseña
    - Todo usuario puede restablecer su propia contraseña.
      * Requisitos de Seguridad para restablecer Contraseña.
       - mínimo 8 caracteres.
       - Debe incluir al menos 1 minúscula, 1 mayúscula, 1 Carácter Especial y 1 número.
    - La opción para restablecer la contraseña se encontrara en el menú.

  ### 2c. Panel de administración
    - Gestión de usuarios:
      * CRUD de Usuarios.
      * Campos de Usuarios:
        ** Rol (role, enum: 'Conductor' | 'SKA Operator' | 'Store Operator' | 'Store Supervisor' | 'Warehouse Operator' | 'Warehouse Specialist' | 'Warehouse Supervisor' | 'Administrador' )
        ** Nombre (first_name, string)
        ** Apellido (last_name, string)
        ** Email (email, string)
      * Los usuarios con rol 'Administrador' tienen acceso y control completo al CRUD de usuarios.
      * Los usuarios con rol 'Warehouse Operator', 'Warehouse Specialist' y 'Warehouse Supervisor' pueden ver y asignar todos los locales.
        ** 'Warehouse Supervisor' puede hacer CRUD de usuarios que tengan un rol menor al suyo.
        ** 'Warehouse Specialist' puede hacer CRUD de usuarios que tengan un rol menor al suyo.
        ** 'Warehouse Operator' puede hacer CRUD de usuarios que tengan un rol menor al suyo.
      * Los usuarios con rol 'Store Operator', 'Store Supervisor' y 'SKA Operator' deben tener asignación de local y sólo verán la información de los locales asignados.
        ** 'Store Supervisor' puede hacer CRUD de usuarios en sus locales asignados a menos que tengan su mismo rol.
        ** 'Store Operator' no tiene acceso al panel de administración.
        ** 'SKA Operator' no tiene acceso al panel de administración.
    - Gestión de locales:
      * CRUD de Locales.
      * Campos de Locales:
        ** Tipo de Local (tipo_local, enum: 'FRA' | 'RTL' | 'SKA' | 'WHS' )
        ** Nombre de Local (nombre_local, string)
      * Usuarios con rol 'Warehouse Specialist', 'Warehouse Supervisor' y 'Administrador' tienen acceso al CRUD de Locales.
  
  ### 2d. Sistema de Recepción de paquetes
    - El usuario debe seleccionar la 
    - Lectura de códigos de barras para recepción de paquetes si el equipo es un computador.
      * Un input que al presionar enter presione el botón "Registrar" y eso agregue
    - Escaneo de códigos de barras para recepción de paquetes si el equipo es un iPad, iPhone o Android.
      * Usa la librería ZXing para que la cámara del dispositivo interprete el código de barras.
      * Al leer el código de barras debe ser colocado en un input.

## 3. Interfaz de Usuario

- Diseño responsive que funcione en desktop y dispositivos móviles
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

## 4. Tecnologías y Características Técnicas

- Desarrollado con Next.js 13+ usando App Router
- Backend con Supabase (autenticación y base de datos)
- Escaneo de códigos de barras con BarcodeDetector API y fallback a jsQR
- Componentes modulares con CSS Modules
- Manejo de estado con React Hooks
- Estilos globales con CSS personalizado
- Optimización de fuentes locales con next/font
- Manejo de errores y fallbacks para compatibilidad cross-browser

## 5. Componentes Clave

- CustomLogin: Formulario de autenticación con protección
- AppLayout: Layout principal con menú deslizante
- ScannerView: Vista principal de escaneo con cámara
- AdminView: Panel de administración de usuarios
- DNProgressCard: Tarjeta de progreso por Delivery Note
- ReceptionSummary: Resumen de recepción
- ReceptionHistory: Historial de recepciones
- ReceptionStatistics: Estadísticas de recepción
- MissingReportForm: Formulario de reporte de faltantes

## 6. Requisitos Especiales

- Cache busting para evitar problemas de cache en navegadores
- Compatibilidad con Safari/iOS para escaneo de códigos de barras
- Feedback visual claro durante el proceso de escaneo
- Overlay de enfoque en la cámara similar a PowerApps
- Línea de escaneo animada
- Protección contra errores de red y fallos de conexión

La aplicación debe ser funcional, segura, con una experiencia de usuario fluida tanto en desktop como en dispositivos móviles, y debe seguir las mejores prácticas de desarrollo web moderno.