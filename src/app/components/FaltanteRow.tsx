import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { Session } from '@supabase/supabase-js';
import Image from 'next/image';
import ToggleSwitch from './ToggleSwitch';

// Define Faltante type matching the one in FaltantesAdminView
interface Faltante {
  id: number;
  ticket_id: string;
  olpn: string;
  delivery_note: string;
  tipo_reporte: string;
  nombre_local: string;
  tipo_local: string;
  fecha: string;
  factura: string | null;
  detalle_producto: string | null;
  talla: string | null;
  cantidad: number | null;
  peso_olpn: string | null;
  detalle_bulto_estado: string | null;
  foto_olpn: string | null;
  foto_bulto: string | null;
  created_at: string;
  created_by_user_name: string;
  updated_at: string | null;
  gestionado: boolean;
  responsabilidad: 'CD' | 'Asume Tienda' | 'Asume Transporte' | null;
  comentarios: string | null;
}

interface FaltanteRowProps {
  item: Faltante;
  session: Session; // Supabase session object
  profile: { role: string | null }; // User profile object
  onImageClick: (src: string) => void;
  onUpdate: (updatedItem: Faltante) => void;
}

export default function FaltanteRow({ item, session, profile, onImageClick, onUpdate }: FaltanteRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [responsabilidad, setResponsabilidad] = useState(item.responsabilidad);
  const [comentarios, setComentarios] = useState(item.comentarios);

  const getPublicUrl = (filePath: string | null) => {
    if (!filePath) return null;
    const { data } = supabase.storage.from('faltantes-attachments').getPublicUrl(filePath);
    console.log('Generated public URL:', data?.publicUrl);
    return data?.publicUrl;
  };

  const handleSave = async () => {
    const loadingToast = toast.loading('Guardando cambios...');
    const { data, error } = await supabase
      .from('faltantes')
      .update({
        responsabilidad,
        comentarios,
        updated_at: new Date().toISOString(),
        updated_by_user_id: session.user.id,
        updated_by_user_name: profile.role, // Simplified
      })
      .eq('id', item.id)
      .select()
      .single();
    
    toast.dismiss(loadingToast);

    if (error) {
      toast.error('Error al guardar: ' + error.message);
    } else {
      toast.success('Cambios guardados.');
      onUpdate(data as Faltante);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setResponsabilidad(item.responsabilidad);
    setComentarios(item.comentarios);
    setIsEditing(false);
  };

  const handleGestionadoChange = async (newGestionado: boolean) => {
    const { data, error } = await supabase
      .from('faltantes')
      .update({ 
        gestionado: newGestionado,
        gestionado_at: newGestionado ? new Date().toISOString() : null,
        gestionado_by_user_id: newGestionado ? session.user.id : null,
        gestionado_by_user_name: profile.role, // Simplified
      })
      .eq('id', item.id)
      .select()
      .single();

    if (error) {
      toast.error('Error al actualizar el estado.');
    } else {
      onUpdate(data as Faltante);
    }
  };

  const tdStyle = { padding: '5px', border: '1px solid var(--color-border)', verticalAlign: 'middle' };

  return (
    <tr>
      <td style={tdStyle}>{item.ticket_id}</td>
      <td style={tdStyle}>{item.olpn}</td>
      <td style={tdStyle}>{item.delivery_note}</td>
      <td style={tdStyle}>{item.tipo_reporte}</td>
      <td style={tdStyle}>{item.nombre_local}</td>
      <td style={tdStyle}>{item.tipo_local}</td>
      <td style={tdStyle}>{new Date(item.fecha).toLocaleDateString()}</td>
      <td style={tdStyle}>{item.factura || '-'}</td>
      <td style={tdStyle}>{item.detalle_producto || '-'}</td>
      <td style={tdStyle}>{item.talla || '-'}</td>
      <td style={tdStyle}>{item.cantidad}</td>
      <td style={tdStyle}>{item.peso_olpn || '-'}</td>
      <td style={tdStyle}>{item.detalle_bulto_estado || '-'}</td>
      <td style={tdStyle}>
        {item.foto_olpn && <Image src={getPublicUrl(item.foto_olpn)!} alt="Foto OLPN" width={50} height={50} style={{ cursor: 'pointer', objectFit: 'cover' }} onClick={() => onImageClick(getPublicUrl(item.foto_olpn!)!)} />}
      </td>
      <td style={tdStyle}>
        {item.foto_bulto && <Image src={getPublicUrl(item.foto_bulto)!} alt="Foto Bulto" width={50} height={50} style={{ cursor: 'pointer', objectFit: 'cover' }} onClick={() => onImageClick(getPublicUrl(item.foto_bulto!)!)} />}
      </td>
      <td style={tdStyle}>{item.created_by_user_name}</td>
      <td style={tdStyle}>{new Date(item.created_at).toLocaleString()}</td>
      <td style={tdStyle}>{item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'}</td>
      <td style={tdStyle}>
        {isEditing ? (
          <select value={responsabilidad || ''} onChange={(e) => setResponsabilidad(e.target.value as Faltante['responsabilidad'])}>
            <option value="">Seleccionar...</option>
            <option value="CD">CD</option>
            <option value="Asume Tienda">Asume Tienda</option>
            <option value="Asume Transporte">Asume Transporte</option>
          </select>
        ) : (
          item.responsabilidad || '-'
        )}
      </td>
      <td style={tdStyle}>
        <ToggleSwitch checked={item.gestionado} onChange={handleGestionadoChange} />
      </td>
      <td style={tdStyle}>
        {isEditing ? (
          <textarea 
            value={comentarios || ''} 
            onChange={(e) => setComentarios(e.target.value)} 
            rows={3} 
            style={{ width: '100%' }}
          />
        ) : (
          item.comentarios || '-'
        )}
      </td>
      <td style={tdStyle}>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={handleSave} style={{padding:'10px 12px', background:'#000', color:'white', borderRadius: '4px', border:'1px solid #000'}}>Guardar</button>
            <button onClick={handleCancel} style={{padding:'10px 12px', background:'#FFF', color:'#000', borderRadius: '4px', border:'1px solid #000'}}>Cancelar</button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} style={{padding:'10px 12px', background:'#000', color:'white', borderRadius: '4px', border:'none'}}>Editar</button>
        )}
      </td>
    </tr>
  );
}
