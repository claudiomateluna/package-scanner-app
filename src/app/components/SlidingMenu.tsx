'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import Image from 'next/image'

// --- Iconos SVG como Componentes ---
const ScannerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M3 9h18M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" /></svg>;
const AdminIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>;
const FaltantesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
const RechazosIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
const TicketSearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const ArchiveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>;

interface SlidingMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  canAccessAdministracion: boolean;
  canAccessAdmFaltantes: boolean;
  canAccessGestionRechazos: boolean;
  canAccessGestionRecepciones: boolean;
  currentView: 'scanner' | 'admin' | 'faltantes' | 'rechazos' | 'recepciones-completadas' | 'ticket-search' | 'reportar-faltante';
  setCurrentView: (view: 'scanner' | 'admin' | 'faltantes' | 'rechazos' | 'recepciones-completadas' | 'ticket-search' | 'reportar-faltante') => void;
  showPasswordForm: boolean;
  setShowPasswordForm: (show: boolean) => void;
  faltantesCount: number;
  rechazosCount: number;
  onReportarRechazo?: () => void;
  onTicketSearch?: () => void;
  onReportarFaltante?: () => void; // New prop for reporting faltantes
}

export default function SlidingMenu({
  isOpen,
  onClose,
  onBack,
  canAccessAdministracion,
  canAccessAdmFaltantes,
  canAccessGestionRechazos,
  canAccessGestionRecepciones,
  currentView,
  setCurrentView,
  showPasswordForm,
  setShowPasswordForm,
  faltantesCount,
  rechazosCount,
  onReportarRechazo,
  onTicketSearch,
  onReportarFaltante // Destructure new prop
}: SlidingMenuProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during sign out:', error);
        // Even if the API sign-out fails, clear local session and redirect
      }
      
      // Clear any local storage related to the session
      localStorage.clear();
      sessionStorage.clear();
      
      toast.success('Sesión cerrada correctamente');
      router.push('/');
    } catch (err) {
      console.error('Unexpected error during sign out:', err);
      // Clear local storage and redirect even if there's an error
      localStorage.clear();
      sessionStorage.clear();
      toast.success('Sesión cerrada correctamente');
      router.push('/');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById('sliding-menu');
      const menuButton = document.getElementById('menu-button');
      if (isOpen && menu && !menu.contains(event.target as Node) && menuButton && !menuButton.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '15px',
    color: 'var(--clr4)',
    border: 'none',
    borderBottom: '1px solid var(--clr2)',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '16px',
    backgroundColor: 'transparent'
  };

  const notificationBadgeStyle: React.CSSProperties = {
    marginLeft: 'auto',
    backgroundColor: 'var(--clr6)',
    color: 'var(--clr1)',
    borderRadius: '12px',
    padding: '3px',
    fontSize: '11px'
  };

  return (
    <>
      {isOpen && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 999, opacity: 1, transition: 'opacity 0.3s ease' }} />}
      <div id="sliding-menu" style={{ position: 'fixed', top: 0, left: 0, width: '280px', height: '100%', backgroundColor: 'var(--clr1)', zIndex: 1000, transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease', boxShadow: '2px 0 5px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--clr2)' }}>
          <Image src="/adidas_shp.svg" alt="Adidas Logo" width={40} height={40} />
          <h2 style={{ margin: 0, color: 'var(--clr4)' }}>Recepciones</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '10px', flex: 1 }}>
          {onBack && <button onClick={() => { onBack(); onClose(); }} style={buttonStyle}><BackIcon /><span>Volver</span></button>}
          {/* Recepción - Todos los Usuarios */}
          <button onClick={() => { setCurrentView('scanner'); onClose(); }} style={{ ...buttonStyle, backgroundColor: currentView === 'scanner' ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}><ScannerIcon /><span>Recepción</span></button>
          {/* Administración - Store Supervisor, Warehouse Operator, Warehouse Supervisor, administrador */}
          {canAccessAdministracion && <button onClick={() => { setCurrentView('admin'); onClose(); }} style={{ ...buttonStyle, backgroundColor: currentView === 'admin' ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}><AdminIcon /><span>Administración</span></button>}
          {/* Reportar Faltante - Todos los Usuarios */}
          <button onClick={() => { if (onReportarFaltante) onReportarFaltante(); onClose(); }} style={buttonStyle}><FaltantesIcon /><span>Reportar Faltante</span></button>
          {/* Adm. Faltantes - Warehouse Operator, Warehouse Supervisor, administrador */}
          {canAccessAdmFaltantes && (
            <button onClick={() => { setCurrentView('faltantes'); onClose(); }} style={{ ...buttonStyle, backgroundColor: currentView === 'faltantes' ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
              <FaltantesIcon />
              <span>Adm. Faltantes</span>
              {faltantesCount > 0 && <span style={notificationBadgeStyle}>{faltantesCount}</span>}
            </button>
          )}
          {/* Buscar Tickets - Todos los Usuarios */}
          <button onClick={() => { if (onTicketSearch) onTicketSearch(); onClose(); }} style={buttonStyle}>
            <TicketSearchIcon />
            <span>Buscar Tickets</span>
          </button>
          {/* Reportar Rechazo - Todos los Usuarios */}
          <button onClick={() => { if (onReportarRechazo) onReportarRechazo(); onClose(); }} style={buttonStyle}>
            <RechazosIcon />
            <span>Reportar Rechazo</span>
          </button>
          {/* Gestión de Rechazos - Warehouse Operator, Warehouse Supervisor, administrador */}
          {canAccessGestionRechazos && (
            <button onClick={() => { setCurrentView('rechazos'); onClose(); }} style={{ ...buttonStyle, backgroundColor: currentView === 'rechazos' ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
              <RechazosIcon />
              <span>Adm. Rechazos</span>
              {rechazosCount > 0 && <span style={notificationBadgeStyle}>{rechazosCount}</span>}
            </button>
          )}
          {/* Historial de Recepciones Completadas - Warehouse Operator, Warehouse Supervisor, Store Supervisor, administrador */}
          {canAccessGestionRecepciones && (
            <button onClick={() => { setCurrentView('recepciones-completadas'); onClose(); }} style={{ ...buttonStyle, backgroundColor: currentView === 'recepciones-completadas' ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
              <ArchiveIcon />
              <span>Historial Recepciones</span>
            </button>
          )}
          {/* Cambiar Contraseña - Todos los Usuarios */}
          <button onClick={() => { setShowPasswordForm(!showPasswordForm); onClose(); }} style={buttonStyle}><KeyIcon /><span>Cambiar Contraseña</span></button>
          <button onClick={() => { handleSignOut(); onClose(); }} style={{ ...buttonStyle, marginTop: 'auto', borderBottom: 'none' }}><LogoutIcon /><span>Cerrar Sesión</span></button>
        </div>
      </div>
    </>
  );
}