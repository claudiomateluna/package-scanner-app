// MissingReportForm.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

// Define types
interface PackageData {
  OLPN: string;
  DN: string;
  Local: string;
  Fecha: string;
  Unidades: number;
}

interface LocalData {
  id: number;
  tipo_local: 'FRA' | 'RTL' | 'SKA' | 'WHS';
  nombre_local: string;
}

interface MissingReport {
  id?: number;
  ticket_id?: string;
  olpn: string;
  delivery_note: string;
  tipo_reporte: 'Faltante' | 'Sobrante' | '';
  nombre_local: string;
  tipo_local: 'FRA' | 'RTL' | 'SKA' | 'WHS';
  fecha: string;
  factura?: string;
  detalle_producto?: string;
  talla?: string;
  cantidad?: number;
  peso_olpn?: string;
  detalle_bulto_estado?: 'Caja abierta antes de la recepción' | 'Caja dañada en el transporte' | 'Caja perdida en el transporte' | 'Cinta adulterada';
  foto_olpn?: File | null;
  foto_bulto?: File | null;
}

interface Props {
  packageData: PackageData;
  session: Session;
  onClose: () => void;
  onReportSaved: () => void;
}

// Define a custom window interface
interface CustomWindow extends Window {
  existingFotoOlpnUrl?: string;
  existingFotoBultoUrl?: string;
}

const MissingReportForm = ({ packageData, session, onClose, onReportSaved }: Props) => {
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Limpiar las variables globales
      const customWindow = window as unknown as CustomWindow;
      delete customWindow.existingFotoOlpnUrl;
      delete customWindow.existingFotoBultoUrl;
    };
  }, []);

  // Get local type
  const [localData, setLocalData] = useState<LocalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<MissingReport>({
    olpn: packageData.OLPN,
    delivery_note: packageData.DN,
    tipo_reporte: '',
    nombre_local: packageData.Local,
    tipo_local: 'RTL', // Will be updated after fetching local data
    fecha: packageData.Fecha.split('T')[0], // Format as YYYY-MM-DD
    factura: '',
    detalle_producto: '',
    talla: '',
    cantidad: undefined,
    peso_olpn: '',
    detalle_bulto_estado: undefined,
    foto_olpn: null,
    foto_bulto: null
  });
  
  // UI state
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Refs for file inputs
  const fotoOlpnRef = useRef<HTMLInputElement>(null);
  const fotoBultoRef = useRef<HTMLInputElement>(null);

  // Fetch local data to determine type
  useEffect(() => {
    const fetchLocalData = async () => {
      try {
        const { data, error } = await supabase
          .from('locales')
          .select('*')
          .eq('nombre_local', packageData.Local)
          .single();
        
        if (error) throw error;
        
        setLocalData(data);
        setFormData(prev => ({
          ...prev,
          tipo_local: data.tipo_local
        }));
      } catch (error) {
        console.error('Error fetching local data:', error);
        toast.error('Error al cargar datos del local');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocalData();
  }, [packageData.Local]);

  // Check if report already exists
  useEffect(() => {
    const checkExistingReport = async () => {
      if (!formData.olpn) return;
      
      try {
        // Verificar si ya existe un reporte para esa OLPN
        const { data, error } = await supabase
          .from('faltantes')
          .select('*')
          .eq('olpn', formData.olpn)
          .single();
        
        if (data) {
          // Obtener el usuario actual
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            toast.error('Usuario no autenticado');
            onClose();
            return;
          }
          
          // Verificar si el usuario tiene permiso para editar este reporte
          const canEdit = await checkUserHasPermission(user.id, data.created_by_user_id);
          
          // Usuario tiene permiso para editar, cargar el reporte
          console.log('Cargando reporte existente:', data);
          
          // Load existing report data
          setFormData({
            id: data.id,
            ticket_id: data.ticket_id,
            olpn: data.olpn,
            delivery_note: data.delivery_note,
            tipo_reporte: data.tipo_reporte as 'Faltante' | 'Sobrante' | '',
            nombre_local: data.nombre_local,
            tipo_local: data.tipo_local as 'FRA' | 'RTL' | 'SKA' | 'WHS',
            fecha: data.fecha,
            factura: data.factura || '',
            detalle_producto: data.detalle_producto || '',
            talla: data.talla || '',
            cantidad: data.cantidad || undefined,
            peso_olpn: data.peso_olpn || '',
            detalle_bulto_estado: data.detalle_bulto_estado as 'Caja abierta antes de la recepción' | 'Caja dañada en el transporte' | 'Caja perdida en el transporte' | 'Cinta adulterada' | undefined,
            foto_olpn: null, // We don't load existing files
            foto_bulto: null  // We don't load existing files
          });
          
          // Guardar las URLs de los archivos existentes para referencia
          if (data.foto_olpn) {
            console.log('Guardando URL de foto_olpn existente:', data.foto_olpn);
            const customWindow = window as unknown as CustomWindow;
            customWindow.existingFotoOlpnUrl = data.foto_olpn;
          }
          if (data.foto_bulto) {
            console.log('Guardando URL de foto_bulto existente:', data.foto_bulto);
            const customWindow = window as unknown as CustomWindow;
            customWindow.existingFotoBultoUrl = data.foto_bulto;
          }
          
          setShowAdditionalInfo(true);
        }
      } catch (error) {
        // No existing report found, continue with new report
        console.log('No existing report found or error:', error);
      }
    };
    
    // Función para verificar permisos del usuario
    const checkUserHasPermission = async (userId: string, reportCreatorId: string) => {
      try {
        // Si es el creador del reporte, tiene permiso
        if (userId === reportCreatorId) {
          return true;
        }
        
        // Verificar si el usuario tiene un rol de supervisor
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();
        
        if (profileError) throw profileError;
        
        // Usuarios con roles de supervisor tienen permiso
        return ['administrador', 'Warehouse Supervisor', 'Store Supervisor'].includes(profileData.role);
      } catch (error) {
        console.error('Error checking user permissions:', error);
        return false;
      }
    };
    
    if (!loading) {
      checkExistingReport();
    }
  }, [formData.olpn, loading, onClose]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Show additional info when report type is selected
    if (name === 'tipo_reporte' && value) {
      setShowAdditionalInfo(true);
    }
  };

  // Handle file input changes
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, fieldName: 'foto_olpn' | 'foto_bulto') => {
    console.log('handleFileChange llamado con:', { fieldName, files: e.target.files });
    const file = e.target.files?.[0] || null;
    
    // Validate file type
    if (file && !file.name.toLowerCase().match(/\.(jpg|jpeg)$/)) {
      toast.error('Solo se permiten archivos JPG');
      e.target.value = ''; // Clear the input
      return;
    }
    
    console.log('Actualizando formData con:', { [fieldName]: file });
    setFormData(prev => {
      const newData = {
        ...prev,
        [fieldName]: file
      };
      console.log('Nuevo estado de formData:', newData);
      return newData;
    });
  }, []);

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.tipo_reporte) {
      newErrors.tipo_reporte = 'Tipo de reporte es obligatorio';
    }
    
    if (!formData.olpn) {
      newErrors.olpn = 'OLPN es obligatorio';
    }
    
    if (!formData.delivery_note) {
      newErrors.delivery_note = 'Delivery Note es obligatorio';
    }
    
    if (!formData.nombre_local) {
      newErrors.nombre_local = 'Nombre del Local es obligatorio';
    }
    
    if (!formData.fecha) {
      newErrors.fecha = 'Fecha es obligatoria';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate ticket ID
  const generateTicketId = async (tipo_local: string) => {
    try {
      console.log('Generando ticket ID para tipo_local:', tipo_local);
      
      // Get the current counter for this tipo_local
      const { data: counterData, error: counterError } = await supabase
        .from('ticket_counters')
        .select('counter')
        .eq('tipo_local', tipo_local)
        .maybeSingle(); // Usar maybeSingle para evitar errores si no existe
      
      console.log('Resultado de consulta de contador:', { counterData, counterError });
      
      let newCounter = 1;
      
      if (counterData) {
        // Update existing counter
        newCounter = counterData.counter + 1;
        console.log('Actualizando contador existente a:', newCounter);
        
        const { error: updateError } = await supabase
          .from('ticket_counters')
          .update({ counter: newCounter })
          .eq('tipo_local', tipo_local);
        
        console.log('Resultado de actualización de contador:', { updateError });
        
        if (updateError) {
          console.error('Error updating counter:', updateError);
          throw updateError;
        }
      } else {
        // Create new counter or initialize if not exists
        console.log('Creando/Inicializando contador con valor:', newCounter);
        
        const { error: upsertError } = await supabase
          .from('ticket_counters')
          .upsert({ tipo_local, counter: newCounter });
        
        console.log('Resultado de upsert de contador:', { upsertError });
        
        if (upsertError) {
          console.error('Error upserting counter:', upsertError);
          throw upsertError;
        }
      }
      
      // Format as 9-digit number with leading zeros
      const counterString = newCounter.toString().padStart(9, '0');
      const ticketId = `${tipo_local}${counterString}`;
      console.log('Ticket ID generado:', ticketId);
      return ticketId;
    } catch (error) {
      console.error('Error generating ticket ID:', error);
      toast.error('Error al generar ID de ticket');
      throw error;
    }
  };

  // Upload files to storage
  const uploadFiles = async (ticketId: string) => {
    const uploadedFiles: { foto_olpn_url?: string; foto_bulto_url?: string } = {};
    
    try {
      console.log('Iniciando uploadFiles con ticketId:', ticketId);
      console.log('formData.foto_olpn:', formData.foto_olpn);
      console.log('formData.foto_bulto:', formData.foto_bulto);
      console.log('fotoOlpnRef.current?.files:', fotoOlpnRef.current?.files?.length ? fotoOlpnRef.current.files : 'No files or undefined');
      console.log('fotoBultoRef.current?.files:', fotoBultoRef.current?.files?.length ? fotoBultoRef.current.files : 'No files or undefined');
      
      // Obtener archivos de los refs si el formData está vacío (re-renderizado)
      const olpnFile = formData.foto_olpn || (fotoOlpnRef.current?.files && fotoOlpnRef.current.files[0] || null);
      const bultoFile = formData.foto_bulto || (fotoBultoRef.current?.files && fotoBultoRef.current.files[0] || null);
      
      console.log('Archivos a procesar:', { olpnFile, bultoFile });
      
      // Upload foto_olpn if provided
      if (olpnFile) {
        const fileExt = olpnFile.name.split('.').pop();
        const fileName = `${ticketId}_olpn.${fileExt}`;
        const filePath = `${ticketId}/${fileName}`;
        
        console.log('Subiendo foto_olpn con filePath:', filePath);
        
        // Primero intentar eliminar el archivo existente
                  const existingUrl = (window as unknown as CustomWindow).existingFotoOlpnUrl;
        if (existingUrl) {
          console.log('Intentando eliminar archivo existente:', existingUrl);
          // Extraer la ruta del archivo de la URL
          const urlParts = existingUrl.split('/');
          const existingFilePath = urlParts.slice(urlParts.indexOf('faltantes-attachments') + 1).join('/');
          console.log('Ruta del archivo a eliminar:', existingFilePath);
          
          const { data: removeData, error: removeError } = await supabase.storage
            .from('faltantes-attachments')
            .remove([existingFilePath]);
          
          console.log('Resultado de eliminación:', { removeData, removeError });
        }
        
        // Pequeño retraso para asegurar que la eliminación se complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Luego subir el nuevo archivo
        console.log('Subiendo nuevo archivo:', filePath);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('faltantes-attachments')
          .upload(filePath, olpnFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        console.log('Resultado de subida:', { uploadData, uploadError });
        
        if (uploadError) throw uploadError;
        uploadedFiles.foto_olpn_url = filePath;
        console.log('Archivo subido correctamente, URL:', filePath);
      }
      
      // Upload foto_bulto if provided
      if (bultoFile) {
        const fileExt = bultoFile.name.split('.').pop();
        const fileName = `${ticketId}_bulto.${fileExt}`;
        const filePath = `${ticketId}/${fileName}`;
        
        console.log('Subiendo foto_bulto con filePath:', filePath);
        
        // Primero intentar eliminar el archivo existente
        const existingUrl = (window as unknown as CustomWindow).existingFotoBultoUrl;
        if (existingUrl) {
          console.log('Intentando eliminar archivo existente:', existingUrl);
          // Extraer la ruta del archivo de la URL
          const urlParts = existingUrl.split('/');
          const existingFilePath = urlParts.slice(urlParts.indexOf('faltantes-attachments') + 1).join('/');
          console.log('Ruta del archivo a eliminar:', existingFilePath);
          
          const { data: removeData, error: removeError } = await supabase.storage
            .from('faltantes-attachments')
            .remove([existingFilePath]);
          
          console.log('Resultado de eliminación:', { removeData, removeError });
        }
        
        // Pequeño retraso para asegurar que la eliminación se complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Luego subir el nuevo archivo
        console.log('Subiendo nuevo archivo:', filePath);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('faltantes-attachments')
          .upload(filePath, bultoFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        console.log('Resultado de subida:', { uploadData, uploadError });
        
        if (uploadError) throw uploadError;
        uploadedFiles.foto_bulto_url = filePath;
        console.log('Archivo subido correctamente, URL:', filePath);
      }
      
      console.log('Archivos subidos:', uploadedFiles);
      return uploadedFiles;
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Error al subir archivos');
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no encontrado');
      
      // Get user profile for name
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      
      const userName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || user.email || 'Usuario desconocido';
      
      let ticketId = formData.ticket_id;
      let uploadedFiles: { foto_olpn_url?: string; foto_bulto_url?: string } | undefined;
      
      if (formData.id) {
        // Update existing report
        console.log('Updating existing report');
        
        // Upload files if provided
        // Verificar si el usuario ha seleccionado nuevos archivos para subir
        console.log('Verificando si hay nuevos archivos para subir en edición:', { 
          formData_foto_olpn: formData.foto_olpn,
          formData_foto_bulto: formData.foto_bulto,
          olpnFiles: fotoOlpnRef.current?.files?.length,
          bultoFiles: fotoBultoRef.current?.files?.length
        });
        
        // Verificar si hay archivos seleccionados en los inputs o en el formData
        const hasNewFilesFromRefs = (fotoOlpnRef.current?.files && fotoOlpnRef.current.files.length > 0) || 
                                   (fotoBultoRef.current?.files && fotoBultoRef.current.files.length > 0);
        const hasNewFilesFromState = (formData.foto_olpn !== null) || (formData.foto_bulto !== null);
        console.log('hasNewFilesFromRefs:', hasNewFilesFromRefs, 'hasNewFilesFromState:', hasNewFilesFromState);
        
        if (hasNewFilesFromRefs || hasNewFilesFromState) {
          if (!ticketId) throw new Error('Ticket ID no encontrado para reporte existente');
          console.log('Iniciando uploadFiles para actualización con ticketId:', ticketId);
          uploadedFiles = await uploadFiles(ticketId);
          console.log('uploadFiles completado, archivos subidos:', uploadedFiles);
        }
        
        const updateData = {
          tipo_reporte: formData.tipo_reporte,
          factura: formData.factura,
          detalle_producto: formData.detalle_producto,
          talla: formData.talla,
          cantidad: formData.cantidad,
          peso_olpn: formData.peso_olpn,
          detalle_bulto_estado: formData.detalle_bulto_estado,
          updated_at: new Date().toISOString(),
          updated_by_user_id: user.id,
          updated_by_user_name: userName
        };
        
        // Add file URLs if uploaded
        if (uploadedFiles?.foto_olpn_url) {
          (updateData as Partial<typeof updateData> & { foto_olpn?: string }).foto_olpn = uploadedFiles.foto_olpn_url;
        }
        if (uploadedFiles?.foto_bulto_url) {
          (updateData as Partial<typeof updateData> & { foto_bulto?: string }).foto_bulto = uploadedFiles.foto_bulto_url;
        }
        
        const { error: updateError } = await supabase
          .from('faltantes')
          .update(updateData)
          .eq('id', formData.id);
        
        console.log('Resultado de actualización en base de datos:', { updateData, error: updateError });
        
        if (updateError) {
          console.error('Error updating report:', updateError);
          throw updateError;
        }
        toast.success('Reporte actualizado exitosamente');
      } else {
        // Create new report
        console.log('Creating new report');
        
        // Generate ticket ID
        ticketId = await generateTicketId(formData.tipo_local);
        
        // Upload files
        // Verificar si el usuario ha seleccionado archivos para subir
        console.log('Verificando si hay archivos para subir en creación:', { 
          foto_olpn: formData.foto_olpn,
          foto_bulto: formData.foto_bulto
        });
        
        if (formData.foto_olpn || formData.foto_bulto) {
          console.log('Iniciando uploadFiles para creación con ticketId:', ticketId);
          uploadedFiles = await uploadFiles(ticketId);
          console.log('uploadFiles completado para creación, archivos subidos:', uploadedFiles);
        }
        
        const insertData = {
          ticket_id: ticketId,
          olpn: formData.olpn,
          delivery_note: formData.delivery_note,
          tipo_reporte: formData.tipo_reporte,
          nombre_local: formData.nombre_local,
          tipo_local: formData.tipo_local,
          fecha: formData.fecha,
          factura: formData.factura,
          detalle_producto: formData.detalle_producto,
          talla: formData.talla,
          cantidad: formData.cantidad,
          peso_olpn: formData.peso_olpn,
          detalle_bulto_estado: formData.detalle_bulto_estado,
          foto_olpn: uploadedFiles?.foto_olpn_url || null,
          foto_bulto: uploadedFiles?.foto_bulto_url || null,
          created_by_user_id: user.id,
          created_by_user_name: userName,
          updated_at: new Date().toISOString(),
          updated_by_user_id: user.id,
          updated_by_user_name: userName
        };
        
        const { error: insertError } = await supabase
          .from('faltantes')
          .insert(insertData);
        
        console.log('Resultado de inserción en base de datos:', { insertData, error: insertError });
        
        if (insertError) {
          console.error('Error inserting report:', insertError);
          throw insertError;
        }
        toast.success('Reporte guardado exitosamente');
      }
      
      onReportSaved();
      onClose();
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error(`Error al guardar el reporte: ${(error as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Get label based on local type
  const getLabel = (skaLabel: string, defaultLabel: string) => {
    return localData?.tipo_local === 'SKA' ? skaLabel : defaultLabel;
  };

  // Check if field should be hidden for SKA
  const isHiddenForSKA = (fieldName: string) => {
    if (localData?.tipo_local !== 'SKA') return false;
    return ['factura', 'peso_olpn'].includes(fieldName);
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div>Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{formData.id ? 'Editar Reporte' : 'Nuevo Reporte de Faltante/Sobrante'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="missing-report-form">
          {/* Section 1: Identification (preloaded) */}
          <div className="form-section">
            <h3>Identificación</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>{getLabel('Correlativo del B2B', 'OLPN')} *</label>
                <input
                  type="text"
                  name="olpn"
                  value={formData.olpn}
                  readOnly
                  className="form-input readonly"
                />
                {errors.olpn && <span className="error">{errors.olpn}</span>}
              </div>
              
              <div className="form-group">
                <label>{getLabel('OC', 'Delivery Note')} *</label>
                <input
                  type="text"
                  name="delivery_note"
                  value={formData.delivery_note}
                  readOnly
                  className="form-input readonly"
                />
                {errors.delivery_note && <span className="error">{errors.delivery_note}</span>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>{getLabel('SKA', 'Local')} *</label>
                <input
                  type="text"
                  name="nombre_local"
                  value={formData.nombre_local}
                  readOnly
                  className="form-input readonly"
                />
                {errors.nombre_local && <span className="error">{errors.nombre_local}</span>}
              </div>
              
              <div className="form-group">
                <label>{getLabel('Fecha', 'Fecha')} *</label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  readOnly
                  className="form-input readonly"
                />
                {errors.fecha && <span className="error">{errors.fecha}</span>}
              </div>
            </div>
          </div>
          
          {/* Section 2: Report Type Selection */}
          <div className="form-section">
            <h3>{getLabel('Tipo de Reporte', 'Tipo de Reporte')} *</h3>
            
            <div className="form-group">
              <select
                name="tipo_reporte"
                value={formData.tipo_reporte}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Seleccionar tipo de reporte</option>
                <option value="Faltante">Faltante</option>
                <option value="Sobrante">Sobrante</option>
              </select>
              {errors.tipo_reporte && <span className="error">{errors.tipo_reporte}</span>}
            </div>
          </div>
          
          {/* Section 3: Additional Information (revealed after selecting report type) */}
          {showAdditionalInfo && (
            <div className="form-section">
              <h3>Información Adicional</h3>
              
              {!isHiddenForSKA('factura') && (
                <div className="form-group">
                  <label>{getLabel('', 'Factura')}</label>
                  <input
                    type="text"
                    name="factura"
                    value={formData.factura}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>{getLabel('Detalle del Producto', 'Detalle del Producto')}</label>
                <input
                  type="text"
                  name="detalle_producto"
                  value={formData.detalle_producto}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>{getLabel('Talla', 'Talla')}</label>
                  <input
                    type="text"
                    name="talla"
                    value={formData.talla}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>{getLabel('Cantidad', 'Cantidad')}</label>
                  <input
                    type="number"
                    name="cantidad"
                    value={formData.cantidad || ''}
                    onChange={handleChange}
                    className="form-input"
                    min="0"
                  />
                </div>
              </div>
              
              {!isHiddenForSKA('peso_olpn') && (
                <div className="form-group">
                  <label>{getLabel('', 'Peso de OLPN')}</label>
                  <input
                    type="text"
                    name="peso_olpn"
                    value={formData.peso_olpn}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>{getLabel('Detalle de Cómo Venía el Bulto', 'Detalle de Cómo Venía el Bulto')}</label>
                <select
                  name="detalle_bulto_estado"
                  value={formData.detalle_bulto_estado || ''}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Seleccionar estado</option>
                  <option value="Caja abierta antes de la recepción">Caja abierta antes de la recepción</option>
                  <option value="Caja dañada en el transporte">Caja dañada en el transporte</option>
                  <option value="Caja perdida en el transporte">Caja perdida en el transporte</option>
                  <option value="Cinta adulterada">Cinta adulterada</option>
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>{getLabel('Foto del B2B', getLabel('', 'Foto de OLPN'))}</label>
                  <input
                    type="file"
                    ref={fotoOlpnRef}
                    onChange={(e) => handleFileChange(e, 'foto_olpn')}
                    className="form-input"
                    accept=".jpg,.jpeg"
                  />
                  <small>Solo se permiten archivos JPG</small>
                </div>
                
                <div className="form-group">
                  <label>{getLabel('Foto del Bulto', 'Foto del Bulto')}</label>
                  <input
                    type="file"
                    ref={fotoBultoRef}
                    onChange={(e) => handleFileChange(e, 'foto_bulto')}
                    className="form-input"
                    accept=".jpg,.jpeg"
                  />
                  <small>Solo se permiten archivos JPG</small>
                </div>
              </div>
            </div>
          )}
          
          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : (formData.id ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
      
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-content {
          background-color: #FFFFFF;
          border-radius: 4px;
          max-width: 600px;
          width: 90%;
          max-height: 95vh;
          overflow-y: auto;
          color: #000000;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          border-bottom: 1px solid #000000;
        }
        
        .modal-header h2 {
          margin: 0;
          color: #000000;
          line-height: 1;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #000000;
        }
        
        .missing-report-form {
          padding: 10px;
        }
        
        .form-section {
          margin-bottom: 0px;
        }
        
        .form-section h3 {
          color: #000000;
          margin-bottom: 10px;
          font-size: 1.5rem;
        }
        
        .form-row {
          display: flex;
          gap: 10px;
        }
        
        .form-group {
          margin-bottom: 10px;
          flex: 1;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          line-height: 1;
          font-weight: bold;
        }
        
        .form-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #000000;
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 1);
          color: #000000;
          box-sizing: border-box;
        }
        
        .form-input.readonly {
          background-color: #000000;
          color: #CCCCCC;
        }
        
        .error {
          color: #ff0000;
          font-size: 14px;
          margin-top: 5px;
          display: block;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        
        .btn-primary, .btn-secondary {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .btn-primary {
          background-color: #000000;
          color: #FFFFFF;
        }
        
        .btn-secondary {
          background-color: #FFFFFF;
          color: #000000;
          border: 1px solid #000000;
        }
        
        .btn-primary:disabled, .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        small {
          display: block;
          margin-top: 5px;
          color: #999999;
          font-size: 12px;
        }
        
        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
            gap: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default MissingReportForm;