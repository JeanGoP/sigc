import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { fmtCOP } from "@app/utils/formattersFunctions";

const fmtPct = (v: number) => `${v.toFixed(1)}%`;

// ─── Delta Badge ─────────────────────────────────────────────────────────────
// inverted=true: reducción es mejora (ej. cartera vencida)
function DeltaBadge({ pct, inverted = false }: { pct: number; inverted?: boolean }) {
  if (pct === 0) return null;
  const improved = inverted ? pct < 0 : pct > 0;
  const color    = improved ? "#28B463" : "#BA4A00";
  const arrow    = pct > 0 ? "▲" : "▼";
  return (
    <span style={{
      display:      "inline-flex",
      alignItems:   "center",
      gap:          2,
      fontSize:     10,
      fontWeight:   600,
      color,
      background:   improved ? "#eaf6ee" : "#fdecea",
      borderRadius: 4,
      padding:      "1px 5px",
      marginLeft:   6,
      verticalAlign: "middle",
      lineHeight:   1.4,
    }}>
      {arrow} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

// ─── Metric types ─────────────────────────────────────────────────────────────

interface Metric {
  label:   string;
  value:   string;
  sub:     string;
  color:   string;
  delta?:  { pct: number; inverted?: boolean };
}

function MetricPanel({ title, color, metrics }: { title: string; color: string; metrics: Metric[] }) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${color}`, borderRadius: 8, marginBottom: 8 }}>
      <div className="card-body" style={{ padding: "10px 14px" }}>
        <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
          {metrics.map((m, i) => (
            <div
              key={m.label}
              style={{
                flex:         "0 0 auto",
                minWidth:     120,
                paddingLeft:  i === 0 ? 0 : 20,
                paddingRight: 20,
                borderLeft:   i > 0 ? "1px solid #e8eaed" : "none",
                marginBottom: 4,
              }}
            >
              <div style={{ fontSize: 11, color: "#aaa", marginBottom: 1 }}>{m.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: m.color, lineHeight: 1.2 }}>
                {m.value}
                {m.delta && <DeltaBadge pct={m.delta.pct} inverted={m.delta.inverted} />}
              </div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function KpisSection({ data }: { data: CarteraRow[] }) {
  // — Cartera general —
  const totalObligaciones = data.reduce((s, r) => s + r.obligacionesTotal, 0);
  const totalSaldo        = data.reduce((s, r) => s + r.total, 0);
  const totalVencida      = data.reduce((s, r) => s + r.carteraVencida, 0);
  const porcVencida       = totalSaldo > 0 ? (totalVencida / totalSaldo) * 100 : 0;

  // — Cartera general anterior —
  const totalSaldoAnt   = data.reduce((s, r) => s + (r.totalAnt ?? 0), 0);
  const totalVencidaAnt = data.reduce((s, r) => s + (r.carteraVencidaAnt ?? 0), 0);
  const porcVencidaAnt  = totalSaldoAnt > 0 ? (totalVencidaAnt / totalSaldoAnt) * 100 : 0;

  // Deltas cartera
  const deltaSaldo        = totalSaldoAnt > 0 ? ((totalSaldo - totalSaldoAnt) / totalSaldoAnt) * 100 : 0;
  const deltaVencidaPorc  = porcVencidaAnt > 0 ? porcVencida - porcVencidaAnt : 0; // diferencia en pp
  const deltaVencidaPct   = totalVencidaAnt > 0 ? ((totalVencida - totalVencidaAnt) / totalVencidaAnt) * 100 : 0;

  // — Clientes —
  const clientesEnMora    = data.reduce((s, r) => s + r.obligaciones30 + r.obligaciones60 + r.obligaciones90 + r.obligaciones90mas, 0);
  const porcClientesAlDia = totalObligaciones > 0 ? (data.reduce((s, r) => s + r.obligacionesPV, 0) / totalObligaciones) * 100 : 0;

  // — Recaudo —
  const totalRecaudoAct   = data.reduce((s, r) => s + r.recaudoMesActual, 0);
  const totalRecaudoAnt   = data.reduce((s, r) => s + r.recaudoMesAnterior, 0);
  const difRecaudo        = totalRecaudoAct - totalRecaudoAnt;
  const varRecaudo        = totalRecaudoAnt > 0 ? (difRecaudo / totalRecaudoAnt) * 100 : 0;
  const indicesValidos    = data.filter((r) => r.indiceRecaudo > 0).map((r) => r.indiceRecaudo);
  const indicePromedio    = indicesValidos.length > 0 ? indicesValidos.reduce((s, v) => s + v, 0) / indicesValidos.length : 0;

  // — Alertas —
  const cartMoraCritica   = data.filter((r) => r.carteraVencidaPorc > 15 && !r.desccta.startsWith("DC")).length;
  const mejorIndice       = [...data].filter((r) => r.indiceRecaudo > 0).sort((a, b) => b.indiceRecaudo - a.indiceRecaudo)[0];

  // Indicador de si hay datos de período anterior disponibles
  const hayDatosAnt = totalSaldoAnt > 0;

  return (
    <>
      <MetricPanel
        title="Cartera"
        color="#4f86c6"
        metrics={[
          { label: "Total obligaciones",   value: totalObligaciones.toLocaleString("es-CO"),  sub: "clientes activos",     color: "#4f86c6" },
          {
            label: "Saldo total",
            value: fmtCOP(totalSaldo),
            sub:   hayDatosAnt ? `Ant: ${fmtCOP(totalSaldoAnt)}` : "saldo vigente",
            color: "#4f86c6",
            delta: hayDatosAnt ? { pct: deltaSaldo } : undefined,
          },
          {
            label: "Cartera vencida",
            value: fmtPct(porcVencida),
            sub:   hayDatosAnt
              ? `Ant: ${fmtPct(porcVencidaAnt)} (${deltaVencidaPorc >= 0 ? "+" : ""}${deltaVencidaPorc.toFixed(1)} pp)`
              : fmtCOP(totalVencida),
            color: porcVencida > 10 ? "#BA4A00" : "#D68910",
            delta: hayDatosAnt ? { pct: deltaVencidaPct, inverted: true } : undefined,
          },
          { label: "Mora crítica",         value: `${cartMoraCritica} carteras`,               sub: "> 15% vencida",        color: cartMoraCritica > 3 ? "#BA4A00" : "#D68910" },
          { label: "Clientes en mora",     value: clientesEnMora.toLocaleString("es-CO"),      sub: "atraso > 0 días",      color: "#CA6F1E" },
          { label: "Clientes al día",      value: fmtPct(porcClientesAlDia),                   sub: "sobre total activos",  color: porcClientesAlDia >= 90 ? "#28B463" : "#D68910" },
          { label: "Mejor índice recaudo", value: fmtPct(mejorIndice?.indiceRecaudo ?? 0),     sub: mejorIndice?.desccta ?? "", color: "#28B463" },
        ]}
      />

      <MetricPanel
        title="Recaudo"
        color="#4f86c6"
        metrics={[
          { label: "Mes actual",   value: fmtCOP(totalRecaudoAct),                              sub: `${varRecaudo >= 0 ? "+" : ""}${fmtPct(varRecaudo)} vs mes anterior`, color: varRecaudo >= 0 ? "#28B463" : "#BA4A00" },
          { label: "Mes anterior", value: fmtCOP(totalRecaudoAnt),                              sub: "período previo",            color: "#7a8a99" },
          { label: "Diferencia",   value: `${difRecaudo >= 0 ? "+" : ""}${fmtCOP(difRecaudo)}`, sub: "actual vs anterior",        color: difRecaudo >= 0 ? "#28B463" : "#BA4A00" },
          { label: "Índice prom.", value: fmtPct(indicePromedio),                             sub: "promedio carteras activas", color: indicePromedio >= 8 ? "#28B463" : "#D68910" },
        ]}
      />
    </>
  );
}
