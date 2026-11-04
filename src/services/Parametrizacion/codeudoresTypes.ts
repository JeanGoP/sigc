export interface CodeudorItem {
  id: number;
  numefac: string;
  cliente: string | null;
  nombreTitular: string | null;
  cuenta: string | null;
  tipoIdentificacion: string;
  identificacion: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  email: string | null;
  tipoRelacion: string;
  activo: boolean;
  observacion: string | null;
  createdAt: string;
}

export interface CodeudorListResponse {
  items: CodeudorItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface CodeudorEstadisticas {
  total: number;
  activos: number;
  inactivos: number;
}

export interface CodeudorCreatePayload {
  numefac: string;
  cliente?: string | null;
  cuenta?: string | null;
  tipoIdentificacion: string;
  identificacion: string;
  nombre: string;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  email?: string | null;
  tipoRelacion?: string;
  observacion?: string | null;
}

export interface CodeudorUpdatePayload {
  tipoIdentificacion: string;
  identificacion: string;
  nombre: string;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  email?: string | null;
  tipoRelacion?: string;
  activo: boolean;
  observacion?: string | null;
}

export interface FacturaLookupItem {
  numefac: string;
  cliente: string;
  nombreTitular: string;
  cuenta: string | null;
}
