'use client'

import { useState, useEffect, CSSProperties } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { Session } from '@supabase/supabase-js'

type Profile = { role: string | null; local_asignado?: string | null; }

interface LocalData {
  Local: string;
}
// LocalData se eliminó ya que no se usaba

interface UserLocal {
  local_name: string;
}
// UserLocal se eliminó ya que no se usaba

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
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
  },
  title: {
    color: '#FE7F2D',
    textAlign: 'center',
    marginBottom: '30px'
  },
  buttonPrimary: {
    backgroundColor: '#FE7F2D',
    color: '#233D4D',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#CCCCCC',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#CCCCCC',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#CCCCCC',
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: '#CCCCCC',
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: '#CCCCCC',
    borderRadius: '5px',
    fontSize: '1em',
    boxSizing: 'border-box' // Añadido para prevenir desbordamiento
  },
  label: {
    display: 'block',
    textAlign: 'left',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#CCCCCC'
  }
};

export default function SelectionScreen({ profile, onSelectionComplete, session }: Props) {
  const [availableLocals, setAvailableLocals] = useState<string[]>([]);
  const [selectedLocal, setSelectedLocal] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const isAdminType = profile.role === 'administrador' || profile.role === 'Warehouse Supervisor' || profile.role === 'Warehouse Operator';
  const isStoreType = profile.role === 'Store Supervisor' || profile.role === 'Store Operator';

  useEffect(() => {
    async function fetchLocals() {
      try {
        // Para usuarios administradores o warehouse, obtener todos los locales de la tabla data
        if (profile.role === 'administrador' || profile.role === 'Warehouse Supervisor' || profile.role === 'Warehouse Operator') {
          const { data, error } = await supabase.from('data').select('Local');
          
          if (error) {
            console.error('Error cargando locales:', error);
            toast.error('No se pudieron cargar los locales del sistema.');
            return;
          }
          
          if (!data || data.length === 0) {
            console.warn('No se encontraron locales en la tabla data');
            toast.error('No hay locales disponibles en el sistema.');
            return;
          }
          
          // Extraer y ordenar locales únicos
          const uniqueLocals = [...new Set(data.map(item => item.Local).filter(local => local))].sort();
          
          if (uniqueLocals.length === 0) {
            toast.error('No hay locales válidos en el sistema.');
            return;
          }
          
          setAvailableLocals(uniqueLocals);
          
          // Para usuarios Warehouse, verificar si tienen locales asignados para usar como predeterminado
          if ((profile.role === 'Warehouse Supervisor' || profile.role === 'Warehouse Operator') && session?.user?.id) {
            try {
              const { data: userLocalsData, error: userLocalsError } = await supabase
                .from('user_locals')
                .select('local_name')
                .eq('user_id', session.user.id);
              
              if (!userLocalsError && userLocalsData && userLocalsData.length > 0) {
                const assignedLocal = userLocalsData[0].local_name;
                // Verificar que el local asignado esté en la lista de locales disponibles
                if (uniqueLocals.includes(assignedLocal)) {
                  setSelectedLocal(assignedLocal);
                  return;
                }
              }
            } catch (userLocalsError) {
              console.warn('No se pudieron obtener locales asignados del usuario:', userLocalsError);
            }
          }
          
          // Usar el primer local disponible por defecto
          setSelectedLocal(uniqueLocals[0]);
        } 
        // Para usuarios Store, obtener solo sus locales asignados
        else if ((profile.role === 'Store Supervisor' || profile.role === 'Store Operator') && session?.user?.id) {
          try {
            const { data, error } = await supabase
              .from('user_locals')
              .select('local_name')
              .eq('user_id', session.user.id);
            
            if (error) {
              toast.error('No se pudieron cargar los locales asignados.');
              return;
            }
            
            const locals = [...new Set(data.map(item => item.local_name).filter(local => local))].sort();
            setAvailableLocals(locals);
            
            if (locals.length > 0) {
              setSelectedLocal(locals[0]);
            } else {
              toast.error('No tienes locales asignados. Contacta a un administrador.');
            }
          } catch (error) {
            toast.error('Error al cargar los locales asignados.');
          }
        }
        // Para otros usuarios, usar el local asignado en su perfil
        else {
          if (profile.local_asignado) {
            setAvailableLocals([profile.local_asignado]);
            setSelectedLocal(profile.local_asignado);
          } else {
            toast.error('No tienes un local asignado. Contacta a un administrador.');
          }
        }
      } catch (error) {
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
                  {availableLocals.map(local => <option key={local} value={local}>{local}</option>)}
                </select>
              ) : (
                <p>No se pudieron cargar los locales. Contacta a un administrador.</p>
              )}
            </div>
          ) : isStoreType ? (
            <div>
              <label htmlFor="local-select" style={styles.label}>Locales Asignados:</label>
              {availableLocals.length > 0 ? (
                <select 
                  id="local-select" 
                  value={selectedLocal}
                  onChange={(e) => setSelectedLocal(e.target.value)}
                  style={styles.input}
                >
                  {availableLocals.map(local => <option key={local} value={local}>{local}</option>)}
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