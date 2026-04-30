import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import {
  buildAgingChartData,
  buildCarteraVencidaChartData,
  buildComposicionRecaudoPorCarteraChartData,
  buildConcentracionCarteraChartData,
  buildEficienciaRecuperacionChartData,
  buildMixedRecaudoIndiceChartData,
} from "../domain/remainingChartBuilders";

function createRow(overrides: Partial<CarteraRow> = {}): CarteraRow {
  return {
    codicta: "01",
    desccta: "Cartera A",
    obligacionesTotal: 0,
    obligacionesPV: 0,
    obligaciones30: 0,
    obligaciones60: 0,
    obligaciones90: 0,
    obligaciones90mas: 0,
    total: 0,
    pv: 0,
    d30: 0,
    d60: 0,
    d90: 0,
    d90mas: 0,
    carteraVencida: 0,
    carteraVencidaPorc: 0,
    recaudoMesActual: 0,
    recaudoMesAnterior: 0,
    porcentajeVariacion: 0,
    indiceRecaudo: 0,
    recaudoPV: 0,
    recaudo30: 0,
    recaudo60: 0,
    recaudo90: 0,
    recaudo90mas: 0,
    recaudoVencido: 0,
    totalAnt: 0,
    pvAnt: 0,
    d30Ant: 0,
    d60Ant: 0,
    d90Ant: 0,
    d90masAnt: 0,
    pvAntPorc: 0,
    d30AntPorc: 0,
    d60AntPorc: 0,
    d90AntPorc: 0,
    d90masAntPorc: 0,
    carteraVencidaAnt: 0,
    carteraVencidaAntPorc: 0,
    ...overrides,
  };
}

describe("dashboard remaining chart builders", () => {
  it("builds concentracion cartera top 10 plus others", () => {
    const rows = Array.from({ length: 12 }, (_, index) =>
      createRow({
        codicta: String(index + 1),
        desccta: `Cartera ${index + 1}`,
        total: 1000 - index * 10,
      }),
    );

    const result = buildConcentracionCarteraChartData(rows);

    expect(result.labels).toHaveLength(11);
    expect(result.labels[result.labels.length - 1]).toBe("Otras");
  });

  it("builds eficiencia recuperacion points", () => {
    const result = buildEficienciaRecuperacionChartData([
      createRow({
        carteraVencida: 2_000_000,
        recaudoMesActual: 500_000,
      }),
      createRow({
        carteraVencida: 0,
        recaudoMesActual: 100_000,
      }),
    ]);

    expect(result.datasets).toHaveLength(1);
    expect(result.datasets[0].data).toEqual([
      { x: 2, y: 0.5, label: "Cartera A" },
    ]);
  });

  it("builds composicion recaudo por cartera rows and datasets", () => {
    const result = buildComposicionRecaudoPorCarteraChartData(
      [
        createRow({
          codicta: "01",
          desccta: "A",
          recaudoPV: 20,
          recaudo30: 20,
          recaudo60: 60,
        }),
        createRow({
          codicta: "02",
          desccta: "B",
          recaudo90mas: 100,
        }),
      ],
      new Set(["02"]),
      "porcentaje",
    );

    expect(result.chipRows).toHaveLength(2);
    expect(result.labels).toEqual(["A"]);
    expect(result.datasets[2].data).toEqual([60]);
  });

  it("builds mixed recaudo indice datasets", () => {
    const result = buildMixedRecaudoIndiceChartData(
      [
        createRow({
          codicta: "01",
          desccta: "A",
          recaudoMesActual: 100,
          indiceRecaudo: 5,
        }),
        createRow({
          codicta: "02",
          desccta: "B",
          recaudoMesActual: 200,
          indiceRecaudo: 10,
        }),
      ],
      new Set(),
    );

    expect(result.labels).toEqual(["B", "A"]);
    expect(result.datasets).toHaveLength(2);
    expect(result.datasets[0].data).toEqual([200, 100]);
  });

  it("builds cartera vencida rows with threshold colors", () => {
    const result = buildCarteraVencidaChartData(
      [
        createRow({ codicta: "01", desccta: "A", carteraVencidaPorc: 5 }),
        createRow({ codicta: "02", desccta: "B", carteraVencidaPorc: 20 }),
      ],
      new Set(),
      15,
    );

    expect(result.labels).toEqual(["B", "A"]);
    expect(result.datasets[0].backgroundColor).toEqual(["#CA6F1E", "#28B463"]);
  });

  it("builds aging datasets for valor and cantidad", () => {
    const rows = [
      createRow({
        codicta: "01",
        desccta: "A",
        total: 100,
        pv: 40,
        d30: 30,
        d60: 20,
        d90: 10,
        obligacionesTotal: 4,
        obligacionesPV: 1,
        obligaciones30: 1,
        obligaciones60: 1,
        obligaciones90: 1,
      }),
    ];

    const valueResult = buildAgingChartData(rows, new Set(), "valor");
    const countResult = buildAgingChartData(rows, new Set(), "cantidad");

    expect(valueResult.labels).toEqual(["A"]);
    expect(valueResult.datasets[0].data).toEqual([40]);
    expect(countResult.datasets[0].data).toEqual([1]);
  });
});
