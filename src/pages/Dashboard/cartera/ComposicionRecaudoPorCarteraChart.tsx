import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { fmtCOP } from "@app/utils/formattersFunctions";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import { toggleHiddenDashboardCartera } from "./domain/chartBuilders";
import { buildComposicionRecaudoPorCarteraChartData } from "./domain/remainingChartBuilders";

export default function ComposicionRecaudoPorCarteraChart({
  data,
}: {
  data: CarteraRow[];
}) {
  const maximized = useMaximize();
  const [modoPorc, setModoPorc] = useState(true);
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  const chartModel = buildComposicionRecaudoPorCarteraChartData(
    data,
    ocultas,
    modoPorc ? "porcentaje" : "valor",
  );

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            modoPorc
              ? ` ${context.dataset.label}: ${(context.raw as number).toFixed(1)}%`
              : ` ${context.dataset.label}: ${fmtCOP(context.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ...(modoPorc ? { min: 0, max: 100 } : { beginAtZero: true }),
        ticks: {
          callback: (value: any) =>
            modoPorc ? `${value}%` : fmtCOP(value as number),
        },
      },
      y: {
        stacked: true,
        ticks: { font: { size: 11 } },
      },
    },
  };

  return (
    <div className="card">
      <div className="card-body">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <h6 className="card-title text-muted mb-0">
            Composicion del recaudo por cartera
          </h6>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span
              style={{
                color: !modoPorc ? "#4f86c6" : "#aaa",
                fontWeight: !modoPorc ? 600 : 400,
              }}
            >
              $
            </span>
            <div
              onClick={() => setModoPorc((current) => !current)}
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                background: modoPorc ? "#4f86c6" : "#ccc",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#fff",
                  position: "absolute",
                  top: 3,
                  left: modoPorc ? 20 : 4,
                  transition: "left 0.2s",
                }}
              />
            </div>
            <span
              style={{
                color: modoPorc ? "#4f86c6" : "#aaa",
                fontWeight: modoPorc ? 600 : 400,
              }}
            >
              %
            </span>
          </div>
        </div>

        <small className="text-muted d-block mb-2">
          Leyenda: oculta/muestra edades. Chips: oculta/muestra carteras
        </small>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {chartModel.chipRows.map((row) => {
            const hidden = ocultas.has(row.codicta);

            return (
              <button
                key={row.codicta}
                onClick={() =>
                  setOcultas((current) =>
                    toggleHiddenDashboardCartera(current, row.codicta),
                  )
                }
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
                {row.desccta}
              </button>
            );
          })}
        </div>

        <div
          style={{
            height: maximized
              ? "calc(100vh - 320px)"
              : chartModel.rowCount * 28 + 60,
          }}
        >
          <Bar
            data={{
              labels: chartModel.labels,
              datasets: chartModel.datasets,
            }}
            options={options}
          />
        </div>
      </div>
    </div>
  );
}
