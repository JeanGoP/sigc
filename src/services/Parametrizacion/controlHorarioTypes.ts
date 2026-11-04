export interface ControlHorarioConfig {
  id: number;
  controlHorarioActivo: boolean;
  minutosToleranciaSalida: number;
  bloquearAgendamientoFueraHorario: boolean;
  adminPuedeAgendarFueraHorario: boolean;
  updatedAt?: string | null;
  updatedByUserId?: number | null;
}

export interface HorarioLaboralDia {
  id: number;
  diaSemana: number; // 1=Lunes .. 7=Domingo
  nombreDia: string;
  esLaboral: boolean;
  horaInicio: string;
  horaFin: string;
  updatedAt?: string | null;
}

export interface Festivo {
  id: number;
  fecha: string;
  descripcion: string;
  esLaboral: boolean;
  createdAt?: string | null;
}

export interface ControlHorarioFullConfig {
  general: ControlHorarioConfig;
  horariosSemana: HorarioLaboralDia[];
  festivos: Festivo[];
}

export interface PermisoHorario {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo?: string | null;
  otorgadoPorUserId: number;
  otorgadoPorNombre: string;
  isActive: boolean;
  createdAt: string;
  revocadoPorUserId?: number | null;
  revocadoPorNombre?: string | null;
  revocadoAt?: string | null;
  motivoRevocacion?: string | null;
  batchId?: string | null;
}

export interface AsignarPermisosMasivoPayload {
  userIds: number[];
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm:ss
  horaFin: string; // HH:mm:ss
  motivo?: string;
}

export interface RevocarPermisoPayload {
  permisoId: number;
  motivoRevocacion?: string;
}

export interface UpdateGeneralConfigPayload {
  controlHorarioActivo: boolean;
  minutosToleranciaSalida: number;
  bloquearAgendamientoFueraHorario: boolean;
  adminPuedeAgendarFueraHorario: boolean;
}

export interface UpdateHorariosSemanaPayload {
  dias: HorarioLaboralDia[];
}

export interface UpsertFestivoPayload {
  fecha: string;
  descripcion: string;
  esLaboral: boolean;
}

export interface LogAuditoriaHorario {
  id: number;
  accion: string;
  userId: number;
  username: string;
  fullName: string;
  fechaPermiso: string;
  horaInicio: string;
  horaFin: string;
  motivo?: string | null;
  realizadoPorUserId: number;
  realizadoPorNombre: string;
  batchId?: string | null;
  createdAt: string;
}

export interface ValidacionAccesoMe {
  esPermitido: boolean;
  tipoAcceso: string;
  motivoBloqueo?: string | null;
  horaLimite?: string | null;
}
