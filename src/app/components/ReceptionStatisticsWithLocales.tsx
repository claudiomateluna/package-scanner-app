// ReceptionStatistics component updated to use locales table
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

interface Local {
  id: number;
  tipo_local: 'FRA' | 'RTL' | 'SKA' | 'WHS';
  nombre_local: string;
}

interface ReceptionDetail {
  olpn: string;
  dn: string;
  unidades: number;
  escaneado: boolean;
  faltantes: number;
}

interface ReceptionCompleted {
  local: string;
  fecha_recepcion: string;
  fecha_hora_completada: string;
  olpn_esperadas: number;
  olpn_escaneadas: number;
  dn_esperadas: number;
  dn_escaneadas: number;
  unidades_esperadas: number;
  unidades_escaneadas: number;
  detalles: ReceptionDetail[];
}

interface FaltanteRecord {
  olpn: string;
  nombre_local: string;
  created_at: string;
  cantidad: number | null;
  ticket_id: string;
  tipo_reporte: string;
}

interface RechazoRecord {
  folio: string;
  nombre_local: string;
  created_at: string;
  unidades_rechazadas: number | null;
  ticket_id: string;
}

interface ReceptionStats {
  local: string;
  tipo_local: string;
  total_receptions: number;
  total_packages: number;
  total_units: number;
  total_faltantes: number; // New field for faltantes count
  total_rechazos: number;  // New field for rechazos count
  last_reception_date: string;
}

interface Props {
  onClose: () => void;
}

export default function ReceptionStatisticsWithLocales({ onClose }: Props) {
  const [stats, setStats] = useState<ReceptionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locals, setLocals] = useState<Local[]>([]);
  const [selectedLocal, setSelectedLocal] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'FRA' | 'RTL' | 'SKA' | 'WHS'>('ALL');

  useEffect(() => {
    fetchLocals();
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [selectedLocal, selectedType, locals]);

  const fetchLocals = async () => {
    try {
      const { data, error } = await supabase
        .from('locales')
        .select('*')
        .order('tipo_local')
        .order('nombre_local');

      if (error) throw error;
      setLocals(data || []);
    } catch (err) {
      console.error('Error fetching locals:', err);
      toast.error('Error al cargar los locales');
    }
  };

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch recepciones completadas with detalles
      let recepcionesQuery = supabase
        .from('recepciones_completadas')
        .select(`
          local,
          fecha_recepcion,
          fecha_hora_completada,
          olpn_esperadas,
          olpn_escaneadas,
          dn_esperadas,
          dn_escaneadas,
          unidades_esperadas,
          unidades_escaneadas,
          detalles
        `);

      // Apply local filter
      if (selectedLocal !== 'ALL') {
        recepcionesQuery = recepcionesQuery.eq('local', selectedLocal);
      }

      const { data: recepcionesData, error: recepcionesError } = await recepcionesQuery.order('fecha_hora_completada', { ascending: false });

      if (recepcionesError) throw recepcionesError;
      
      // Extract all OLPNs from recepciones to check for faltantes/rechazos
      const allOlpns: string[] = [];
      recepcionesData.forEach((reception: ReceptionCompleted) => {
        if (reception.detalles && Array.isArray(reception.detalles)) {
          reception.detalles.forEach((detail: ReceptionDetail) => {
            if (detail.olpn) {
              allOlpns.push(detail.olpn);
            }
          });
        }
      });
      
      // Remove duplicates
      const uniqueOlpns = [...new Set(allOlpns)];
      
      // Fetch faltantes for these OLPNs
      let faltantesData: FaltanteRecord[] = [];
      let faltantesError: Error | null = null;
      
      if (uniqueOlpns.length > 0) {
        let faltantesQuery = supabase
          .from('faltantes')
          .select(`
            olpn,
            nombre_local,
            created_at,
            cantidad,
            ticket_id,
            tipo_reporte
          `)
          .in('olpn', uniqueOlpns);

        // Apply local filter to faltantes
        if (selectedLocal !== 'ALL') {
          faltantesQuery = faltantesQuery.eq('nombre_local', selectedLocal);
        }

        const faltantesResult = await faltantesQuery.order('created_at', { ascending: false });
        faltantesData = faltantesResult.data || [];
        faltantesError = faltantesResult.error;
      }

      if (faltantesError) throw faltantesError;
      
      // Fetch rechazos - note: rechazos uses 'folio' instead of 'olpn'
      let rechazosData: RechazoRecord[] = [];
      let rechazosError: Error | null = null;
      
      if (uniqueOlpns.length > 0) {
        let rechazosQuery = supabase
          .from('rechazos')
          .select(`
            folio,
            nombre_local,
            created_at,
            unidades_rechazadas,
            ticket_id
          `)
          .in('folio', uniqueOlpns);

        // Apply local filter to rechazos
        if (selectedLocal !== 'ALL') {
          rechazosQuery = rechazosQuery.eq('nombre_local', selectedLocal);
        }

        const rechazosResult = await rechazosQuery.order('created_at', { ascending: false });
        rechazosData = rechazosResult.data || [];
        rechazosError = rechazosResult.error;
      }

      if (rechazosError) throw rechazosError;
      
      // Process data to aggregate statistics by local
      const statsMap: { [key: string]: ReceptionStats } = {};
      
      // Process recepciones completadas
      recepcionesData.forEach((item: ReceptionCompleted) => {
        if (!statsMap[item.local]) {
          statsMap[item.local] = {
            local: item.local,
            tipo_local: '', // Will be filled later
            total_receptions: 0,
            total_packages: 0,
            total_units: 0,
            total_faltantes: 0, // Initialize faltantes count
            total_rechazos: 0,  // Initialize rechazos count
            last_reception_date: item.fecha_hora_completada
          };
        }
        
        const stat = statsMap[item.local];
        stat.total_receptions += 1;
        stat.total_packages += item.olpn_escaneadas;
        stat.total_units += item.unidades_escaneadas;
        
        // Update last reception date if this one is more recent
        if (new Date(item.fecha_hora_completada) > new Date(stat.last_reception_date)) {
          stat.last_reception_date = item.fecha_hora_completada;
        }
      });
      
      // Process faltantes - count by local and also count units
      faltantesData.forEach((item: {
        olpn: string;
        nombre_local: string;
        created_at: string;
        cantidad: number | null;
        ticket_id: string;
        tipo_reporte: string;
      }) => {
        if (!statsMap[item.nombre_local]) {
          const local = locals.find(l => l.nombre_local === item.nombre_local);
          statsMap[item.nombre_local] = {
            local: item.nombre_local,
            tipo_local: local ? local.tipo_local : 'N/A',
            total_receptions: 0,
            total_packages: 0,
            total_units: 0,
            total_faltantes: 0,
            total_rechazos: 0,
            last_reception_date: item.created_at
          };
        }
        
        const stat = statsMap[item.nombre_local];
        stat.total_faltantes += 1;
        
        // Add cantidad to total_units if available
        if (item.cantidad) {
          stat.total_units += item.cantidad;
        }
        
        // Update last date if this one is more recent
        if (new Date(item.created_at) > new Date(stat.last_reception_date)) {
          stat.last_reception_date = item.created_at;
        }
      });
      
      // Process rechazos - count by local and also count units
      rechazosData.forEach((item: {
        folio: string;
        nombre_local: string;
        created_at: string;
        unidades_rechazadas: number | null;
        ticket_id: string;
      }) => {
        if (!statsMap[item.nombre_local]) {
          const local = locals.find(l => l.nombre_local === item.nombre_local);
          statsMap[item.nombre_local] = {
            local: item.nombre_local,
            tipo_local: local ? local.tipo_local : 'N/A',
            total_receptions: 0,
            total_packages: 0,
            total_units: 0,
            total_faltantes: 0,
            total_rechazos: 0,
            last_reception_date: item.created_at
          };
        }
        
        const stat = statsMap[item.nombre_local];
        stat.total_rechazos += 1;
        
        // Add unidades_rechazadas to total_units if available
        if (item.unidades_rechazadas) {
          stat.total_units += item.unidades_rechazadas;
        }
        
        // Update last date if this one is more recent
        if (new Date(item.created_at) > new Date(stat.last_reception_date)) {
          stat.last_reception_date = item.created_at;
        }
      });
      
      // Convert to array
      let processedStats = Object.values(statsMap);
      
      // Apply type filter
      if (selectedType !== 'ALL') {
        processedStats = processedStats.filter((stat: ReceptionStats) => {
          const local = locals.find(l => l.nombre_local === stat.local);
          return local && local.tipo_local === selectedType;
        });
      }
      
      // Add tipo_local to stats for any that don't have it yet
      processedStats = processedStats.map(stat => {
        const local = locals.find(l => l.nombre_local === stat.local);
        return {
          ...stat,
          tipo_local: stat.tipo_local || (local ? local.tipo_local : 'N/A')
        };
      });

      setStats(processedStats);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Error al cargar las estadísticas');
      toast.error('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const FilterControls = () => (
    <div style={{ 
      display: 'flex', 
      gap: '15px', 
      marginBottom: '20px', 
      flexWrap: 'wrap',
      padding: '15px',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: '8px'
    }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px', 
          fontWeight: 'bold',
          color: '#CCCCCC'
        }}>
          Filtrar por Local:
        </label>
        <select
          value={selectedLocal}
          onChange={(e) => setSelectedLocal(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#CCCCCC',
            border: '1px solid #CCCCCC',
            borderRadius: '5px'
          }}
        >
          <option value="ALL">Todos los Locales</option>
          {locals.map(local => (
            <option key={local.id} value={local.nombre_local}>
              [{local.tipo_local}] {local.nombre_local}
            </option>
          ))}
        </select>
      </div>
      
      <div style={{ flex: 1, minWidth: '200px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px', 
          fontWeight: 'bold',
          color: '#CCCCCC'
        }}>
          Filtrar por Tipo:
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as 'ALL' | 'FRA' | 'RTL' | 'SKA' | 'WHS')}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#CCCCCC',
            border: '1px solid #CCCCCC',
            borderRadius: '5px'
          }}
        >
          <option value="ALL">Todos los Tipos</option>
          <option value="FRA">Franquicias (FRA)</option>
          <option value="RTL">Retail (RTL)</option>
          <option value="SKA">Skape (SKA)</option>
          <option value="WHS">Wholesale (WHS)</option>
        </select>
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#233D4D',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '90%',
        maxHeight: '90%',
        overflow: 'auto',
        width: '800px',
        border: '1px solid #CCCCCC'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ 
            margin: 0, 
            color: '#FE7F2D',
            fontSize: '1.5em'
          }}>
            Estadísticas de Recepciones
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#FE7F2D',
              color: '#233D4D',
              border: 'none',
              borderRadius: '5px',
              padding: '8px 15px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cerrar
          </button>
        </div>

        <FilterControls />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Cargando estadísticas...</p>
          </div>
        ) : error ? (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '15px', 
            borderRadius: '5px',
            marginBottom: '15px'
          }}>
            <p>{error}</p>
          </div>
        ) : (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #CCCCCC'
              }}>
                <h3 style={{ 
                  margin: '0 0 10px 0', 
                  color: '#FE7F2D',
                  fontSize: '1.2em'
                }}>
                  Resumen General
                </h3>
                <p style={{ margin: '5px 0', color: '#CCCCCC' }}>
                  <strong>Total Recepciones:</strong> {stats.length}
                </p>
                <p style={{ margin: '5px 0', color: '#CCCCCC' }}>
                  <strong>Total Paquetes:</strong> {stats.reduce((sum, stat) => sum + stat.total_packages, 0)}
                </p>
                <p style={{ margin: '5px 0', color: '#CCCCCC' }}>
                  <strong>Total Unidades:</strong> {stats.reduce((sum, stat) => sum + stat.total_units, 0)}
                </p>
                <p style={{ margin: '5px 0', color: '#CCCCCC' }}>
                  <strong>Total Faltantes:</strong> {stats.reduce((sum, stat) => sum + stat.total_faltantes, 0)}
                </p>
                <p style={{ margin: '5px 0', color: '#CCCCCC' }}>
                  <strong>Total Rechazos:</strong> {stats.reduce((sum, stat) => sum + stat.total_rechazos, 0)}
                </p>
              </div>
              
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #CCCCCC'
              }}>
                <h3 style={{ 
                  margin: '0 0 10px 0', 
                  color: '#FE7F2D',
                  fontSize: '1.2em'
                }}>
                  Por Tipo de Local
                </h3>
                {(['FRA', 'RTL', 'SKA', 'WHS'] as const).map(type => {
                  const typeStats = stats.filter(stat => stat.tipo_local === type);
                  return (
                    <div key={type} style={{ margin: '10px 0', color: '#CCCCCC' }}>
                      <p style={{ margin: '5px 0' }}>
                        <strong>{type}:</strong> {typeStats.length} locales
                      </p>
                      <p style={{ margin: '2px 0 10px 20px', fontSize: '0.9em' }}>
                        {typeStats.reduce((sum, stat) => sum + stat.total_packages, 0)} paquetes, 
                        {typeStats.reduce((sum, stat) => sum + stat.total_faltantes, 0)} faltantes, 
                        {typeStats.reduce((sum, stat) => sum + stat.total_rechazos, 0)} rechazos
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <h3 style={{ 
                color: '#FE7F2D',
                fontSize: '1.3em',
                marginBottom: '15px'
              }}>
                Detalle por Local
              </h3>
              
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: 'rgba(0,0,0,0.2)'
              }}>
                <thead>
                  <tr style={{ 
                    borderBottom: '2px solid #CCCCCC'
                  }}>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      color: '#CCCCCC',
                      fontWeight: 'bold'
                    }}>Tipo</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      color: '#CCCCCC',
                      fontWeight: 'bold'
                    }}>Local</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      color: '#CCCCCC',
                      fontWeight: 'bold'
                    }}>Recepciones</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      color: '#CCCCCC',
                      fontWeight: 'bold'
                    }}>Paquetes</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      color: '#CCCCCC',
                      fontWeight: 'bold'
                    }}>Faltantes</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      color: '#CCCCCC',
                      fontWeight: 'bold'
                    }}>Rechazos</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      color: '#CCCCCC',
                      fontWeight: 'bold'
                    }}>Unidades</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      color: '#CCCCCC',
                      fontWeight: 'bold'
                    }}>Última Recepción</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat, index) => {
                    const local = locals.find(l => l.nombre_local === stat.local);
                    return (
                      <tr 
                        key={index} 
                        style={{ 
                          borderBottom: '1px solid #555',
                          backgroundColor: index % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '10px', color: '#CCCCCC' }}>
                          {local ? local.tipo_local : 'N/A'}
                        </td>
                        <td style={{ padding: '10px', color: '#CCCCCC' }}>
                          {stat.local}
                        </td>
                        <td style={{ padding: '10px', color: '#CCCCCC' }}>
                          {stat.total_receptions}
                        </td>
                        <td style={{ padding: '10px', color: '#CCCCCC' }}>
                          {stat.total_packages}
                        </td>
                        <td style={{ padding: '10px', color: '#CCCCCC' }}>
                          {stat.total_faltantes}
                        </td>
                        <td style={{ padding: '10px', color: '#CCCCCC' }}>
                          {stat.total_rechazos}
                        </td>
                        <td style={{ padding: '10px', color: '#CCCCCC' }}>
                          {stat.total_units}
                        </td>
                        <td style={{ padding: '10px', color: '#CCCCCC' }}>
                          {stat.last_reception_date ? new Date(stat.last_reception_date).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {stats.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '30px', 
                  color: '#CCCCCC'
                }}>
                  <p>No se encontraron estadísticas para los filtros seleccionados.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}