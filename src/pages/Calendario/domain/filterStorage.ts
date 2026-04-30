import {
  deleteSessionValue,
  getSessionValue,
  saveOrUpdateSessionValue,
} from "@app/utils/localStorageHandler";
import { isValidCalendarUserFilter } from "./helpers";

export const CALENDARIO_CUENTA_FILTRO_SESSION_KEY =
  "calendario_cuenta_filtro";
export const CALENDARIO_USUARIO_FILTRO_SESSION_KEY =
  "calendario_usuario_filtro";

export function readCalendarioCuentaFiltro(): string {
  return getSessionValue<string>(CALENDARIO_CUENTA_FILTRO_SESSION_KEY) ?? "";
}

export function readCalendarioUsuarioFiltro(): string | number {
  return (
    getSessionValue<string | number>(CALENDARIO_USUARIO_FILTRO_SESSION_KEY) ??
    ""
  );
}

export function persistCalendarioCuentaFiltro(value: string): void {
  if (value) {
    saveOrUpdateSessionValue(CALENDARIO_CUENTA_FILTRO_SESSION_KEY, value);
    return;
  }

  deleteSessionValue(CALENDARIO_CUENTA_FILTRO_SESSION_KEY);
}

export function persistCalendarioUsuarioFiltro(
  value: string | number,
): void {
  if (isValidCalendarUserFilter(value)) {
    saveOrUpdateSessionValue(CALENDARIO_USUARIO_FILTRO_SESSION_KEY, value);
    return;
  }

  deleteSessionValue(CALENDARIO_USUARIO_FILTRO_SESSION_KEY);
}
