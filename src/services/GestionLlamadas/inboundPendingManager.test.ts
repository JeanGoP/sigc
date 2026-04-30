import {
  getPendingInboundCalls,
  removePendingInboundCall,
  subscribePendingInboundCalls,
  upsertPendingInboundCall,
} from "./inboundPendingManager";
import {
  WEBRTC_PENDING_INBOUND_LOCAL_EVENT_NAME,
  WEBRTC_PENDING_INBOUND_STORAGE_KEY,
} from "./storageKeys";

describe("inbound pending manager", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers().setSystemTime(new Date("2026-04-27T10:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
    localStorage.clear();
  });

  it("keeps pending inbound storage key contracts stable", () => {
    expect(WEBRTC_PENDING_INBOUND_STORAGE_KEY).toBe(
      "sigc.gestion.inbound.pending.v1"
    );
    expect(WEBRTC_PENDING_INBOUND_LOCAL_EVENT_NAME).toBe(
      "sigc.gestion.inbound.pending.changed"
    );
  });

  it("stores and reads pending inbound calls from localStorage", () => {
    upsertPendingInboundCall({
      callSid: "CA-1",
      direction: "inbound-client",
      status: "answered",
      from: "+573001111111",
      to: "+5711111111",
      startedAt: "2026-04-27T09:59:00.000Z",
    });

    expect(getPendingInboundCalls()).toEqual([
      {
        callSid: "CA-1",
        direction: "inbound-client",
        status: "answered",
        from: "+573001111111",
        to: "+5711111111",
        startedAt: "2026-04-27T09:59:00.000Z",
        endedAt: null,
        updatedAt: "2026-04-27T10:00:00.000Z",
      },
    ]);

    expect(localStorage.getItem(WEBRTC_PENDING_INBOUND_STORAGE_KEY)).toContain(
      "CA-1"
    );
  });

  it("updates an existing pending inbound call without losing previous values", () => {
    upsertPendingInboundCall({
      callSid: "CA-1",
      direction: "inbound-client",
      status: "answered",
      from: "+573001111111",
      to: "+5711111111",
      startedAt: "2026-04-27T09:59:00.000Z",
    });

    jest.setSystemTime(new Date("2026-04-27T10:01:00.000Z"));
    upsertPendingInboundCall({
      callSid: "CA-1",
      status: "completed",
      endedAt: "2026-04-27T10:01:00.000Z",
    });

    expect(getPendingInboundCalls()).toEqual([
      {
        callSid: "CA-1",
        direction: "inbound-client",
        status: "completed",
        from: "+573001111111",
        to: "+5711111111",
        startedAt: "2026-04-27T09:59:00.000Z",
        endedAt: "2026-04-27T10:01:00.000Z",
        updatedAt: "2026-04-27T10:01:00.000Z",
      },
    ]);
  });

  it("removes a pending inbound call by call sid", () => {
    upsertPendingInboundCall({ callSid: "CA-1", status: "answered" });
    upsertPendingInboundCall({ callSid: "CA-2", status: "answered" });

    removePendingInboundCall("CA-1");

    expect(getPendingInboundCalls().map((call) => call.callSid)).toEqual(["CA-2"]);
  });

  it("cleans stale, invalid and duplicate calls when reading storage", () => {
    localStorage.setItem(
      WEBRTC_PENDING_INBOUND_STORAGE_KEY,
      JSON.stringify({
        calls: [
          {
            callSid: "OLD",
            updatedAt: "2026-04-25T09:59:59.000Z",
          },
          {
            callSid: "",
            updatedAt: "2026-04-27T09:59:00.000Z",
          },
          {
            callSid: "CA-1",
            status: "older",
            updatedAt: "2026-04-27T09:58:00.000Z",
          },
          {
            callSid: "CA-1",
            status: "newer",
            updatedAt: "2026-04-27T09:59:00.000Z",
          },
        ],
        updatedAt: "2026-04-27T09:59:00.000Z",
      })
    );

    expect(getPendingInboundCalls()).toEqual([
      {
        callSid: "CA-1",
        direction: null,
        status: "newer",
        from: null,
        to: null,
        startedAt: null,
        endedAt: null,
        updatedAt: "2026-04-27T09:59:00.000Z",
      },
    ]);
  });

  it("keeps at most twenty pending inbound calls ordered by latest update", () => {
    for (let index = 0; index < 25; index += 1) {
      jest.setSystemTime(new Date(Date.parse("2026-04-27T10:00:00.000Z") + index));
      upsertPendingInboundCall({
        callSid: `CA-${index.toString().padStart(2, "0")}`,
      });
    }

    const calls = getPendingInboundCalls();

    expect(calls).toHaveLength(20);
    expect(calls[0].callSid).toBe("CA-24");
    expect(calls[19].callSid).toBe("CA-05");
  });

  it("notifies subscribers on local pending inbound changes", () => {
    const listener = jest.fn();
    const unsubscribe = subscribePendingInboundCalls(listener);

    listener.mockClear();
    upsertPendingInboundCall({ callSid: "CA-1", status: "answered" });

    expect(listener).toHaveBeenCalledWith([
      expect.objectContaining({
        callSid: "CA-1",
        status: "answered",
      }),
    ]);

    unsubscribe();
  });
});
