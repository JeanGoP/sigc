import { useState } from "react";
import { Doughnut } from "react-chartjs-2";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";

import { fmtCOP } from "@app/utils/formattersFunctions";

const COLORS = ["#28B463", "#D4AC0D", "#D68910", "#CA6F1E", "#BA4A00"];
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

export default function ComposicionRecaudoChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const [modoPorc, setModoPorc] = useState(false);
  const [ocultas, setOcultas]   = useState<Set<string>>(new Set());

  const toggleCartera = (codicta: string) =>
    setOcultas((prev) => {
      const next = new Set(prev);
      next.has(codicta) ? next.delete(codicta) : next.add(codicta);
      return next;
    });

  const filas = data.filter(
    (r) => r.recaudoPV + r.recaudo30 + r.recaudo60 + r.recaudo90 + r.recaudo90mas > 0
  );

  const visibles = filas.filter((r) => !ocultas.has(r.codicta));

  const pv     = visibles.reduce((s, r) => s + r.recaudoPV, 0);
  const d30    = visibles.reduce((s, r) => s + r.recaudo30, 0);
  const d60    = visibles.reduce((s, r) => s + r.recaudo60, 0);
  const d90    = visibles.reduce((s, r) => s + r.recaudo90, 0);
  const d90mas = visibles.reduce((s, r) => s + r.recaudo90mas, 0);
  const total  = pv + d30 + d60 + d90 + d90mas;

  const valores     = [pv, d30, d60, d90, d90mas];
  const porcentajes = valores.map((v) => (total > 0 ? (v / total) * 100 : 0));

  const chartData = {
    labels: ["Por vencer", "30 días", "60 días", "90 días", "+90 días"],
    datasets: [{
      data: modoPorc ? porcentajes : valores,
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
          label: (ctx: any) =>
            modoPorc
              ? ` ${ctx.label}: ${fmtPct(ctx.raw as number)}`
              : ` ${ctx.label}: ${fmtCOP(ctx.raw as number)}`,
        },
      },
    },
  };

  return (
    <div className="card h-100">
      <div className="card-body">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h6 className="card-title text-muted mb-0">¿De dónde viene el recaudo?</h6>

          {/* Switch $ / % */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ color: !modoPorc ? "#4f86c6" : "#aaa", fontWeight: !modoPorc ? 600 : 400 }}>$</span>
            <div
              onClick={() => setModoPorc((v) => !v)}
              style={{
                width: 40, height: 22, borderRadius: 11,
                background: modoPorc ? "#4f86c6" : "#ccc",
                cursor: "pointer", position: "relative", transition: "background 0.2s",
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3,
                left: modoPorc ? 20 : 4,
                transition: "left 0.2s",
              }} />
            </div>
            <span style={{ color: modoPorc ? "#4f86c6" : "#aaa", fontWeight: modoPorc ? 600 : 400 }}>%</span>
          </div>
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

        <div style={{ height: maximized ? "calc(100vh - 280px)" : 240 }}>
          <Doughnut data={chartData} options={options} />
        </div>

      </div>
    </div>
  );
}
