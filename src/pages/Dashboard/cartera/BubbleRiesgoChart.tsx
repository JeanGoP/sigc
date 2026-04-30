import { useState } from "react";
import { Bubble } from "react-chartjs-2";
import { BubbleController, Chart as ChartJS } from "chart.js";
import { useMaximize } from "./MaximizeContext";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import {
  buildBubbleRiesgoChartData,
  getBubbleRiesgoColor,
} from "./domain/advancedChartBuilders";

ChartJS.register(BubbleController);

export default function BubbleRiesgoChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  const chartModel = buildBubbleRiesgoChartData(data, ocultas);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            `${context.dataset.label} - Vencida: ${(context.raw.x as number).toFixed(1)}% | Indice recaudo: ${(context.raw.y as number).toFixed(1)}%`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "% Cartera vencida -> mayor riesgo" },
        ticks: { callback: (value: any) => `${value}%` },
      },
      y: {
        title: { display: true, text: "Indice de recaudo % -> mejor desempeno" },
        ticks: { callback: (value: any) => `${value}%` },
      },
    },
  };

  return (
    <div className="card">
      <div className="card-body">
        <div style={{ marginBottom: 8 }}>
          <h6 className="card-title text-muted mb-1">Mapa de riesgo-recaudo</h6>
          <small className="text-muted">Tamano = saldo total</small>
        </div>

        <small className="text-muted d-block mb-2">Chips: oculta/muestra carteras</small>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {chartModel.chipRows.map((row) => {
            const hidden = ocultas.has(row.codicta);
            const color = getBubbleRiesgoColor(row);

            return (
              <button
                key={row.codicta}
                onClick={() =>
                  setOcultas((current) => {
                    const next = new Set(current);
                    if (next.has(row.codicta)) {
                      next.delete(row.codicta);
                    } else {
                      next.add(row.codicta);
                    }
                    return next;
                  })
                }
                style={{
                  padding: "2px 9px",
                  fontSize: 11,
                  borderRadius: 12,
                  border: `1px solid ${hidden ? "#ccc" : color}`,
                  background: hidden ? "#f5f5f5" : `${color}22`,
                  color: hidden ? "#bbb" : color,
                  cursor: "pointer",
                  fontWeight: hidden ? 400 : 600,
                  textDecoration: hidden ? "line-through" : "none",
                  transition: "all 0.15s",
                }}
              >
                {row.desccta}
              </button>
            );
          })}
        </div>

        <div style={{ height: maximized ? "calc(100vh - 320px)" : 380 }}>
          <Bubble data={{ datasets: chartModel.datasets }} options={options} />
        </div>
      </div>
    </div>
  );
}
