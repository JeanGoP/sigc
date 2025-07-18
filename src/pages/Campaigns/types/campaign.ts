export interface Campaign {
  id?: number;
  nombre: string;
  idTipoCampana: number;
  fechaCreacion?: string;
  fechaInicio: string;
  fechaFin: string;
  observaciones: string;
  idUsuario: number;
  estadoCampana: number;
}

export interface TipoCampana {
  id: number;
  nombre: string;
}

export interface EstadoCampana {
  id: number;
  nombre: string;
} 