import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import toast from 'react-hot-toast';
import AdminView from './AdminView';
import DNProgressCard from './DNProgressCard';
import ReceptionSummary from './ReceptionSummary';
import ReceptionHistory from './ReceptionHistory';
import ReceptionStatistics from './ReceptionStatistics';
import BarcodeScannerZXing from './BarcodeScannerZXing';
import MissingReportForm from './MissingReportForm';
import { isMobileDevice, isMobilePhone } from '@/lib/deviceUtils';
import Image from 'next/image';
import './scrollbarStyles.css';
import './ScannerView.css';

// --- Tipos de Datos ---
type Profile = { role: string | null; }
type Selection = { local: string; fecha: string; }
type Package = { OLPN: string; DN: string; Unidades: number; Local: string; Fecha: string; }
type ScannedItem = { OLPN: string; Fecha?: string; }
type DNProgress = { dn: string; totalPackages: number; scannedPackages: number; }

// SupabaseQuery se eliminó ya que no se usaba

interface CompletedReceptionData {
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
  unidades_faltantes?: number;
  estado: string;
  detalles: {
    olpn: string;
    dn: string;
    unidades: number;
    escaneado: boolean;
    faltantes: number;
  }[];
  created_at?: string;
}

interface Props {
  session: Session;
  profile: Profile;
  selection: Selection;
  currentView: string; // Recibe la vista actual como prop
}

// fetchWithTimeout se eliminó ya que no se usaba

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
  const [completedReceptionData, setCompletedReceptionData] = useState<CompletedReceptionData | null>(null);
  const [showReceptionHistory, setShowReceptionHistory] = useState(false);
  const [showReceptionStatistics, setShowReceptionStatistics] = useState(false);
  const [isCompletingReception, setIsCompletingReception] = useState(false);
  const [receptionStartTime, setReceptionStartTime] = useState<string | null>(null);
  const [isReceptionCompleted, setIsReceptionCompleted] = useState(false); // Nuevo estado para verificar si la recepción ya fue completada
  const [missingUnits, setMissingUnits] = useState<Record<string, number>>({});
  const [isRegistering, setIsRegistering] = useState(false);
  const [showMissingReportForm, setShowMissingReportForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [packageSearchTerm, setPackageSearchTerm] = useState(''); // For package search filter
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]); // Filtered packages for display
  const [existingReports, setExistingReports] = useState<Record<string, string>>({}); // Track existing reports by OLPN -> ticket_id
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const canEditMissing = profile?.role === 'administrador' || profile?.role === 'Store Operator';

  const isWarehouseOrAdmin = profile?.role === 'administrador' || profile?.role === 'Warehouse Supervisor' || profile?.role === 'Warehouse Operator';
  const canScan = profile?.role === 'administrador' || profile?.role === 'Store Operator' || profile?.role === 'Warehouse Operator' || profile?.role === 'Warehouse Supervisor';
  
  // Detectar si es un teléfono móvil (para layout vertical)
  const isPhone = isMobilePhone();
  // isIPadDevice, isIPhoneDevice, isAndroidDevice se eliminaron ya que no se usaban

  // Debounced search for packages
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (!packageSearchTerm) {
        setFilteredPackages(packages);
        return;
      }

      const term = packageSearchTerm.toLowerCase();
      const filtered = packages.filter(pkg => {
        const olpn = pkg.OLPN.toLowerCase();
        const dn = pkg.DN.toLowerCase();
        return olpn.includes(term) || dn.includes(term);
      });

      setFilteredPackages(filtered);
    }, 250);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [packageSearchTerm, packages]);

  const fetchData = useCallback(async () => {
    setError(null)
    try {
      const startDate = selection.fecha;
      const endDate = new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Verificar si la recepción ya fue completada
      const { data: completedReceptions, error: completedError } = await supabase
        .from('recepciones_completadas')
        .select('*')
        .eq('local', selection.local)
        .eq('fecha_recepcion', selection.fecha)
        .limit(1);
      
      if (completedError) {
        console.error('Error al verificar recepciones completadas:', completedError);
      } else if (completedReceptions && completedReceptions.length > 0) {
        // La recepción ya fue completada
        setIsReceptionCompleted(true);
        setCompletedReceptionData(completedReceptions[0]);
      } else {
        // La recepción no ha sido completada aún
        setIsReceptionCompleted(false);
      }
      
      // Obtener paquetes esperados para el local seleccionado en la fecha seleccionada
      const { data: packageData, error: packageError } = await supabase
        .from('data')
        .select('*')
        .eq('Local', selection.local)
        .gte('Fecha', startDate)
        .lt('Fecha', endDate);
      
      if (packageError) throw packageError;
      setPackages(packageData || []);
      
      // Establecer la hora de inicio de la recepción si aún no está establecida y la recepción no ha sido completada
      if (!receptionStartTime && !isReceptionCompleted) {
        setReceptionStartTime(new Date().toISOString());
      }
      
      // Obtener paquetes ya escaneados para el local seleccionado en la fecha seleccionada
      const { data: scannedData, error: scannedError } = await supabase
        .from('recepcion')
        .select('OLPN')
        .eq('Local', selection.local)
        .gte('Fecha', startDate)
        .lt('Fecha', endDate);
      
      if (scannedError) throw scannedError;
      setScanned(new Set(scannedData?.map((item: ScannedItem) => item.OLPN) || []));
    } catch (error: unknown) { 
      const errorMessage = (error as Error).name === 'AbortError' ? 'La petición tardó demasiado (timeout).' : (error as Error).message;
      setError(errorMessage);
      toast.error("Error al recargar los datos: " + errorMessage);
    } finally {
      setLoading(false)
    }
  }, [selection, receptionStartTime, isReceptionCompleted]);

  // handleMissingUnitsChange function removed as we're now using the MissingReportForm

  useEffect(() => {
    setLoading(true);
    fetchData();
    const channel = supabase.channel('realtime_recepcion')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'recepcion',
        filter: `Local=eq.${selection.local}`
      }, (payload) => {
        const newRecord = payload.new as ScannedItem
        // Verificar que el registro sea de la fecha correcta también
        if (newRecord && newRecord.OLPN && newRecord.Fecha) {
          // Verificar que el registro pertenezca a la fecha seleccionada
          const recordDate = newRecord.Fecha.split('T')[0];
          if (recordDate === selection.fecha) {
            setScanned(prevScanned => {
              const newSet = new Set(prevScanned);
              newSet.add(newRecord.OLPN);
              return newSet;
            });
          }
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'recepcion',
        filter: `Local=eq.${selection.local}`
      }, (payload) => {
        const updatedRecord = payload.new as ScannedItem
        // Verificar que el registro sea de la fecha correcta también
        if (updatedRecord && updatedRecord.OLPN && updatedRecord.Fecha) {
          // Verificar que el registro pertenezca a la fecha seleccionada
          const recordDate = updatedRecord.Fecha.split('T')[0];
          if (recordDate === selection.fecha) {
            setScanned(prevScanned => {
              const newSet = new Set(prevScanned);
              newSet.add(updatedRecord.OLPN);
              return newSet;
            });
          }
        }
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'recepcion',
        filter: `Local=eq.${selection.local}`
      }, (payload) => {
        const deletedRecord = payload.old as ScannedItem
        // Verificar que el registro sea de la fecha correcta también
        if (deletedRecord && deletedRecord.OLPN && deletedRecord.Fecha) {
          // Verificar que el registro pertenecía a la fecha seleccionada
          const recordDate = deletedRecord.Fecha.split('T')[0];
          if (recordDate === selection.fecha) {
            setScanned(prevScanned => {
              const newSet = new Set(prevScanned);
              newSet.delete(deletedRecord.OLPN);
              return newSet;
            });
          }
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchData, selection.local, selection.fecha]);

  useEffect(() => {
    window.addEventListener('focus', fetchData);
    return () => { window.removeEventListener('focus', fetchData); };
  }, [fetchData]);

  useEffect(() => {
    setFilteredPackages(packages);
    
    // Check for existing reports for each package
    const checkExistingReports = async () => {
      if (packages.length > 0) {
        try {
          // Get all unique OLPNs
          const olpns = packages.map(pkg => pkg.OLPN);
          
          // Query for existing reports
          const { data: existingReportsData, error } = await supabase
            .from('faltantes')
            .select('olpn, ticket_id')
            .in('olpn', olpns);
          
          if (error) {
            console.error('Error checking for existing reports:', error);
            return;
          }
          
          // Create a map of OLPN -> ticket_id
          const reportsMap: Record<string, string> = {};
          existingReportsData.forEach(report => {
            reportsMap[report.olpn] = report.ticket_id;
          });
          
          setExistingReports(reportsMap);
        } catch (error) {
          console.error('Error checking for existing reports:', error);
        }
      } else {
        setExistingReports({});
      }
    };
    
    checkExistingReports();
    
    if (packages.length === 0 && scanned.size === 0) {
      setDnProgress([]);
    } else {
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
    }
  }, [packages, scanned]);

  

  const handleScan = (barcode: string) => {
    if (barcode && !isRegistering) {
      console.log('Barcode received from scanner:', barcode);
      setScannedOlpn(barcode);
      handleRegister(barcode);
    }
  };

  // Si estamos en la vista de administración, no necesitamos cargar datos
  const isAdminView = currentView === 'admin';
  
  // Si no hay selección, mostramos un mensaje
  const hasNoSelection = !selection || !selection.local || !selection.fecha;

  // Si estamos en la vista de administración, no necesitamos cargar datos
  if (isAdminView) {
    return <AdminView profile={{...profile, id: session?.user?.id}} />;
  }

  // Si no hay selección, mostramos un mensaje
  if (hasNoSelection) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Por favor, selecciona un local y una fecha para continuar</h3>
        <p>Utiliza el botón Volver para regresar a la pantalla de selección</p>
      </div>
    );
  }

  const handleRegister = async (olpnToRegister: string) => {
    // Guard against empty input
    if (!olpnToRegister || olpnToRegister.trim() === '') {
      toast.error("El campo de entrada está vacío.");
      return;
    }

    // Guard against concurrent runs
    if (isRegistering) {
      toast.error("Ya hay un registro en curso. Por favor, espera.");
      return;
    }
    
    const trimmedOlpn = olpnToRegister.trim();

    // Client-side check for duplicates for immediate feedback
    if (scanned.has(trimmedOlpn)) {
      return toast.error("¡ATENCIÓN! Este bulto ya fue registrado (duplicado).");
    }

    // Check if the package is expected
    const foundPackage = packages.find(p => p.OLPN === trimmedOlpn);
    if (!foundPackage) {
      return toast.error("¡ATENCIÓN! Este bulto no corresponde a los paquetes esperados.");
    }

    // Set lock
    setIsRegistering(true);
    
    try {
      console.log('handleRegister: Insertando en recepcion...');
      const { error: insertError } = await supabase.from('recepcion').insert({ 
        OLPN: foundPackage.OLPN, 
        Local: foundPackage.Local, 
        Fecha: foundPackage.Fecha, 
        DN: foundPackage.DN, 
        Unidades: foundPackage.Unidades, 
        ScannedBy: user.email 
      });
      
      if (insertError) {
        // Check for unique constraint violation from the database
        if (insertError.code === '23505') {
          console.log('handleRegister: Bulto ya registrado (duplicado) - DB constraint.');
          toast.error("¡ATENCIÓN! Este bulto ya fue registrado (duplicado).");
        } else {
          // Handle other potential insert errors
          console.error('handleRegister: Error al insertar:', insertError);
          toast.error(`Error al registrar: ${insertError.message}`);
        }
      } else {
        // Success
        console.log('handleRegister: Registro exitoso');
        setScanned(prevScanned => {
          const newSet = new Set(prevScanned);
          newSet.add(trimmedOlpn);
          return newSet;
        });
        setScannedOlpn('');
        toast.success(`Paquete ${trimmedOlpn} registrado.`);
      }
    } catch (error) {
      // This catch block is for unexpected errors in the try block logic itself
      console.error('handleRegister: Unexpected error:', error);
      toast.error(`Error inesperado: ${(error as Error).message}`);
    } finally {
      // Release lock
      setIsRegistering(false);
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
    // Verificar si ya se está completando la recepción o si ya se completó
    if (isCompletingReception || isReceptionCompleted) {
      return;
    }
    
    if (!(packages.length > 0 && scanned.size === packages.length)) {
      toast.error('La recepción aún no está completa')
      return;
    }

    try {
      // Establecer el estado de completado para evitar múltiples clics
      setIsCompletingReception(true);
      
      // Mostrar confirmación
      if (!window.confirm(`¿Estás seguro de que quieres completar esta recepción? Esta acción no se puede deshacer.`)) {
        setIsCompletingReception(false);
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
      const totalMissingUnits = Object.values(missingUnits).reduce((sum, current) => sum + current, 0);

      // Obtener la sesión del usuario
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Preparar datos para guardar
      const receptionData = {
        local: selection.local,
        fecha_recepcion: selection.fecha,
        user_id: userId || '',
        fecha_hora_completada: new Date().toISOString(),
        fecha_hora_inicio: receptionStartTime || new Date().toISOString(), // Incluir la hora de inicio
        olpn_esperadas: totalExpectedPackages,
        olpn_escaneadas: totalScannedPackages,
        dn_esperadas: totalExpectedDNs,
        dn_escaneadas: totalScannedDNs,
        unidades_esperadas: totalExpectedUnits,
        unidades_escaneadas: totalScannedUnits,
        unidades_faltantes: totalMissingUnits,
        estado: 'completada',
        detalles: packages.map(pkg => ({
          olpn: pkg.OLPN,
          dn: pkg.DN,
          unidades: pkg.Unidades,
          escaneado: scanned.has(pkg.OLPN),
          faltantes: missingUnits[pkg.OLPN] || 0,
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

      // Marcar la recepción como completada
      setIsReceptionCompleted(true);
      
      // Mostrar resumen de la recepción
      if (data && data.length > 0) {
        setCompletedReceptionData(data[0]);
        setShowReceptionSummary(true);
      }
      
      toast.success('Recepción completada y guardada exitosamente');
      
    } catch (error: unknown) {
      console.error('Error al completar la recepción:', error);
      toast.error(`Error al completar la recepción: ${(error as Error).message}`);
    } finally {
      // Restablecer el estado de completado
      setIsCompletingReception(false);
    }
  }

  if (loading) return <div>Cargando datos para {selection.local} en fecha {selection.fecha}...</div>
  if (error) return <div><p style={{color: 'red'}}><b>Error:</b> {error}</p></div>

  const getTableHeaders = () => {
    switch (profile?.role) {
      case 'Warehouse Operator':
      case 'Warehouse Supervisor':
      case 'Administrador':
        return { col1: 'OLPN', col2: 'DN' };
      case 'Store Operator':
      case 'Store Supervisor':
        return { col1: 'Bulto', col2: 'Factura' };
      case 'SKA Operator':
        return { col1: 'Correlativo del B2B', col2: 'OC' };
      default:
        return { col1: 'OLPN', col2: 'DN' };
    }
  };
  const tableHeaders = getTableHeaders();
  const isSkaOperator = profile?.role === 'SKA Operator';

  return (
    <div className="scanner-view-container">
      <main style={{ display: 'flex', gap: '10px', flexDirection: isPhone ? 'column' : 'row' }} className="scanner-main-layout">
        <div id='Izquierda' style={{ width: isPhone || isSkaOperator ? '100%' : '63%' }}>
          {/* Cuadro Resumen */}
          {!isSkaOperator && (
            <div id='CuadroResumen' style={{ 
              backgroundColor: '#ffffff',
              borderRadius: '4px',
              padding: '5px',
              border: '1px solid #000000',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
                <h3 style={{
                  margin: '0 0 5px 0',
                  color: '#000000',
                  textAlign: 'center',
                  fontSize: '1.2em'
                }}>
                  {selection.local} - {selection.fecha}
                </h3>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  textAlign: 'center',
                  flexWrap: 'wrap',
                  gap: '5px'
                }}>
                  <div style={{ margin: '5px', minWidth: '80px' }}> {/* Reducir márgenes */}
                    <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#000000' }}>
                      {/* Calcular DN/Facturas escaneadas */}
                      {Array.from(new Set(packages.filter(pkg => scanned.has(pkg.OLPN)).map(pkg => pkg.DN))).length} / {dnProgress.length}
                    </div>
                    <div style={{ fontSize: '0.9em', color: '#666666' }}>
                      {isWarehouseOrAdmin ? 'DN' : 'Facturas'}
                    </div>
                  </div>
                  
                  <div style={{ margin: '5px', minWidth: '80px' }}> {/* Reducir márgenes */}
                    <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#000000' }}>
                      {scanned.size} / {packages.length}
                    </div>
                    <div style={{ fontSize: '0.9em', color: '#666666' }}>
                      {isWarehouseOrAdmin ? 'OLPN' : 'Bultos'}
                    </div>
                  </div>
                  
                  <div style={{ margin: '5px', minWidth: '80px' }}> {/* Reducir márgenes */}
                    <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#000000' }}>
                      {packages.filter(pkg => scanned.has(pkg.OLPN)).reduce((sum, pkg) => sum + pkg.Unidades, 0)} / {packages.reduce((sum, pkg) => sum + pkg.Unidades, 0)}
                    </div>
                    <div style={{ fontSize: '0.9em', color: '#666666' }}>
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
                    disabled={!(packages.length > 0 && scanned.size === packages.length) || isCompletingReception || isReceptionCompleted}
                    style={{ 
                      flex: '1',
                      padding: '10px', // Reducir padding
                      borderRadius: '5px',
                      backgroundColor: isReceptionCompleted || (packages.length > 0 && scanned.size === packages.length && !isCompletingReception) ? '#A1C181' : (isCompletingReception || isReceptionCompleted ? '#ffffff' : '#ffffff'),
                      color: isReceptionCompleted || (packages.length > 0 && scanned.size === packages.length && !isCompletingReception) ? '#ffffff' : '#000000',
                      fontWeight: 'bold',
                      fontSize: '1em',
                      border: isReceptionCompleted || (packages.length > 0 && scanned.size === packages.length && !isCompletingReception) ? 'none' : '1px solid #000000',
                      cursor: packages.length > 0 && scanned.size === packages.length && !isCompletingReception && !isReceptionCompleted ? 'pointer' : 'not-allowed',
                      opacity: isReceptionCompleted || (packages.length > 0 && scanned.size === packages.length && !isCompletingReception) ? 1 : (isCompletingReception || isReceptionCompleted ? 0.6 : 1)
                    }}
                  >
                    {isCompletingReception ? 'Completando...' : (isReceptionCompleted ? 'Recepción Completada' : (packages.length > 0 && scanned.size === packages.length ? 'Recepción Completada' : 'Pendiente'))}
                  </button>
                  
                  {/* Botón de Historial */}
                  <button 
                    onClick={handleShowReceptionHistory}
                    style={{ 
                      flex: '1',
                      padding: '10px',
                      borderRadius: '5px',
                      backgroundColor: '#000000',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '1em',
                      border: 'none',
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
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '1em',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Estadísticas
                    </button>
                  )}
                </div>

              {/* --- Lógica de Escaneo Condicional --- */}
          {isPhone ? (
            // --- VISTA MÓVIL --- 
            <>
              {/* Mostrar siempre el input manual y botones en dispositivos móviles */}
              <div style={{ display: 'flex', gap: '5px', margin: '20px 0 0 0' }}>
                <input 
                  type="text" 
                  placeholder={`Escanear ${tableHeaders.col1}...`}
                  value={scannedOlpn}
                  onChange={(e) => setScannedOlpn(e.target.value)}
                  style={{fontSize: '1em', padding: '10px', flexGrow: 1, backgroundColor: '#fff', color: '#000', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#000000', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#000000', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: '#000000', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#000000', borderRadius: '5px'}}
                  onKeyPress={(e) => e.key === 'Enter' && canScan && handleRegister(scannedOlpn)}
                  disabled={!canScan}
                />
                <button 
                  onClick={() => handleRegister(scannedOlpn)} 
                  style={{padding: '5px', backgroundColor: canScan ? '#000000' : '#cccccc', color: '#FFFFFF', border: 'none', borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderRadius: '5px', cursor: canScan ? 'pointer' : 'not-allowed', fontWeight: 'bold'}}
                  disabled={!canScan}
                >
                  Registrar
                </button>
                <button 
                  onClick={() => setUseBarcodeScanner(true)}
                  style={{padding: '2px', backgroundColor: '#FFFFFF', color: '#000000', border: 'none', borderRadius: '4px', cursor: 'pointer', borderColor: '#000000', borderWidth: '1px', borderStyle: 'solid'}}
                  title="Usar escáner de código de barras"
                >
                  <Image 
                    alt="Código de Barras" 
                    src="/barcode.svg" 
                    width={44}
                    height={34}
                  />
                </button>
              </div>
              
              {/* Mostrar escáner de código de barras cuando esté activo */}
              {useBarcodeScanner && (
                <div style={{ marginBottom: '20px', marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4>Escáner de Código de Barras</h4>
                    <button
                      onClick={() => setUseBarcodeScanner(false)}
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
                      Usar Input Manual
                    </button>
                  </div>
                  <div><BarcodeScannerZXing onScan={handleScan} /></div>
                </div>
              )}
            </>
          ) : (
            // --- VISTA ESCRITORIO ---
            <>
              {/* Mostrar siempre el input manual y botones en vista de escritorio */}
              <div style={{ display: 'flex', gap: '5px', margin: '20px 0 0 0' }}>
                <input 
                  type="text" 
                  placeholder={`Escanear ${tableHeaders.col1}...`} 
                  value={scannedOlpn} 
                  onChange={(e) => setScannedOlpn(e.target.value)} 
                  style={{fontSize: '1em', padding: '10px', flexGrow: 1, backgroundColor: '#fff', color: '#000', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#000', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#000', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: '#000', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#000', borderRadius: '4px'}}
                  onKeyPress={(e) => e.key === 'Enter' && canScan && handleRegister(scannedOlpn)}
                  disabled={!canScan}
                />
                <button 
                  onClick={() => handleRegister(scannedOlpn)} 
                  style={{padding: '5px 10px', backgroundColor: canScan ? '#000000' : '#cccccc', color: '#FFFFFF', border: 'none', borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderRadius: '4px', cursor: canScan ? 'pointer' : 'not-allowed', fontWeight: 'bold'}}
                  disabled={!canScan}
                >
                  Registrar
                </button>
                <button 
                  onClick={() => setUseBarcodeScanner(true)}
                  style={{padding: '3px 2px 1px 2px', backgroundColor: '#FFFFFF', color: '#000000', border: 'none', borderRadius: '4px', cursor: 'pointer', borderColor: '#000000', borderWidth: '1px', borderStyle: 'solid'}}
                  title="Usar escáner de código de barras"
                >
                  <Image 
                    alt="Código de Barras" 
                    src="/barcode.svg" 
                    width={44}
                    height={34}
                  />
                </button>
              </div>
              
              {/* Mostrar escáner de código de barras cuando esté activo */}
              {useBarcodeScanner && (
                <div style={{ marginBottom: '20px', marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4>Escáner de Código de Barras</h4>
                    <button
                      onClick={() => setUseBarcodeScanner(false)}
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
                      Usar Input Manual
                    </button>
                  </div>
                  <div><BarcodeScannerZXing onScan={handleScan} /></div>
                </div>
              )}
            </>
          )}
            </div>
          )}
          

          <h4 style={{ color: '#000000' }}>Paquetes Esperados ({scanned.size} / {packages.length})</h4>
          {/* Search input for packages */}
          <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder={`Buscar por ${tableHeaders.col1} o ${tableHeaders.col2}...`}
              value={packageSearchTerm}
              onChange={(e) => setPackageSearchTerm(e.target.value)}
              style={{fontSize: '1em', padding: '8px', flexGrow: 1, backgroundColor: '#fff', color: '#000', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#000000', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#000000', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: '#000000', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#000000', borderRadius: '5px'}}
            />
            {packageSearchTerm && (
              <button 
                onClick={() => setPackageSearchTerm('')} 
                style={{padding: '8px 12px', backgroundColor: '#000000', color: '#FFFFFF', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'}}
              >
                Limpiar
              </button>
            )}
          </div>
          <div className="scroll-container" style={{ 
            maxHeight: '50vh', 
            overflowY: 'auto', 
            borderTopWidth: '1px', 
            borderTopStyle: 'solid', 
            borderTopColor: '#000000', 
            borderBottomWidth: '1px', 
            borderBottomStyle: 'solid', 
            borderBottomColor: '#000000', 
            borderLeftWidth: '1px', 
            borderLeftStyle: 'solid', 
            borderLeftColor: '#000000', 
            borderRightWidth: '1px', 
            borderRightStyle: 'solid', 
            borderRightColor: '#000000', 
            borderRadius: '4px'
          }}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '1px solid #000000'}}>
                  <th style={{padding: '8px', textAlign: 'center', color: '#000000'}}>{tableHeaders.col1}</th>
                  <th style={{padding: '8px', textAlign: 'center', width: '150px', color: '#000000'}}>{tableHeaders.col2}</th>
                  <th style={{padding: '8px', textAlign: 'center', width: '120px', color: '#000000'}}>Unidades</th>
                  <th style={{padding: '8px', textAlign: 'center', width: '120px', color: '#000000'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackages.map(pkg => (
                  <tr key={pkg.OLPN} style={{ 
                      backgroundColor: scanned.has(pkg.OLPN) ? '#A1C181' : 'transparent',
                      color: scanned.has(pkg.OLPN) ? '#000000' : '#999999',
                      borderBottom: '1px solid #555'
                    }}>
                    <td style={{padding: '8px', textAlign: 'center'}}>{pkg.OLPN}</td>
                    <td style={{padding: '8px', textAlign: 'center'}}>{pkg.DN}</td>
                    <td style={{padding: '8px', textAlign: 'center'}}>{pkg.Unidades}</td>
                    <td style={{padding: '8px', textAlign: 'center'}}>
                      <button
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setShowMissingReportForm(true);
                        }}
                        style={{
                          fontFamily: 'CuerpoPersonalizado',
                          padding: '5px 5px', 
                          backgroundColor: '#000000', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: '3px', 
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {existingReports[pkg.OLPN] || 'Reportar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna derecha con Resumen y Progreso por DN */}
        {!isSkaOperator && !isPhone && (
        <div id='Derecha' style={{ width: isPhone ? '100%' : '37%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          
          {/* Progreso por DN */}
          <div id='ProgresoPorDN' style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '4px', 
            padding: '10px', 
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '80vh',
            border: '1px solid #cccccc'
          }}>
            <h3 style={{ 
              margin: '0 0 15px 0', 
              color: '#000000', 
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
        
        {/* Progreso por DN en dispositivos móviles */}
        {!isSkaOperator && isPhone && (
          <div id='ProgresoPorDN' style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '8px', 
            padding: '10px',
            marginTop: '10px',
            border: '1px solid #cccccc'
          }}>
            <h3 style={{ 
              margin: '0 0 15px 0', 
              color: '#000000', 
              textAlign: 'center',
              fontSize: '1.2em'
            }}>
              Progreso por {isWarehouseOrAdmin ? 'DN' : 'Factura'}
            </h3>
            <div className="scroll-container" style={{ 
              maxHeight: '40vh', 
              overflowY: 'auto', 
              paddingRight: '10px'
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
        )}
      </main>
      
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
      
      {/* Mostrar formulario de reporte de faltantes/sobrantes si está activo */}
      {showMissingReportForm && selectedPackage && (
        <MissingReportForm
          packageData={selectedPackage}
          session={session}
          onClose={() => setShowMissingReportForm(false)}
          onReportSaved={() => {
            // Refresh or update any necessary data
            console.log('Report saved successfully');
          }}
        />
      )}
    </div>
  )
}
