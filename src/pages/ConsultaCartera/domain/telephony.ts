import type { WebRtcCallDto } from "../../../services/WebRtc/webrtcService";
import {
  areEquivalentPhoneValues,
  isInboundCallDirection,
} from "./helpers";

export interface ClienteTelefonoAlternoLike {
  telefono: string;
  telefonoNormalizado?: string | null;
}

function normalizePhoneValue(value?: string | null): string {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }

  let normalized = "";
  for (let index = 0; index < raw.length; index += 1) {
    const current = raw[index];
    if (/\d/.test(current)) {
      normalized += current;
      continue;
    }

    if (current === "+" && normalized.length === 0) {
      normalized += current;
    }
  }

  if (normalized.startsWith("00")) {
    normalized = `+${normalized.slice(2)}`;
  }

  return normalized === "+" ? "" : normalized;
}

export interface PendingOutboundAlternatePhoneCandidate {
  cliente: string;
  telefonoPrincipalNormalizado: string;
  telefonoDestino: string;
  telefonoDestinoNormalizado: string;
  callSid?: string | null;
  createdAtMs: number;
}

export interface PendingSaveAlternatePhonePrompt {
  cliente: string;
  telefono: string;
  telefonoNormalizado: string;
}

interface BuildPendingOutboundAlternatePhoneCandidateInput {
  cliente: string;
  telefonoPrincipal: string;
  telefonoDestino: string;
  nowMs?: number;
}

export function buildPendingOutboundAlternatePhoneCandidate({
  cliente,
  telefonoPrincipal,
  telefonoDestino,
  nowMs = Date.now(),
}: BuildPendingOutboundAlternatePhoneCandidateInput): PendingOutboundAlternatePhoneCandidate | null {
  const clienteTrim = String(cliente ?? "").trim();
  const telefonoDestinoTrim = String(telefonoDestino ?? "").trim();
  if (!clienteTrim || !telefonoDestinoTrim) {
    return null;
  }

  return {
    cliente: clienteTrim,
    telefonoPrincipalNormalizado: normalizePhoneValue(telefonoPrincipal),
    telefonoDestino: telefonoDestinoTrim,
    telefonoDestinoNormalizado: normalizePhoneValue(telefonoDestinoTrim),
    callSid: null,
    createdAtMs: nowMs,
  };
}

export function shouldAssignStartedCallToOutboundCandidate(
  candidate: PendingOutboundAlternatePhoneCandidate | null,
  call: WebRtcCallDto,
  nowMs = Date.now()
): boolean {
  if (!candidate || !call?.callSid || isInboundCallDirection(call.direction)) {
    return false;
  }

  if (candidate.callSid) {
    return false;
  }

  if (nowMs - candidate.createdAtMs > 60_000) {
    return false;
  }

  const normalizedTo = normalizePhoneValue(call.to);
  if (
    candidate.telefonoDestinoNormalizado &&
    normalizedTo &&
    !areEquivalentPhoneValues(candidate.telefonoDestinoNormalizado, normalizedTo)
  ) {
    return false;
  }

  return true;
}

export function matchesEndedCallToOutboundCandidate(
  candidate: PendingOutboundAlternatePhoneCandidate | null,
  call: WebRtcCallDto | null
): boolean {
  if (!candidate || !call || isInboundCallDirection(call.direction)) {
    return false;
  }

  const normalizedTo = normalizePhoneValue(call.to);
  const sameCallSid = Boolean(
    candidate.callSid &&
      call.callSid &&
      candidate.callSid === call.callSid
  );
  const sameDestination = Boolean(
    candidate.telefonoDestinoNormalizado &&
      normalizedTo &&
      areEquivalentPhoneValues(
        candidate.telefonoDestinoNormalizado,
        normalizedTo
      )
  );

  return sameCallSid || sameDestination;
}

export function shouldPromptSaveAlternatePhone(
  candidate: PendingOutboundAlternatePhoneCandidate | null
): boolean {
  if (!candidate?.telefonoDestinoNormalizado) {
    return false;
  }

  if (
    candidate.telefonoPrincipalNormalizado &&
    areEquivalentPhoneValues(
      candidate.telefonoPrincipalNormalizado,
      candidate.telefonoDestinoNormalizado
    )
  ) {
    return false;
  }

  return true;
}

export function findExistingAlternatePhoneByDestination(
  alternos: ClienteTelefonoAlternoLike[],
  telefonoDestinoNormalizado: string
): ClienteTelefonoAlternoLike | null {
  if (!telefonoDestinoNormalizado) {
    return null;
  }

  return (
    alternos.find((item) => {
      const normalizedSaved = normalizePhoneValue(
        item.telefonoNormalizado || item.telefono
      );

      return areEquivalentPhoneValues(
        normalizedSaved,
        telefonoDestinoNormalizado
      );
    }) ?? null
  );
}

export function buildPendingSaveAlternatePhonePrompt(
  candidate: PendingOutboundAlternatePhoneCandidate
): PendingSaveAlternatePhonePrompt {
  return {
    cliente: candidate.cliente,
    telefono: candidate.telefonoDestino,
    telefonoNormalizado: candidate.telefonoDestinoNormalizado,
  };
}
