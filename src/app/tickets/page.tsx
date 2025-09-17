// src/app/tickets/page.tsx
'use client';

import TicketSearch from '../components/TicketSearch';

export default function TicketsPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: 'var(--color-text-primary)',
        marginBottom: '30px'
      }}>
        Gestión de Tickets
      </h1>
      <TicketSearch />
    </div>
  );
}