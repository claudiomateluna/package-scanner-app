'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

// Definir tipos para las recepciones completadas
interface DetalleRecepcion {
  olpn: string;
  dn: string;
  unidades: number;
  escaneado: boolean;
  faltantes: number;
}

interface RecepcionCompletada {
  id: number;
  local: string;
  fecha_recepcion: string; // Formato: YYYY-MM-DD
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  fecha_hora_completada: string; // Formato: ISO datetime
  fecha_hora_inicio: string; // Formato: ISO datetime
  olpn_esperadas: number;
  olpn_escaneadas: number;
  dn_esperadas: number;
  dn_escaneadas: number;
  unidades_esperadas: number;
  unidades_escaneadas: number;
  unidades_faltantes: number | null; // Puede ser null
  estado: string;
  detalles: DetalleRecepcion[];
  created_at: string; // Formato: ISO datetime
}

interface Props {
  session: Session;
  profile: { role: string | null };
}

export default function ReceptionView({ session, profile }: Props) {
  // Estados para la funcionalidad principal
  const [recepciones, setRecepciones] = useState<RecepcionCompletada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRecepcionId, setExpandedRecepcionId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSearchTerm, setFilteredSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filteredStartDate, setFilteredStartDate] = useState<string>('');
  const [filteredEndDate, setFilteredEndDate] = useState<string>('');
  const [localFilter, setLocalFilter] = useState<string>('');
  const [localSearchTerm, setLocalSearchTerm] = useState<string>('');
  const [showLocalDropdown, setShowLocalDropdown] = useState<boolean>(false);
  
  // Referencia para el dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Estado adicional para almacenar todas las recepciones antes de filtrar
  const [allRecepciones, setAllRecepciones] = useState<RecepcionCompletada[]>([]);

  // Efecto para aplicar debounce a la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilteredSearchTerm(searchTerm);
    }, 300); // 300ms de delay

    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Efecto para aplicar debounce a los filtros de fecha
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilteredStartDate(startDate);
    }, 300); // 300ms de delay

    return () => clearTimeout(timer);
  }, [startDate]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilteredEndDate(endDate);
    }, 300); // 300ms de delay

    return () => clearTimeout(timer);
  }, [endDate]);
  
  // Efecto para cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLocalDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Obtener locales para el filtro
  const [locales, setLocales] = useState<{ nombre_local: string }[]>([]);

  // Efecto para filtrar locales según el término de búsqueda
  const filteredLocales = localSearchTerm 
    ? locales.filter(local => 
        local.nombre_local.toLowerCase().includes(localSearchTerm.toLowerCase())
      )
    : locales;

  // Verificar si el usuario puede ver la administración de recepciones completadas
  const canAccessGestionRecepciones = 
    profile?.role === 'administrador' || 
    profile?.role === 'Warehouse Supervisor' || 
    profile?.role === 'Store Supervisor' ||
    profile?.role === 'Warehouse Operator';

  // Obtener locales
  useEffect(() => {
    const fetchLocales = async () => {
      try {
        const { data, error } = await supabase
          .from('locales')
          .select('nombre_local')
          .order('nombre_local', { ascending: true });

        if (error) throw error;
        setLocales(data || []);
      } catch (error: unknown) {
        console.error('Error fetching locales:', error);
        toast.error('Error al cargar locales');
      }
    };

    fetchLocales();
  }, []);

  // Cargar recepciones completadas
  useEffect(() => {
    const fetchRecepciones = async () => {
      try {
        setLoading(true);
        setError(null);

        // Base query - solo información de recepciones completadas
        let query = supabase
          .from('recepciones_completadas')
          .select('*')
          .order('fecha_hora_completada', { ascending: false });

        // No aplicar filtro de búsqueda en la consulta a la base de datos
        // La búsqueda se hará localmente después de cargar los datos

        if (startDate) {
          query = query.gte('fecha_recepcion', startDate);
        }

        if (endDate) {
          query = query.lte('fecha_recepcion', endDate);
        }

        if (localFilter) {
          query = query.eq('local', localFilter);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Obtener perfiles de usuarios para completar la información
        const userIds = [...new Set(data.map(item => item.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Crear un mapa de perfiles para acceso rápido
        const profileMap: { [key: string]: { first_name: string | null; last_name: string | null } } = {};
        profilesData.forEach(profile => {
          profileMap[profile.id] = {
            first_name: profile.first_name,
            last_name: profile.last_name
          };
        });

        // Parsear detalles JSON si es una string y agregar información del perfil
        const recepcionesConDetalles = data.map(recepcion => {
          const userProfile = profileMap[recepcion.user_id] || { first_name: null, last_name: null };
          return {
            ...recepcion,
            first_name: userProfile.first_name,
            last_name: userProfile.last_name,
            detalles: typeof recepcion.detalles === 'string' 
              ? JSON.parse(recepcion.detalles) 
              : recepcion.detalles
          };
        });

        // Almacenar todas las recepciones para filtrado futuro
        setAllRecepciones(recepcionesConDetalles);
        
        // Filtrar y actualizar recepciones visibles
        if (filteredSearchTerm) {
          const searchTermLower = filteredSearchTerm.toLowerCase();
          const recepcionesFiltradas = recepcionesConDetalles.filter(recepcion => {
            // Buscar en local
            const localMatch = recepcion.local.toLowerCase().includes(searchTermLower);
            
            // Buscar en detalles (OLPN y DN)
            const detallesMatch = recepcion.detalles.some((detalle: DetalleRecepcion) => 
              detalle.olpn.toLowerCase().includes(searchTermLower) || 
              detalle.dn.toLowerCase().includes(searchTermLower)
            );
            
            return localMatch || detallesMatch;
          });
          
          setRecepciones(recepcionesFiltradas);
        } else {
          // Si no hay término de búsqueda, mostrar todas las recepciones filtradas por otros criterios
          setRecepciones(recepcionesConDetalles);
        }
      } catch (err: unknown) {
        console.error('Error fetching recepciones completadas:', err);
        setError('Error al cargar las recepciones completadas');
        toast.error('Error al cargar las recepciones completadas');
      } finally {
        setLoading(false);
      }
    };

    if (canAccessGestionRecepciones) {
      fetchRecepciones();
    }
  }, [localFilter, canAccessGestionRecepciones]);
  
  // Efecto para manejar la filtración local cuando cambian los filtros
  useEffect(() => {
    if (allRecepciones.length === 0) return;
    
    let filteredData = [...allRecepciones];
    
    // Aplicar filtro de búsqueda
    if (filteredSearchTerm) {
      const searchTermLower = filteredSearchTerm.toLowerCase();
      filteredData = filteredData.filter(recepcion => {
        const localMatch = recepcion.local.toLowerCase().includes(searchTermLower);
        const detallesMatch = recepcion.detalles.some((detalle: DetalleRecepcion) => 
          detalle.olpn.toLowerCase().includes(searchTermLower) || 
          detalle.dn.toLowerCase().includes(searchTermLower)
        );
        return localMatch || detallesMatch;
      });
    }
    
    // Aplicar filtro de fechas
    if (filteredStartDate) {
      filteredData = filteredData.filter(recepcion => 
        recepcion.fecha_recepcion >= filteredStartDate
      );
    }

    if (filteredEndDate) {
      filteredData = filteredData.filter(recepcion => 
        recepcion.fecha_recepcion <= filteredEndDate
      );
    }
    
    // Aplicar filtro de local
    if (localFilter) {
      filteredData = filteredData.filter(recepcion => 
        recepcion.local === localFilter
      );
    }
    
    setRecepciones(filteredData);
  }, [allRecepciones, filteredSearchTerm, filteredStartDate, filteredEndDate, localFilter]);

  // Formatear fechas
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatDateOnly = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return dateString;
    }
  };

  // Función para exportar a CSV
  const exportToCSV = () => {
    if (recepciones.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    // Preparar los datos para exportación
    const csvContent = [
      // Cabecera
      [
        'Local',
        'Fecha Recepción',
        'Usuario',
        'Fecha/Hora Completada',
        'Fecha/Hora Inicio',
        'OLPN',
        'DNs',
        'Unidades',
        'Faltantes',
        'Estado',
        'Fecha Registro'
      ],
      // Filas
      ...recepciones.map(item => [
        item.local,
        item.fecha_recepcion,
        `${item.first_name || ''} ${item.last_name || ''}`.trim(),
        item.fecha_hora_completada,
        item.fecha_hora_inicio,
        `${item.olpn_escaneadas}/${item.olpn_esperadas}`,
        `${item.dn_escaneadas}/${item.dn_esperadas}`,
        `${item.unidades_escaneadas}/${item.unidades_esperadas}`,
        item.detalles ? item.detalles.filter(detalle => !detalle.escaneado).length : 0,
        item.estado,
        item.created_at
      ])
    ].map(row => row.join(',')).join('\n');

    // Crear archivo y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filename = `recepciones_completadas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Datos exportados a CSV');
  };

  // Si no tiene permiso, mostrar mensaje
  if (!canAccessGestionRecepciones) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-text-primary)' }}>Acceso Denegado</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          No tienes permisos para acceder al historial de recepciones completadas.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div>Cargando recepciones completadas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%', overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '0' }}>Recepciones Completadas</h2>
        <button 
          onClick={exportToCSV}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-card-background)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '10px', 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: 'var(--color-card-background)',
        borderRadius: '4px',
        border: '1px solid var(--color-border)'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Buscar</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por..."
            style={{
              minWidth: '95%',
              maxWidth: '100%',
              padding: '8px',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              backgroundColor: 'var(--color-card-background)',
              color: 'var(--color-text-primary)'
            }}
          />
        </div>
        
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Local</label>
          <input
            type="text"
            value={localSearchTerm}
            onChange={(e) => {
              setLocalSearchTerm(e.target.value);
              setShowLocalDropdown(true); // Mostrar el dropdown mientras se escribe
            }}
            placeholder="Buscar local..."
            style={{
              minWidth: '95%',
              maxWidth: '100%',
              padding: '8px',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              backgroundColor: 'var(--color-card-background)',
              color: 'var(--color-text-primary)',
              boxSizing: 'border-box'
            }}
            onFocus={() => setShowLocalDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredLocales.length > 0) {
                // Si hay resultados filtrados, selecciona el primero
                setLocalFilter(filteredLocales[0].nombre_local);
                setLocalSearchTerm(filteredLocales[0].nombre_local);
                setShowLocalDropdown(false); // Cerrar el dropdown
              } else if (e.key === 'Escape') {
                // Cierra el dropdown al presionar Escape
                setLocalSearchTerm(localFilter); // Restaurar el valor actual de localFilter
                setShowLocalDropdown(false);
              }
            }}
            onBlur={() => {
              // Si el valor del input coincide con un local existente, usarlo como filtro
              const exactMatch = locales.find(local => 
                local.nombre_local.toLowerCase() === localSearchTerm.toLowerCase()
              );
              
              if (exactMatch) {
                setLocalFilter(exactMatch.nombre_local);
                setLocalSearchTerm(exactMatch.nombre_local);
              } else if (localSearchTerm === '') {
                // Si el input está vacío, limpiar el filtro
                setLocalFilter('');
              } else {
                // Si no hay coincidencia exacta, restaurar el valor anterior
                setLocalSearchTerm(localFilter);
              }
              setShowLocalDropdown(false); // Cerrar el dropdown al perder el foco
            }}
          />
          {localSearchTerm && (
            <button 
              onClick={() => {
                setLocalSearchTerm('');
                setLocalFilter('');
                setShowLocalDropdown(false); // Cerrar el dropdown al limpiar
              }}
              style={{
                position: 'absolute',
                right: '5px',
                top: '30px', // Ajuste para alinearse con el input de texto
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
          )}
          {/* Lista de resultados filtrados */}
          {showLocalDropdown && localSearchTerm && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000,
              backgroundColor: 'var(--color-card-background)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              marginTop: '2px'
            }}>
              {filteredLocales.length > 0 ? (
                filteredLocales.map((local) => (
                  <div
                    key={local.nombre_local}
                    onMouseDown={(e) => {
                      // Usamos onMouseDown en lugar de onClick para evitar el blur
                      e.preventDefault(); // Prevenir el blur
                      setLocalFilter(local.nombre_local);
                      setLocalSearchTerm(local.nombre_local); // Mostrar nombre seleccionado en el input
                      setTimeout(() => setShowLocalDropdown(false), 0); // Cerrar el dropdown después de que se complete la selección
                    }}
                    style={{
                      padding: '8px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: local.nombre_local === localFilter ? 'var(--color-accent)' : 'transparent',
                      color: local.nombre_local === localFilter ? 'var(--color-card-background)' : 'var(--color-text-primary)'
                    }}
                  >
                    {local.nombre_local}
                  </div>
                ))
              ) : (
                <div style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>
                  No se encontraron locales
                </div>
              )}
            </div>
          )}
          {/* Input oculto para mantener el valor seleccionado */}
          {!localSearchTerm && localFilter && (
            <div style={{ marginTop: '4px', color: 'var(--color-text-primary)' }}>
              Seleccionado: {localFilter}
            </div>
          )}
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fecha Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              minWidth: '95%',
              maxWidth: '100%',
              padding: '7px',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              backgroundColor: 'var(--color-card-background)',
              color: 'var(--color-text-primary)'
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fecha Hasta</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              minWidth: '95%',
              maxWidth: '100%',
              padding: '7px',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              backgroundColor: 'var(--color-card-background)',
              color: 'var(--color-text-primary)'
            }}
          />
        </div>
      </div>

      {/* Tabla de recepciones */}
      <div className="scroll-container" style={{ 
        maxHeight: '60vh', 
        overflowY: 'auto', 
        border: '1px solid var(--color-border)',
        borderRadius: '4px'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-background)', borderBottom: '2px solid var(--color-border)' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderRight: '1px solid var(--color-border)' }}>Local</th>
              <th style={{ padding: '10px', textAlign: 'left', borderRight: '1px solid var(--color-border)' }}>Fecha Recepción</th>
              <th style={{ padding: '10px', textAlign: 'right', borderRight: '1px solid var(--color-border)' }}>OLPN</th>
              <th style={{ padding: '10px', textAlign: 'right', borderRight: '1px solid var(--color-border)' }}>DNs</th>
              <th style={{ padding: '10px', textAlign: 'right', borderRight: '1px solid var(--color-border)' }}>Unidades</th>
              <th style={{ padding: '10px', textAlign: 'right', borderRight: '1px solid var(--color-border)' }}>Faltantes</th>
              <th style={{ padding: '10px', textAlign: 'left', borderRight: '1px solid var(--color-border)' }}>Estado</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Completada</th>
            </tr>
          </thead>
          <tbody>
            {recepciones.map((recepcion) => (
              <React.Fragment key={recepcion.id}>
                <tr 
                  onClick={() => setExpandedRecepcionId(expandedRecepcionId === recepcion.id ? null : recepcion.id)}
                  style={{ 
                    borderBottom: '1px solid var(--color-border)',
                    backgroundColor: expandedRecepcionId === recepcion.id ? 'var(--color-card-background)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <td style={{ padding: '10px', borderRight: '1px solid var(--color-border)' }}>{recepcion.local}</td>
                  <td style={{ padding: '10px', borderRight: '1px solid var(--color-border)' }}>{formatDateOnly(recepcion.fecha_recepcion)}</td>
                  <td style={{ padding: '10px', borderRight: '1px solid var(--color-border)', textAlign: 'right' }}>
                    {recepcion.olpn_escaneadas}/{recepcion.olpn_esperadas}
                  </td>
                  <td style={{ padding: '10px', borderRight: '1px solid var(--color-border)', textAlign: 'right' }}>
                    {recepcion.dn_escaneadas}/{recepcion.dn_esperadas}
                  </td>
                  <td style={{ padding: '10px', borderRight: '1px solid var(--color-border)', textAlign: 'right' }}>
                    {recepcion.unidades_escaneadas}/{recepcion.unidades_esperadas}
                  </td>
                  <td style={{ padding: '10px', borderRight: '1px solid var(--color-border)', textAlign: 'right' }}>
                    {recepcion.detalles ? recepcion.detalles.filter(detalle => !detalle.escaneado).length : 0}
                  </td>
                  <td style={{ padding: '10px', borderRight: '1px solid var(--color-border)' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: recepcion.estado === 'completada' ? '#A1C181' : '#F4C287',
                      color: 'black',
                      fontWeight: 'bold'
                    }}>
                      {recepcion.estado}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>{formatDate(recepcion.fecha_hora_completada)}</td>
                </tr>
                
                {/* Fila expandida con detalles */}
                {expandedRecepcionId === recepcion.id && (
                  <tr>
                    <td colSpan={8} style={{ padding: '0' }}>
                      <div style={{ 
                        padding: '15px', 
                        backgroundColor: 'var(--color-card-background)',
                        border: '1px solid var(--color-border)',
                        borderTop: 'none'
                      }}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-text-primary)' }}>
                          Detalles de la Recepción
                        </h4>
                        
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                          gap: '15px',
                          marginBottom: '15px'
                        }}>
                          <div>
                            <strong>Usuario que completó:</strong> {recepcion.first_name} {recepcion.last_name}
                          </div>
                          <div>
                            <strong>Inicio de recepción:</strong> {formatDate(recepcion.fecha_hora_inicio)}
                          </div>
                          <div>
                            <strong>Fecha registro:</strong> {formatDate(recepcion.created_at)}
                          </div>
                        </div>
                        
                        <h5 style={{ margin: '15px 0 10px 0', color: 'var(--color-text-primary)' }}>
                          Paquetes ({recepcion.detalles.length} items)
                        </h5>
                        
                        <div className="scroll-container" style={{ 
                          maxHeight: '300px', 
                          overflowY: 'auto', 
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px'
                        }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ backgroundColor: 'var(--color-background)' }}>
                                <th style={{ padding: '8px', borderRight: '1px solid var(--color-border)', textAlign: 'left' }}>OLPN</th>
                                <th style={{ padding: '8px', borderRight: '1px solid var(--color-border)', textAlign: 'left' }}>DN</th>
                                <th style={{ padding: '8px', borderRight: '1px solid var(--color-border)', textAlign: 'right' }}>Unidades</th>
                                <th style={{ padding: '8px', borderRight: '1px solid var(--color-border)', textAlign: 'center' }}>Escaneado</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>Faltantes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recepcion.detalles.map((detalle, index) => (
                                <tr key={index} style={{ borderBottom: index < recepcion.detalles.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                                  <td style={{ padding: '8px', borderRight: '1px solid var(--color-border)' }}>{detalle.olpn}</td>
                                  <td style={{ padding: '8px', borderRight: '1px solid var(--color-border)' }}>{detalle.dn}</td>
                                  <td style={{ padding: '8px', borderRight: '1px solid var(--color-border)', textAlign: 'right' }}>{detalle.unidades}</td>
                                  <td style={{ padding: '8px', borderRight: '1px solid var(--color-border)', textAlign: 'center' }}>
                                    {detalle.escaneado ? '✓' : '✗'}
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right' }}>{detalle.faltantes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      {recepciones.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
          <p>No se encontraron recepciones completadas</p>
        </div>
      )}
      
      <style jsx>{`
        .scroll-container {
          -ms-overflow-style: var(--color-scrollbar); /* IE and Edge */
          scrollbar-width: thin; /* Firefox */
        }
        
        .scroll-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .scroll-container::-webkit-scrollbar-track {
          background: var(--color-background);
          border-radius: 4px;
        }
        
        .scroll-container::-webkit-scrollbar-thumb {
          background: var(--color-accent);
          border-radius: 4px;
        }
        
        .scroll-container::-webkit-scrollbar-thumb:hover {
          background: #FE7F2D;
        }
      `}</style>
    </div>
  );
}