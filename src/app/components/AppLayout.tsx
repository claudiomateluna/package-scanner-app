'use client'

import { Session } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import Image from 'next/image'
import SlidingMenu from './SlidingMenu'
import RechazoForm from './RechazoForm' // Import RechazoForm
import TicketSearch from './TicketSearch' // Import TicketSearch
import ReportarFaltanteForm from './ReportarFaltanteForm' // Import ReportarFaltanteForm
import NotificationBell from './NotificationBell'
import NotificationCenter from './NotificationCenter'
import NotificationToast from './NotificationToast'
import '../globals.css'
import styles from './AppLayout.module.css'

// --- Tipos de Datos ---
type Profile = { role: string | null; first_name?: string | null; last_name?: string | null; }
export type View = 'scanner' | 'admin' | 'faltantes' | 'rechazos' | 'ticket-search' | 'reportar-faltante'; // Added ticket-search and reportar-faltante

interface Props {
  session: Session;
  profile: Profile;
  onBack?: () => void;
  children: React.ReactNode;
  currentView: View;
  setCurrentView: (view: View) => void;
}

// --- Componente del Formulario de Contraseña ---
const ChangePasswordForm = ({ onDone }: { onDone: () => void }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { return toast.error('La contraseña debe tener al menos 6 caracteres.'); }
    if (newPassword !== confirmPassword) { return toast.error('Las contraseñas no coinciden.'); }

    const loadingToast = toast.loading('Actualizando contraseña...');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    toast.dismiss(loadingToast);

    if (error) { toast.error('Error al actualizar: ' + error.message); }
    else { toast.success('Contraseña actualizada exitosamente.'); onDone(); }
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit}>
        <h4 style={{marginTop: 0}}>Cambiar mi contraseña</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
          <input type="password" placeholder="Nueva contraseña" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className={styles.input} />
          <input type="password" placeholder="Confirmar nueva contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={styles.input} />
          <div style={{marginTop: '10px', display: 'flex', gap: '10px'}}>
            <button type="submit" className={styles.button}>Guardar</button>
            <button type="button" onClick={onDone} className={styles.buttonSecondary}>Cancelar</button>
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

  // const headerStyle: CSSProperties = { 
  //   display: 'flow-root',
  //   alignItems: 'center',
  //   borderBottom: '1px solid var (--color-text-tertiary)',
  //   padding: '5px',
  //   position: 'sticky',
  //   top: 0,
  //   backgroundColor: '#ffffff',
  //   zIndex: 10,
  //   color: '#000000'
  // };
  
  const getUserFirstAndLastName = () => ({ firstName: profile?.first_name || '', lastName: profile?.last_name || '' });

  // Verificar si la vista actual es de administración de rechazos o faltantes
  const isFullWidthView = currentView === 'faltantes' || currentView === 'rechazos';

  return (
    <div>
      <SlidingMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onBack={onBack}
        canAccessAdministracion={canAccessAdministracion}
        canAccessAdmFaltantes={canAccessAdmFaltantes}
        canAccessGestionRechazos={canAccessGestionRechazos}
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
          <ChangePasswordForm onDone={() => setShowPasswordForm(false)} />
        ) : showRechazoForm ? (
          // Render the RechazoForm in a modal
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000
          }}>
            <div style={{
              backgroundColor: 'var(--color-card-background)',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Reportar Rechazo</h2>
                <button 
                  onClick={() => setShowRechazoForm(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  ×
                </button>
              </div>
              <RechazoForm 
                session={session} 
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
