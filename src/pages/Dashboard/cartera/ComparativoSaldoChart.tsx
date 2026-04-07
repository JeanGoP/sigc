import { useState }          from "react";
import { fmtCOP }            from "@app/utils/formattersFunctions";
import { Bar }               from "react-chartjs-2";
import { type Plugin }       from "chart.js";
import type { CarteraRow }   from "@app/Data/dashboardCarteraData";
import { useMaximize }       from "./MaximizeContext";

// ─── Plugin: etiqueta de variación % al final de cada par de barras ──────────
const deltaLabelPlugin: Plugin<"bar"> = {
  id: "deltaLabel",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta0 = chart.getDatasetMeta(0); // actual
    const meta1 = chart.getDatasetMeta(1); // anterior

    if (!meta0.data.length || !meta1.data.length) return;

    meta0.data.forEach((bar0, i) => {
      const bar1     = meta1.data[i];
      const actual   = (chart.data.datasets[0].data[i] as number) ?? 0;
      const anterior = (chart.data.datasets[1].data[i] as number) ?? 0;
      if (!anterior) return;

      const pct      = ((actual - anterior) / anterior) * 100;
      const xRight   = Math.max((bar0 as any).x, (bar1 as any).x) + 6;
      const yCenter  = ((bar0 as any).y + (bar1 as any).y) / 2;
      const positive = pct >= 0;

      ctx.save();
      ctx.font          = "bold 10px sans-serif";
      ctx.fillStyle     = positive ? "#6ab187" : "#d9534f";
      ctx.textAlign     = "left";
      ctx.textBaseline  = "middle";
      ctx.fillText(`${positive ? "+" : ""}${pct.toFixed(1)}%`, xRight, yCenter);
      ctx.restore();
    });
  },
};

// ─── Componente ──────────────────────────────────────────────────────────────
type SortKey = "actual" | "anterior" | "delta";

export default function ComparativoSaldoChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();

  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  const [sortBy,  setSortBy]  = useState<SortKey>("actual");

  const hayAnt = data.some((r) => (r.totalAnt ?? 0) > 0);

  const toggleCartera = (codicta: string) =>
    setOcultas((prev) => {
      const next = new Set(prev);
      next.has(codicta) ? next.delete(codicta) : next.add(codicta);
      return next;
    });

  const sorted = [...data]
    .filter((r) => !ocultas.has(r.codicta))
    .sort((a, b) => {
      if (sortBy === "actual")   return b.total - a.total;
      if (sortBy === "anterior") return (b.totalAnt ?? 0) - (a.totalAnt ?? 0);
      // delta
      const dA = (a.totalAnt ?? 0) > 0 ? ((a.total - (a.totalAnt ?? 0)) / (a.totalAnt ?? 0)) * 100 : 0;
      const dB = (b.totalAnt ?? 0) > 0 ? ((b.total - (b.totalAnt ?? 0)) / (b.totalAnt ?? 0)) * 100 : 0;
      return dB - dA;
    });

  const chartData = {
    labels: sorted.map((r) => r.desccta),
    datasets: [
      {
        label:           "Saldo actual",
        data:            sorted.map((r) => r.total),
        backgroundColor: "#4f86c6",
        borderRadius:    3,
        barPercentage:   0.7,
      },
      ...(hayAnt ? [{
        label:           "Saldo anterior",
        data:            sorted.map((r) => r.totalAnt ?? 0),
        backgroundColor: "#b0bec5",
        borderRadius:    3,
        barPercentage:   0.7,
      }] : []),
    ],
  };

  const options = {
    indexAxis:           "y" as const,
    responsive:          true,
    maintainAspectRatio: false,
    layout: { padding: { right: 64 } }, // espacio para etiquetas delta
    plugins: {
      legend: {
        display:  true,
        position: "top" as const,
        labels:   { font: { size: 11 }, boxWidth: 12 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${fmtCOP(ctx.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (v: any) => fmtCOP(v as number),
          font: { size: 10 },
          maxTicksLimit: 6,
        },
      },
      y: { ticks: { font: { size: 11 } } },
    },
  };

  const rowHeight  = hayAnt ? 46 : 26;
  const chartH     = maximized
    ? "calc(100vh - 300px)"
    : `${sorted.length * rowHeight + 60}px`;

  return (
    <div className="card">
      <div className="card-body">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h6 className="card-title text-muted mb-0">
            Saldo total por cartera
            {hayAnt && <span style={{ fontSize: 11, color: "#aaa", fontWeight: 400, marginLeft: 8 }}>Actual vs Anterior</span>}
          </h6>

          {/* Ordenar por */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ color: "#aaa" }}>Ordenar:</span>
            {(["actual", "anterior", "delta"] as SortKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setSortBy(k)}
                disabled={k === "anterior" && !hayAnt}
                style={{
                  padding:    "2px 10px",
                  fontSize:   11,
                  borderRadius: 12,
                  border:     "1px solid",
                  borderColor: sortBy === k ? "#4f86c6" : "#ddd",
                  background:  sortBy === k ? "#4f86c6" : "#fff",
                  color:       sortBy === k ? "#fff" : "#666",
                  cursor:      k === "anterior" && !hayAnt ? "not-allowed" : "pointer",
                  opacity:     k === "anterior" && !hayAnt ? 0.4 : 1,
                  transition:  "all 0.15s",
                }}
              >
                {k === "actual" ? "Actual" : k === "anterior" ? "Anterior" : "Δ%"}
              </button>
            ))}
          </div>
        </div>

        <small className="text-muted d-block mb-2">Chips: oculta/muestra carteras</small>

        {/* Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {data.map((r) => {
            const hidden = ocultas.has(r.codicta);
            return (
              <button
                key={r.codicta}
                onClick={() => toggleCartera(r.codicta)}
                style={{
                  padding:        "2px 9px",
                  fontSize:       11,
                  borderRadius:   12,
                  border:         "1px solid #ccc",
                  background:     hidden ? "#f5f5f5" : "#fff",
                  color:          hidden ? "#bbb" : "#444",
                  cursor:         "pointer",
                  textDecoration: hidden ? "line-through" : "none",
                  transition:     "all 0.15s",
                }}
              >
                {r.desccta}
              </button>
            );
          })}
        </div>

        {/* Aviso sin datos anteriores */}
        {!hayAnt && (
          <div style={{ fontSize: 11, color: "#bbb", marginBottom: 8, fontStyle: "italic" }}>
            Sin datos del período anterior — se muestra solo el saldo actual.
          </div>
        )}

        <div style={{ height: chartH }}>
          <Bar
            data={chartData}
            options={options}
            plugins={hayAnt ? [deltaLabelPlugin] : []}
          />
        </div>

      </div>
    </div>
  );
}
