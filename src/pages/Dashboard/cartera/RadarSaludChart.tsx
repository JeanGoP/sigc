import { useState } from "react";
import { Radar } from "react-chartjs-2";
import { Chart as ChartJS, Filler, RadarController, RadialLinearScale } from "chart.js";
import { useMaximize } from "./MaximizeContext";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import {
  buildRadarSaludChartData,
  RADAR_SALUD_COLOR_PALETTE,
} from "./domain/advancedChartBuilders";

ChartJS.register(RadarController, RadialLinearScale, Filler);

export default function RadarSaludChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());
  const chartModel = buildRadarSaludChartData(data, seleccionadas);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: { font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            ` ${context.dataset.label}: ${(context.raw as number).toFixed(1)}`,
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { stepSize: 25, font: { size: 10 } },
        pointLabels: { font: { size: 11 } },
      },
    },
  };

  return (
    <div className="card">
      <div className="card-body">
        <div style={{ marginBottom: 8 }}>
          <h6 className="card-title text-muted mb-1">Perfil de salud por cartera</h6>
          <small className="text-muted">
            Ejes normalizados 0-100. Mayor area = mejor desempeno. La linea gris es el promedio del sistema.
          </small>
        </div>

        <small className="text-muted d-block mt-2 mb-2">
          Selecciona las carteras que deseas comparar
        </small>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {chartModel.chipRows.map((row) => {
            const selectedIndex = chartModel.selectedRows.findIndex(
              (selectedRow) => selectedRow.codicta === row.codicta,
            );
            const active = selectedIndex >= 0;
            const color = active
              ? RADAR_SALUD_COLOR_PALETTE[
                  selectedIndex % RADAR_SALUD_COLOR_PALETTE.length
                ].border
              : "#ccc";

            return (
              <button
                key={row.codicta}
                onClick={() =>
                  setSeleccionadas((current) => {
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
                  border: `1px solid ${color}`,
                  background: active ? `${color}22` : "#f5f5f5",
                  color: active ? color : "#bbb",
                  cursor: "pointer",
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                {row.desccta}
              </button>
            );
          })}
        </div>

        {chartModel.selectedRows.length === 0 ? (
          <div
            style={{
              height: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="text-muted" style={{ fontSize: 13 }}>
              Selecciona al menos una cartera para visualizar su perfil
            </span>
          </div>
        ) : (
          <div style={{ height: maximized ? "calc(100vh - 320px)" : 360 }}>
            <Radar
              data={{
                labels: chartModel.labels,
                datasets: chartModel.datasets,
              }}
              options={options}
            />
          </div>
        )}
      </div>
    </div>
  );
}
