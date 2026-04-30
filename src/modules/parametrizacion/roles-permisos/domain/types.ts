import type { ParametrizacionRolePermission } from "@app/services/Parametrizacion/types";

export type FiltroPermisos = "todos" | "activos" | "cambios";
export type PresetPermisos = "todos" | "solo_view" | "ninguno";

export interface GrupoPermisos {
  menuId: number;
  menuKey: string;
  menuName: string;
  sortOrder: number;
  rows: ParametrizacionRolePermission[];
}
