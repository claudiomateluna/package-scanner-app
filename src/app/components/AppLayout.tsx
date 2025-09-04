'use client'

import { Session } from '@supabase/supabase-js'
import { CSSProperties, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import Image from 'next/image'

// --- Tipos de Datos ---
type Profile = { role: string | null; }
type View = 'scanner' | 'admin';

interface Props {
  session: Session;
  profile: Profile;
  onBack?: () => void;
  children: React.ReactNode;
  currentView: View;
  setCurrentView: (view: View) => void;
}

// --- Iconos SVG como Componentes ---
const KeyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

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
    borderRadius: '5px' 
  };

  return (
    <div style={{ 
      margin: '20px 0', 
      padding: '20px', 
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
      borderRadius: '8px' 
    }}>
      <form onSubmit={handleSubmit}>
        <h4 style={{marginTop: 0}}>Cambiar mi contraseña</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
          <input 
            type="password" 
            placeholder="Nueva contraseña" 
            value={newPassword} 
            onChange={e => setNewPassword(e.target.value)} 
            required 
            style={inputStyle} 
          />
          <input 
            type="password" 
            placeholder="Confirmar nueva contraseña" 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
            required 
            style={inputStyle} 
          />
          <div style={{marginTop: '10px', display: 'flex', gap: '10px'}}>
            <button 
              type="submit" 
              style={{
                padding: '10px 15px', 
                backgroundColor: '#FE7F2D', 
                color: '#fff', 
                border: 'none', 
                borderTopWidth: 0,
                borderBottomWidth: 0,
                borderLeftWidth: 0,
                borderRightWidth: 0,
                borderRadius: '5px', 
                cursor: 'pointer'
              }}
            >
              Guardar
            </button>
            <button 
              type="button" 
              onClick={onDone} 
              style={{
                padding: '10px 15px', 
                backgroundColor: 'transparent', 
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
                cursor: 'pointer'
              }}
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
  const { user } = session;
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const isWarehouseOrAdmin = profile?.role === 'administrador' || profile?.role === 'Warehouse Supervisor' || profile?.role === 'Warehouse Operator' || profile?.role === 'Store Supervisor';

  const headerStyle: CSSProperties = { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#555',
    padding: '10px',
    position: 'sticky',
    top: 0,
    backgroundColor: '#FE7F2D',
    zIndex: 10,
    color: '#233D4D'
  };
  
  const baseButtonStyle: CSSProperties = { 
    backgroundColor: 'transparent', 
    color: '#233D4D',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#233D4D',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#233D4D',
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: '#233D4D',
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: '#233D4D',
    padding: '8px 12px', 
    cursor: 'pointer', 
    borderRadius: '5px', 
    display: 'flex', 
    alignItems: 'center' 
  };
  
  const activeButtonStyle: CSSProperties = { 
    ...baseButtonStyle, 
    borderTopColor: '#233D4D',
    borderBottomColor: '#233D4D',
    borderLeftColor: '#233D4D',
    borderRightColor: '#233D4D',
    color: '#233D4D',
    backgroundColor: 'rgba(35, 61, 77, 0.2)'
  };
  
  const scannerButtonStyle: CSSProperties = {
    backgroundColor: 'transparent',
    color: '#233D4D',
    border: 'none',
    padding: '0',
    margin: '0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '5px'
  };
  
  const activeScannerButtonStyle: CSSProperties = {
    ...scannerButtonStyle,
    backgroundColor: 'rgba(35, 61, 77, 0.2)'
  };

  const handleSignOut = async () => {
    console.log('Attempting to sign out');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast.error('Error al cerrar sesión: ' + error.message);
      } else {
        console.log('Sign out successful');
        toast.success('Sesión cerrada correctamente');
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      toast.error('Error inesperado al cerrar sesión');
    }
  };

  // Obtener el nombre del usuario
  // getUserDisplayName se eliminó ya que no se usaba

  // Obtener nombre y apellido por separado
  const getUserFirstAndLastName = () => {
    if (user.user_metadata?.first_name && user.user_metadata?.last_name) {
      return {
        firstName: user.user_metadata.first_name,
        lastName: user.user_metadata.last_name
      };
    }
    if (user.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      return {
        firstName: names[0],
        lastName: names.length > 1 ? names[names.length - 1] : ''
      };
    }
    if (user.email) {
      return {
        firstName: user.email.split('@')[0],
        lastName: ''
      };
    }
    return {
      firstName: 'Usuario',
      lastName: ''
    };
  };

  return (
    <div>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Image 
            src="/adidas_shp.svg" 
            alt="Adidas Logo" 
            width={60}
            height={60}
          />
          <div>
            <h2 style={{ margin: 0, color: '#233D4D' }}>Recepciones</h2>
            <p style={{ margin: '5px 0 0', fontSize: '0.9em', color: '#233D4D' }}>
              Bienvenido {getUserFirstAndLastName().firstName} {getUserFirstAndLastName().lastName}
            </p>
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          {onBack && (
            <button 
              onClick={onBack} 
              style={baseButtonStyle}
            >
              &larr; Volver
            </button>
          )}
          
          {isWarehouseOrAdmin && (
            <>
              <button 
                onClick={() => setCurrentView('scanner')} 
                style={currentView === 'scanner' ? activeScannerButtonStyle : scannerButtonStyle}
                title="Recepción"
              >
                <Image 
                  src="/barcode.svg" 
                  alt="Código de Barras" 
                  width={44}
                  height={34}
                />
              </button>
              <button 
                onClick={() => setCurrentView('admin')} 
                style={currentView === 'admin' ? activeButtonStyle : baseButtonStyle}
              >
                Administración
              </button>
            </>
          )}

          <button 
            onClick={() => setShowPasswordForm(!showPasswordForm)} 
            style={baseButtonStyle} 
            title="Cambiar Contraseña"
          >
            <KeyIcon />
          </button>
          <button 
            onClick={handleSignOut} 
            style={baseButtonStyle} 
            title="Cerrar Sesión"
          >
            <LogoutIcon />
          </button>
        </div>
      </header>
      
      <main style={{padding: '20px', maxWidth: '1000px', margin: 'auto'}}>
        {showPasswordForm ? 
          <ChangePasswordForm onDone={() => setShowPasswordForm(false)} /> : 
          children
        }
      </main>
    </div>
  );
}