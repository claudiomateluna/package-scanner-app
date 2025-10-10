// src/app/components/TicketViewer.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { FaltanteTicket, RechazoTicket, FaltanteProducto } from './TicketTypes';

// Acknowledge unused FaltanteProducto to prevent ESLint warning
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _FaltanteProducto = FaltanteProducto;
// This is a type-only import, so we add it to ESLint ignore comment

interface TicketViewerProps {
  ticketId: string;
  userId: string;
  onClose: () => void;
}

export default function TicketViewer({ ticketId, userId, onClose }: TicketViewerProps) {
  const [ticket, setTicket] = useState<FaltanteTicket | RechazoTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getPublicUrl = (filePath: string | null, isRechazoImage: boolean = false) => {
    if (!filePath || filePath.trim() === '') return null;
    
    // Determine which bucket based on the type of ticket
    const bucket = isRechazoImage ? 'rechazos-fotos' : 'faltantes-attachments';
    
    // Check if filePath is already a complete URL
    if (filePath.startsWith('http')) {
      // If it contains the storage URL twice, extract the actual path
      const storageUrlPattern = new RegExp(`.*\\/storage\\/v1\\/object\\/public\\/${bucket}\\/`);
      const match = filePath.match(storageUrlPattern);
      if (match && filePath.indexOf(match[0], match[0].length) !== -1) {
        // URL duplication detected, extract the second (actual) part
        const duplicatedIndex = filePath.indexOf(match[0], match[0].length);
        if (duplicatedIndex !== -1) {
          const actualPath = filePath.substring(duplicatedIndex + match[0].length);
          const { data } = supabase.storage.from(bucket).getPublicUrl(actualPath);
          return data.publicUrl;
        } else {
          return filePath; // Return as is if no duplication found
        }
      } else {
        return filePath; // Return as is if no duplication
      }
    } else {
      // If not a full URL, build it properly
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return data?.publicUrl;
    }
  };

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      setError('');
      
      try {
        console.log('Buscando ticket con ID:', ticketId);
        
        // Primero intentamos buscar en la tabla de faltantes
        console.log('1. Buscando en tabla faltantes...');
        const { data: faltantesData, error: faltantesError } = await supabase
          .from('faltantes')
          .select('*')
          .eq('ticket_id', ticketId);
        
        console.log('Resultado de búsqueda en faltantes:', { faltantesData, faltantesError });
        
        if (faltantesData && faltantesData.length > 0) {
          console.log('Tickets de faltantes encontrados:', faltantesData);
          // Si hay múltiples registros, los combinamos
          if (faltantesData.length > 1) {
            // Tomamos el primer registro como base
            const baseTicket = { ...faltantesData[0] } as FaltanteTicket;
            // Agregamos los productos adicionales
            baseTicket.productos = faltantesData.map(item => ({
              id: item.id,
              detalle_producto: item.detalle_producto,
              talla: item.talla,
              cantidad: item.cantidad
            }));
            setTicket(baseTicket);
          } else {
            // Solo un registro
            setTicket(faltantesData[0]);
          }
          setLoading(false);
          return;
        }
        
        // Verificar errores de faltantes (excepto "no encontrado")
        if (faltantesError) {
          console.log('Error en faltantes:', faltantesError);
          if (faltantesError.code === '42501') { // insufficient_privilege
            setError('No tienes permisos para ver este ticket de faltante/sobrante');
            setLoading(false);
            return;
          }
          if (faltantesError.code !== 'PGRST116') { // PGRST116 es "no encontrado"
            console.error('Error en búsqueda de faltantes:', faltantesError);
            setError('Error al buscar ticket de faltante: ' + faltantesError.message);
            setLoading(false);
            return;
          }
        }
        
        // Si no encontramos en faltantes, buscamos en rechazos
        console.log('2. Buscando en tabla rechazos...');
        const { data: rechazosData, error: rechazosError } = await supabase
          .from('rechazos')
          .select('*')
          .eq('ticket_id', ticketId);
        
        console.log('Resultado de búsqueda en rechazos:', { rechazosData, rechazosError });
        
        if (rechazosData && rechazosData.length > 0) {
          console.log('Tickets de rechazos encontrados:', rechazosData);
          // Los rechazos normalmente tienen un solo registro por ticket
          setTicket(rechazosData[0]);
          setLoading(false);
          return;
        }
        
        // Verificar errores de rechazos (excepto "no encontrado")
        if (rechazosError) {
          console.log('Error en rechazos:', rechazosError);
          if (rechazosError.code === '42501') { // insufficient_privilege
            setError('No tienes permisos para ver este ticket de rechazo');
            setLoading(false);
            return;
          }
          if (rechazosError.code !== 'PGRST116') { // PGRST116 es "no encontrado"
            console.error('Error en búsqueda de rechazos:', rechazosError);
            setError('Error al buscar ticket de rechazo: ' + rechazosError.message);
            setLoading(false);
            return;
          }
        }
        
        // Si no encontramos en ninguna tabla
        console.log('No se encontró el ticket en ninguna tabla');
        setError('No se encontró ningún ticket con ese ID');
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError('Error al cargar el ticket: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    
    if (ticketId && userId) {
      fetchTicket();
    }
  }, [ticketId, userId]);

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000
      }}>
        <div style={{
          backgroundColor: 'var(--clr1)',
          padding: '20px',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <h3>Cargando ticket...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000
      }}>
        <div style={{
          backgroundColor: 'var(--clr1)',
          padding: '30px',
          borderRadius: '8px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h3 style={{ color: 'var(--clr6)' }}>Error</h3>
          <p>{error}</p>
          <button 
            onClick={onClose}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: 'var(--clr4)',
              color: 'var(--clr1)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  // Determinar si es un ticket de faltante o rechazo
  const isFaltante = 'olpn' in ticket;
  const isGestionado = 'gestionado' in ticket ? ticket.gestionado : false;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      overflow: 'auto',
      padding: '10px'
    }}>
      <div style={{
        backgroundColor: 'var(--clr1)',
        padding: '20px',
        borderRadius: '4px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h2 style={{ margin: 0 }}>
            {isFaltante ? 'Ticket de Faltante/Sobrante' : 'Ticket de Rechazo'}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              marginBottom: '10px',
              cursor: 'pointer',
              color: 'var(--clr4)'
            }}
          >
            ×
          </button>
        </div>
        
        {/* Indicador de estado */}
        <div style={{ 
          padding: '15px', 
          borderRadius: '4px', 
          marginBottom: '10px',
          backgroundColor: isGestionado ? 'var(--clr5)' : 'var(--clr7)',
          color: 'white',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {isGestionado ? 'GESTIONADO' : 'PENDIENTE'}
        </div>
        
        {/* Información general del ticket */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '10px',
          marginBottom: '10px'
        }}>
          <div>
            <h3 style={{ 
              margin: '0 0 10px 0', 
              color: 'var(--clr4)',
              borderBottom: '1px solid var(--clr4)',
              paddingBottom: '5px'
            }}>
              Información del Ticket
            </h3>
            <p><strong>ID:</strong> {ticket.ticket_id}</p>
            <p><strong>Creado por:</strong> {ticket.created_by_user_name}</p>
            <p><strong>Fecha de creación:</strong> {new Date(ticket.created_at).toLocaleString()}</p>
            {ticket.updated_at && (
              <p><strong>Última actualización:</strong> {new Date(ticket.updated_at).toLocaleString()}</p>
            )}
            {ticket.updated_by_user_name && (
              <p><strong>Actualizado por:</strong> {ticket.updated_by_user_name}</p>
            )}
          </div>
          
          {isFaltante ? (
            // Información específica de faltantes/sobrantes
            <div>
              <h3 style={{ 
                margin: '0 0 10px 0', 
                color: 'var(--clr4)',
                borderBottom: '1px solid var(--clr4)',
                paddingBottom: '5px'
              }}>
                Información del Paquete
              </h3>
              <p><strong>OLPN:</strong> {(ticket as FaltanteTicket).olpn}</p>
              <p><strong>Delivery Note:</strong> {(ticket as FaltanteTicket).delivery_note}</p>
              <p><strong>Nombre del local:</strong> {(ticket as FaltanteTicket).nombre_local}</p>
              <p><strong>Tipo de local:</strong> {(ticket as FaltanteTicket).tipo_local}</p>
              <p><strong>Fecha:</strong> {(ticket as FaltanteTicket).fecha}</p>
              <p><strong>Tipo de reporte:</strong> {(ticket as FaltanteTicket).tipo_reporte}</p>
            </div>
          ) : (
            // Información específica de rechazos
            <div>
              <h3 style={{ 
                margin: '0 0 10px 0', 
                color: 'var(--clr4)',
                borderBottom: '1px solid var(--clr4)',
                paddingBottom: '5px'
              }}>
                Información del Rechazo
              </h3>
              <p><strong>Folio:</strong> {(ticket as RechazoTicket).folio}</p>
              <p><strong>OC:</strong> {(ticket as RechazoTicket).oc}</p>
              <p><strong>Fecha:</strong> {(ticket as RechazoTicket).fecha}</p>
              <p><strong>Hora:</strong> {(ticket as RechazoTicket).hora}</p>
              <p><strong>Nombre del local:</strong> {(ticket as RechazoTicket).nombre_local}</p>
              <p><strong>Tipo de local:</strong> {(ticket as RechazoTicket).tipo_local}</p>
              <p><strong>Cliente final:</strong> {(ticket as RechazoTicket).cliente_final}</p>
              <p><strong>Tipo de rechazo:</strong> {(ticket as RechazoTicket).tipo_rechazo}</p>
            </div>
          )}
        </div>
        
        {/* Detalles adicionales */}
        <div style={{ marginBottom: '10px' }}>
          <h3 style={{ 
            margin: '0 0 10px 0', 
            color: 'var(--clr4)',
            borderBottom: '1px solid var(--clr4)',
            paddingBottom: '5px'
          }}>
            Detalles
          </h3>
          
          {isFaltante ? (
            // Para faltantes, mostrar productos si existen
            <>
              {(ticket as FaltanteTicket).productos && (ticket as FaltanteTicket).productos!.length > 0 ? (
                <div>
                  <h4 style={{ 
                    margin: '0 0 15px 0', 
                    color: 'var(--clr4)'
                  }}>
                    Productos ({(ticket as FaltanteTicket).productos!.length})
                  </h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '10px'
                  }}>
                    {(ticket as FaltanteTicket).productos!.map((producto, index) => (
                      <div key={index} style={{ 
                        border: '1px solid var(--clr4)', 
                        borderRadius: '4px', 
                        padding: '10px',
                        backgroundColor: 'var(--clr1)'
                      }}>
                        <h5 style={{ 
                          margin: '0 0 10px 0', 
                          color: 'var(--clr4)'
                        }}>
                          Producto {index + 1}
                        </h5>
                        <p><strong>Detalle del producto:</strong></p>
                        <p>{producto.detalle_producto || 'No especificado'}</p>
                        <p><strong>Talla:</strong></p>
                        <p>{producto.talla || 'No especificado'}</p>
                        <p><strong>Cantidad:</strong></p>
                        <p>{producto.cantidad || 'No especificado'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Mostrar detalles del producto individual si no hay múltiples productos
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '10px'
                }}>
                  <div>
                    <p><strong>Factura:</strong></p>
                    <p>{(ticket as FaltanteTicket).factura || 'No especificado'}</p>
                  </div>
                  <div>
                    <p><strong>Detalle del producto:</strong></p>
                    <p>{(ticket as FaltanteTicket).detalle_producto || 'No especificado'}</p>
                  </div>
                  <div>
                    <p><strong>Talla:</strong></p>
                    <p>{(ticket as FaltanteTicket).talla || 'No especificado'}</p>
                  </div>
                  <div>
                    <p><strong>Cantidad:</strong></p>
                    <p>{(ticket as FaltanteTicket).cantidad || 'No especificado'}</p>
                  </div>
                  <div>
                    <p><strong>Peso OLPN:</strong></p>
                    <p>{(ticket as FaltanteTicket).peso_olpn || 'No especificado'}</p>
                  </div>
                  <div>
                    <p><strong>Estado del bulto:</strong></p>
                    <p>{(ticket as FaltanteTicket).detalle_bulto_estado || 'No especificado'}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Para rechazos, mostrar detalles normales
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '5px'
            }}>
              <div>
                <p><strong>Motivo:</strong></p>
                <p>{(ticket as RechazoTicket).motivo || 'No especificado'}</p>
              </div>
              <div>
                <p><strong>Responsabilidad:</strong></p>
                <p>{(ticket as RechazoTicket).responsabilidad || 'No especificado'}</p>
              </div>
              <div>
                <p><strong>Área de responsabilidad:</strong></p>
                <p>{(ticket as RechazoTicket).responsabilidad_area || 'No especificado'}</p>
              </div>
              <div>
                <p><strong>Ruta:</strong></p>
                <p>{(ticket as RechazoTicket).ruta || 'No especificado'}</p>
              </div>
              <div>
                <p><strong>Mes:</strong></p>
                <p>{(ticket as RechazoTicket).mes || 'No especificado'}</p>
              </div>
              <div>
                <p><strong>Transporte:</strong></p>
                <p>{(ticket as RechazoTicket).transporte || 'No especificado'}</p>
              </div>
              <div>
                <p><strong>Unidades rechazadas:</strong></p>
                <p>{(ticket as RechazoTicket).unidades_rechazadas || 'No especificado'}</p>
              </div>
              <div>
                <p><strong>Unidades totales:</strong></p>
                <p>{(ticket as RechazoTicket).unidades_totales || 'No especificado'}</p>
              </div>
              <div>
                <p><strong>Bultos rechazados:</strong></p>
                <p>{(ticket as RechazoTicket).bultos_rechazados || 'No especificado'}</p>
              </div>
              <div>
                <p><strong>Bultos totales:</strong></p>
                <p>{(ticket as RechazoTicket).bultos_totales || 'No especificado'}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Fotos si existen */}
        {isFaltante ? (
          ((ticket as FaltanteTicket).foto_olpn || (ticket as FaltanteTicket).foto_bulto) && (
            <div style={{ marginBottom: '10px' }}>
              <h3 style={{ 
                margin: '0 0 10px 0', 
                color: 'var(--clr4)',
                borderBottom: '1px solid var(--clr4)',
                paddingBottom: '5px'
              }}>
                Fotos
              </h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {(ticket as FaltanteTicket).foto_olpn && (
                  <div>
                    <p><strong>Foto de OLPN:</strong></p>
                    <Image 
                      src={getPublicUrl((ticket as FaltanteTicket).foto_olpn!, false)!} 
                      alt="Foto de OLPN" 
                      width={200} 
                      height={200} 
                      style={{ maxWidth: '200px', maxHeight: '200px', border: '1px solid var(--clr4)' }} 
                    />
                  </div>
                )}
                {(ticket as FaltanteTicket).foto_bulto && (
                  <div>
                    <p><strong>Foto de bulto:</strong></p>
                    <Image 
                      src={getPublicUrl((ticket as FaltanteTicket).foto_bulto!, false)!} 
                      alt="Foto de bulto" 
                      width={200} 
                      height={200} 
                      style={{ maxWidth: '200px', maxHeight: '200px', border: '1px solid var(--clr4)' }} 
                    />
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          (ticket as RechazoTicket).foto_rechazado && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                margin: '0 0 10px 0', 
                color: 'var(--clr4)',
                borderBottom: '1px solid var(--clr4)',
                paddingBottom: '5px'
              }}>
                Foto
              </h3>
              <Image 
                src={getPublicUrl((ticket as RechazoTicket).foto_rechazado!, true)!} 
                alt="Foto de rechazo" 
                width={300} 
                height={300} 
                style={{ maxWidth: '300px', maxHeight: '300px', border: '1px solid var(--clr4)' }} 
              />
            </div>
          )
        )}
        
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--clr4)',
              color: 'var(--clr1)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}