// src/app/components/RechazosView.tsx
'use client';

import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import RechazoForm from './RechazoForm';
import RechazosAdminView from './RechazosAdminView';

interface Props {
  session: Session;
  profile: { role: string | null };
  packageData?: { OLPN: string; DN: string; Unidades: number; Local: string; Fecha: string; };
}

// Helper para normalizar roles
const normalizeRole = (role: string | null) => {
  if (role === 'admnistrador') return 'Administrador';
  return role;
};

export default function RechazosView({ session, profile, packageData }: Props) {
  const [activeTab, setActiveTab] = useState('ingresar');
  const userRole = normalizeRole(profile.role);

  const canViewIngresar = ['SKA Operator', 'Store Operator', 'Store Supervisor', 'Administrador'].includes(userRole || '');
  const canViewAdmin = ['Warehouse Operator', 'Warehouse Supervisor', 'Administrador'].includes(userRole || '');

  // Determinar la pestaña inicial basada en permisos
  useEffect(() => {
    if (canViewIngresar) {
      setActiveTab('ingresar');
    } else if (canViewAdmin) {
      setActiveTab('administracion');
    }
  }, [canViewIngresar, canViewAdmin]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#233D4D', marginBottom: '20px' }}>Gestión de Rechazos</h1>
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
        {canViewIngresar && (
          <button 
            onClick={() => setActiveTab('ingresar')} 
            style={{ 
              padding: '10px 20px', 
              border: activeTab === 'ingresar' ? '1px solid #FE7F2D' : '1px solid transparent',
              backgroundColor: activeTab === 'ingresar' ? '#FE7F2D' : '#f0f0f0',
              color: activeTab === 'ingresar' ? 'white' : '#333',
              cursor: 'pointer',
              marginRight: '10px',
              borderRadius: '4px'
            }}
          >
            Ingresar Rechazo
          </button>
        )}
        {canViewAdmin && (
          <button 
            onClick={() => setActiveTab('administracion')} 
            style={{ 
              padding: '10px 20px', 
              border: activeTab === 'administracion' ? '1px solid #FE7F2D' : '1px solid transparent',
              backgroundColor: activeTab === 'administracion' ? '#FE7F2D' : '#f0f0f0',
              color: activeTab === 'administracion' ? 'white' : '#333',
              cursor: 'pointer',
              marginRight: '10px',
              borderRadius: '4px'
            }}
          >
            Administración
          </button>
        )}
      </div>

      <div>
        {activeTab === 'ingresar' && canViewIngresar && <RechazoForm session={session} profile={profile} initialData={packageData} />}
        {activeTab === 'administracion' && canViewAdmin && <RechazosAdminView session={session} profile={profile} />}
      </div>
    </div>
  );
}