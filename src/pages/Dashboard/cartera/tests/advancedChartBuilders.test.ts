import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import {
  buildBubbleRiesgoChartData,
  buildComparativoAgingChartData,
  buildComparativoSaldoChartData,
  buildRadarSaludChartData,
  buildRadarSaludMetrics,
  calculateDashboardPercentDelta,
  getBubbleRiesgoColor,
} from "../domain/advancedChartBuilders";

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

describe("dashboard advanced chart builders", () => {
  it("calculates percent delta only when there is previous data", () => {
    expect(calculateDashboardPercentDelta(120, 100)).toBeCloseTo(20);
    expect(calculateDashboardPercentDelta(120, 0)).toBe(0);
  });

  it("builds comparativo saldo datasets and sorts by delta", () => {
    const result = buildComparativoSaldoChartData(
      [
        createRow({ codicta: "01", desccta: "A", total: 200, totalAnt: 100 }),
        createRow({ codicta: "02", desccta: "B", total: 300, totalAnt: 400 }),
      ],
      new Set(),
      "delta",
    );

    expect(result.hayAnt).toBe(true);
    expect(result.labels).toEqual(["A", "B"]);
    expect(result.datasets).toHaveLength(2);
    expect(result.datasets[0].data).toEqual([200, 300]);
  });

  it("builds comparativo aging distribution and variation datasets", () => {
    const result = buildComparativoAgingChartData(
      [
        createRow({
          codicta: "01",
          desccta: "A",
          total: 300,
          pv: 100,
          d30: 50,
          d60: 50,
          d90: 50,
          d90mas: 50,
          totalAnt: 200,
          pvAnt: 80,
          d30Ant: 40,
          d60Ant: 30,
          d90Ant: 30,
          d90masAnt: 20,
        }),
      ],
      new Set(),
      "pv",
    );

    expect(result.hayAnt).toBe(true);
    expect(result.labels).toEqual(["A"]);
    expect(result.distribucionDatasets).toHaveLength(10);
    expect(result.variacionDataset.label).toBe("Delta PV");
    expect(result.variacionDataset.data).toEqual([20]);
  });

  it("builds bubble chart datasets and colors by risk", () => {
    const rows = [
      createRow({
        codicta: "01",
        desccta: "A",
        total: 1000,
        carteraVencidaPorc: 20,
        indiceRecaudo: 10,
      }),
      createRow({
        codicta: "02",
        desccta: "B",
        total: 500,
        carteraVencidaPorc: 5,
        indiceRecaudo: 12,
      }),
    ];
    const result = buildBubbleRiesgoChartData(rows, new Set(["02"]));

    expect(getBubbleRiesgoColor(rows[0])).toBe("#d9534f");
    expect(result.chipRows).toHaveLength(2);
    expect(result.datasets).toHaveLength(1);
    expect(result.datasets[0]).toMatchObject({
      label: "A",
      borderColor: "#d9534f",
    });
  });

  it("builds radar metrics and datasets", () => {
    const row = createRow({
      codicta: "01",
      desccta: "A",
      carteraVencidaPorc: 25,
      indiceRecaudo: 10,
      obligacionesTotal: 10,
      obligacionesPV: 8,
      porcentajeVariacion: 5,
      carteraVencida: 100,
      recaudoVencido: 50,
    });
    const metrics = buildRadarSaludMetrics(row);
    const result = buildRadarSaludChartData([row], new Set(["01"]));

    expect(metrics).toMatchObject({
      saludMora: 75,
      indice: 50,
      clientesAlDia: 80,
      eficiencia: 50,
    });
    expect(result.labels).toHaveLength(5);
    expect(result.selectedRows).toHaveLength(1);
    expect(result.datasets).toHaveLength(2);
    expect(result.datasets[1]).toMatchObject({
      label: "A",
      borderColor: "#4f86c6",
    });
  });
});
