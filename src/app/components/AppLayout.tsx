'use client'

import { Session } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { validatePassword } from '@/lib/passwordUtils'
import toast from 'react-hot-toast'
import Image from 'next/image'
import SlidingMenu from './SlidingMenu'
import RechazoForm from './RechazoForm' // Import RechazoForm
import TicketSearch from './TicketSearch' // Import TicketSearch
import ReportarFaltanteForm from './ReportarFaltanteForm' // Import ReportarFaltanteForm
import NotificationBell from './NotificationBell'
import NotificationCenter from './NotificationCenter'
import NotificationToast from './NotificationToast'
import SessionTimeoutHandler from './SessionTimeoutHandler'
import '../globals.css'
import styles from './AppLayout.module.css'

// --- Tipos de Datos ---
type Profile = { 
  role: string | null; 
  first_name?: string | null; 
  last_name?: string | null; 
  must_change_password?: boolean; // Add field to track if password change is required
}
export type View = 'scanner' | 'admin' | 'faltantes' | 'rechazos' | 'recepciones-completadas' | 'ticket-search' | 'reportar-faltante'; // Added recepciones-completadas and others

interface Props {
  session: Session;
  profile: Profile;
  onBack?: () => void;
  children: React.ReactNode;
  currentView: View;
  setCurrentView: (view: View) => void;
}

// --- Componente del Formulario de Contraseña ---
const ChangePasswordForm = ({ onDone, onCancel }: { onDone: () => void, onCancel?: () => void }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar contraseña con los nuevos requisitos
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      toast.error(validation.errors[0]); // Mostrar el primer error
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    const loadingToast = toast.loading('Actualizando contraseña...');
    
    try {
      // Get the session token to make API call
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        toast.error('No se pudo obtener la sesión de autenticación');
        return;
      }

      // Update the user's password via the update-user API which handles both password and must_change_password flag
      const response = await fetch('/api/update-user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: session.user.id,
          // Only update the password (this will trigger the must_change_password = false in the API)
          password: newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        toast.error('Error al actualizar: ' + errorData.error);
        return;
      }

      toast.success('Contraseña actualizada exitosamente.');
      
      onDone();
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Error al actualizar la contraseña');
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // Función para manejar el cambio de contraseña y validar en tiempo real
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    
    // Validar en tiempo real
    const validation = validatePassword(value);
    if (!validation.isValid) {
      setPasswordError(validation.errors[0]);
    } else {
      setPasswordError('');
    }
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit}>
        <h4 className={styles.passwordFormTitle}>Cambiar mi contraseña</h4>
        <div className={styles.passwordFormContainer}>
          <input 
            type="password" 
            placeholder="Nueva contraseña" 
            value={newPassword} 
            onChange={handlePasswordChange} 
            required 
            className={`${styles.input} ${passwordError ? styles.passwordInputError : ''}`}
          />
          {passwordError && <div className={styles.passwordErrorText}>{passwordError}</div>}
          <div className={styles.passwordInstructions}>
            La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.
          </div>
          <input 
            type="password" 
            placeholder="Confirmar nueva contraseña" 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
            required 
            className={styles.input} 
          />
          <div className={styles.buttonContainer}>
            <button type="submit" className={styles.button} disabled={!!passwordError}>Guardar</button>
            <button 
              type="button" 
              onClick={onCancel ? onCancel : onDone} 
              className={styles.buttonSecondary}
            >
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// --- Componente Principal del Layout ---
export default function AppLayout({ session, profile, onBack, children, currentView, setCurrentView }: Props) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [faltantesCount, setFaltantesCount] = useState(0);
  const [rechazosCount, setRechazosCount] = useState(0);
  const [showRechazoForm, setShowRechazoForm] = useState(false); // New state for rechazo form modal
  const [showNotificationCenter, setShowNotificationCenter] = useState(false); // State for notification center
  const [mustChangePassword, setMustChangePassword] = useState(profile?.must_change_password || false); // Add state to track if password change is required

  // Role-based access control functions
  const userRole = profile?.role || '';

  // Administración ('Store Supervisor', 'Warehouse Operator', 'Warehouse Supervisor', 'administrador')
  const canAccessAdministracion = ['Store Supervisor', 'Warehouse Operator', 'Warehouse Supervisor', 'administrador'].includes(userRole);

  // Adm. Faltantes ('Warehouse Operator', 'Warehouse Supervisor', 'administrador')
  const canAccessAdmFaltantes = ['Warehouse Operator', 'Warehouse Supervisor', 'administrador'].includes(userRole);

  // Gestión de Rechazos ('Warehouse Operator', 'Warehouse Supervisor', 'administrador')
  const canAccessGestionRechazos = ['Warehouse Operator', 'Warehouse Supervisor', 'administrador'].includes(userRole);

  // Efecto para escuchar el evento personalizado para abrir el formulario de rechazos
  useEffect(() => {
    const handleOpenRechazoForm = () => setShowRechazoForm(true);
    
    window.addEventListener('openRechazoForm', handleOpenRechazoForm);
    
    return () => {
      window.removeEventListener('openRechazoForm', handleOpenRechazoForm);
    };
  }, []);

  // Effect for Faltantes
  useEffect(() => {
    const fetchFaltantesCount = async () => {
        if (canAccessAdmFaltantes) {
            const { count, error } = await supabase.from('faltantes').select('*', { count: 'exact', head: true }).eq('gestionado', false);
            if (error) {
                console.error('Error fetching faltantes count:', error);
            } else {
                setFaltantesCount(count || 0);
            }
        }
    };

    fetchFaltantesCount();
    const channel = supabase.channel('faltantes-count').on('postgres_changes', { event: '*', schema: 'public', table: 'faltantes' }, fetchFaltantesCount).subscribe();
    return () => { supabase.removeChannel(channel); }
  }, [canAccessAdmFaltantes]);

  // Effect for Rechazos (Mirroring Faltantes logic)
  useEffect(() => {
    const fetchRechazosCount = async () => {
        if (canAccessGestionRechazos) {
            const { count, error } = await supabase.from('rechazos').select('*', { count: 'exact', head: true }).eq('gestionado', false);
            if (error) {
                console.error('Error fetching rechazos count:', error);
            } else {
                setRechazosCount(count || 0);
            }
        }
    };

    fetchRechazosCount();
    const channel = supabase.channel('rechazos-count').on('postgres_changes', { event: '*', schema: 'public', table: 'rechazos' }, fetchRechazosCount).subscribe();
    return () => { supabase.removeChannel(channel); }
  }, [canAccessGestionRechazos]);
  
  // Effect for Recepciones Completadas
  const canAccessGestionRecepciones = ['administrador', 'Warehouse Supervisor', 'Store Supervisor', 'Warehouse Operator'].includes(userRole);

  // Check if user must change password on component mount
  useEffect(() => {
    const checkPasswordRequirement = async () => {
      try {
        const response = await fetch(`/api/fetch-profile?userId=${session.user.id}`);
        const data = await response.json();
        
        // Only set the state if the response is successful and has data
        if (response.ok && data.profile) {
          if (data.profile.must_change_password) {
            setMustChangePassword(true);
            setShowPasswordForm(true); // Automatically show password change form if required
          } else if (mustChangePassword) {
            // If the user no longer needs to change password but the state says otherwise
            setMustChangePassword(false);
          }
        } else if (response.status === 404) {
          // User not found, which shouldn't happen if they're logged in
          console.error('User not found when checking password requirement');
        }
      } catch (error) {
        console.error('Error checking password requirement:', error);
      }
    };

    // Check if the user has the must_change_password flag in their profile prop
    if (profile?.must_change_password) {
      setMustChangePassword(true);
      setShowPasswordForm(true);
    } else if (!mustChangePassword) {
      // Only check via API if we don't already know the user doesn't need to change password
      checkPasswordRequirement(); // Check via API if not in initial profile
    }
  }, [session.user.id, profile?.must_change_password, mustChangePassword]);

  // const headerStyle: CSSProperties = { 
  //   display: 'flow-root',
  //   alignItems: 'center',
  //   borderBottom: '1px solid var (--clr3)',
  //   padding: '5px',
  //   position: 'sticky',
  //   top: 0,
  //   backgroundColor: 'var(--clr1)',
  //   zIndex: 10,
  //   color: 'var(--clr4)'
  // };
  
  const getUserFirstAndLastName = () => ({ firstName: profile?.first_name || '', lastName: profile?.last_name || '' });

  // Verificar si la vista actual es de administración de rechazos, faltantes o recepciones completadas
  const isFullWidthView = currentView === 'faltantes' || currentView === 'rechazos' || currentView === 'recepciones-completadas';

  // Handler for session timeout - redirect to login
  const handleSessionTimeout = () => {
    // Redirect to login page or handle session timeout as needed
    window.location.href = '/';
  };

  return (
    <div>
      <SessionTimeoutHandler userId={session.user.id} onSessionTimeout={handleSessionTimeout} />
      
      <SlidingMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onBack={onBack}
        canAccessAdministracion={canAccessAdministracion}
        canAccessAdmFaltantes={canAccessAdmFaltantes}
        canAccessGestionRechazos={canAccessGestionRechazos}
        canAccessGestionRecepciones={canAccessGestionRecepciones}
        currentView={currentView}
        setCurrentView={setCurrentView}
        showPasswordForm={showPasswordForm}
        setShowPasswordForm={setShowPasswordForm}
        faltantesCount={faltantesCount}
        rechazosCount={rechazosCount}
        onReportarRechazo={() => setShowRechazoForm(true)} // New prop
        onTicketSearch={() => setCurrentView('ticket-search')} // New prop
        onReportarFaltante={() => setCurrentView('reportar-faltante')} // New prop
      />
      
      <header className={styles.header}>
        <div className={styles.contentWrapper}>
          <div className={styles.userContainer}>
            <div id="menu-button" onClick={() => setIsMenuOpen(true)} className={styles.cursorPointer}>
              <Image src="/adidas_shp.svg" alt="Adidas Logo" width={60} height={60} />
            </div>
            <div>
              <h2 className={styles.title}>Recepciones</h2>
              <p className={styles.welcomeText}>
                Bienvenido {getUserFirstAndLastName().firstName} {getUserFirstAndLastName().lastName ? ` ${getUserFirstAndLastName().lastName}` : ''}
              </p>
            </div>
          </div>
          <div className={styles.notificationContainer}>
            <NotificationBell 
              userId={session.user.id} 
              onNotificationClick={() => setShowNotificationCenter(true)} 
              session={session} 
            />
          </div>
        </div>
      </header>
      
      {/* Notification Center Modal */}
      {showNotificationCenter && (
        <NotificationCenter 
          userId={session.user.id} 
          onClose={() => setShowNotificationCenter(false)} 
        />
      )}
      
      <main className={`${styles.main} ${isFullWidthView ? styles.fullWidth : ''}`}>
        {/* Notification Toast Component */}
        <NotificationToast userId={session.user.id} />
        
        {showPasswordForm ? (
          <ChangePasswordForm 
            onDone={() => {
              setShowPasswordForm(false);
              // If the user had to change password, update the flag
              if (mustChangePassword) {
                setMustChangePassword(false);
              }
            }} 
            onCancel={() => {
              // If user is required to change password (new user) and cancels, 
              // force logout
              if (mustChangePassword) {
                // Clear any local storage related to the session
                localStorage.removeItem('sb-gkqebmqtmjeinjuoivvu-auth-token');
                
                // Redirect to login without relying on the signOut API call
                // This handles the case where the session might be invalid
                window.location.href = '/';
              } else {
                // Otherwise just close the form
                setShowPasswordForm(false);
              }
            }}
          />
        ) : showRechazoForm ? (
          // Render the RechazoForm in a modal
          <div className={styles.rechazoModalOverlay}>
            <div className={styles.rechazoModalContent}>
              <div className={styles.rechazoModalHeader}>
                <h2>Reportar Rechazo</h2>
                <button 
                  onClick={() => setShowRechazoForm(false)}
                  className={styles.closeModalButton}
                >
                  ×
                </button>
              </div>
              <RechazoForm 
                profile={profile} 
                onComplete={() => setShowRechazoForm(false)} // Close modal when scan is complete
              />
            </div>
          </div>
        ) : currentView === 'ticket-search' ? (
          <TicketSearch session={session} />
        ) : currentView === 'reportar-faltante' ? (
          <ReportarFaltanteForm 
            session={session} 
            onClose={() => setCurrentView('scanner')}
            onReportSaved={() => {
              toast.success('Reporte guardado exitosamente');
              setCurrentView('scanner');
            }}
          />
        ) : (
          children
        )}
      </main>
    </div>
  );
}
