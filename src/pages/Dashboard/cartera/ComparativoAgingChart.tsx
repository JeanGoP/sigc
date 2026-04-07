import { useState }        from "react";
import { fmtCOP }          from "@app/utils/formattersFunctions";
import { Bar }             from "react-chartjs-2";
import { type Plugin }     from "chart.js";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize }     from "./MaximizeContext";

type ViewMode = "distribucion" | "variacion";
type Segmento = "total" | "pv" | "d30" | "d60" | "d90" | "d90mas";

// ─── Paleta de colores por tramo ──────────────────────────────────────────────
const COLOR = {
  pv:     { vivo: "#28B463", suave: "#94D9B1" },
  d30:    { vivo: "#D4AC0D", suave: "#EDD986" },
  d60:    { vivo: "#D68910", suave: "#EBC488" },
  d90:    { vivo: "#CA6F1E", suave: "#E5B78F" },
  d90mas: { vivo: "#BA4A00", suave: "#DDA580" },
};

// ─── Plugin: etiqueta gap/exceso al final de cada par de stacks ───────────────
// Calcula dinámicamente la suma de los datasets visibles por stack,
// de modo que el label refleja exactamente lo que se ve en pantalla.
const gapPlugin: Plugin<"bar"> = {
  id: "gapPlugin",
  afterDatasetsDraw(chart) {
    const { ctx, data } = chart;
    const n = data.labels?.length ?? 0;
    if (!n) return;

    for (let i = 0; i < n; i++) {
      let sumAct = 0;
      let sumAnt = 0;
      let xMax   = 0;

      for (let d = 0; d < data.datasets.length; d++) {
        const meta = chart.getDatasetMeta(d);
        if (meta.hidden) continue;
        const ds    = data.datasets[d] as any;
        const val   = (ds.data[i] as number) ?? 0;
        const barEl = meta.data[i] as any;
        if (barEl?.x > xMax) xMax = barEl.x;
        if (ds.stack === "actual")   sumAct += val;
        if (ds.stack === "anterior") sumAnt += val;
      }

      if (!sumAnt) continue; // sin datos anteriores visibles, no dibujar

      const delta   = sumAct - sumAnt;
      const pct     = (delta / sumAnt) * 100;
      const positive = delta >= 0;
      const label   = `${fmtCOP(delta, true)} (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)`;

      // Centro vertical: promedio de y entre primera barra "actual" y primera "anterior"
      const barAct = chart.getDatasetMeta(0).data[i] as any;
      const barAnt = chart.getDatasetMeta(5).data[i] as any;
      if (!barAct || !barAnt) continue;
      const yCenter = (barAct.y + barAnt.y) / 2;

      ctx.save();
      ctx.font         = "bold 10px sans-serif";
      ctx.fillStyle    = positive ? "#28B463" : "#BA4A00";
      ctx.textAlign    = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, xMax + 8, yCenter);
      ctx.restore();
    }
  },
};

// ─── Componente ──────────────────────────────────────────────────────────────
export default function ComparativoAgingChart({ data }: { data: CarteraRow[] }) {
  const maximized               = useMaximize();
  const [view,     setView]     = useState<ViewMode>("distribucion");
  const [segmento, setSegmento] = useState<Segmento>("total");
  const [ocultas,  setOcultas]  = useState<Set<string>>(new Set());

  const hayAnt = data.some(r => (r.totalAnt ?? 0) > 0);

  const toggleCartera = (codicta: string) =>
    setOcultas(prev => {
      const next = new Set(prev);
      next.has(codicta) ? next.delete(codicta) : next.add(codicta);
      return next;
    });

  const sorted = [...data]
    .filter(r => !ocultas.has(r.codicta) && r.total > 0)
    .sort((a, b) => b.total - a.total);

  // ── Vista A: Doble barra apilada (actual vs anterior, coloreada por tramo) ──

  const distDatasets = [
    // Stack "actual" — colores vivos
    { label: "PV",      data: sorted.map(r => r.pv),          stack: "actual",   backgroundColor: COLOR.pv.vivo,     borderRadius: 2 },
    { label: "30d",     data: sorted.map(r => r.d30),         stack: "actual",   backgroundColor: COLOR.d30.vivo,    borderRadius: 2 },
    { label: "60d",     data: sorted.map(r => r.d60),         stack: "actual",   backgroundColor: COLOR.d60.vivo,    borderRadius: 2 },
    { label: "90d",     data: sorted.map(r => r.d90),         stack: "actual",   backgroundColor: COLOR.d90.vivo,    borderRadius: 2 },
    { label: "+90d",    data: sorted.map(r => r.d90mas),      stack: "actual",   backgroundColor: COLOR.d90mas.vivo, borderRadius: 2 },
    // Stack "anterior" — mismos colores pero suaves/transparentes
    { label: "PV ant",   data: sorted.map(r => r.pvAnt     ?? 0), stack: "anterior", backgroundColor: COLOR.pv.suave,     borderRadius: 2 },
    { label: "30d ant",  data: sorted.map(r => r.d30Ant    ?? 0), stack: "anterior", backgroundColor: COLOR.d30.suave,    borderRadius: 2 },
    { label: "60d ant",  data: sorted.map(r => r.d60Ant    ?? 0), stack: "anterior", backgroundColor: COLOR.d60.suave,    borderRadius: 2 },
    { label: "90d ant",  data: sorted.map(r => r.d90Ant    ?? 0), stack: "anterior", backgroundColor: COLOR.d90.suave,    borderRadius: 2 },
    { label: "+90d ant", data: sorted.map(r => r.d90masAnt ?? 0), stack: "anterior", backgroundColor: COLOR.d90mas.suave, borderRadius: 2 },
  ];

  const distOptions = {
    indexAxis:           "y" as const,
    responsive:          true,
    maintainAspectRatio: false,
    layout: { padding: { right: 165 } },
    plugins: {
      legend: {
        display:  true,
        position: "top" as const,
        labels: {
          font:     { size: 10 },
          boxWidth: 10,
          // Muestra solo los tramos actuales; los "ant" se identifican visualmente por tono suave
          filter: (item: any) => !item.text.includes("ant"),
        },
        // Al ocultar/mostrar un tramo actual, sincroniza el tramo anterior (offset +5)
        onClick: (_evt: any, item: any, legend: any) => {
          const chart    = legend.chart;
          const idx      = item.datasetIndex as number;
          const metaAct  = chart.getDatasetMeta(idx);
          metaAct.hidden = !metaAct.hidden;
          const idxAnt   = idx + 5;
          if (idxAnt < chart.data.datasets.length) {
            chart.getDatasetMeta(idxAnt).hidden = metaAct.hidden;
          }
          chart.update();
        },
      },
      tooltip: {
        callbacks: {
          title:  (items: any[]) => items[0]?.label ?? "",
          label:  (ctx: any) => {
            const v = ctx.raw as number;
            if (!v) return null;
            const isAnt = (ctx.dataset.stack as string) === "anterior";
            const tramo = ctx.dataset.label.replace(" ant", "");
            return ` ${tramo}${isAnt ? " (anterior)" : ""}: ${fmtCOP(v)}`;
          },
        },
      },
    } as any,
    scales: {
      x: {
        stacked:      true,
        beginAtZero:  true,
        ticks: {
          callback:      (v: any) => fmtCOP(v as number),
          font:          { size: 10 },
          maxTicksLimit: 5,
        },
      },
      y: {
        stacked: true,
        ticks:   { font: { size: 11 } },
      },
    },
  };

  // ── Vista B: Variación Δ — cuánto cambió cada tramo por cartera ─────────────

  const SEGS: {
    key:   Segmento;
    label: string;
    act:   (r: CarteraRow) => number;
    ant:   (r: CarteraRow) => number;
  }[] = [
    { key: "total",  label: "Total",  act: r => r.total,  ant: r => r.totalAnt  ?? 0 },
    { key: "pv",     label: "PV",     act: r => r.pv,     ant: r => r.pvAnt     ?? 0 },
    { key: "d30",    label: "30d",    act: r => r.d30,    ant: r => r.d30Ant    ?? 0 },
    { key: "d60",    label: "60d",    act: r => r.d60,    ant: r => r.d60Ant    ?? 0 },
    { key: "d90",    label: "90d",    act: r => r.d90,    ant: r => r.d90Ant    ?? 0 },
    { key: "d90mas", label: "+90d",   act: r => r.d90mas, ant: r => r.d90masAnt ?? 0 },
  ];

  const seg    = SEGS.find(s => s.key === segmento)!;
  const deltas = sorted.map(r => seg.act(r) - seg.ant(r));

  const varOptions = {
    indexAxis:           "y" as const,
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const delta = ctx.raw as number;
            const r     = sorted[ctx.dataIndex];
            const ant   = seg.ant(r);
            const pct   = ant > 0 ? (delta / ant) * 100 : 0;
            return ` ${fmtCOP(delta, true)} (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback:      (v: any) => fmtCOP(v as number),
          font:          { size: 10 },
          maxTicksLimit: 6,
        },
        grid: {
          color:     (ctx: any) => ctx.tick?.value === 0 ? "#999" : "#e8eaed",
          lineWidth: (ctx: any) => ctx.tick?.value === 0 ? 2 : 1,
        },
      },
      y: { ticks: { font: { size: 11 } } },
    },
  };

  // ── Altura dinámica ──────────────────────────────────────────────────────────
  const rowH   = view === "distribucion" && hayAnt ? 52 : 28;
  const chartH = maximized
    ? "calc(100vh - 320px)"
    : `${sorted.length * rowH + 60}px`;

  return (
    <div className="card">
      <div className="card-body">

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
          <h6 className="card-title text-muted mb-0">
            Comparativo saldo por tramo · Actual vs Anterior
          </h6>
          <div style={{ display: "flex", gap: 6 }}>
            {(["distribucion", "variacion"] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding:      "2px 12px",
                  fontSize:     11,
                  borderRadius: 12,
                  border:       "1px solid",
                  borderColor:  view === v ? "#4f86c6" : "#ddd",
                  background:   view === v ? "#4f86c6" : "#fff",
                  color:        view === v ? "#fff" : "#666",
                  cursor:       "pointer",
                  transition:   "all 0.15s",
                }}
              >
                {v === "distribucion" ? "Distribución" : "Variación Δ"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Selector de tramo (solo vista Variación Δ) ── */}
        {view === "variacion" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#aaa" }}>Tramo:</span>
            {SEGS.map(s => (
              <button
                key={s.key}
                onClick={() => setSegmento(s.key)}
                style={{
                  padding:      "2px 10px",
                  fontSize:     11,
                  borderRadius: 12,
                  border:       "1px solid",
                  borderColor:  segmento === s.key ? "#CA6F1E" : "#ddd",
                  background:   segmento === s.key ? "#CA6F1E" : "#fff",
                  color:        segmento === s.key ? "#fff" : "#666",
                  cursor:       "pointer",
                  transition:   "all 0.15s",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Leyenda de stacks (solo vista Distribución con datos anteriores) ── */}
        {view === "distribucion" && hayAnt && (
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#666", marginBottom: 6 }}>
            <span>
              <span style={{ display: "inline-block", width: 10, height: 10, background: "#4f86c6", borderRadius: 2, marginRight: 4 }} />
              Barra <strong>superior</strong> = Actual (colores vivos)
            </span>
            <span>
              <span style={{ display: "inline-block", width: 10, height: 10, background: "#b0bec5", borderRadius: 2, marginRight: 4 }} />
              Barra <strong>inferior</strong> = Anterior (colores suaves)
            </span>
          </div>
        )}

        <small className="text-muted d-block mb-2">Chips: oculta/muestra carteras</small>

        {/* ── Chips ── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {data.filter(r => r.total > 0).map(r => {
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

        {!hayAnt && (
          <div style={{ fontSize: 11, color: "#bbb", marginBottom: 8, fontStyle: "italic" }}>
            Sin datos del período anterior — mostrando solo saldo actual.
          </div>
        )}

        {/* ── Gráfico ── */}
        <div style={{ height: chartH }}>
          {view === "distribucion" ? (
            <Bar
              data={{ labels: sorted.map(r => r.desccta), datasets: distDatasets }}
              options={distOptions}
              plugins={hayAnt ? [gapPlugin] : []}
            />
          ) : (
            <Bar
              data={{
                labels:   sorted.map(r => r.desccta),
                datasets: [{
                  label:           `Δ ${seg.label}`,
                  data:            deltas,
                  backgroundColor: deltas.map(d => d >= 0 ? "#28B463" : "#BA4A00"),
                  borderRadius:    3,
                }],
              }}
              options={varOptions}
            />
          )}
        </div>

      </div>
    </div>
  );
}
