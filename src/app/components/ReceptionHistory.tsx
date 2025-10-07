'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

interface CompletedReception {
  id: number
  local: string
  fecha_recepcion: string
  user_id: string
  fecha_hora_completada: string
  fecha_hora_inicio?: string
  olpn_esperadas: number
  olpn_escaneadas: number
  dn_esperadas: number
  dn_escaneadas: number
  unidades_esperadas: number
  unidades_escaneadas: number
  unidades_faltantes?: number
  estado: string
  detalles: ReceptionDetail[]
  created_at: string
}

interface ReceptionDetail {
  olpn: string
  dn: string
  unidades: number
  escaneado: boolean
  faltantes?: number
}

interface ReceptionHistoryProps {
  local: string
  onClose: () => void
}

export default function ReceptionHistory({ local, onClose }: ReceptionHistoryProps) {
  console.log('ReceptionHistory component mounted with props:', { local })
  
  // Verificar si local tiene un valor válido
  if (!local || local.trim() === '') {
    console.warn('ReceptionHistory: Invalid local value received:', local)
  }
  
  const [loading, setLoading] = useState(true)
  const [receptions, setReceptions] = useState<CompletedReception[]>([])
  const [selectedReception, setSelectedReception] = useState<CompletedReception | null>(null)
  const [userNames, setUserNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchReceptions = async () => {
      try {
        setLoading(true)
        console.log('Fetching receptions for local:', local)
        
        // Verificar que local tenga un valor válido
        if (!local || local.trim() === '') {
          console.warn('ReceptionHistory: Invalid local value:', local)
          setReceptions([])
          setLoading(false)
          return
        }
        
        // Obtener todas las recepciones para ver qué hay en la tabla
        const { data: allData } = await supabase
          .from('recepciones_completadas')
          .select('*')
          .limit(50)
        
        console.log('All receptions in table (first 50):', allData)
        
        // Filtrar manualmente por local para depurar
        const localTrimmed = local.trim()
        console.log('Searching for local:', localTrimmed)
        
        let filteredData: CompletedReception[] = [];
        if (allData) {
          filteredData = allData.filter((reception: CompletedReception) => {
            const receptionLocal = reception.local ? reception.local.trim() : ''
            console.log('Comparing:', { 
              receptionLocal: `"${receptionLocal}"`,
              searchLocal: `"${localTrimmed}"`,
              match: receptionLocal.toLowerCase() === localTrimmed.toLowerCase()
            })
            return receptionLocal.toLowerCase() === localTrimmed.toLowerCase()
          })
          
          console.log('Filtered data:', filteredData)
          setReceptions(filteredData)
        } else {
          setReceptions([])
        }
        
        // Obtener los nombres de usuario para los IDs únicos
        const userIds = [...new Set(filteredData.map(r => r.user_id))];
        const userNamesMap: Record<string, string> = {};
        
        for (const userId of userIds) {
          try {
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', userId)
              .single();
              
            if (userError) {
              console.error('Error al obtener el usuario:', userError);
              userNamesMap[userId] = 'Usuario desconocido';
            } else {
              userNamesMap[userId] = userData.email || 'Usuario sin email';
            }
          } catch (error) {
            console.error('Error inesperado al obtener el usuario:', error);
            userNamesMap[userId] = 'Usuario desconocido';
          }
        }
        
        setUserNames(userNamesMap);
        
        // Marcar como cargado
        setLoading(false)
        return
      } catch (error) {
        console.error('Error al cargar historial de recepciones:', error)
        toast.error('Error al cargar historial de recepciones')
      } finally {
        setLoading(false)
      }
    }

    // Solo ejecutar la consulta si local tiene un valor válido
    if (local && local.trim() !== '') {
      fetchReceptions()
    } else {
      console.log('ReceptionHistory: Waiting for valid local value')
      setLoading(false)
    }
  }, [local])

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
          backgroundColor: 'var(--color-background)', 
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
        backgroundColor: 'rgba(0,0,0,0.7)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{ 
          backgroundColor: 'var(--color-background)', 
          padding: '30px', 
          borderRadius: '8px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: 'var(--color-accent)' }}>Detalle de Recepción</h2>
            <div>
              <button 
                onClick={() => setSelectedReception(null)}
                style={{
                  marginRight: '10px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-text-primary)',
                  color: 'var(--color-text-primary)',
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
                  border: '1px solid var(--color-text-primary)',
                  color: 'var(--color-text-primary)',
                  borderRadius: '5px',
                  padding: '8px 15px',
                  cursor: 'pointer',
                  fontSize: '1.2em'
                }}
              >
                ×
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--color-accent)', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
              Información General
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
              <div>
                <strong>Local:</strong> {selectedReception.local}
              </div>
              <div>
                <strong>Fecha Recepción:</strong> 
                {(() => {
                  const date = new Date(selectedReception.fecha_recepcion);
                  const day = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const year = date.getFullYear();
                  return `${day}-${month}-${year}`;
                })()}
              </div>
              <div>
                <strong>Fecha/Hora Inicio:</strong> {selectedReception.fecha_hora_inicio ? new Date(selectedReception.fecha_hora_inicio).toLocaleString() : 'N/A'}
              </div>
              <div>
                <strong>Fecha/Hora Completada:</strong> {new Date(selectedReception.fecha_hora_completada).toLocaleString()}
              </div>
              <div>
                <strong>Usuario:</strong> {userNames[selectedReception.user_id] || selectedReception.user_id}
              </div>
              <div>
                <strong>Estado:</strong> 
                <span style={{ 
                  backgroundColor: 'var(--color-success)', 
                  color: 'var(--color-background)', 
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
            <h3 style={{ color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-text-primary)', paddingBottom: '10px' }}>
              Estadísticas
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '15px' }}>
              <div style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)', 
                padding: '15px', 
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
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
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
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
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
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
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--color-error)' }}>
                  {selectedReception.unidades_faltantes || 0}
                </div>
                <div>Unidades Faltantes</div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 style={{ color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-text-primary)', paddingBottom: '10px' }}>
              Detalles de Paquetes
            </h3>
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto',
              marginTop: '15px',
              border: '1px solid var(--color-text-primary)',
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
                  {selectedReception.detalles && selectedReception.detalles.map((detalle: ReceptionDetail, index: number) => (
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
                          backgroundColor: detalle.escaneado ? 'var(--color-success)' : 'var(--color-error)', 
                          color: detalle.escaneado ? 'var(--color-text-primary)' : 'var(--color-text-primary)', 
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
      backgroundColor: 'rgba(0,0,0,0.7)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: 'var(--color-background)', 
        padding: '30px', 
        borderRadius: '8px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: 'var(--color-accent)', fontSize: '1.6em' }}>Historial de Recepciones - {local}</h2>
          <button 
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--color-text-primary)',
              color: 'var(--color-text-primary)',
              borderRadius: '5px',
              padding: '8px 15px',
              cursor: 'pointer',
              fontSize: '1.2em'
            }}
          >
            ×
          </button>
        </div>
        
        {receptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3>No hay recepciones completadas para este local</h3>
            <p>Aún no se han completado recepciones en el sistema para {local}.</p>
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
                  <th style={{ padding: '12px', textAlign: 'left' }}>Fecha Recepción</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Fecha/Hora Completada</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>OLPN</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>DN</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Unidades</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Faltantes</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Estado</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {receptions.map((reception: CompletedReception) => (
                  <tr key={reception.id} style={{ borderBottom: '1px solid #555' }}>
                    <td style={{ padding: '10px' }}>
                      {(() => {
                        const date = new Date(reception.fecha_recepcion);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        return `${day}-${month}-${year}`;
                      })()}
                    </td>
                    <td style={{ padding: '10px' }}>{new Date(reception.fecha_hora_completada).toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>{reception.olpn_escaneadas}/{reception.olpn_esperadas}</td>
                    <td style={{ padding: '10px' }}>{reception.dn_escaneadas}/{reception.dn_esperadas}</td>
                    <td style={{ padding: '10px' }}>{reception.unidades_escaneadas}/{reception.unidades_esperadas}</td>
                    <td style={{ padding: '10px' }}>{reception.unidades_faltantes || 0}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ 
                        backgroundColor: 'var(--color-success)', 
                        color: 'var(--color-background)', 
                        padding: '5px', 
                        borderRadius: '4px',
                        fontSize: '0.8em'
                      }}>
                        {reception.estado}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button
                        onClick={() => setSelectedReception(reception)}
                        style={{
                          backgroundColor: 'var(--color-button-background)',
                          color: 'var(--color-button-text)',
                          border: '1px solid var(--color-button-border)',
                          borderRadius: '4px',
                          padding: '5px',
                          cursor: 'pointer',
                          fontSize: '0.7em'
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
              backgroundColor: 'var(--color-button-background)',
              color: 'var(--color-button-text)',
              border: '1px solid var(--color-button-border)',
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