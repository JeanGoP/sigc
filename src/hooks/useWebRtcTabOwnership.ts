import { useEffect, useState } from "react";
import {
  TabOwnershipSnapshot,
  getTabOwnershipSnapshot,
  releaseTabOwnership,
  subscribeTabOwnershipChanges,
  tryAcquireTabOwnership,
} from "@app/services/GestionLlamadas";
import { WEBRTC_OWNER_CHANNEL_KEY } from "@app/services/WebRtc/runtimeContracts";

interface UseWebRtcTabOwnershipOptions {
  channelKey: string;
  enabled?: boolean;
  ttlSeconds?: number;
  debug?: boolean;
}

export function useWebRtcTabOwnership(
  options: UseWebRtcTabOwnershipOptions
): TabOwnershipSnapshot {
  const channelKey =
    String(options.channelKey ?? "").trim() || WEBRTC_OWNER_CHANNEL_KEY;
  const enabled = Boolean(options.enabled ?? true);
  const ttlSeconds = Math.max(10, options.ttlSeconds ?? 45);
  const debug = Boolean(options.debug);

  const [snapshot, setSnapshot] = useState<TabOwnershipSnapshot>(() =>
    getTabOwnershipSnapshot(channelKey)
  );

  useEffect(() => {
    if (!enabled) {
      setSnapshot(getTabOwnershipSnapshot(channelKey));
      return;
    }

    const firstSnapshot = tryAcquireTabOwnership(channelKey, {
      ttlSeconds,
    });
    setSnapshot(firstSnapshot);

    if (debug) {
    }

    const heartbeat = window.setInterval(() => {
      const renewed = tryAcquireTabOwnership(channelKey, {
        ttlSeconds,
      });
      setSnapshot(renewed);
    }, Math.max(5000, Math.floor(ttlSeconds * 500)));

    const unsubscribe = subscribeTabOwnershipChanges(channelKey, (next) => {
      setSnapshot(next);
      if (debug) {
      }
    });

    return () => {
      window.clearInterval(heartbeat);
      unsubscribe();
      setSnapshot(releaseTabOwnership(channelKey));
    };
  }, [channelKey, debug, enabled, ttlSeconds]);

  return snapshot;
}
