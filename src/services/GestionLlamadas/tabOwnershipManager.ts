import { TabOwnershipSnapshot } from "./contracts";
import {
  DEFAULT_WEBRTC_TAB_OWNERSHIP_TTL_SECONDS,
  WEBRTC_OWNER_BROADCAST_PREFIX,
  WEBRTC_OWNER_LOCK_STORAGE_PREFIX,
  WEBRTC_TAB_ID_STORAGE_KEY,
} from "./storageKeys";

interface StoredOwnershipLock {
  ownerTabId: string;
  lockId: string;
  expiresAt: string;
  updatedAt: string;
}

interface TabOwnershipOptions {
  ttlSeconds?: number;
}

interface OwnershipBroadcastMessage {
  type: "ownership_changed";
  channelKey: string;
  ts: number;
}

function normalizeValue(value: unknown): string {
  return String(value ?? "").trim();
}

function safeSessionStorageGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionStorageSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore storage write errors
  }
}

function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage write errors
  }
}

function safeLocalStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore storage delete errors
  }
}

function randomSuffix(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function createTabId(): string {
  return `tab-${randomSuffix()}`;
}

function lockStorageKey(channelKey: string): string {
  return `${WEBRTC_OWNER_LOCK_STORAGE_PREFIX}:${normalizeValue(channelKey) || "default"}`;
}

function ownershipBroadcastChannel(channelKey: string): string {
  return `${WEBRTC_OWNER_BROADCAST_PREFIX}:${normalizeValue(channelKey) || "default"}`;
}

function publishOwnershipChanged(channelKey: string): void {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }

  const normalizedChannel = normalizeValue(channelKey) || "default";
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(ownershipBroadcastChannel(normalizedChannel));
    const payload: OwnershipBroadcastMessage = {
      type: "ownership_changed",
      channelKey: normalizedChannel,
      ts: Date.now(),
    };
    channel.postMessage(payload);
  } catch {
    // ignore BroadcastChannel errors
  } finally {
    try {
      channel?.close();
    } catch {
      // ignore close errors
    }
  }
}

function readLock(channelKey: string): StoredOwnershipLock | null {
  const raw = safeLocalStorageGet(lockStorageKey(channelKey));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredOwnershipLock;
    if (!parsed || typeof parsed !== "object" || !parsed.ownerTabId || !parsed.expiresAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeLock(channelKey: string, lock: StoredOwnershipLock): void {
  safeLocalStorageSet(lockStorageKey(channelKey), JSON.stringify(lock));
  publishOwnershipChanged(channelKey);
}

function isExpired(lock: StoredOwnershipLock | null, nowMs: number): boolean {
  if (!lock) {
    return true;
  }

  const expiresMs = Date.parse(lock.expiresAt);
  if (Number.isNaN(expiresMs)) {
    return true;
  }

  return nowMs >= expiresMs;
}

function toSnapshot(channelKey: string, tabId: string, lock: StoredOwnershipLock | null): TabOwnershipSnapshot {
  const nowMs = Date.now();
  const expired = isExpired(lock, nowMs);
  const ownerTabId = lock && !expired ? lock.ownerTabId : null;
  const lockExpiresAt = lock && !expired ? lock.expiresAt : null;

  return {
    channelKey,
    tabId,
    ownerTabId,
    lockExpiresAt,
    hasOwner: Boolean(ownerTabId),
    isOwner: Boolean(ownerTabId && ownerTabId === tabId),
  };
}

export function getCurrentTabId(): string {
  const existing = safeSessionStorageGet(WEBRTC_TAB_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const created = createTabId();
  safeSessionStorageSet(WEBRTC_TAB_ID_STORAGE_KEY, created);
  return created;
}

export function getTabOwnershipSnapshot(channelKey: string): TabOwnershipSnapshot {
  const normalizedChannel = normalizeValue(channelKey) || "default";
  const tabId = getCurrentTabId();
  const lock = readLock(normalizedChannel);
  return toSnapshot(normalizedChannel, tabId, lock);
}

export function tryAcquireTabOwnership(channelKey: string, options: TabOwnershipOptions = {}): TabOwnershipSnapshot {
  const normalizedChannel = normalizeValue(channelKey) || "default";
  const tabId = getCurrentTabId();
  const ttlSeconds = Math.max(
    10,
    options.ttlSeconds ?? DEFAULT_WEBRTC_TAB_OWNERSHIP_TTL_SECONDS
  );
  const nowMs = Date.now();
  const lock = readLock(normalizedChannel);

  if (!lock || isExpired(lock, nowMs) || lock.ownerTabId === tabId) {
    const nextLock: StoredOwnershipLock = {
      ownerTabId: tabId,
      lockId: `lock-${randomSuffix()}`,
      updatedAt: new Date(nowMs).toISOString(),
      expiresAt: new Date(nowMs + ttlSeconds * 1000).toISOString(),
    };
    writeLock(normalizedChannel, nextLock);
    return toSnapshot(normalizedChannel, tabId, nextLock);
  }

  return toSnapshot(normalizedChannel, tabId, lock);
}

export function renewTabOwnership(channelKey: string, options: TabOwnershipOptions = {}): TabOwnershipSnapshot {
  const normalizedChannel = normalizeValue(channelKey) || "default";
  const tabId = getCurrentTabId();
  const ttlSeconds = Math.max(
    10,
    options.ttlSeconds ?? DEFAULT_WEBRTC_TAB_OWNERSHIP_TTL_SECONDS
  );
  const nowMs = Date.now();
  const lock = readLock(normalizedChannel);

  if (lock && lock.ownerTabId === tabId) {
    const renewed: StoredOwnershipLock = {
      ...lock,
      updatedAt: new Date(nowMs).toISOString(),
      expiresAt: new Date(nowMs + ttlSeconds * 1000).toISOString(),
    };
    writeLock(normalizedChannel, renewed);
    return toSnapshot(normalizedChannel, tabId, renewed);
  }

  return toSnapshot(normalizedChannel, tabId, lock);
}

export function releaseTabOwnership(channelKey: string): TabOwnershipSnapshot {
  const normalizedChannel = normalizeValue(channelKey) || "default";
  const tabId = getCurrentTabId();
  const current = readLock(normalizedChannel);

  if (current && current.ownerTabId === tabId) {
    safeLocalStorageRemove(lockStorageKey(normalizedChannel));
    publishOwnershipChanged(normalizedChannel);
  }

  const lock = readLock(normalizedChannel);
  return toSnapshot(normalizedChannel, tabId, lock);
}

export function subscribeTabOwnershipChanges(
  channelKey: string,
  onChange: (snapshot: TabOwnershipSnapshot) => void
): () => void {
  const normalizedChannel = normalizeValue(channelKey) || "default";
  const expectedStorageKey = lockStorageKey(normalizedChannel);
  let broadcastChannel: BroadcastChannel | null = null;

  const listener = (event: StorageEvent) => {
    if (event.key !== expectedStorageKey) {
      return;
    }

    onChange(getTabOwnershipSnapshot(normalizedChannel));
  };

  if (typeof BroadcastChannel !== "undefined") {
    try {
      broadcastChannel = new BroadcastChannel(ownershipBroadcastChannel(normalizedChannel));
      broadcastChannel.onmessage = (event: MessageEvent<OwnershipBroadcastMessage>) => {
        const payload = event.data;
        if (!payload || payload.type !== "ownership_changed") {
          return;
        }

        if (normalizeValue(payload.channelKey) !== normalizedChannel) {
          return;
        }

        onChange(getTabOwnershipSnapshot(normalizedChannel));
      };
    } catch {
      broadcastChannel = null;
    }
  }

  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener("storage", listener);
    if (broadcastChannel) {
      try {
        broadcastChannel.close();
      } catch {
        // ignore close errors
      }
    }
  };
}
