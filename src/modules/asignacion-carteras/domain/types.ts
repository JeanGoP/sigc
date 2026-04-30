export interface AsignacionCarterasFilters {
  filtroCuenta: string;
  filtroTramo: string;
  filtroAsesorId: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface NuevaAsignacionFormState {
  cuenta: string;
  tramos: string[];
  asesorId: string;
  motivo: string;
}

export interface ReasignacionFormState {
  asesorId: string;
  motivo: string;
}

export interface MasivoReasignacionFormState {
  asesorId: string;
  motivo: string;
}
