import { useState, useMemo } from "react";
import { useMaximize } from "./MaximizeContext";
import { Bar } from "react-chartjs-2";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";

const COLORS = {
  pv:    "#28B463",
  d30:   "#D4AC0D",
  d60:   "#D68910",
  d90:   "#CA6F1E",
  d90mas:"#BA4A00",
};

import { fmtCOP } from "@app/utils/formattersFunctions";

export default function ComposicionRecaudoPorCarteraChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const [modoPorc, setModoPorc]         = useState(true);
  const [ocultas, setOcultas]           = useState<Set<string>>(new Set());

  // Filas con recaudo válido, ordenadas por +90 desc
  const filas = useMemo(() =>
    [...data]
      .map((r) => {
        const totalRec = r.recaudoPV + r.recaudo30 + r.recaudo60 + r.recaudo90 + r.recaudo90mas;
        if (totalRec === 0) return null;
        return { ...r, totalRec };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const pctA = a!.recaudo90mas / a!.totalRec;
        const pctB = b!.recaudo90mas / b!.totalRec;
        return pctB - pctA;
      }) as (CarteraRow & { totalRec: number })[]
  , [data]);

  const visibles = filas.filter((r) => !ocultas.has(r.desccta));

  const val = (r: CarteraRow & { totalRec: number }, campo: number) =>
    modoPorc ? (campo / r.totalRec) * 100 : campo;

  const chartData = {
    labels: visibles.map((r) => r.desccta),
    datasets: [
      { label: "Por vencer", data: visibles.map((r) => val(r, r.recaudoPV)),     backgroundColor: COLORS.pv,     borderRadius: 0 },
      { label: "30 días",    data: visibles.map((r) => val(r, r.recaudo30)),     backgroundColor: COLORS.d30,    borderRadius: 0 },
      { label: "60 días",    data: visibles.map((r) => val(r, r.recaudo60)),     backgroundColor: COLORS.d60,    borderRadius: 0 },
      { label: "90 días",    data: visibles.map((r) => val(r, r.recaudo90)),     backgroundColor: COLORS.d90,    borderRadius: 0 },
      { label: "+90 días",   data: visibles.map((r) => val(r, r.recaudo90mas)),  backgroundColor: COLORS.d90mas, borderRadius: 0 },
    ],
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            modoPorc
              ? ` ${ctx.dataset.label}: ${(ctx.raw as number).toFixed(1)}%`
              : ` ${ctx.dataset.label}: ${fmtCOP(ctx.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ...(modoPorc ? { min: 0, max: 100 } : { beginAtZero: true }),
        ticks: {
          callback: (v: any) => modoPorc ? `${v}%` : fmtCOP(v as number),
        },
      },
      y: {
        stacked: true,
        ticks: { font: { size: 11 } },
      },
    },
  };

  const toggleCartera = (desccta: string) => {
    setOcultas((prev) => {
      const next = new Set(prev);
      next.has(desccta) ? next.delete(desccta) : next.add(desccta);
      return next;
    });
  };

  return (
    <div className="card">
      <div className="card-body">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h6 className="card-title text-muted mb-0">Composición del recaudo por cartera</h6>

          {/* Switch % / $ */}
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

        <small className="text-muted d-block mb-2">
          Leyenda: oculta/muestra edades · Chips: oculta/muestra carteras
        </small>

        {/* Chips de carteras */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {filas.map((r) => {
            const hidden = ocultas.has(r.desccta);
            return (
              <button
                key={r.desccta}
                onClick={() => toggleCartera(r.desccta)}
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

        {/* Chart */}
        <div style={{ height: maximized ? "calc(100vh - 320px)" : visibles.length * 28 + 60 }}>
          <Bar data={chartData} options={options} />
        </div>

      </div>
    </div>
  );
}
