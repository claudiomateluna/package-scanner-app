// src/app/components/FaltantesAdminView.tsx
'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import FaltanteRow from './FaltanteRow';
import Image from 'next/image';
import { exportToCSV } from '@/lib/csvExport';

// --- Tipos de Datos ---
interface Faltante {
  id: number;
  ticket_id: string;
  olpn: string;
  delivery_note: string;
  tipo_reporte: string;
  nombre_local: string;
  tipo_local: string;
  fecha: string;
  factura: string | null;
  detalle_producto: string | null;
  talla: string | null;
  cantidad: number | null;
  peso_olpn: string | null;
  detalle_bulto_estado: string | null;
  foto_olpn: string | null;
  foto_bulto: string | null;
  created_at: string;
  created_by_user_name: string;
  updated_at: string | null;
  gestionado: boolean;
  responsabilidad: 'CD' | 'Asume Tienda' | 'Asume Transporte' | null;
  comentarios: string | null;
}

interface Props {
  session: Session;
  profile: { role: string | null };
}

const PAGE_SIZE = 20;

// --- Componente Lightbox para Imágenes ---
const Lightbox = ({ src, onClose }: { src: string; onClose: () => void }) => (
  <div 
    onClick={onClose} 
    style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      backgroundColor: 'rgba(0,0,0,0.8)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      zIndex: 2000, 
      cursor: 'pointer' 
    }}
  >
    <Image src={src} alt="Imagen ampliada" layout="fill" objectFit="contain" />
  </div>
);

export default function FaltantesAdminView({ session, profile }: Props) {
  const [faltantes, setFaltantes] = useState<Faltante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const fetchFaltantes = useCallback(async (pageNumber: number, search: string) => {
    setLoading(true);
    setError(null);
    try {
      const from = pageNumber * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('faltantes')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`nombre_local.ilike.%${search}%,olpn.ilike.%${search}%,ticket_id.ilike.%${search}%,delivery_note.ilike.%${search}%`);
      }

      query = query
        .order('created_at', { ascending: false })
        .order('ticket_id', { ascending: true })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setFaltantes(prev => pageNumber === 0 ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setTotalCount(count || 0);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast.error('Error al cargar los reportes: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const debouncedFetch = setTimeout(() => {
      setPage(0);
      fetchFaltantes(0, searchTerm);
    }, 250);

    return () => clearTimeout(debouncedFetch);
  }, [searchTerm, fetchFaltantes]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFaltantes(nextPage, searchTerm);
  }

  const handleUpdateFaltante = (updatedItem: Faltante) => {
    setFaltantes(prev => prev.map(f => f.id === updatedItem.id ? updatedItem : f));
  };

  const handleExportToCSV = () => {
    // Create a clean version of the data for export
    const exportData = faltantes.map(item => ({
      'Ticket': item.ticket_id,
      'OLPN / B2B': item.olpn,
      'DN': item.delivery_note,
      'Tipo Reporte': item.tipo_reporte,
      'Local': item.nombre_local,
      'Tipo': item.tipo_local,
      'Fecha': item.fecha,
      'Factura': item.factura || '',
      'Producto': item.detalle_producto || '',
      'Talla': item.talla || '',
      'Cantidad': item.cantidad || 0,
      'Peso': item.peso_olpn || '',
      'Estado Bulto': item.detalle_bulto_estado || '',
      'Foto OLPN': item.foto_olpn || '',
      'Foto Bulto': item.foto_bulto || '',
      'Creado Por': item.created_by_user_name,
      'Fecha Reporte': item.created_at,
      'Últ. Actualización': item.updated_at || '',
      'Responsabilidad': item.responsabilidad || '',
      'Gestionado': item.gestionado ? 'Sí' : 'No',
      'Comentarios': item.comentarios || '',
    }));

    const filename = `faltantes_${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCSV(exportData, filename);
  };

  if (error) {
    return <div style={{ padding: '20px', color: 'var(--color-error)' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '5px' }}>
      {lightboxImage && <Lightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Administración de Faltantes ({totalCount} reportes)</h1>
        <button 
          onClick={handleExportToCSV}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: 'var(--color-accent)', 
            color: 'var(--color-card-background)', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Descargar CSV
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Buscar por Local, OLPN, Ticket, DN..." 
          style={{ width: '98%', padding: '10px', fontSize: '1em', backgroundColor: 'var(--color-card-background)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-background)' }}>
            <tr>
              {[ 'Ticket', 'OLPN / B2B', 'DN', 'Reporte', 'Local', 'Tipo', 'Fecha', 'Factura', 'Producto', 'Talla', 'Cant', 'Peso', 'Estado Bulto', 'Foto OLPN', 'Foto Bulto', 'Creado Por', 'Fecha Reporte', 'Últ. Act', 'Responsabilidad', 'Gestionado', 'Comentarios', 'Acciones' ].map(header => (
                <th key={header} style={{ padding: '5px', border: '1px solid var(--color-border)', textAlign: 'left', backgroundColor: 'var(--color-accent)', color: 'var(--color-card-background)', borderTopLeftRadius: '4px', borderTopRightRadius: '4px',WebkitBorderTopRightRadius: '4px' }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {faltantes.map(item => (
              <FaltanteRow 
                key={item.id} 
                item={item} 
                session={session} 
                profile={profile} 
                onImageClick={setLightboxImage} 
                onUpdate={handleUpdateFaltante} 
              />
            ))}
          </tbody>
        </table>
      </div>

      {loading && <div>Cargando...</div>}

      {!loading && hasMore && (
        <button onClick={handleLoadMore} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: 'var(--color-accent)', color: 'var(--color-card-background)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Cargar más
        </button>
      )}

      {!loading && !hasMore && faltantes.length > 0 && <div style={{ marginTop: '20px', color: 'var(--color-text-tertiary)' }}>Fin de los resultados.</div>}

      {!loading && faltantes.length === 0 && <div style={{ marginTop: '20px', color: 'var(--color-text-tertiary)' }}>No se encontraron resultados.</div>}
    </div>
  );
}
