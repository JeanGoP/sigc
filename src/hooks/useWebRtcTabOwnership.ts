import { useEffect, useState } from "react";
import {
  TabOwnershipSnapshot,
  getTabOwnershipSnapshot,
  releaseTabOwnership,
  subscribeTabOwnershipChanges,
  tryAcquireTabOwnership,
} from "@app/services/GestionLlamadas";

interface UseWebRtcTabOwnershipOptions {
  channelKey: string;
  enabled?: boolean;
  ttlSeconds?: number;
  debug?: boolean;
}

export function useWebRtcTabOwnership(
  options: UseWebRtcTabOwnershipOptions
): TabOwnershipSnapshot {
  const channelKey = String(options.channelKey ?? "").trim() || "webrtc_owner_consulta_cartera";
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
      console.log("[WebRtcTabOwnership] initial", firstSnapshot);
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
        console.log("[WebRtcTabOwnership] changed", next);
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
