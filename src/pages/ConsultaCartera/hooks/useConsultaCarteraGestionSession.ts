import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  buildGestionContextKey,
  calculateGestionSessionElapsedSeconds,
  useGestionSessionService,
} from "@app/services/GestionSessionService";
import { useGestionSessionContext } from "@app/modules/main/gestion-session/GestionSessionContext";
import { buildConsultaCarteraUrl } from "@app/utils/consultaCarteraNavigation";
import {
  acquireActionLock,
  releaseActionLock,
} from "@app/services/GestionLlamadas";
import {
  createStartIdempotencyKey,
  createTransitionIdempotencyKey,
  formatElapsedHhMmSs,
} from "../domain/helpers";

interface UseConsultaCarteraGestionSessionOptions {
  hasFullSelection: boolean;
  selectedCliente: string;
  selectedFactura: string;
  selectedCuenta: string;
  isSeguimientoDraftOpen: boolean;
  setActiveTab: (tab: string) => void;
  setIsSeguimientoDraftOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setRegistroSeleccionado: (
    value: { cliente: string; numefac: string; cuenta: string } | null
  ) => void;
  setSelectedValue: (value: string) => void;
  setTablaSearch: (value: string) => void;
  tabId: string;
}

export function useConsultaCarteraGestionSession({
  hasFullSelection,
  selectedCliente,
  selectedFactura,
  selectedCuenta,
  isSeguimientoDraftOpen,
  setActiveTab,
  setIsSeguimientoDraftOpen,
  setRegistroSeleccionado,
  setSelectedValue,
  setTablaSearch,
  tabId,
}: UseConsultaCarteraGestionSessionOptions) {
  const navigate = useNavigate();
  const {
    startGestionSession,
    listInProgressGestionSessions,
    transitionGestionSession,
    loadingStartGestionSession,
    loadingTransitionGestionSession,
  } = useGestionSessionService();
  const {
    activeSession: activeGestionSession,
    getSessionByContextKey,
    refreshSessions,
    switchActiveSession,
    hasLiveCall,
    switchBlockedReason,
  } = useGestionSessionContext();

  const [gestionElapsedSeconds, setGestionElapsedSeconds] = useState(0);
  const [showGestionConflictModal, setShowGestionConflictModal] = useState(false);
  const [isSwitchingGestionContext, setIsSwitchingGestionContext] = useState(false);
  const isStartingGestionRef = useRef(false);

  const selectedContextKey = hasFullSelection
    ? buildGestionContextKey(selectedCliente, selectedFactura, selectedCuenta)
    : "";

  const currentContextGestionSession = hasFullSelection
    ? getSessionByContextKey(selectedContextKey)
    : null;

  useEffect(() => {
    if (!currentContextGestionSession) {
      setIsSeguimientoDraftOpen(false);
      setGestionElapsedSeconds(0);
      return;
    }

    const updateElapsed = () => {
      setGestionElapsedSeconds(
        calculateGestionSessionElapsedSeconds(currentContextGestionSession)
      );
    };

    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [
    currentContextGestionSession?.accumulatedActiveSeconds,
    currentContextGestionSession?.currentActiveStartedAt,
    currentContextGestionSession?.elapsedActiveSeconds,
    currentContextGestionSession?.sessionRef,
    currentContextGestionSession?.status,
    setIsSeguimientoDraftOpen,
  ]);

  const navigateToGestionSession = useCallback(
    (cliente: string, factura: string, cuenta: string) => {
      navigate(
        buildConsultaCarteraUrl({
          identificacionCliente: cliente,
          factura,
          cuenta,
        })
      );
    },
    [navigate]
  );

  const isSameActiveContext = Boolean(
    activeGestionSession &&
      buildGestionContextKey(
        activeGestionSession.cliente,
        activeGestionSession.factura,
        activeGestionSession.cuenta
      ) === selectedContextKey
  );

  const gestionOperativaActiva = Boolean(
    isSameActiveContext && activeGestionSession?.status === "activa"
  );

  const handleHideGestionConflictModal = useCallback(() => {
    setShowGestionConflictModal(false);
  }, []);

  const handleContinueCurrentActiveGestion = useCallback(() => {
    if (!activeGestionSession) {
      setShowGestionConflictModal(false);
      return;
    }

    const { cliente, factura, cuenta } = activeGestionSession;

    setTablaSearch(cliente);
    setRegistroSeleccionado({ cliente, numefac: factura, cuenta });
    setSelectedValue(cliente);
    setIsSeguimientoDraftOpen(false);
    setActiveTab("seguimiento");
    navigateToGestionSession(cliente, factura, cuenta);
    setShowGestionConflictModal(false);
  }, [
    activeGestionSession,
    navigateToGestionSession,
    setActiveTab,
    setIsSeguimientoDraftOpen,
    setRegistroSeleccionado,
    setSelectedValue,
    setTablaSearch,
  ]);

  const handleConfirmSwitchToSelectedContext = useCallback(async () => {
    if (!hasFullSelection) {
      return;
    }

    if (switchBlockedReason) {
      toast.warning(switchBlockedReason);
      return;
    }

    setIsSwitchingGestionContext(true);
    try {
      if (
        currentContextGestionSession &&
        currentContextGestionSession.status !== "activa"
      ) {
        const switchResult = await switchActiveSession({
          idGestionSession: currentContextGestionSession.idGestionSession,
          sessionRef: currentContextGestionSession.sessionRef,
          reason: "consulta_cartera_switch_selected_context",
          idempotencyKey: createTransitionIdempotencyKey(
            "switch_selected_context"
          ),
          source: "consulta_cartera_conflict_modal",
          tabId,
        });

        const outcome = String(
          switchResult.operation?.outcomeCode ?? ""
        )
          .trim()
          .toLowerCase();
        if (!switchResult.success && outcome !== "already_active") {
          toast.warning(
            switchResult.message ||
              "No se pudo activar la gestion seleccionada."
          );
          return;
        }
      } else {
        const startResult = await startGestionSession({
          cliente: selectedCliente,
          factura: selectedFactura,
          cuenta: selectedCuenta,
          idempotencyKey: createStartIdempotencyKey(),
          source: "consulta_cartera_conflict_modal",
          tabId,
          autoPauseCurrentActive: true,
        });

        if (!startResult.success) {
          toast.warning(
            startResult.message ||
              "No se pudo activar la nueva gestion seleccionada."
          );
          return;
        }
      }

      await refreshSessions();
      setShowGestionConflictModal(false);
      setIsSeguimientoDraftOpen(true);
      toast.success(
        currentContextGestionSession
          ? "Gestion reactivada correctamente."
          : "Gestion temporal iniciada."
      );
    } finally {
      setIsSwitchingGestionContext(false);
    }
  }, [
    currentContextGestionSession,
    hasFullSelection,
    refreshSessions,
    selectedCliente,
    selectedCuenta,
    selectedFactura,
    setIsSeguimientoDraftOpen,
    startGestionSession,
    switchActiveSession,
    switchBlockedReason,
    tabId,
  ]);

  const handleGestionSessionFabClick = useCallback(async () => {
    if (!hasFullSelection) {
      return;
    }

    setActiveTab("seguimiento");

    if (gestionOperativaActiva) {
      setIsSeguimientoDraftOpen((previousValue) => !previousValue);
      return;
    }

    if (activeGestionSession && !isSameActiveContext) {
      setShowGestionConflictModal(true);
      return;
    }

    if (
      currentContextGestionSession &&
      currentContextGestionSession.status !== "activa"
    ) {
      if (switchBlockedReason) {
        toast.warning(switchBlockedReason);
        return;
      }

      const switchResult = await switchActiveSession({
        idGestionSession: currentContextGestionSession.idGestionSession,
        sessionRef: currentContextGestionSession.sessionRef,
        reason: "consulta_cartera_fab_activate_existing",
        idempotencyKey: createTransitionIdempotencyKey(
          "fab_activate_existing"
        ),
        source: "consulta_cartera_fab",
        tabId,
      });
      const outcome = String(switchResult.operation?.outcomeCode ?? "")
        .trim()
        .toLowerCase();
      if (!switchResult.success && outcome !== "already_active") {
        toast.warning(
          switchResult.message || "No se pudo activar la gestion seleccionada."
        );
        return;
      }

      setIsSeguimientoDraftOpen(true);
      return;
    }

    const startScopeKey = selectedContextKey || "consulta_cartera_start";
    const startLock = acquireActionLock({
      scopeKey: startScopeKey,
      action: "start_gestion_session",
      ownerId: tabId,
      ttlMs: 15_000,
    });

    if (!startLock.acquired || isStartingGestionRef.current) {
      toast.info(
        "Ya hay un inicio de gestion en curso. Espera unos segundos e intenta de nuevo."
      );
      return;
    }

    isStartingGestionRef.current = true;

    try {
      const startResult = await startGestionSession({
        cliente: selectedCliente,
        factura: selectedFactura,
        cuenta: selectedCuenta,
        idempotencyKey: createStartIdempotencyKey(),
        source: "consulta_cartera_fab",
        tabId,
      });

      await refreshSessions();

      if (!startResult.success) {
        const outcome = String(startResult.operation?.outcomeCode ?? "")
          .trim()
          .toLowerCase();
        if (
          startResult.statusCode === 409 &&
          outcome === "conflict_active_session"
        ) {
          setShowGestionConflictModal(true);
          return;
        }

        toast.warning(
          startResult.message || "No fue posible iniciar una gestion temporal."
        );
        return;
      }

      setIsSeguimientoDraftOpen(true);

      if (
        startResult.operation?.outcomeCode &&
        startResult.operation.outcomeCode.toLowerCase() === "idempotent_replay"
      ) {
        toast.info("Se reutilizo el inicio de gestion ya enviado.");
      } else {
        toast.success("Gestion temporal iniciada.");
      }
    } finally {
      isStartingGestionRef.current = false;
      releaseActionLock({
        scopeKey: startScopeKey,
        action: "start_gestion_session",
        ownerId: tabId,
      });
    }
  }, [
    activeGestionSession,
    currentContextGestionSession,
    gestionOperativaActiva,
    hasFullSelection,
    isSameActiveContext,
    refreshSessions,
    selectedCliente,
    selectedContextKey,
    selectedCuenta,
    selectedFactura,
    setActiveTab,
    setIsSeguimientoDraftOpen,
    startGestionSession,
    switchActiveSession,
    switchBlockedReason,
    tabId,
  ]);

  const hasActiveGestionInContext = Boolean(currentContextGestionSession);
  const gestionStatusLabel = hasActiveGestionInContext
    ? currentContextGestionSession?.status || "activa"
    : "sin_gestion";
  const gestionElapsedLabel = formatElapsedHhMmSs(gestionElapsedSeconds);
  const fabDisabled =
    !hasFullSelection || loadingStartGestionSession || isSwitchingGestionContext;
  const fabLabel = gestionOperativaActiva
    ? isSeguimientoDraftOpen
      ? "Ocultar seguimiento"
      : "Abrir seguimiento"
    : currentContextGestionSession
      ? "Activar gestion"
      : "Iniciar gestión";

  return useMemo(
    () => ({
      activeGestionSession,
      currentContextGestionSession,
      fabDisabled,
      fabLabel,
      gestionElapsedLabel,
      gestionOperativaActiva,
      gestionStatusLabel,
      handleConfirmSwitchToSelectedContext,
      handleContinueCurrentActiveGestion,
      handleGestionSessionFabClick,
      handleHideGestionConflictModal,
      hasActiveGestionInContext,
      hasLiveCall,
      isSameActiveContext,
      isSwitchingGestionContext,
      listInProgressGestionSessions,
      loadingStartGestionSession,
      loadingTransitionGestionSession,
      refreshSessions,
      showGestionConflictModal,
      startGestionSession,
      switchBlockedReason,
      transitionGestionSession,
    }),
    [
      activeGestionSession,
      currentContextGestionSession,
      fabDisabled,
      fabLabel,
      gestionElapsedLabel,
      gestionOperativaActiva,
      gestionStatusLabel,
      handleConfirmSwitchToSelectedContext,
      handleContinueCurrentActiveGestion,
      handleGestionSessionFabClick,
      handleHideGestionConflictModal,
      hasActiveGestionInContext,
      hasLiveCall,
      isSameActiveContext,
      isSwitchingGestionContext,
      listInProgressGestionSessions,
      loadingStartGestionSession,
      loadingTransitionGestionSession,
      refreshSessions,
      showGestionConflictModal,
      startGestionSession,
      switchBlockedReason,
      transitionGestionSession,
    ]
  );
}
