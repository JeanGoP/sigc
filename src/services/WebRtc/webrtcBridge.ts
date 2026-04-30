import { AdvisorInternalState, WebRtcCallDto } from "@app/services/WebRtc/webrtcService";
import { WebRtcUiError } from "@app/services/WebRtc/webrtcLogger";
import { DEFAULT_GLOBAL_WEBRTC_RUNTIME_SNAPSHOT } from "./runtimeContracts";
import type { GlobalWebRtcRuntimeSnapshot } from "./runtimeContracts";

export interface WebRtcOutboundDialRequest {
  destination: string;
  from?: string | null;
  source?: "manual" | "retry" | "external";
}

export interface WebRtcOutboundDialResult {
  ok: boolean;
  error?: WebRtcUiError | null;
  message?: string;
}

export interface WebRtcAdvisorStateChangeResult {
  ok: boolean;
  error?: WebRtcUiError | null;
  message?: string;
}

type OutboundDialHandler = (
  request: WebRtcOutboundDialRequest
) => Promise<WebRtcOutboundDialResult>;
type AdvisorStateChangeHandler = (
  nextState: AdvisorInternalState
) => Promise<WebRtcAdvisorStateChangeResult>;
export type WebRtcCallControlAction =
  | "accept_incoming"
  | "reject_incoming"
  | "hangup"
  | "toggle_mute";

export interface WebRtcCallControlResult {
  ok: boolean;
  error?: WebRtcUiError | null;
  message?: string;
  muted?: boolean;
}

type CallControlHandler = (
  action: WebRtcCallControlAction
) => Promise<WebRtcCallControlResult>;
type CallListener = (call: WebRtcCallDto) => void;
type CallEndedListener = (call: WebRtcCallDto | null) => void;
type CallActivityListener = (inProgress: boolean) => void;
type RuntimeSnapshotListener = (snapshot: GlobalWebRtcRuntimeSnapshot) => void;

let outboundDialHandler: OutboundDialHandler | null = null;
let advisorStateChangeHandler: AdvisorStateChangeHandler | null = null;
let callControlHandler: CallControlHandler | null = null;
const callStartedListeners = new Set<CallListener>();
const callEndedListeners = new Set<CallEndedListener>();
const callStatusListeners = new Set<CallListener>();
const callActivityListeners = new Set<CallActivityListener>();
const runtimeSnapshotListeners = new Set<RuntimeSnapshotListener>();

let runtimeSnapshot: GlobalWebRtcRuntimeSnapshot =
  DEFAULT_GLOBAL_WEBRTC_RUNTIME_SNAPSHOT;

function createUnsubscribe<T>(listeners: Set<T>, listener: T): () => void {
  return () => {
    listeners.delete(listener);
  };
}

export function registerGlobalWebRtcOutboundDialHandler(
  handler: OutboundDialHandler | null
): void {
  outboundDialHandler = handler;
}

export function registerGlobalWebRtcAdvisorStateChangeHandler(
  handler: AdvisorStateChangeHandler | null
): void {
  advisorStateChangeHandler = handler;
}

export function registerGlobalWebRtcCallControlHandler(
  handler: CallControlHandler | null
): void {
  callControlHandler = handler;
}

export async function requestGlobalWebRtcOutboundDial(
  request: WebRtcOutboundDialRequest
): Promise<WebRtcOutboundDialResult> {
  if (!outboundDialHandler) {
    return {
      ok: false,
      message: "El softphone aun no esta listo. Intenta nuevamente.",
    };
  }

  return outboundDialHandler(request);
}

export async function requestGlobalWebRtcAdvisorStateChange(
  nextState: AdvisorInternalState
): Promise<WebRtcAdvisorStateChangeResult> {
  if (!advisorStateChangeHandler) {
    return {
      ok: false,
      message: "El softphone aun no esta listo para cambiar estado.",
    };
  }

  return advisorStateChangeHandler(nextState);
}

export async function requestGlobalWebRtcCallControl(
  action: WebRtcCallControlAction
): Promise<WebRtcCallControlResult> {
  if (!callControlHandler) {
    return {
      ok: false,
      message: "El softphone aun no esta listo para esta accion.",
    };
  }

  return callControlHandler(action);
}

export function emitGlobalWebRtcCallStarted(call: WebRtcCallDto): void {
  callStartedListeners.forEach((listener) => listener(call));
}

export function emitGlobalWebRtcCallEnded(call: WebRtcCallDto | null): void {
  callEndedListeners.forEach((listener) => listener(call));
}

export function emitGlobalWebRtcCallStatusChanged(call: WebRtcCallDto): void {
  callStatusListeners.forEach((listener) => listener(call));
}

export function emitGlobalWebRtcCallActivityChanged(inProgress: boolean): void {
  callActivityListeners.forEach((listener) => listener(inProgress));
}

export function subscribeGlobalWebRtcCallStarted(
  listener: CallListener
): () => void {
  callStartedListeners.add(listener);
  return createUnsubscribe(callStartedListeners, listener);
}

export function subscribeGlobalWebRtcCallEnded(
  listener: CallEndedListener
): () => void {
  callEndedListeners.add(listener);
  return createUnsubscribe(callEndedListeners, listener);
}

export function subscribeGlobalWebRtcCallStatusChanged(
  listener: CallListener
): () => void {
  callStatusListeners.add(listener);
  return createUnsubscribe(callStatusListeners, listener);
}

export function subscribeGlobalWebRtcCallActivityChanged(
  listener: CallActivityListener
): () => void {
  callActivityListeners.add(listener);
  return createUnsubscribe(callActivityListeners, listener);
}

export function subscribeGlobalWebRtcRuntimeSnapshot(
  listener: RuntimeSnapshotListener
): () => void {
  runtimeSnapshotListeners.add(listener);
  listener(runtimeSnapshot);
  return createUnsubscribe(runtimeSnapshotListeners, listener);
}

export function getGlobalWebRtcRuntimeSnapshot(): GlobalWebRtcRuntimeSnapshot {
  return runtimeSnapshot;
}

export function setGlobalWebRtcRuntimeSnapshot(
  patch: Partial<GlobalWebRtcRuntimeSnapshot>
): void {
  runtimeSnapshot = {
    ...runtimeSnapshot,
    ...patch,
  };
  runtimeSnapshotListeners.forEach((listener) => listener(runtimeSnapshot));
}
