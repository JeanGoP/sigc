import { useState } from "react";
import { Doughnut } from "react-chartjs-2";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { fmtCOP } from "@app/utils/formattersFunctions";
import { useMaximize } from "./MaximizeContext";
import {
  buildDistribucionSaldoChartData,
  toggleHiddenDashboardCartera,
} from "./domain/chartBuilders";

export default function DistribucionSaldoChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  const chartModel = buildDistribucionSaldoChartData(data, ocultas);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" as const },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${context.label}: ${fmtCOP(context.raw as number)}`,
        },
      },
    },
  };

  return (
    <div className="card h-100">
      <div className="card-body" style={{ display: "flex", flexDirection: "column" }}>
        <h6 className="card-title text-muted mb-2">Distribucion saldo por edad</h6>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
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
                {row.desccta || row.codicta}
              </button>
            );
          })}
        </div>

        <div style={{ height: maximized ? "calc(100vh - 220px)" : 240 }}>
          <Doughnut
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
