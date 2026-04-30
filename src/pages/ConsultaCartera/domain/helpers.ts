import { convertirEventoAXml } from "../functions/convertEventoToXML";

export interface ApiErrorLike {
  message?: string | null;
  errors?: string[] | null;
}

export interface FacturasFiltroLike {
  checkIncluirSaldosCero: boolean;
  checkSoloAsignadas: boolean;
  checkSoloEventosPendientes: boolean;
  cuenta?: string | null;
  sinGestionDias: number;
  filtroEdadMora?: string | null;
  tipoEvento?: string | null;
  filtroPorVencimiento?: string | null;
  etiqueta?: string | null;
}

export interface BuildFacturasListParamsInput {
  fechaConsultaFacturas: string;
  filtros: FacturasFiltroLike;
  currentUserId?: string | number;
  tablaPage: number;
  tablaRowsPerPage: number;
  tablaSearch: string;
  filterOverride?: string;
}

export interface FacturasListParams {
  fecha: string;
  incluirCarterasSaldoCero: boolean;
  user?: string | number;
  forUser: boolean;
  mostrarYaGestionados: boolean;
  cuenta: string;
  sinGestionDias: number;
  edad?: string | null;
  filtroEventos?: string | null;
  filtroPorVencimiento: string;
  filtroPorEtiqueta?: string | null;
  page: number;
  numPage: number;
  filter: string;
}

export interface FacturaSelection {
  cliente: string;
  numefac: string;
  cuenta: string;
}

export interface ConsultaCarteraSearchParams {
  cuenta: string;
  factura: string;
  identificacionCliente: string;
}

export interface SeguimientoEventoXmlLike {
  id: number;
  tipo: string;
  fecha?: string | null;
  hora?: string | null;
  valor?: number;
}

function normalizePhoneValue(value?: string | null): string {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }

  let normalized = "";
  for (let index = 0; index < raw.length; index += 1) {
    const current = raw[index];
    if (/\d/.test(current)) {
      normalized += current;
      continue;
    }

    if (current === "+" && normalized.length === 0) {
      normalized += current;
    }
  }

  if (normalized.startsWith("00")) {
    normalized = `+${normalized.slice(2)}`;
  }

  return normalized === "+" ? "" : normalized;
}

function readTrimmedString(value: unknown): string {
  return String(value ?? "").trim();
}

function readFacturaRowValue(
  row: Record<string, unknown> | null | undefined,
  keys: string[]
): string {
  for (const key of keys) {
    const value = readTrimmedString(row?.[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

export function formatElapsedHhMmSs(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) && totalSeconds > 0
    ? Math.floor(totalSeconds)
    : 0;
  const hh = Math.floor(safeSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const mm = Math.floor((safeSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function createStartIdempotencyKey(): string {
  return `start-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createSaveFallbackIdempotencyKey(): string {
  return `save-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createTransitionIdempotencyKey(prefix = "transition"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, delayMs);
  });
}

export function isInboundCallDirection(directionRaw?: string | null): boolean {
  const direction = String(directionRaw ?? "").trim().toLowerCase();
  return direction.includes("inbound") || direction.includes("incoming");
}

export function isTerminalCallStatus(statusRaw?: string | null): boolean {
  const status = String(statusRaw ?? "").trim().toLowerCase();
  return [
    "completed",
    "failed",
    "canceled",
    "cancelled",
    "busy",
    "no-answer",
    "rejected",
    "disconnected",
    "error",
  ].includes(status);
}

export function areEquivalentPhoneValues(
  leftRaw?: string | null,
  rightRaw?: string | null
): boolean {
  const leftNormalized = normalizePhoneValue(leftRaw);
  const rightNormalized = normalizePhoneValue(rightRaw);
  if (!leftNormalized || !rightNormalized) {
    return false;
  }

  if (leftNormalized === rightNormalized) {
    return true;
  }

  const leftDigits = leftNormalized.replace(/\D/g, "");
  const rightDigits = rightNormalized.replace(/\D/g, "");
  if (!leftDigits || !rightDigits) {
    return false;
  }

  if (leftDigits === rightDigits) {
    return true;
  }

  const leftWithout57 = leftDigits.startsWith("57") ? leftDigits.slice(2) : leftDigits;
  const rightWithout57 = rightDigits.startsWith("57") ? rightDigits.slice(2) : rightDigits;
  if (leftWithout57 && rightWithout57 && leftWithout57 === rightWithout57) {
    return true;
  }

  if (leftDigits.length >= 10 && rightDigits.length >= 10) {
    return leftDigits.slice(-10) === rightDigits.slice(-10);
  }

  return false;
}

export function buildCombinedApiErrorMessage(
  response: ApiErrorLike | null | undefined,
  fallbackMessage: string
): string {
  const parts: string[] = [];
  const seen = new Set<string>();

  const pushUnique = (value?: string | null) => {
    const normalizedValue = String(value ?? "").trim();
    if (!normalizedValue) {
      return;
    }

    const normalizedKey = normalizedValue.toLowerCase();
    if (seen.has(normalizedKey)) {
      return;
    }

    seen.add(normalizedKey);
    parts.push(normalizedValue);
  };

  pushUnique(response?.message);

  if (Array.isArray(response?.errors)) {
    response.errors.forEach((error) => {
      pushUnique(error);
    });
  }

  return parts.length > 0 ? parts.join("\n") : fallbackMessage;
}

export function buildFacturasListParams({
  fechaConsultaFacturas,
  filtros,
  currentUserId,
  tablaPage,
  tablaRowsPerPage,
  tablaSearch,
  filterOverride,
}: BuildFacturasListParamsInput): FacturasListParams {
  return {
    fecha: fechaConsultaFacturas,
    incluirCarterasSaldoCero: filtros.checkIncluirSaldosCero,
    user: currentUserId,
    forUser: filtros.checkSoloAsignadas,
    mostrarYaGestionados: filtros.checkSoloEventosPendientes,
    cuenta: filtros.cuenta ?? "",
    sinGestionDias: filtros.sinGestionDias,
    edad: filtros.filtroEdadMora,
    filtroEventos: filtros.tipoEvento,
    filtroPorVencimiento: filtros.filtroPorVencimiento ?? "",
    filtroPorEtiqueta: filtros.etiqueta,
    page: Math.max(1, tablaPage + 1),
    numPage: tablaRowsPerPage,
    filter: filterOverride !== undefined ? filterOverride : tablaSearch,
  };
}

export function parseConsultaCarteraSearchParams(
  search: string
): ConsultaCarteraSearchParams {
  const params = new URLSearchParams(search);

  return {
    cuenta: readTrimmedString(params.get("cuenta")),
    factura: readTrimmedString(params.get("factura")),
    identificacionCliente: readTrimmedString(params.get("identificacionCliente")),
  };
}

export function hasConsultaCarteraSearchSelection(
  params: ConsultaCarteraSearchParams
): boolean {
  return Boolean(params.cuenta || params.factura || params.identificacionCliente);
}

export function resolveConsultaCarteraSearchValue(
  params: ConsultaCarteraSearchParams
): string {
  return params.identificacionCliente || params.factura || params.cuenta;
}

export function findFacturaRowBySearchParams(
  rows: Record<string, unknown>[],
  params: ConsultaCarteraSearchParams
): Record<string, unknown> | null {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return rows.find((row) =>
    params.factura
      ? readFacturaRowValue(row, ["numefac", "NUMEFAC", "factura"]) === params.factura
      : params.cuenta
        ? readFacturaRowValue(row, ["cuenta", "CUENTA"]) === params.cuenta
        : params.identificacionCliente
          ? readFacturaRowValue(row, ["cliente", "CLIENTE", "IDCLIPRV"]) === params.identificacionCliente
          : false
  ) ?? null;
}

export function buildFallbackFacturaSelectionFromSearchParams(
  params: ConsultaCarteraSearchParams
): FacturaSelection | null {
  if (!params.identificacionCliente || (!params.factura && !params.cuenta)) {
    return null;
  }

  return {
    cliente: params.identificacionCliente,
    numefac: params.factura,
    cuenta: params.cuenta,
  };
}

export function buildFacturaSelection(
  row: Record<string, unknown> | null | undefined,
  selectedValue = ""
): FacturaSelection {
  return {
    cliente: String(row?.cliente ?? row?.CLIENTE ?? row?.IDCLIPRV ?? selectedValue ?? ""),
    numefac: String(row?.numefac ?? row?.NUMEFAC ?? row?.factura ?? ""),
    cuenta: String(row?.cuenta ?? row?.CUENTA ?? ""),
  };
}

export function buildEventosXml(
  eventos?: SeguimientoEventoXmlLike[] | null
): string {
  if (!Array.isArray(eventos)) {
    return "";
  }

  return eventos
    .map((evento) =>
      convertirEventoAXml({
        id: evento.id,
        tipo: evento.tipo,
        fecha: evento.fecha || "",
        hora: evento.hora || null,
        valor: evento.valor,
      })
    )
    .join("\n");
}
