import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "react-toastify";
import type { GestionLlamadaEventType } from "@app/services/GestionLlamadaService";
import { useGestionLlamadaService } from "@app/services/GestionLlamadaService";
import {
  getPendingInboundCalls,
  removePendingInboundCall,
  subscribePendingInboundCalls,
  type PendingInboundCallSnapshot,
} from "@app/services/GestionLlamadas";
import {
  normalizeClienteTelefono,
  useClienteTelefonoAlternoService,
  type ClienteTelefonoAlternoDto,
} from "@app/services/ClienteTelefonoAlternoService";
import {
  requestGlobalWebRtcOutboundDial,
  subscribeGlobalWebRtcCallEnded,
  subscribeGlobalWebRtcCallStarted,
} from "@app/services/WebRtc/webrtcBridge";
import type { WebRtcCallDto } from "@app/services/WebRtc/webrtcService";
import { isTerminalCallStatus } from "../domain/helpers";
import {
  buildPendingOutboundAlternatePhoneCandidate,
  buildPendingSaveAlternatePhonePrompt,
  findExistingAlternatePhoneByDestination,
  matchesEndedCallToOutboundCandidate,
  shouldAssignStartedCallToOutboundCandidate,
  shouldPromptSaveAlternatePhone,
  type PendingOutboundAlternatePhoneCandidate,
  type PendingSaveAlternatePhonePrompt,
} from "../domain/telephony";

interface ActiveGestionSessionLike {
  idGestionSession?: number | null;
  sessionRef?: string | null;
}

interface UseConsultaCarteraTelephonyOptions {
  activeGestionSession: ActiveGestionSessionLike | null;
  telephonyEnabled: boolean;
  gestionOperativaActiva: boolean;
  hasLiveCall: boolean;
  numeroPrincipalCliente: string;
  selectedCliente: string;
}

export function useConsultaCarteraTelephony({
  activeGestionSession,
  telephonyEnabled,
  gestionOperativaActiva,
  hasLiveCall,
  numeroPrincipalCliente,
  selectedCliente,
}: UseConsultaCarteraTelephonyOptions) {
  const {
    listarTelefonosAlternos,
    guardarTelefonoAlterno,
    marcarTelefonoAlternoComoUsado,
    loadingTelefonosAlternos,
    loadingGuardarTelefonoAlterno,
  } = useClienteTelefonoAlternoService();
  const { registrarEventoLlamada } = useGestionLlamadaService();

  const selectedClienteRef = useRef(selectedCliente);
  const pendingOutboundAlternatePhoneCandidateRef =
    useRef<PendingOutboundAlternatePhoneCandidate | null>(null);
  const alternatePhonesLoadRequestIdRef = useRef(0);

  const [dialDestination, setDialDestination] = useState("");
  const [showOutboundCallModal, setShowOutboundCallModal] = useState(false);
  const [telefonosAlternosCliente, setTelefonosAlternosCliente] = useState<
    ClienteTelefonoAlternoDto[]
  >([]);
  const [pendingSaveAlternatePhonePrompt, setPendingSaveAlternatePhonePrompt] =
    useState<PendingSaveAlternatePhonePrompt | null>(null);
  const [showSaveAlternatePhoneModal, setShowSaveAlternatePhoneModal] =
    useState(false);
  const [alternatePhoneLabel, setAlternatePhoneLabel] = useState("");
  const [alternatePhoneObservation, setAlternatePhoneObservation] =
    useState("");
  const [pendingInboundCalls, setPendingInboundCalls] = useState<
    PendingInboundCallSnapshot[]
  >(() => getPendingInboundCalls());
  const [isAssociatingInboundCall, setIsAssociatingInboundCall] =
    useState(false);
  const [wrongNumHovered, setWrongNumHovered] = useState(false);

  useEffect(() => {
    selectedClienteRef.current = selectedCliente;
    alternatePhonesLoadRequestIdRef.current += 1;
    setTelefonosAlternosCliente([]);
  }, [selectedCliente]);

  useEffect(() => {
    return subscribePendingInboundCalls((calls) => {
      setPendingInboundCalls(calls);
    });
  }, []);

  useEffect(() => {
    setDialDestination(numeroPrincipalCliente);
  }, [numeroPrincipalCliente]);

  const isCallInProgress = telephonyEnabled && hasLiveCall;
  const canStartOutboundCall = telephonyEnabled && gestionOperativaActiva;
  const startCallBlockedReason = telephonyEnabled
    ? "Debes iniciar una gestión activa para poder llamar."
    : "La telefonia no esta habilitada para esta empresa.";
  const pendingInboundCount = telephonyEnabled ? pendingInboundCalls.length : 0;
  const hasPendingInboundCalls = telephonyEnabled && pendingInboundCount > 0;
  const nextPendingInboundCall = hasPendingInboundCalls
    ? pendingInboundCalls[0]
    : null;
  const telefonosAlternosActivos = telefonosAlternosCliente.filter(
    (item) => item.activo
  );

  const loadClienteTelefonosAlternos = useCallback(
    async (
      cliente: string,
      options?: { silent?: boolean }
    ): Promise<ClienteTelefonoAlternoDto[]> => {
      const clienteTrim = String(cliente ?? "").trim();
      if (!clienteTrim) {
        setTelefonosAlternosCliente([]);
        return [];
      }

      const requestId = ++alternatePhonesLoadRequestIdRef.current;
      const response = await listarTelefonosAlternos(clienteTrim);
      const data =
        response?.success && Array.isArray(response.data) ? response.data : [];
      const isCurrentClient =
        selectedClienteRef.current === clienteTrim &&
        requestId === alternatePhonesLoadRequestIdRef.current;

      if (isCurrentClient) {
        setTelefonosAlternosCliente(data);
      }

      if (response?.success) {
        return data;
      }

      if (!options?.silent) {
        toast.warning(
          response?.message ||
            "No fue posible cargar los telefonos alternos del cliente."
        );
      }

      return [];
    },
    [listarTelefonosAlternos]
  );

  const handleCloseSaveAlternatePhoneModal = useCallback(() => {
    if (loadingGuardarTelefonoAlterno) {
      return;
    }

    setShowSaveAlternatePhoneModal(false);
    setPendingSaveAlternatePhonePrompt(null);
    setAlternatePhoneLabel("");
    setAlternatePhoneObservation("");
  }, [loadingGuardarTelefonoAlterno]);

  const handleSubmitSaveAlternatePhone = useCallback(
    async (event?: FormEvent<HTMLFormElement>): Promise<void> => {
      event?.preventDefault();

      const prompt = pendingSaveAlternatePhonePrompt;
      if (!prompt) {
        return;
      }

      const etiqueta = String(alternatePhoneLabel ?? "").trim();
      const observacion = String(alternatePhoneObservation ?? "").trim();
      if (!etiqueta) {
        toast.warning(
          "Debes indicar una etiqueta para guardar el numero alterno."
        );
        return;
      }

      const response = await guardarTelefonoAlterno(prompt.cliente, {
        telefono: prompt.telefono,
        etiqueta,
        observacion: observacion || null,
      });

      if (!response?.success) {
        toast.warning(
          response?.message || "No fue posible guardar el numero alterno."
        );
        return;
      }

      const outcome = String(response.data?.outcomeCode ?? "")
        .trim()
        .toLowerCase();

      if (selectedClienteRef.current === prompt.cliente) {
        void loadClienteTelefonosAlternos(prompt.cliente, { silent: true });
      }

      handleCloseSaveAlternatePhoneModal();

      if (outcome === "reactivated") {
        toast.success("Numero alterno reactivado correctamente.");
        return;
      }

      if (outcome === "updated_existing") {
        toast.success("Numero alterno actualizado correctamente.");
        return;
      }

      toast.success("Numero alterno guardado correctamente.");
    },
    [
      alternatePhoneLabel,
      alternatePhoneObservation,
      guardarTelefonoAlterno,
      handleCloseSaveAlternatePhoneModal,
      loadClienteTelefonosAlternos,
      pendingSaveAlternatePhonePrompt,
    ]
  );

  const handleAttachPendingInboundToActiveSession = useCallback(
    async (): Promise<void> => {
      if (isAssociatingInboundCall) {
        return;
      }

      const pendingCall = nextPendingInboundCall;
      if (!pendingCall?.callSid) {
        toast.info("No hay llamadas entrantes pendientes por asociar.");
        return;
      }

      if (
        !gestionOperativaActiva ||
        !activeGestionSession?.idGestionSession ||
        !activeGestionSession?.sessionRef
      ) {
        toast.warning(
          "Debes tener una gestion activa para asociar la llamada entrante pendiente."
        );
        return;
      }

      setIsAssociatingInboundCall(true);
      try {
        const shouldCloseEvent =
          Boolean(pendingCall.endedAt) || isTerminalCallStatus(pendingCall.status);
        const eventType: GestionLlamadaEventType = shouldCloseEvent
          ? "end"
          : "status";
        const fallbackStatus = shouldCloseEvent ? "completed" : "in-progress";

        const response = await registrarEventoLlamada({
          idGestionSession: activeGestionSession.idGestionSession,
          sessionRef: activeGestionSession.sessionRef,
          callSid: pendingCall.callSid,
          eventType,
          direction: pendingCall.direction ?? "inbound-client",
          status: pendingCall.status ?? fallbackStatus,
          finalStatus: shouldCloseEvent
            ? pendingCall.status ?? fallbackStatus
            : null,
          startedAt: pendingCall.startedAt ?? null,
          endedAt: shouldCloseEvent
            ? pendingCall.endedAt ?? new Date().toISOString()
            : pendingCall.endedAt ?? null,
          source: "consulta_cartera_inbound_attach",
        });

        if (!response?.success) {
          toast.warning(
            response?.message ||
              "No se pudo asociar la llamada entrante a la gestion activa."
          );
          return;
        }

        removePendingInboundCall(pendingCall.callSid);
        toast.success("Llamada entrante asociada a la gestion activa.");
      } catch (error) {
        console.error("Error asociando llamada inbound pendiente:", error);
        toast.error("Error inesperado asociando llamada inbound pendiente.");
      } finally {
        setIsAssociatingInboundCall(false);
      }
    },
    [
      activeGestionSession?.idGestionSession,
      activeGestionSession?.sessionRef,
      gestionOperativaActiva,
      isAssociatingInboundCall,
      nextPendingInboundCall,
      registrarEventoLlamada,
    ]
  );

  const handleDismissWrongNumberInbound = useCallback(async (): Promise<void> => {
    const pendingCall = nextPendingInboundCall;
    if (!pendingCall?.callSid) {
      return;
    }

    const confirmado = window.confirm(
      "¿Confirmas que esta llamada fue un número equivocado y deseas descartarla?\n\nEsta acción quedará registrada."
    );
    if (!confirmado) {
      return;
    }

    try {
      const shouldClose =
        Boolean(pendingCall.endedAt) || isTerminalCallStatus(pendingCall.status);
      await registrarEventoLlamada({
        callSid: pendingCall.callSid,
        eventType: shouldClose ? "end" : "status",
        direction: pendingCall.direction ?? "inbound-client",
        status:
          pendingCall.status ?? (shouldClose ? "completed" : "in-progress"),
        finalStatus: shouldClose ? pendingCall.status ?? "completed" : null,
        startedAt: pendingCall.startedAt ?? null,
        endedAt: shouldClose
          ? pendingCall.endedAt ?? new Date().toISOString()
          : null,
        source: "wrong_number_dismiss",
      });
    } catch {
      // Si el backend falla, igual limpiamos el estado local.
    }

    removePendingInboundCall(pendingCall.callSid);
    toast.success("Llamada descartada como numero equivocado.");
  }, [nextPendingInboundCall, registrarEventoLlamada]);

  const handleOutboundCallClick = useCallback(async (): Promise<boolean> => {
    if (!canStartOutboundCall) {
      toast.warning(startCallBlockedReason);
      return false;
    }

    if (isCallInProgress) {
      toast.info("Ya existe una llamada en curso.");
      return false;
    }

    const destination = String(dialDestination ?? "").trim();
    if (!destination) {
      toast.warning("Debes ingresar el numero destino.");
      return false;
    }

    pendingOutboundAlternatePhoneCandidateRef.current =
      buildPendingOutboundAlternatePhoneCandidate({
        cliente: selectedCliente,
        telefonoPrincipal: numeroPrincipalCliente,
        telefonoDestino: destination,
      });

    const result = await requestGlobalWebRtcOutboundDial({
      destination,
      source: "external",
    });

    if (result.ok) {
      return true;
    }

    pendingOutboundAlternatePhoneCandidateRef.current = null;

    const code = String(result.error?.code ?? "").trim();
    if (code === "WEBRTC_OWNER_REQUIRED") {
      toast.info(
        result.error?.message ||
          "Esta pestaña está en modo acompañante. Usa la pestaña dueña del softphone."
      );
      return false;
    }

    toast.warning(
      result.error?.message ||
        result.message ||
        "No fue posible iniciar la llamada."
    );
    return false;
  }, [
    canStartOutboundCall,
    dialDestination,
    isCallInProgress,
    numeroPrincipalCliente,
    selectedCliente,
    startCallBlockedReason,
  ]);

  const handleOpenOutboundCallModal = useCallback(() => {
    if (!canStartOutboundCall) {
      toast.warning(startCallBlockedReason);
      return;
    }

    if (isCallInProgress) {
      toast.info("Ya existe una llamada en curso.");
      return;
    }

    setDialDestination(numeroPrincipalCliente);
    setShowOutboundCallModal(true);
    if (selectedCliente) {
      void loadClienteTelefonosAlternos(selectedCliente, { silent: true });
    }
  }, [
    canStartOutboundCall,
    isCallInProgress,
    loadClienteTelefonosAlternos,
    numeroPrincipalCliente,
    selectedCliente,
    startCallBlockedReason,
  ]);

  const handleCloseOutboundCallModal = useCallback(() => {
    setShowOutboundCallModal(false);
  }, []);

  const handleSubmitOutboundCallModal = useCallback(
    async (event?: FormEvent<HTMLFormElement>): Promise<void> => {
      event?.preventDefault();
      const started = await handleOutboundCallClick();
      if (started) {
        setShowOutboundCallModal(false);
      }
    },
    [handleOutboundCallClick]
  );

  const handleOutboundCallStartedForAlternatePhones = useCallback(
    (call: WebRtcCallDto) => {
      const candidate = pendingOutboundAlternatePhoneCandidateRef.current;
      if (
        !shouldAssignStartedCallToOutboundCandidate(candidate, call)
      ) {
        if (
          candidate &&
          Date.now() - candidate.createdAtMs > 60_000
        ) {
          pendingOutboundAlternatePhoneCandidateRef.current = null;
        }
        return;
      }

      if (!candidate) {
        return;
      }

      pendingOutboundAlternatePhoneCandidateRef.current = {
        ...candidate,
        callSid: call.callSid,
      };
    },
    []
  );

  const handleOutboundCallEndedForAlternatePhones = useCallback(
    async (call: WebRtcCallDto | null): Promise<void> => {
      const candidate = pendingOutboundAlternatePhoneCandidateRef.current;
      if (!matchesEndedCallToOutboundCandidate(candidate, call)) {
        return;
      }

      if (!candidate) {
        return;
      }

      pendingOutboundAlternatePhoneCandidateRef.current = null;

      if (!shouldPromptSaveAlternatePhone(candidate)) {
        return;
      }

      const listResponse = await listarTelefonosAlternos(candidate.cliente);
      const existingAlternos =
        listResponse?.success && Array.isArray(listResponse.data)
          ? listResponse.data
          : [];
      const existingAlternatePhone = findExistingAlternatePhoneByDestination(
        existingAlternos,
        candidate.telefonoDestinoNormalizado
      );

      if (existingAlternatePhone) {
        const markUsedResponse = await marcarTelefonoAlternoComoUsado(
          candidate.cliente,
          {
            telefono: candidate.telefonoDestino,
          }
        );

        if (!markUsedResponse?.success) {
          console.warn(
            "[ConsultaCartera] No se pudo marcar uso del telefono alterno",
            {
              cliente: candidate.cliente,
              telefono: candidate.telefonoDestino,
              message: markUsedResponse?.message ?? "sin respuesta",
            }
          );
        }

        if (selectedClienteRef.current === candidate.cliente) {
          void loadClienteTelefonosAlternos(candidate.cliente, { silent: true });
        }
        return;
      }

      if (
        selectedClienteRef.current === candidate.cliente &&
        existingAlternos.length > 0
      ) {
        setTelefonosAlternosCliente(existingAlternos);
      }

      setPendingSaveAlternatePhonePrompt(
        buildPendingSaveAlternatePhonePrompt(candidate)
      );
      setAlternatePhoneLabel("");
      setAlternatePhoneObservation("");
      setShowSaveAlternatePhoneModal(true);
    },
    [
      listarTelefonosAlternos,
      loadClienteTelefonosAlternos,
      marcarTelefonoAlternoComoUsado,
    ]
  );

  useEffect(() => {
    if (!telephonyEnabled) {
      return undefined;
    }

    const unsubscribeStarted = subscribeGlobalWebRtcCallStarted((call) => {
      handleOutboundCallStartedForAlternatePhones(call);
    });
    const unsubscribeEnded = subscribeGlobalWebRtcCallEnded((call) => {
      void handleOutboundCallEndedForAlternatePhones(call);
    });

    return () => {
      unsubscribeStarted();
      unsubscribeEnded();
    };
  }, [
    handleOutboundCallEndedForAlternatePhones,
    handleOutboundCallStartedForAlternatePhones,
    telephonyEnabled,
  ]);

  const openWhatsApp = useCallback((telefono: string) => {
    const numeroLimpio = String(telefono ?? "").replace(/\D/g, "");
    window.open(`https://wa.me/${numeroLimpio}`, "_blank");
  }, []);

  const isDialDestinationSelected = useCallback(
    (phone: string): boolean =>
      normalizeClienteTelefono(dialDestination) ===
      normalizeClienteTelefono(phone),
    [dialDestination]
  );

  return useMemo(
    () => ({
      alternatePhoneLabel,
      alternatePhoneObservation,
      canStartOutboundCall,
      dialDestination,
      handleAttachPendingInboundToActiveSession,
      handleCloseOutboundCallModal,
      handleCloseSaveAlternatePhoneModal,
      handleDismissWrongNumberInbound,
      handleOpenOutboundCallModal,
      handleSubmitOutboundCallModal,
      handleSubmitSaveAlternatePhone,
      hasPendingInboundCalls,
      isAssociatingInboundCall,
      isCallInProgress,
      isDialDestinationSelected,
      loadingGuardarTelefonoAlterno,
      loadingTelefonosAlternos,
      nextPendingInboundCall,
      openWhatsApp,
      pendingSaveAlternatePhonePrompt,
      setAlternatePhoneLabel,
      setAlternatePhoneObservation,
      setDialDestination,
      setWrongNumHovered,
      showOutboundCallModal,
      showSaveAlternatePhoneModal,
      startCallBlockedReason,
      telefonosAlternosActivos,
      wrongNumHovered,
    }),
    [
      alternatePhoneLabel,
      alternatePhoneObservation,
      canStartOutboundCall,
      dialDestination,
      handleAttachPendingInboundToActiveSession,
      handleCloseOutboundCallModal,
      handleCloseSaveAlternatePhoneModal,
      handleDismissWrongNumberInbound,
      handleOpenOutboundCallModal,
      handleSubmitOutboundCallModal,
      handleSubmitSaveAlternatePhone,
      hasPendingInboundCalls,
      isAssociatingInboundCall,
      isCallInProgress,
      isDialDestinationSelected,
      loadingGuardarTelefonoAlterno,
      loadingTelefonosAlternos,
      nextPendingInboundCall,
      openWhatsApp,
      pendingSaveAlternatePhonePrompt,
      showOutboundCallModal,
      showSaveAlternatePhoneModal,
      startCallBlockedReason,
      telefonosAlternosActivos,
      wrongNumHovered,
    ]
  );
}
