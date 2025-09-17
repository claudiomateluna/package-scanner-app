// src/app/components/TicketSearch.tsx
'use client';

import { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import TicketViewer from './TicketViewer';

interface TicketSearchProps {
  session: Session;
}

export default function TicketSearch({ session }: TicketSearchProps) {
  const [ticketId, setTicketId] = useState('');
  const [showViewer, setShowViewer] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketId.trim()) {
      setShowViewer(true);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', color: 'var(--color-text-primary)' }}>
        Buscar Ticket
      </h2>
      <form onSubmit={handleSubmit} style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
          placeholder="Ingrese el ID del ticket (ej: RTL000000001)"
          style={{
            flex: 1,
            padding: '12px',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            backgroundColor: 'var(--color-card-background)',
            color: 'var(--color-text-primary)'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '12px 20px',
            backgroundColor: 'var(--color-button-background)',
            color: 'var(--color-button-text)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Buscar
        </button>
      </form>
      
      <div style={{ 
        backgroundColor: 'var(--color-card-background)',
        padding: '20px',
        borderRadius: '4px',
        border: '1px solid var(--color-border)'
      }}>
        <h3 style={{ marginTop: 0, color: 'var(--color-text-primary)' }}>
          Instrucciones
        </h3>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Ingrese el ID completo del ticket</li>
          <li>Los tickets de faltantes/sobrantes comienzan con el tipo de local seguido de 9 dígitos</li>
          <li>Formatos válidos: RTL000000001, FRA000000001, SKA000000001, WHS000000001</li>
          <li>Los tickets de rechazos comienzan con &quot;REC&quot; seguido de 9 dígitos</li>
          <li>Formato válido: REC000000001</li>
          <li>Ejemplo: RTL000000001 o REC000000001</li>
        </ul>
      </div>
      
      {showViewer && session?.user?.id && (
        <TicketViewer 
          ticketId={ticketId} 
          userId={session.user.id}
          onClose={() => setShowViewer(false)} 
        />
      )}
    </div>
  );
}