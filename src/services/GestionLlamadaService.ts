import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";
import { ApiResponse } from "@app/models/apiResponse";

export type GestionLlamadaEventType = "start" | "status" | "end";

export interface GestionLlamadaEventRequest {
  idGestionSession?: number;
  sessionRef?: string;
  callSid: string;
  eventType: GestionLlamadaEventType;
  direction?: string | null;
  status?: string | null;
  finalStatus?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  durationSec?: number | null;
  costFinal?: number | null;
  currency?: string | null;
  recordingSid?: string | null;
  source?: string;
}

export interface GestionLlamadaEventOperation {
  outcomeCode?: string;
  id?: number;
  idGestionSession?: number | null;
  sessionRef?: string | null;
  idGestion?: number | null;
  callSid?: string;
  direction?: string | null;
  status?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  durationSec?: number | null;
  syncStatus?: string | null;
}

export function useGestionLlamadaService() {
  const eventApi = useApi<GestionLlamadaEventOperation>("/api/v1/gestion-llamada/event", {
    retries: 2,
    retryDelay: 500,
    timeout: 10000,
  });
  const eventRequest = eventApi.request;

  const registrarEventoLlamada = useCallback(
    async (
      request: GestionLlamadaEventRequest
    ): Promise<ApiResponse<GestionLlamadaEventOperation> | null> => {
      return await eventRequest({
        method: "POST",
        data: request,
      });
    },
    [eventRequest]
  );

  return {
    registrarEventoLlamada,
    loadingRegistrarEventoLlamada: eventApi.loading,
    errorRegistrarEventoLlamada: eventApi.error,
  };
}
