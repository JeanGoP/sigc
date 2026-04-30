import {
  buildDefaultRendimientoAsesoresFilters,
  buildRendimientoAsesoresColumns,
  buildRendimientoAsesoresParams,
  formatDateInputValue,
  normalizeProductividadAsesoresRows,
} from "../domain/rendimientoAsesores";

describe("rendimiento asesores helpers", () => {
  it("formatea fecha para input", () => {
    expect(formatDateInputValue(new Date("2026-04-28T15:45:00Z"))).toBe(
      "2026-04-28",
    );
  });

  it("crea filtros iniciales con fecha de hoy", () => {
    expect(
      buildDefaultRendimientoAsesoresFilters(new Date("2026-04-28T08:00:00Z")),
    ).toEqual({
      fechaInicial: "2026-04-28",
      fechaFinal: "2026-04-28",
    });
  });

  it("construye params cuando el usuario es valido", () => {
    expect(
      buildRendimientoAsesoresParams("12", {
        fechaInicial: "2026-04-01",
        fechaFinal: "2026-04-28",
      }),
    ).toEqual({
      IdUsuario: 12,
      FechaInicial: "2026-04-01",
      FechaFinal: "2026-04-28",
    });
  });

  it("bloquea params cuando el usuario no es valido", () => {
    expect(
      buildRendimientoAsesoresParams(undefined, {
        fechaInicial: "2026-04-01",
        fechaFinal: "2026-04-28",
      }),
    ).toBeNull();
  });

  it("normaliza whatsapp en filas", () => {
    expect(
      normalizeProductividadAsesoresRows([
        {
          asesor: "Ana",
          totalGestiones: 10,
          clientesGestionados: 4,
          contactoDirecto: 3,
          contactoIndirecto: 1,
          noContacto: 6,
          numCompromisosdePago: 2,
          acumuladoCompromisos: 5000,
          acumuladoCompromisosCumplidos: 2500,
          whatsApp: undefined as unknown as number,
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        asesor: "Ana",
        whatsApp: 0,
      }),
    ]);
  });

  it("expone columnas y formato de moneda", () => {
    const columns = buildRendimientoAsesoresColumns();
    const acumuladoColumn = columns.find((column) => column.id === "acumuladoCompromisos");

    expect(columns).toHaveLength(10);
    expect(acumuladoColumn?.label).toBe("Acumulado");
    expect(acumuladoColumn?.format?.(1234)).toBe("$ 1.234,00");
  });
});
