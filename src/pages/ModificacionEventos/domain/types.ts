export interface TipoEventoItem {
  id: string;
  nombre: string;
  requiereFecha: boolean;
  requiereHora: boolean;
  requiereMonto: boolean;
}

export interface EventoGestion {
  id: number;
  idGestion: number;
  cliente: string;
  factura: string;
  cuenta: string;
  idUsuarioAsignado: number;
  idTipoEvento: number;
  fechaHoraProgramada: string;
  montoCompromiso: number | null;
  requiereFecha: boolean;
  requiereHora: boolean;
  requiereMonto: boolean;
}

export interface GestionModificacion {
  idGestion: number;
  cliente: string;
  factura: string;
  cuenta: string;
  usuario: number;
  Username: string;
  FechaHora: string;
  descripcion: string;
  eventos: EventoGestion[];
}

export interface EventoModificacion {
  id: number;
  cliente: string;
  factura: string;
  cuenta: string;
  tipoEventoId: string;
  tipoEvento: string;
  fechaCreacion: string;
  fechaEvento: string;
  monto: number | null;
  usuario: string;
  requiereFecha: boolean;
  requiereHora: boolean;
  requiereMonto: boolean;
}

export interface EdicionEventoForm {
  usuario: string | number;
  cuenta: string;
  cliente: string;
  tipoEventoId: string | number;
  fechaEvento: string;
  horaEvento: string;
  monto: string;
}

export const EMPTY_FORM: EdicionEventoForm = {
  usuario: "",
  cuenta: "",
  cliente: "",
  tipoEventoId: "",
  fechaEvento: "",
  horaEvento: "",
  monto: "",
};

export interface FechaConsultaErrors {
  fechaInicio?: string;
  fechaFin?: string;
}

export interface FiltrosConsultaGestiones {
  fechaInicio: string;
  fechaFin: string;
  userId?: number | null;
  cuenta?: string | null;
  cliente?: string | null;
  filtro?: string | null;
}

export interface EventoRequirements {
  requiereFecha: boolean;
  requiereHora: boolean;
  requiereMonto: boolean;
}
