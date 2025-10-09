'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
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

// Definir tipos para las recepciones completadas
interface DetalleRecepcion {
  olpn: string;
  dn: string;
  unidades: number;
  escaneado: boolean;
  faltantes: number;
  ticket_id?: string; // ID del ticket relacionado con faltantes/sobrantes o rechazo
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
  profile: { role: string | null };
}

export default function ReceptionView({ profile }: Props) {
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
  
  // Estados para ordenamiento y filtros de columnas
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
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
  }, [filteredSearchTerm, startDate, endDate, localFilter, canAccessGestionRecepciones]);
  
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

  // Definición de columnas para React Table
  const columns: ColumnDef<RecepcionCompletada>[] = [
    { 
      accessorKey: 'local', 
      header: 'Local', 
      minSize: 100,
      maxSize: 150,
      cell: info => info.getValue() as string
    },
    { 
      accessorKey: 'fecha_recepcion', 
      header: 'Fecha Recepción', 
      minSize: 100,
      maxSize: 150,
      cell: info => formatDateOnly(info.getValue() as string)
    },
    { 
      accessorKey: 'olpn_escaneadas', 
      header: 'OLPN', 
      minSize: 80,
      maxSize: 120,
      cell: info => {
        const row = info.row.original;
        return `${row.olpn_escaneadas}/${row.olpn_esperadas}`;
      }
    },
    { 
      accessorKey: 'dn_escaneadas', 
      header: 'DNs', 
      minSize: 80,
      maxSize: 120,
      cell: info => {
        const row = info.row.original;
        return `${row.dn_escaneadas}/${row.dn_esperadas}`;
      }
    },
    { 
      accessorKey: 'unidades_escaneadas', 
      header: 'Unidades', 
      minSize: 90,
      maxSize: 130,
      cell: info => {
        const row = info.row.original;
        return `${row.unidades_escaneadas}/${row.unidades_esperadas}`;
      }
    },
    { 
      accessorKey: 'detalles', 
      header: 'Faltantes', 
      minSize: 90,
      maxSize: 130,
      cell: info => {
        const detalles = info.getValue() as DetalleRecepcion[] | undefined;
        return detalles ? detalles.filter(detalle => !detalle.escaneado).length : 0;
      }
    },
    { 
      accessorKey: 'estado', 
      header: 'Estado', 
      minSize: 80,
      maxSize: 120,
      cell: info => {
        const estado = info.getValue() as string;
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: estado === 'completada' ? 'var(--clr5)' : 'var(--clr7)',
            color: 'black',
            fontWeight: 'bold'
          }}>
            {estado}
          </span>
        );
      }
    },
    { 
      accessorKey: 'fecha_hora_completada', 
      header: 'Completada', 
      minSize: 120,
      maxSize: 180,
      cell: info => formatDate(info.getValue() as string)
    }
  ];

  // Configuración de React Table
  const table = useReactTable({
    data: recepciones,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableSorting: true,
    enableFilters: true,
  });

  // Si no tiene permiso, mostrar mensaje

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
    <div style={{ padding: '5px', maxWidth: '100%', overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ color: 'var(--clr4)', marginBottom: '0' }}>Recepciones Completadas</h2>
        <button 
          onClick={exportToCSV}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--clr4)',
            color: 'var(--clr1)',
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
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '10px', 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: 'var(--clr1)',
        borderRadius: '4px',
        border: '1px solid var(--clr4)'
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
              border: '1px solid var(--clr4)',
              borderRadius: '4px',
              backgroundColor: 'var(--clr1)',
              color: 'var(--clr4)'
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
              border: '1px solid var(--clr4)',
              borderRadius: '4px',
              backgroundColor: 'var(--clr1)',
              color: 'var(--clr4)',
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
                color: 'var(--clr2)',
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
              backgroundColor: 'var(--clr1)',
              border: '1px solid var(--clr4)',
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
                      borderBottom: '1px solid var(--clr4)',
                      backgroundColor: local.nombre_local === localFilter ? 'var(--clr4)' : 'transparent',
                      color: local.nombre_local === localFilter ? 'var(--clr1)' : 'var(--clr4)'
                    }}
                  >
                    {local.nombre_local}
                  </div>
                ))
              ) : (
                <div style={{ padding: '8px', color: 'var(--clr3)' }}>
                  No se encontraron locales
                </div>
              )}
            </div>
          )}
          {/* Input oculto para mantener el valor seleccionado */}
          {!localSearchTerm && localFilter && (
            <div style={{ marginTop: '4px', color: 'var(--clr4)' }}>
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
              border: '1px solid var(--clr4)',
              borderRadius: '4px',
              backgroundColor: 'var(--clr1)',
              color: 'var(--clr4)'
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
              border: '1px solid var(--clr4)',
              borderRadius: '4px',
              backgroundColor: 'var(--clr1)',
              color: 'var(--clr4)'
            }}
          />
        </div>
      </div>

      {/* Tabla de recepciones */}
      <div className="scroll-container" style={{ 
        maxHeight: '73vh', 
        overflowY: 'auto', 
        border: '1px solid var(--clr4)',
        borderRadius: '4px'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} style={{ backgroundColor: 'var(--clr1)', borderBottom: '2px solid var(--clr4)' }}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id} 
                    colSpan={header.colSpan} 
                    style={{ 
                      position: 'relative',
                      width: header.id === 'local' ? '280px' : 'auto',
                      padding: '5px', 
                      textAlign: header.id === 'local' ? 'left' : 'center',
                      borderRight: '1px solid var(--clr4)',
                      minWidth: header.column.columnDef.minSize ? `${header.column.columnDef.minSize}px` : 'auto'
                    }}
                  >
                    <div 
                      {...{
                        className: header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                        onClick: header.column.getToggleSortingHandler(),
                      }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: header.id === 'local' ? 'flex-start' : 'center' }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                    {header.column.getCanFilter() ? (
                      <div style={{ marginTop: '5px' }}>
                        <input
                          type="text"
                          value={(header.column.getFilterValue() ?? '') as string}
                          onChange={e => header.column.setFilterValue(e.target.value)}
                          placeholder={`Filtrar...`}
                          style={{
                            width: '80%',
                            padding: '4px',
                            borderRadius: '4px',
                            border: '1px solid var(--clr4)',
                            backgroundColor: 'var(--clr1)',
                            color: 'var(--clr4)',
                            fontSize: '0.8em'
                          }}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    ) : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <React.Fragment key={row.id}>
                <tr 
                  onClick={() => setExpandedRecepcionId(expandedRecepcionId === row.original.id ? null : row.original.id)}
                  style={{ 
                    borderBottom: '1px solid var(--clr4)',
                    backgroundColor: expandedRecepcionId === row.original.id ? 'var(--clr1)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td 
                      key={cell.id} 
                      style={{ 
                        width: cell.column.getSize(), 
                        padding: '5px',
                        textAlign: cell.column.id === 'fecha_recepcion' || cell.column.id === 'olpn_escaneadas' || cell.column.id === 'dn_escaneadas' || cell.column.id === 'unidades_escaneadas' || cell.column.id === 'detalles' || cell.column.id === 'estado' || cell.column.id === 'fecha_hora_completada' ? 'center' : 'left',
                        borderRight: '1px solid var(--clr4)'
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                
                {/* Fila expandida con detalles */}
                {expandedRecepcionId === row.original.id && (
                  <tr>
                    <td colSpan={8} style={{ padding: '0' }}>
                      <div style={{ 
                        padding: '15px', 
                        backgroundColor: 'var(--clr1)',
                        border: '1px solid var(--clr4)',
                        borderTop: 'none'
                      }}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr4)' }}>
                          Detalles de la Recepción
                        </h4>
                        
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                          gap: '15px',
                          marginBottom: '15px'
                        }}>
                          <div>
                            <strong>Usuario que completó:</strong> {row.original.first_name} {row.original.last_name}
                          </div>
                          <div>
                            <strong>Inicio de recepción:</strong> {formatDate(row.original.fecha_hora_inicio)}
                          </div>
                          <div>
                            <strong>Fecha registro:</strong> {formatDate(row.original.created_at)}
                          </div>
                        </div>
                        
                        <h5 style={{ margin: '15px 0 10px 0', color: 'var(--clr4)' }}>
                          Paquetes ({row.original.detalles.length} items)
                        </h5>
                        
                        <div className="scroll-container" style={{ 
                          maxHeight: '300px', 
                          overflowY: 'auto', 
                          border: '1px solid var(--clr4)',
                          borderRadius: '4px'
                        }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ backgroundColor: 'var(--clr4)', color: 'var(--clr1)' }}>
                                <th style={{ padding: '8px', borderRight: '1px solid var(--clr1)', textAlign: 'left' }}>OLPN</th>
                                <th style={{ padding: '8px', borderRight: '1px solid var(--clr1)', textAlign: 'center' }}>DN</th>
                                <th style={{ padding: '8px', borderRight: '1px solid var(--clr1)', textAlign: 'center' }}>Unidades</th>
                                <th style={{ padding: '8px', borderRight: '1px solid var(--clr1)', textAlign: 'center' }}>Escaneado</th>
                                <th style={{ padding: '8px', borderRight: '1px solid var(--clr1)', textAlign: 'center' }}>Faltantes</th>
                                <th style={{ padding: '8px', textAlign: 'center' }}>Ticket</th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.original.detalles.map((detalle, index) => (
                                <tr key={index} style={{ borderBottom: index < row.original.detalles.length - 1 ? '1px solid var(--clr4)' : 'none' }}>
                                  <td style={{ padding: '8px', borderRight: '1px solid var(--clr4)' }}>{detalle.olpn}</td>
                                  <td style={{ padding: '8px', borderRight: '1px solid var(--clr4)' }}>{detalle.dn}</td>
                                  <td style={{ padding: '8px', borderRight: '1px solid var(--clr4)', textAlign: 'center' }}>{detalle.unidades}</td>
                                  <td style={{ padding: '8px', borderRight: '1px solid var(--clr4)', textAlign: 'center' }}>
                                    {detalle.escaneado ? '✓' : '✗'}
                                  </td>
                                  <td style={{ padding: '8px', borderRight: '1px solid var(--clr4)', textAlign: 'center' }}>{detalle.faltantes}</td>
                                  <td style={{ padding: '8px' }}>
                                    {detalle.ticket_id ? (
                                      <span style={{ 
                                        backgroundColor: 'var(--clr5)', 
                                        color: 'black', 
                                        padding: '2px 6px', 
                                        borderRadius: '4px', 
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                      }}>
                                        #{detalle.ticket_id}
                                      </span>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
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
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--clr2)' }}>
          <p>No se encontraron recepciones completadas</p>
        </div>
      )}
      
      <style jsx>{`
        .scroll-container {
          -ms-overflow-style: var(--clr4); /* IE and Edge */
          scrollbar-width: thin; /* Firefox */
        }
        
        .scroll-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .scroll-container::-webkit-scrollbar-track {
          background: var(--clr1);
          border-radius: 4px;
        }
        
        .scroll-container::-webkit-scrollbar-thumb {
          background: var(--clr4);
          border-radius: 4px;
        }
        
        .scroll-container::-webkit-scrollbar-thumb:hover {
          background: var(--clr7);
        }
      `}</style>
    </div>
  );
}