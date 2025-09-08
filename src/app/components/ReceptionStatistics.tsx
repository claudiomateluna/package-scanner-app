'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

interface ReceptionStats {
  total_receptions: number;
  total_packages: number;
  total_units: number;
  total_missing_units: number;
  avg_completion_rate: number;
  most_active_local: string;
  recent_activity: {
    date: string;
    receptions: number;
  }[];
}

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
}

function StatsCard({ title, value, subtitle, color }: StatsCardProps) {
  return (
    <div style={{ 
      backgroundColor: 'rgba(0,0,0,0.2)', 
      borderRadius: '8px', 
      padding: '20px', 
      textAlign: 'center',
      border: '1px solid #CCCCCC'
    }}>
      <h3 style={{ 
        margin: '0 0 10px 0', 
        color: '#CCCCCC', 
        fontSize: '1em'
      }}>
        {title}
      </h3>
      <div style={{ 
        fontSize: '2em', 
        fontWeight: 'bold', 
        color: color,
        margin: '10px 0'
      }}>
        {value}
      </div>
      <div style={{ 
        fontSize: '0.9em', 
        color: '#CCCCCC'
      }}>
        {subtitle}
      </div>
    </div>
  );
}

interface ReceptionStatisticsProps {
  onClose: () => void;
}

export default function ReceptionStatistics({ onClose }: ReceptionStatisticsProps) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ReceptionStats | null>(null)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        // Obtener estadísticas generales
        const endDate = new Date();
        const startDate = new Date();
        
        switch (period) {
          case 'week':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        }
        
        // Obtener recepciones en el período
        const { data: receptionsData, error: receptionsError } = await supabase
          .from('recepciones_completadas')
          .select('*')
          .gte('fecha_hora_completada', startDate.toISOString())
          .lte('fecha_hora_completada', endDate.toISOString())
          .order('fecha_hora_completada', { ascending: false })

        if (receptionsError) {
          throw receptionsError;
        }
        
        // Calcular estadísticas
        const totalReceptions = receptionsData?.length || 0;
        const totalPackages = receptionsData?.reduce((sum, rec) => sum + rec.olpn_escaneadas, 0) || 0;
        const totalUnits = receptionsData?.reduce((sum, rec) => sum + rec.unidades_escaneadas, 0) || 0;
        const totalMissingUnits = receptionsData?.reduce((sum, rec) => sum + (rec.unidades_faltantes || 0), 0) || 0;
        
        // Calcular tasa de completitud promedio
        const completionRates = receptionsData?.map(rec => 
          rec.olpn_esperadas > 0 ? (rec.olpn_escaneadas / rec.olpn_esperadas) * 100 : 0
        ) || [];
        
        const avgCompletionRate = completionRates.length > 0 
          ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length 
          : 0;
        
        // Encontrar local más activo
        const localCounts: { [key: string]: number } = {};
        receptionsData?.forEach(rec => {
          localCounts[rec.local] = (localCounts[rec.local] || 0) + 1;
        });
        
        const mostActiveLocal = Object.entries(localCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
        
        // Actividad reciente (últimos 7 días)
        const recentActivity = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const dateString = date.toISOString().split('T')[0];
          
          const receptionsForDate = receptionsData?.filter(rec => 
            rec.fecha_recepcion === dateString
          ).length || 0;
          
          recentActivity.push({
            date: dateString,
            receptions: receptionsForDate
          });
        }
        
        setStats({
          total_receptions: totalReceptions,
          total_packages: totalPackages,
          total_units: totalUnits,
          total_missing_units: totalMissingUnits,
          avg_completion_rate: parseFloat(avgCompletionRate.toFixed(1)),
          most_active_local: mostActiveLocal,
          recent_activity: recentActivity
        });
      } catch (error: unknown) {
        console.error('Error al cargar estadísticas:', error);
        toast.error('Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  if (loading) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{ 
          backgroundColor: '#233D4D', 
          padding: '40px', 
          borderRadius: '8px',
          textAlign: 'center',
          color: '#CCCCCC'
        }}>
          <h2>Cargando estadísticas...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.8)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: '#233D4D', 
        padding: '30px', 
        borderRadius: '8px',
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: '#CCCCCC'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#FE7F2D' }}>Estadísticas de Recepciones</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'year')}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#CCCCCC',
                border: '1px solid #CCCCCC',
                borderRadius: '3px',
                padding: '5px 10px'
              }}
            >
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
              <option value="year">Último año</option>
            </select>
            <button 
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #CCCCCC',
                color: '#CCCCCC',
                borderRadius: '5px',
                padding: '8px 15px',
                cursor: 'pointer',
                fontSize: '1.2em'
              }}
            >
              &times;
            </button>
          </div>
        </div>
        
        {stats && (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px', 
              marginBottom: '30px' 
            }}>
              <StatsCard 
                title="Recepciones Completadas" 
                value={stats.total_receptions} 
                subtitle="Total en el período" 
                color="#FE7F2D" 
              />
              <StatsCard 
                title="Paquetes Procesados" 
                value={stats.total_packages} 
                subtitle="Total escaneados" 
                color="#A1C181" 
              />
              <StatsCard 
                title="Unidades Totales" 
                value={stats.total_units} 
                subtitle="Unidades recibidas" 
                color="#A1C181" 
              />
              <StatsCard 
                title="Unidades Faltantes" 
                value={stats.total_missing_units} 
                subtitle="Total en el período" 
                color="#e63946" 
              />
              <StatsCard 
                title="Tasa de Completitud" 
                value={`${stats.avg_completion_rate}%`} 
                subtitle="Promedio" 
                color="#FE7F2D" 
              />
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                color: '#FE7F2D', 
                borderBottom: '1px solid #CCCCCC', 
                paddingBottom: '10px',
                marginBottom: '20px'
              }}>
                Local Más Activo
              </h3>
              <div style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)', 
                padding: '20px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#FE7F2D' }}>
                  {stats.most_active_local}
                </div>
                <div style={{ fontSize: '1.2em', marginTop: '10px' }}>
                  {stats.most_active_local !== 'N/A' ? 'Local con más recepciones' : 'Sin datos suficientes'}
                </div>
              </div>
            </div>
            
            <div>
              <h3 style={{ 
                color: '#FE7F2D', 
                borderBottom: '1px solid #CCCCCC', 
                paddingBottom: '10px',
                marginBottom: '20px'
              }}>
                Actividad Reciente (Últimos 7 días)
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: '15px'
              }}>
                {stats.recent_activity.map((activity, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      padding: '15px', 
                      borderRadius: '5px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#FE7F2D' }}>
                      {activity.receptions}
                    </div>
                    <div style={{ fontSize: '0.9em', marginTop: '5px' }}>
                      {new Date(activity.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginTop: '30px'
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#FE7F2D',
              color: '#233D4D',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1.1em'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}