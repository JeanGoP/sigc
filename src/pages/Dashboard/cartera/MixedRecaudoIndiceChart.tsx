import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { LineController, LineElement } from "chart.js";
import { useMaximize } from "./MaximizeContext";
import { Chart as ChartJS } from "chart.js";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { fmtCOP } from "@app/utils/formattersFunctions";

ChartJS.register(LineController, LineElement);

export default function MixedRecaudoIndiceChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());

  const toggleCartera = (codicta: string) =>
    setOcultas((prev) => {
      const next = new Set(prev);
      next.has(codicta) ? next.delete(codicta) : next.add(codicta);
      return next;
    });

  const filas = [...data].filter((r) => r.recaudoMesActual > 0 && r.indiceRecaudo > 0);

  const visibles = filas
    .filter((r) => !ocultas.has(r.codicta))
    .sort((a, b) => b.recaudoMesActual - a.recaudoMesActual);

  const chartData = {
    labels: visibles.map((r) => r.desccta),
    datasets: [
      {
        type: "bar" as const,
        label: "Recaudo mes actual",
        data: visibles.map((r) => r.recaudoMesActual),
        backgroundColor: "#4f86c6bb",
        borderRadius: 3,
        yAxisID: "yRecaudo",
      },
      {
        type: "line" as const,
        label: "Índice de recaudo %",
        data: visibles.map((r) => r.indiceRecaudo),
        borderColor: "#d9534f",
        backgroundColor: "transparent",
        pointBackgroundColor: "#d9534f",
        pointRadius: 4,
        tension: 0.3,
        yAxisID: "yIndice",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const },
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            ctx.datasetIndex === 0
              ? ` Recaudo: ${fmtCOP(ctx.raw as number)}`
              : ` Índice: ${(ctx.raw as number).toFixed(2)}%`,
        },
      },
    },
    scales: {
      x: { ticks: { font: { size: 10 } } },
      yRecaudo: {
        type: "linear" as const,
        position: "left" as const,
        ticks: { callback: (v: any) => fmtCOP(v as number) },
        title: { display: true, text: "Recaudo ($)" },
      },
      yIndice: {
        type: "linear" as const,
        position: "right" as const,
        grid: { drawOnChartArea: false },
        ticks: { callback: (v: any) => `${v}%` },
        title: { display: true, text: "Índice recaudo (%)" },
      },
    },
  };

  return (
    <div className="card">
      <div className="card-body">

        <div style={{ marginBottom: 8 }}>
          <h6 className="card-title text-muted mb-0">Recaudo vs Índice de recaudo por cartera</h6>
        </div>

        <small className="text-muted d-block mb-2">Chips: oculta/muestra carteras</small>

        {/* Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {filas.map((r) => {
            const hidden = ocultas.has(r.codicta);
            return (
              <button
                key={r.codicta}
                onClick={() => toggleCartera(r.codicta)}
                style={{
                  padding: "2px 9px",
                  fontSize: 11,
                  borderRadius: 12,
                  border: "1px solid #ccc",
                  background: hidden ? "#f5f5f5" : "#fff",
                  color: hidden ? "#bbb" : "#444",
                  cursor: "pointer",
                  textDecoration: hidden ? "line-through" : "none",
                  transition: "all 0.15s",
                }}
              >
                {r.desccta}
              </button>
            );
          })}
        </div>

        <div style={{ height: maximized ? "calc(100vh - 320px)" : 340 }}>
          <Bar data={chartData} options={options} />
        </div>

      </div>
    </div>
  );
}
