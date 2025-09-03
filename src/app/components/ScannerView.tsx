import { useState, useEffect, CSSProperties, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import toast from 'react-hot-toast';
import AdminView from './AdminView';
import DNProgressCard from './DNProgressCard';
import BarcodeScanner from './BarcodeScanner';
import ReceptionSummary from './ReceptionSummary';
import ReceptionHistory from './ReceptionHistory';
import ReceptionStatistics from './ReceptionStatistics';
import { isMobileDevice, isIPad, isIPhone, isAndroid } from '@/lib/deviceUtils';
import './scrollbarStyles.css';

// --- Tipos de Datos ---
type Profile = { role: string | null; }
type Selection = { local: string; fecha: string; }
type Package = { OLPN: string; DN: string; Unidades: number; Local: string; Fecha: string; }
type ScannedItem = { OLPN: string; }
type DNProgress = { dn: string; totalPackages: number; scannedPackages: number; }

interface Props {
  session: Session;
  profile: Profile;
  selection: Selection;
  currentView: string; // Recibe la vista actual como prop
}

// --- Función de Ayuda para Timeouts ---
async function fetchWithTimeout(query: any, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const { data, error } = await query.abortSignal(controller.signal);
    if (error) throw error;
    return data;
  } finally {
    clearTimeout(id);
  }
}

export default function ScannerView({ session, profile, selection, currentView }: Props) {
  const { user } = session
  const [packages, setPackages] = useState<Package[]>([])
  const [scanned, setScanned] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scannedOlpn, setScannedOlpn] = useState('')
  const [dnProgress, setDnProgress] = useState<DNProgress[]>([]);
  const [useBarcodeScanner, setUseBarcodeScanner] = useState(false);
  const [showReceptionSummary, setShowReceptionSummary] = useState(false);
  const [completedReceptionData, setCompletedReceptionData] = useState<any>(null);
  const [showReceptionHistory, setShowReceptionHistory] = useState(false);
  const [showReceptionStatistics, setShowReceptionStatistics] = useState(false);

  const isWarehouseOrAdmin = profile?.role === 'administrador' || profile?.role === 'Warehouse Supervisor' || profile?.role === 'Warehouse Operator';
  const canScan = profile?.role === 'administrador' || profile?.role === 'Store Operator' || profile?.role === 'Warehouse Operator' || profile?.role === 'Warehouse Supervisor';
  
  // Detectar si es un dispositivo móvil o tablet
  const isMobileOrTablet = isMobileDevice();
  const isIPadDevice = isIPad();
  const isIPhoneDevice = isIPhone();
  const isAndroidDevice = isAndroid();

  // Si estamos en la vista de administración, no necesitamos cargar datos
  if (currentView === 'admin') {
    return <AdminView profile={{...profile, id: session?.user?.id}} />;
  }

  // Si no hay selección, mostramos un mensaje
  if (!selection || !selection.local || !selection.fecha) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Por favor, selecciona un local y una fecha para continuar</h3>
        <p>Utiliza el botón "Volver" para regresar a la pantalla de selección</p>
      </div>
    );
  }

  const fetchData = useCallback(async () => {
    setError(null)
    try {
      const startDate = selection.fecha;
      const endDate = new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Obtener paquetes esperados para el local seleccionado en la fecha seleccionada
      const { data: packageData, error: packageError } = await supabase
        .from('data')
        .select('*')
        .eq('Local', selection.local)
        .gte('Fecha', startDate)
        .lt('Fecha', endDate);
      
      if (packageError) throw packageError;
      setPackages(packageData || []);
      
      // Obtener paquetes ya escaneados para el local seleccionado en la fecha seleccionada
      const { data: scannedData, error: scannedError } = await supabase
        .from('recepcion')
        .select('OLPN')
        .eq('Local', selection.local)
        .gte('Fecha', startDate)
        .lt('Fecha', endDate);
      
      if (scannedError) throw scannedError;
      setScanned(new Set(scannedData?.map((item: ScannedItem) => item.OLPN) || []));
    } catch (error: any) { 
      const errorMessage = error.name === 'AbortError' ? 'La petición tardó demasiado (timeout).' : error.message;
      setError(errorMessage);
      toast.error("Error al recargar los datos: " + errorMessage);
    } finally {
      setLoading(false)
    }
  }, [selection, isWarehouseOrAdmin]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    const channel = supabase.channel('realtime_recepcion')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'recepcion' }, (payload) => {
        const newRecord = payload.new as ScannedItem
        if (newRecord && newRecord.OLPN) {
          setScanned(prevScanned => new Set(prevScanned).add(newRecord.OLPN))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchData]);

  useEffect(() => {
    window.addEventListener('focus', fetchData);
    return () => { window.removeEventListener('focus', fetchData); };
  }, [fetchData]);

  useEffect(() => {
    if (packages.length === 0 && scanned.size === 0) {
      setDnProgress([]);
      return;
    }
    const progressMap = new Map<string, { total: number; scanned: number }>();
    for (const pkg of packages) {
      if (!progressMap.has(pkg.DN)) { progressMap.set(pkg.DN, { total: 0, scanned: 0 }); }
      progressMap.get(pkg.DN)!.total++;
    }
    for (const pkg of packages) {
      if (scanned.has(pkg.OLPN)) { progressMap.get(pkg.DN)!.scanned++; }
    }
    const progressData = Array.from(progressMap.entries()).map(([dn, data]) => ({
      dn,
      totalPackages: data.total,
      scannedPackages: data.scanned,
    }));
    setDnProgress(progressData.sort((a, b) => a.dn.localeCompare(b.dn)));
  }, [packages, scanned]);

  const handleRegister = async () => {
    const olpnToRegister = scannedOlpn.trim()
    if (!olpnToRegister) { return toast.error("El campo de escaneo está vacío.") }
    const foundPackage = packages.find(p => p.OLPN === olpnToRegister)
    if (!foundPackage) { return toast.error("¡ATENCIÓN! Este bulto no corresponde a los paquetes esperados.") }
    if (scanned.has(olpnToRegister)) { return toast.error("¡ATENCIÓN! Este bulto ya fue registrado (duplicado).") }
    try {
      const { error: insertError } = await supabase.from('recepcion').insert({ OLPN: foundPackage.OLPN, Local: foundPackage.Local, Fecha: foundPackage.Fecha, DN: foundPackage.DN, Unidades: foundPackage.Unidades, ScannedBy: user.email })
      if (insertError) throw insertError
      setScannedOlpn('')
      toast.success("Paquete registrado en Recepción.")
    } catch (error: any) {
      toast.error(`Error al registrar: ${error.message}`)
    }
  }

  // Función para mostrar el historial de recepciones
  const handleShowReceptionHistory = () => {
    setShowReceptionHistory(true);
  };

  // Función para mostrar las estadísticas de recepciones
  const handleShowReceptionStatistics = () => {
    setShowReceptionStatistics(true);
  };

  // Función para ocultar el historial de recepciones
  const handleCloseReceptionHistory = () => {
    setShowReceptionHistory(false);
  };

  // Función para ocultar las estadísticas de recepciones
  const handleCloseReceptionStatistics = () => {
    setShowReceptionStatistics(false);
  };

  // Manejar cuando se completa la recepción
  const handleReceptionCompleted = async () => {
    if (!(packages.length > 0 && scanned.size === packages.length)) {
      toast.error('La recepción aún no está completa');
      return;
    }

    try {
      // Mostrar confirmación
      if (!window.confirm('¿Estás seguro de que quieres completar esta recepción? Esta acción no se puede deshacer.')) {
        return;
      }

      // Obtener información de la recepción
      const scannedPackages = packages.filter(pkg => scanned.has(pkg.OLPN));
      const scannedDNs = Array.from(new Set(scannedPackages.map(pkg => pkg.DN)));
      
      // Calcular totales
      const totalExpectedPackages = packages.length;
      const totalScannedPackages = scanned.size;
      const totalExpectedDNs = dnProgress.length;
      const totalScannedDNs = scannedDNs.length;
      const totalExpectedUnits = packages.reduce((total, pkg) => total + pkg.Unidades, 0);
      const totalScannedUnits = packages.reduce((total, pkg) => total + (scanned.has(pkg.OLPN) ? pkg.Unidades : 0), 0);

      // Obtener la sesión del usuario
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Preparar datos para guardar
      const receptionData = {
        local: selection.local,
        fecha_recepcion: selection.fecha,
        user_id: userId,
        fecha_hora_completada: new Date().toISOString(),
        olpn_esperadas: totalExpectedPackages,
        olpn_escaneadas: totalScannedPackages,
        dn_esperadas: totalExpectedDNs,
        dn_escaneadas: totalScannedDNs,
        unidades_esperadas: totalExpectedUnits,
        unidades_escaneadas: totalScannedUnits,
        estado: 'completada',
        detalles: packages.map(pkg => ({
          olpn: pkg.OLPN,
          dn: pkg.DN,
          unidades: pkg.Unidades,
          escaneado: scanned.has(pkg.OLPN)
        }))
      };

      // Guardar en la base de datos
      const { data, error } = await supabase
        .from('recepciones_completadas')
        .insert([receptionData])
        .select();

      if (error) {
        throw error;
      }

      // Mostrar resumen de la recepción
      setCompletedReceptionData(receptionData);
      setShowReceptionSummary(true);
      
      toast.success('Recepción completada y guardada exitosamente');
      
    } catch (error: any) {
      console.error('Error al completar la recepción:', error);
      toast.error(`Error al completar la recepción: ${error.message}`);
    }
  }

  if (loading) return <div>Cargando datos para {selection.local} en fecha {selection.fecha}...</div>
  if (error) return <div><p style={{color: 'red'}}><b>Error:</b> {error}</p></div>

  return (
    <div>
      <div style={{ display: 'flex', gap: '20px', flexDirection: isMobileOrTablet ? 'column' : 'row' }}>
        <main style={{ width: isMobileOrTablet ? '100%' : '50%' }}>
          <h3>Recepción - {selection.local} @ {selection.fecha}</h3>
          {!canScan && (
            <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
              <strong>Acceso restringido:</strong> Solo los Operadores de tienda pueden registrar paquetes.
            </div>
          )}
          
          {/* Mostrar lector de códigos de barras para dispositivos móviles o cuando se active manualmente */}
          {(isMobileOrTablet || useBarcodeScanner) ? (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h4>{isMobileOrTablet ? 'Escáner de Código de Barras' : 'Lector de Código de Barras'}</h4>
                {!isMobileOrTablet && (
                  <button
                    onClick={() => setUseBarcodeScanner(!useBarcodeScanner)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#233D4D',
                      color: '#CCCCCC',
                      border: '1px solid #CCCCCC',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {useBarcodeScanner ? 'Usar Input Manual' : 'Usar Escáner'}
                  </button>
                )}
              </div>
              
              <BarcodeScanner 
                onScan={handleBarcodeScan}
                onError={handleScannerError}
              />
              
              {/* Input manual como fallback */}
              <div style={{ display: 'flex', gap: '10px', margin: '15px 0' }}>
                <input 
                  type="text" 
                  placeholder={`Escanear ${isWarehouseOrAdmin ? 'OLPN' : 'Bulto'}...`} 
                  value={scannedOlpn} 
                  onChange={(e) => setScannedOlpn(e.target.value)} 
                  style={{fontSize: '1em', padding: '10px', flexGrow: 1, backgroundColor: '#fff', color: '#000', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#ccc', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#ccc', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: '#ccc', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#ccc', borderRadius: '5px'}}
                  onKeyPress={(e) => e.key === 'Enter' && canScan && handleRegister()}
                  disabled={!canScan}
                />
                <button 
                  onClick={handleRegister} 
                  style={{padding: '10px 20px', backgroundColor: canScan ? '#FE7F2D' : '#cccccc', color: '#233D4D', border: 'none', borderTop: 'none', borderBottom: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: '5px', cursor: canScan ? 'pointer' : 'not-allowed'}}
                  disabled={!canScan}
                >
                  Registrar
                </button>
                <button 
                  onClick={() => setUseBarcodeScanner(true)}
                  style={{padding: '5px', backgroundColor: '#FE7F2D', color: '#233D4D', border: 'none', borderRadius: '5px', cursor: 'pointer'}}
                  title="Usar escáner de código de barras"
                >
                  <img 
                    alt="Código de Barras" 
                    src="/barcode.svg" 
                    style={{height: '34px', width: '44px'}} 
                  />
                </button>
              </div>
            </div>
          ) : (
            /* Input manual para desktop */
            <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
              <input 
                type="text" 
                placeholder={`Escanear ${isWarehouseOrAdmin ? 'OLPN' : 'Bulto'}...`} 
                value={scannedOlpn} 
                onChange={(e) => setScannedOlpn(e.target.value)} 
                style={{fontSize: '1em', padding: '10px', flexGrow: 1, backgroundColor: '#fff', color: '#000', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#ccc', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#ccc', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: '#ccc', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#ccc', borderRadius: '5px'}}
                onKeyPress={(e) => e.key === 'Enter' && canScan && handleRegister()}
                disabled={!canScan}
              />
              <button 
                onClick={handleRegister} 
                style={{padding: '10px 20px', backgroundColor: canScan ? '#FE7F2D' : '#cccccc', color: '#233D4D', border: 'none', borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderRadius: '5px', cursor: canScan ? 'pointer' : 'not-allowed'}}
                disabled={!canScan}
              >
                Registrar
              </button>
              <button 
                onClick={() => setUseBarcodeScanner(true)}
                style={{padding: '5px', backgroundColor: '#FE7F2D', color: '#233D4D', border: 'none', borderRadius: '5px', cursor: 'pointer'}}
                title="Usar escáner de código de barras"
              >
                <img 
                  alt="Código de Barras" 
                  src="/barcode.svg" 
                  style={{height: '34px', width: '44px'}} 
                />
              </button>
            </div>
          )}
          
          <h4>Paquetes Esperados ({scanned.size} / {packages.length})</h4>
          <div className="scroll-container" style={{ 
            maxHeight: '60vh', 
            overflowY: 'auto', 
            borderTopWidth: '1px', 
            borderTopStyle: 'solid', 
            borderTopColor: '#555', 
            borderBottomWidth: '1px', 
            borderBottomStyle: 'solid', 
            borderBottomColor: '#555', 
            borderLeftWidth: '1px', 
            borderLeftStyle: 'solid', 
            borderLeftColor: '#555', 
            borderRightWidth: '1px', 
            borderRightStyle: 'solid', 
            borderRightColor: '#555', 
            borderRadius: '5px'
          }}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '1px solid #ccc'}}>
                  <th style={{padding: '8px', textAlign: 'left', color: '#CCCCCC'}}>{isWarehouseOrAdmin ? 'OLPN' : 'Bulto'}</th>
                  <th style={{padding: '8px', textAlign: 'left', width: '150px', color: '#CCCCCC'}}>{isWarehouseOrAdmin ? 'DN' : 'Factura'}</th>
                  <th style={{padding: '8px', textAlign: 'left', width: '120px', color: '#CCCCCC'}}>Unidades</th>
                </tr>
              </thead>
              <tbody>
                {packages.map(pkg => (
                  <tr key={pkg.OLPN} style={{ 
                      backgroundColor: scanned.has(pkg.OLPN) ? '#A1C181' : 'transparent',
                      color: scanned.has(pkg.OLPN) ? '#233D4D' : '#CCCCCC',
                      borderBottom: '1px solid #555'
                    }}>
                    <td style={{padding: '8px'}}>{pkg.OLPN}</td>
                    <td style={{padding: '8px'}}>{pkg.DN}</td>
                    <td style={{padding: '8px'}}>{pkg.Unidades}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>

        {/* Columna derecha con Resumen y Progreso por DN */}
        {!isMobileOrTablet && (
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Cuadro Resumen */}
            <div style={{ 
              backgroundColor: 'rgba(0,0,0,0.2)', 
              borderRadius: '8px', 
              padding: '10px', // Cambiado de 20px a 10px
              border: '1px solid #CCCCCC',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h3 style={{ 
                margin: '0 0 5px 0', // Cambiado de 15px a 5px
                color: '#CCCCCC', 
                textAlign: 'center',
                fontSize: '1.2em'
              }}>
                Resumen - {selection.fecha.split('-').reverse().join('-')}
              </h3>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-around', 
                textAlign: 'center',
                flexWrap: 'wrap',
                gap: '5px' // Reducir el espacio entre elementos
              }}>
                <div style={{ margin: '5px', minWidth: '80px' }}> {/* Reducir márgenes */}
                  <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#FE7F2D' }}>
                    {/* Calcular DN/Facturas escaneadas */}
                    {Array.from(new Set(packages.filter(pkg => scanned.has(pkg.OLPN)).map(pkg => pkg.DN))).length} / {dnProgress.length}
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#CCCCCC' }}>
                    {isWarehouseOrAdmin ? 'DN' : 'Facturas'}
                  </div>
                </div>
                
                <div style={{ margin: '5px', minWidth: '80px' }}> {/* Reducir márgenes */}
                  <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#FE7F2D' }}>
                    {scanned.size} / {packages.length}
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#CCCCCC' }}>
                    {isWarehouseOrAdmin ? 'OLPN' : 'Bultos'}
                  </div>
                </div>
                
                <div style={{ margin: '5px', minWidth: '80px' }}> {/* Reducir márgenes */}
                  <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#FE7F2D' }}>
                    {/* Calcular total de unidades */}
                    {packages.reduce((total, pkg) => total + (scanned.has(pkg.OLPN) ? pkg.Unidades : 0), 0)} /{' '}
                    {packages.reduce((total, pkg) => total + pkg.Unidades, 0)}
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#CCCCCC' }}>
                    Unidades
                  </div>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginTop: '10px',
                flexWrap: 'wrap'
              }}>
                {/* Botón de Recepción Completada */}
                <button 
                  onClick={handleReceptionCompleted}
                  disabled={!(packages.length > 0 && scanned.size === packages.length)}
                  style={{ 
                    flex: '1',
                    padding: '10px', // Reducir padding
                    borderRadius: '5px',
                    backgroundColor: packages.length > 0 && scanned.size === packages.length ? '#A1C181' : '#FE7F2D',
                    color: packages.length > 0 && scanned.size === packages.length ? '#233D4D' : '#233D4D',
                    fontWeight: 'bold',
                    fontSize: '1em',
                    border: 'none',
                    cursor: packages.length > 0 && scanned.size === packages.length ? 'pointer' : 'not-allowed',
                    opacity: packages.length > 0 && scanned.size === packages.length ? 1 : 0.6
                  }}
                >
                  {packages.length > 0 && scanned.size === packages.length ? 'Recepción Completada' : 'Pendiente'}
                </button>
                
                {/* Botón de Historial */}
                <button 
                  onClick={handleShowReceptionHistory}
                  style={{ 
                    flex: '1',
                    padding: '10px',
                    borderRadius: '5px',
                    backgroundColor: '#233D4D',
                    color: '#CCCCCC',
                    fontWeight: 'bold',
                    fontSize: '1em',
                    border: '1px solid #CCCCCC',
                    cursor: 'pointer'
                  }}
                >
                  Historial
                </button>
                
                {/* Botón de Estadísticas - Visible para todos excepto Store Operator */}
                {profile?.role !== 'Store Operator' && (
                  <button 
                    onClick={handleShowReceptionStatistics}
                    style={{ 
                      flex: '1',
                      padding: '10px',
                      borderRadius: '5px',
                      backgroundColor: '#233D4D',
                      color: '#CCCCCC',
                      fontWeight: 'bold',
                      fontSize: '1em',
                      border: '1px solid #CCCCCC',
                      cursor: 'pointer'
                    }}
                  >
                    Estadísticas
                  </button>
                )}
              </div>
            </div>
            
            {/* Progreso por DN */}
            <div style={{ 
              backgroundColor: 'rgba(0,0,0,0.2)', 
              borderRadius: '8px', 
              padding: '10px', 
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '50vh' // Añadido max-height: 50vh
            }}>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                color: '#CCCCCC', 
                textAlign: 'center',
                fontSize: '1.2em'
              }}>
                Progreso por {isWarehouseOrAdmin ? 'DN' : 'Factura'}
              </h3>
              <div className="scroll-container" style={{ 
                maxHeight: '100%', 
                overflowY: 'auto', 
                paddingRight: '10px',
                flex: '1'
              }}>
                {dnProgress.map(item => (
                  <DNProgressCard 
                    key={item.dn}
                    dn={item.dn}
                    totalPackages={item.totalPackages}
                    scannedPackages={item.scannedPackages}
                    isStoreUser={!isWarehouseOrAdmin}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mostrar resumen de recepción si está activo */}
      {showReceptionSummary && completedReceptionData && (
        <ReceptionSummary 
          onClose={() => setShowReceptionSummary(false)}
          receptionData={completedReceptionData}
        />
      )}
      
      {/* Mostrar historial de recepciones si está activo */}
      {showReceptionHistory && (
        <ReceptionHistory 
          onClose={handleCloseReceptionHistory}
        />
      )}
      
      {/* Mostrar estadísticas de recepciones si está activo */}
      {showReceptionStatistics && (
        <ReceptionStatistics 
          onClose={handleCloseReceptionStatistics}
        />
      )}
    </div>
  )
}