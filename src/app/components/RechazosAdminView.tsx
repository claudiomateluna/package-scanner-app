// src/app/components/RechazosAdminView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
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
import { exportToCSV } from '@/lib/csvExport';

interface Props {
    session: Session;
}

interface Rechazo {
    id: number;
    ticket_id: string;
    tipo_rechazo: string;
    ruta: string;
    mes: string;
    fecha: string;
    hora: string;
    folio: string;
    oc: string;
    nombre_local: string;
    tipo_local: string;
    cliente_final: string;
    motivo: string | null;
    responsabilidad: string | null;
    responsabilidad_area: string | null;
    unidades_rechazadas: number | null;
    unidades_totales: number | null;
    bultos_rechazados: number | null;
    bultos_totales: number | null;
    transporte: string | null;
    foto_rechazado: string | null;
    gestionado: boolean;
    created_at: string;
    created_by_user_name: string;
    updated_at: string;
    updated_by_user_name: string;
}

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const [year, month, day] = date.toISOString().split('T')[0].split('-');
    return `${day}-${month}-${year}`;
};

const formatMonthInSpanish = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return monthNames[date.getUTCMonth()];
};

const formatMonthYearInSpanish = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

export default function RechazosAdminView({ session }: Props) {
  const [rechazos, setRechazos] = useState<Rechazo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRechazo, setEditingRechazo] = useState<Partial<Rechazo> | null>(null);

  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');

  const getPublicUrl = (filePath: string | null) => {
    if (!filePath || filePath.trim() === '') return null;
    
    // Check if filePath is already a complete URL
    if (filePath.startsWith('http')) {
      // If it contains the storage URL twice, extract the actual path
      const storageUrlPattern = /.*\/storage\/v1\/object\/public\/rechazos-fotos\//;
      const match = filePath.match(storageUrlPattern);
      if (match && filePath.indexOf(match[0], match[0].length) !== -1) {
        // URL duplication detected, extract the second (actual) part
        const duplicatedIndex = filePath.indexOf(match[0], match[0].length);
        if (duplicatedIndex !== -1) {
          const actualPath = filePath.substring(duplicatedIndex + match[0].length);
          const { data } = supabase.storage.from('rechazos-fotos').getPublicUrl(actualPath);
          return data.publicUrl;
        } else {
          return filePath; // Return as is if no duplication found
        }
      } else {
        return filePath; // Return as is if no duplication
      }
    } else {
      // If not a full URL, build it properly
      const { data } = supabase.storage.from('rechazos-fotos').getPublicUrl(filePath);
      return data?.publicUrl;
    }
  };

  const handleEditClick = (rechazo: Rechazo) => {
    setEditingRechazo(rechazo);
    setIsEditModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setEditingRechazo(null);
  };

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingRechazo) return;
    const { name, value } = e.target;
    setEditingRechazo({ ...editingRechazo, [name]: value });
  };

  const handleSaveChanges = async () => {
    if (!editingRechazo || !editingRechazo.id) return;
    
    try {
      // Excluir explícitamente campos que no deben actualizarse
      const { id, created_at, ticket_id, ...updateData } = editingRechazo;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = [id, created_at, ticket_id]; // Mantenemos las variables para evitar warnings
      
      const { error } = await supabase
        .from('rechazos')
        .update({ 
          ...updateData, 
          updated_at: new Date().toISOString(), 
          updated_by_user_id: session.user.id, 
          updated_by_user_name: session.user.user_metadata?.full_name || session.user.email,
        })
        .eq('id', editingRechazo.id);
      
      if (error) throw error;
      
      // Actualizar la lista de rechazos con los cambios
      setRechazos(rechazos.map(r => 
        r.id === editingRechazo.id ? { ...r, ...editingRechazo } as Rechazo : r
      ));
      
      handleModalClose();
    } catch (err) {
      console.error('Error updating rechazo:', err);
      setError('Error al actualizar el rechazo');
    }
  };

  const handleGestionadoToggle = async (rechazoId: number, newGestionadoState: boolean) => {
    // Actualizar estado local inmediatamente para feedback visual
    const originalRechazos = [...rechazos];
    setRechazos(prevRechazos => 
        prevRechazos.map(r => 
            r.id === rechazoId ? { 
              ...r, 
              gestionado: newGestionadoState, 
              updated_at: new Date().toISOString(), 
              updated_by_user_name: session.user.user_metadata?.full_name || session.user.email 
            } : r
        )
    );

    try {
        const { error } = await supabase
            .from('rechazos')
            .update({ 
                gestionado: newGestionadoState,
                updated_at: new Date().toISOString(),
                updated_by_user_id: session.user.id,
                updated_by_user_name: session.user.user_metadata?.full_name || session.user.email,
            })
            .eq('id', rechazoId);

        if (error) {
            setError('Error al actualizar. Reintentando...');
            setRechazos(originalRechazos);
            throw error;
        }
    } catch (err) {
        console.error('Error toggling gestionado state:', err);
        // Mostrar mensaje de error al usuario
        alert('Error al actualizar el estado de gestión. Por favor, inténtelo de nuevo.');
    }
  };

  const openLightbox = (imageUrl: string) => {
    // Check if the URL is already a complete URL
    if (imageUrl.startsWith('http')) {
      // If it contains the storage URL twice, extract the actual path
      const storageUrlPattern = /.*\/storage\/v1\/object\/public\/rechazos-fotos\//;
      const match = imageUrl.match(storageUrlPattern);
      if (match && imageUrl.indexOf(match[0], match[0].length) !== -1) {
        // URL duplication detected, extract the second (actual) part
        const duplicatedIndex = imageUrl.indexOf(match[0], match[0].length);
        if (duplicatedIndex !== -1) {
          const actualPath = imageUrl.substring(duplicatedIndex + match[0].length);
          const { data } = supabase.storage.from('rechazos-fotos').getPublicUrl(actualPath);
          setLightboxImage(data.publicUrl);
        } else {
          setLightboxImage(imageUrl); // Use as is if no duplication found
        }
      } else {
        setLightboxImage(imageUrl); // Use as is if no duplication
      }
    } else {
      // If not a full URL, build it properly
      const publicUrl = getPublicUrl(imageUrl);
      setLightboxImage(publicUrl || imageUrl);
    }
    setShowLightbox(true);
  };

  const handleExportToCSV = () => {
    // Create a clean version of the data for export
    const exportData = rechazos.map(item => ({
      'Ticket ID': item.ticket_id,
      'Tipo Rechazo': item.tipo_rechazo,
      'Ruta': item.ruta,
      'Mes': formatMonthYearInSpanish(item.mes),
      'Fecha': formatDate(item.fecha),
      'Hora': item.hora,
      'Folio': item.folio,
      'OC': item.oc,
      'Cliente': item.nombre_local,
      'Tipo Local': item.tipo_local,
      'Cliente Final': item.cliente_final,
      'Motivo': item.motivo || '',
      'Responsabilidad': item.responsabilidad || '',
      'Área': item.responsabilidad_area || '',
      'Unid. Rech.': item.unidades_rechazadas || 0,
      'Unid. Tot.': item.unidades_totales || 0,
      'Bultos Rech.': item.bultos_rechazados || 0,
      'Bultos Tot.': item.bultos_totales || 0,
      'Transporte': item.transporte || '',
      'Foto': item.foto_rechazado || '',
      'Creado por': item.created_by_user_name,
      'Actualizado por': item.updated_by_user_name,
      'Actualizado': formatDate(item.updated_at),
      'Gestionado': item.gestionado ? 'Sí' : 'No',
    }));

    const filename = `rechazos_${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCSV(exportData, filename);
  };

  const columns: ColumnDef<Rechazo>[] = [
    { accessorKey: 'ticket_id', header: 'Ticket ID', minSize: 85, maxSize: 120 },
    { accessorKey: 'tipo_rechazo', header: 'Tipo Rechazo', minSize: 95, maxSize: 120 },
    { accessorKey: 'ruta', header: 'Ruta', minSize: 40, maxSize: 80 },
    { accessorKey: 'mes', header: 'Mes', cell: info => formatMonthYearInSpanish(info.getValue() as string), minSize: 90, maxSize: 120 },
    { accessorKey: 'fecha', header: 'Fecha', cell: info => formatDate(info.getValue() as string), minSize: 82, maxSize: 120 },
    { accessorKey: 'hora', header: 'Hora', minSize: 45, maxSize: 80 },
    { accessorKey: 'folio', header: 'Folio', minSize: 150, maxSize: 200 },
    { accessorKey: 'oc', header: 'OC', minSize: 80, maxSize: 120 },
    { accessorKey: 'nombre_local', header: 'Cliente', minSize: 120, maxSize: 380 },
    { accessorKey: 'tipo_local', header: 'Tipo Local', minSize: 75, maxSize: 100 },
    { accessorKey: 'cliente_final', header: 'Cliente Final', minSize: 120, maxSize: 380 },
    { accessorKey: 'motivo', header: 'Motivo', cell: info => <div title={info.getValue() as string || ''}>{(info.getValue() as string || '')?.substring(0, 30)}...</div>, minSize: 150 },
    { accessorKey: 'responsabilidad', header: 'Responsabilidad', minSize: 110, maxSize: 180, cell: info => info.getValue() as string || '' },
    { accessorKey: 'responsabilidad_area', header: 'Área', minSize: 80, maxSize: 120, cell: info => info.getValue() as string || '' },
    { accessorKey: 'unidades_rechazadas', header: 'Unid. Rech.', minSize: 85, maxSize: 120, cell: info => info.getValue() as number ?? 0 },
    { accessorKey: 'unidades_totales', header: 'Unid. Tot.', minSize: 67, maxSize: 120, cell: info => info.getValue() as number ?? 0 },
    { accessorKey: 'bultos_rechazados', header: 'Bultos Rech.', minSize: 90, maxSize: 120, cell: info => info.getValue() as number ?? 0 },
    { accessorKey: 'bultos_totales', header: 'Bultos Tot.', minSize: 76, maxSize: 120, cell: info => info.getValue() as number ?? 0 },
    { accessorKey: 'transporte', header: 'Transporte', minSize: 75, maxSize: 320, cell: info => info.getValue() as string || '' },
    {
      accessorKey: 'foto_rechazado',
      header: 'Foto',
      enableSorting: false,
      enableColumnFilter: false,
      minSize: 40,
      maxSize: 80,
      cell: ({ row }) => {
        const publicUrl = getPublicUrl(row.original.foto_rechazado);
        return publicUrl ? <Image src={publicUrl} alt="Rechazo" width={50} height={50} style={{ width: '50px', height: '50px', cursor: 'pointer', objectFit: 'cover' }} onClick={() => openLightbox(publicUrl)} /> : null;
      }
    },
    { accessorKey: 'created_by_user_name', header: 'Creado por', minSize: 250 },
    { accessorKey: 'updated_by_user_name', header: 'Actualizado por', minSize: 250 },
    { accessorKey: 'updated_at', header: 'Actualizado', cell: info => formatDate(info.getValue() as string), minSize: 90, maxSize: 120 },
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
    {
        id: 'acciones',
        header: 'Acciones',
        minSize: 100,
        cell: ({ row }) => <button onClick={() => handleEditClick(row.original)} style={{ padding: '6px 12px', backgroundColor: 'var(--clr4)', color: 'var(--clr1)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
    }
  ];

  const table = useReactTable({
    data: rechazos,
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
    const fetchRechazos = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('rechazos').select('*').order('fecha', { ascending: false });
        if (error) throw error;
        setRechazos(data || []);
      } catch (err) {
        console.error('Error fetching rechazos:', err);
        setError('Error al cargar los rechazos');
      } finally {
        setLoading(false);
      }
    };
    fetchRechazos();
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div style={{ color: 'var(--clr6)' }}>{error}</div>;

  return (
    <>
      <style>{`
        .resizer { position: absolute; right: 0; top: 0; height: 100%; width: 5px; background: rgba(0, 0, 0, 0.5); cursor: col-resize; user-select: none; touch-action: none; opacity: 0; }
        .resizer.isResizing { background: var(--clr4); opacity: 1; }
        th:hover .resizer { opacity: 1; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.7); z-index: 1000; display: flex; justify-content: center; align-items: center; }
        .modal-content { background-color: var(--clr1); padding: 25px; border-radius: 8px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; }
        .modal-form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
        .modal-form-grid label { font-weight: bold; margin-bottom: 5px; display: block; }
        .modal-form-grid input, .modal-form-grid select, .modal-form-grid textarea { width: 100%; padding: 8px; border: 1px solid var(--clr4); border-radius: 4px; background-color: var(--clr1); color: var(--clr4); }
        table { table-layout: fixed; }
      `}</style>
      
      <div style={{ width: '100%', padding: '5px', boxSizing: 'border-box', maxWidth: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', width: '100%' }}>
            <div style={{ display: 'flex', gap: '5px', width: '60%' }}><h2 style={{ color: 'var(--clr4)', marginBottom: '0' }}>Administración de Rechazos</h2></div>
            <div style={{ display: 'flex', gap: '5px', width: '40%' }}>
              <div style={{ display: 'flex', gap: '5px', width: '30%' }}>
                  <Image src="/descargarCsv1.svg" alt="Descargar CSV" width={80} height={50} style={{marginBottom:'0'}} onClick={handleExportToCSV} />
              </div>
              <div style={{ display: 'flex', gap: '5px', width: '70%' }}>
                <input type="text" value={globalFilter ?? ''} onChange={e => setGlobalFilter(e.target.value)} placeholder="Buscar en toda la tabla..." style={{ padding: '8px', border: '1px solid var(--clr4)', borderRadius: '4px', width: '400px', backgroundColor: 'var(--clr1)', color: 'var(--clr4)' }} />
              </div>
            </div>
        </div>
        
        <div style={{ width: '100%', overflowX: 'auto', maxHeight: '77vh' }}>
          <table style={{ width: table.getTotalSize(), borderCollapse: 'collapse' }}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} style={{ backgroundColor: 'var(--clr1)', color: 'var(--clr4)' }}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} colSpan={header.colSpan} style={{ position: 'relative', width: header.getSize(), padding: '12px', textAlign: 'left', minWidth: header.column.columnDef.minSize ? `${header.column.columnDef.minSize}px` : 'auto' }}>
                      <div {...{ onClick: header.column.getToggleSortingHandler(), className: header.column.getCanSort() ? 'cursor-pointer select-none' : '' }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
                      </div>
                      {header.column.getCanFilter() ? (
                        <div>
                          <input type="text" value={(header.column.getFilterValue() ?? '') as string} onChange={e => header.column.setFilterValue(e.target.value)} placeholder={`Filtrar...`} style={{ width: '100%', marginTop: '5px', padding: '4px', borderRadius: '4px', border: '1px solid var(--clr4)', backgroundColor: 'var(--clr1)', color: 'var(--clr4)' }} onClick={e => e.stopPropagation()} />
                        </div>
                      ) : null}
                      <div {...{ onMouseDown: header.getResizeHandler(), onTouchStart: header.getResizeHandler() }} className={`resizer ${header.column.getIsResizing() ? 'isResizing' : ''}`} />
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--clr4)' }}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} style={{ width: cell.column.getSize(), padding: '12px' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isEditModalOpen && editingRechazo && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ marginBottom: '20px' }}>Editando Ticket: {editingRechazo.ticket_id}</h3>
              <div className="modal-form-grid">
                 {/* Todos los campos del rechazo */}
                 <div>
                   <label>Tipo Rechazo</label>
                   <select 
                     name="tipo_rechazo" 
                     value={editingRechazo.tipo_rechazo || ''} 
                     onChange={handleModalChange}
                   >
                     <option value="">Seleccione tipo</option>
                     <option value="Completo">Completo</option>
                     <option value="Parcial">Parcial</option>
                   </select>
                 </div>
                 
                 <div>
                   <label>Ruta</label>
                   <input 
                     type="text" 
                     name="ruta" 
                     value={editingRechazo.ruta || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div>
                   <label>Mes</label>
                   <input 
                     type="text" 
                     name="mes" 
                     value={editingRechazo.mes ? formatMonthInSpanish(editingRechazo.mes) : ''} 
                     onChange={handleModalChange} 
                     readOnly
                   />
                   <input 
                     type="date" 
                     name="mes" 
                     value={editingRechazo.mes || ''} 
                     onChange={handleModalChange} 
                     style={{ display: 'none' }} 
                   />
                 </div>
                 
                 <div>
                   <label>Fecha</label>
                   <input 
                     type="date" 
                     name="fecha" 
                     value={editingRechazo.fecha || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div>
                   <label>Hora</label>
                   <input 
                     type="time" 
                     name="hora" 
                     value={editingRechazo.hora || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div>
                   <label>Folio</label>
                   <input 
                     type="text" 
                     name="folio" 
                     value={editingRechazo.folio || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div>
                   <label>OC</label>
                   <input 
                     type="text" 
                     name="oc" 
                     value={editingRechazo.oc || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div>
                   <label>Nombre Local</label>
                   <input 
                     type="text" 
                     name="nombre_local" 
                     value={editingRechazo.nombre_local || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div>
                   <label>Tipo Local</label>
                   <input 
                     type="text" 
                     name="tipo_local" 
                     value={editingRechazo.tipo_local || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div>
                   <label>Cliente Final</label>
                   <input 
                     type="text" 
                     name="cliente_final" 
                     value={editingRechazo.cliente_final || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div style={{ gridColumn: '1 / -1' }}>
                   <label>Motivo</label>
                   <textarea 
                     name="motivo" 
                     value={editingRechazo.motivo || ''} 
                     onChange={handleModalChange} 
                     rows={4}
                   />
                 </div>
                 
                 <div>
                   <label>Responsabilidad</label>
                   <select 
                     name="responsabilidad" 
                     value={editingRechazo.responsabilidad || ''} 
                     onChange={handleModalChange}
                   >
                     <option value="">Seleccione responsabilidad</option>
                     <option value="Customer">Customer</option>
                     <option value="Transporte">Transporte</option>
                     <option value="Cliente">Cliente</option>
                     <option value="CD">CD</option>
                   </select>
                 </div>
                 
                 {editingRechazo.responsabilidad === 'CD' && (
                   <div>
                     <label>Área de Responsabilidad</label>
                     <select 
                       name="responsabilidad_area" 
                       value={editingRechazo.responsabilidad_area || ''} 
                       onChange={handleModalChange}
                     >
                       <option value="">Seleccione área</option>
                       <option value="Shipping">Shipping</option>
                       <option value="QA">QA</option>
                       <option value="Planning">Planning</option>
                       <option value="Picking">Picking</option>
                       <option value="VAS">VAS</option>
                       <option value="Consolidación">Consolidación</option>
                     </select>
                   </div>
                 )}
                 
                 <div>
                   <label>Unidades Rechazadas</label>
                   <input 
                     type="number" 
                     name="unidades_rechazadas" 
                     value={editingRechazo.unidades_rechazadas || ''} 
                     onChange={handleModalChange} 
                     min="0"
                   />
                 </div>
                 
                 <div>
                   <label>Unidades Totales</label>
                   <input 
                     type="number" 
                     name="unidades_totales" 
                     value={editingRechazo.unidades_totales || ''} 
                     onChange={handleModalChange} 
                     min="0"
                   />
                 </div>
                 
                 <div>
                   <label>Bultos Rechazados</label>
                   <input 
                     type="number" 
                     name="bultos_rechazados" 
                     value={editingRechazo.bultos_rechazados || ''} 
                     onChange={handleModalChange} 
                     min="0"
                   />
                 </div>
                 
                 <div>
                   <label>Bultos Totales</label>
                   <input 
                     type="number" 
                     name="bultos_totales" 
                     value={editingRechazo.bultos_totales || ''} 
                     onChange={handleModalChange} 
                     min="0"
                   />
                 </div>
                 
                 <div>
                   <label>Transporte</label>
                   <input 
                     type="text" 
                     name="transporte" 
                     value={editingRechazo.transporte || ''} 
                     onChange={handleModalChange} 
                   />
                 </div>
                 
                 <div>
                   <label>
                     <input 
                       type="checkbox" 
                       name="gestionado" 
                       checked={editingRechazo.gestionado || false} 
                       onChange={(e) => setEditingRechazo({ ...editingRechazo, gestionado: e.target.checked })}
                     />
                     Gestionado
                   </label>
                 </div>
              </div>
              <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={handleModalClose} style={{ padding: '10px 20px', backgroundColor: 'var(--clr1)', color: 'var(--clr4)', border: '1px solid var(--clr4)', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleSaveChanges} style={{ padding: '10px 20px', backgroundColor: 'var(--clr5)', color: 'var(--clr1)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Guardar Cambios</button>
              </div>
            </div>
          </div>
        )}

        {showLightbox && (
            <div onClick={() => setShowLightbox(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Image src={lightboxImage} alt="Rechazo" width={800} height={600} style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain' }} />
            </div>
        )}
      </div>
    </>
  );
}