import type { WebRtcCallDto } from "./webrtcService";
import {
  buildContactInitials,
  buildEndedCallSummary,
  buildSoftphoneCallDisplayState,
  buildSoftphoneCallEventRegistration,
  formatCallDuration,
  formatElapsedClock,
  getCallStatusLabel,
  isAdministratorRole,
  isInboundCallDirection,
  resolveActiveContactName,
  shouldTrackPendingInboundCall,
} from "./softphoneWidgetHelpers";

function buildCall(overrides: Partial<WebRtcCallDto> = {}): WebRtcCallDto {
  return {
    id: 1,
    callSid: "CA-1",
    direction: "outbound-client",
    from: "+573001111111",
    to: "+573009999999",
    status: "completed",
    startedAt: "2026-04-26T10:00:00.000Z",
    endedAt: "2026-04-26T10:00:05.000Z",
    provider: "Twilio",
    ...overrides,
  };
}

describe("softphone widget helpers", () => {
  it("formats elapsed and explicit call durations", () => {
    expect(
      formatElapsedClock(
        "2026-04-26T10:00:00.000Z",
        null,
        Date.parse("2026-04-26T10:01:05.000Z")
      )
    ).toBe("00:01:05");
    expect(formatCallDuration(3661.9)).toBe("01:01:01");
  });

  it("builds ended call summaries and resolves display labels", () => {
    expect(getCallStatusLabel("no-answer")).toBe("Sin respuesta");
    expect(buildEndedCallSummary(buildCall())).toEqual({
      callSid: "CA-1",
      from: "+573001111111",
      to: "+573009999999",
      status: "Finalizada",
      durationText: "00:00:05",
    });
  });

  it("resolves contact names and initials for inbound and outbound calls", () => {
    expect(
      resolveActiveContactName(
        buildCall({ direction: "incoming", from: "Cliente Uno", to: "Agente" })
      )
    ).toBe("Cliente Uno");
    expect(resolveActiveContactName(buildCall({ to: "Carlos Perez" }))).toBe(
      "Carlos Perez"
    );
    expect(buildContactInitials("Carlos Perez")).toBe("CP");
    expect(buildContactInitials("+573001111111")).toBe("11");
  });

  it("detects inbound directions and pending inbound tracking rules", () => {
    expect(isInboundCallDirection("INCOMING_CALL")).toBe(true);
    expect(isInboundCallDirection("outbound-api")).toBe(false);

    expect(shouldTrackPendingInboundCall("start", "answered")).toBe(true);
    expect(shouldTrackPendingInboundCall("status", "in_progress")).toBe(true);
    expect(shouldTrackPendingInboundCall("end", "busy")).toBe(false);
    expect(shouldTrackPendingInboundCall("end", "completed")).toBe(true);
  });

  it("recognizes administrator roles", () => {
    expect(isAdministratorRole("Administrador")).toBe(true);
    expect(isAdministratorRole("asesor")).toBe(false);
  });

  it("builds outbound call event requests only when an active gestion session exists", () => {
    expect(
      buildSoftphoneCallEventRegistration({
        activeSession: null,
        call: buildCall(),
        eventType: "start",
      })
    ).toBeNull();

    expect(
      buildSoftphoneCallEventRegistration({
        activeSession: {
          idGestionSession: 123,
          sessionRef: "SES-1",
        },
        call: buildCall({ status: "in-progress" }),
        eventType: "status",
      })
    ).toEqual({
      isInbound: false,
      pendingInboundCall: null,
      request: {
        idGestionSession: 123,
        sessionRef: "SES-1",
        callSid: "CA-1",
        eventType: "status",
        direction: "outbound-client",
        status: "in-progress",
        finalStatus: null,
        startedAt: "2026-04-26T10:00:00.000Z",
        endedAt: "2026-04-26T10:00:05.000Z",
        durationSec: null,
        costFinal: null,
        currency: null,
        recordingSid: null,
        source: "softphone_widget_outbound_status",
      },
    });
  });

  it("builds inbound provisional requests and pending inbound snapshots", () => {
    expect(
      buildSoftphoneCallEventRegistration({
        call: buildCall({
          direction: "incoming",
          from: "+573001111111",
          to: "+5711111111",
          status: "answered",
          endedAt: null,
        }),
        eventType: "start",
      })
    ).toEqual({
      isInbound: true,
      pendingInboundCall: {
        callSid: "CA-1",
        direction: "incoming",
        status: "answered",
        from: "+573001111111",
        to: "+5711111111",
        startedAt: "2026-04-26T10:00:00.000Z",
        endedAt: null,
      },
      request: {
        callSid: "CA-1",
        eventType: "start",
        direction: "incoming",
        status: "answered",
        finalStatus: null,
        startedAt: "2026-04-26T10:00:00.000Z",
        endedAt: null,
        durationSec: null,
        costFinal: null,
        currency: null,
        recordingSid: null,
        source: "softphone_widget_inbound_start",
      },
    });
  });

  it("uses a deterministic end timestamp when a call ends without endedAt", () => {
    expect(
      buildSoftphoneCallEventRegistration({
        call: buildCall({
          direction: "incoming",
          status: "completed",
          endedAt: null,
        }),
        eventType: "end",
        nowIso: "2026-04-26T10:02:00.000Z",
      })?.request.endedAt
    ).toBe("2026-04-26T10:02:00.000Z");
  });

  it("derives the softphone call display state", () => {
    expect(
      buildSoftphoneCallDisplayState(
        {
          inProgress: true,
          connectionStatus: "in_call",
          advisorInternalState: "disponible",
          presenceStatus: "online",
          softphoneStatus: "registered",
          isMuted: false,
          activeCall: buildCall({ to: "Carlos Perez" }),
          incomingCall: null,
        },
        {
          experimentalCallHudEnabled: true,
          hasEndedCallSummary: false,
        }
      )
    ).toEqual({
      activeContactInitials: "CP",
      activeContactName: "Carlos Perez",
      hasCallInProgress: true,
      hasIncomingCall: false,
      hasLiveCall: true,
      incomingFrom: "-",
      incomingTo: "-",
      isInConnectedCall: true,
      showCallSummaryCard: false,
      showIncomingCard: false,
      showLiveHeaderCard: true,
    });
  });
});
