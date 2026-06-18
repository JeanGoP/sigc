import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { buildDashboardCarteraKpiPanels } from "../domain/kpis";

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

describe("dashboard cartera kpis", () => {
  it("builds the cartera and recaudo panels", () => {
    const panels = buildDashboardCarteraKpiPanels([
      createRow({
        desccta: "Cartera A",
        obligacionesTotal: 10,
        obligacionesPV: 8,
        obligaciones30: 1,
        obligaciones60: 1,
        total: 1000,
        d30: 120,
        d60: 50,
        d90: 20,
        d90mas: 10,
        carteraVencida: 200,
        carteraVencidaPorc: 20,
        totalAnt: 800,
        carteraVencidaAnt: 100,
        recaudoMesActual: 300,
        recaudoMesAnterior: 200,
        indiceRecaudo: 10,
      }),
      createRow({
        codicta: "02",
        desccta: "DC Interna",
        obligacionesTotal: 5,
        obligacionesPV: 5,
        total: 500,
        carteraVencida: 0,
        carteraVencidaPorc: 25,
        totalAnt: 500,
        carteraVencidaAnt: 50,
        recaudoMesActual: 100,
        recaudoMesAnterior: 100,
        indiceRecaudo: 5,
      }),
    ]);

    expect(panels).toHaveLength(2);
    expect(panels[0].metrics[0]).toMatchObject({
      label: "Total obligaciones",
      value: "15",
      sub: "clientes activos",
    });
    expect(
      panels[0].metrics.find((metric) => metric.label === "Saldo total"),
    ).toMatchObject({
      value: "$1.500,00",
      sub: "Ant: $1.300,00",
    });
    expect(
      panels[0].metrics.find((metric) => metric.label === "Vencida 30 dias"),
    ).toMatchObject({
      value: "$120,00",
      sub: "8.0% de cartera bruta",
    });
    expect(
      panels[0].metrics.find((metric) => metric.label === "Mora critica"),
    ).toMatchObject({
      value: "1 carteras",
    });
    expect(
      panels[0].metrics.find((metric) => metric.label === "Mejor indice recaudo"),
    ).toMatchObject({
      value: "10.0%",
      sub: "Cartera A",
    });
    expect(
      panels[1].metrics.find((metric) => metric.label === "Mes actual"),
    ).toMatchObject({
      value: "$400,00",
    });
  });

  it("falls back cleanly when there is no previous period data", () => {
    const panels = buildDashboardCarteraKpiPanels([
      createRow({
        obligacionesTotal: 2,
        obligacionesPV: 2,
        total: 300,
        carteraVencida: 0,
      }),
    ]);

    expect(
      panels[0].metrics.find((metric) => metric.label === "Saldo total")?.delta,
    ).toBeUndefined();
    expect(
      panels[0].metrics.find((metric) => metric.label === "Cartera vencida"),
    ).toMatchObject({
      sub: "$0,00",
    });
  });
});
