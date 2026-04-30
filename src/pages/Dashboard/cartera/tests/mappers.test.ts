import {
  buildDashboardCarteraLookup,
  mapApiRowToCarteraRow,
  mapApiRowsToCarteraRows,
} from "../domain/mappers";

describe("dashboard cartera mappers", () => {
  it("builds a case-insensitive lookup", () => {
    expect(
      buildDashboardCarteraLookup({
        CoDicta: "01",
        DESCCTA: "Cartera Uno",
      }),
    ).toEqual({
      codicta: "01",
      desccta: "Cartera Uno",
    });
  });

  it("maps one api row into the dashboard model", () => {
    const result = mapApiRowToCarteraRow({
      CoDicta: "01",
      DESCCTA: "Cartera Uno",
      OBLIGACIONES_TOTAL: "12",
      OBLIGACIONES_PV: 6,
      OBLIGACIONES_30: "3",
      OBLIGACIONES_60: 2,
      OBLIGACIONES_90: 1,
      OBLIGACIONES_90_MAS: 0,
      TOTAL: "1500",
      PV: 900,
      "30": 300,
      "60": 200,
      "90": 100,
      "+90": 0,
      CARTERAVENCIDA: 600,
      CARTERAVENCIDA_PORC: 40,
      TOTALRECAUDOMESACTUAL: 250,
      TOTALRECAUDOMESANTERIOR: 200,
      PORCENTAJEVARIACION: 25,
      INDICERECAUDO_PORC: 8.5,
      TOTAL_ANT: 1400,
      CARTERAVENCIDA_ANT: 500,
    });

    expect(result).toMatchObject({
      codicta: "01",
      desccta: "Cartera Uno",
      obligacionesTotal: 12,
      obligacionesPV: 6,
      obligaciones30: 3,
      total: 1500,
      carteraVencida: 600,
      indiceRecaudo: 8.5,
      totalAnt: 1400,
      carteraVencidaAnt: 500,
    });
    expect(result.recaudo90mas).toBe(0);
  });

  it("maps multiple rows", () => {
    expect(
      mapApiRowsToCarteraRows([
        { CODICTA: "01", DESCCTA: "A" },
        { CODICTA: "02", DESCCTA: "B" },
      ]),
    ).toHaveLength(2);
  });
});
