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
import ActionDropdown from './ActionDropdown';
import TicketViewer from './TicketViewer'; // Import TicketViewer
import { isMobileDevice, isMobilePhone } from '@/lib/deviceUtils';

// Acknowledge unused isMobileDevice to prevent ESLint warning
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _isMobileDevice = isMobileDevice;
import { createReceptionCompletedNotification } from '@/lib/notificationService';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import '../globals.css';
import styles from './ScannerView.module.css';
import './scrollbarStyles.css';

// --- Tipos de Datos ---
type Profile = { role: string | null; }
type Selection = { local: string; fecha: string; }
type Package = { OLPN: string; DN: string; Unidades: number; Local: string; Fecha: string; }
type ScannedItem = { OLPN: string; Fecha?: string; }
type DNProgress = { dn: string; totalPackages: number; scannedPackages: number; }

// Interfaz para la paginación
type Pagination = {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
};

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
    ticket_id?: string; // ID del ticket relacionado con faltantes/sobrantes o rechazo
  }[];
  created_at?: string;
}

interface Props {
  session: Session;
  profile: Profile;
  selection: Selection;
  currentView: string; // Recibe la vista actual como prop
  setCurrentView: (view: 'scanner' | 'admin' | 'faltantes' | 'rechazos') => void;
  navigateToRechazos: (packageData: { OLPN: string; DN: string; Unidades: number; Local: string; Fecha: string; }) => void;
}

// fetchWithTimeout se eliminó ya que no se usaba

export default function ScannerView({ session, profile, selection, currentView, setCurrentView, navigateToRechazos }: Props) {
  // Acknowledge unused setCurrentView to prevent ESLint warning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _setCurrentView = setCurrentView;
  const router = useRouter();
  // Acknowledge unused router to prevent ESLint warning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _router = router;
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
  const [hasExistingReception, setHasExistingReception] = useState(false); // Estado para verificar si ya existe una recepción completada en la base de datos
  const [missingUnits, setMissingUnits] = useState<Record<string, number>>({});
  // Acknowledge unused setMissingUnits to prevent ESLint warning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _setMissingUnits = setMissingUnits;
  const [isRegistering, setIsRegistering] = useState(false);
  const [showMissingReportForm, setShowMissingReportForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [packageSearchTerm, setPackageSearchTerm] = useState(''); // For package search filter
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]); // Filtered packages for display
  const [existingReports, setExistingReports] = useState<Record<string, string>>({}); // Track existing reports by OLPN -> ticket_id
  const [existingRechazos, setExistingRechazos] = useState<Record<string, string>>({}); // Track existing rechazos by OLPN -> ticket_id
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null); // State for selected ticket to view
  const [showTicketViewer, setShowTicketViewer] = useState(false); // State to show TicketViewer
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estados para la paginación
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    itemsPerPage: 50, // 50 paquetes por página por defecto
    totalPages: 1,
    totalItems: 0,
  });
  const [paginatedPackages, setPaginatedPackages] = useState<Package[]>([]);

  const canEditMissing = profile?.role === 'administrador' || profile?.role === 'Store Operator';
  // Acknowledge unused canEditMissing to prevent ESLint warning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _canEditMissing = canEditMissing;

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
      let filtered: Package[] = [];
      if (!packageSearchTerm) {
        filtered = packages;
      } else {
        const term = packageSearchTerm.toLowerCase();
        filtered = packages.filter(pkg => {
          const olpn = pkg.OLPN.toLowerCase();
          const dn = pkg.DN.toLowerCase();
          return olpn.includes(term) || dn.includes(term);
        });
      }

      setFilteredPackages(filtered);
      
      // Actualizar la paginación
      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
      setPagination(prev => ({
        ...prev,
        totalItems,
        totalPages,
        currentPage: totalItems > 0 ? Math.min(prev.currentPage, totalPages) : 1
      }));
      
      // Actualizar los paquetes paginados
      const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const endIndex = startIndex + pagination.itemsPerPage;
      const paginated = filtered.slice(startIndex, endIndex);
      setPaginatedPackages(paginated);
    }, 250);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [packageSearchTerm, packages, pagination.itemsPerPage, pagination.currentPage]);

  // useEffect para actualizar paquetes paginados cuando cambia la página
  useEffect(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    const paginated = filteredPackages.slice(startIndex, endIndex);
    setPaginatedPackages(paginated);
  }, [filteredPackages, pagination.currentPage, pagination.itemsPerPage]);

  const fetchData = useCallback(async () => {
    setError(null)
    try {
      const startDate = selection.fecha;
      
      // Validar que startDate tenga un formato de fecha válido antes de usarlo
      const dateObj = new Date(startDate);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Fecha inválida proporcionada: ' + startDate);
      }
      
      const endDate = new Date(dateObj.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
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
        setHasExistingReception(true); // Actualizar el nuevo estado
        setCompletedReceptionData(completedReceptions[0]);
      } else {
        // La recepción no ha sido completada aún
        setIsReceptionCompleted(false);
        setHasExistingReception(false); // Actualizar el nuevo estado
      }
      
      // Obtener paquetes esperados y escaneados en paralelo para mejorar el rendimiento
      const [packageResult, scannedResult] = await Promise.all([
        supabase
          .from('data')
          .select('*')
          .eq('Local', selection.local)
          .gte('Fecha', startDate)
          .lt('Fecha', endDate),
        supabase
          .from('recepcion')
          .select('OLPN')
          .eq('Local', selection.local)
          .gte('Fecha', startDate)
          .lt('Fecha', endDate)
      ]);
      
      if (packageResult.error) throw packageResult.error;
      const packageData = packageResult.data || [];
      setPackages(packageData);
      
      // Establecer la hora de inicio de la recepción si aún no está establecida y la recepción no ha sido completada
      if (!receptionStartTime && !isReceptionCompleted) {
        setReceptionStartTime(new Date().toISOString());
      }
      
      // Actualizar la paginación
      const totalItems = packageData.length;
      const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
      setPagination(prev => ({
        ...prev,
        totalItems,
        totalPages,
        currentPage: totalItems > 0 ? Math.min(prev.currentPage, totalPages) : 1
      }));
      
      if (scannedResult.error) throw scannedResult.error;
      setScanned(new Set(scannedResult.data?.map((item: ScannedItem) => item.OLPN) || []));
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
    // Validar que la selección tenga valores válidos antes de cargar datos
    if (!selection.local || !selection.fecha) {
      setError("Selección incompleta. Por favor, seleccione un local y una fecha válidos.");
      setLoading(false);
      return;
    }

    // Validar formato de fecha
    const dateValidation = new Date(selection.fecha);
    if (isNaN(dateValidation.getTime())) {
      setError("Formato de fecha inválido. Por favor, seleccione una fecha válida.");
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchData();
    
    // Configurar canal de suscripción para cambios en recepción
    const channel = supabase.channel('realtime_recepcion')
      .on('postgres_changes', { 
        event: '*', // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
        schema: 'public', 
        table: 'recepcion',
        filter: `Local=eq.${selection.local}`
      }, (payload) => {
        // Procesar eficientemente todos los eventos de una sola vez
        setScanned(prevScanned => {
          const newSet = new Set(prevScanned);
          const record = payload.new || payload.old; // Para DELETE, el payload.old contiene el registro
          
          // Verificar que el record tenga las propiedades necesarias antes de acceder a ellas
          if (record && typeof record === 'object' && 'OLPN' in record && 'Fecha' in record && record.OLPN && record.Fecha) {
            const recordDate = (record.Fecha as string).split('T')[0];
            
            // Solo procesar si el registro pertenece a la fecha seleccionada
            if (recordDate === selection.fecha) {
              if (payload.eventType === 'DELETE') {
                newSet.delete(record.OLPN as string);
              } else {
                // Para INSERT y UPDATE, añadir al conjunto
                newSet.add(record.OLPN as string);
              }
            }
          }
          
          return newSet;
        });
      })
      .subscribe()
      
    return () => { 
      supabase.removeChannel(channel) 
    }
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
          
          // Query for existing faltantes reports
          const { data: existingReportsData, error: faltantesError } = await supabase
            .from('faltantes')
            .select('olpn, ticket_id')
            .in('olpn', olpns);
          
          if (faltantesError) {
            console.error('Error checking for existing faltantes reports:', faltantesError);
            return;
          }
          
          // Create a map of OLPN -> ticket_id for faltantes
          const reportsMap: Record<string, string> = {};
          existingReportsData.forEach(report => {
            reportsMap[report.olpn] = report.ticket_id;
          });
          
          setExistingReports(reportsMap);
          
          // Query for existing rechazos reports
          const { data: existingRechazosData, error: rechazosError } = await supabase
            .from('rechazos')
            .select('folio, ticket_id')
            .in('folio', olpns);
          
          if (rechazosError) {
            console.error('Error checking for existing rechazos reports:', rechazosError);
            return;
          }
          
          // Create a map of OLPN -> ticket_id for rechazos
          const rechazosMap: Record<string, string> = {};
          existingRechazosData.forEach(rechazo => {
            rechazosMap[rechazo.folio] = rechazo.ticket_id;
          });
          
          setExistingRechazos(rechazosMap);
        } catch (error) {
          console.error('Error checking for existing reports:', error);
        }
      } else {
        setExistingReports({});
        setExistingRechazos({});
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
      <div className={styles.selectionMessageContainer}>
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
  };

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
    // Verificar si ya se está completando la recepción
    if (isCompletingReception) {
      return;
    }
    
    // Check if all packages are either scanned or have missing/rejection reports
    const unhandledPackages = packages.filter(pkg => {
      return !scanned.has(pkg.OLPN) && 
             !existingReports[pkg.OLPN] && 
             !existingRechazos[pkg.OLPN];
    });
    
    if (packages.length > 0 && unhandledPackages.length > 0) {
      toast.error(`La recepción aún no está completa. Quedan ${unhandledPackages.length} paquetes sin manejar.`);
      return;
    }

    try {
      // Establecer el estado de completado para evitar múltiples clics
      setIsCompletingReception(true);

      // Hacer una verificación final inmediatamente antes de la inserción para prevenir condiciones de carrera
      const { data: finalCheck, error: finalCheckError } = await supabase
        .from('recepciones_completadas')
        .select('id')
        .eq('local', selection.local)
        .eq('fecha_recepcion', selection.fecha)
        .limit(1);
      
      if (finalCheckError) {
        console.error('Error en verificación final:', finalCheckError);
        toast.error('Error al verificar estado de recepción');
        setIsCompletingReception(false);
        return;
      }
      
      if (finalCheck && finalCheck.length > 0) {
        // Ya existe una recepción completada para este local y fecha
        toast.error('La recepción ya ha sido completada por otro usuario');
        setIsReceptionCompleted(true);
        setHasExistingReception(true);
        setIsCompletingReception(false); // Restablecer estado
        return;
      }
      
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
      const userName = session?.user?.email || 'Usuario desconocido';

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
        detalles: packages.map(pkg => {
          // Buscar si existe un ticket de faltante o rechazo para este paquete
          const ticketId = existingReports[pkg.OLPN] || existingRechazos[pkg.OLPN] || null;
          
          return {
            olpn: pkg.OLPN,
            dn: pkg.DN,
            unidades: pkg.Unidades,
            escaneado: scanned.has(pkg.OLPN),
            faltantes: missingUnits[pkg.OLPN] || 0,
            ticket_id: ticketId // Incluir el ID del ticket si existe
          };
        })
      };

      // Intentar insertar con manejo de conflictos
      const { data, error } = await supabase
        .from('recepciones_completadas')
        .insert([receptionData])
        .select();

      if (error) {
        // Verificar si el error es por registro duplicado
        if (error.code === '23505' || error.message.toLowerCase().includes('duplicate') || error.message.toLowerCase().includes('unique') || error.message.toLowerCase().includes('llave duplicada') || error.message.toLowerCase().includes('violates unique constraint')) {
          // Ya existe una recepción completada para este local y fecha
          toast.error('La recepción ya ha sido completada por otro usuario');
          
          // Verificar directamente en la base de datos para actualizar el estado
          const { data: existingData } = await supabase
            .from('recepciones_completadas')
            .select('*')
            .eq('local', selection.local)
            .eq('fecha_recepcion', selection.fecha)
            .limit(1);
          
          if (existingData && existingData.length > 0) {
            setIsReceptionCompleted(true);
            setHasExistingReception(true);
            setCompletedReceptionData(existingData[0]);
          } else {
            // En caso de inconsistencia, verificar directamente en la base de datos
            const { data: fallbackData } = await supabase
              .from('recepciones_completadas')
              .select('id')
              .eq('local', selection.local)
              .eq('fecha_recepcion', selection.fecha)
              .limit(1);
            
            if (fallbackData && fallbackData.length > 0) {
              setHasExistingReception(true);
              setIsReceptionCompleted(true);
            }
          }
          return;
        } else {
          // Otro tipo de error
          throw error;
        }
      } else {
        // Inserción exitosa
        // Marcar la recepción como completada
        setIsReceptionCompleted(true);
        setHasExistingReception(true); // Actualizar el nuevo estado
      }
      
      // Mostrar resumen de la recepción
      if (data && data.length > 0) {
        setCompletedReceptionData(data[0]);
        setShowReceptionSummary(true);
        
        // Crear notificación de recepción completada
        const firstPackage = packages[0];
        const payload = {
          recepcion_id: data[0].id.toString(),
          olpn: firstPackage?.OLPN,
          delivery_note: firstPackage?.DN || '',
          nombre_local: selection.local,
          tipo_local: '', // No tenemos este dato en la estructura actual
          unidades: totalScannedUnits,
          bultos: totalScannedPackages,
          completada_por: userName,
          completada_por_id: userId || '',
          timestamp: new Date().toISOString()
        };
        
        const notification = await createReceptionCompletedNotification(payload);
        if (notification) {
          console.log('Notification created successfully:', notification.id);
        } else {
          console.error('Failed to create notification');
        }
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
  if (error) return <div><p className={styles.errorMessage}><b>Error:</b> {error}</p></div>

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
    <div className={styles.scannerViewContainer}>
      <main className={isPhone ? styles.scannerMainLayoutPhone : styles.scannerMainLayout}>
        <div id='Izquierda' className={
          isSkaOperator 
            ? styles.leftColumnSkaOperator 
            : (isPhone ? styles.leftColumnPhone : styles.leftColumn)
        }>
          {/* Cuadro Resumen */}
          {!isSkaOperator && (
            <div id='CuadroResumen' className={styles.summaryContainer}>
                <h3 className={styles.summaryTitle}>
                  {selection.local} - {selection.fecha}
                </h3>
                
                <div className={styles.summaryIndicators}>
                  <div className={styles.summaryIndicator}> {/* Reducir márgenes */}
                    <div className={styles.summaryIndicatorValue}>
                      {/* Calcular DN/Facturas escaneadas o con reporte */}
                      {Array.from(new Set(
                        packages.filter(pkg => scanned.has(pkg.OLPN) || existingReports[pkg.OLPN] || existingRechazos[pkg.OLPN])
                        .map(pkg => pkg.DN)
                      )).length} / {dnProgress.length}
                    </div>
                    <div className={styles.summaryIndicatorLabel}>
                      {isWarehouseOrAdmin ? 'DN' : 'Facturas'}
                    </div>
                  </div>
                  
                  <div className={styles.summaryIndicator}> {/* Reducir márgenes */}
                    <div className={styles.summaryIndicatorValue}>
                      {Array.from(new Set(
                        packages.filter(pkg => scanned.has(pkg.OLPN) || existingReports[pkg.OLPN] || existingRechazos[pkg.OLPN])
                        .map(pkg => pkg.OLPN)
                      )).length} / {packages.length}
                    </div>
                    <div className={styles.summaryIndicatorLabel}>
                      {isWarehouseOrAdmin ? 'OLPN' : 'Bultos'}
                    </div>
                  </div>
                  
                  <div className={styles.summaryIndicator}> {/* Reducir márgenes */}
                    <div className={styles.summaryIndicatorValue}>
                      {packages
                        .filter(pkg => scanned.has(pkg.OLPN) || existingReports[pkg.OLPN] || existingRechazos[pkg.OLPN])
                        .reduce((sum, pkg) => sum + pkg.Unidades, 0)} / {packages.reduce((sum, pkg) => sum + pkg.Unidades, 0)}
                    </div>
                    <div className={styles.summaryIndicatorLabel}>
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
                    disabled={!(packages.length > 0 && 
                      packages.every(pkg => scanned.has(pkg.OLPN) || existingReports[pkg.OLPN] || existingRechazos[pkg.OLPN]))
                      || isCompletingReception || hasExistingReception}
                    style={{ 
                      flex: '1.8',
                      padding: '10px', // Reducir padding
                      borderRadius: '5px',
                      backgroundColor: hasExistingReception || 
                        (packages.length > 0 && 
                          packages.every(pkg => scanned.has(pkg.OLPN) || existingReports[pkg.OLPN] || existingRechazos[pkg.OLPN]) 
                          && !isCompletingReception && !hasExistingReception) ? 'var(--clr5)' : (isCompletingReception || hasExistingReception ? 'var(--clr1)' : 'var(--clr1)'),
                      color: hasExistingReception || 
                        (packages.length > 0 && 
                          packages.every(pkg => scanned.has(pkg.OLPN) || existingReports[pkg.OLPN] || existingRechazos[pkg.OLPN]) 
                          && !isCompletingReception && !hasExistingReception) ? 'var(--clr1)' : 'var(--clr4)',
                      fontWeight: 'bold',
                      fontSize: '1em',
                      border: hasExistingReception || 
                        (packages.length > 0 && 
                          packages.every(pkg => scanned.has(pkg.OLPN) || existingReports[pkg.OLPN] || existingRechazos[pkg.OLPN]) 
                          && !isCompletingReception && !hasExistingReception) ? 'none' : '1px solid var(--clr4)',
                      cursor: packages.length > 0 && 
                        packages.every(pkg => scanned.has(pkg.OLPN) || existingReports[pkg.OLPN] || existingRechazos[pkg.OLPN]) 
                        && !isCompletingReception && !hasExistingReception ? 'pointer' : 'not-allowed',
                      opacity: hasExistingReception || 
                        (packages.length > 0 && 
                          packages.every(pkg => scanned.has(pkg.OLPN) || existingReports[pkg.OLPN] || existingRechazos[pkg.OLPN]) 
                          && !isCompletingReception && !hasExistingReception) ? 1 : (isCompletingReception || hasExistingReception ? 0.6 : 1)
                    }}
                  >
                    {isCompletingReception ? 'Completando...' : (hasExistingReception ? 'Recepción Completada' : 
                      (packages.length > 0 && 
                        packages.every(pkg => scanned.has(pkg.OLPN) || existingReports[pkg.OLPN] || existingRechazos[pkg.OLPN]) ? 
                        'Recepción Completada' : 'Pendiente'))}
                  </button>
                  
                  {/* Botón de Historial */}
                  <button 
                    onClick={handleShowReceptionHistory}
                    style={{ 
                      flex: '1',
                      padding: '10px',
                      borderRadius: '5px',
                      backgroundColor: 'var(--clr4)',
                      color: 'var(--clr1)',
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
                        backgroundColor: 'var(--clr4)',
                        color: 'var(--clr1)',
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
              <div className={styles.scanningSectionContainer}>
                <input 
                  type="text" 
                  placeholder={`Escanear ${tableHeaders.col1}...`}
                  value={scannedOlpn}
                  onChange={(e) => setScannedOlpn(e.target.value)}
                  className={styles.manualInput}
                  onKeyPress={(e) => e.key === 'Enter' && canScan && handleRegister(scannedOlpn)}
                  disabled={!canScan}
                />
                <button 
                  onClick={() => handleRegister(scannedOlpn)} 
                  className={canScan ? styles.registerButton : styles.registerButtonDisabled}
                  disabled={!canScan}
                >
                  Registrar
                </button>
                <button 
                  onClick={() => setUseBarcodeScanner(true)}
                  className={styles.barcodeButton}
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
                <div className={styles.activeScannerContainer}>
                  <div className={styles.scannerHeaderContainer}>
                    <h4>Escáner de Código de Barras</h4>
                    <button
                      onClick={() => setUseBarcodeScanner(false)}
                      className={styles.manualInputButton}
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
              <div className={styles.scanningSectionContainer}>
                <input 
                  type="text" 
                  placeholder={`Escanear ${tableHeaders.col1}...`} 
                  value={scannedOlpn} 
                  onChange={(e) => setScannedOlpn(e.target.value)} 
                  className={styles.manualInputDesktop}
                  onKeyPress={(e) => e.key === 'Enter' && canScan && handleRegister(scannedOlpn)}
                  disabled={!canScan}
                />
                <button 
                  onClick={() => handleRegister(scannedOlpn)} 
                  className={canScan ? styles.registerButtonDesktop : styles.registerButtonDisabledDesktop}
                  disabled={!canScan}
                >
                  Registrar
                </button>
                <button 
                  onClick={() => setUseBarcodeScanner(true)}
                  className={styles.barcodeButtonDesktop}
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
                <div className={styles.activeScannerContainer}>
                  <div className={styles.scannerHeaderContainer}>
                    <h4>Escáner de Código de Barras</h4>
                    <button
                      onClick={() => setUseBarcodeScanner(false)}
                      className={styles.manualInputButtonDesktop}
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
          

          <h4 className={styles.expectedPackagesHeader}>
            Paquetes Esperados ({scanned.size} / {packages.length})
            <span style={{ fontSize: '0.8em', marginLeft: '10px' }}>
              Mostrando {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}-{Math.min(pagination.currentPage * pagination.itemsPerPage, filteredPackages.length)} de {filteredPackages.length}
            </span>
          </h4>
          {/* Search input for packages */}
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder={`Buscar por ${tableHeaders.col1} o ${tableHeaders.col2}...`}
              value={packageSearchTerm}
              onChange={(e) => setPackageSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {packageSearchTerm && (
              <button 
                onClick={() => setPackageSearchTerm('')} 
                className={styles.clearSearchButton}
              >
                Limpiar
              </button>
            )}
          </div>
          <div className="scroll-container" style={{ 
            maxHeight: '45vh', 
            overflowY: 'auto', 
            borderTopWidth: '1px', 
            borderTopStyle: 'solid', 
            borderTopColor: 'var(--clr4)', 
            borderBottomWidth: '1px', 
            borderBottomStyle: 'solid', 
            borderBottomColor: 'var(--clr4)', 
            borderLeftWidth: '1px', 
            borderLeftStyle: 'solid', 
            borderLeftColor: 'var(--clr4)', 
            borderRightWidth: '1px', 
            borderRightStyle: 'solid', 
            borderRightColor: 'var(--clr4)', 
            borderRadius: '4px'
          }}>
            <table className={styles.packagesTable}>
              <thead>
                <tr className={styles.packagesTableHeaderRow}>
                  <th className={styles.packagesTableHeaderCell}>{tableHeaders.col1}</th>
                  <th className={`${styles.packagesTableHeaderCell} ${styles.packagesTableHeaderCellDN}`}>{tableHeaders.col2}</th>
                  <th className={`${styles.packagesTableHeaderCell} ${styles.packagesTableHeaderCellUD}`}>ud.</th>
                  <th className={`${styles.packagesTableHeaderCell} ${styles.packagesTableHeaderCellActions}`}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPackages.map(pkg => (
                  <tr key={pkg.OLPN} className={
                    (scanned.has(pkg.OLPN) || existingReports[pkg.OLPN] || existingRechazos[pkg.OLPN]) 
                      ? styles.packagesTableRowScanned 
                      : styles.packagesTableRow
                  }>
                    <td className={styles.packagesTableCell}>{pkg.OLPN}</td>
                    <td className={styles.packagesTableCell}>{pkg.DN}</td>
                    <td className={styles.packagesTableCell}>{pkg.Unidades}</td>
                    <td className={styles.packagesTableCellActions}>
                      <div className={styles.packagesTableActionsContainer}>
                        {/* Show ticket numbers if they exist and make them clickable */}
                        {existingReports[pkg.OLPN] && (
                          <span 
                            onClick={() => {
                              setSelectedTicketId(existingReports[pkg.OLPN]);
                              setShowTicketViewer(true);
                            }}
                            className={styles.ticketSpan}
                          >
                            {existingReports[pkg.OLPN]}
                          </span>
                        )}
                        {existingRechazos[pkg.OLPN] && (
                          <span 
                            onClick={() => {
                              setSelectedTicketId(existingRechazos[pkg.OLPN]);
                              setShowTicketViewer(true);
                            }}
                            className={styles.ticketSpan}
                          >
                            {existingRechazos[pkg.OLPN]}
                          </span>
                        )}
                        {/* Always show the dropdown menu */}
                        <ActionDropdown
                          faltantesTicket={existingReports[pkg.OLPN]}
                          rechazosTicket={existingRechazos[pkg.OLPN]}
                          onFaltantesClick={() => {
                            setSelectedPackage(pkg);
                            setShowMissingReportForm(true);
                          }}
                          onRechazosClick={() => {
                            // Navigate to Rechazos view with package data
                            navigateToRechazos(pkg);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Controles de paginación */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '10px',
            padding: '0 10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>Elementos por página:</span>
              <select
                value={pagination.itemsPerPage}
                onChange={(e) => {
                  const newItemsPerPage = Number(e.target.value);
                  setPagination(prev => ({
                    ...prev,
                    itemsPerPage: newItemsPerPage,
                    currentPage: 1 // Volver a la primera página al cambiar elementos por página
                  }));
                }}
                style={{ 
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--clr4)'
                }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => setPagination(prev => ({
                  ...prev,
                  currentPage: Math.max(prev.currentPage - 1, 1)
                }))}
                disabled={pagination.currentPage <= 1}
                style={{ 
                  padding: '6px 12px', 
                  margin: '0 5px',
                  borderRadius: '4px',
                  border: '1px solid var(--clr4)',
                  backgroundColor: pagination.currentPage <= 1 ? 'var(--clr1)' : 'var(--clr4)',
                  color: pagination.currentPage <= 1 ? 'var(--clr2)' : 'var(--clr1)',
                  cursor: pagination.currentPage <= 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Anterior
              </button>
              
              <span style={{ margin: '0 15px' }}>
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setPagination(prev => ({
                  ...prev,
                  currentPage: Math.min(prev.currentPage + 1, prev.totalPages)
                }))}
                disabled={pagination.currentPage >= pagination.totalPages}
                style={{ 
                  padding: '6px 12px', 
                  margin: '0 5px',
                  borderRadius: '4px',
                  border: '1px solid var(--clr4)',
                  backgroundColor: pagination.currentPage >= pagination.totalPages ? 'var(--clr1)' : 'var(--clr4)',
                  color: pagination.currentPage >= pagination.totalPages ? 'var(--clr2)' : 'var(--clr1)',
                  cursor: pagination.currentPage >= pagination.totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

        {/* Columna derecha con Resumen y Progreso por DN */}
        {!isSkaOperator && !isPhone && (
        <div id='Derecha' className={styles.rightColumn}>
          
          
          {/* Progreso por DN */}
          <div id='ProgresoPorDN' className={styles.progressContainer}>
            <h3 className={styles.progressTitle}>
              Progreso por {isWarehouseOrAdmin ? 'DN' : 'Factura'}
            </h3>
            <div className={`scroll-container ${styles.progressScrollContainer}`}>
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
          <div id='ProgresoPorDN' className={styles.progressContainerMobile}>
            <h3 className={styles.progressTitle}>
              Progreso por {isWarehouseOrAdmin ? 'DN' : 'Factura'}
            </h3>
            <div className={`scroll-container ${styles.progressScrollContainerMobile}`}>
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
          local={selection.local}
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
          onClose={() => setShowMissingReportForm(false)}
          onReportSaved={() => {
            // Refresh or update any necessary data
            console.log('Report saved successfully');
          }}
        />
      )}
      
      {/* Mostrar TicketViewer si está activo */}
      {showTicketViewer && selectedTicketId && (
        <TicketViewer
          ticketId={selectedTicketId}
          userId={session.user.id}
          onClose={() => setShowTicketViewer(false)}
        />
      )}
    </div>
  )
}
