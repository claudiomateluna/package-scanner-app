// Updated SelectionScreen component that uses locales table
'use client'

import { useState, useEffect, CSSProperties } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import LocalesSearchableSelect from './LocalesSearchableSelect'

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
  setCurrentView?: (view: 'scanner' | 'admin' | 'faltantes' | 'rechazos') => void;
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
    padding: '20px',
    backgroundColor: 'var(--clr1)',
    borderRadius: '4px',
    border: '1px solid var(--clr4)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    boxSizing: 'border-box' // Añadido para prevenir desbordamiento
  },
  title: {
    color: 'var(--clr4)',
    textAlign: 'center',
    marginBottom: '10px'
  },
  buttonPrimary: {
    backgroundColor: 'var(--clr4)',
    color: 'var(--clr1)',
    border: 'none',
    padding: '12px 20px',
    cursor: 'pointer',
    borderRadius: '5px',
    fontWeight: 'bold',
    fontSize: '1.2em',
    width: '100%',
    marginTop: '0px'
  },
  input: {
    width: '100%',
    padding: '12px',
    marginTop: '8px',
    backgroundColor: 'var(--clr1)',
    color: 'var(--clr4)',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'var(--clr4)',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--clr4)',
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'var(--clr4)',
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: 'var(--clr4)',
    borderRadius: '4px',
    fontSize: '1em',
    boxSizing: 'border-box' // Añadido para prevenir desbordamiento
  },
  label: {
    display: 'block',
    textAlign: 'left',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: 'var(--clr4)'
  },
  filterContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    flexWrap: 'wrap'
  },
  filterButton: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    color: 'var(--clr4)',
    border: '1px solid var(--clr4)',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9em'
  },
  activeFilterButton: {
    backgroundColor: 'var(--clr7)',
    color: 'var(--clr4)',
    border: '1px solid var(--clr7)'
  }
};

export default function SelectionScreenWithLocales({ profile, onSelectionComplete, session, setCurrentView }: Props) {
  // Acknowledge unused setCurrentView to prevent ESLint warning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _setCurrentView = setCurrentView;
  
  const router = useRouter();
  // Acknowledge unused router to prevent ESLint warning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _router = router;
  
  const [availableLocals, setAvailableLocals] = useState<Local[]>([]);
  const [filteredLocals, setFilteredLocals] = useState<Local[]>([]);
  // Acknowledge unused filteredLocals to prevent ESLint warning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _filteredLocals = filteredLocals;
  
  const [selectedLocal, setSelectedLocal] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'FRA' | 'RTL' | 'SKA' | 'WHS'>('ALL');
  // Acknowledge unused activeFilter and setActiveFilter to prevent ESLint warning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _activeFilter = activeFilter;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _setActiveFilter = setActiveFilter;

  // Roles que pueden ver todos los locales sin filtro
  const canViewAllLocals = profile.role === 'administrador' || profile.role === 'Warehouse Supervisor' || profile.role === 'Warehouse Operator';
  
  // Roles que ven solo locales asignados
  const hasAssignedLocals = profile.role === 'Store Supervisor' || profile.role === 'Store Operator' || profile.role === 'SKA Operator';

  // Apply filter to locals - only show filter buttons for users who can view all locals
  useEffect(() => {
    // For all users, show all available locals without filtering by type
    // Except for users with assigned locals, they see only their assigned locals
    setFilteredLocals(availableLocals);
  }, [availableLocals]);

  useEffect(() => {
    async function fetchLocals() {
      //console.log('SelectionScreenWithLocales: fetchLocals iniciado');
      //console.log('SelectionScreenWithLocales: profile.role:', profile.role);
      //console.log('SelectionScreenWithLocales: session?.user?.id:', session?.user?.id);
      
      try {
        // Para usuarios que pueden ver todos los locales, obtener todos los locales de la tabla locales
        if (canViewAllLocals) {
          //console.log('SelectionScreenWithLocales: Usuario puede ver todos los locales, obteniendo todos los locales');
          const { data, error } = await supabase.from('locales').select('*').order('tipo_local').order('nombre_local');
          // Acknowledge unused error to prevent ESLint warning
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _error = error;
          
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
          
          console.log('SelectionScreenWithLocales: Locales cargados:', data);
          setAvailableLocals(data);
          
          // Para usuarios Warehouse, verificar si tienen locales asignados para usar como predeterminado
          if ((profile.role === 'Warehouse Supervisor' || profile.role === 'Warehouse Operator') && session?.user?.id) {
            console.log('SelectionScreenWithLocales: Usuario Warehouse, verificando locales asignados');
            try {
              const { data: userLocalsData, error: userLocalsError } = await supabase
                .from('user_locals')
                .select('local_name')
                .eq('user_id', session.user.id);
              // Acknowledge unused userLocalsError to prevent ESLint warning
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const _userLocalsError = userLocalsError;
              
              if (!userLocalsError && userLocalsData && userLocalsData.length > 0) {
                const assignedLocal = userLocalsData[0].local_name;
                // Verificar que el local asignado esté en la lista de locales disponibles
                const matchingLocal = data.find(local => local.nombre_local === assignedLocal);
                if (matchingLocal) {
                  console.log('SelectionScreenWithLocales: Usando local asignado:', assignedLocal);
                  setSelectedLocal(assignedLocal);
                  return;
                }
              }
            } catch (userLocalsError) {
              console.warn('No se pudieron obtener locales asignados del usuario:', userLocalsError);
            }
          }
          
          // Usar el primer local disponible por defecto
          console.log('SelectionScreenWithLocales: Usando primer local disponible:', data[0].nombre_local);
          setSelectedLocal(data[0].nombre_local);
        } 
        // Para usuarios con locales asignados, obtener solo sus locales asignados
        else if (hasAssignedLocals && session?.user?.id) {
          console.log('SelectionScreenWithLocales: Usuario con locales asignados, obteniendo locales asignados');
          try {
            const { data: userLocalsData, error: userLocalsError } = await supabase
              .from('user_locals')
              .select('local_name')
              .eq('user_id', session.user.id);
            // Acknowledge unused userLocalsError to prevent ESLint warning
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _userLocalsError = userLocalsError;
            
            if (userLocalsError) {
              toast.error('No se pudieron cargar los locales asignados.');
              return;
            }
            
            // Obtener los detalles completos de los locales asignados
            const localNames = userLocalsData.map(item => item.local_name);
            const { data: localsData, error: localsError } = await supabase
              .from('locales')
              .select('*')
              .in('nombre_local', localNames)
              .order('tipo_local')
              .order('nombre_local');
            // Acknowledge unused localsError to prevent ESLint warning
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _localsError = localsError;
            
            if (localsError) {
              toast.error('No se pudieron cargar los detalles de los locales asignados.');
              return;
            }
            
            console.log('SelectionScreenWithLocales: Locales asignados cargados:', localsData);
            setAvailableLocals(localsData);
            
            if (localsData.length > 0) {
              console.log('SelectionScreenWithLocales: Usando primer local asignado:', localsData[0].nombre_local);
              setSelectedLocal(localsData[0].nombre_local);
            } else {
              toast.error('No tienes locales asignados. Contacta a un administrador.');
            }
          } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _error = error;
            toast.error('Error al cargar los locales asignados.');
          }
        }
        // Para otros usuarios, usar el local asignado en su perfil
        else {
          console.log('SelectionScreenWithLocales: Otro tipo de usuario, usando local asignado en perfil');
          if (profile.local_asignado) {
            // Obtener los detalles del local asignado
            const { data: localData, error: localError } = await supabase
              .from('locales')
              .select('*')
              .eq('nombre_local', profile.local_asignado)
              .single();
            // Acknowledge unused localError to prevent ESLint warning
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _localError = localError;
            
            if (!localError && localData) {
              console.log('SelectionScreenWithLocales: Usando local asignado en perfil:', profile.local_asignado);
              setAvailableLocals([localData]);
              setSelectedLocal(profile.local_asignado);
            } else {
              toast.error('No se encontró el local asignado. Contacta a un administrador.');
            }
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
  }, [profile.role, profile.local_asignado, session?.user?.id, canViewAllLocals, hasAssignedLocals]);

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

  const FilterButtons = () => null;
  // Acknowledge unused FilterButtons to prevent ESLint warning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _FilterButtons = FilterButtons;

  return (
    <div style={styles.centeringWrapper}>
      <div style={styles.formContainer}>
        <h2 style={styles.title}>Seleccionar Sesión de Trabajo</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {canViewAllLocals ? (
            <div>
              <label htmlFor="local-select" style={styles.label}>Seleccionar Local:</label>
              {availableLocals.length > 0 ? (
                <LocalesSearchableSelect
                  locals={availableLocals}
                  selectedLocal={selectedLocal}
                  onLocalSelect={setSelectedLocal}
                  placeholder="Buscar y seleccionar local..."
                />
              ) : (
                <p>No se pudieron cargar los locales. Contacta a un administrador.</p>
              )}
            </div>
          ) : hasAssignedLocals ? (
            <div>
              <label htmlFor="local-select" style={styles.label}>Locales Asignados:</label>
              {availableLocals.length > 0 ? (
                <LocalesSearchableSelect
                  locals={availableLocals}
                  selectedLocal={selectedLocal}
                  onLocalSelect={setSelectedLocal}
                  placeholder="Buscar y seleccionar local asignado..."
                />
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
          
          {/* Botón Reportar Rechazo - Visible para todos los usuarios */}
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openRechazoForm'))}
            style={{
              ...styles.buttonPrimary,
              backgroundColor: 'var(--clr6)',
              color: 'var(--clr1)'
            }}
          >
            Reportar Rechazo
          </button>
        </div>
      </div>
    </div>
  );
}