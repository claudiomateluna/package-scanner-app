'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

interface ReceptionDetail {
  olpn: string;
  dn: string;
  unidades: number;
  escaneado: boolean;
}

interface ReceptionData {
  id?: number;
  local: string;
  fecha_recepcion: string;
  user_id: string;
  fecha_hora_completada: string;
  fecha_hora_inicio: string; // Nueva propiedad
  olpn_esperadas: number;
  olpn_escaneadas: number;
  dn_esperadas: number;
  dn_escaneadas: number;
  unidades_esperadas: number;
  unidades_escaneadas: number;
  estado: string;
  detalles: ReceptionDetail[];
  created_at?: string;
}

interface ReceptionSummaryProps {
  onClose: () => void;
  receptionData: ReceptionData;
}

export default function ReceptionSummary({ onClose, receptionData }: ReceptionSummaryProps) {
  const [loading, setLoading] = useState(true)
  const [detailedData, setDetailedData] = useState<ReceptionData | null>(null)

  useEffect(() => {
    const fetchDetailedData = async () => {
      try {
        setLoading(true)
        
        // Aquí podrías hacer llamadas adicionales para obtener más detalles
        // si es necesario
        
        setDetailedData(receptionData)
      } catch (error) {
        console.error('Error al cargar datos detallados:', error)
        toast.error('Error al cargar datos detallados')
      } finally {
        setLoading(false)
      }
    }

    fetchDetailedData()
  }, [receptionData])

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
          <h2>Cargando resumen de recepción...</h2>
        </div>
      </div>
    )
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
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: '#CCCCCC'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#FE7F2D' }}>Resumen de Recepción</h2>
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
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#FE7F2D', borderBottom: '1px solid #CCCCCC', paddingBottom: '10px' }}>
            Información General
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
            <div>
              <strong>Local:</strong> {detailedData?.local}
            </div>
            <div>
              <strong>Fecha Recepción:</strong> {detailedData?.fecha_recepcion}
            </div>
            <div>
              <strong>Fecha/Hora Completada:</strong> {detailedData?.fecha_hora_completada ? new Date(detailedData.fecha_hora_completada).toLocaleString() : 'N/A'}
            </div>
            <div>
              <strong>Estado:</strong> 
              <span style={{ 
                backgroundColor: '#A1C181', 
                color: '#233D4D', 
                padding: '3px 8px', 
                borderRadius: '3px',
                marginLeft: '8px'
              }}>
                {detailedData?.estado}
              </span>
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#FE7F2D', borderBottom: '1px solid #CCCCCC', paddingBottom: '10px' }}>
            Estadísticas
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '15px' }}>
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              padding: '15px', 
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#FE7F2D' }}>
                {detailedData?.olpn_escaneadas} / {detailedData?.olpn_esperadas}
              </div>
              <div>OLPN/Bultos</div>
            </div>
            
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              padding: '15px', 
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#FE7F2D' }}>
                {detailedData?.dn_escaneadas} / {detailedData?.dn_esperadas}
              </div>
              <div>{detailedData?.user_id ? 'DN' : 'Facturas'}</div>
            </div>
            
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              padding: '15px', 
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#FE7F2D' }}>
                {detailedData?.unidades_escaneadas} / {detailedData?.unidades_esperadas}
              </div>
              <div>Unidades</div>
            </div>
          </div>
        </div>
        
        {detailedData?.detalles && (
          <div>
            <h3 style={{ color: '#FE7F2D', borderBottom: '1px solid #CCCCCC', paddingBottom: '10px' }}>
              Detalles de Paquetes
            </h3>
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto',
              marginTop: '15px',
              border: '1px solid #CCCCCC',
              borderRadius: '5px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderBottom: '1px solid #CCCCCC' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>OLPN/Bulto</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>DN/Factura</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Unidades</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.detalles.map((detalle: ReceptionDetail, index: number) => (
                    <tr 
                      key={index} 
                      style={{ 
                        borderBottom: '1px solid #555',
                        backgroundColor: detalle.escaneado ? 'rgba(161, 193, 129, 0.2)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '8px' }}>{detalle.olpn}</td>
                      <td style={{ padding: '8px' }}>{detalle.dn}</td>
                      <td style={{ padding: '8px' }}>{detalle.unidades}</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{ 
                          backgroundColor: detalle.escaneado ? '#A1C181' : '#FE7F2D', 
                          color: detalle.escaneado ? '#233D4D' : '#233D4D', 
                          padding: '3px 8px', 
                          borderRadius: '3px',
                          fontSize: '0.8em'
                        }}>
                          {detalle.escaneado ? 'Escaneado' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
  )
}