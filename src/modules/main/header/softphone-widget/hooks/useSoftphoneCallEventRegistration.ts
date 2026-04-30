import { useCallback, useEffect, useRef } from "react";
import { upsertPendingInboundCall } from "@app/services/GestionLlamadas";
import { useGestionLlamadaService } from "@app/services/GestionLlamadaService";
import type { GestionLlamadaEventType } from "@app/services/GestionLlamadaService";
import type { GestionSession } from "@app/services/GestionSessionService";
import type { WebRtcCallDto } from "@app/services/WebRtc/webrtcService";
import {
  subscribeGlobalWebRtcCallEnded,
  subscribeGlobalWebRtcCallStarted,
  subscribeGlobalWebRtcCallStatusChanged,
} from "@app/services/WebRtc/webrtcBridge";
import { buildSoftphoneCallEventRegistration } from "@app/services/WebRtc/softphoneWidgetHelpers";

interface UseSoftphoneCallEventRegistrationOptions {
  activeSession: Pick<GestionSession, "idGestionSession" | "sessionRef"> | null;
}

export function useSoftphoneCallEventRegistration({
  activeSession,
}: UseSoftphoneCallEventRegistrationOptions): void {
  const { registrarEventoLlamada } = useGestionLlamadaService();
  const activeSessionRef = useRef(activeSession);
  activeSessionRef.current = activeSession;

  const registerCallEvent = useCallback(
    async (
      eventType: GestionLlamadaEventType,
      call: WebRtcCallDto | null
    ) => {
      const registration = buildSoftphoneCallEventRegistration({
        activeSession: activeSessionRef.current,
        call,
        eventType,
      });

      if (!registration) {
        return;
      }

      const response = await registrarEventoLlamada(registration.request);

      if (!response?.success) {
        console.warn(
          registration.isInbound
            ? "[SoftphoneWidget] No se pudo registrar inbound provisional"
            : "[SoftphoneWidget] No se pudo registrar outbound ligado",
          {
            eventType,
            callSid: registration.request.callSid,
            message: response?.message ?? "sin respuesta",
            statusCode: response?.statusCode ?? null,
          }
        );
      }

      if (registration.pendingInboundCall) {
        upsertPendingInboundCall(registration.pendingInboundCall);
      }
    },
    [registrarEventoLlamada]
  );

  useEffect(() => {
    const unsubscribeStarted = subscribeGlobalWebRtcCallStarted((call) => {
      void registerCallEvent("start", call);
    });
    const unsubscribeStatus = subscribeGlobalWebRtcCallStatusChanged((call) => {
      void registerCallEvent("status", call);
    });
    const unsubscribeEnded = subscribeGlobalWebRtcCallEnded((call) => {
      void registerCallEvent("end", call);
    });

    return () => {
      unsubscribeStarted();
      unsubscribeStatus();
      unsubscribeEnded();
    };
  }, [registerCallEvent]);
}
