// ─── Usuario ──────────────────────────────────────────────────────────────
export type Rol = 'FUNCIONARIO' | 'ENCARGADO' | 'ADMIN';
export type EstadoUsuario = 'ACTIVO' | 'PENDIENTE_ASIGNACION' | 'INACTIVO';
export type Provider = 'CIUDADANIA_DIGITAL' | 'GOOGLE';

export interface Usuario {
  id: string;
  correo: string | null;
  nombre_completo: string | null;
  foto_url: string | null;
  documento_identidad: string | null;
  celular: string | null;
  area: string | null;
  rol: Rol;
  estado: EstadoUsuario;
  provider: Provider;
  provider_sub: string;
  created_at: string;
  updated_at: string;
}

export interface PerfilMinimo {
  id: string;
  nombre_completo: string | null;
  correo: string | null;
  area: string | null;
  rol: Rol;
  estado: EstadoUsuario;
}

export interface LoginResponse {
  access_token: string;
  perfil: PerfilMinimo;
}

// ─── Documentos ──────────────────────────────────────────────────────────
export type EstadoDocumento = 'BORRADOR' | 'BORRADOR_APROBADO' | 'PENDIENTE_SUBIDA' | 'PDF_SUBIDO' | 'EN_FLUJO';

export interface TipoDocumento {
  id: string;
  nombre: string;
  plantilla_path: string | null;
  created_at: string;
}

export interface Documento {
  id: string;
  hoja_ruta_id: string | null;
  tipo_documento: TipoDocumento;
  nombre_archivo: string;
  archivo_path: string | null;
  archivo_word_path: string | null;
  observaciones_rechazo: string | null;
  qr_id: string | null;
  site_generado: string | null;
  estado: EstadoDocumento;
  creado_por: string;
  creado_por_nombre?: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Plataforma ──────────────────────────────────────────────────────────
export type EstadoHojaRuta = 'ABIERTA' | 'EN_PROCESO' | 'CERRADA' | 'ARCHIVADA';
export type EstadoDerivacion = 'PENDIENTE_APROBACION' | 'APROBADA' | 'RECHAZADA' | 'ENVIADA' | 'RECIBIDA';
export type TipoBandeja = 'ENTRANTE' | 'SALIENTE' | 'PENDIENTE_APROBACION';

export interface HojaRuta {
  id: string;
  codigo: string;
  area_origen: string;
  estado: EstadoHojaRuta;
  creado_por: string;
  creado_por_nombre?: string | null;
  derivaciones?: Derivacion[];
  created_at: string;
  updated_at: string;
}

export interface Derivacion {
  id: string;
  hoja_ruta: HojaRuta;
  documento_id: string;
  documento_nombre?: string | null;
  remitente_id: string;
  remitente_nombre?: string | null;
  destinatario_id: string;
  destinatario_nombre?: string | null;
  es_externa: boolean;
  estado: EstadoDerivacion;
  nota: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bandeja {
  id: string;
  usuario_id: string;
  hoja_ruta: HojaRuta;
  tipo: TipoBandeja;
  leido: boolean;
  created_at: string;
}
