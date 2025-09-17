// src/app/components/TicketTypes.ts

export interface FaltanteTicket {
  id: number;
  ticket_id: string;
  olpn: string;
  delivery_note: string;
  tipo_reporte: 'Faltante' | 'Sobrante';
  nombre_local: string;
  tipo_local: string;
  fecha: string;
  factura?: string;
  detalle_producto?: string;
  talla?: string;
  cantidad?: number;
  peso_olpn?: string;
  detalle_bulto_estado?: string;
  foto_olpn?: string;
  foto_bulto?: string;
  created_at: string;
  created_by_user_id: string;
  created_by_user_name: string;
  updated_at?: string;
  updated_by_user_id?: string;
  updated_by_user_name?: string;
  // Campos adicionales para manejar múltiples productos
  productos?: FaltanteProducto[];
}

export interface FaltanteProducto {
  id: number;
  detalle_producto?: string;
  talla?: string;
  cantidad?: number;
}

export interface RechazoTicket {
  id: number;
  ticket_id: string;
  tipo_rechazo: string;
  ruta: string;
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
  unidades_rechazadas: number;
  unidades_totales: number;
  bultos_rechazados: number;
  bultos_totales: number;
  transporte: string;
  foto_rechazado: string | null;
  gestionado: boolean;
  created_at: string;
  created_by_user_id: string;
  created_by_user_name: string;
  updated_at: string;
  updated_by_user_id: string;
  updated_by_user_name: string;
}

export type Ticket = FaltanteTicket | RechazoTicket;