import type { WebRtcCallDto } from "../../../services/WebRtc/webrtcService";
import {
  buildPendingOutboundAlternatePhoneCandidate,
  buildPendingSaveAlternatePhonePrompt,
  findExistingAlternatePhoneByDestination,
  matchesEndedCallToOutboundCandidate,
  shouldAssignStartedCallToOutboundCandidate,
  shouldPromptSaveAlternatePhone,
} from "./telephony";

function buildCall(overrides: Partial<WebRtcCallDto> = {}): WebRtcCallDto {
  return {
    id: 1,
    callSid: "CA-1",
    direction: "outbound-api",
    from: "+573001111111",
    to: "+573009999999",
    status: "in-progress",
    provider: "twilio",
    ...overrides,
  };
}

describe("consulta cartera telephony helpers", () => {
  it("builds a pending outbound candidate only for valid client and destination values", () => {
    expect(
      buildPendingOutboundAlternatePhoneCandidate({
        cliente: "CLI-1",
        telefonoPrincipal: "+57 300 111 1111",
        telefonoDestino: "3009999999",
        nowMs: 123,
      })
    ).toEqual({
      cliente: "CLI-1",
      telefonoPrincipalNormalizado: "+573001111111",
      telefonoDestino: "3009999999",
      telefonoDestinoNormalizado: "3009999999",
      callSid: null,
      createdAtMs: 123,
    });

    expect(
      buildPendingOutboundAlternatePhoneCandidate({
        cliente: "",
        telefonoPrincipal: "",
        telefonoDestino: "3009999999",
      })
    ).toBeNull();
  });

  it("assigns call started events only when they still match the pending outbound candidate", () => {
    const candidate = buildPendingOutboundAlternatePhoneCandidate({
      cliente: "CLI-1",
      telefonoPrincipal: "3001111111",
      telefonoDestino: "3009999999",
      nowMs: 1_000,
    });

    expect(
      shouldAssignStartedCallToOutboundCandidate(
        candidate,
        buildCall({ to: "+57 300 999 9999" }),
        20_000
      )
    ).toBe(true);

    expect(
      shouldAssignStartedCallToOutboundCandidate(
        candidate,
        buildCall({ direction: "incoming" }),
        20_000
      )
    ).toBe(false);

    expect(
      shouldAssignStartedCallToOutboundCandidate(
        candidate,
        buildCall({ to: "+57 301 888 7777" }),
        20_000
      )
    ).toBe(false);

    expect(
      shouldAssignStartedCallToOutboundCandidate(
        candidate,
        buildCall(),
        70_001
      )
    ).toBe(false);
  });

  it("matches ended calls against the same candidate by sid or normalized destination", () => {
    const candidate = {
      cliente: "CLI-1",
      telefonoPrincipalNormalizado: "3001111111",
      telefonoDestino: "3009999999",
      telefonoDestinoNormalizado: "3009999999",
      callSid: "CA-9",
      createdAtMs: 1,
    };

    expect(
      matchesEndedCallToOutboundCandidate(
        candidate,
        buildCall({ callSid: "CA-9", to: "3000000000" })
      )
    ).toBe(true);

    expect(
      matchesEndedCallToOutboundCandidate(
        candidate,
        buildCall({ callSid: "CA-10", to: "+57 300 999 9999" })
      )
    ).toBe(true);

    expect(
      matchesEndedCallToOutboundCandidate(
        candidate,
        buildCall({ callSid: "CA-10", to: "3018887777" })
      )
    ).toBe(false);
  });

  it("prompts for alternate phone save only when destination differs from the main phone", () => {
    expect(
      shouldPromptSaveAlternatePhone({
        cliente: "CLI-1",
        telefonoPrincipalNormalizado: "+573001111111",
        telefonoDestino: "3009999999",
        telefonoDestinoNormalizado: "3009999999",
        callSid: null,
        createdAtMs: 1,
      })
    ).toBe(true);

    expect(
      shouldPromptSaveAlternatePhone({
        cliente: "CLI-1",
        telefonoPrincipalNormalizado: "+573001111111",
        telefonoDestino: "3001111111",
        telefonoDestinoNormalizado: "3001111111",
        callSid: null,
        createdAtMs: 1,
      })
    ).toBe(false);
  });

  it("finds an existing alternate phone using normalized comparisons and builds save prompts", () => {
    const alternos = [
      {
        id: 1,
        cliente: "CLI-1",
        telefono: "3009999999",
        telefonoNormalizado: "+573009999999",
        etiqueta: "Casa",
        activo: true,
        createdAt: "2026-04-26T00:00:00Z",
        createdByUserId: 1,
      },
    ];

    expect(
      findExistingAlternatePhoneByDestination(alternos, "3009999999")
    ).toEqual(alternos[0]);
    expect(
      findExistingAlternatePhoneByDestination(alternos, "3018887777")
    ).toBeNull();

    expect(
      buildPendingSaveAlternatePhonePrompt({
        cliente: "CLI-1",
        telefonoPrincipalNormalizado: "3001111111",
        telefonoDestino: "3009999999",
        telefonoDestinoNormalizado: "3009999999",
        createdAtMs: 1,
      })
    ).toEqual({
      cliente: "CLI-1",
      telefono: "3009999999",
      telefonoNormalizado: "3009999999",
    });
  });
});
