import { AdvisorInternalState } from "@app/services/WebRtc/webrtcService";

export const AdvisorInternalStateOrder: readonly AdvisorInternalState[] = [
  "disponible",
  "ocupado_llamada",
  "break",
  "almuerzo",
  "bio",
  "offline",
];

const AdvisorInternalStateLabels: Record<AdvisorInternalState, string> = {
  disponible: "Disponible",
  ocupado_llamada: "Ocupado en llamada",
  break: "Break",
  almuerzo: "Almuerzo",
  bio: "Bio",
  offline: "Offline",
};

export function getAdvisorInternalStateLabel(state: AdvisorInternalState): string {
  return AdvisorInternalStateLabels[state];
}

export function mapAdvisorInternalStateToCommsAvailability(
  state: AdvisorInternalState
): "available" | "busy" {
  return state === "disponible" ? "available" : "busy";
}
