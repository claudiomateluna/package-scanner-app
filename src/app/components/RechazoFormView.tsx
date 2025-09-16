// src/app/components/RechazoFormView.tsx
'use client';

import { Session } from '@supabase/supabase-js';
import RechazoForm from './RechazoForm';

interface Props {
  session: Session;
  profile: { role: string | null };
  packageData?: { OLPN: string; DN: string; Unidades: number; Local: string; Fecha: string; };
  onBack: () => void;
}

export default function RechazoFormView({ session, profile, packageData, onBack }: Props) {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#233D4D' }}>Reportar Rechazo</h1>
        <button 
          onClick={onBack}
          style={{
            padding: '10px 15px',
            backgroundColor: '#233D4D',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Volver
        </button>
      </div>
      
      <RechazoForm 
        session={session} 
        profile={profile} 
        initialData={packageData}
        onComplete={onBack}
      />
    </div>
  );
}