export type PrimitiveId = string | number;

export type GestionSessionStatus =
  | "pre_gestion"
  | "consulta"
  | "activa"
  | "pausada"
  | "cerrada"
  | "cancelada"
  | "abandonada"
  | "interrumpida";

export interface GestionSelectionContext {
  cliente: string;
  factura: string;
  cuenta: string;
  userId?: PrimitiveId | null;
  tenantId?: PrimitiveId | null;
}

export interface GestionSessionSnapshot {
  sessionRef: string;
  selectionKey: string;
  status: GestionSessionStatus;
  startedAt: string;
  lastActivityAt: string;
  pausedAt?: string | null;
  closedAt?: string | null;
  closeReason?: string | null;
  context: GestionSelectionContext;
  source: "created" | "reused";
}

export interface GestionPreContext {
  selectionKey: string;
  context: GestionSelectionContext;
  hasCompleteSelection: boolean;
}

export interface ActiveGestionPointer {
  idGestionSession: number | null;
  sessionRef: string | null;
  contextKey: string | null;
  startedAt: string | null;
  status: Extract<
    GestionSessionStatus,
    "activa" | "pausada" | "cerrada" | "cancelada" | "abandonada" | "interrumpida"
  > | null;
  updatedAt: string | null;
}

export interface SaveIdempotencyInput {
  sessionRef: string;
  selectionKey: string;
  cliente: string;
  factura: string;
  cuenta: string;
  userId?: PrimitiveId | null;
  descripcion?: string;
  tipoContacto?: PrimitiveId | null;
}

export interface SaveIdempotencyAttempt {
  idempotencyKey: string;
  fingerprint: string;
  createdAt: string;
  reused: boolean;
  isRecentDuplicate: boolean;
}

export interface TabOwnershipSnapshot {
  channelKey: string;
  tabId: string;
  ownerTabId: string | null;
  lockExpiresAt: string | null;
  hasOwner: boolean;
  isOwner: boolean;
}
