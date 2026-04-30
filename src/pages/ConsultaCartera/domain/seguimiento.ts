import type {
  Evento,
  Seguimiento,
} from "../../../modules/maestros/tipos-eventos/TimelineSeguimientos";
import type { GestionSession } from "../../../services/GestionSessionService";
import type {
  GestionFacturaRequest,
  GestionesEventosFacturaResulta,
} from "../../../services/GestionFacturaService";

export interface ConsultaCarteraSeguimientoSelection {
  cliente: string;
  factura: string;
  cuenta: string;
}

interface BuildSeguimientoDraftStorageKeyInput {
  tenantId?: string | number | null;
  userId?: string | number | null;
  sessionRef?: string | null;
}

interface SaveSeguimientoBlockedState {
  gestionOperativaActiva: boolean;
  isCallInProgress: boolean;
  hasPendingInboundCalls: boolean;
  isAssociatingInboundCall: boolean;
  isSaveRequestInFlight: boolean;
}

interface BuildGestionFacturaSaveRequestInput {
  registroSeleccionado: ConsultaCarteraSeguimientoSelection;
  currentUserId: number;
  seguimiento: Omit<Seguimiento, "id" | "usuario" | "fecha" | "hora">;
  eventosXml: string;
  activeSessionId: number;
  activeSessionRef: string;
  idempotencyKey: string;
  tabId: string;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeHora(value: unknown): string {
  return normalizeText(value).substring(0, 5);
}

function buildGestionContextKey(
  cliente: string,
  factura: string,
  cuenta: string
): string {
  return [
    normalizeText(cliente),
    normalizeText(factura),
    normalizeText(cuenta),
  ].join("|");
}

export function buildSeguimientoSelection(
  registroSeleccionado:
    | {
        cliente?: unknown;
        numefac?: unknown;
        cuenta?: unknown;
      }
    | null
    | undefined
): ConsultaCarteraSeguimientoSelection | null {
  const cliente = normalizeText(registroSeleccionado?.cliente);
  const factura = normalizeText(registroSeleccionado?.numefac);
  const cuenta = normalizeText(registroSeleccionado?.cuenta);

  if (!cliente || !factura || !cuenta) {
    return null;
  }

  return {
    cliente,
    factura,
    cuenta,
  };
}

export function mapGestionesFacturaResultToSeguimientos(
  data: GestionesEventosFacturaResulta | null | undefined
): Seguimiento[] {
  const gestiones = Array.isArray(data?.gestiones) ? data?.gestiones : [];
  const eventos = Array.isArray(data?.eventos) ? data?.eventos : [];

  return gestiones.map((gestion) => {
    const eventosGestion: Evento[] = eventos
      .filter((evento) => evento.idGestion === gestion.id)
      .map((evento) => ({
        id: evento.id,
        tipo: evento.tipoEvento ?? "",
        fecha: evento.fechaHoraProgramada
          ? evento.fechaHoraProgramada.split("T")[0]
          : "",
        hora: evento.fechaHoraProgramada
          ? normalizeHora(evento.fechaHoraProgramada.split("T")[1])
          : null,
        color: evento.color || "black",
        icono: evento.icono === null ? undefined : evento.icono,
        valor: evento.montoCompromiso || undefined,
        cumplido: evento.cumplido,
      }));

    const fechaHoraIso =
      typeof gestion.fechaHora === "string"
        ? gestion.fechaHora
        : gestion.fechaHora.toISOString();

    return {
      id: gestion.id,
      usuario: gestion.usuario.toString(),
      fecha: fechaHoraIso.split("T")[0],
      hora: normalizeHora(fechaHoraIso.split("T")[1]),
      texto: gestion.descripcion,
      detalle: gestion.descripcion,
      eventos: eventosGestion,
      tipoContacto: gestion.tipoContacto || "",
      grabacion: gestion.idGrabacionLlamada || null,
    };
  });
}

export function buildSeguimientoDraftStorageKey({
  tenantId,
  userId,
  sessionRef,
}: BuildSeguimientoDraftStorageKeyInput): string | undefined {
  const normalizedTenantId = normalizeText(tenantId);
  const normalizedUserId = normalizeText(userId);
  const normalizedSessionRef = normalizeText(sessionRef);

  if (!normalizedTenantId || !normalizedUserId || !normalizedSessionRef) {
    return undefined;
  }

  return `sigc.gestion.seguimiento-draft:${normalizedTenantId}:${normalizedUserId}:${normalizedSessionRef}`;
}

export function buildSaveSeguimientoBlockedReason(
  state: SaveSeguimientoBlockedState
): string {
  if (!state.gestionOperativaActiva) {
    return "Debes iniciar una gestión activa antes de guardar seguimiento.";
  }

  if (state.isCallInProgress) {
    return "No puedes guardar mientras hay una llamada activa. Primero debes colgar.";
  }

  if (state.hasPendingInboundCalls) {
    return "Tienes una llamada entrante pendiente de asociar. Asociala a la gestion activa antes de guardar.";
  }

  if (state.isAssociatingInboundCall) {
    return "Asociando llamada entrante pendiente. Espera a que finalice.";
  }

  return "Ya hay un guardado en curso. Espera a que finalice.";
}

export function canSaveSeguimiento(
  state: SaveSeguimientoBlockedState
): boolean {
  return Boolean(
    state.gestionOperativaActiva &&
      !state.isCallInProgress &&
      !state.hasPendingInboundCalls &&
      !state.isAssociatingInboundCall &&
      !state.isSaveRequestInFlight
  );
}

export function hasMatchingSeguimientoContext(
  activeGestionSession:
    | Pick<GestionSession, "cliente" | "factura" | "cuenta">
    | null
    | undefined,
  registroSeleccionado: ConsultaCarteraSeguimientoSelection
): boolean {
  if (!activeGestionSession) {
    return false;
  }

  return (
    buildGestionContextKey(
      activeGestionSession.cliente,
      activeGestionSession.factura,
      activeGestionSession.cuenta
    ) ===
    buildGestionContextKey(
      registroSeleccionado.cliente,
      registroSeleccionado.factura,
      registroSeleccionado.cuenta
    )
  );
}

export function buildGestionFacturaSaveRequest({
  registroSeleccionado,
  currentUserId,
  seguimiento,
  eventosXml,
  activeSessionId,
  activeSessionRef,
  idempotencyKey,
  tabId,
}: BuildGestionFacturaSaveRequestInput): GestionFacturaRequest {
  return {
    numefac: registroSeleccionado.factura,
    cliente: registroSeleccionado.cliente,
    cuenta: registroSeleccionado.cuenta,
    usuario: currentUserId,
    descripcion: seguimiento.texto,
    tipoContacto: seguimiento.tipoContacto || 1,
    eventos: `<Eventos>${eventosXml}</Eventos>`,
    idGrabacionLlamada: seguimiento.grabacion || "",
    idGestionSession: activeSessionId,
    sessionRef: activeSessionRef,
    idempotencyKey,
    source: "consulta_cartera_save",
    tabId,
  };
}
