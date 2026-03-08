import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GestionSelectionContext,
  SaveIdempotencyAttempt,
  TabOwnershipSnapshot,
  createOrReuseSaveAttempt,
  getTabOwnershipSnapshot,
  releaseTabOwnership,
  subscribeTabOwnershipChanges,
  tryAcquireTabOwnership,
} from "@app/services/GestionLlamadas";
import { useGestionSessionLifecycle } from "@app/hooks/useGestionSessionLifecycle";

interface UseGestionLlamadasRuntimeOptions {
  enabled: boolean;
  selection?: Partial<GestionSelectionContext> | null;
  autoStartOnSelection?: boolean;
  sessionInactivityTimeoutMs?: number;
  sessionTouchIntervalMs?: number;
  ownerChannelKey?: string;
  ownerTtlSeconds?: number;
  enableOwnership?: boolean;
  debug?: boolean;
}

interface PrepareSaveAttemptInput {
  descripcion?: string;
  tipoContacto?: string | number | null;
}

interface UseGestionLlamadasRuntimeResult {
  preContext: ReturnType<typeof useGestionSessionLifecycle>["preContext"];
  sessionRef: string | null;
  sessionSnapshot: ReturnType<typeof useGestionSessionLifecycle>["sessionSnapshot"];
  startSession: () => ReturnType<typeof useGestionSessionLifecycle>["sessionSnapshot"];
  owner: TabOwnershipSnapshot;
  tabId: string;
  prepareSaveAttempt: (input?: PrepareSaveAttemptInput) => SaveIdempotencyAttempt | null;
  touchSession: () => void;
  pauseSession: (reason?: string) => void;
  closeSession: (reason?: string) => void;
  markSessionAbandoned: (reason?: string) => void;
  markSessionInterrupted: (reason?: string) => void;
}

const DEFAULT_OWNER_CHANNEL = "webrtc_owner_consulta_cartera";
const DEFAULT_OWNER_TTL_SECONDS = 45;

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeSelection(selection?: Partial<GestionSelectionContext> | null): GestionSelectionContext | null {
  if (!selection) {
    return null;
  }

  const cliente = normalizeText(selection.cliente);
  const factura = normalizeText(selection.factura);
  const cuenta = normalizeText(selection.cuenta);

  if (!cliente || !factura || !cuenta) {
    return null;
  }

  return {
    cliente,
    factura,
    cuenta,
    userId: selection.userId ?? null,
    tenantId: selection.tenantId ?? null,
  };
}

export function useGestionLlamadasRuntime(
  options: UseGestionLlamadasRuntimeOptions
): UseGestionLlamadasRuntimeResult {
  const ownerChannelKey = normalizeText(options.ownerChannelKey) || DEFAULT_OWNER_CHANNEL;
  const ownerTtlSeconds = Math.max(10, options.ownerTtlSeconds ?? DEFAULT_OWNER_TTL_SECONDS);
  const enabled = Boolean(options.enabled);
  const enableOwnership = Boolean(options.enableOwnership);
  const debug = Boolean(options.debug);
  const selection = options.selection ?? null;
  const autoStartOnSelection = Boolean(options.autoStartOnSelection);
  const sessionInactivityTimeoutMs = options.sessionInactivityTimeoutMs;
  const sessionTouchIntervalMs = options.sessionTouchIntervalMs;

  const normalizedSelection = useMemo(
    () => normalizeSelection(selection),
    [selection?.cliente, selection?.factura, selection?.cuenta, selection?.tenantId, selection?.userId]
  );

  const sessionLifecycle = useGestionSessionLifecycle({
    enabled,
    selection: normalizedSelection,
    autoStartOnSelection,
    inactivityTimeoutMs: sessionInactivityTimeoutMs,
    touchIntervalMs: sessionTouchIntervalMs,
    debug,
  });
  const preContext = sessionLifecycle.preContext;
  const sessionSnapshot = sessionLifecycle.sessionSnapshot;
  const startSession = sessionLifecycle.startOrResume;
  const touchSession = sessionLifecycle.touch;
  const pauseSession = sessionLifecycle.pause;
  const closeSession = sessionLifecycle.close;
  const markSessionAbandoned = sessionLifecycle.markAbandoned;
  const markSessionInterrupted = sessionLifecycle.markInterrupted;
  const [ownerSnapshot, setOwnerSnapshot] = useState<TabOwnershipSnapshot>(() =>
    getTabOwnershipSnapshot(ownerChannelKey)
  );

  useEffect(() => {
    if (!enabled || !enableOwnership) {
      setOwnerSnapshot(getTabOwnershipSnapshot(ownerChannelKey));
      return;
    }

    const first = tryAcquireTabOwnership(ownerChannelKey, {
      ttlSeconds: ownerTtlSeconds,
    });
    setOwnerSnapshot(first);

    if (debug) {
      console.log("[GestionLlamadas][Runtime] ownership initial", first);
    }

    const renewInterval = window.setInterval(() => {
      const renewed = tryAcquireTabOwnership(ownerChannelKey, {
        ttlSeconds: ownerTtlSeconds,
      });
      setOwnerSnapshot(renewed);
    }, Math.max(5000, Math.floor(ownerTtlSeconds * 500)));

    const unsubscribe = subscribeTabOwnershipChanges(ownerChannelKey, (snapshot) => {
      setOwnerSnapshot(snapshot);
      if (debug) {
        console.log("[GestionLlamadas][Runtime] ownership changed", snapshot);
      }
    });

    return () => {
      window.clearInterval(renewInterval);
      unsubscribe();
      setOwnerSnapshot(releaseTabOwnership(ownerChannelKey));
    };
  }, [debug, enableOwnership, enabled, ownerChannelKey, ownerTtlSeconds]);

  const prepareSaveAttempt = useCallback(
    (input?: PrepareSaveAttemptInput): SaveIdempotencyAttempt | null => {
      if (!enabled || !sessionSnapshot || !normalizedSelection) {
        return null;
      }

      touchSession();

      const attempt = createOrReuseSaveAttempt({
        sessionRef: sessionSnapshot.sessionRef,
        selectionKey: sessionSnapshot.selectionKey,
        cliente: normalizedSelection.cliente,
        factura: normalizedSelection.factura,
        cuenta: normalizedSelection.cuenta,
        userId: normalizedSelection.userId ?? null,
        descripcion: input?.descripcion ?? "",
        tipoContacto: input?.tipoContacto ?? null,
      });

      if (debug) {
        console.log("[GestionLlamadas][Runtime] save attempt", attempt);
      }

      return attempt;
    },
    [enabled, debug, normalizedSelection, sessionSnapshot, touchSession]
  );

  return {
    preContext,
    sessionRef: sessionSnapshot?.sessionRef ?? null,
    sessionSnapshot,
    startSession,
    owner: ownerSnapshot,
    tabId: ownerSnapshot.tabId,
    prepareSaveAttempt,
    touchSession,
    pauseSession,
    closeSession,
    markSessionAbandoned,
    markSessionInterrupted,
  };
}
