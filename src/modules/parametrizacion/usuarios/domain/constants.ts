import type { FiltroEstado, FormularioUsuarioState } from "./types";

export const FORMULARIO_USUARIO_VACIO: FormularioUsuarioState = {
  username: "",
  password: "",
  fullName: "",
  email: "",
  roleId: "",
  isActive: true,
};

export const FILTRO_ESTADO_OPTIONS: Array<{
  value: FiltroEstado;
  label: string;
}> = [
  { value: "todos", label: "Todos los estados" },
  { value: "activos", label: "Activos" },
  { value: "inactivos", label: "Inactivos" },
];
