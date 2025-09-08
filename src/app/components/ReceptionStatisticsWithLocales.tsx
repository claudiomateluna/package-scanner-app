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

interface ReceptionStats {
  local: string;
  tipo_local: string;
  total_receptions: number;
  total_packages: number;
  total_units: number;
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
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [selectedLocal, selectedType]);

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
      // Build the query based on filters
      let query = supabase
        .rpc('get_reception_statistics'); // This would be a custom PostgreSQL function

      // Apply local filter
      if (selectedLocal !== 'ALL') {
        query = query.eq('local', selectedLocal);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Apply type filter in memory if needed
      let filteredData = data || [];
      if (selectedType !== 'ALL') {
        filteredData = filteredData.filter((stat: ReceptionStats) => {
          const local = locals.find(l => l.nombre_local === stat.local);
          return local && local.tipo_local === selectedType;
        });
      }

      setStats(filteredData);
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
                  const typeStats = stats.filter(stat => {
                    const local = locals.find(l => l.nombre_local === stat.local);
                    return local && local.tipo_local === type;
                  });
                  return (
                    <p key={type} style={{ margin: '5px 0', color: '#CCCCCC' }}>
                      <strong>{type}:</strong> {typeStats.length} locales, {typeStats.reduce((sum, stat) => sum + stat.total_packages, 0)} paquetes
                    </p>
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