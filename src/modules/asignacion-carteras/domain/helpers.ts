import type {
  CarteraAsignacionActual,
  CarteraGuardarPayload,
  CarteraReasignacionCambioPayload,
  ListarAsignacionesParams,
  ListarHistorialParams,
} from "@app/services/AsignacionCarteras/asignacionCarterasService";
import { AGE_BUCKETS } from "@app/constants/ageBuckets";
import type {
  AsignacionCarterasFilters,
  MasivoReasignacionFormState,
  NuevaAsignacionFormState,
  ReasignacionFormState,
} from "./types";

export const TRAMOS = AGE_BUCKETS.map((bucket) => ({
  value: bucket.key,
  label: bucket.badgeLabel,
}));

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildDefaultAsignacionFilters(
  now: Date = new Date(),
): AsignacionCarterasFilters {
  const haceTreintaDias = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    filtroCuenta: "",
    filtroTramo: "",
    filtroAsesorId: "",
    fechaInicio: formatDateInput(haceTreintaDias),
    fechaFin: formatDateInput(now),
  };
}

export function buildDefaultNuevaAsignacionForm(): NuevaAsignacionFormState {
  return {
    cuenta: "",
    tramos: [],
    asesorId: "",
    motivo: "",
  };
}

export function buildDefaultReasignacionForm(
  asesorId: string = "",
): ReasignacionFormState {
  return {
    asesorId,
    motivo: "",
  };
}

export function buildDefaultMasivoReasignacionForm(): MasivoReasignacionFormState {
  return {
    asesorId: "",
    motivo: "",
  };
}

export function buildCarteraRowKey(item: CarteraAsignacionActual): string {
  return `${item.cuenta}|${item.tramoCodigo}`;
}

export function buildListarAsignacionesParams(
  filters: AsignacionCarterasFilters,
): ListarAsignacionesParams {
  return {
    cuenta: filters.filtroCuenta.trim() || undefined,
    tramoCodigo: filters.filtroTramo || undefined,
    asesorUserId: filters.filtroAsesorId
      ? Number(filters.filtroAsesorId)
      : undefined,
    soloTramosActivos: true,
  };
}

export function buildListarHistorialParams(
  filters: AsignacionCarterasFilters,
): ListarHistorialParams {
  return {
    cuenta: filters.filtroCuenta.trim() || undefined,
    tramoCodigo: filters.filtroTramo || undefined,
    asesorUserId: filters.filtroAsesorId
      ? Number(filters.filtroAsesorId)
      : undefined,
    fechaInicio: filters.fechaInicio || undefined,
    fechaFin: filters.fechaFin || undefined,
  };
}

export function pruneSelectedKeys(
  asignaciones: CarteraAsignacionActual[],
  selectedKeys: string[],
): string[] {
  const validKeys = new Set(asignaciones.map((item) => buildCarteraRowKey(item)));
  return selectedKeys.filter((key) => validKeys.has(key));
}

export function buildAllSelectedKeys(
  asignaciones: CarteraAsignacionActual[],
): string[] {
  return asignaciones.map((item) => buildCarteraRowKey(item));
}

export function toggleSelectedKey(
  selectedKeys: string[],
  row: CarteraAsignacionActual,
): string[] {
  const key = buildCarteraRowKey(row);

  if (selectedKeys.includes(key)) {
    return selectedKeys.filter((item) => item !== key);
  }

  return [...selectedKeys, key];
}

export function toggleTramoSelection(
  current: string[],
  tramoCodigo: string,
): string[] {
  if (current.includes(tramoCodigo)) {
    return current.filter((item) => item !== tramoCodigo);
  }

  return [...current, tramoCodigo];
}

export function validateNuevaAsignacion(
  puedeAsignar: boolean,
  form: NuevaAsignacionFormState,
): string | null {
  if (!puedeAsignar) {
    return "No tienes permisos para asignar carteras";
  }

  if (!form.cuenta.trim()) {
    return "La cuenta es obligatoria";
  }

  if (!form.asesorId) {
    return "Debe seleccionar un asesor";
  }

  if (form.tramos.length === 0) {
    return "Debe seleccionar al menos un tramo";
  }

  return null;
}

export function buildGuardarAsignacionPayload(
  form: NuevaAsignacionFormState,
): CarteraGuardarPayload {
  return {
    cuenta: form.cuenta.trim(),
    tramos: form.tramos,
    asesorNuevoUserId: Number(form.asesorId),
    motivo: form.motivo.trim() || null,
  };
}

export function validateReasignacion(
  puedeReasignar: boolean,
  asesorId: string,
): string | null {
  if (!puedeReasignar) {
    return "No tienes permisos para reasignar carteras";
  }

  if (!asesorId) {
    return "Debe seleccionar un asesor";
  }

  return null;
}

export function validateReasignacionMasiva(
  puedeReasignar: boolean,
  asesorId: string,
  selectedCount: number,
): string | null {
  if (!puedeReasignar) {
    return "No tienes permisos para reasignar carteras";
  }

  if (!asesorId) {
    return "Debe seleccionar un asesor";
  }

  if (selectedCount === 0) {
    return "No hay filas seleccionadas";
  }

  return null;
}

export function buildReasignacionCambioPayload(
  item: CarteraAsignacionActual,
  form: ReasignacionFormState | MasivoReasignacionFormState,
): CarteraReasignacionCambioPayload {
  return {
    cuenta: item.cuenta,
    tramoCodigo: item.tramoCodigo,
    asesorNuevoUserId: Number(form.asesorId),
    motivo: form.motivo.trim() || null,
  };
}

export function buildReasignacionMasivaPayload(
  items: CarteraAsignacionActual[],
  form: MasivoReasignacionFormState,
): CarteraReasignacionCambioPayload[] {
  return items.map((item) => buildReasignacionCambioPayload(item, form));
}
