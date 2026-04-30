import {
  EDAD_MORA_OPTIONS,
  normalizeEdadMora,
  parseEdadMora,
  serializeEdadMora,
} from "./filterOptions";

describe("consulta cartera filter options", () => {
  it("normalizes empty edad mora as 'todos'", () => {
    expect(normalizeEdadMora(undefined)).toBe("todos");
    expect(normalizeEdadMora("")).toBe("todos");
    expect(normalizeEdadMora("   ")).toBe("todos");
  });

  it("parses only known edad mora options", () => {
    const parsed = parseEdadMora("PV;90;missing");
    expect(parsed).toEqual([
      EDAD_MORA_OPTIONS[0],
      EDAD_MORA_OPTIONS[3],
    ]);
  });

  it("serializes selected edad mora options", () => {
    expect(serializeEdadMora([])).toBe("todos");
    expect(
      serializeEdadMora([EDAD_MORA_OPTIONS[1], EDAD_MORA_OPTIONS[2]])
    ).toBe("30;60");
  });
});
