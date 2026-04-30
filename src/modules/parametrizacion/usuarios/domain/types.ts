export interface FormularioUsuarioState {
  username: string;
  password: string;
  fullName: string;
  email: string;
  roleId: string;
  isActive: boolean;
}

export type FiltroEstado = "todos" | "activos" | "inactivos";

export interface UsuariosEstadisticas {
  total: number;
  activos: number;
  inactivos: number;
}
