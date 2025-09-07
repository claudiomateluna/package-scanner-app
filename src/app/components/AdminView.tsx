'use client'

import { useState, useEffect, CSSProperties } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import Papa from 'papaparse'
import { canUserManageRole, getAssignableRoles } from '@/lib/roleHierarchy'

// --- Tipos de Datos ---
type ProfileFromProps = { role: string | null; id: string; }
interface AdminViewProps { profile: ProfileFromProps; }

interface ProfileData {
  id: string;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  assigned_locals?: string[];
  local_asignado?: string | null;
  email?: string | null;
}

interface UserLocal {
  user_id: string;
  local_name: string;
}

// ProfilesMap se eliminó ya que no se usaba

type Profile = ProfileData;

// --- Estilos Reutilizables ---
const inputStyle: CSSProperties = { 
  width: '100%',
  padding: '10px',
  backgroundColor: '#fff',
  color: '#000',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: '#ccc',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: '#ccc',
  borderLeftWidth: '1px',
  borderLeftStyle: 'solid',
  borderLeftColor: '#ccc',
  borderRightWidth: '1px',
  borderRightStyle: 'solid',
  borderRightColor: '#ccc',
  borderRadius: '5px',
  boxSizing: 'border-box',
  margin: '5px'
};

const buttonStyle: CSSProperties = { 
  padding: '10px 15px', 
  backgroundColor: '#FE7F2D', 
  color: '#233D4D', 
  border: 'none', 
  borderRadius: '5px', 
  cursor: 'pointer' 
};

const cardStyle: CSSProperties = { 
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: '#555',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: '#555',
  borderLeftWidth: '1px',
  borderLeftStyle: 'solid',
  borderLeftColor: '#555',
  borderRightWidth: '1px',
  borderRightStyle: 'solid',
  borderRightColor: '#555',
  padding: '16px', 
  borderRadius: '8px', 
  marginTop: '24px' 
};

// --- Componente de Carga de Archivos ---
function DataUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) { setFile(e.target.files[0]); }
  };

  const handleUpload = () => {
    if (!file) { return toast.error('Por favor, selecciona un archivo CSV.'); }
    setUploading(true);
    const loadingToast = toast.loading('Procesando archivo...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        toast.dismiss(loadingToast);
        const loadingUploadToast = toast.loading('Cargando datos a la base de datos...');
        const response = await fetch('/api/upload-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(results.data) });
        toast.dismiss(loadingUploadToast);
        if (response.ok) { toast.success('¡Datos cargados exitosamente!'); } 
        else { const { error } = await response.json(); toast.error(`Error al cargar: ${error}`); }
        setUploading(false);
        setFile(null);
      },
      error: (error) => {
        toast.dismiss(loadingToast);
        toast.error(`Error al leer el archivo: ${error.message}`);
        setUploading(false);
      }
    });
  };

  return (
    <div style={cardStyle}>
      <h3>Cargar Datos</h3>
      <p>Sube un archivo CSV para añadir o actualizar los paquetes esperados.</p>
      <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
        <input type="file" accept=".csv" onChange={handleFileChange} disabled={uploading} />
        <button onClick={handleUpload} disabled={uploading || !file} style={buttonStyle}>
          {uploading ? 'Cargando...' : 'Cargar Archivo'}
        </button>
      </div>
    </div>
  );
}

// --- Componente para Editar Perfil ---
function EditProfileForm({ profile, onSave, onCancel, currentUserRole, currentUserLocal }: { profile: Profile, onSave: () => void, onCancel: () => void, currentUserRole: string, currentUserLocal: string | null }) {
  const [formData, setFormData] = useState(profile);
  const [newPassword, setNewPassword] = useState('');
  const [userLocals, setUserLocals] = useState<string[]>(profile.assigned_locals || []);
  const [allLocals, setAllLocals] = useState<string[]>([]);
  const [loadingLocals, setLoadingLocals] = useState(true);
  
  // Obtener roles que el usuario actual puede asignar
  const assignableRoles = getAssignableRoles(currentUserRole);

  // Cargar locales disponibles
  useEffect(() => {
    async function fetchLocals() {
      setLoadingLocals(true);
      const { data, error } = await supabase.from('data').select('Local');
      if (!error && data) {
        const uniqueLocals = [...new Set(data.map(item => item.Local))].sort();
        setAllLocals(uniqueLocals);
      }
      setLoadingLocals(false);
    }
    
    // Cargar locales del usuario
    async function fetchUserLocals() {
      const { data, error } = await supabase.from('user_locals').select('local_name').eq('user_id', profile.id);
      if (!error && data) {
        setUserLocals(data.map(item => item.local_name));
      }
    }
    
    fetchLocals();
    fetchUserLocals();
  }, [profile.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar si el usuario actual puede gestionar al usuario objetivo
    if (!canUserManageRole(currentUserRole, profile.role || '', currentUserLocal, profile.local_asignado || null)) {
      toast.error('No tienes permisos para editar usuarios con ese rol');
      return;
    }
    
    // Obtener el token de sesión
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      toast.error('No se pudo obtener la sesión de autenticación');
      return;
    }
    
    const loadingToast = toast.loading('Actualizando usuario...');
    const updateData = { 
      id: formData.id, 
      password: newPassword || undefined, 
      role: formData.role, 
      first_name: formData.first_name, 
      last_name: formData.last_name,
      email: formData.email,
      assigned_locals: userLocals
    };
    const response = await fetch('/api/update-user', { 
      method: 'PATCH', 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }, 
      body: JSON.stringify(updateData) 
    });
    toast.dismiss(loadingToast);
    if (response.ok) { 
      toast.success('Usuario actualizado'); 
      onSave(); 
    }
    else { 
      const { error } = await response.json(); 
      toast.error(`Error: ${error}`); 
    }
  };

  const handleLocalChange = (local: string, isChecked: boolean) => {
    if (isChecked) {
      setUserLocals(prev => [...prev, local]);
    } else {
      setUserLocals(prev => prev.filter(l => l !== local));
    }
  };

  // Verificar permisos antes de renderizar el formulario
  if (!canUserManageRole(currentUserRole, profile.role || '', currentUserLocal, profile.local_asignado || null)) {
    return (
      <div style={{ 
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: '#A1C181',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: '#A1C181',
        borderLeftWidth: '1px',
        borderLeftStyle: 'solid',
        borderLeftColor: '#A1C181',
        borderRightWidth: '1px',
        borderRightStyle: 'solid',
        borderRightColor: '#A1C181',
        padding: '16px', 
        borderRadius: '8px', 
        marginTop: '8px' 
      }}>
        <h4>Permiso denegado</h4>
        <p>No tienes permisos para editar usuarios con ese rol.</p>
        <button onClick={onCancel} style={{...buttonStyle, backgroundColor: 'transparent', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#ccc', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#ccc', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: '#ccc', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#ccc', color: '#ccc'}}>Cancelar</button>
      </div>
    );
  }

  return (
    <div style={{ 
      borderTopWidth: '1px',
      borderTopStyle: 'solid',
      borderTopColor: '#A1C181',
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      borderBottomColor: '#A1C181',
      borderLeftWidth: '1px',
      borderLeftStyle: 'solid',
      borderLeftColor: '#A1C181',
      borderRightWidth: '1px',
      borderRightStyle: 'solid',
      borderRightColor: '#A1C181',
      padding: '16px', 
      borderRadius: '8px', 
      marginTop: '8px' 
    }}>
      <h4>Editando Perfil</h4>
      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label>Email: 
          <input 
            type="email" 
            value={formData.email || ''} 
            onChange={e => setFormData({...formData, email: e.target.value})} 
            style={inputStyle} 
          />
        </label>
        <label>Nombre: 
          <input 
            type="text" 
            value={formData.first_name || ''} 
            onChange={e => setFormData({...formData, first_name: e.target.value})} 
            style={inputStyle} 
          />
        </label>
        <label>Apellido: 
          <input 
            type="text" 
            value={formData.last_name || ''} 
            onChange={e => setFormData({...formData, last_name: e.target.value})} 
            style={inputStyle} 
          />
        </label>
        <label>Nueva Contraseña (dejar en blanco para no cambiar): 
          <input 
            type="password" 
            value={newPassword} 
            onChange={e => setNewPassword(e.target.value)} 
            style={inputStyle} 
          />
        </label>
        <label>Rol: 
          <select 
            value={formData.role || ''} 
            onChange={e => setFormData({...formData, role: e.target.value})} 
            style={inputStyle}
          >
            {assignableRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        
        {/* Selección de múltiples locales para Store Supervisor y Store Operator */}
        {(formData.role === 'Store Supervisor' || formData.role === 'Store Operator' || formData.role === 'Warehouse Supervisor' || formData.role === 'Warehouse Operator') && (
          <div>
            <label>Locales asignados:</label>
            {loadingLocals ? (
              <p>Cargando locales...</p>
            ) : (
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto', 
                borderTopWidth: '1px', 
                borderTopStyle: 'solid', 
                borderTopColor: '#ccc', 
                borderBottomWidth: '1px', 
                borderBottomStyle: 'solid', 
                borderBottomColor: '#ccc', 
                borderLeftWidth: '1px', 
                borderLeftStyle: 'solid', 
                borderLeftColor: '#ccc', 
                borderRightWidth: '1px', 
                borderRightStyle: 'solid', 
                borderRightColor: '#ccc', 
                padding: '10px', 
                borderRadius: '5px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px'
              }}>
                {allLocals.map(local => (
                  <div key={local} style={{ margin: '5px 0' }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={userLocals.includes(local)}
                        onChange={(e) => handleLocalChange(local, e.target.checked)}
                      />
                      <span style={{ marginLeft: '5px' }}>{local}</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div>
          <button type="submit" style={buttonStyle}>Guardar Cambios</button>
          <button type="button" onClick={onCancel} style={{...buttonStyle, backgroundColor: 'transparent', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#ccc', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#ccc', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: '#ccc', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#ccc', color: '#ccc', marginLeft: '8px'}}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

// --- Componente Principal de Administración ---
export default function AdminView({ profile }: AdminViewProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [role, setRole] = useState('Store Operator'); 
  const [firstName, setFirstName] = useState(''); 
  const [lastName, setLastName] = useState('');
  const [availableLocals, setAvailableLocals] = useState<string[]>([]);
  const [userLocals, setUserLocals] = useState<string[]>([]);
  const [loadingLocals, setLoadingLocals] = useState(true);

  const userRole = profile?.role;
  const canUpload = userRole === 'administrador' || userRole === 'Warehouse Operator';
  const canManageUsers = userRole === 'administrador' || userRole === 'Warehouse Supervisor' || userRole === 'Store Supervisor' || userRole === 'Warehouse Operator';
  const canDeleteUsers = userRole === 'administrador' || userRole === 'Warehouse Supervisor' || userRole === 'Store Supervisor';
  
  // Verificar si es Store Supervisor
  const isStoreSupervisor = userRole === 'Store Supervisor';
  
  // Obtener roles que el usuario actual puede asignar
  const assignableRoles = getAssignableRoles(userRole || '');

  // Cargar locales disponibles
  useEffect(() => {
    async function fetchLocals() {
      setLoadingLocals(true);
      
      if (isStoreSupervisor && profile?.id) {
        // Para Store Supervisor, obtener solo sus locales asignados
        const { data, error } = await supabase.from('user_locals').select('local_name').eq('user_id', profile.id);
        if (!error && data) {
          const locals = data.map(item => item.local_name).sort();
          setAvailableLocals(locals);
        }
      } else if (canManageUsers) {
        // Para otros usuarios con permisos, obtener todos los locales
        const { data, error } = await supabase.from('data').select('Local');
        if (!error && data) {
          const uniqueLocals = [...new Set(data.map(item => item.Local))].sort();
          setAvailableLocals(uniqueLocals);
        }
      }
      
      setLoadingLocals(false);
    }
    
    fetchLocals();
  }, [canManageUsers, isStoreSupervisor, profile?.id]);

  async function fetchProfiles() {
    setLoading(true)
    try {
      // Obtener todos los perfiles
      const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*')
      if (profilesError) { 
        toast.error('Error al cargar los perfiles: ' + profilesError.message) 
        setLoading(false)
        return
      }
      
      // Obtener todos los locales asignados
      const { data: userLocalsData, error: userLocalsError } = await supabase.from('user_locals').select('*')
      if (userLocalsError) { 
        toast.error('Error al cargar los locales asignados: ' + userLocalsError.message) 
        setLoading(false)
        return
      }
      
      // Combinar los datos de perfiles con los locales asignados
      const profilesMap: Record<string, Profile> = profilesData.reduce((acc: Record<string, Profile>, profile: ProfileData) => {
        acc[profile.id] = {
          ...profile,
          assigned_locals: []
        }
        return acc
      }, {})

      // Agregar los locales asignados a cada perfil
      userLocalsData.forEach((local: UserLocal) => {
        if (profilesMap[local.user_id]) {
          profilesMap[local.user_id].assigned_locals!.push(local.local_name)
        }
      })

      // Convertir el mapa en array
      const profilesWithLocals: Profile[] = Object.values(profilesMap)
      
      setProfiles(profilesWithLocals)
    } catch (error: unknown) {
      toast.error('Error inesperado al cargar los perfiles: ' + ((error as Error).message || (error as Error).toString()))
    }
    setLoading(false)
  }

  useEffect(() => { 
    if (canManageUsers) { 
      fetchProfiles() 
    } else { 
      setLoading(false)
    } 
  }, [canManageUsers])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Si es Store Supervisor, verificar que solo esté asignando locales que le pertenecen
    if (isStoreSupervisor) {
      const unauthorizedLocals = userLocals.filter(local => !availableLocals.includes(local));
      if (unauthorizedLocals.length > 0) {
        toast.error('No tienes permiso para asignar los siguientes locales: ' + unauthorizedLocals.join(', '));
        return;
      }
    }
    
    // Obtener el token de sesión
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      toast.error('No se pudo obtener la sesión de autenticación');
      return;
    }
    
    const loadingToast = toast.loading('Creando usuario...')
    const response = await fetch('/api/create-user', { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        email, 
        password, 
        role, 
        first_name: firstName, 
        last_name: lastName,
        assigned_locals: userLocals
      }) 
    })
    toast.dismiss(loadingToast)
    if (response.ok) {
      toast.success('¡Usuario creado exitosamente!');
      setEmail(''); 
      setPassword(''); 
      setFirstName(''); 
      setLastName('');
      setUserLocals([]);
      fetchProfiles()
    } else {
      const { error } = await response.json()
      toast.error(`Error: ${error}`)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string, userRole: string, userLocal: string | null) => {
    console.log('Iniciando eliminación de usuario:', { userId, userEmail, userRole, userLocal });
    
    // Verificar permisos de jerarquía
    const canManage = canUserManageRole(profile?.role || '', userRole, null, userLocal);
    console.log('Permiso de gestión:', canManage);
    
    if (!canManage) {
      toast.error('No tienes permisos para eliminar usuarios con ese rol');
      return;
    }
    
    if (!canDeleteUsers) {
      toast.error('No tienes permisos para eliminar usuarios');
      return;
    }
    
    if (!window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${userEmail}? Esta acción no se puede deshacer.`)) {
      console.log('Eliminación cancelada por el usuario');
      return;
    }
    
    // Obtener el token de sesión
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    console.log('Token de sesión obtenido:', token ? 'Sí' : 'No');
    
    if (!token) {
      toast.error('No se pudo obtener la sesión de autenticación');
      return;
    }
    
    const loadingToast = toast.loading('Eliminando usuario...')
    console.log('Enviando solicitud de eliminación...');
    
    try {
      const response = await fetch('/api/delete-user', { 
        method: 'DELETE', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: userId })
      })
      
      console.log('Respuesta recibida:', response.status, response.statusText);
      toast.dismiss(loadingToast)
      
      if (response.ok) {
        const result = await response.json();
        console.log('Resultado de eliminación:', result);
        toast.success('¡Usuario eliminado exitosamente!');
        fetchProfiles()
      } else {
        const errorData = await response.json()
        console.error('Error en eliminación:', errorData);
        toast.error(`Error: ${errorData.error || 'Error desconocido al eliminar usuario'}`)
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast.dismiss(loadingToast)
      toast.error('Error de conexión al eliminar usuario')
    }
  }

  const handleLocalChange = (local: string, isChecked: boolean) => {
    if (isChecked) {
      setUserLocals(prev => [...prev, local]);
    } else {
      setUserLocals(prev => prev.filter(l => l !== local));
    }
  };

  if (loading) return <p>Cargando...</p>

  return (
    <div>
      <h2>Panel de Administración</h2>
      {canUpload && <DataUploader />}
      
      {canManageUsers && (
        <>
          <div style={cardStyle}>
            <h3>Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreateUser} style={{ display: 'block', gap: '10px' }}>
              <input type="text" placeholder="Nombre" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width:'50%', padding: '10px', backgroundColor: '#fff', color: '#000', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#ccc', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#ccc', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: '#ccc', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#ccc', borderRadius: '5px', boxSizing: 'border-box', margin: '5px'}} />
              <input type="text" placeholder="Apellido" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width:'50%', padding: '10px', backgroundColor: '#fff', color: '#000', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#ccc', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#ccc', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: '#ccc', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#ccc', borderRadius: '5px', boxSizing: 'border-box', margin: '5px'}} />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle}/>
              <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle}/>
              
              {/* Selector de rol limitado por jerarquía */}
              <select 
                value={role} 
                onChange={e => setRole(e.target.value)} 
                required 
                style={inputStyle}
              >
                {assignableRoles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              
              {/* Selección de múltiples locales para Store Supervisor y Store Operator */}
              {(role === 'Store Supervisor' || role === 'Store Operator' || role === 'Warehouse Supervisor' || role === 'Warehouse Operator') && (
                <div>
                  <label>Locales asignados:</label>
                  {loadingLocals ? (
                    <p>Cargando locales...</p>
                  ) : (
                    <div style={{ 
                      maxHeight: '200px', 
                      overflowY: 'auto', 
                      borderTopWidth: '1px', 
                      borderTopStyle: 'solid', 
                      borderTopColor: '#ccc', 
                      borderBottomWidth: '1px', 
                      borderBottomStyle: 'solid', 
                      borderBottomColor: '#ccc', 
                      borderLeftWidth: '1px', 
                      borderLeftStyle: 'solid', 
                      borderLeftColor: '#ccc', 
                      borderRightWidth: '1px', 
                      borderRightStyle: 'solid', 
                      borderRightColor: '#ccc', 
                      padding: '10px', 
                      borderRadius: '5px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px'
                    }}>
                      {availableLocals.map(local => (
                        <div key={local} style={{ margin: '5px 0' }}>
                          <label>
                            <input
                              type="checkbox"
                              checked={userLocals.includes(local)}
                              onChange={(e) => handleLocalChange(local, e.target.checked)}
                            />
                            <span style={{ marginLeft: '5px' }}>{local}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <button type="submit" style={buttonStyle}>Crear Usuario</button>
            </form>
          </div>

          <h3 style={{ marginTop: '24px' }}>Usuarios Existentes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profiles.map(p => (
              <div key={p.id} style={{ 
                borderTopWidth: '1px',
                borderTopStyle: 'solid',
                borderTopColor: '#555',
                borderBottomWidth: '1px',
                borderBottomStyle: 'solid',
                borderBottomColor: '#555',
                borderLeftWidth: '1px',
                borderLeftStyle: 'solid',
                borderLeftColor: '#555',
                borderRightWidth: '1px',
                borderRightStyle: 'solid',
                borderRightColor: '#555',
                padding: '12px', 
                borderRadius: '8px' 
              }}>
                <p><b>Email:</b> {p.email || 'Email no disponible'}</p>
                <p><b>Nombre:</b> {p.first_name || 'N/A'} {p.last_name || 'N/A'}</p>
                <p><b>Rol:</b> {p.role}</p>
                <p><b>Locales:</b> {p.assigned_locals && p.assigned_locals.length > 0 ? p.assigned_locals.join(', ') : 'N/A'}</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button onClick={() => setEditingProfileId(p.id)} style={{...buttonStyle, backgroundColor: 'transparent', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#ccc', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#ccc', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: '#ccc', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#ccc', color: '#ccc'}}>Editar</button>
                  {canDeleteUsers && 
                   canUserManageRole(userRole || '', p.role || '', null, p.local_asignado || null) && (
                    <button 
                      onClick={() => handleDeleteUser(p.id, p.email || 'Usuario', p.role || '', p.local_asignado || null)} 
                      style={{...buttonStyle, backgroundColor: '#e63946', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#e63946', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#e63946', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: '#e63946', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#e63946', color: '#fff'}}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
                {editingProfileId === p.id && <EditProfileForm profile={p} onSave={() => { setEditingProfileId(null); fetchProfiles(); }} onCancel={() => setEditingProfileId(null)} currentUserRole={userRole} currentUserLocal={null} />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}