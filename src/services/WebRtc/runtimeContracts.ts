import type { WebRtcCallDto } from "./webrtcService";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "dialing"
  | "in_call"
  | "error";

export type PresenceAvailability = "available" | "busy" | "offline";

export interface GlobalWebRtcIncomingCallSnapshot {
  callSid: string;
  from?: string | null;
  to?: string | null;
  receivedAt: string;
}

export interface GlobalWebRtcRuntimeSnapshot {
  inProgress: boolean;
  connectionStatus: string;
  advisorInternalState: string;
  presenceStatus: string;
  softphoneStatus: string;
  isMuted: boolean;
  activeCall: WebRtcCallDto | null;
  incomingCall: GlobalWebRtcIncomingCallSnapshot | null;
}

export const DEFAULT_GLOBAL_WEBRTC_RUNTIME_SNAPSHOT: GlobalWebRtcRuntimeSnapshot =
  {
    inProgress: false,
    connectionStatus: "disconnected",
    advisorInternalState: "disponible",
    presenceStatus: "offline",
    softphoneStatus: "initializing",
    isMuted: false,
    activeCall: null,
    incomingCall: null,
  };

export const WEBRTC_OWNER_CHANNEL_KEY = "consulta_cartera_webrtc_owner";
export const WEBRTC_CALL_SUMMARY_AUTO_HIDE_MS = 16_000;
