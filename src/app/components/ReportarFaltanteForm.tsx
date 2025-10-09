// ReportarFaltanteForm.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

// Define types
interface LocalData {
  id: number;
  tipo_local: 'FRA' | 'RTL' | 'SKA' | 'WHS';
  nombre_local: string;
}

interface ProductItem {
  detalle_producto?: string;
  talla?: string;
  cantidad?: number;
}

interface MissingReport {
  olpn: string;
  delivery_note: string;
  tipo_reporte: 'Faltante' | 'Sobrante' | '';
  nombre_local: string;
  tipo_local: 'FRA' | 'RTL' | 'SKA' | 'WHS';
  fecha: string;
  factura?: string;
  productos: ProductItem[];
  peso_olpn?: string;
  detalle_bulto_estado?: 'Caja abierta antes de la recepción' | 'Caja dañada en el transporte' | 'Caja perdida en el transporte' | 'Cinta adulterada';
  foto_olpn?: File | null;
  foto_bulto?: File | null;
}

interface Props {
  session: Session;
  onClose: () => void;
  onReportSaved: () => void;
}

// Define a custom window interface
interface CustomWindow extends Window {
  existingFotoOlpnUrl?: string;
  existingFotoBultoUrl?: string;
}

const ReportarFaltanteForm = ({ session, onClose, onReportSaved }: Props) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _session = session;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Limpiar las variables globales
      const customWindow = window as unknown as CustomWindow;
      delete customWindow.existingFotoOlpnUrl;
      delete customWindow.existingFotoBultoUrl;
    };
  }, []);

  const [localData, setLocalData] = useState<LocalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<MissingReport>({
    olpn: '',
    delivery_note: '',
    tipo_reporte: '',
    nombre_local: '',
    tipo_local: 'RTL',
    fecha: new Date().toISOString().split('T')[0], // Today's date
    factura: '',
    productos: [{ detalle_producto: '', talla: '', cantidad: undefined }],
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

  // Fetch local data
  useEffect(() => {
    const fetchLocales = async () => {
      try {
        const { data, error } = await supabase
          .from('locales')
          .select('*')
          .order('nombre_local');
        
        if (error) throw error;
        
        setLocalData(data || []);
      } catch (error) {
        console.error('Error fetching locales:', error);
        toast.error('Error al cargar locales');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocales();
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for local selection
    if (name === 'nombre_local') {
      const selectedLocal = localData.find(local => local.nombre_local === value);
      setFormData(prev => ({
        ...prev,
        nombre_local: value,
        tipo_local: selectedLocal ? selectedLocal.tipo_local : 'RTL'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
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

  // Handle product changes
  const handleProductChange = (index: number, field: keyof ProductItem, value: string | number | undefined) => {
    setFormData(prev => {
      const newProductos = [...prev.productos];
      newProductos[index] = {
        ...newProductos[index],
        [field]: value
      };
      return {
        ...prev,
        productos: newProductos
      };
    });
  };

  // Add a new product
  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      productos: [...prev.productos, { detalle_producto: '', talla: '', cantidad: undefined }]
    }));
  };

  // Remove a product
  const removeProduct = (index: number) => {
    if (formData.productos.length <= 1) {
      toast.error('Debe haber al menos un producto');
      return;
    }
    
    setFormData(prev => {
      const newProductos = [...prev.productos];
      newProductos.splice(index, 1);
      return {
        ...prev,
        productos: newProductos
      };
    });
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
    
    // Validate each product
    for (let i = 0; i < formData.productos.length; i++) {
      const producto = formData.productos[i];
      if (!producto.detalle_producto && !producto.talla && !producto.cantidad) {
        // If all fields are empty, it's an empty product - skip validation
        continue;
      }
      
      // If any field is filled, all fields must be filled
      if (!producto.detalle_producto) {
        newErrors[`detalle_producto_${i}`] = 'Detalle del producto es obligatorio';
      }
      if (!producto.talla) {
        newErrors[`talla_${i}`] = 'Talla es obligatoria';
      }
      if (producto.cantidad === undefined || producto.cantidad <= 0) {
        newErrors[`cantidad_${i}`] = 'Cantidad es obligatoria y debe ser mayor a 0';
      }
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
      
      // Generate ticket ID (same for all products)
      const ticketId = await generateTicketId(formData.tipo_local);
      
      // Upload files
      let uploadedFiles: { foto_olpn_url?: string; foto_bulto_url?: string } | undefined;
      if (formData.foto_olpn || formData.foto_bulto) {
        console.log('Iniciando uploadFiles para creación con ticketId:', ticketId);
        uploadedFiles = await uploadFiles(ticketId);
        console.log('uploadFiles completado para creación, archivos subidos:', uploadedFiles);
      }
      
      // Insert all products
      const recordsToInsert = formData.productos.map((producto, index) => ({
        ticket_id: ticketId, // All records get the same ticket_id
        olpn: formData.olpn,
        delivery_note: formData.delivery_note,
        tipo_reporte: formData.tipo_reporte,
        nombre_local: formData.nombre_local,
        tipo_local: formData.tipo_local,
        fecha: formData.fecha,
        factura: formData.factura,
        detalle_producto: producto.detalle_producto || '',
        talla: producto.talla || '',
        cantidad: producto.cantidad || null,
        peso_olpn: formData.peso_olpn,
        detalle_bulto_estado: formData.detalle_bulto_estado,
        foto_olpn: index === 0 ? (uploadedFiles?.foto_olpn_url || null) : null, // Only first record gets the foto_olpn
        foto_bulto: index === 0 ? (uploadedFiles?.foto_bulto_url || null) : null, // Only first record gets the foto_bulto
        created_by_user_id: user.id,
        created_by_user_name: userName,
        updated_at: new Date().toISOString(),
        updated_by_user_id: user.id,
        updated_by_user_name: userName
      }));
      
      const { error: insertError } = await supabase
        .from('faltantes')
        .insert(recordsToInsert);
      
      if (insertError) {
        console.error('Error inserting report:', insertError);
        const errorMessage = insertError.message || 'Error desconocido al guardar el reporte';
        throw new Error(errorMessage);
      }
      
      toast.success('Reporte guardado exitosamente');
      onReportSaved();
      onClose();
    } catch (error) {
      console.error('Error saving report:', error);
      const errorMessage = (error as Error).message || 'Error desconocido al guardar el reporte';
      toast.error(`Error al guardar el reporte: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Get label based on local type
  const getLabel = (skaLabel: string, defaultLabel: string) => {
    return formData.tipo_local === 'SKA' ? skaLabel : defaultLabel;
  };

  // Check if field should be hidden for SKA
  const isHiddenForSKA = (fieldName: string) => {
    if (formData.tipo_local !== 'SKA') return false;
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
          <h2>Nuevo Reporte de Faltante/Sobrante</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="missing-report-form">
          {/* Section 1: Identification */}
          <div className="form-section">
            <h3>Identificación</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>{getLabel('Correlativo del B2B', 'OLPN')} *</label>
                <input
                  type="text"
                  name="olpn"
                  value={formData.olpn}
                  onChange={handleChange}
                  className="form-input"
                />
                {errors.olpn && <span className="error">{errors.olpn}</span>}
              </div>
              
              <div className="form-group">
                <label>{getLabel('OC', 'Delivery Note')} *</label>
                <input
                  type="text"
                  name="delivery_note"
                  value={formData.delivery_note}
                  onChange={handleChange}
                  className="form-input"
                />
                {errors.delivery_note && <span className="error">{errors.delivery_note}</span>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>{getLabel('SKA', 'Local')} *</label>
                <select
                  name="nombre_local"
                  value={formData.nombre_local}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Seleccionar local</option>
                  {localData.map((local) => (
                    <option key={local.id} value={local.nombre_local}>
                      {local.nombre_local}
                    </option>
                  ))}
                </select>
                {errors.nombre_local && <span className="error">{errors.nombre_local}</span>}
              </div>
              
              <div className="form-group">
                <label>{getLabel('Fecha', 'Fecha')} *</label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  className="form-input"
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
              
              {/* Productos repetibles */}
              {formData.productos.map((producto, index) => (
                <div key={index} className="product-group">
                  <div className="product-header">
                    <h4>Producto {index + 1}</h4>
                    {formData.productos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="remove-product-btn"
                        disabled={isSaving}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>{getLabel('Detalle del Producto', 'Detalle del Producto')}</label>
                    <input
                      type="text"
                      value={producto.detalle_producto || ''}
                      onChange={(e) => handleProductChange(index, 'detalle_producto', e.target.value)}
                      className="form-input"
                    />
                    {errors[`detalle_producto_${index}`] && <span className="error">{errors[`detalle_producto_${index}`]}</span>}
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>{getLabel('Talla', 'Talla')}</label>
                      <input
                        type="text"
                        value={producto.talla || ''}
                        onChange={(e) => handleProductChange(index, 'talla', e.target.value)}
                        className="form-input"
                      />
                      {errors[`talla_${index}`] && <span className="error">{errors[`talla_${index}`]}</span>}
                    </div>
                    
                    <div className="form-group">
                      <label>{getLabel('Cantidad', 'Cantidad')}</label>
                      <input
                        type="number"
                        value={producto.cantidad || ''}
                        onChange={(e) => handleProductChange(index, 'cantidad', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="form-input"
                        min="0"
                      />
                      {errors[`cantidad_${index}`] && <span className="error">{errors[`cantidad_${index}`]}</span>}
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addProduct}
                className="add-product-btn"
                disabled={isSaving}
              >
                + Agregar otro producto
              </button>
              
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
              {isSaving ? 'Guardando...' : 'Guardar'}
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
          background-color: var(--clr1);
          border-radius: 4px;
          max-width: 600px;
          width: 90%;
          max-height: 95vh;
          overflow-y: auto;
          color: var(--clr4);
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
          color: var(--clr4);
          line-height: 1;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--clr4);
        }
        
        .missing-report-form {
          padding: 10px;
        }
        
        .form-section {
          margin-bottom: 0px;
        }
        
        .form-section h3 {
          color: var(--clr4);
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
          border: 1px solid var(--clr4);
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 1);
          color: var(--clr4);
          box-sizing: border-box;
        }
        
        .form-input.readonly {
          background-color: var(--clr4);
          color: #CCCCCC;
        }
        
        .error {
          color: #ff0000;
          font-size: 14px;
          margin-top: 5px;
          display: block;
        }
        
        .product-group {
          border: 1px solid var(--clr4);
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 15px;
          background-color: #f9f9f9;
        }
        
        .product-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .product-header h4 {
          margin: 0;
          color: var(--clr4);
        }
        
        .remove-product-btn {
          background-color: #ff4444;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .remove-product-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .add-product-btn {
          background-color: var(--clr4);
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          margin-bottom: 20px;
        }
        
        .add-product-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
          background-color: var(--clr4);
          color: var(--clr1);
        }
        
        .btn-secondary {
          background-color: var(--clr1);
          color: var(--clr4);
          border: 1px solid var(--clr4);
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

export default ReportarFaltanteForm;