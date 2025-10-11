// src/app/components/RechazoForm.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Props {
  profile: { role: string | null };
  initialData?: { OLPN: string; DN: string; Unidades: number; Local: string; Fecha: string; };
  onComplete?: () => void;
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

export default function RechazoForm({ 
  profile, 
  initialData,
  onComplete
}: Props) {
  const [rechazoData, setRechazoData] = useState<RechazoData>(() => {
    if (initialData) {
      return {
        tipo_rechazo: '',
        mes: new Date().toISOString().substring(0, 7) + '-01',
        fecha: new Date().toISOString().substring(0, 10),
        hora: new Date().toTimeString().substring(0, 5),
        folio: initialData.OLPN,
        oc: initialData.DN,
        nombre_local: initialData.Local,
        tipo_local: '',
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
    return {
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
    };
  });
  
  const [locales, setLocales] = useState<{nombre_local: string, tipo_local: string}[]>([]);
  const [filteredLocales, setFilteredLocales] = useState<{nombre_local: string, tipo_local: string}[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialData?.Local || '');
  const [showLocalesList, setShowLocalesList] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [generatedTicketId, setGeneratedTicketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStoreUser = ['Store Operator', 'Store Supervisor'].includes(profile.role || '');

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
        
        if (initialData && data) {
          const matchingLocal = data.find(local => local.nombre_local === initialData.Local);
          if (matchingLocal) {
            setRechazoData(prevData => ({
              ...prevData,
              tipo_local: matchingLocal.tipo_local
            }));
            setSearchTerm(initialData.Local);
          }
        }
      }
    };
    
    fetchLocales();
  }, [initialData]);

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

  const handleLocaleSelect = (local: {nombre_local: string, tipo_local: string}) => {
    setRechazoData({
      ...rechazoData,
      nombre_local: local.nombre_local,
      tipo_local: local.tipo_local
    });
    setSearchTerm(local.nombre_local);
    setShowLocalesList(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
        setError('Por favor, seleccione un archivo JPG válido.');
        return;
      }
      
      setRechazoData({ ...rechazoData, foto_rechazado: file });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log('Starting rechazo submission...');
    
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error("No se pudo obtener la sesión del usuario. Por favor, inicie sesión de nuevo.");
      }

      console.log('Generating ticket ID via RPC...');
      const { data: ticketId, error: ticketIdError } = await supabase.rpc('get_next_ticket_id', { p_prefix: 'REC' });

      if (ticketIdError) {
        console.error('Error generating ticket ID via RPC:', ticketIdError);
        throw new Error(`Failed to generate ticket ID: ${ticketIdError.message}`);
      }
      console.log('Ticket ID generated:', ticketId);
      setGeneratedTicketId(ticketId);

      const finalData = {
        ticket_id: ticketId,
        ...rechazoData,
        responsabilidad: rechazoData.responsabilidad || null,
        responsabilidad_area: rechazoData.responsabilidad_area || null,
        cliente_final: rechazoData.cliente_final || rechazoData.nombre_local,
        created_by_user_id: currentSession.user.id,
        created_by_user_name: currentSession.user.user_metadata?.full_name || currentSession.user.email
      };
      
      console.log('Final data prepared:', finalData);
      
      let imageUrl = null;
      if (rechazoData.foto_rechazado) {
        console.log('Uploading image...');
        const fileExt = rechazoData.foto_rechazado.name.split('.').pop();
        const fileName = `${currentSession.user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('rechazos-fotos')
          .upload(fileName, rechazoData.foto_rechazado);
          
        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Error al subir la imagen: ${uploadError.message}`);
        }
        
        const { data } = supabase.storage
          .from('rechazos-fotos')
          .getPublicUrl(fileName);
        imageUrl = data.publicUrl;
        console.log('Image uploaded. Public URL:', imageUrl);
      }
      
      console.log('Saving to database...');
      const { data, error } = await supabase
        .from('rechazos')
        .insert({ ...finalData, foto_rechazado: imageUrl })
        .select()
        .single();
      
      if (error) {
        console.error('Database error:', error);
        throw new Error(`Error al guardar en la base de datos: ${error.message}`);
      }
      
      console.log('Saved to database:', data);
      toast.success(`Rechazo ${ticketId} guardado exitosamente`);
      
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
      
      if (onComplete) {
        onComplete();
      }
    } catch (err: unknown) {
      console.error('Error in handleSubmit:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const closeConfirmation = () => {
    setShowConfirmation(false);
    setGeneratedTicketId('');
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

  const formatMonthInSpanish = (dateString: string) => {
    const date = new Date(dateString);
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {showConfirmation && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '10px', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', zIndex: 1000, textAlign: 'center' }}>
          <h3>Su Ticket es</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--clr6))' }}>{generatedTicketId}</p>
          <button onClick={closeConfirmation} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '(var(--clr4))', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cerrar</button>
        </div>
      )}
      {showConfirmation && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 999 }} onClick={closeConfirmation} />}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tipo de Rechazo *</label>
            <select name="tipo_rechazo" value={rechazoData.tipo_rechazo} onChange={handleChange} required style={{ width: '100%', padding: '8px', border: '1px solid var(--clr2)', borderRadius: '4px' }}>
              <option value="">Seleccione tipo</option>
              <option value="Completo">Completo</option>
              <option value="Parcial">Parcial</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mes *</label>
            <input type="text" value={formatMonthInSpanish(rechazoData.mes)} readOnly style={{ width: '100%', padding: '8px', border: '1px solid var(--clr2)', borderRadius: '4px', backgroundColor: '#f5f5f5' }} />
            <input type="date" name="mes" value={rechazoData.mes} onChange={handleChange} required style={{ display: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fecha *</label>
            <input type="date" name="fecha" value={rechazoData.fecha} onChange={handleChange} required style={{ width: '100%', padding: '8px', border: '1px solid var(--clr2)', borderRadius: '4px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Hora *</label>
            <input type="time" name="hora" value={rechazoData.hora} onChange={handleChange} required style={{ width: '100%', padding: '8px', border: '1px solid var(--clr2)', borderRadius: '4px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Folio Referencia *</label>
            <input type="text" name="folio" value={rechazoData.folio} onChange={handleChange} required style={{ width: '100%', padding: '8px', border: '1px solid var(--clr2)', borderRadius: '4px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{isStoreUser ? 'Guía de Despacho' : 'Orden de Compra'} *</label>
            <input type="text" name="oc" value={rechazoData.oc} onChange={handleChange} required style={{ width: '100%', padding: '8px', border: '1px solid var(--clr2)', borderRadius: '4px' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cliente *</label>
            <div style={{ position: 'relative' }}>
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => setShowLocalesList(true)} placeholder="Buscar cliente..." style={{ width: '100%', padding: '8px', border: '1px solid var(--clr2)', borderRadius: '4px' }} />
              {showLocalesList && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '200px', overflowY: 'auto', backgroundColor: 'white', border: '1px solid var(--clr2)', borderRadius: '4px', zIndex: 100 }}>
                  {filteredLocales.map((local) => (
                    <div key={local.nombre_local} onClick={() => handleLocaleSelect(local)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid var(--clr2)' }} onMouseDown={(e) => e.preventDefault()}>
                      {local.nombre_local} ({local.tipo_local})
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input type="hidden" name="nombre_local" value={rechazoData.nombre_local} required />
          </div>
          {profile.role === 'Administrador' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cliente Final</label>
              <input type="text" name="cliente_final" value={rechazoData.cliente_final} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid var(--clr2)', borderRadius: '4px' }} />
            </div>
          )}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Motivo *</label>
            <textarea name="motivo" value={rechazoData.motivo} onChange={handleChange} required rows={4} style={{ width: '100%', padding: '8px', border: '1px solid var(--clr2)', borderRadius: '4px' }} />
          </div>
          {profile.role === 'Administrador' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Responsabilidad Directa</label>
                <select name="responsabilidad" value={rechazoData.responsabilidad} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid var(--clr2)', borderRadius: '4px' }}>
                  <option value="">Seleccione responsabilidad</option>
                  <option value="Customer">Customer</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Cliente">Cliente</option>
                  <option value="CD">CD</option>
                </select>
              </div>
              {rechazoData.responsabilidad === 'CD' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Responsabilidad por Área</label>
                  <select name="responsabilidad_area" value={rechazoData.responsabilidad_area} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid var(--clr2)', borderRadius: '4px' }}>
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
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Unidades Rechazadas</label>
            <input type="number" name="unidades_rechazadas" value={rechazoData.unidades_rechazadas || ''} onChange={handleChange} min="0" style={{ width: '100%', padding: '8px', border: '1px solid var(--clr2)', borderRadius: '4px' }} />
          </div>
          {profile.role === 'Administrador' && (
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Unidades Totales</label>
              <input type="number" name="unidades_totales" value={rechazoData.unidades_totales || ''} onChange={handleChange} min="0" style={{ width: '100%', padding: '8px', border: '1px solid var(--clr4))', borderRadius: '4px', backgroundColor: 'var(--clr1))', color: 'var(--clr4))' }} />
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bultos Rechazados</label>
            <input type="number" name="bultos_rechazados" value={rechazoData.bultos_rechazados || ''} onChange={handleChange} min="0" style={{ width: '100%', padding: '8px', border: '1px solid var(--clr2)', borderRadius: '4px' }} />
          </div>
          {profile.role === 'Administrador' && (
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bultos Totales</label>
              <input type="number" name="bultos_totales" value={rechazoData.bultos_totales || ''} onChange={handleChange} min="0" style={{ width: '100%', padding: '8px', border: '1px solid var(--clr4))', borderRadius: '4px', backgroundColor: 'var(--clr1))', color: 'var(--clr4))' }} />
            </div>
          )}
          {profile.role === 'Administrador' && (
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Transporte</label>
              <input type="text" name="transporte" value={rechazoData.transporte} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid var(--clr4))', borderRadius: '4px', backgroundColor: 'var(--clr1))', color: 'var(--clr4))' }} />
            </div>
          )}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Foto (JPG)</label>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg, image/jpg" style={{ width: '100%', padding: '8px', border: '1px solid var(--clr4))', borderRadius: '4px', backgroundColor: 'var(--clr1))', color: 'var(--clr4))' }} />
            {fotoPreview && (
              <div style={{ marginTop: '10px' }}>
                <Image src={fotoPreview} alt="Preview" width={200} height={200} style={{ maxWidth: '200px', maxHeight: '200px', border: '1px solid var(--clr4))' }} />
              </div>
            )}
          </div>
        </div>
        {error && <div style={{ color: 'var(--clr6))', margin: '10px 0' }}>{error}</div>}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button type="submit" disabled={loading} style={{ padding: '12px 30px', backgroundColor: 'var(--clr4))', color: 'var(--clr1))', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px' }}>{loading ? 'Guardando...' : 'Guardar Rechazo'}</button>
          <button type="button" onClick={() => { setRechazoData({ tipo_rechazo: '', mes: new Date().toISOString().substring(0, 7) + '-01', fecha: new Date().toISOString().substring(0, 10), hora: new Date().toTimeString().substring(0, 5), folio: '', oc: '', nombre_local: '', tipo_local: '', cliente_final: '', motivo: '', responsabilidad: '', responsabilidad_area: '', unidades_rechazadas: null, unidades_totales: null, bultos_rechazados: null, bultos_totales: null, transporte: '', foto_rechazado: null }); setFotoPreview(null); setSearchTerm(''); if (fileInputRef.current) { fileInputRef.current.value = ''; } }} style={{ marginLeft: '10px', padding: '12px 30px', backgroundColor: 'var(--clr1))', color: 'var(--clr4))', border: '1px solid var(--clr4))', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
