// src/app/components/RechazosAdminView.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface Props {
  session: Session;
  profile: { role: string | null };
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
  motivo: string;
  responsabilidad: string;
  responsabilidad_area: string;
  unidades_rechazadas: number;
  unidades_totales: number;
  bultos_rechazados: number;
  bultos_totales: number;
  transporte: string;
  foto_rechazado: string;
  created_at: string;
  created_by_user_name: string;
  updated_at: string;
  updated_by_user_name: string;
}

export default function RechazosAdminView({ session, profile }: Props) {
  const [rechazos, setRechazos] = useState<Rechazo[]>([]);
  const [filteredRechazos, setFilteredRechazos] = useState<Rechazo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    fechaDesde: '',
    fechaHasta: '',
    mes: '',
    anio: '',
    cliente: '',
    tipoLocal: '',
    responsabilidad: '',
    transporte: '',
    tipoRechazo: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Rechazo>>({});
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStatistics, setShowStatistics] = useState(false);

  // Fetch rechazos data
  useEffect(() => {
    const fetchRechazos = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('rechazos')
          .select('*')
          .order('fecha', { ascending: false });
        
        if (error) throw error;
        
        setRechazos(data || []);
        setFilteredRechazos(data || []);
      } catch (err) {
        console.error('Error fetching rechazos:', err);
        setError('Error al cargar los rechazos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRechazos();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...rechazos];
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(rechazo => 
        rechazo.nombre_local.toLowerCase().includes(term) ||
        rechazo.ticket_id.toLowerCase().includes(term) ||
        rechazo.oc.toLowerCase().includes(term) ||
        rechazo.folio.toLowerCase().includes(term) ||
        rechazo.responsabilidad.toLowerCase().includes(term) ||
        rechazo.transporte.toLowerCase().includes(term) ||
        rechazo.tipo_rechazo.toLowerCase().includes(term) ||
        rechazo.motivo.toLowerCase().includes(term)
      );
    }
    
    // Apply filters
    if (filters.fechaDesde) {
      result = result.filter(rechazo => rechazo.fecha >= filters.fechaDesde);
    }
    
    if (filters.fechaHasta) {
      result = result.filter(rechazo => rechazo.fecha <= filters.fechaHasta);
    }
    
    if (filters.cliente) {
      result = result.filter(rechazo => rechazo.nombre_local === filters.cliente);
    }
    
    if (filters.tipoLocal) {
      result = result.filter(rechazo => rechazo.tipo_local === filters.tipoLocal);
    }
    
    if (filters.responsabilidad) {
      result = result.filter(rechazo => rechazo.responsabilidad === filters.responsabilidad);
    }
    
    if (filters.transporte) {
      result = result.filter(rechazo => rechazo.transporte === filters.transporte);
    }
    
    if (filters.tipoRechazo) {
      result = result.filter(rechazo => rechazo.tipo_rechazo === filters.tipoRechazo);
    }
    
    setFilteredRechazos(result);
  }, [searchTerm, filters, rechazos]);

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  // Start editing a rechazo
  const startEditing = (rechazo: Rechazo) => {
    setEditingId(rechazo.id);
    setEditData({ ...rechazo });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  // Save edited rechazo
  const saveEdit = async () => {
    if (!editingId) return;
    
    try {
      const { error } = await supabase
        .from('rechazos')
        .update({
          ...editData,
          updated_by_user_id: session.user.id,
          updated_by_user_name: session.user.user_metadata?.full_name || session.user.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);
      
      if (error) throw error;
      
      // Update local state
      setRechazos(rechazos.map(r => r.id === editingId ? { ...r, ...editData } as Rechazo : r));
      setEditingId(null);
      setEditData({});
    } catch (err) {
      console.error('Error updating rechazo:', err);
      setError('Error al actualizar el rechazo');
    }
  };

  // Handle edit field changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  // Open lightbox for image
  const openLightbox = (imageUrl: string) => {
    setLightboxImage(imageUrl);
    setShowLightbox(true);
  };

  // Close lightbox
  const closeLightbox = () => {
    setShowLightbox(false);
    setLightboxImage('');
  };

  // Format date as DD-MM-YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
  };

  // Format month in Spanish
  const formatMonthInSpanish = (dateString: string) => {
    const date = new Date(dateString);
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Get unique values for filters
  const uniqueClientes = Array.from(new Set(rechazos.map(r => r.nombre_local)));
  const uniqueTipoLocal = Array.from(new Set(rechazos.map(r => r.tipo_local)));
  const uniqueResponsabilidad = Array.from(new Set(rechazos.map(r => r.responsabilidad)));
  const uniqueTransporte = Array.from(new Set(rechazos.map(r => r.transporte)));
  const uniqueTipoRechazo = Array.from(new Set(rechazos.map(r => r.tipo_rechazo)));

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <h2 style={{ color: '#233D4D' }}>Administración de Rechazos</h2>
        <button 
          onClick={() => setShowStatistics(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#A1C181',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Estadísticas
        </button>
      </div>
      
      {/* Search and Filters */}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Fecha Desde
            </label>
            <input
              type="date"
              name="fechaDesde"
              value={filters.fechaDesde}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Fecha Hasta
            </label>
            <input
              type="date"
              name="fechaHasta"
              value={filters.fechaHasta}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Cliente
            </label>
            <select
              name="cliente"
              value={filters.cliente}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">Todos</option>
              {uniqueClientes.map(cliente => (
                <option key={cliente} value={cliente}>{cliente}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Tipo Local
            </label>
            <select
              name="tipoLocal"
              value={filters.tipoLocal}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">Todos</option>
              {uniqueTipoLocal.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Responsabilidad
            </label>
            <select
              name="responsabilidad"
              value={filters.responsabilidad}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">Todos</option>
              {uniqueResponsabilidad.map(resp => (
                <option key={resp} value={resp}>{resp}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Transporte
            </label>
            <select
              name="transporte"
              value={filters.transporte}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">Todos</option>
              {uniqueTransporte.map(trans => (
                <option key={trans} value={trans}>{trans}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Tipo Rechazo
            </label>
            <select
              name="tipoRechazo"
              value={filters.tipoRechazo}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">Todos</option>
              {uniqueTipoRechazo.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Rechazos Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#233D4D', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Ticket</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Fecha</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Cliente</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Tipo</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>OC/Folio</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Motivo</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Foto</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRechazos.map(rechazo => (
              <tr key={rechazo.id} style={{ borderBottom: '1px solid #eee' }}>
                {editingId === rechazo.id ? (
                  <>
                    <td style={{ padding: '12px' }}>{rechazo.ticket_id}</td>
                    <td style={{ padding: '12px' }}>{formatDate(rechazo.fecha)}</td>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="text"
                        name="nombre_local"
                        value={editData.nombre_local || ''}
                        onChange={handleEditChange}
                        style={{
                          width: '100%',
                          padding: '4px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <select
                        name="tipo_rechazo"
                        value={editData.tipo_rechazo || ''}
                        onChange={handleEditChange}
                        style={{
                          width: '100%',
                          padding: '4px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      >
                        <option value="Completo">Completo</option>
                        <option value="Parcial">Parcial</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="text"
                        name="oc"
                        value={editData.oc || ''}
                        onChange={handleEditChange}
                        style={{
                          width: '100%',
                          padding: '4px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <textarea
                        name="motivo"
                        value={editData.motivo || ''}
                        onChange={handleEditChange}
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '4px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      {rechazo.foto_rechazado && (
                        <img 
                          src={rechazo.foto_rechazado} 
                          alt="Rechazo" 
                          style={{ width: '50px', height: '50px', cursor: 'pointer' }}
                          onClick={() => openLightbox(rechazo.foto_rechazado)}
                        />
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={saveEdit}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#A1C181',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '5px'
                        }}
                      >
                        Guardar
                      </button>
                      <button
                        onClick={cancelEditing}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ccc',
                          color: 'black',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancelar
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '12px' }}>{rechazo.ticket_id}</td>
                    <td style={{ padding: '12px' }}>{formatDate(rechazo.fecha)}</td>
                    <td style={{ padding: '12px' }}>{rechazo.nombre_local}</td>
                    <td style={{ padding: '12px' }}>{rechazo.tipo_rechazo}</td>
                    <td style={{ padding: '12px' }}>{rechazo.oc} / {rechazo.folio}</td>
                    <td style={{ padding: '12px' }}>{rechazo.motivo.substring(0, 50)}...</td>
                    <td style={{ padding: '12px' }}>
                      {rechazo.foto_rechazado && (
                        <img 
                          src={rechazo.foto_rechazado} 
                          alt="Rechazo" 
                          style={{ width: '50px', height: '50px', cursor: 'pointer' }}
                          onClick={() => openLightbox(rechazo.foto_rechazado)}
                        />
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => startEditing(rechazo)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#FE7F2D',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Editar
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Lightbox */}
      {showLightbox && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onClick={closeLightbox}
        >
          <div 
            style={{ 
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={lightboxImage} 
              alt="Rechazo" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
            <button
              onClick={closeLightbox}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                padding: '8px 16px',
                backgroundColor: 'white',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      
      {/* Statistics Modal */}
      {showStatistics && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div 
            style={{ 
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '90%',
              maxHeight: '90%',
              overflow: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Estadísticas de Rechazos</h3>
              <button
                onClick={() => setShowStatistics(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ccc',
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
            
            <div>
              {/* Statistics content would go here */}
              <p>Las estadísticas se mostrarían aquí con gráficos y tablas basadas en los datos de rechazos.</p>
              <p>Funcionalidad pendiente de implementación completa.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}