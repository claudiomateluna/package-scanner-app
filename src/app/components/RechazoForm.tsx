// src/app/components/RechazoForm.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface Props {
  session: Session;
  profile: { role: string | null };
  initialData?: { OLPN: string; DN: string; Unidades: number; Local: string; Fecha: string; };
}

interface RechazoData {
  tipo_rechazo: string;
  mes: string;
  fecha: string;
  hora: string;
  folio: string;
  oc: string;
  nombre_local: string;
  tipo_local: string;
  cliente_final: string;
  motivo: string;
  responsabilidad: string;
  responsabilidad_area: string;
  unidades_rechazadas: number | null;
  unidades_totales: number | null;
  bultos_rechazados: number | null;
  bultos_totales: number | null;
  transporte: string;
  foto_rechazado: File | null;
}

export default function RechazoForm({ session, profile, initialData }: Props) {
  const [rechazoData, setRechazoData] = useState<RechazoData>(() => {
    // If initialData is provided, pre-populate the form
    if (initialData) {
      return {
        tipo_rechazo: '',
        mes: new Date().toISOString().substring(0, 7) + '-01', // First day of current month
        fecha: new Date().toISOString().substring(0, 10), // YYYY-MM-DD
        hora: new Date().toTimeString().substring(0, 5), // HH:MM
        folio: initialData.OLPN,
        oc: initialData.DN,
        nombre_local: initialData.Local,
        tipo_local: '', // Will be populated when local is selected
        cliente_final: '',
        motivo: '',
        responsabilidad: '',
        responsabilidad_area: '',
        unidades_rechazadas: initialData.Unidades,
        unidades_totales: null,
        bultos_rechazados: null,
        bultos_totales: null,
        transporte: '',
        foto_rechazado: null
      };
    }
    
    // Default empty form
    return {
      tipo_rechazo: '',
      mes: new Date().toISOString().substring(0, 7) + '-01', // First day of current month
      fecha: new Date().toISOString().substring(0, 10), // YYYY-MM-DD
      hora: new Date().toTimeString().substring(0, 5), // HH:MM
      folio: '',
      oc: '',
      nombre_local: '',
      tipo_local: '',
      cliente_final: '',
      motivo: '',
      responsabilidad: '',
      responsabilidad_area: '',
      unidades_rechazadas: null,
      unidades_totales: null,
      bultos_rechazados: null,
      bultos_totales: null,
      transporte: '',
      foto_rechazado: null
    };
  });
  
  const [locales, setLocales] = useState<{nombre_local: string, tipo_local: string}[]>([]);
  const [filteredLocales, setFilteredLocales] = useState<{nombre_local: string, tipo_local: string}[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialData?.Local || ''); // Pre-populate searchTerm if initialData is provided
  const [showLocalesList, setShowLocalesList] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is Store Operator or Store Supervisor
  const isStoreUser = ['Store Operator', 'Store Supervisor'].includes(profile.role || '');

  // Fetch locales for the dropdown
  useEffect(() => {
    const fetchLocales = async () => {
      const { data, error } = await supabase
        .from('locales')
        .select('nombre_local, tipo_local')
        .order('nombre_local');
      
      if (error) {
        console.error('Error fetching locales:', error);
      } else {
        setLocales(data || []);
        setFilteredLocales(data || []);
        
        // If initialData is provided, find the matching local and set tipo_local
        if (initialData && data) {
          const matchingLocal = data.find(local => local.nombre_local === initialData.Local);
          if (matchingLocal) {
            setRechazoData(prevData => ({
              ...prevData,
              tipo_local: matchingLocal.tipo_local
            }));
            // Also update the searchTerm to show the local name in the search box
            setSearchTerm(initialData.Local);
          }
        }
      }
    };
    
    fetchLocales();
  }, [initialData]);

  // Filter locales based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = locales.filter(local => 
        local.nombre_local.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLocales(filtered);
    } else {
      setFilteredLocales(locales);
    }
  }, [searchTerm, locales]);

  // Handle locale selection
  const handleLocaleSelect = (local: {nombre_local: string, tipo_local: string}) => {
    setRechazoData({
      ...rechazoData,
      nombre_local: local.nombre_local,
      tipo_local: local.tipo_local
    });
    setSearchTerm(local.nombre_local);
    setShowLocalesList(false);
  };

  // Handle file change for foto_rechazado
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
        setError('Por favor, seleccione un archivo JPG válido.');
        return;
      }
      
      setRechazoData({ ...rechazoData, foto_rechazado: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for responsabilidad_area based on responsabilidad
    if (name === 'responsabilidad') {
      setRechazoData({
        ...rechazoData,
        responsabilidad: value,
        responsabilidad_area: ['Customer', 'Transporte', 'Cliente'].includes(value) ? value : ''
      });
    } else {
      setRechazoData({ ...rechazoData, [name]: value });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Generate ticket ID
      const ticketResponse = await fetch('/api/rechazos/ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!ticketResponse.ok) {
        throw new Error('Failed to generate ticket ID');
      }
      
      const { ticketId } = await ticketResponse.json();
      
      // Auto-fill cliente_final if empty
      const finalData = {
        ticket_id: ticketId,
        ...rechazoData,
        cliente_final: rechazoData.cliente_final || rechazoData.nombre_local,
        created_by_user_id: session.user.id,
        created_by_user_name: session.user.user_metadata?.full_name || session.user.email
      };
      
      // Upload image if provided
      let imageUrl = null;
      if (rechazoData.foto_rechazado) {
        const fileExt = rechazoData.foto_rechazado.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('rechazos-fotos')
          .upload(fileName, rechazoData.foto_rechazado);
          
        if (uploadError) {
          throw new Error(`Error uploading image: ${uploadError.message}`);
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('rechazos-fotos')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrl;
      }
      
      // Save to database
      const { data, error } = await supabase
        .from('rechazos')
        .insert([
          {
            ...finalData,
            foto_rechazado: imageUrl
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Get the ticket ID from the response
      if (data && data[0]) {
        setTicketId(data[0].ticket_id);
        setShowConfirmation(true);
      }
    } catch (err) {
      console.error('Error saving rechazo:', err);
      setError('Error al guardar el rechazo. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Close confirmation modal
  const closeConfirmation = () => {
    setShowConfirmation(false);
    // Reset form
    setRechazoData({
      tipo_rechazo: '',
      mes: new Date().toISOString().substring(0, 7) + '-01',
      fecha: new Date().toISOString().substring(0, 10),
      hora: new Date().toTimeString().substring(0, 5),
      folio: '',
      oc: '',
      nombre_local: '',
      tipo_local: '',
      cliente_final: '',
      motivo: '',
      responsabilidad: '',
      responsabilidad_area: '',
      unidades_rechazadas: null,
      unidades_totales: null,
      bultos_rechazados: null,
      bultos_totales: null,
      transporte: '',
      foto_rechazado: null
    });
    setFotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format month in Spanish
  const formatMonthInSpanish = (dateString: string) => {
    const date = new Date(dateString);
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: '#233D4D', marginBottom: '20px' }}>Formulario de Rechazo</h2>
      
      {showConfirmation ? (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          textAlign: 'center'
        }}>
          <h3>Su Ticket es</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#FE7F2D' }}>{ticketId}</p>
          <button 
            onClick={closeConfirmation}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#FE7F2D',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cerrar
          </button>
        </div>
      ) : null}
      
      {showConfirmation ? (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={closeConfirmation}
        />
      ) : null}
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Tipo de Rechazo */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Tipo de Rechazo *
            </label>
            <select
              name="tipo_rechazo"
              value={rechazoData.tipo_rechazo}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">Seleccione tipo</option>
              <option value="Completo">Completo</option>
              <option value="Parcial">Parcial</option>
            </select>
          </div>
          
          {/* Mes */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Mes *
            </label>
            <input
              type="text"
              value={formatMonthInSpanish(rechazoData.mes)}
              readOnly
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5'
              }}
            />
            <input
              type="date"
              name="mes"
              value={rechazoData.mes}
              onChange={handleChange}
              required
              style={{ display: 'none' }}
            />
          </div>
          
          {/* Fecha */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Fecha *
            </label>
            <input
              type="date"
              name="fecha"
              value={rechazoData.fecha}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          {/* Hora */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Hora *
            </label>
            <input
              type="time"
              name="hora"
              value={rechazoData.hora}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          {/* Folio Referencia */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Folio Referencia *
            </label>
            <input
              type="text"
              name="folio"
              value={rechazoData.folio}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          {/* Orden de Compra / Guía de Despacho */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              {isStoreUser ? 'Guía de Despacho' : 'Orden de Compra'} *
            </label>
            <input
              type="text"
              name="oc"
              value={rechazoData.oc}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          {/* Cliente (nombre_local) */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Cliente *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowLocalesList(true)}
                placeholder="Buscar cliente..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              {showLocalesList && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    zIndex: 100
                  }}
                >
                  {filteredLocales.map((local) => (
                    <div
                      key={local.nombre_local}
                      onClick={() => handleLocaleSelect(local)}
                      style={{
                        padding: '10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee'
                      }}
                      onMouseDown={(e) => e.preventDefault()} // Prevent blur
                    >
                      {local.nombre_local} ({local.tipo_local})
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              type="hidden"
              name="nombre_local"
              value={rechazoData.nombre_local}
              required
            />
          </div>
          
          {/* Cliente Final (solo para administradores) */}
          {profile.role === 'Administrador' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Cliente Final
              </label>
              <input
                type="text"
                name="cliente_final"
                value={rechazoData.cliente_final}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
          )}
          
          {/* Motivo */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Motivo *
            </label>
            <textarea
              name="motivo"
              value={rechazoData.motivo}
              onChange={handleChange}
              required
              rows={4}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          {/* Responsabilidad (solo para administradores) */}
          {profile.role === 'Administrador' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Responsabilidad Directa
                </label>
                <select
                  name="responsabilidad"
                  value={rechazoData.responsabilidad}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">Seleccione responsabilidad</option>
                  <option value="Customer">Customer</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Cliente">Cliente</option>
                  <option value="CD">CD</option>
                </select>
              </div>
              
              {/* Responsabilidad por Área (solo si responsabilidad es CD) */}
              {rechazoData.responsabilidad === 'CD' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Responsabilidad por Área
                  </label>
                  <select
                    name="responsabilidad_area"
                    value={rechazoData.responsabilidad_area}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">Seleccione área</option>
                    <option value="Shipping">Shipping</option>
                    <option value="QA">QA</option>
                    <option value="Planning">Planning</option>
                    <option value="Picking">Picking</option>
                    <option value="VAS">VAS</option>
                    <option value="Consolidación">Consolidación</option>
                  </select>
                </div>
              )}
            </>
          )}
          
          {/* Unidades Rechazadas */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Unidades Rechazadas
            </label>
            <input
              type="number"
              name="unidades_rechazadas"
              value={rechazoData.unidades_rechazadas || ''}
              onChange={handleChange}
              min="0"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          {/* Unidades Totales (solo para administradores) */}
          {profile.role === 'Administrador' && (
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Unidades Totales
              </label>
              <input
                type="number"
                name="unidades_totales"
                value={rechazoData.unidades_totales || ''}
                onChange={handleChange}
                min="0"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
          )}
          
          {/* Bultos Rechazados */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Bultos Rechazados
            </label>
            <input
              type="number"
              name="bultos_rechazados"
              value={rechazoData.bultos_rechazados || ''}
              onChange={handleChange}
              min="0"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          {/* Bultos Totales (solo para administradores) */}
          {profile.role === 'Administrador' && (
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Bultos Totales
              </label>
              <input
                type="number"
                name="bultos_totales"
                value={rechazoData.bultos_totales || ''}
                onChange={handleChange}
                min="0"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
          )}
          
          {/* Transporte (solo para administradores) */}
          {profile.role === 'Administrador' && (
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Transporte
              </label>
              <input
                type="text"
                name="transporte"
                value={rechazoData.transporte}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
          )}
          
          {/* Foto */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Foto (JPG)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg, image/jpg"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            {fotoPreview && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={fotoPreview} 
                  alt="Preview" 
                  style={{ maxWidth: '200px', maxHeight: '200px', border: '1px solid #ccc' }}
                />
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <div style={{ color: 'red', margin: '10px 0' }}>
            {error}
          </div>
        )}
        
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 30px',
              backgroundColor: '#FE7F2D',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {loading ? 'Guardando...' : 'Guardar Rechazo'}
          </button>
          <button
            type="button"
            onClick={() => {
              // Reset form
              setRechazoData({
                tipo_rechazo: '',
                mes: new Date().toISOString().substring(0, 7) + '-01',
                fecha: new Date().toISOString().substring(0, 10),
                hora: new Date().toTimeString().substring(0, 5),
                folio: '',
                oc: '',
                nombre_local: '',
                tipo_local: '',
                cliente_final: '',
                motivo: '',
                responsabilidad: '',
                responsabilidad_area: '',
                unidades_rechazadas: null,
                unidades_totales: null,
                bultos_rechazados: null,
                bultos_totales: null,
                transporte: '',
                foto_rechazado: null
              });
              setFotoPreview(null);
              setSearchTerm('');
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            style={{
              marginLeft: '10px',
              padding: '12px 30px',
              backgroundColor: '#ccc',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}