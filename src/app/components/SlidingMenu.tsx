// SlidingMenu.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import Image from 'next/image'

// --- Iconos SVG como Componentes ---
const ScannerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <path d="M3 9h18M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
  </svg>
);

const AdminIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

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

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

interface SlidingMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  isWarehouseOrAdmin: boolean;
  currentView: 'scanner' | 'admin';
  setCurrentView: (view: 'scanner' | 'admin') => void;
  showPasswordForm: boolean;
  setShowPasswordForm: (show: boolean) => void;
}

export default function SlidingMenu({
  isOpen,
  onClose,
  onBack,
  isWarehouseOrAdmin,
  currentView,
  setCurrentView,
  showPasswordForm,
  setShowPasswordForm
}: SlidingMenuProps) {
  const router = useRouter();

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
        router.push('/'); // Redirect to home/login page
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      toast.error('Error inesperado al cerrar sesión');
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById('sliding-menu');
      const menuButton = document.getElementById('menu-button');
      
      if (isOpen && menu && !menu.contains(event.target as Node) && 
          menuButton && !menuButton.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}
      
      {/* Sliding Menu */}
      <div
        id="sliding-menu"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '280px',
          height: '100%',
          backgroundColor: '#233D4D',
          zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          boxShadow: '2px 0 5px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Menu Header */}
        <div style={{
          padding: '20px',
          backgroundColor: '#FE7F2D',
          color: '#233D4D',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Image 
            src="/adidas_shp.svg" 
            alt="Adidas Logo" 
            width={40}
            height={40}
          />
          <h2 style={{ margin: 0, color: '#233D4D' }}>Recepciones</h2>
        </div>
        
        {/* Menu Items */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '10px',
          flex: 1
        }}>
          {onBack && (
            <button 
              onClick={() => {
                onBack();
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '15px',
                backgroundColor: 'transparent',
                color: '#CCCCCC',
                border: 'none',
                borderBottom: '1px solid #555',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '16px'
              }}
            >
              <BackIcon />
              <span>Volver</span>
            </button>
          )}
          
          {isWarehouseOrAdmin && (
            <>
              <button 
                onClick={() => {
                  setCurrentView('scanner');
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '15px',
                  backgroundColor: currentView === 'scanner' ? 'rgba(254, 127, 45, 0.2)' : 'transparent',
                  color: '#CCCCCC',
                  border: 'none',
                  borderBottom: '1px solid #555',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '16px'
                }}
              >
                <ScannerIcon />
                <span>Recepción</span>
              </button>
              
              <button 
                onClick={() => {
                  setCurrentView('admin');
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '15px',
                  backgroundColor: currentView === 'admin' ? 'rgba(254, 127, 45, 0.2)' : 'transparent',
                  color: '#CCCCCC',
                  border: 'none',
                  borderBottom: '1px solid #555',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '16px'
                }}
              >
                <AdminIcon />
                <span>Administración</span>
              </button>
            </>
          )}
          
          <button 
            onClick={() => {
              setShowPasswordForm(!showPasswordForm);
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '15px',
              backgroundColor: 'transparent',
              color: '#CCCCCC',
              border: 'none',
              borderBottom: '1px solid #555',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '16px'
            }}
          >
            <KeyIcon />
            <span>Cambiar Contraseña</span>
          </button>
          
          <button 
            onClick={() => {
              handleSignOut();
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '15px',
              backgroundColor: 'transparent',
              color: '#CCCCCC',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '16px',
              marginTop: 'auto'
            }}
          >
            <LogoutIcon />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}