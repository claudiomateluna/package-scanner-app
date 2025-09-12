'use client'

import { useState, useEffect, CSSProperties } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { canUserManageRole } from '@/lib/roleHierarchy'

interface Local {
  id: number
  tipo_local: string
  nombre_local: string
  created_at: string
}

interface LocalesViewProps {
  profile: {
    role: string | null
    id: string
  }
}

// --- Estilos Reutilizables ---
const inputStyle: CSSProperties = { 
  width: '100%',
  padding: '10px',
  backgroundColor: '#fff',
  color: '#000',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: '#000',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: '#000',
  borderLeftWidth: '1px',
  borderLeftStyle: 'solid',
  borderLeftColor: '#000',
  borderRightWidth: '1px',
  borderRightStyle: 'solid',
  borderRightColor: '#000',
  borderRadius: '4px',
  boxSizing: 'border-box',
  margin: '5px'
}

const buttonStyle: CSSProperties = { 
  padding: '10px 15px', 
  backgroundColor: '#000000', 
  color: '#fff', 
  border: 'none', 
  borderRadius: '5px', 
  cursor: 'pointer' 
}

const cardStyle: CSSProperties = { 
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: '#000',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: '#000',
  borderLeftWidth: '1px',
  borderLeftStyle: 'solid',
  borderLeftColor: '#000',
  borderRightWidth: '1px',
  borderRightStyle: 'solid',
  borderRightColor: '#000',
  padding: '16px', 
  borderRadius: '4px', 
  marginTop: '24px' 
}

export default function LocalesView({ profile }: LocalesViewProps) {
  const [locales, setLocales] = useState<Local[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLocalId, setEditingLocalId] = useState<number | null>(null)
  const [nombreLocal, setNombreLocal] = useState('')
  const [tipoLocal, setTipoLocal] = useState('RTL')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const canManageLocales = profile?.role === 'administrador' || profile?.role === 'Warehouse Supervisor' || profile?.role === 'Warehouse Operator'

  async function fetchLocales() {
    // Verificar permisos
    if (!canManageLocales) {
      return;
    }
    
    setLoading(true)
    try {
      // Obtener el token de sesión
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        toast.error('No se pudo obtener la sesión de autenticación');
        return;
      }
      
      const response = await fetch('/api/locales', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Error al cargar los locales');
      }
      
      const data = await response.json();
      setLocales(data || []);
    } catch (error: unknown) {
      toast.error('Error inesperado al cargar los locales: ' + ((error as Error).message || (error as Error).toString()))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLocales()
  }, [canManageLocales])

  const handleCreateLocal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones
    if (!nombreLocal.trim()) {
      toast.error('El nombre del local es requerido')
      return
    }
    
    const loadingToast = toast.loading('Creando local...')
    
    try {
      // Obtener el token de sesión
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        toast.error('No se pudo obtener la sesión de autenticación');
        toast.dismiss(loadingToast);
        return;
      }
      
      const response = await fetch('/api/locales', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre_local: nombreLocal.trim(),
          tipo_local: tipoLocal
        })
      });
      
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Error al crear el local');
      }
      
      toast.success('¡Local creado exitosamente!')
      setNombreLocal('')
      setTipoLocal('RTL')
      setShowCreateForm(false)
      fetchLocales()
    } catch (error: unknown) {
      toast.error('Error al crear el local: ' + ((error as Error).message || (error as Error).toString()))
    } finally {
      toast.dismiss(loadingToast)
    }
  }

  const handleUpdateLocal = async (e: React.FormEvent, id: number) => {
    e.preventDefault()
    
    // Validaciones
    if (!nombreLocal.trim()) {
      toast.error('El nombre del local es requerido')
      return
    }
    
    const loadingToast = toast.loading('Actualizando local...')
    
    try {
      // Obtener el token de sesión
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        toast.error('No se pudo obtener la sesión de autenticación');
        toast.dismiss(loadingToast);
        return;
      }
      
      const response = await fetch('/api/locales', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: id,
          nombre_local: nombreLocal.trim(),
          tipo_local: tipoLocal
        })
      });
      
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Error al actualizar el local');
      }
      
      toast.success('¡Local actualizado exitosamente!')
      setEditingLocalId(null)
      fetchLocales()
    } catch (error: unknown) {
      toast.error('Error al actualizar el local: ' + ((error as Error).message || (error as Error).toString()))
    } finally {
      toast.dismiss(loadingToast)
    }
  }

  const handleDeleteLocal = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el local ${nombre}? Esta acción no se puede deshacer.`)) {
      return
    }
    
    const loadingToast = toast.loading('Eliminando local...')
    
    try {
      // Obtener el token de sesión
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        toast.error('No se pudo obtener la sesión de autenticación');
        toast.dismiss(loadingToast);
        return;
      }
      
      const response = await fetch('/api/locales', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: id })
      });
      
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Error al eliminar el local');
      }
      
      toast.success('¡Local eliminado exitosamente!')
      fetchLocales()
    } catch (error: unknown) {
      toast.error('Error al eliminar el local: ' + ((error as Error).message || (error as Error).toString()))
    } finally {
      toast.dismiss(loadingToast)
    }
  }

  const startEditing = (local: Local) => {
    setEditingLocalId(local.id)
    setNombreLocal(local.nombre_local)
    setTipoLocal(local.tipo_local)
  }

  const cancelEditing = () => {
    setEditingLocalId(null)
    setNombreLocal('')
    setTipoLocal('RTL')
  }

  // Filtrar locales según el término de búsqueda
  const filteredLocales = locales.filter(local => 
    local.nombre_local.toLowerCase().includes(searchTerm.toLowerCase()) ||
    local.tipo_local.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <p>Cargando...</p>

  // Verificar permisos
  if (!canManageLocales) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Permiso denegado</h3>
        <p>No tienes permisos para gestionar locales</p>
      </div>
    )
  }

  return (
    <div>
      <h2>Gestión de Locales</h2>
      
      {/* Formulario de creación */}
      {!showCreateForm ? (
        <button 
          onClick={() => setShowCreateForm(true)} 
          style={buttonStyle}
        >
          Crear Nuevo Local
        </button>
      ) : (
        <div style={cardStyle}>
          <h3>Crear Nuevo Local</h3>
          <form onSubmit={handleCreateLocal} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label>Nombre del Local: 
                <input 
                  type="text" 
                  value={nombreLocal} 
                  onChange={e => setNombreLocal(e.target.value)} 
                  style={inputStyle} 
                  required
                />
              </label>
            </div>
            <div>
              <label>Tipo de Local:
                <select 
                  value={tipoLocal} 
                  onChange={e => setTipoLocal(e.target.value)} 
                  style={inputStyle}
                >
                  <option value="FRA">FRA (Franquicia)</option>
                  <option value="RTL">RTL (Retail)</option>
                  <option value="SKA">SKA (Skate)</option>
                  <option value="WHS">WHS (Wholesale)</option>
                </select>
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="submit" style={buttonStyle}>Crear Local</button>
              <button 
                type="button" 
                onClick={() => {
                  setShowCreateForm(false)
                  setNombreLocal('')
                  setTipoLocal('RTL')
                }} 
                style={{...buttonStyle, backgroundColor: 'transparent', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#ccc', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#ccc', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: '#ccc', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#ccc', color: '#ccc'}}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Buscador de locales */}
      <div style={{ margin: '10px 0' }}>
        <input
          type="text"
          placeholder="Buscar locales por nombre o tipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={inputStyle}
        />
      </div>
      
      {/* Lista de locales */}
      <h3 style={{ marginTop: '20px' }}>Locales Existentes ({filteredLocales.length})</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '5px',
        marginTop: '20px'
      }}>
        {filteredLocales.length === 0 ? (
          <p>No se encontraron locales</p>
        ) : (
          filteredLocales.map(local => (
            <div key={local.id} style={{ 
              borderTopWidth: '1px',
              borderTopStyle: 'solid',
              borderTopColor: '#000',
              borderBottomWidth: '1px',
              borderBottomStyle: 'solid',
              borderBottomColor: '#000',
              borderLeftWidth: '1px',
              borderLeftStyle: 'solid',
              borderLeftColor: '#000',
              borderRightWidth: '1px',
              borderRightStyle: 'solid',
              borderRightColor: '#000',
              padding: '10px', 
              borderRadius: '4px',
              backgroundColor: '#FFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              {editingLocalId === local.id ? (
                // Formulario de edición
              <form onSubmit={(e) => handleUpdateLocal(e, local.id)} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label>Nombre del Local: 
                    <input 
                      type="text" 
                      value={nombreLocal} 
                      onChange={e => setNombreLocal(e.target.value)} 
                      style={inputStyle} 
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>Tipo de Local:
                    <select 
                      value={tipoLocal} 
                      onChange={e => setTipoLocal(e.target.value)} 
                      style={inputStyle}
                    >
                      <option value="FRA">FRA (Franquicia)</option>
                      <option value="RTL">RTL (Retail)</option>
                      <option value="SKA">SKA (Skate)</option>
                      <option value="WHS">WHS (Wholesale)</option>
                    </select>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="submit" style={buttonStyle}>Guardar Cambios</button>
                  <button 
                    type="button" 
                    onClick={cancelEditing} 
                    style={{...buttonStyle, backgroundColor: 'transparent', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#ccc', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#ccc', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: '#ccc', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#ccc', color: '#ccc'}}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
              ) : (
                // Vista de lectura
                <>
                  <div style={{ position: 'relative' }}>
                    <h3 style={{ 
                      margin: '0 0 10px 0', 
                      color: '#000',
                      fontSize: '1.4rem'
                    }}>
                      {local.nombre_local}
                    </h3>
                    <span style={{ 
                      position: 'absolute',
                      top: '0',
                      right: '0',
                      backgroundColor: '#000',
                      color: '#fff',
                      padding: '10px 10px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      margin: '-10px -10px 0 0',
                    }}>
                      {local.tipo_local}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button 
                      onClick={() => startEditing(local)} 
                      style={{...buttonStyle, backgroundColor: 'transparent', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#000', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#000', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: '#000', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#000', color: '#000'}}
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteLocal(local.id, local.nombre_local)} 
                      style={{...buttonStyle, backgroundColor: '#e63946', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#e63946', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#e63946', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: '#e63946', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#e63946', color: '#fff'}}
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}