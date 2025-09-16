# LocalesSearchableSelect Component

## Descripción

El componente `LocalesSearchableSelect` es un selector moderno de locales con funcionalidad de búsqueda que reemplaza el tradicional elemento `<select>` para una mejor experiencia de usuario. Este componente está diseñado específicamente para usuarios con roles 'Warehouse Operator', 'Warehouse Supervisor' y 'administrador'.

## Características

1. **Búsqueda en tiempo real**: Filtra los locales mientras el usuario escribe
2. **Interfaz moderna**: Dropdown con diseño limpio y responsive
3. **Indicación visual**: Muestra el tipo de local entre corchetes
4. **Feedback de selección**: Resalta el local seleccionado
5. **Manejo de estados**: Muestra mensaje cuando no hay resultados

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `locals` | `Local[]` | Sí | Array de objetos Local disponibles |
| `selectedLocal` | `string` | Sí | Nombre del local actualmente seleccionado |
| `onLocalSelect` | `(localName: string) => void` | Sí | Función callback cuando se selecciona un local |
| `placeholder` | `string` | No | Texto de ayuda cuando no hay selección (por defecto: "Buscar y seleccionar local...") |

## Uso

```jsx
<LocalesSearchableSelect
  locals={availableLocals}
  selectedLocal={selectedLocal}
  onLocalSelect={setSelectedLocal}
  placeholder="Buscar y seleccionar local..."
/>
```

## Estilos

El componente utiliza CSS Modules para una encapsulación adecuada de estilos. Los estilos principales se encuentran en `LocalesSearchableSelect.module.css` y utilizan las variables CSS definidas en `globals.css` para mantener la consistencia del tema.

## Compatibilidad

Este componente se muestra solo para usuarios con los siguientes roles:
- 'Warehouse Operator'
- 'Warehouse Supervisor' 
- 'administrador'

Para otros roles, se mantiene el comportamiento original del selector.