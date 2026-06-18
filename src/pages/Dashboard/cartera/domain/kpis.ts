import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { fmtCOP } from "../../../../utils/formattersFunctions";

const fmtPct = (value: number) => `${value.toFixed(1)}%`;

export interface DashboardKpiDelta {
  pct: number;
  inverted?: boolean;
}

export interface DashboardKpiMetric {
  label: string;
  value: string;
  sub: string;
  color: string;
  delta?: DashboardKpiDelta;
}

export interface DashboardKpiPanel {
  title: string;
  color: string;
  metrics: DashboardKpiMetric[];
}

export function buildDashboardCarteraKpiPanels(
  data: CarteraRow[],
): DashboardKpiPanel[] {
  const totalObligaciones = data.reduce((sum, row) => sum + row.obligacionesTotal, 0);
  const totalSaldo = data.reduce((sum, row) => sum + row.total, 0);
  const totalVencida = data.reduce((sum, row) => sum + row.carteraVencida, 0);
  const porcVencida = totalSaldo > 0 ? (totalVencida / totalSaldo) * 100 : 0;

  const totalVencida30 = data.reduce((sum, row) => sum + row.d30, 0);
  const totalVencida60 = data.reduce((sum, row) => sum + row.d60, 0);
  const totalVencida90 = data.reduce((sum, row) => sum + row.d90, 0);
  const totalVencida90mas = data.reduce((sum, row) => sum + row.d90mas, 0);
  const porcVencida30 = totalSaldo > 0 ? (totalVencida30 / totalSaldo) * 100 : 0;
  const porcVencida60 = totalSaldo > 0 ? (totalVencida60 / totalSaldo) * 100 : 0;
  const porcVencida90 = totalSaldo > 0 ? (totalVencida90 / totalSaldo) * 100 : 0;
  const porcVencida90mas =
    totalSaldo > 0 ? (totalVencida90mas / totalSaldo) * 100 : 0;

  const totalSaldoAnt = data.reduce((sum, row) => sum + (row.totalAnt ?? 0), 0);
  const totalVencidaAnt = data.reduce(
    (sum, row) => sum + (row.carteraVencidaAnt ?? 0),
    0,
  );
  const porcVencidaAnt =
    totalSaldoAnt > 0 ? (totalVencidaAnt / totalSaldoAnt) * 100 : 0;

  const deltaSaldo =
    totalSaldoAnt > 0 ? ((totalSaldo - totalSaldoAnt) / totalSaldoAnt) * 100 : 0;
  const deltaVencidaPorc =
    porcVencidaAnt > 0 ? porcVencida - porcVencidaAnt : 0;
  const deltaVencidaPct =
    totalVencidaAnt > 0
      ? ((totalVencida - totalVencidaAnt) / totalVencidaAnt) * 100
      : 0;

  const clientesEnMora = data.reduce(
    (sum, row) =>
      sum +
      row.obligaciones30 +
      row.obligaciones60 +
      row.obligaciones90 +
      row.obligaciones90mas,
    0,
  );
  const porcClientesAlDia =
    totalObligaciones > 0
      ? (data.reduce((sum, row) => sum + row.obligacionesPV, 0) /
          totalObligaciones) *
        100
      : 0;

  const totalRecaudoAct = data.reduce((sum, row) => sum + row.recaudoMesActual, 0);
  const totalRecaudoAnt = data.reduce(
    (sum, row) => sum + row.recaudoMesAnterior,
    0,
  );
  const difRecaudo = totalRecaudoAct - totalRecaudoAnt;
  const varRecaudo =
    totalRecaudoAnt > 0 ? (difRecaudo / totalRecaudoAnt) * 100 : 0;
  const indicesValidos = data
    .filter((row) => row.indiceRecaudo > 0)
    .map((row) => row.indiceRecaudo);
  const indicePromedio =
    indicesValidos.length > 0
      ? indicesValidos.reduce((sum, value) => sum + value, 0) /
        indicesValidos.length
      : 0;

  const carterasMoraCritica = data.filter(
    (row) => row.carteraVencidaPorc > 15 && !row.desccta.startsWith("DC"),
  ).length;
  const mejorIndice = [...data]
    .filter((row) => row.indiceRecaudo > 0)
    .sort((a, b) => b.indiceRecaudo - a.indiceRecaudo)[0];

  const hayDatosAnt = totalSaldoAnt > 0;

  return [
    {
      title: "Cartera",
      color: "#4f86c6",
      metrics: [
        {
          label: "Total obligaciones",
          value: totalObligaciones.toLocaleString("es-CO"),
          sub: "clientes activos",
          color: "#4f86c6",
        },
        {
          label: "Saldo total",
          value: fmtCOP(totalSaldo),
          sub: hayDatosAnt ? `Ant: ${fmtCOP(totalSaldoAnt)}` : "saldo vigente",
          color: "#4f86c6",
          delta: hayDatosAnt ? { pct: deltaSaldo } : undefined,
        },
        {
          label: "Cartera vencida",
          value: fmtPct(porcVencida),
          sub: hayDatosAnt
            ? `Ant: ${fmtPct(porcVencidaAnt)} (${deltaVencidaPorc >= 0 ? "+" : ""}${deltaVencidaPorc.toFixed(1)} pp)`
            : fmtCOP(totalVencida),
          color: porcVencida > 10 ? "#BA4A00" : "#D68910",
          delta: hayDatosAnt ? { pct: deltaVencidaPct, inverted: true } : undefined,
        },
        {
          label: "Vencida 30 dias",
          value: fmtCOP(totalVencida30),
          sub: `${fmtPct(porcVencida30)} de cartera bruta`,
          color: "#D4AC0D",
        },
        {
          label: "Vencida 60 dias",
          value: fmtCOP(totalVencida60),
          sub: `${fmtPct(porcVencida60)} de cartera bruta`,
          color: "#D68910",
        },
        {
          label: "Vencida 90 dias",
          value: fmtCOP(totalVencida90),
          sub: `${fmtPct(porcVencida90)} de cartera bruta`,
          color: "#CA6F1E",
        },
        {
          label: "Vencida +90 dias",
          value: fmtCOP(totalVencida90mas),
          sub: `${fmtPct(porcVencida90mas)} de cartera bruta`,
          color: "#BA4A00",
        },
        {
          label: "Mora critica",
          value: `${carterasMoraCritica} carteras`,
          sub: "> 15% vencida",
          color: carterasMoraCritica > 3 ? "#BA4A00" : "#D68910",
        },
        {
          label: "Clientes en mora",
          value: clientesEnMora.toLocaleString("es-CO"),
          sub: "atraso > 0 dias",
          color: "#CA6F1E",
        },
        {
          label: "Clientes al dia",
          value: fmtPct(porcClientesAlDia),
          sub: "sobre total activos",
          color: porcClientesAlDia >= 90 ? "#28B463" : "#D68910",
        },
        {
          label: "Mejor indice recaudo",
          value: fmtPct(mejorIndice?.indiceRecaudo ?? 0),
          sub: mejorIndice?.desccta ?? "",
          color: "#28B463",
        },
      ],
    },
    {
      title: "Recaudo",
      color: "#4f86c6",
      metrics: [
        {
          label: "Mes actual",
          value: fmtCOP(totalRecaudoAct),
          sub: `${varRecaudo >= 0 ? "+" : ""}${fmtPct(varRecaudo)} vs mes anterior`,
          color: varRecaudo >= 0 ? "#28B463" : "#BA4A00",
        },
        {
          label: "Mes anterior",
          value: fmtCOP(totalRecaudoAnt),
          sub: "periodo previo",
          color: "#7a8a99",
        },
        {
          label: "Diferencia",
          value: `${difRecaudo >= 0 ? "+" : ""}${fmtCOP(difRecaudo)}`,
          sub: "actual vs anterior",
          color: difRecaudo >= 0 ? "#28B463" : "#BA4A00",
        },
        {
          label: "Indice prom.",
          value: fmtPct(indicePromedio),
          sub: "promedio carteras activas",
          color: indicePromedio >= 8 ? "#28B463" : "#D68910",
        },
      ],
    },
  ];
}
