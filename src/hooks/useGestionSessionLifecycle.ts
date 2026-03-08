import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GestionPreContext,
  GestionSelectionContext,
  GestionSessionSnapshot,
  closeGestionSession,
  clearActiveGestionPointer,
  getActiveGestionPointer,
  getGestionSessionBySessionRef,
  getOrCreateGestionSession,
  markGestionSessionAsAbandoned,
  markGestionSessionAsInterrupted,
  pauseGestionSession,
  setActiveGestionPointer,
  touchGestionSession,
} from "@app/services/GestionLlamadas";

interface UseGestionSessionLifecycleOptions {
  enabled: boolean;
  selection?: Partial<GestionSelectionContext> | null;
  autoStartOnSelection?: boolean;
  inactivityTimeoutMs?: number;
  touchIntervalMs?: number;
  debug?: boolean;
}

interface UseGestionSessionLifecycleResult {
  preContext: GestionPreContext;
  sessionSnapshot: GestionSessionSnapshot | null;
  sessionRef: string | null;
  startOrResume: () => GestionSessionSnapshot | null;
  touch: () => void;
  pause: (reason?: string) => void;
  close: (reason?: string) => void;
  markAbandoned: (reason?: string) => void;
  markInterrupted: (reason?: string) => void;
}

const DEFAULT_TOUCH_INTERVAL_MS = 30_000;
const DEFAULT_INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;

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

function isHiddenDocument(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.visibilityState === "hidden";
}

export function useGestionSessionLifecycle(
  options: UseGestionSessionLifecycleOptions
): UseGestionSessionLifecycleResult {
  const enabled = Boolean(options.enabled);
  const autoStartOnSelection = Boolean(options.autoStartOnSelection);
  const debug = Boolean(options.debug);
  const inactivityTimeoutMs = Math.max(30_000, options.inactivityTimeoutMs ?? DEFAULT_INACTIVITY_TIMEOUT_MS);
  const touchIntervalMs = Math.max(5000, options.touchIntervalMs ?? DEFAULT_TOUCH_INTERVAL_MS);
  const selection = options.selection ?? null;
  const normalizedSelection = useMemo(
    () => normalizeSelection(selection),
    [selection?.cliente, selection?.factura, selection?.cuenta, selection?.tenantId, selection?.userId]
  );
  const [sessionSnapshot, setSessionSnapshot] = useState<GestionSessionSnapshot | null>(() => {
    const pointer = getActiveGestionPointer();
    if (!pointer?.sessionRef) {
      return null;
    }

    return getGestionSessionBySessionRef(pointer.sessionRef);
  });
  const sessionRefValue = sessionSnapshot?.sessionRef ?? null;
  const preContext = useMemo<GestionPreContext>(() => {
    if (!normalizedSelection) {
      return {
        selectionKey: "",
        context: {
          cliente: "",
          factura: "",
          cuenta: "",
          userId: null,
          tenantId: null,
        },
        hasCompleteSelection: false,
      };
    }

    return {
      selectionKey: `${normalizedSelection.cliente}|${normalizedSelection.factura}|${normalizedSelection.cuenta}`,
      context: normalizedSelection,
      hasCompleteSelection: true,
    };
  }, [normalizedSelection]);

  const startOrResume = useCallback((): GestionSessionSnapshot | null => {
    if (!enabled || !normalizedSelection) {
      setSessionSnapshot(null);
      return null;
    }

    const snapshot = getOrCreateGestionSession(normalizedSelection);
    setSessionSnapshot(snapshot);
    setActiveGestionPointer({
      sessionRef: snapshot.sessionRef,
      contextKey: snapshot.selectionKey,
      startedAt: snapshot.startedAt,
      status: snapshot.status === "activa" || snapshot.status === "pausada"
        ? snapshot.status
        : "activa",
    });

    if (debug) {
      console.log("[GestionSessionLifecycle] startOrResume", snapshot);
    }

    return snapshot;
  }, [debug, enabled, normalizedSelection]);

  const touch = useCallback(() => {
    if (!enabled || !sessionRefValue) {
      return;
    }

    const ok = touchGestionSession(sessionRefValue);
    if (ok) {
      setSessionSnapshot((previous) =>
        previous
          ? {
              ...previous,
              status: "activa",
              lastActivityAt: new Date().toISOString(),
              pausedAt: null,
              closedAt: null,
              closeReason: null,
              source: "reused",
            }
          : previous
      );
      setActiveGestionPointer({
        sessionRef: sessionRefValue,
        status: "activa",
      });
    }
  }, [enabled, sessionRefValue]);

  const pause = useCallback(
    (reason?: string) => {
      if (!enabled || !sessionRefValue) {
        return;
      }

      const snapshot = pauseGestionSession(sessionRefValue, reason ?? "menu_or_selection_change");
      if (snapshot) {
        setSessionSnapshot(snapshot);
        setActiveGestionPointer({
          sessionRef: snapshot.sessionRef,
          status: "pausada",
        });
        if (debug) {
          console.log("[GestionSessionLifecycle] paused", snapshot);
        }
      }
    },
    [debug, enabled, sessionRefValue]
  );

  const close = useCallback(
    (reason?: string) => {
      if (!enabled || !sessionRefValue) {
        return;
      }

      const snapshot = closeGestionSession(sessionRefValue, reason ?? "cerrada_por_usuario");
      if (snapshot) {
        setSessionSnapshot(snapshot);
        setActiveGestionPointer({
          sessionRef: snapshot.sessionRef,
          status: "cerrada",
        });
        if (debug) {
          console.log("[GestionSessionLifecycle] closed", snapshot);
        }
      }
    },
    [debug, enabled, sessionRefValue]
  );

  const markAbandoned = useCallback(
    (reason?: string) => {
      if (!enabled || !sessionRefValue) {
        return;
      }

      const snapshot = markGestionSessionAsAbandoned(
        sessionRefValue,
        reason ?? "abandonada_por_inactividad"
      );
      if (snapshot) {
        setSessionSnapshot(snapshot);
        setActiveGestionPointer({
          sessionRef: snapshot.sessionRef,
          status: "abandonada",
        });
        if (debug) {
          console.log("[GestionSessionLifecycle] abandoned", snapshot);
        }
      }
    },
    [debug, enabled, sessionRefValue]
  );

  const markInterrupted = useCallback(
    (reason?: string) => {
      if (!enabled || !sessionRefValue) {
        return;
      }

      const snapshot = markGestionSessionAsInterrupted(
        sessionRefValue,
        reason ?? "interrumpida_por_cierre_pestana"
      );
      if (snapshot) {
        setSessionSnapshot(snapshot);
        setActiveGestionPointer({
          sessionRef: snapshot.sessionRef,
          status: "interrumpida",
        });
        if (debug) {
          console.log("[GestionSessionLifecycle] interrupted", snapshot);
        }
      }
    },
    [debug, enabled, sessionRefValue]
  );

  useEffect(() => {
    if (!enabled || !normalizedSelection || !autoStartOnSelection) {
      return;
    }

    startOrResume();
  }, [autoStartOnSelection, enabled, normalizedSelection, startOrResume]);

  useEffect(() => {
    if (enabled && normalizedSelection) {
      return;
    }

    if (sessionRefValue && sessionSnapshot?.status === "activa") {
      pause("selection_invalid_or_cleared");
      return;
    }

    setSessionSnapshot(null);
    clearActiveGestionPointer();
  }, [enabled, normalizedSelection, pause, sessionRefValue, sessionSnapshot?.status]);

  useEffect(() => {
    if (!enabled || !sessionRefValue) {
      return;
    }

    const interval = window.setInterval(() => {
      if (isHiddenDocument()) {
        return;
      }
      touch();
    }, touchIntervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [enabled, sessionRefValue, touch, touchIntervalMs]);

  useEffect(() => {
    if (!enabled || !sessionRefValue) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (isHiddenDocument()) {
        markAbandoned("abandonada_por_inactividad");
      }
    }, inactivityTimeoutMs);

    return () => window.clearTimeout(timeout);
  }, [enabled, inactivityTimeoutMs, markAbandoned, sessionRefValue, sessionSnapshot?.lastActivityAt]);

  useEffect(() => {
    if (!enabled || !sessionRefValue) {
      return;
    }

    const onBeforeUnload = () => {
      markInterrupted("interrumpida_por_beforeunload");
    };

    const onPageHide = () => {
      markInterrupted("interrumpida_por_pagehide");
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [enabled, markInterrupted, sessionRefValue]);

  useEffect(() => {
    return () => {
      if (enabled && sessionRefValue && sessionSnapshot?.status === "activa") {
        pause("component_unmount");
      }
    };
  }, [enabled, pause, sessionRefValue, sessionSnapshot?.status]);

  return {
    preContext,
    sessionSnapshot,
    sessionRef: sessionRefValue,
    startOrResume,
    touch,
    pause,
    close,
    markAbandoned,
    markInterrupted,
  };
}
