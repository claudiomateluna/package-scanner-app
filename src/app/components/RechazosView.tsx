// src/app/components/RechazosView.tsx
'use client';

import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import RechazosAdminView from './RechazosAdminView';

interface Props {
  session: Session;
  profile: { role: string | null };
  packageData?: { OLPN: string; DN: string; Unidades: number; Local: string; Fecha: string; };
}

// Helper para normalizar roles
const normalizeRole = (role: string | null) => {
  if (role === 'admnistrador') return 'administrador';
  return role;
};

export default function RechazosView({ session, profile, packageData }: Props) {
  const userRole = normalizeRole(profile.role);

  // Verificar si el usuario puede ver la administración de rechazos
  const canViewAdmin = ['Warehouse Operator', 'Warehouse Supervisor', 'administrador'].includes(userRole || '');

  // Si el usuario no puede ver la administración, mostramos un mensaje
  if (!canViewAdmin) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#233D4D', marginBottom: '20px' }}>Acceso Denegado</h1>
        <p>No tienes permisos para acceder a la administración de rechazos.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0px' }}>
      <RechazosAdminView session={session} profile={profile} />
    </div>
  );
}