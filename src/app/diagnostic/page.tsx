// src/app/diagnostic/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DiagnosticPage() {
  const [ticketId, setTicketId] = useState('RTL000000001');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testTicketSearch = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      console.log('Buscando ticket:', ticketId);
      
      // Buscar en faltantes
      console.log('Buscando en faltantes...');
      const { data: faltantesData, error: faltantesError } = await supabase
        .from('faltantes')
        .select('*')
        .eq('ticket_id', ticketId);
      
      console.log('Resultado faltantes:', { data: faltantesData, error: faltantesError });
      
      if (faltantesData && faltantesData.length > 0) {
        setResult({
          table: 'faltantes',
          data: faltantesData[0]
        });
        return;
      }
      
      // Buscar en rechazos
      console.log('Buscando en rechazos...');
      const { data: rechazosData, error: rechazosError } = await supabase
        .from('rechazos')
        .select('*')
        .eq('ticket_id', ticketId);
      
      console.log('Resultado rechazos:', { data: rechazosData, error: rechazosError });
      
      if (rechazosData && rechazosData.length > 0) {
        setResult({
          table: 'rechazos',
          data: rechazosData[0]
        });
        return;
      }
      
      // Mostrar registros existentes
      console.log('Mostrando registros existentes...');
      const { data: faltantesSample, error: faltantesSampleError } = await supabase
        .from('faltantes')
        .select('ticket_id')
        .limit(5);
      
      const { data: rechazosSample, error: rechazosSampleError } = await supabase
        .from('rechazos')
        .select('ticket_id')
        .limit(5);
      
      setResult({
        message: 'No se encontró el ticket',
        faltantesSample: faltantesSample,
        rechazosSample: rechazosSample
      });
      
    } catch (err) {
      console.error('Error:', err);
      setError('Error al buscar el ticket: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Diagnóstico de Búsqueda de Tickets</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          Ticket ID:
          <input
            type="text"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            style={{ 
              marginLeft: '10px', 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px' 
            }}
          />
        </label>
        <button
          onClick={testTicketSearch}
          disabled={loading}
          style={{ 
            marginLeft: '10px', 
            padding: '8px 16px', 
            backgroundColor: '#0070f3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
      
      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '15px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>Resultado:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '15px', 
        borderRadius: '4px'
      }}>
        <h3>Instrucciones:</h3>
        <p>1. Ingresa un ID de ticket para buscarlo</p>
        <p>2. Revisa la consola del navegador para ver los logs detallados</p>
        <p>3. Si no encuentras el ticket, revisa los ejemplos mostrados en el resultado</p>
      </div>
    </div>
  );
}