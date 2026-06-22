import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import type {
  Seguimiento,
  NuevoSeguimientoResult,
} from "@app/modules/maestros/tipos-eventos/TimelineSeguimientos";
import type { ApiResponse } from "@app/models/apiResponse";
import type {
  GestionFacturaInsertOperation,
  GestionesEventosFacturaResulta,
} from "@app/services/GestionFacturaService";
import type {
  GestionSession,
  GestionSessionListServiceResult,
} from "@app/services/GestionSessionService";
import {
  acquireActionLock,
  releaseActionLock,
} from "@app/services/GestionLlamadas";
import {
  buildCombinedApiErrorMessage,
  buildEventosXml,
  createSaveFallbackIdempotencyKey,
  wait,
} from "../domain/helpers";
import {
  buildGestionFacturaSaveRequest,
  buildSaveSeguimientoBlockedReason,
  buildSeguimientoDraftStorageKey,
  buildSeguimientoSelection,
  canSaveSeguimiento as canSaveSeguimientoValue,
  hasMatchingSeguimientoContext,
  mapGestionesFacturaResultToSeguimientos,
} from "../domain/seguimiento";
import {
  SAVE_SESSION_SYNC_RETRY_DELAYS_MS,
  findGestionSessionBySessionRef,
  isGestionSessionNonActiveStatus,
  normalizeGestionSessionStatus,
  normalizeSaveOutcomeCode,
  shouldCloseSeguimientoDraftAfterSave,
} from "../functions/gestionSessionSaveSync";

interface CurrentUserLike {
  id?: string | number;
  tenantId?: string | number;
}

interface RegistroSeleccionadoLike {
  cliente?: unknown;
  numefac?: unknown;
  cuenta?: unknown;
}

interface GestionSaveSyncResult {
  confirmedNonActive: boolean;
  sessionMissing: boolean;
  sessionStatus: string | null;
  synced: boolean;
}

interface UseConsultaCarteraSeguimientoOptions {
  currentUser?: CurrentUserLike | null;
  registroSeleccionado: RegistroSeleccionadoLike | null;
  hasFullSelection: boolean;
  activeGestionSession: GestionSession | null;
  gestionOperativaActiva: boolean;
  isCallInProgress: boolean;
  hasPendingInboundCalls: boolean;
  isAssociatingInboundCall: boolean;
  loadingInsertar: boolean;
  tabId: string;
  buscarGestiones: (
    factura: string,
    cliente: string,
    cuenta: string
  ) => Promise<ApiResponse<GestionesEventosFacturaResulta> | null>;
  GestionarFactura: (
    request: any
  ) => Promise<ApiResponse<GestionFacturaInsertOperation> | null>;
  listInProgressGestionSessions: () => Promise<GestionSessionListServiceResult>;
  refreshSessions: () => Promise<void>;
  setIsSeguimientoDraftOpen: (value: boolean) => void;
}

function renderMultilineToastMessage(message: string) {
  return createElement("span", { style: { whiteSpace: "pre-line" } }, message);
}

export function useConsultaCarteraSeguimiento({
  currentUser,
  registroSeleccionado,
  hasFullSelection,
  activeGestionSession,
  gestionOperativaActiva,
  isCallInProgress,
  hasPendingInboundCalls,
  isAssociatingInboundCall,
  loadingInsertar,
  tabId,
  buscarGestiones,
  GestionarFactura,
  listInProgressGestionSessions,
  refreshSessions,
  setIsSeguimientoDraftOpen,
}: UseConsultaCarteraSeguimientoOptions) {
  const buscarGestionesRef = useRef(buscarGestiones);
  const gestionarFacturaRef = useRef(GestionarFactura);
  const listInProgressGestionSessionsRef = useRef(listInProgressGestionSessions);
  const refreshSessionsRef = useRef(refreshSessions);
  const isSavingSeguimientoRef = useRef(false);
  const seguimientoLoadRequestIdRef = useRef(0);

  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [isSavingSeguimiento, setIsSavingSeguimiento] = useState(false);

  useEffect(() => {
    buscarGestionesRef.current = buscarGestiones;
  }, [buscarGestiones]);

  useEffect(() => {
    gestionarFacturaRef.current = GestionarFactura;
  }, [GestionarFactura]);

  useEffect(() => {
    listInProgressGestionSessionsRef.current = listInProgressGestionSessions;
  }, [listInProgressGestionSessions]);

  useEffect(() => {
    refreshSessionsRef.current = refreshSessions;
  }, [refreshSessions]);

  const selectedCliente = registroSeleccionado?.cliente;
  const selectedFactura = registroSeleccionado?.numefac;
  const selectedCuenta = registroSeleccionado?.cuenta;
  const selectedSelection = useMemo(
    () =>
      buildSeguimientoSelection({
        cliente: selectedCliente,
        numefac: selectedFactura,
        cuenta: selectedCuenta,
      }),
    [selectedCliente, selectedFactura, selectedCuenta]
  );
  const isSaveRequestInFlight = Boolean(isSavingSeguimiento || loadingInsertar);
  const canSaveSeguimiento = canSaveSeguimientoValue({
    gestionOperativaActiva,
    isCallInProgress,
    hasPendingInboundCalls,
    isAssociatingInboundCall,
    isSaveRequestInFlight,
  });
  const saveSeguimientoBlockedReason = buildSaveSeguimientoBlockedReason({
    gestionOperativaActiva,
    isCallInProgress,
    hasPendingInboundCalls,
    isAssociatingInboundCall,
    isSaveRequestInFlight,
  });
  const seguimientoDraftStorageKey = buildSeguimientoDraftStorageKey({
    tenantId: currentUser?.tenantId,
    userId: currentUser?.id,
    sessionRef: activeGestionSession?.sessionRef,
    cliente: selectedSelection?.cliente,
    factura: selectedSelection?.factura,
    cuenta: selectedSelection?.cuenta,
  });

  const cargarGestiones = useCallback(
    async (selectionOverride?: typeof selectedSelection): Promise<void> => {
      const selection = selectionOverride ?? selectedSelection;
      if (!selection) {
        return;
      }

      const requestId = ++seguimientoLoadRequestIdRef.current;

      try {
        const response = await buscarGestionesRef.current(
          selection.factura,
          selection.cliente,
          selection.cuenta
        );

        if (requestId !== seguimientoLoadRequestIdRef.current) {
          return;
        }

        if (response?.success && response.data) {
          setSeguimientos(mapGestionesFacturaResultToSeguimientos(response.data));
        }
      } catch (error) {
        if (requestId !== seguimientoLoadRequestIdRef.current) {
          return;
        }

        console.error("Error al cargar las gestiones:", error);
      }
    },
    [selectedSelection]
  );

  useEffect(() => {
    if (!hasFullSelection || !selectedSelection) {
      seguimientoLoadRequestIdRef.current += 1;
      setSeguimientos([]);
      return;
    }

    void cargarGestiones(selectedSelection);
  }, [
    cargarGestiones,
    hasFullSelection,
    selectedSelection,
  ]);

  const synchronizeGestionSessionAfterSave = useCallback(
    async (sessionRef: string): Promise<GestionSaveSyncResult> => {
      const normalizedSessionRef = String(sessionRef ?? "").trim();
      if (!normalizedSessionRef) {
        await refreshSessionsRef.current();
        return {
          confirmedNonActive: false,
          sessionMissing: false,
          sessionStatus: null,
          synced: false,
        };
      }

      await refreshSessionsRef.current();

      let lastKnownStatus: string | null = null;
      let hasSuccessfulSync = false;

      for (const delayMs of SAVE_SESSION_SYNC_RETRY_DELAYS_MS) {
        await wait(delayMs);

        const listResult = await listInProgressGestionSessionsRef.current();
        if (!listResult.success) {
          continue;
        }

        hasSuccessfulSync = true;
        const matchingSession = findGestionSessionBySessionRef(
          listResult.operation?.sessions ?? [],
          normalizedSessionRef
        );

        if (!matchingSession) {
          await refreshSessionsRef.current();
          return {
            confirmedNonActive: true,
            sessionMissing: true,
            sessionStatus: null,
            synced: true,
          };
        }

        const syncedStatus = normalizeGestionSessionStatus(matchingSession.status);
        lastKnownStatus = syncedStatus || null;

        if (isGestionSessionNonActiveStatus(syncedStatus)) {
          await refreshSessionsRef.current();
          return {
            confirmedNonActive: true,
            sessionMissing: false,
            sessionStatus: lastKnownStatus,
            synced: true,
          };
        }
      }

      await refreshSessionsRef.current();

      return {
        confirmedNonActive: isGestionSessionNonActiveStatus(lastKnownStatus),
        sessionMissing: false,
        sessionStatus: lastKnownStatus,
        synced: hasSuccessfulSync,
      };
    },
    []
  );

  const handleNuevoSeguimiento = useCallback(
    async (
      seguimiento: Omit<Seguimiento, "id" | "usuario" | "fecha" | "hora">
    ): Promise<NuevoSeguimientoResult> => {
      if (!selectedSelection) {
        toast.error("Debe seleccionar un cliente, factura y cuenta.");
        return { ok: false };
      }

      if (!currentUser?.id) {
        toast.error(
          "No hay usuario logueado. Por favor, inicie sesion nuevamente."
        );
        return { ok: false };
      }

      if (!gestionOperativaActiva) {
        toast.warning(
          "Debes iniciar una gestion activa antes de guardar seguimiento."
        );
        return { ok: false };
      }

      if (isCallInProgress) {
        toast.warning(
          "No puedes guardar mientras hay una llamada activa. Primero debes colgar."
        );
        return { ok: false };
      }

      if (hasPendingInboundCalls) {
        toast.warning(
          "Tienes una llamada entrante pendiente de asociar. Debes resolverla antes de guardar."
        );
        return { ok: false };
      }

      if (isAssociatingInboundCall) {
        toast.info("Espera a que termine la asociacion de la llamada entrante.");
        return { ok: false };
      }

      if (isSaveRequestInFlight || isSavingSeguimientoRef.current) {
        toast.info("Ya hay un guardado en curso. Espera a que termine.");
        return { ok: false };
      }

      const activeSessionId = activeGestionSession?.idGestionSession ?? null;
      const activeSessionRef = activeGestionSession?.sessionRef ?? null;

      if (!activeSessionId || !activeSessionRef) {
        toast.warning(
          "No se encontro una gestion activa valida. Inicia gestion antes de guardar."
        );
        return { ok: false };
      }

      const saveScopeKey = activeSessionRef;
      const saveLock = acquireActionLock({
        scopeKey: saveScopeKey,
        action: "save_seguimiento_final",
        ownerId: tabId,
        ttlMs: 45_000,
      });

      if (!saveLock.acquired) {
        toast.warning(
          "Ya hay un guardado/cierre en curso para esta gestion desde otra pestana."
        );
        return { ok: false };
      }

      isSavingSeguimientoRef.current = true;
      setIsSavingSeguimiento(true);

      try {
        if (
          !hasMatchingSeguimientoContext(activeGestionSession, selectedSelection)
        ) {
          toast.warning(
            "El contexto cambio mientras intentabas guardar. Verifica que estes en el cliente correcto e intenta de nuevo."
          );
          return { ok: false };
        }

        const eventosXml = buildEventosXml(seguimiento.eventos);
        const saveIdempotencyKey = createSaveFallbackIdempotencyKey();
        const request = buildGestionFacturaSaveRequest({
          registroSeleccionado: selectedSelection,
          currentUserId: Number.parseInt(String(currentUser.id), 10),
          seguimiento,
          eventosXml,
          activeSessionId,
          activeSessionRef,
          idempotencyKey: saveIdempotencyKey,
          tabId,
        });

        const responseGuardado = await gestionarFacturaRef.current(request);
        const outcomeCode = normalizeSaveOutcomeCode(
          responseGuardado?.data?.outcomeCode
        );
        const responseSessionStatus = normalizeGestionSessionStatus(
          responseGuardado?.data?.sessionStatus
        );

        if (responseGuardado?.success) {
          const idGestionFinal = responseGuardado?.data?.idGestionFinal ?? null;
          if (outcomeCode === "idempotent_replay") {
            toast.info("Este guardado ya habia sido procesado.");
          } else {
            toast.success("Proceso exitoso");
          }

          const syncResult = await synchronizeGestionSessionAfterSave(
            activeSessionRef
          );

          if (!syncResult.synced) {
            toast.warning(
              "El seguimiento se guardó correctamente, pero no se pudo confirmar el estado de la sesión. Recarga si algo parece incorrecto."
            );
          }

          const shouldCloseDraft = shouldCloseSeguimientoDraftAfterSave({
            outcomeCode,
            sessionStatus: responseSessionStatus,
            syncedSessionStatus: syncResult.sessionStatus,
            sessionMissing: syncResult.sessionMissing,
          });

          if (
            shouldCloseDraft &&
            !syncResult.confirmedNonActive &&
            !syncResult.sessionMissing
          ) {
            console.warn(
              "[ConsultaCartera] El guardado reporto cierre/no-activa pero la sincronizacion no lo confirmo todavia.",
              {
                outcomeCode,
                responseSessionStatus,
                syncedSessionStatus: syncResult.sessionStatus,
                synced: syncResult.synced,
                sessionRef: activeSessionRef,
              }
            );
          }

          if (shouldCloseDraft) {
            setIsSeguimientoDraftOpen(false);
          }

          await cargarGestiones(selectedSelection);
          return { ok: true, idGestionFinal };
        }

        if (responseGuardado?.statusCode === 409) {
          toast.warning(
            renderMultilineToastMessage(
              buildCombinedApiErrorMessage(
                responseGuardado,
                "La gestion ya fue cerrada por otro intento. Inicia una nueva gestion para continuar."
              )
            )
          );

          const syncResult = await synchronizeGestionSessionAfterSave(
            activeSessionRef
          );
          const shouldCloseDraft = shouldCloseSeguimientoDraftAfterSave({
            outcomeCode,
            sessionStatus: responseSessionStatus,
            syncedSessionStatus: syncResult.sessionStatus,
            sessionMissing: syncResult.sessionMissing,
          });

          if (shouldCloseDraft) {
            setIsSeguimientoDraftOpen(false);
          }

          await cargarGestiones(selectedSelection);
          return { ok: false };
        }

        toast.error(
          renderMultilineToastMessage(
            buildCombinedApiErrorMessage(
              responseGuardado,
              "Error al guardar el seguimiento"
            )
          )
        );
        return { ok: false };
      } catch (error) {
        console.error("Error al crear el seguimiento:", error);
        toast.error(
          error instanceof Error && error.message
            ? error.message
            : "Error al guardar el seguimiento"
        );
        return { ok: false };
      } finally {
        isSavingSeguimientoRef.current = false;
        setIsSavingSeguimiento(false);
        releaseActionLock({
          scopeKey: saveScopeKey,
          action: "save_seguimiento_final",
          ownerId: tabId,
        });
      }
    },
    [
      activeGestionSession,
      cargarGestiones,
      currentUser,
      gestionOperativaActiva,
      hasPendingInboundCalls,
      isAssociatingInboundCall,
      isCallInProgress,
      isSaveRequestInFlight,
      selectedSelection,
      setIsSeguimientoDraftOpen,
      synchronizeGestionSessionAfterSave,
      tabId,
    ]
  );

  return {
    canSaveSeguimiento,
    cargarGestiones,
    handleNuevoSeguimiento,
    isSaveRequestInFlight,
    isSavingSeguimiento,
    saveSeguimientoBlockedReason,
    seguimientoDraftStorageKey,
    seguimientos,
  };
}
