import { useState } from "react";
import { Bubble } from "react-chartjs-2";
import { useMaximize } from "./MaximizeContext";
import { BubbleController } from "chart.js";
import { Chart as ChartJS } from "chart.js";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";

ChartJS.register(BubbleController);

const colorFor = (row: CarteraRow) => {
  if (row.carteraVencidaPorc > 15) return "#d9534f";
  if (row.carteraVencidaPorc > 8)  return "#f0ad4e";
  return "#6ab187";
};

export default function BubbleRiesgoChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());

  const toggleCartera = (codicta: string) =>
    setOcultas((prev) => {
      const next = new Set(prev);
      next.has(codicta) ? next.delete(codicta) : next.add(codicta);
      return next;
    });

  const filas    = data.filter((r) => r.total > 0 && r.indiceRecaudo > 0);
  const visibles = filas.filter((r) => !ocultas.has(r.codicta));
  const maxTotal = Math.max(...filas.map((r) => r.total));

  const chartData = {
    datasets: visibles.map((r) => ({
      label: r.desccta,
      data: [{
        x: r.carteraVencidaPorc,
        y: r.indiceRecaudo,
        r: 5 + (r.total / maxTotal) * 28,
      }],
      backgroundColor: colorFor(r) + "99",
      borderColor: colorFor(r),
      borderWidth: 1.5,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            `${ctx.dataset.label} — Vencida: ${ctx.raw.x.toFixed(1)}% | Índice recaudo: ${ctx.raw.y.toFixed(1)}%`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "% Cartera vencida  →  mayor riesgo" },
        ticks: { callback: (v: any) => `${v}%` },
      },
      y: {
        title: { display: true, text: "Índice de recaudo %  →  mejor desempeño" },
        ticks: { callback: (v: any) => `${v}%` },
      },
    },
  };

  return (
    <div className="card">
      <div className="card-body">

        <div style={{ marginBottom: 8 }}>
          <h6 className="card-title text-muted mb-1">Mapa de riesgo-recaudo</h6>
          <small className="text-muted">Tamaño = saldo total</small>
        </div>

        <small className="text-muted d-block mb-2">Chips: oculta/muestra carteras</small>

        {/* Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {filas.map((r) => {
            const hidden = ocultas.has(r.codicta);
            const color  = colorFor(r);
            return (
              <button
                key={r.codicta}
                onClick={() => toggleCartera(r.codicta)}
                style={{
                  padding: "2px 9px",
                  fontSize: 11,
                  borderRadius: 12,
                  border: `1px solid ${hidden ? "#ccc" : color}`,
                  background: hidden ? "#f5f5f5" : color + "22",
                  color: hidden ? "#bbb" : color,
                  cursor: "pointer",
                  fontWeight: hidden ? 400 : 600,
                  textDecoration: hidden ? "line-through" : "none",
                  transition: "all 0.15s",
                }}
              >
                {r.desccta}
              </button>
            );
          })}
        </div>

        <div style={{ height: maximized ? "calc(100vh - 320px)" : 380 }}>
          <Bubble data={chartData} options={options} />
        </div>

      </div>
    </div>
  );
}
