import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import {
  buildComposicionRecaudoChartData,
  buildDistribucionSaldoChartData,
  buildIndiceRecaudoChartData,
  buildRecaudoChartData,
  toggleHiddenDashboardCartera,
} from "../domain/chartBuilders";

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

describe("dashboard cartera chart builders", () => {
  it("toggles hidden cartera ids", () => {
    expect(toggleHiddenDashboardCartera(new Set(), "01")).toEqual(new Set(["01"]));
    expect(toggleHiddenDashboardCartera(new Set(["01"]), "01")).toEqual(new Set());
  });

  it("builds distribucion saldo data using only visible rows", () => {
    const result = buildDistribucionSaldoChartData(
      [
        createRow({ codicta: "01", pv: 10, d30: 5, d60: 2, d90: 1, d90mas: 1 }),
        createRow({ codicta: "02", pv: 20, d30: 10, d60: 4, d90: 2, d90mas: 2 }),
      ],
      new Set(["02"]),
    );

    expect(result.datasets[0].data).toEqual([10, 5, 2, 1, 1]);
    expect(result.chipRows).toHaveLength(2);
  });

  it("builds composicion recaudo value and percentage data", () => {
    const rows = [
      createRow({
        codicta: "01",
        recaudoPV: 50,
        recaudo30: 25,
        recaudo60: 25,
      }),
      createRow({
        codicta: "02",
        recaudoPV: 0,
        recaudo30: 0,
        recaudo60: 0,
        recaudo90: 0,
        recaudo90mas: 0,
      }),
    ];

    const valueResult = buildComposicionRecaudoChartData(rows, new Set(), "valor");
    const percentResult = buildComposicionRecaudoChartData(
      rows,
      new Set(),
      "porcentaje",
    );

    expect(valueResult.chipRows).toHaveLength(1);
    expect(valueResult.datasets[0].data).toEqual([50, 25, 25, 0, 0]);
    expect(percentResult.datasets[0].data).toEqual([50, 25, 25, 0, 0]);
  });

  it("sorts indice recaudo rows descending and colors by threshold", () => {
    const result = buildIndiceRecaudoChartData([
      createRow({ codicta: "01", desccta: "B", indiceRecaudo: 7 }),
      createRow({ codicta: "02", desccta: "A", indiceRecaudo: 16 }),
      createRow({ codicta: "03", desccta: "C", indiceRecaudo: 9 }),
    ]);

    expect(result.labels).toEqual(["A", "C", "B"]);
    expect(result.datasets[0].backgroundColor).toEqual([
      "#6ab187",
      "#4f86c6",
      "#f0ad4e",
    ]);
  });

  it("builds recaudo chart datasets for value and variation modes", () => {
    const rows = [
      createRow({
        codicta: "01",
        desccta: "A",
        recaudoMesActual: 100,
        recaudoMesAnterior: 50,
        porcentajeVariacion: 100,
      }),
      createRow({
        codicta: "02",
        desccta: "B",
        recaudoMesActual: 200,
        recaudoMesAnterior: 300,
        porcentajeVariacion: -33.3,
      }),
    ];

    const valueResult = buildRecaudoChartData(rows, new Set(), "valor");
    const variationResult = buildRecaudoChartData(rows, new Set(["01"]), "variacion");

    expect(valueResult.labels).toEqual(["B", "A"]);
    expect(valueResult.datasets).toHaveLength(2);
    expect(valueResult.datasets[0].data).toEqual([200, 100]);

    expect(variationResult.labels).toEqual(["B"]);
    expect(variationResult.datasets).toHaveLength(1);
    expect(variationResult.datasets[0].label).toBe("Variacion %");
    expect(variationResult.datasets[0].data).toEqual([-33.3]);
  });
});
