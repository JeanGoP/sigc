import { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { type Plugin } from "chart.js";
import { fmtCOP } from "@app/utils/formattersFunctions";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import {
  buildComparativoAgingChartData,
  buildComparativoAgingDonaChartData,
  calculateDashboardPercentDelta,
  COMPARATIVO_AGING_TOTAL_CARTERAS,
} from "./domain/advancedChartBuilders";
import { useAppSelector } from "@app/store/store";

const gapPlugin: Plugin<"bar"> = {
  id: "gapPlugin",
  afterDatasetsDraw(chart) {
    const { ctx, data } = chart;
    const count = data.labels?.length ?? 0;

    if (!count) {
      return;
    }

    for (let index = 0; index < count; index += 1) {
      let sumActual = 0;
      let sumPrevious = 0;
      let xMax = 0;

      for (let datasetIndex = 0; datasetIndex < data.datasets.length; datasetIndex += 1) {
        const meta = chart.getDatasetMeta(datasetIndex);

        if (meta.hidden) {
          continue;
        }

        const dataset = data.datasets[datasetIndex] as any;
        const value = (dataset.data[index] as number) ?? 0;
        const barElement = meta.data[index] as any;

        if (barElement?.x > xMax) {
          xMax = barElement.x;
        }

        if (dataset.stack === "actual") {
          sumActual += value;
        }

        if (dataset.stack === "anterior") {
          sumPrevious += value;
        }
      }

      if (!sumPrevious) {
        continue;
      }

      const delta = sumActual - sumPrevious;
      const pct = calculateDashboardPercentDelta(sumActual, sumPrevious);
      const positive = delta >= 0;
      /* En móvil se omite el monto y se deja solo el %: el label completo
         obligaba a reservar 165px de padding derecho (44% del ancho en 375px). */
      const compact =
        (chart.options.plugins as any)?.gapPlugin?.compact === true;
      const pctText = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
      const label = compact
        ? pctText
        : `${fmtCOP(delta, true)} (${pctText})`;

      const currentBar = chart.getDatasetMeta(0).data[index] as any;
      const previousBar = chart.getDatasetMeta(5).data[index] as any;

      if (!currentBar || !previousBar) {
        continue;
      }

      const yCenter = (currentBar.y + previousBar.y) / 2;

      ctx.save();
      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = positive ? "#28B463" : "#BA4A00";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, xMax + 8, yCenter);
      ctx.restore();
    }
  },
};

export default function ComparativoAgingChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const isMobile = useAppSelector((state) => state.ui.screenSize) === "xs";
  const [tipoGrafico, setTipoGrafico] = useState<"barras" | "dona">("barras");
  const [carteraDona, setCarteraDona] = useState<string>(
    COMPARATIVO_AGING_TOTAL_CARTERAS,
  );
  const chartModel = buildComparativoAgingChartData(data, new Set(), "total");

  const cuentaOptions = useMemo(
    () =>
      chartModel.chipRows.map((row) => ({
        value: row.codicta,
        label: row.desccta,
      })),
    [chartModel.chipRows],
  );

  /* Si el filtro global deja fuera la cartera elegida en la dona, se vuelve a
     Total en vez de mostrar una dona vacía. */
  useEffect(() => {
    if (carteraDona === COMPARATIVO_AGING_TOTAL_CARTERAS) {
      return;
    }

    if (!cuentaOptions.some((option) => option.value === carteraDona)) {
      setCarteraDona(COMPARATIVO_AGING_TOTAL_CARTERAS);
    }
  }, [carteraDona, cuentaOptions]);

  const chartModelDona = useMemo(
    () => buildComparativoAgingDonaChartData(data, carteraDona),
    [data, carteraDona],
  );

  /* Anillos ocultables. La leyenda de Chart.js aquí lista los 5 tramos, no los
     datasets, así que el clic en leyenda no sirve para ocultar un periodo:
     hacen falta controles propios. */
  const [anillosOcultos, setAnillosOcultos] = useState<Set<string>>(new Set());

  const anillosDisponibles = chartModelDona.datasets.map(
    (dataset) => dataset.label,
  );
  const donaDatasetsVisibles = chartModelDona.datasets.filter(
    (dataset) => !anillosOcultos.has(dataset.label),
  );
  /* Si al cambiar de cartera desaparece el periodo anterior y el oculto era
     "Actual", el filtro dejaría la dona vacía: en ese caso se muestra todo. */
  const donaDatasets =
    donaDatasetsVisibles.length > 0
      ? donaDatasetsVisibles
      : chartModelDona.datasets;

  const toggleAnillo = (label: string) => {
    setAnillosOcultos((current) => {
      const next = new Set(current);

      if (next.has(label)) {
        next.delete(label);
        return next;
      }

      /* No se permite ocultar el último anillo visible: dejaría la dona vacía. */
      if (anillosDisponibles.length - next.size <= 1) {
        return current;
      }

      next.add(label);
      return next;
    });
  };

  const donaOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        /* Solo los 5 tramos: los anillos se distinguen por posición. */
        position: (isMobile ? "bottom" : "right") as "bottom" | "right",
        labels: { font: { size: 11 }, boxWidth: isMobile ? 10 : undefined },
      },
      tooltip: {
        callbacks: {
          /* El dataset dice de qué anillo/periodo es cada porción. */
          label: (context: any) =>
            ` ${context.dataset.label} · ${context.label}: ${fmtCOP(
              context.raw as number,
            )}`,
        },
      },
    },
  };

  const obligacionesPorTramo = useMemo(() => {
    return chartModel.visibleRows.reduce(
      (sum, row) => ({
        pv: sum.pv + row.obligacionesPV,
        d30: sum.d30 + row.obligaciones30,
        d60: sum.d60 + row.obligaciones60,
        d90: sum.d90 + row.obligaciones90,
        d90mas: sum.d90mas + row.obligaciones90mas,
      }),
      { pv: 0, d30: 0, d60: 0, d90: 0, d90mas: 0 },
    );
  }, [chartModel.visibleRows]);

  const distributionOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: isMobile ? 60 : 165 } },
    plugins: {
      gapPlugin: { compact: isMobile },
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          font: { size: 10 },
          boxWidth: 10,
          generateLabels: (chart: any) => {
            const trancheMeta = [
              { datasetIndex: 0, key: "pv" as const },
              { datasetIndex: 1, key: "d30" as const },
              { datasetIndex: 2, key: "d60" as const },
              { datasetIndex: 3, key: "d90" as const },
              { datasetIndex: 4, key: "d90mas" as const },
            ];

            return trancheMeta.map(({ datasetIndex, key }) => {
              const dataset = chart.data.datasets[datasetIndex];
              const meta = chart.getDatasetMeta(datasetIndex);
              const count = obligacionesPorTramo[key] ?? 0;

              return {
                text: `${dataset.label} (${count.toLocaleString("es-CO")} oblig.)`,
                fillStyle: dataset.backgroundColor,
                strokeStyle: dataset.backgroundColor,
                lineWidth: 0,
                hidden: meta.hidden,
                datasetIndex,
              };
            });
          },
        },
        onClick: (_event: any, item: any, legend: any) => {
          const chart = legend.chart;
          const datasetIndex = item.datasetIndex as number;
          const currentMeta = chart.getDatasetMeta(datasetIndex);
          currentMeta.hidden = !currentMeta.hidden;
          const previousIndex = datasetIndex + 5;

          if (previousIndex < chart.data.datasets.length) {
            chart.getDatasetMeta(previousIndex).hidden = currentMeta.hidden;
          }

          chart.update();
        },
      },
      tooltip: {
        callbacks: {
          title: (items: any[]) => items[0]?.label ?? "",
          label: (context: any) => {
            const value = context.raw as number;

            if (!value) {
              return null;
            }

            const isPrevious = (context.dataset.stack as string) === "anterior";
            const tramo = context.dataset.label.replace(" ant", "");
            const row = chartModel.visibleRows[context.dataIndex] as CarteraRow | undefined;
            const obligaciones =
              row && !isPrevious
                ? tramo === "PV"
                  ? row.obligacionesPV
                  : tramo === "30d"
                    ? row.obligaciones30
                    : tramo === "60d"
                      ? row.obligaciones60
                      : tramo === "90d"
                        ? row.obligaciones90
                        : tramo === "+90d"
                          ? row.obligaciones90mas
                          : 0
                : null;

            const base = ` ${tramo}${isPrevious ? " (anterior)" : ""}: ${fmtCOP(value)}`;
            return typeof obligaciones === "number"
              ? [base, ` Oblig.: ${obligaciones.toLocaleString("es-CO")}`]
              : base;
          },
        },
      },
    } as any,
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: (value: any) => fmtCOP(value as number),
          font: { size: 10 },
          maxTicksLimit: 5,
        },
      },
      y: {
        stacked: true,
        ticks: { font: { size: 11 } },
      },
    },
  };

  /* Móvil: menos alto por fila y techo, para que no crezca sin límite con
     muchas carteras. Este gráfico apila actual+anterior, de ahí el rowHeight
     doble cuando hay periodo anterior. */
  const rowHeight = isMobile
    ? chartModel.hayAnt
      ? 38
      : 20
    : chartModel.hayAnt
      ? 52
      : 28;
  /* En dona con una cartera concreta puede no haber periodo anterior aunque
     sí lo haya en el total, así que el aviso se basa en el modelo visible. */
  const hayAntVisible =
    tipoGrafico === "dona" ? chartModelDona.hayAnt : chartModel.hayAnt;

  /* La explicación "exterior/interior" solo aplica con los dos anillos a la
     vista; con uno oculto sería engañosa (el que queda pasa a ser el exterior). */
  const mostrarExplicacionPeriodos =
    tipoGrafico === "dona"
      ? hayAntVisible && donaDatasets.length > 1
      : hayAntVisible;

  const naturalHeight = chartModel.rowCount * rowHeight + 60;
  const chartHeight = maximized
    ? "calc(100vh - 320px)"
    : `${isMobile ? Math.min(naturalHeight, 800) : naturalHeight}px`;

  return (
    <div className="card">
      <div className="card-body">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <h6 className="card-title text-muted mb-0">
            Comparativo saldo por tramo · Actual vs Anterior
          </h6>

          {/* Mismo control que en "Composicion del recaudo por cartera", para
              que el usuario encuentre el toggle en el mismo lugar. */}
          <div style={{ display: "flex", gap: 6 }}>
            {(["barras", "dona"] as const).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setTipoGrafico(tipo)}
                style={{
                  padding: "2px 10px",
                  fontSize: 11,
                  borderRadius: 12,
                  border: "1px solid",
                  borderColor: tipoGrafico === tipo ? "#4f86c6" : "#ddd",
                  background: tipoGrafico === tipo ? "#4f86c6" : "#fff",
                  color: tipoGrafico === tipo ? "#fff" : "#666",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {tipo === "barras" ? "Barras" : "Dona"}
              </button>
            ))}
          </div>
        </div>

        {tipoGrafico === "dona" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 11, color: "#aaa" }}>Cartera:</span>
            <select
              value={carteraDona}
              onChange={(event) => setCarteraDona(event.target.value)}
              style={{
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 8,
                border: "1px solid #d0d5dd",
                color: "#344054",
                background: "#fff",
                maxWidth: "100%",
              }}
            >
              <option value={COMPARATIVO_AGING_TOTAL_CARTERAS}>Total</option>
              {cuentaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {anillosDisponibles.length > 1 && (
              <>
                <span style={{ fontSize: 11, color: "#aaa", marginLeft: 4 }}>
                  Anillos:
                </span>
                {anillosDisponibles.map((label) => {
                  const oculto = anillosOcultos.has(label);
                  return (
                    <button
                      key={label}
                      onClick={() => toggleAnillo(label)}
                      title={
                        oculto ? `Mostrar anillo ${label}` : `Ocultar anillo ${label}`
                      }
                      style={{
                        padding: "2px 10px",
                        fontSize: 11,
                        borderRadius: 12,
                        border: "1px solid",
                        borderColor: oculto ? "#ddd" : "#4f86c6",
                        background: oculto ? "#fff" : "#4f86c6",
                        color: oculto ? "#999" : "#fff",
                        textDecoration: oculto ? "line-through" : "none",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}

        {mostrarExplicacionPeriodos && (
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#666", marginBottom: 6 }}>
            <span>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  background: "#4f86c6",
                  borderRadius: 2,
                  marginRight: 4,
                }}
              />
              {tipoGrafico === "dona" ? (
                <>
                  Anillo <strong>exterior</strong> = Actual
                </>
              ) : (
                <>
                  Barra <strong>superior</strong> = Actual
                </>
              )}
            </span>
            <span>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  background: "#b0bec5",
                  borderRadius: 2,
                  marginRight: 4,
                }}
              />
              {tipoGrafico === "dona" ? (
                <>
                  Anillo <strong>interior</strong> = Anterior
                </>
              ) : (
                <>
                  Barra <strong>inferior</strong> = Anterior
                </>
              )}
            </span>
          </div>
        )}

        {!hayAntVisible && (
          <div
            style={{
              fontSize: 11,
              color: "#bbb",
              marginBottom: 8,
              fontStyle: "italic",
            }}
          >
            Sin datos del periodo anterior. Mostrando solo saldo actual.
          </div>
        )}

        {/* La dona agrega, así que no depende de rowCount: alto fijo, mayor en
            móvil porque ahí la leyenda va abajo y necesita espacio propio. */}
        <div
          style={{
            height:
              tipoGrafico === "dona"
                ? maximized
                  ? "calc(100vh - 320px)"
                  : isMobile
                    ? 360
                    : 320
                : chartHeight,
          }}
        >
          {tipoGrafico === "dona" ? (
            <Doughnut
              data={{
                labels: chartModelDona.labels,
                datasets: donaDatasets,
              }}
              options={donaOptions}
            />
          ) : (
            <Bar
              data={{
                labels: chartModel.labels,
                datasets: chartModel.distribucionDatasets,
              }}
              options={distributionOptions}
              plugins={chartModel.hayAnt ? [gapPlugin] : []}
            />
          )}
        </div>
      </div>
    </div>
  );
}
