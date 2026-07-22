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

const ADVISOR_INTERNAL_STATE_STORAGE_KEY = "sigc:webrtc:advisorInternalState";

export function getStoredAdvisorInternalState(): AdvisorInternalState | null {
  try {
    const stored = window.localStorage.getItem(ADVISOR_INTERNAL_STATE_STORAGE_KEY);
    if (stored && AdvisorInternalStateOrder.includes(stored as AdvisorInternalState)) {
      return stored as AdvisorInternalState;
    }
  } catch {
    // localStorage no disponible (modo privado, SSR, etc.)
  }

  return null;
}

export function setStoredAdvisorInternalState(state: AdvisorInternalState): void {
  try {
    window.localStorage.setItem(ADVISOR_INTERNAL_STATE_STORAGE_KEY, state);
  } catch {
    // localStorage no disponible (modo privado, SSR, etc.)
  }
}
