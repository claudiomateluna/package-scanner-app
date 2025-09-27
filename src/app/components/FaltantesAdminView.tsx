// src/app/components/FaltantesAdminView.tsx
'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { exportToCSV } from '@/lib/csvExport';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import ToggleSwitch from './ToggleSwitch';

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
    <Image src={src} alt="Imagen ampliada" width={800} height={600} style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain' }} />
  </div>
);

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const [year, month, day] = date.toISOString().split('T')[0].split('-');
  return `${day}-${month}-${year}`;
};

export default function FaltantesAdminView({ session, profile }: Props) {
  const [faltantes, setFaltantes] = useState<Faltante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFaltante, setEditingFaltante] = useState<Partial<Faltante> | null>(null);

  const handleGestionadoToggle = async (faltanteId: number, newGestionadoState: boolean) => {
    // Actualizar estado local inmediatamente para feedback visual
    setFaltantes(prevFaltantes => 
      prevFaltantes.map(f => 
        f.id === faltanteId ? { 
          ...f, 
          gestionado: newGestionadoState, 
          updated_at: new Date().toISOString(),
        } : f
      )
    );

    try {
      const { error } = await supabase
        .from('faltantes')
        .update({ 
          gestionado: newGestionadoState,
          updated_at: new Date().toISOString(),
          updated_by_user_id: session.user.id,
          updated_by_user_name: session.user.user_metadata?.full_name || session.user.email,
        })
        .eq('id', faltanteId);

      if (error) throw error;
    } catch (err) {
      console.error('Error toggling gestionado state:', err);
      // Revertir el cambio si falla
      setFaltantes(prevFaltantes => 
        prevFaltantes.map(f => 
          f.id === faltanteId ? { ...f, gestionado: !newGestionadoState } : f
        )
      );
      toast.error('Error al actualizar el estado de gestión. Por favor, inténtelo de nuevo.');
    }
  };

  const handleEditClick = (faltante: Faltante) => {
    setEditingFaltante(faltante);
    setIsEditModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setEditingFaltante(null);
  };

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingFaltante) return;
    const { name, value } = e.target;
    setEditingFaltante({ ...editingFaltante, [name]: value });
  };

  const handleSaveChanges = async () => {
    if (!editingFaltante || !editingFaltante.id) return;
    
    try {
      const { error } = await supabase
        .from('faltantes')
        .update({ 
          ...editingFaltante,
          updated_at: new Date().toISOString(),
          updated_by_user_id: session.user.id,
          updated_by_user_name: session.user.user_metadata?.full_name || session.user.email,
        })
        .eq('id', editingFaltante.id);
      
      if (error) throw error;
      
      // Actualizar la lista de faltantes con los cambios
      setFaltantes(faltantes.map(f => 
        f.id === editingFaltante.id ? { ...f, ...editingFaltante } as Faltante : f
      ));
      
      handleModalClose();
      toast.success('Faltante actualizado correctamente');
    } catch (err) {
      console.error('Error updating faltante:', err);
      toast.error('Error al actualizar el faltante');
    }
  };

  const getPublicUrl = (filePath: string | null) => {
    if (!filePath) return null;
    const { data } = supabase.storage.from('faltantes-attachments').getPublicUrl(filePath);
    return data?.publicUrl;
  };

  const openLightbox = (imageUrl: string) => {
    // If the URL is already a complete URL, use it directly
    // Otherwise, try to get the public URL from Supabase storage
    if (imageUrl.startsWith('http')) {
      setLightboxImage(imageUrl);
    } else {
      const publicUrl = getPublicUrl(imageUrl);
      setLightboxImage(publicUrl || imageUrl);
    }
  };

  const columns: ColumnDef<Faltante>[] = [
    { accessorKey: 'ticket_id', header: 'Ticket', minSize: 85, maxSize: 100 },
    { accessorKey: 'olpn', header: 'OLPN / B2B', minSize: 150, maxSize: 200 },
    { accessorKey: 'delivery_note', header: 'DN', minSize: 80, maxSize: 120 },
    { 
      accessorKey: 'tipo_reporte', 
      header: 'Reporte',
      minSize: 70,
      maxSize: 90,
      cell: info => <div title={info.getValue() as string}>{(info.getValue() as string)?.substring(0, 20)}...</div>
    },
    { accessorKey: 'nombre_local', header: 'Local', minSize: 120 },
    { accessorKey: 'tipo_local', header: 'Tipo', minSize: 40, maxSize: 80 },
    { accessorKey: 'fecha', header: 'Fecha', minSize: 85, maxSize:100, cell: info => formatDate(info.getValue() as string) },
    { accessorKey: 'factura', header: 'Factura', minSize: 75, maxSize:150 },
    { accessorKey: 'detalle_producto', header: 'Producto', minSize: 55, maxSize: 180 },
    { accessorKey: 'talla', header: 'Talla', minSize: 30, maxSize: 100 },
    { accessorKey: 'cantidad', header: 'Cant', minSize: 30, maxSize: 100 },
    { accessorKey: 'peso_olpn', header: 'Peso', minSize: 35, maxSize: 100 },
    { accessorKey: 'detalle_bulto_estado', header: 'Estado Bulto', minSize: 180 },
    {
      accessorKey: 'foto_olpn',
      header: 'Foto OLPN',
      enableSorting: false,
      enableColumnFilter: false,
      minSize: 45,
      maxSize: 80,
      cell: ({ row }) => {
        const publicUrl = getPublicUrl(row.original.foto_olpn);
        return publicUrl ? <Image src={publicUrl} alt="Foto OLPN" width={50} height={50} style={{ width: '50px', height: '50px', cursor: 'pointer', objectFit: 'cover' }} onClick={() => openLightbox(publicUrl)} /> : null;
      }
    },
    {
      accessorKey: 'foto_bulto',
      header: 'Foto Bulto',
      enableSorting: false,
      enableColumnFilter: false,
      minSize: 45,
      maxSize: 80,
      cell: ({ row }) => {
        const publicUrl = getPublicUrl(row.original.foto_bulto);
        return publicUrl ? <Image src={publicUrl} alt="Foto Bulto" width={50} height={50} style={{ width: '50px', height: '50px', cursor: 'pointer', objectFit: 'cover' }} onClick={() => openLightbox(publicUrl)} /> : null;
      }
    },
    { accessorKey: 'created_by_user_name', header: 'Creado Por', minSize: 250 },
    { accessorKey: 'created_at', header: 'Fecha Reporte', minSize: 103, maxSize: 120, cell: info => formatDate(info.getValue() as string) },
    { accessorKey: 'updated_at', header: 'Últ. Act', minSize: 81, maxSize: 120, cell: info => formatDate(info.getValue() as string) },
    { 
      accessorKey: 'responsabilidad', 
      header: 'Responsabilidad', 
      minSize: 110,
      maxSize: 250,
      cell: info => info.getValue() as string || 'No asignada'
    },
    {
      accessorKey: 'gestionado',
      header: 'Gestionado',
      minSize: 75,
      maxSize: 80,
      cell: ({ row }) => (
        <ToggleSwitch 
            checked={row.original.gestionado}
            onChange={(newCheckedState) => handleGestionadoToggle(row.original.id, newCheckedState)}
        />
      )
    },
    { accessorKey: 'comentarios', header: 'Comentarios', minSize: 150 },
    {
      id: 'acciones',
      header: 'Acciones',
      minSize: 100,
      cell: ({ row }) => <button onClick={() => handleEditClick(row.original)} style={{ padding: '6px 12px', backgroundColor: 'var(--color-button-background)', color: 'var(--color-button-text)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
    }
  ];

  const table = useReactTable({
    data: faltantes,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    enableSorting: true,
    enableFilters: true,
  });

  useEffect(() => {
    const fetchFaltantes = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all faltantes data without pagination to support filtering and sorting
        const { data, error, count } = await supabase
          .from('faltantes')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (error) throw error;

        setFaltantes(data || []);
        setTotalCount(count || 0);

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        toast.error('Error al cargar los reportes: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchFaltantes();
  }, []);

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
    <>
      <style>{`
        .resizer { position: absolute; right: 0; top: 0; height: 100%; width: 5px; background: rgba(0, 0, 0, 0.5); cursor: col-resize; user-select: none; touch-action: none; opacity: 0; }
        .resizer.isResizing { background: var(--color-accent); opacity: 1; }
        th:hover .resizer { opacity: 1; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.7); z-index: 1000; display: flex; justify-content: center; align-items: center; }
        .modal-content { background-color: var(--color-card-background); padding: 25px; border-radius: 8px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; }
        .modal-form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
        .modal-form-grid label { font-weight: bold; margin-bottom: 5px; display: block; }
        .modal-form-grid input, .modal-form-grid select, .modal-form-grid textarea { width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 4px; background-color: var(--color-card-background); color: var(--color-text-primary); }
        table { table-layout: fixed; }
      `}</style>
      
      <div style={{ width: '100%', padding: '5px', boxSizing: 'border-box', maxWidth: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '5px' }}>
          <div style={{ display: 'flex', gap: '5px', width: '85%' }}><h2 style={{ color: 'var(--color-text-primary)', marginBottom: '0' }}>Administración de Faltantes ({totalCount} reportes)</h2></div>
          <div style={{ display: 'flex', gap: '5px', width: '15%' }}>
                <Image src="/descargarCsv1.svg" alt="Descargar CSV" width={80} height={50} style={{marginBottom:'0'}} onClick={handleExportToCSV} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '5px', width: '100%', marginBottom: '20px' }}>
          <input 
            type="text" 
            value={globalFilter ?? ''} 
            onChange={e => setGlobalFilter(e.target.value)} 
            placeholder="Buscar en toda la tabla..." 
            style={{ 
              padding: '8px', 
              border: '1px solid var(--color-border)', 
              borderRadius: '4px', 
              width: '100%', 
              backgroundColor: 'var(--color-card-background)', 
              color: 'var(--color-text-primary)' 
            }} 
          />
        </div>
        
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: table.getTotalSize(), borderCollapse: 'collapse' }}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)' }}>
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id} 
                      colSpan={header.colSpan} 
                      style={{ 
                        position: 'relative', 
                        width: header.getSize(), 
                        padding: '12px', 
                        textAlign: 'left',
                        minWidth: header.column.columnDef.minSize ? `${header.column.columnDef.minSize}px` : 'auto'
                      }}
                    >
                      <div 
                        {...{
                          onClick: header.column.getToggleSortingHandler(),
                          className: header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
                      </div>
                      {header.column.getCanFilter() ? (
                        <div>
                          <input 
                            type="text" 
                            value={(header.column.getFilterValue() ?? '') as string} 
                            onChange={e => header.column.setFilterValue(e.target.value)} 
                            placeholder={`Filtrar...`} 
                            style={{ 
                              width: '100%', 
                              marginTop: '5px', 
                              padding: '4px', 
                              borderRadius: '4px', 
                              border: '1px solid var(--color-border)', 
                              backgroundColor: 'var(--color-card-background)', 
                              color: 'var(--color-text-primary)' 
                            }} 
                            onClick={e => e.stopPropagation()} 
                          />
                        </div>
                      ) : null}
                      <div 
                        {...{ 
                          onMouseDown: header.getResizeHandler(), 
                          onTouchStart: header.getResizeHandler() 
                        }} 
                        className={`resizer ${header.column.getIsResizing() ? 'isResizing' : ''}`} 
                      />
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {row.getVisibleCells().map(cell => (
                    <td 
                      key={cell.id} 
                      style={{ 
                        width: cell.column.getSize(), 
                        padding: '12px',
                        verticalAlign: 'top'
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isEditModalOpen && editingFaltante && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ marginBottom: '20px' }}>Editando Ticket: {editingFaltante.ticket_id}</h3>
              <div className="modal-form-grid">
                 {/* Campos del formulario de faltante */}
                 <div>
                   <label>Ticket ID</label>
                   <input 
                     type="text" 
                     name="ticket_id" 
                     value={editingFaltante.ticket_id || ''} 
                     onChange={handleModalChange} 
                     readOnly
                     style={{ backgroundColor: '#f0f0f0' }}
                   />
                 </div>
                 
                 <div>
                   <label>OLPN</label>
                   <input 
                     type="text" 
                     name="olpn" 
                     value={editingFaltante.olpn || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div>
                   <label>DN (Documento de Nota)</label>
                   <input 
                     type="text" 
                     name="delivery_note" 
                     value={editingFaltante.delivery_note || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div>
                   <label>Tipo de Reporte</label>
                   <select 
                     name="tipo_reporte" 
                     value={editingFaltante.tipo_reporte || ''} 
                     onChange={handleModalChange}
                   >
                     <option value="">Seleccione tipo</option>
                     <option value="Faltante">Faltante</option>
                     <option value="Sobrante">Sobrante</option>
                   </select>
                 </div>
                 
                 <div>
                   <label>Nombre Local</label>
                   <input 
                     type="text" 
                     name="nombre_local" 
                     value={editingFaltante.nombre_local || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div>
                   <label>Tipo Local</label>
                   <select
                     name="tipo_local" 
                     value={editingFaltante.tipo_local || ''} 
                     onChange={handleModalChange} 
                   >
                      <option value="">Seleccione tipo</option>
                      <option value="FRA">FRA</option>
                      <option value="RTL">RTL</option>
                      <option value="SKA">SKA</option>
                      <option value="WHS">WHS</option>
                    </select>
                 </div>
                 
                 <div>
                   <label>Fecha</label>
                   <input 
                     type="date" 
                     name="fecha" 
                     value={editingFaltante.fecha || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div>
                   <label>Factura</label>
                   <input 
                     type="text" 
                     name="factura" 
                     value={editingFaltante.factura || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div style={{ gridColumn: '1 / -1' }}>
                   <label>Detalle Producto</label>
                   <textarea 
                     name="detalle_producto" 
                     value={editingFaltante.detalle_producto || ''} 
                     onChange={handleModalChange} 
                     rows={2}
                   />
                 </div>
                 
                 <div>
                   <label>Talla</label>
                   <input 
                     type="text" 
                     name="talla" 
                     value={editingFaltante.talla || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div>
                   <label>Cantidad</label>
                   <input 
                     type="number" 
                     name="cantidad" 
                     value={editingFaltante.cantidad || 0} 
                     onChange={handleModalChange} 
                     min="0"
                   />
                 </div>
                 
                 <div>
                   <label>Peso OLPN</label>
                   <input 
                     type="text" 
                     name="peso_olpn" 
                     value={editingFaltante.peso_olpn || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div>
                   <label>Detalle Bulto Estado</label>
                   <input 
                     type="text" 
                     name="detalle_bulto_estado" 
                     value={editingFaltante.detalle_bulto_estado || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div>
                   <label>Foto OLPN URL</label>
                   <input 
                     type="text" 
                     name="foto_olpn" 
                     value={editingFaltante.foto_olpn || ''} 
                     onChange={handleModalChange} 
                     readOnly
                     style={{ backgroundColor: '#f0f0f0' }}
                     placeholder="Ruta del archivo en storage"
                   />
                 </div>
                 
                 <div>
                   <label>Foto Bulto URL</label>
                   <input 
                     type="text" 
                     name="foto_bulto" 
                     value={editingFaltante.foto_bulto || ''} 
                     onChange={handleModalChange} 
                     readOnly
                     style={{ backgroundColor: '#f0f0f0' }}
                     placeholder="Ruta del archivo en storage"
                   />
                 </div>
                 
                 <div>
                   <label>Responsabilidad</label>
                   <select 
                     name="responsabilidad" 
                     value={editingFaltante.responsabilidad || ''} 
                     onChange={handleModalChange}
                   >
                     <option value="">Seleccione responsabilidad</option>
                     <option value="CD">CD</option>
                     <option value="Asume Tienda">Asume Tienda</option>
                     <option value="Asume Transporte">Asume Transporte</option>
                   </select>
                 </div>
                 
                 <div style={{ gridColumn: '1 / -1' }}>
                   <label>Comentarios</label>
                   <textarea 
                     name="comentarios" 
                     value={editingFaltante.comentarios || ''} 
                     onChange={handleModalChange} 
                     rows={3}
                   />
                 </div>
                 
                 <div>
                   <label>
                     <input 
                       type="checkbox" 
                       name="gestionado" 
                       checked={editingFaltante.gestionado || false} 
                       onChange={(e) => setEditingFaltante({ ...editingFaltante, gestionado: e.target.checked })}
                     />
                     Gestionado
                   </label>
                 </div>
              </div>
              <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={handleModalClose} style={{ padding: '10px 20px', backgroundColor: 'var(--color-button-alternative-background)', color: 'var(--color-button-alternative-text)', border: '1px solid var(--color-button-alternative-border)', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleSaveChanges} style={{ padding: '10px 20px', backgroundColor: 'var(--color-success)', color: 'var(--color-card-background)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Guardar Cambios</button>
              </div>
            </div>
          </div>
        )}

        {lightboxImage && (
          <div onClick={() => setLightboxImage(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Image src={lightboxImage} alt="Imagen ampliada" width={800} height={600} style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain' }} />
          </div>
        )}
      </div>
    </>
  );
}
