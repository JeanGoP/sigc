import type { CountryDialOption } from "./runtimeHelpers";
import {
  COUNTRY_DIAL_OPTIONS,
  buildWebRtcContextSnapshot,
  extractTenantIdFromVoiceToken,
  formatWebRtcDate,
  getConnectionLabel,
  getPresenceLabel,
  isEndedCallStatus,
  mapCallStatusToConnectionStatus,
  normalizeCallSystemTenantId,
  normalizeDialInput,
  normalizePhoneByCountry,
  toWebRtcUiErrorFromTwilio,
} from "./runtimeHelpers";

const colombia = COUNTRY_DIAL_OPTIONS.find(
  (item) => item.iso2 === "CO"
) as CountryDialOption;

describe("webrtc runtime helpers", () => {
  it("normalizes dial input and validates numbers by country", () => {
    expect(normalizeDialInput(" +57 (300) 123-4567 ")).toBe("+573001234567");
    expect(
      normalizePhoneByCountry("3001234567", "destino", colombia)
    ).toEqual({
      ok: true,
      value: "+573001234567",
    });
    expect(
      normalizePhoneByCountry("123", "destino", colombia)
    ).toEqual({
      ok: false,
      message:
        "Numero destino invalido para Colombia. Usa 3218446041 como referencia.",
    });
  });

  it("maps call statuses to runtime connection states", () => {
    expect(isEndedCallStatus("completed")).toBe(true);
    expect(isEndedCallStatus("ringing")).toBe(false);
    expect(mapCallStatusToConnectionStatus("in-progress")).toBe("in_call");
    expect(mapCallStatusToConnectionStatus("busy")).toBe("connected");
    expect(mapCallStatusToConnectionStatus("ringing")).toBe("dialing");
  });

  it("builds labels and formatted dates", () => {
    expect(getConnectionLabel("connecting")).toBe("Conectando");
    expect(getPresenceLabel("busy")).toBe("Ocupado");
    expect(formatWebRtcDate(null)).toBe("-");
    expect(formatWebRtcDate("not-a-date")).toBe("not-a-date");
  });

  it("extracts tenant ids and normalizes runtime context values", () => {
    const payload = btoa(
      JSON.stringify({ grants: { identity: "agent|tenant:42|advisor:9" } })
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
    const token = `header.${payload}.signature`;

    expect(extractTenantIdFromVoiceToken(token)).toBe("42");
    expect(extractTenantIdFromVoiceToken("bad-token")).toBeNull();
    expect(normalizeCallSystemTenantId(" 77 ")).toBe("77");
    expect(normalizeCallSystemTenantId("   ")).toBeNull();
    expect(
      buildWebRtcContextSnapshot({
        cliente: "C-1",
        factura: null,
        cuenta: 99,
      })
    ).toEqual({
      cliente: "C-1",
      factura: null,
      cuenta: 99,
    });
  });

  it("maps Twilio-like errors into the UI error contract", () => {
    expect(
      toWebRtcUiErrorFromTwilio("fallback", {
        code: 31000,
        message: "SDK failed",
        causes: ["one", "two"],
      })
    ).toEqual({
      message: "SDK failed",
      statusCode: 500,
      code: "Twilio.31000",
      type: "Failure",
      errors: ["one", "two"],
    });
  });
});
