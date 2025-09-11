'use client'

import { useState, useEffect, CSSProperties } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { Session } from '@supabase/supabase-js'

type Profile = { role: string | null; local_asignado?: string | null; }

// Define the Local type based on the new locales table
interface Local {
  id: number;
  tipo_local: 'FRA' | 'RTL' | 'SKA' | 'WHS';
  nombre_local: string;
}

interface Props {
  profile: Profile;
  onSelectionComplete: (selection: { local: string; fecha: string; }) => void;
  session: Session;
}

// --- Estilos para este componente específico ---
const styles: { [key: string]: CSSProperties } = {
  centeringWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // Ocupa el alto de la pantalla menos un estimado del alto del header
    minHeight: 'calc(90vh - 100px)', 
  },
  formContainer: {
    width: '100%',
    maxWidth: '500px',
    padding: '30px',
    backgroundColor: '#ffffff',
    border: '1px solid #dddddd',
    borderRadius: '8px',
  },
  title: {
    color: '#000000',
    textAlign: 'center',
    marginBottom: '30px'
  },
  buttonPrimary: {
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    padding: '12px 20px',
    cursor: 'pointer',
    borderRadius: '5px',
    fontWeight: 'bold',
    fontSize: '1.2em',
    width: '100%',
    marginTop: '20px'
  },
  input: {
    width: '100%',
    padding: '12px',
    marginTop: '8px',
    backgroundColor: '#ffffff',
    color: '#000000',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#dddddd',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#dddddd',
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: '#dddddd',
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: '#dddddd',
    borderRadius: '5px',
    fontSize: '1em',
    boxSizing: 'border-box' // Añadido para prevenir desbordamiento
  },
  label: {
    display: 'block',
    textAlign: 'left',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#000000'
  }
};

export default function SelectionScreen({ profile, onSelectionComplete, session }: Props) {
  const [availableLocals, setAvailableLocals] = useState<Local[]>([]);
  const [selectedLocal, setSelectedLocal] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const isAdminType = profile.role === 'administrador' || profile.role === 'Warehouse Supervisor' || profile.role === 'Warehouse Operator';
  const isStoreType = profile.role === 'Store Supervisor' || profile.role === 'Store Operator' || profile.role === 'SKA Operator';

  useEffect(() => {
    async function fetchLocals() {
      console.log('SelectionScreen: fetchLocals iniciado');
      console.log('SelectionScreen: profile.role:', profile.role);
      console.log('SelectionScreen: session?.user?.id:', session?.user?.id);
      
      try {
        // Para usuarios administradores o warehouse, obtener todos los locales de la tabla locales
        if (profile.role === 'administrador' || profile.role === 'Warehouse Supervisor' || profile.role === 'Warehouse Operator') {
          console.log('SelectionScreen: Usuario administrador o warehouse, obteniendo todos los locales');
          const { data, error } = await supabase.from('locales').select('*').order('tipo_local').order('nombre_local');
          
          if (error) {
            console.error('Error cargando locales:', error);
            toast.error('No se pudieron cargar los locales del sistema.');
            return;
          }
          
          if (!data || data.length === 0) {
            console.warn('No se encontraron locales en la tabla locales');
            toast.error('No hay locales disponibles en el sistema.');
            return;
          }
          
          console.log('SelectionScreen: Locales cargados:', data);
          setAvailableLocals(data);
          
          // Para usuarios Warehouse, verificar si tienen locales asignados para usar como predeterminado
          if ((profile.role === 'Warehouse Supervisor' || profile.role === 'Warehouse Operator') && session?.user?.id) {
            console.log('SelectionScreen: Usuario Warehouse, verificando locales asignados');
            try {
              const { data: userLocalsData, error: userLocalsError } = await supabase
                .from('user_locals')
                .select('local_name')
                .eq('user_id', session.user.id);
              
              if (!userLocalsError && userLocalsData && userLocalsData.length > 0) {
                const assignedLocal = userLocalsData[0].local_name;
                // Verificar que el local asignado esté en la lista de locales disponibles
                const matchingLocal = data.find(local => local.nombre_local === assignedLocal);
                if (matchingLocal) {
                  console.log('SelectionScreen: Usando local asignado:', assignedLocal);
                  setSelectedLocal(assignedLocal);
                  return;
                }
              }
            } catch (userLocalsError: unknown) {
              console.warn('No se pudieron obtener locales asignados del usuario:', userLocalsError);
            }
          }
          
          // Usar el primer local disponible por defecto
          console.log('SelectionScreen: Usando primer local disponible:', data[0].nombre_local);
          setSelectedLocal(data[0].nombre_local);
        } 
        // Para usuarios Store y SKA, obtener solo sus locales asignados
        else if ((profile.role === 'Store Supervisor' || profile.role === 'Store Operator' || profile.role === 'SKA Operator') && session?.user?.id) {
          console.log('SelectionScreen: Usuario Store o SKA, obteniendo locales asignados');
          try {
            const { data: userLocalsData, error: userLocalsError } = await supabase
              .from('user_locals')
              .select('local_name')
              .eq('user_id', session.user.id);
            
            if (userLocalsError) {
              toast.error('No se pudieron cargar los locales asignados.');
              return;
            }
            
            // Obtener los detalles completos de los locales asignados
            const localNames = userLocalsData.map(item => item.local_name);
            
            // Para usuarios SKA Operator, filtrar solo locales tipo SKA
            let query = supabase
              .from('locales')
              .select('*')
              .in('nombre_local', localNames)
              .order('tipo_local')
              .order('nombre_local');
              
            // Si es SKA Operator, solo mostrar locales tipo SKA
            if (profile.role === 'SKA Operator') {
              query = query.eq('tipo_local', 'SKA');
            }
            
            const { data: localsData, error: localsError } = await query;
            
            if (localsError) {
              toast.error('No se pudieron cargar los detalles de los locales asignados.');
              return;
            }
            
            console.log('SelectionScreen: Locales asignados cargados:', localsData);
            setAvailableLocals(localsData);
            
            if (localsData.length > 0) {
              console.log('SelectionScreen: Usando primer local asignado:', localsData[0].nombre_local);
              setSelectedLocal(localsData[0].nombre_local);
            } else {
              toast.error('No tienes locales asignados. Contacta a un administrador.');
            }
          } catch (error: unknown) {
            toast.error('Error al cargar los locales asignados.');
          }
        }
        // Para otros usuarios, usar el local asignado en su perfil
        else {
          console.log('SelectionScreen: Otro tipo de usuario, usando local asignado en perfil');
          if (profile.local_asignado) {
            // Obtener los detalles del local asignado
            const { data: localData, error: localError } = await supabase
              .from('locales')
              .select('*')
              .eq('nombre_local', profile.local_asignado)
              .single();
            
            if (!localError && localData) {
              console.log('SelectionScreen: Usando local asignado en perfil:', profile.local_asignado);
              setAvailableLocals([localData]);
              setSelectedLocal(profile.local_asignado);
            } else {
              toast.error('No se encontró el local asignado. Contacta a un administrador.');
            }
          } else {
            toast.error('No tienes un local asignado. Contacta a un administrador.');
          }
        }
      } catch (error: unknown) {
        console.error('Error inesperado cargando locales:', error);
        toast.error('Error al cargar los locales del sistema.');
      }
    }
    
    fetchLocals();
  }, [profile.role, profile.local_asignado, session?.user?.id]);

  const handleSubmit = () => {
    if (!selectedLocal) {
      toast.error('No hay un local seleccionado. Contacta a un administrador.');
      return;
    }
    if (!selectedDate) {
      toast.error('Por favor, selecciona una fecha.');
      return;
    }
    onSelectionComplete({ local: selectedLocal, fecha: selectedDate });
  };

  return (
    <div style={styles.centeringWrapper}>
      <div style={styles.formContainer}>
        <h2 style={styles.title}>Seleccionar Sesión de Trabajo</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isAdminType ? (
            <div>
              <label htmlFor="local-select" style={styles.label}>Seleccionar Local:</label>
              {availableLocals.length > 0 ? (
                <select 
                  id="local-select" 
                  value={selectedLocal}
                  onChange={(e) => setSelectedLocal(e.target.value)}
                  style={styles.input}
                >
                  {availableLocals.map(local => (
                    <option key={local.id} value={local.nombre_local}>
                      [{local.tipo_local}] {local.nombre_local}
                    </option>
                  ))}
                </select>
              ) : (
                <p>No se pudieron cargar los locales. Contacta a un administrador.</p>
              )}
            </div>
          ) : isStoreType ? (
            <div>
              <label htmlFor="local-select" style={styles.label}>Locales Asignados (RTL):</label>
              {availableLocals.length > 0 ? (
                <select 
                  id="local-select" 
                  value={selectedLocal}
                  onChange={(e) => setSelectedLocal(e.target.value)}
                  style={styles.input}
                >
                  {availableLocals.map(local => (
                    <option key={local.id} value={local.nombre_local}>
                      [{local.tipo_local}] {local.nombre_local}
                    </option>
                  ))}
                </select>
              ) : (
                <p>No tienes locales asignados. Contacta a un administrador.</p>
              )}
            </div>
          ) : (
            <div>
              <p>Trabajando en el local: <strong>{profile.local_asignado || 'No asignado'}</strong></p>
            </div>
          )}

          <div>
            <label htmlFor="fecha-select" style={styles.label}>Seleccionar Fecha:</label>
            <input 
              type="date" 
              id="fecha-select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <button onClick={handleSubmit} style={styles.buttonPrimary}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}