# Guía de Implementación: Reporte de Faltantes/Sobrantes

## 1. Estructura de la Tabla `faltantes`

La tabla `faltantes` se ha creado con la siguiente estructura:

```sql
-- Tabla para almacenar reportes de faltantes/sobrantes
CREATE TABLE IF NOT EXISTS faltantes (
  id SERIAL PRIMARY KEY,
  ticket_id VARCHAR(15) UNIQUE NOT NULL, -- Formato: <PREFIJO><9 dígitos>
  olpn VARCHAR(50) UNIQUE NOT NULL, -- En SKA, equivale a "Correlativo del B2B"
  delivery_note VARCHAR(50) NOT NULL, -- En SKA, equivale a "OC"
  tipo_reporte VARCHAR(10) NOT NULL CHECK (tipo_reporte IN ('Faltante', 'Sobrante')),
  nombre_local VARCHAR(100) NOT NULL,
  tipo_local VARCHAR(3) NOT NULL CHECK (tipo_local IN ('FRA', 'RTL', 'SKA', 'WHS')),
  fecha DATE NOT NULL,
  factura VARCHAR(50), -- Omitir en SKA
  detalle_producto TEXT,
  talla VARCHAR(20),
  cantidad INTEGER,
  peso_olpn VARCHAR(20), -- Omitir en SKA
  detalle_bulto_estado VARCHAR(50) CHECK (detalle_bulto_estado IN (
    'Caja abierta antes de la recepción',
    'Caja dañada en el transporte',
    'Caja perdida en el transporte',
    'Cinta adulterada'
  )),
  foto_olpn TEXT, -- URL o nombre del archivo
  foto_bulto TEXT, -- URL o nombre del archivo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_by_user_name VARCHAR(100) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  updated_by_user_id UUID REFERENCES auth.users(id),
  updated_by_user_name VARCHAR(100)
);
```

## 2. Modificaciones a la Pantalla SelectionScreen

### 2.1. Cambios en la lógica de filtrado de locales

- Para usuarios administradores o Warehouse (administrador, Warehouse Supervisor, Warehouse Operator): Se muestran todos los locales
- Para usuarios Store (Store Supervisor, Store Operator) y SKA Operator: Se muestran solo los locales asignados
- Se eliminó el filtro por tipo de locales para todos los usuarios excepto Store Supervisor, Store Operator y SKA Operator

## 3. Modificaciones a la Pantalla ScannerView

### 3.1. Reemplazo del input de faltantes

En la tabla de "Paquetes Esperados", el input numérico de "Faltantes" se reemplazará por un botón "Reportar Faltante/Sobrante".

### 3.2. Nuevo componente: Formulario de Reporte de Faltantes/Sobrantes

Se creará un nuevo componente que se mostrará como modal al presionar el botón "Reportar Faltante/Sobrante". Este formulario tendrá las siguientes características:

#### Sección 1: Identificación (precargado)
- OLPN (texto, obligatorio, único, precargado desde el ítem, bloqueado/no editable)
- Delivery Note (texto, obligatorio, precargado, no único)
- Local (texto, obligatorio, precargado, editable si aplica)
- Fecha (fecha, formato DD-MM-YYYY, obligatorio, precargado)

#### Sección 2: Selección del reporte
- Campo Tipo de Reporte (obligatorio): opciones Faltante | Sobrante
- Regla de visibilidad: Todo lo que aparece en "Información Adicional" debe permanecer oculto hasta que se seleccione el Tipo de Reporte

#### Sección 3: Información Adicional (se revela después de elegir Tipo de Reporte)
- Factura (texto) - Se oculta para locales SKA
- Detalle del Producto (texto)
- Talla (texto)
- Cantidad (número, entero)
- Peso de OLPN (texto o número; unidad libre, ej. kg) - Se oculta para locales SKA
- Detalle de Cómo Venía el Bulto (opciones múltiples de selección única)
- Foto de OLPN (adjunto JPG) - Se renombra para SKA como "Foto del B2B"
- Foto del Bulto (adjunto JPG)

## 4. Lógica del Ticket ID

El ticket ID se genera con el siguiente formato:
- Prefijo según tipo de local: "FRA", "RTL", "SKA", "WHS"
- Número incremental de 9 dígitos (por ejemplo SKA000000123)
- El contador debe ser por prefijo
- El ticket se crea sólo al primer guardado; en ediciones posteriores el ticket no cambia

## 5. Control de Unicidad y Edición

- OLPN: único en la tabla y obligatorio
- Si ya existe un reporte para esa OLPN, al presionar el botón el formulario debe abrirse en modo edición cargando los datos anteriores
- DN: no es único (corregido). Sigue siendo obligatorio
- La detección de duplicado debe basarse solamente en OLPN

## 6. Auditoría y Usuario

En la tabla, además de usuario_id, se guarda el nombre del usuario que generó o editó el reporte:
- created_by_user_id, created_by_user_name, created_at al crear
- updated_by_user_id, updated_by_user_name, updated_at al editar

## 7. Roles y Accesos

### Store Operator:
- Mantiene acceso al Formulario General descrito en la sección 3
- Puede crear y editar reportes de faltantes/sobrantes

### SKA Operator:
- Tiene accesos similares al Store Operator
- Cuando se crea o edita el perfil se le debe poder asignar locales sólo de tipo SKA
- Usa la misma tabla faltantes y las mismas reglas de unicidad (OLPN único), edición por OLPN existente, auditoría y ticket incremental por prefijo SKA
- Solo puede ver y trabajar con locales de tipo SKA

## 8. Validaciones y UX

### Obligatorios:
- Tipo de Reporte, OLPN, DN, Nombre del Local, Fecha

### Archivos:
- Validar que Foto de OLPN o Foto de B2B y Foto del Bulto sean JPG (extensiones .jpg / .jpeg)

### Estados:
- Mostrar spinner o estado de carga al abrir en modo edición
- Mensajes de confirmación: "Reporte guardado", "Reporte actualizado"
- Errores legibles para duplicidad de OLPN, permisos y validaciones

## 9. Flujo de Trabajo

1. El usuario presiona el botón "Reportar Faltante/Sobrante" en un ítem de la lista
2. Se verifica si ya existe un reporte para esa OLPN
3. Si existe, se carga el formulario en modo edición
4. Si no existe, se carga el formulario en modo creación con los datos precargados
5. El usuario completa el formulario y lo guarda
6. Se genera un ticket ID si es un nuevo reporte
7. Se guardan los datos en la tabla faltantes con auditoría

## 10. Consideraciones Técnicas

- El repositorio (Storage) en Supabase se llama `faltantes-attachments`
- Se deben validar las extensiones de archivo JPG (.jpg / .jpeg)
- Se debe manejar correctamente la subida de archivos al repositorio
- Las etiquetas de los campos deben cambiar según el tipo de local (SKA vs otros)