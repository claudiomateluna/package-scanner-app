'use client'

import { Session } from '@supabase/supabase-js'
import { CSSProperties, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import Image from 'next/image'
import SlidingMenu from './SlidingMenu'

// --- Tipos de Datos ---
type Profile = { role: string | null; first_name?: string | null; last_name?: string | null; }
type View = 'scanner' | 'admin' | 'faltantes' | 'rechazos';

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
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [faltantesCount, setFaltantesCount] = useState(0);

  const isWarehouseOrAdmin = profile?.role === 'administrador' || profile?.role === 'Warehouse Supervisor' || profile?.role === 'Warehouse Operator' || profile?.role === 'Store Supervisor';
  const canViewFaltantesAdmin = ['administrador', 'admnistrador', 'warehouse supervisor', 'warehouse operator'].includes(profile?.role?.toLowerCase() || '');

  useEffect(() => {
    const fetchFaltantesCount = async () => {
        if (canViewFaltantesAdmin) {
            try {
                const { count, error } = await supabase
                    .from('faltantes')
                    .select('*', { count: 'exact', head: true })
                    .eq('gestionado', false);

                if (error) {
                    console.error('Error fetching faltantes count:', JSON.stringify(error, null, 2));
                } else {
                    setFaltantesCount(count || 0);
                }
            } catch (error) {
                console.error('Error in fetchFaltantesCount:', error);
            }
        }
    };

    fetchFaltantesCount();

    const channel = supabase.channel('faltantes-count')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'faltantes' }, () => {
            fetchFaltantesCount();
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [canViewFaltantesAdmin]);

  const headerStyle: CSSProperties = { 
    display: 'flow-root',
    alignItems: 'center',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#dddddd',
    padding: '10px',
    position: 'sticky',
    top: 0,
    backgroundColor: '#ffffff',
    zIndex: 10,
    color: '#000000'
  };
  
  // Obtener nombre y apellido por separado
  const getUserFirstAndLastName = () => {
    return {
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || ''
    };
  };

  const mainStyle: CSSProperties = {
    padding: '5px',
    margin: 'auto',
    maxWidth: currentView === 'faltantes' || currentView === 'rechazos' ? '100%' : '800px',
  };

  return (
    <div>
      {/* Sliding Menu */}
      <SlidingMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onBack={onBack}
        isWarehouseOrAdmin={isWarehouseOrAdmin}
        canViewFaltantesAdmin={canViewFaltantesAdmin}
        currentView={currentView}
        setCurrentView={setCurrentView}
        showPasswordForm={showPasswordForm}
        setShowPasswordForm={setShowPasswordForm}
        faltantesCount={faltantesCount}
      />
      
      <header style={headerStyle}>
        <div style={{ maxWidth: currentView === 'faltantes' || currentView === 'rechazos' ? '100%' : '800px', margin: '0 auto', padding: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {/* Menu button that opens the sliding menu */}
            <div 
              id="menu-button"
              onClick={() => setIsMenuOpen(true)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Image 
                src="/adidas_shp.svg" 
                alt="Adidas Logo" 
                width={60}
                height={60}
              />
            </div>
            <div>
              <h2 style={{ margin: '0', color: '#000000', lineHeight: '1' }}>Recepciones</h2>
              <p style={{ margin: '0', fontSize: '0.9em', color: '#000000', lineHeight: '1' }}>
                Bienvenido {getUserFirstAndLastName().firstName} {getUserFirstAndLastName().lastName ? ` ${getUserFirstAndLastName().lastName}` : ''}
              </p>
            </div>
          </div>
        </div>
      </header>
      
      <main style={mainStyle}>
        {showPasswordForm ? 
          <ChangePasswordForm onDone={() => setShowPasswordForm(false)} /> : 
          children
        }
      </main>
    </div>
  );
}