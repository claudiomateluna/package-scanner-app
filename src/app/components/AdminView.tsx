'use client'

import { useState, useEffect, CSSProperties, useMemo, useRef, ReactNode, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import Papa from 'papaparse'
import { canUserManageRole, getAssignableRoles, roleHierarchy } from '@/lib/roleHierarchy'
import LocalesView from './LocalesView'

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
  backgroundColor: '#000', 
  color: '#FFF', 
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
function EditProfileForm({ profile, onSave, onCancel, currentUserRole, currentUserLocal, onLocalChange }: { profile: Profile, onSave: () => void, onCancel: () => void, currentUserRole: string, currentUserLocal: string | null, onLocalChange: (local: string, isChecked: boolean) => void }) {
  const [formData, setFormData] = useState(profile);
  const [newPassword, setNewPassword] = useState('');
  const [userLocals, setUserLocals] = useState<string[]>(profile.assigned_locals || []);
  const [allLocals, setAllLocals] = useState<string[]>([]);
  const [loadingLocals, setLoadingLocals] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // For search filter in user editing
  const [errors, setErrors] = useState<Record<string, string>>({}); // For inline validations
  
  // Obtener roles que el usuario actual puede asignar
  const assignableRoles = getAssignableRoles(currentUserRole);

  // Filter all locals based on search term
  const filteredLocals = useMemo(() => {
    if (!searchTerm) return allLocals;
    return allLocals.filter(local => 
      local.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allLocals, searchTerm]);

  // Validate form fields
  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'email':
        if (!value) return 'El email es requerido';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
        return '';
      case 'first_name':
        if (!value) return 'El nombre es requerido';
        if (value.length < 2) return 'El nombre debe tener al menos 2 caracteres';
        return '';
      case 'last_name':
        if (!value) return 'El apellido es requerido';
        if (value.length < 2) return 'El apellido debe tener al menos 2 caracteres';
        return '';
      case 'password':
        if (value && value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
        return '';
      default:
        return '';
    }
  };

  const handleFieldChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Cargar locales disponibles
  useEffect(() => {
    async function fetchLocals() {
      setLoadingLocals(true);
      const { data, error } = await supabase.from('locales').select('nombre_local').order('nombre_local');
      if (!error && data) {
        const locals = data.map(item => item.nombre_local).sort();
        setAllLocals(locals);
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
    
    // Validar todos los campos
    const newErrors: Record<string, string> = {};
    newErrors.email = validateField('email', formData.email || '');
    newErrors.first_name = validateField('first_name', formData.first_name || '');
    newErrors.last_name = validateField('last_name', formData.last_name || '');
    newErrors.password = validateField('password', newPassword);
    
    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    if (hasErrors) {
      setErrors(newErrors);
      toast.error('Por favor, corrige los errores en el formulario');
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
      <form onSubmit={handleUpdate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <label>Email: 
            <input 
              type="email" 
              value={formData.email || ''} 
              onChange={e => handleFieldChange('email', e.target.value)} 
              style={{
                ...inputStyle,
                borderColor: errors.email ? '#e63946' : '#ccc'
              }} 
            />
            {errors.email && <div style={{ color: '#e63946', fontSize: '0.8em', marginTop: '5px' }}>{errors.email}</div>}
          </label>
        </div>
        
        <div>
          <label>Nombre: 
            <input 
              type="text" 
              value={formData.first_name || ''} 
              onChange={e => handleFieldChange('first_name', e.target.value)} 
              style={{
                ...inputStyle,
                borderColor: errors.first_name ? '#e63946' : '#ccc'
              }} 
            />
            {errors.first_name && <div style={{ color: '#e63946', fontSize: '0.8em', marginTop: '5px' }}>{errors.first_name}</div>}
          </label>
        </div>
        
        <div>
          <label>Apellido: 
            <input 
              type="text" 
              value={formData.last_name || ''} 
              onChange={e => handleFieldChange('last_name', e.target.value)} 
              style={{
                ...inputStyle,
                borderColor: errors.last_name ? '#e63946' : '#ccc'
              }} 
            />
            {errors.last_name && <div style={{ color: '#e63946', fontSize: '0.8em', marginTop: '5px' }}>{errors.last_name}</div>}
          </label>
        </div>
        
        <div>
          <label>Nueva Contraseña (dejar en blanco para no cambiar): 
            <input 
              type="password" 
              value={newPassword} 
              onChange={e => {
                setNewPassword(e.target.value);
                // Clear error when user starts typing
                if (errors.password) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.password;
                    return newErrors;
                  });
                }
              }} 
              style={{
                ...inputStyle,
                borderColor: errors.password ? '#e63946' : '#ccc'
              }} 
            />
            {errors.password && <div style={{ color: '#e63946', fontSize: '0.8em', marginTop: '5px' }}>{errors.password}</div>}
          </label>
        </div>
        
        <div style={{ gridColumn: '1 / -1' }}>
          <label>Rol: 
            <select 
              value={formData.role || ''} 
              onChange={e => setFormData({...formData, role: e.target.value})} 
              style={inputStyle}
            >
              {assignableRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </div>
        
        {/* Selección de múltiples locales para Store Supervisor, Store Operator y SKA Operator */}
        {(formData.role === 'Store Supervisor' || formData.role === 'Store Operator' || formData.role === 'SKA Operator' || formData.role === 'Warehouse Supervisor' || formData.role === 'Warehouse Operator') && (
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Locales asignados:</label>
            {loadingLocals ? (
              <p>Cargando locales...</p>
            ) : (
              <div>
                {/* Search input for filtering locals */}
                <input
                  type="text"
                  placeholder="Buscar locales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    ...inputStyle,
                    marginBottom: '10px'
                  }}
                />
                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto', 
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
                  borderRadius: '5px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px'
                }}>
                  {filteredLocals.map(local => (
                    <div key={local} style={{ margin: '5px 0' }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={userLocals.includes(local)}
                          onChange={(e) => onLocalChange(local, e.target.checked)}
                        />
                        <span style={{ marginLeft: '5px' }}>{local}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="submit" style={buttonStyle}>Guardar Cambios</button>
          <button type="button" onClick={onCancel} style={{...buttonStyle, backgroundColor: 'transparent', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#ccc', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#ccc', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: '#ccc', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#ccc', color: '#ccc'}}>Cancelar</button>
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
  const [searchTerm, setSearchTerm] = useState(''); // For search filter in user creation
  const [userSearchTerm, setUserSearchTerm] = useState(''); // For user search filter
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]); // Filtered profiles for display
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userRole = profile?.role;
  const canUpload = userRole === 'administrador' || userRole === 'Warehouse Operator';
  const canManageUsers = userRole === 'administrador' || userRole === 'Warehouse Supervisor' || userRole === 'Store Supervisor' || userRole === 'Warehouse Operator';
  const canDeleteUsers = userRole === 'administrador' || userRole === 'Warehouse Supervisor' || userRole === 'Store Supervisor';
  const canManageLocales = userRole === 'administrador' || userRole === 'Warehouse Supervisor' || userRole === 'Warehouse Operator';
  
  // Verificar si es Store Supervisor
  const isStoreSupervisor = userRole === 'Store Supervisor';
  
  // Obtener roles que el usuario actual puede asignar
  const assignableRoles = getAssignableRoles(userRole || '');

  // Tabs state
  const [activeTab, setActiveTab] = useState<'users' | 'locales'>('users');

  // Filter available locals based on search term
  const filteredLocals = useMemo(() => {
    if (!searchTerm) return availableLocals;
    return availableLocals.filter(local => 
      local.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableLocals, searchTerm]);

  // Debounced search for users
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (!userSearchTerm) {
        setFilteredProfiles(profiles);
        return;
      }

      const term = userSearchTerm.toLowerCase();
      const filtered = profiles.filter(profile => {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
        const email = profile.email?.toLowerCase() || '';
        const locals = profile.assigned_locals?.join(' ').toLowerCase() || '';
        return fullName.includes(term) || email.includes(term) || locals.includes(term);
      });

      setFilteredProfiles(filtered);
    }, 250);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [userSearchTerm, profiles]);

  // Highlight search terms in text
  const highlightText = (text: string | null | undefined, searchTerm: string) => {
    if (!text || !searchTerm) return text || '';
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index} style={{ backgroundColor: '#000', color: '#FFF' }}>{part}</mark> : part
    );
  };

  // Cargar locales disponibles
  useEffect(() => {
    async function fetchLocals() {
      setLoadingLocals(true);
      
      if (isStoreSupervisor && profile?.id) {
        // Para Store Supervisor, obtener solo sus locales asignados
        const { data: userLocalsData, error: userLocalsError } = await supabase.from('user_locals').select('local_name').eq('user_id', profile.id);
        if (!userLocalsError && userLocalsData) {
          // Obtener los detalles completos de los locales asignados
          const localNames = userLocalsData.map(item => item.local_name);
          const { data: localsData, error: localsError } = await supabase
            .from('locales')
            .select('nombre_local')
            .in('nombre_local', localNames)
            .order('nombre_local');
          
          if (!localsError && localsData) {
            const locals = localsData.map(item => item.nombre_local).sort();
            setAvailableLocals(locals);
          }
        }
      } else if (canManageUsers) {
        // Para otros usuarios con permisos, obtener todos los locales de la tabla locales
        const { data, error } = await supabase.from('locales').select('nombre_local').order('nombre_local');
        if (!error && data) {
          const locals = data.map(item => item.nombre_local).sort();
          setAvailableLocals(locals);
        }
      }
      
      setLoadingLocals(false);
    }
    
    fetchLocals();
  }, [canManageUsers, isStoreSupervisor, profile?.id]);

  const fetchProfiles = useCallback(async function fetchProfiles() {
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
      let profilesWithLocals: Profile[] = Object.values(profilesMap)
      
      // Aplicar filtrado según jerarquía de roles y locales asignados
      if (profile?.role && profile.id) {
        const userRank = roleHierarchy[profile.role];
        if (userRank !== undefined) {
          // Para Store Supervisor: filtrar solo usuarios con locales que coincidan con los suyos
          if (profile.role === 'Store Supervisor') {
            // Obtener locales del supervisor actual
            const { data: currentUserLocalsData, error: currentUserLocalsError } = await supabase
              .from('user_locals')
              .select('local_name')
              .eq('user_id', profile.id);
            
            if (!currentUserLocalsError && currentUserLocalsData) {
              const currentUserLocals = currentUserLocalsData.map(item => item.local_name);
              // Filtrar perfiles que tengan al menos un local en común con el supervisor
              profilesWithLocals = profilesWithLocals.filter(p => {
                // Mostrar al propio usuario
                if (p.id === profile.id) return true;
                
                // Los usuarios con roles superiores no deben ser visibles
                const targetRank = roleHierarchy[p.role || ''];
                if (targetRank !== undefined && targetRank < userRank) return false;
                
                // Filtrar por locales asignados
                if (p.assigned_locals && p.assigned_locals.length > 0) {
                  return p.assigned_locals.some(local => currentUserLocals.includes(local));
                }
                return false; // Si no tiene locales asignados, no se muestra
              });
            }
          } else {
            // Para otros roles: filtrar usuarios con nivel superior en la jerarquía
            profilesWithLocals = profilesWithLocals.filter(p => {
              // Mostrar al propio usuario
              if (p.id === profile.id) return true;
              
              // Ocultar usuarios con rol superior en la jerarquía
              const targetRank = roleHierarchy[p.role || ''];
              if (targetRank !== undefined && targetRank < userRank) return false;
              
              return true;
            });
          }
        }
      }
      
      setProfiles(profilesWithLocals)
    } catch (error: unknown) {
      toast.error('Error inesperado al cargar los perfiles: ' + ((error as Error).message || (error as Error).toString()))
    }
    setLoading(false)
  }, [profile?.id, profile?.role])

  useEffect(() => { 
    if (canManageUsers) { 
      fetchProfiles() 
    } else { 
      setLoading(false)
    } 
  }, [canManageUsers, fetchProfiles])

  useEffect(() => {
    setFilteredProfiles(profiles);
  }, [profiles]);

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
      {/* Pulse animation for loading indicator */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
      
      <h2>Panel de Administración</h2>
      
      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #000',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            ...buttonStyle,
            backgroundColor: activeTab === 'users' ? '#000' : 'transparent',
            color: activeTab === 'users' ? '#FFF' : '#000',
            borderBottom: activeTab === 'users' ? '3px solid #000' : 'none',
            borderRadius: '5px 5px 0 0',
            marginRight: '5px'
          }}
        >
          Usuarios
        </button>
        {canManageLocales && (
          <button
            onClick={() => setActiveTab('locales')}
            style={{
              ...buttonStyle,
              backgroundColor: activeTab === 'locales' ? '#000' : 'transparent',
              color: activeTab === 'locales' ? '#FFF' : '#000',
              borderBottom: activeTab === 'locales' ? '3px solid #000' : 'none',
              borderRadius: '5px 5px 0 0'
            }}
          >
            Locales
          </button>
        )}
      </div>
      
      {/* Tab Content */}
      {activeTab === 'users' ? (
        <>
          {canUpload && <DataUploader />}
          
          {canManageUsers && (
            <>
          <div style={cardStyle}>
            <h3>Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label>Nombre: 
                  <input 
                    type="text" 
                    placeholder="Nombre" 
                    value={firstName} 
                    onChange={e => setFirstName(e.target.value)} 
                    style={inputStyle} 
                    required
                  />
                </label>
              </div>
              
              <div>
                <label>Apellido: 
                  <input 
                    type="text" 
                    placeholder="Apellido" 
                    value={lastName} 
                    onChange={e => setLastName(e.target.value)} 
                    style={inputStyle} 
                    required
                  />
                </label>
              </div>
              
              <div>
                <label>Email: 
                  <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    style={inputStyle}
                  />
                </label>
              </div>
              
              <div>
                <label>Contraseña: 
                  <input 
                    type="password" 
                    placeholder="Contraseña" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    style={inputStyle}
                  />
                </label>
              </div>
              
              <div style={{ gridColumn: '1 / -1' }}>
                {/* Selector de rol limitado por jerarquía */}
                <label>Rol:
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
                </label>
              </div>
              
              {/* Selección de múltiples locales para Store Supervisor, Store Operator y SKA Operator */}
              {(role === 'Store Supervisor' || role === 'Store Operator' || role === 'SKA Operator' || role === 'Warehouse Supervisor' || role === 'Warehouse Operator') && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Locales asignados:</label>
                  {loadingLocals ? (
                    <p>Cargando locales...</p>
                  ) : (
                    <div>
                      {/* Search input for filtering locals */}
                      <input
                        type="text"
                        placeholder="Buscar locales..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          ...inputStyle,
                          marginBottom: '10px'
                        }}
                      />
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
                        {filteredLocals.map(local => (
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
                    </div>
                  )}
                </div>
              )}
              
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" style={buttonStyle}>Crear Usuario</button>
              </div>
            </form>
          </div>

          <h3 style={{ marginTop: '24px' }}>Usuarios Existentes</h3>
          {/* Search input for users */}
          <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Buscar usuarios por nombre, email o local..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              style={inputStyle}
            />
            {userSearchTerm && (
              <button 
                onClick={() => setUserSearchTerm('')} 
                style={{...buttonStyle, padding: '10px 15px'}}
              >
                Limpiar
              </button>
            )}
          </div>
          
          {/* Users grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '20px',
            marginTop: '20px'
          }}>
            {filteredProfiles.map(p => (
              <div key={p.id} style={{ 
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
                borderRadius: '8px',
                backgroundColor: '#FFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', color: '#000' }}>
                      {highlightText(p.first_name, userSearchTerm) || 'N/A'} {highlightText(p.last_name, userSearchTerm) || 'N/A'}
                    </h4>
                    <p style={{ margin: '5px 0', color: '#000' }}>
                      <strong>Email:</strong> {highlightText(p.email, userSearchTerm) || 'Email no disponible'}
                    </p>
                    <p style={{ margin: '5px 0', color: '#000' }}>
                      <strong>Rol:</strong> <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        backgroundColor: p.role === 'administrador' ? '#e63946' : 
                                       p.role === 'Warehouse Supervisor' ? '#457b9d' : 
                                       p.role === 'Warehouse Operator' ? '#8ac926' : 
                                       p.role === 'Store Supervisor' ? '#ff9e00' : 
                                       '#9d4edd',
                        color: '#fff'
                      }}>{highlightText(p.role, userSearchTerm)}</span>
                    </p>
                    <p style={{ margin: '5px 0', color: '#000' }}>
                      <strong>Locales:</strong> {p.assigned_locals && p.assigned_locals.length > 0 ? 
                        p.assigned_locals.map(local => highlightText(local, userSearchTerm)).reduce((prev, curr, idx) => idx === 0 ? [curr] : [...prev, ', ', curr], [] as ReactNode[]) : 'N/A'}
                    </p>
                  </div>
                  {editingProfileId === p.id && (
                    <div style={{ 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      backgroundColor: '#000',
                      animation: 'pulse 1.5s infinite'
                    }} />
                  )}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginTop: '15px',
                  flexWrap: 'wrap'
                }}>
                  <button 
                    onClick={() => setEditingProfileId(p.id)} 
                    style={{
                      ...buttonStyle, 
                      backgroundColor: 'transparent', 
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
                      color: '#000',
                      padding: '8px 12px',
                      fontSize: '0.9em'
                    }}
                  >
                    Editar
                  </button>
                  {canDeleteUsers && 
                   canUserManageRole(userRole || '', p.role || '', null, p.local_asignado || null) && (
                    <button 
                      onClick={() => handleDeleteUser(p.id, p.email || 'Usuario', p.role || '', p.local_asignado || null)} 
                      style={{
                        ...buttonStyle, 
                        backgroundColor: '#e63946', 
                        borderTopWidth: '1px', 
                        borderTopStyle: 'solid', 
                        borderTopColor: '#e63946', 
                        borderBottomWidth: '1px', 
                        borderBottomStyle: 'solid', 
                        borderBottomColor: '#e63946', 
                        borderLeftWidth: '1px', 
                        borderLeftStyle: 'solid', 
                        borderLeftColor: '#e63946', 
                        borderRightWidth: '1px', 
                        borderRightStyle: 'solid', 
                        borderRightColor: '#e63946', 
                        color: '#fff',
                        padding: '8px 12px',
                        fontSize: '0.9em'
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
                
                {editingProfileId === p.id && (
                  <EditProfileForm 
                    profile={p} 
                    onSave={() => { 
                      setEditingProfileId(null); 
                      fetchProfiles(); 
                    }} 
                    onCancel={() => setEditingProfileId(null)} 
                    currentUserRole={userRole} 
                    currentUserLocal={null} 
                    onLocalChange={handleLocalChange} 
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  ) : (
    /* Locales Tab */
    <LocalesView profile={profile} />
  )}
</div>
  )
}