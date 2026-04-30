import type { EventoCumplidoValue } from "../utils/cumplido";

export interface EventoXmlInput {
  id: number;
  tipo: string;
  fecha: string;
  hora: string | null;
  valor?: number;
}

export type Evento = {
  id: number;
  tipo: string;
  fecha?: string;
  hora?: string | null;
  valor?: number;
  cumplido?: EventoCumplidoValue;
  color?: string;
  icono?: string;
};

export type Seguimiento = {
  id: number;
  usuario: string;
  fecha: string;
  hora: string;
  texto: string;
  detalle: string;
  eventos: Evento[];
  tipoContacto?: string | number;
  grabacion: string | null;
};

export interface SeguimientoDraftState {
  texto: string;
  eventos: Evento[];
  tipoContacto: string | number;
  formEvento: Evento;
  editIndex: number | null;
  updatedAt: string;
}

export interface SeguimientoEventoContext {
  idUsuario?: string | number;
  cliente?: string;
  factura?: string;
  cuenta?: string;
}

export interface TipoEventoOption {
  id: number;
  nombre: string;
  requiereMonto?: boolean;
  requiereFecha?: boolean;
  requiereHora?: boolean;
}
