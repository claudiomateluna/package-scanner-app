// src/app/components/RechazoFormView.tsx
'use client';

import RechazoForm from './RechazoForm';

interface Props {
  profile: { role: string | null };
  packageData?: { OLPN: string; DN: string; Unidades: number; Local: string; Fecha: string; };
  onBack: () => void;
}

export default function RechazoFormView({ profile, packageData, onBack }: Props) {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: 'var(--clr4)' }}>Reportar Rechazo</h1>
        <button 
          onClick={onBack}
          style={{
            padding: '10px 15px',
            backgroundColor: 'var(--clr4)',
            color: 'var(--clr1)',
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
        profile={profile} 
        initialData={packageData}
        onComplete={onBack}
      />
    </div>
  );
}
