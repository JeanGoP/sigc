import type { FiltroPermisos, PresetPermisos } from "./types";

export const ORDEN_ACCIONES: Record<string, number> = {
  view: 1,
  create: 2,
  edit: 3,
  delete: 4,
  save: 5,
  manage: 6,
  assign: 7,
  reassign: 8,
  bulk_reassign: 9,
  permissions_edit: 10,
  change_password: 11,
};

export const FILTRO_PERMISOS_OPTIONS: Array<{
  value: FiltroPermisos;
  label: string;
}> = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Solo activos" },
  { value: "cambios", label: "Solo cambios" },
];

export const PRESET_PERMISOS_OPTIONS: Array<{
  value: PresetPermisos;
  label: string;
}> = [
  { value: "todos", label: "Todo" },
  { value: "solo_view", label: "Solo ver" },
  { value: "ninguno", label: "Ninguno" },
];
