import { useState } from "react";
import { Doughnut } from "react-chartjs-2";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";

import { fmtCOP } from "@app/utils/formattersFunctions";

const COLORS = ["#28B463", "#D4AC0D", "#D68910", "#CA6F1E", "#BA4A00"];

export default function DistribucionSaldoChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());

  const toggleCartera = (codicta: string) =>
    setOcultas((prev) => {
      const next = new Set(prev);
      next.has(codicta) ? next.delete(codicta) : next.add(codicta);
      return next;
    });

  const visibles = data.filter((r) => !ocultas.has(r.codicta));

  const pv     = visibles.reduce((s, r) => s + r.pv, 0);
  const d30    = visibles.reduce((s, r) => s + r.d30, 0);
  const d60    = visibles.reduce((s, r) => s + r.d60, 0);
  const d90    = visibles.reduce((s, r) => s + r.d90, 0);
  const d90mas = visibles.reduce((s, r) => s + r.d90mas, 0);

  const chartData = {
    labels: ["Por vencer", "30 días", "60 días", "90 días", "+90 días"],
    datasets: [{
      data: [pv, d30, d60, d90, d90mas],
      backgroundColor: COLORS,
      borderWidth: 0,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${fmtCOP(ctx.raw as number)}`,
        },
      },
    },
  };

  return (
    <div className="card h-100">
      <div className="card-body" style={{ display: "flex", flexDirection: "column" }}>
        <h6 className="card-title text-muted mb-2">Distribución saldo por edad</h6>

        {/* Chips de carteras */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
          {data.map((r) => {
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
                {r.desccta || r.codicta}
              </button>
            );
          })}
        </div>

        <div style={{ height: maximized ? "calc(100vh - 220px)" : 240 }}>
          <Doughnut data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}
