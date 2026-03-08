import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  GestionSession,
  GestionSessionServiceResult,
  SwitchActiveGestionSessionRequest,
  getGestionSessionContextKey,
  useGestionSessionService,
} from "@app/services/GestionSessionService";
import {
  clearActiveGestionPointer,
  setActiveGestionPointer,
} from "@app/services/GestionLlamadas";
import {
  getGlobalWebRtcRuntimeSnapshot,
  subscribeGlobalWebRtcRuntimeSnapshot,
} from "@app/services/WebRtc/webrtcBridge";

const ACTIVE_POINTER_STORAGE_KEY = "sigc.gestion.active.pointer.v1";

interface GestionSessionContextValue {
  sessions: GestionSession[];
  activeSession: GestionSession | null;
  pausedSessions: GestionSession[];
  loading: boolean;
  refreshing: boolean;
  hasLiveCall: boolean;
  hasIncomingCall: boolean;
  switchBlockedReason: string | null;
  refreshSessions: () => Promise<void>;
  getSessionByContextKey: (contextKey: string) => GestionSession | null;
  switchActiveSession: (
    request: SwitchActiveGestionSessionRequest
  ) => Promise<GestionSessionServiceResult>;
}

const GestionSessionContext = createContext<GestionSessionContextValue | null>(null);

function buildSwitchBlockedReason(
  hasIncomingCall: boolean,
  hasLiveOutboundOrConnectedCall: boolean
): string | null {
  if (hasIncomingCall) {
    return "No puedes cambiar la gestion activa mientras tienes una llamada entrante en curso.";
  }

  if (hasLiveOutboundOrConnectedCall) {
    return "No puedes cambiar la gestion activa mientras hay una llamada en curso.";
  }

  return null;
}

export function GestionSessionProvider({ children }: PropsWithChildren) {
  const {
    listInProgressGestionSessions,
    switchActiveGestionSession,
    loadingListInProgressGestionSessions,
    loadingSwitchActiveGestionSession,
  } = useGestionSessionService();
  const [sessions, setSessions] = useState<GestionSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [runtimeSnapshot, setRuntimeSnapshot] = useState(getGlobalWebRtcRuntimeSnapshot());
  const refreshInFlightRef = useRef<Promise<void> | null>(null);

  const refreshSessions = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }

    const refreshTask = (async () => {
      setRefreshing(true);
      try {
        const response = await listInProgressGestionSessions();
        if (!response.success) {
          return;
        }

        setSessions(response.operation?.sessions ?? []);
      } finally {
        refreshInFlightRef.current = null;
        setRefreshing(false);
      }
    })();

    refreshInFlightRef.current = refreshTask;
    return refreshTask;
  }, [listInProgressGestionSessions]);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  useEffect(() => {
    return subscribeGlobalWebRtcRuntimeSnapshot((snapshot) => {
      setRuntimeSnapshot(snapshot);
    });
  }, []);

  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void refreshSessions();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== ACTIVE_POINTER_STORAGE_KEY) {
        return;
      }

      void refreshSessions();
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshSessions]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.status.toLowerCase() === "activa") ?? null,
    [sessions]
  );
  const pausedSessions = useMemo(
    () =>
      sessions.filter((session) => {
        const status = session.status.toLowerCase();
        return status === "pausada" || status === "interrumpida";
      }),
    [sessions]
  );

  useEffect(() => {
    if (!activeSession) {
      clearActiveGestionPointer();
      return;
    }

    setActiveGestionPointer({
      idGestionSession: activeSession.idGestionSession,
      sessionRef: activeSession.sessionRef,
      contextKey: getGestionSessionContextKey(activeSession),
      startedAt: activeSession.startedAt,
      status:
        activeSession.status === "pausada"
          ? "pausada"
          : activeSession.status === "interrumpida"
            ? "interrumpida"
            : "activa",
    });
  }, [activeSession]);

  const hasIncomingCall = Boolean(runtimeSnapshot.incomingCall?.callSid);
  const hasLiveOutboundOrConnectedCall = Boolean(
    runtimeSnapshot.inProgress
    || runtimeSnapshot.connectionStatus === "dialing"
    || runtimeSnapshot.connectionStatus === "in_call"
  );
  const hasLiveCall = hasIncomingCall || hasLiveOutboundOrConnectedCall;
  const switchBlockedReason = buildSwitchBlockedReason(
    hasIncomingCall,
    hasLiveOutboundOrConnectedCall
  );

  const getSessionByContextKey = useCallback(
    (contextKey: string): GestionSession | null => {
      const normalized = String(contextKey ?? "").trim();
      if (!normalized) {
        return null;
      }

      return sessions.find((session) => getGestionSessionContextKey(session) === normalized) ?? null;
    },
    [sessions]
  );

  const switchActiveSession = useCallback(
    async (request: SwitchActiveGestionSessionRequest): Promise<GestionSessionServiceResult> => {
      const result = await switchActiveGestionSession(request);
      await refreshSessions();
      return result;
    },
    [refreshSessions, switchActiveGestionSession]
  );

  const value = useMemo<GestionSessionContextValue>(
    () => ({
      sessions,
      activeSession,
      pausedSessions,
      loading:
        loadingListInProgressGestionSessions
        || loadingSwitchActiveGestionSession
        || refreshing,
      refreshing,
      hasLiveCall,
      hasIncomingCall,
      switchBlockedReason,
      refreshSessions,
      getSessionByContextKey,
      switchActiveSession,
    }),
    [
      activeSession,
      getSessionByContextKey,
      hasIncomingCall,
      hasLiveCall,
      loadingListInProgressGestionSessions,
      loadingSwitchActiveGestionSession,
      pausedSessions,
      refreshSessions,
      refreshing,
      sessions,
      switchActiveSession,
      switchBlockedReason,
    ]
  );

  return (
    <GestionSessionContext.Provider value={value}>
      {children}
    </GestionSessionContext.Provider>
  );
}

export function useGestionSessionContext(): GestionSessionContextValue {
  const context = useContext(GestionSessionContext);
  if (!context) {
    throw new Error("useGestionSessionContext must be used within GestionSessionProvider");
  }

  return context;
}
