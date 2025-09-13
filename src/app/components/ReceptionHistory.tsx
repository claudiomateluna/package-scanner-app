'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

interface CompletedReception {
  id: number;
  local: string;
  fecha_recepcion: string;
  user_id: string;
  fecha_hora_completada: string;
  olpn_esperadas: number;
  olpn_escaneadas: number;
  dn_esperadas: number;
  dn_escaneadas: number;
  unidades_esperadas: number;
  unidades_escaneadas: number;
  unidades_faltantes?: number;
  estado: string;
  detalles: ReceptionDetail[];
  created_at: string;
}

interface ReceptionDetail {
  olpn: string;
  dn: string;
  unidades: number;
  escaneado: boolean;
  faltantes?: number;
}

interface ReceptionHistoryProps {
  onClose: () => void;
}

export default function ReceptionHistory({ onClose }: ReceptionHistoryProps) {
  const [loading, setLoading] = useState(true)
  const [receptions, setReceptions] = useState<CompletedReception[]>([])
  const [selectedReception, setSelectedReception] = useState<CompletedReception | null>(null)

  useEffect(() => {
    const fetchReceptions = async () => {
      try {
        setLoading(true)
        
        // Obtener la sesión del usuario
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user?.id

        // Obtener recepciones completadas
        let query = supabase
          .from('recepciones_completadas')
          .select('*')
          .order('fecha_hora_completada', { ascending: false })
          .limit(50)

        // Si no es administrador, solo mostrar sus recepciones
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()

        if (profileData && profileData.role !== 'administrador' && profileData.role !== 'Warehouse Supervisor') {
          query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        setReceptions(data || [])
      } catch (error) {
        console.error('Error al cargar historial de recepciones:', error)
        toast.error('Error al cargar historial de recepciones')
      } finally {
        setLoading(false)
      }
    }

    fetchReceptions()
  }, [])

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
          <h2>Cargando historial de recepciones...</h2>
        </div>
      </div>
    )
  }

  if (selectedReception) {
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
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: '#CCCCCC'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#FE7F2D' }}>Detalle de Recepción</h2>
            <div>
              <button 
                onClick={() => setSelectedReception(null)}
                style={{
                  marginRight: '10px',
                  backgroundColor: 'transparent',
                  border: '1px solid #CCCCCC',
                  color: '#CCCCCC',
                  borderRadius: '5px',
                  padding: '8px 15px',
                  cursor: 'pointer',
                  fontSize: '1em'
                }}
              >
                ← Volver
              </button>
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
          
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#FE7F2D', borderBottom: '1px solid #CCCCCC', paddingBottom: '10px' }}>
              Información General
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
              <div>
                <strong>Local:</strong> {selectedReception.local}
              </div>
              <div>
                <strong>Fecha Recepción:</strong> {selectedReception.fecha_recepcion}
              </div>
              <div>
                <strong>Fecha/Hora Completada:</strong> {new Date(selectedReception.fecha_hora_completada).toLocaleString()}
              </div>
              <div>
                <strong>Usuario ID:</strong> {selectedReception.user_id?.substring(0, 8)}...
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
                  {selectedReception.estado}
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
                  {selectedReception.olpn_escaneadas} / {selectedReception.olpn_esperadas}
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
                  {selectedReception.dn_escaneadas} / {selectedReception.dn_esperadas}
                </div>
                <div>DN/Facturas</div>
              </div>
              
              <div style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)', 
                padding: '15px', 
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#FE7F2D' }}>
                  {selectedReception.unidades_escaneadas} / {selectedReception.unidades_esperadas}
                </div>
                <div>Unidades</div>
              </div>
              <div style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)', 
                padding: '15px', 
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#e63946' }}>
                  {selectedReception.unidades_faltantes || 0}
                </div>
                <div>Unidades Faltantes</div>
              </div>
            </div>
          </div>
          
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
                    <th style={{ padding: '10px', textAlign: 'left' }}>Faltantes</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReception.detalles.map((detalle: ReceptionDetail, index: number) => (
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
                      <td style={{ padding: '8px' }}>{detalle.faltantes || 0}</td>
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
      backgroundColor: 'rgba(255,255,255,0.8)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: '#FFF', 
        padding: '30px', 
        borderRadius: '8px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: '#000'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#000' }}>Historial de Recepciones</h2>
          <button 
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #CCCCCC',
              color: '#000',
              borderRadius: '5px',
              padding: '8px 15px',
              cursor: 'pointer',
              fontSize: '1.2em'
            }}
          >
            &times;
          </button>
        </div>
        
        {receptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3>No hay recepciones completadas</h3>
            <p>Aún no se han completado recepciones en el sistema.</p>
          </div>
        ) : (
          <div style={{ 
            maxHeight: '600px', 
            overflowY: 'auto',
            border: '1px solid #000',
            borderRadius: '5px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderBottom: '1px solid #CCCCCC' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Local</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Fecha</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Completada</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>OLPN</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>DN</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Unidades</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Faltantes</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Estado</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {receptions.map(reception => (
                  <tr key={reception.id} style={{ borderBottom: '1px solid #555' }}>
                    <td style={{ padding: '10px' }}>{reception.local}</td>
                    <td style={{ padding: '10px' }}>{reception.fecha_recepcion}</td>
                    <td style={{ padding: '10px' }}>{new Date(reception.fecha_hora_completada).toLocaleDateString()}</td>
                    <td style={{ padding: '10px' }}>{reception.olpn_escaneadas}/{reception.olpn_esperadas}</td>
                    <td style={{ padding: '10px' }}>{reception.dn_escaneadas}/{reception.dn_esperadas}</td>
                    <td style={{ padding: '10px' }}>{reception.unidades_escaneadas}/{reception.unidades_esperadas}</td>
                    <td style={{ padding: '10px' }}>{reception.unidades_faltantes || 0}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ 
                        backgroundColor: '#A1C181', 
                        color: '#233D4D', 
                        padding: '3px 8px', 
                        borderRadius: '3px',
                        fontSize: '0.8em'
                      }}>
                        {reception.estado}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button
                        onClick={() => setSelectedReception(reception)}
                        style={{
                          backgroundColor: '#233D4D',
                          color: '#CCCCCC',
                          border: '1px solid #CCCCCC',
                          borderRadius: '3px',
                          padding: '5px 10px',
                          cursor: 'pointer',
                          fontSize: '0.9em'
                        }}
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              backgroundColor: '#000',
              color: '#FFF',
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