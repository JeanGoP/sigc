import {
  getCurrentTabId,
  getTabOwnershipSnapshot,
  releaseTabOwnership,
  subscribeTabOwnershipChanges,
  tryAcquireTabOwnership,
} from "./tabOwnershipManager";
import {
  WEBRTC_OWNER_BROADCAST_PREFIX,
  WEBRTC_OWNER_LOCK_STORAGE_PREFIX,
  WEBRTC_TAB_ID_STORAGE_KEY,
} from "./storageKeys";

const CHANNEL_KEY = "test-softphone";
const LOCK_STORAGE_KEY = `${WEBRTC_OWNER_LOCK_STORAGE_PREFIX}:${CHANNEL_KEY}`;

function setTabId(tabId: string): void {
  sessionStorage.setItem(WEBRTC_TAB_ID_STORAGE_KEY, tabId);
}

describe("tab ownership manager", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.useFakeTimers().setSystemTime(new Date("2026-04-27T10:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("keeps the WebRTC storage key contracts stable", () => {
    expect(WEBRTC_TAB_ID_STORAGE_KEY).toBe("sigc.webrtc.tab.id.v1");
    expect(WEBRTC_OWNER_LOCK_STORAGE_PREFIX).toBe("sigc.webrtc.owner.lock.v1");
    expect(WEBRTC_OWNER_BROADCAST_PREFIX).toBe("sigc.webrtc.owner.broadcast.v1");
  });

  it("creates and reuses the current tab id in session storage", () => {
    const created = getCurrentTabId();
    expect(created).toMatch(/^tab-/);
    expect(sessionStorage.getItem(WEBRTC_TAB_ID_STORAGE_KEY)).toBe(created);
    expect(getCurrentTabId()).toBe(created);
  });

  it("acquires ownership for the first tab and blocks another tab until the lock expires", () => {
    setTabId("tab-owner");

    const ownerSnapshot = tryAcquireTabOwnership(CHANNEL_KEY, {
      ttlSeconds: 10,
    });

    expect(ownerSnapshot).toEqual({
      channelKey: CHANNEL_KEY,
      tabId: "tab-owner",
      ownerTabId: "tab-owner",
      lockExpiresAt: "2026-04-27T10:00:10.000Z",
      hasOwner: true,
      isOwner: true,
    });

    setTabId("tab-companion");

    expect(tryAcquireTabOwnership(CHANNEL_KEY, { ttlSeconds: 10 })).toEqual({
      channelKey: CHANNEL_KEY,
      tabId: "tab-companion",
      ownerTabId: "tab-owner",
      lockExpiresAt: "2026-04-27T10:00:10.000Z",
      hasOwner: true,
      isOwner: false,
    });

    jest.setSystemTime(new Date("2026-04-27T10:00:11.000Z"));

    expect(tryAcquireTabOwnership(CHANNEL_KEY, { ttlSeconds: 10 })).toEqual({
      channelKey: CHANNEL_KEY,
      tabId: "tab-companion",
      ownerTabId: "tab-companion",
      lockExpiresAt: "2026-04-27T10:00:21.000Z",
      hasOwner: true,
      isOwner: true,
    });
  });

  it("renews ownership for the owner tab and releases only from the owner tab", () => {
    setTabId("tab-owner");
    tryAcquireTabOwnership(CHANNEL_KEY, { ttlSeconds: 10 });

    jest.setSystemTime(new Date("2026-04-27T10:00:05.000Z"));
    const renewed = tryAcquireTabOwnership(CHANNEL_KEY, { ttlSeconds: 10 });
    expect(renewed.lockExpiresAt).toBe("2026-04-27T10:00:15.000Z");

    setTabId("tab-companion");
    expect(releaseTabOwnership(CHANNEL_KEY).ownerTabId).toBe("tab-owner");
    expect(localStorage.getItem(LOCK_STORAGE_KEY)).not.toBeNull();

    setTabId("tab-owner");
    expect(releaseTabOwnership(CHANNEL_KEY)).toEqual({
      channelKey: CHANNEL_KEY,
      tabId: "tab-owner",
      ownerTabId: null,
      lockExpiresAt: null,
      hasOwner: false,
      isOwner: false,
    });
    expect(localStorage.getItem(LOCK_STORAGE_KEY)).toBeNull();
  });

  it("notifies subscribers when the ownership storage key changes", () => {
    setTabId("tab-owner");
    const listener = jest.fn();
    const unsubscribe = subscribeTabOwnershipChanges(CHANNEL_KEY, listener);

    tryAcquireTabOwnership(CHANNEL_KEY, { ttlSeconds: 10 });

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: LOCK_STORAGE_KEY,
      })
    );

    expect(listener).toHaveBeenCalledWith(getTabOwnershipSnapshot(CHANNEL_KEY));

    unsubscribe();
  });
});
