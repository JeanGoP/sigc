import { useMemo } from "react";
import type { TabOwnershipSnapshot } from "@app/services/GestionLlamadas";
import { WEBRTC_OWNER_CHANNEL_KEY } from "@app/services/WebRtc/runtimeContracts";
import { useWebRtcTabOwnership } from "./useWebRtcTabOwnership";

interface UseWebRtcSoftphoneOwnershipOptions {
  enabled?: boolean;
  ttlSeconds?: number;
  debug?: boolean;
}

export interface WebRtcSoftphoneOwnership extends TabOwnershipSnapshot {
  isCompanion: boolean;
  canControlSoftphone: boolean;
  ownershipLabel: "owner" | "acom" | "sync";
  ownerBlockMessage: string;
}

export function useWebRtcSoftphoneOwnership(
  options: UseWebRtcSoftphoneOwnershipOptions = {}
): WebRtcSoftphoneOwnership {
  const ownership = useWebRtcTabOwnership({
    channelKey: WEBRTC_OWNER_CHANNEL_KEY,
    enabled: options.enabled ?? true,
    ttlSeconds: options.ttlSeconds ?? 45,
    debug: options.debug ?? false,
  });

  return useMemo(() => {
    const isCompanion = Boolean(!ownership.isOwner && ownership.hasOwner);

    return {
      ...ownership,
      isCompanion,
      canControlSoftphone: ownership.isOwner,
      ownershipLabel: ownership.isOwner
        ? "owner"
        : ownership.hasOwner
          ? "acom"
          : "sync",
      ownerBlockMessage: isCompanion
        ? "Esta pestana esta en modo acompanante. Usa la pestana duena para operar el softphone."
        : "",
    };
  }, [ownership]);
}
