import {
  extractDatePart,
  extractTimePart,
  getApiErrorMessage,
  mergeDateAndTime,
  normalizeGestionFilterValue,
  parseBooleanValue,
  parseNumberValue,
} from "../domain/helpers";

describe("modificacion eventos helpers", () => {
  it("parses number and boolean values from backend-shaped inputs", () => {
    expect(parseNumberValue("42")).toBe(42);
    expect(parseNumberValue("")).toBeNull();
    expect(parseNumberValue("bad")).toBeNull();

    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(1)).toBe(true);
    expect(parseBooleanValue("si")).toBe(true);
    expect(parseBooleanValue("0")).toBe(false);
  });

  it("extracts date and time parts from supported date values", () => {
    expect(extractDatePart("2026-04-28 13:45:00")).toBe("2026-04-28");
    expect(extractTimePart("2026-04-28 13:45:00")).toBe("13:45");
    expect(extractDatePart("not-a-date")).toBe("");
    expect(extractTimePart("not-a-date")).toBe("");
  });

  it("merges dates and times using the existing API format", () => {
    expect(mergeDateAndTime("2026-04-28", "13:45", true)).toBe(
      "2026-04-28T13:45:00"
    );
    expect(mergeDateAndTime("2026-04-28", "", false)).toBe(
      "2026-04-28T00:00:00"
    );
    expect(mergeDateAndTime("", "13:45", true)).toBe("");
  });

  it("resolves API error messages and filter values with current fallbacks", () => {
    expect(
      getApiErrorMessage(
        { errors: ["", "Primer error"], message: "Mensaje" },
        "Fallback"
      )
    ).toBe("Primer error");
    expect(getApiErrorMessage({ message: "Mensaje" }, "Fallback")).toBe(
      "Mensaje"
    );
    expect(getApiErrorMessage({}, "Fallback")).toBe("Fallback");

    expect(normalizeGestionFilterValue(" 123 ")).toBe("123");
    expect(normalizeGestionFilterValue("   ")).toBeNull();
  });
});
