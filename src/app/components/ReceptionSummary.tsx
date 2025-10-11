'use client'

import { useState, useEffect } from 'react'
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
        backgroundColor: 'var(--clr1)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{ 
          backgroundColor: 'var(--clr1)', 
          padding: '40px', 
          borderRadius: '8px',
          textAlign: 'center',
          color: 'var(--clr4)'
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
        backgroundColor: 'var(--clr1)', 
        padding: '10px', 
        borderRadius: '4px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: 'var(--clr4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ margin: 0, color: 'var(--clr4)' }}>Resumen de Recepción</h2>
          <button 
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--clr3)',
              color: 'var(--clr4)',
              borderRadius: '4px',
              padding: '8px 15px',
              cursor: 'pointer',
              fontSize: '1.2em'
            }}
          >
            &times;
          </button>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px', marginTop: '10px' }}>
            <div>
              <strong>Local:</strong><br/>{detailedData?.local}
            </div>
            <div>
              <strong>Fecha Recepción:</strong><br/>{detailedData?.fecha_recepcion}
            </div>
            <div>
              <strong>Fecha/Hora Completada:</strong><br/>{detailedData?.fecha_hora_completada ? new Date(detailedData.fecha_hora_completada).toLocaleString() : 'N/A'}
            </div>
            <div>
              <strong>Estado:</strong><br/>
              <span style={{ 
                backgroundColor: 'var(--clr5)', 
                color: 'var(--clr1)', 
                padding: '4px 8px', 
                borderRadius: '4px'
              }}>
                {detailedData?.estado}
              </span>
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <h3 style={{ color: 'var(--clr4)', borderBottom: '1px solid var(--clr2)', paddingBottom: '10px' }}>
            Estadísticas
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              padding: '15px', 
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--clr4)' }}>
                {detailedData?.olpn_escaneadas} / {detailedData?.olpn_esperadas}
              </div>
              <div>OLPN/Bultos</div>
            </div>
            
            <div style={{ 
              backgroundColor: 'var(--clr1)', 
              padding: '10px', 
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--clr4)' }}>
                {detailedData?.dn_escaneadas} / {detailedData?.dn_esperadas}
              </div>
              <div>{detailedData?.user_id ? 'DN' : 'Facturas'}</div>
            </div>
            
            <div style={{ 
              backgroundColor: 'var(--clr1)', 
              padding: '15px', 
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--clr4)' }}>
                {detailedData?.unidades_escaneadas} / {detailedData?.unidades_esperadas}
              </div>
              <div>Unidades</div>
            </div>
          </div>
        </div>
        
        {detailedData?.detalles && (
          <div>
            <h3 style={{ color: 'var(--clr4)', borderBottom: '1px solid var(--clr3)', paddingBottom: '10px' }}>
              Detalles de Paquetes
            </h3>
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto',
              marginTop: '15px',
              border: '1px solid var(--clr3)',
              borderRadius: '5px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderBottom: '1px solid var(--clr3)' }}>
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
                        borderBottom: '1px solid var(--clr3)',
                        backgroundColor: detalle.escaneado ? 'rgba(161, 193, 129, 0.2)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '8px' }}>{detalle.olpn}</td>
                      <td style={{ padding: '8px' }}>{detalle.dn}</td>
                      <td style={{ padding: '8px' }}>{detalle.unidades}</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{ 
                          backgroundColor: detalle.escaneado ? 'var(--clr5)' : 'var(--clr7)', 
                          color: detalle.escaneado ? 'var(--clr3)' : 'var(--clr3)', 
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
          marginTop: '20px'
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'var(--clr4)',
              color: 'var(--clr1)',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '4px',
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