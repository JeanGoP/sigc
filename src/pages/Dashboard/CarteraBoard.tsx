import { useState }                          from "react";
import { useApi }                             from "@app/hooks/useApi";
import { Row, Col }                           from "react-bootstrap";
import type { CarteraRow }                    from "@app/Data/dashboardCarteraData";
import KpisSection                            from "./cartera/KpisSection";
import DistribucionSaldoChart                 from "./cartera/DistribucionSaldoChart";
import CarteraVencidaChart                    from "./cartera/CarteraVencidaChart";
import AgingChart                             from "./cartera/AgingChart";
import RecaudoChart                           from "./cartera/RecaudoChart";
import IndiceRecaudoChart                     from "./cartera/IndiceRecaudoChart";
import ComposicionRecaudoChart                from "./cartera/ComposicionRecaudoChart";
import ConcentracionCarteraChart              from "./cartera/ConcentracionCarteraChart";
import EficienciaRecuperacionChart            from "./cartera/EficienciaRecuperacionChart";
import ComposicionRecaudoPorCarteraChart      from "./cartera/ComposicionRecaudoPorCarteraChart";
import BubbleRiesgoChart                      from "./cartera/BubbleRiesgoChart";
import MixedRecaudoIndiceChart                from "./cartera/MixedRecaudoIndiceChart";
import RadarSaludChart                        from "./cartera/RadarSaludChart";
import ComparativoSaldoChart                  from "./cartera/ComparativoSaldoChart";
import ComparativoAgingChart                  from "./cartera/ComparativoAgingChart";
import MaximizeWrapper                        from "./cartera/MaximizeWrapper";
import { MaximizeProvider }                   from "./cartera/MaximizeContext";

// ─── Persistencia ────────────────────────────────────────────────────────────

const STORAGE_KEY = "dashboard_cartera_dataset";

interface PersistedDataset {
  fecha: string;
  data: CarteraRow[];
}

function loadFromStorage(): PersistedDataset | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedDataset) : null;
  } catch {
    return null;
  }
}

function saveToStorage(dataset: PersistedDataset) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
  } catch {/* ignore */}
}

// ─── Mapeo API → CarteraRow ──────────────────────────────────────────────────
// Búsqueda case-insensitive: funciona sin importar si el SP devuelve
// "Codicta", "codicta", "CODICTA", etc.

function buildLookup(raw: Record<string, unknown>): Record<string, unknown> {
  const lookup: Record<string, unknown> = {};
  for (const key of Object.keys(raw)) {
    lookup[key.toLowerCase()] = raw[key];
  }
  return lookup;
}

function mapToCarteraRow(raw: Record<string, unknown>): CarteraRow {
  const lk = buildLookup(raw);
  const n = (key: string) => Number(lk[key.toLowerCase()] ?? 0);
  const s = (key: string) => String(lk[key.toLowerCase()] ?? "");
  return {
    codicta:             s("codicta"),
    desccta:             s("desccta"),
    obligacionesTotal:   n("obligaciones_total"),
    obligacionesPV:      n("obligaciones_pv"),
    obligaciones30:      n("obligaciones_30"),
    obligaciones60:      n("obligaciones_60"),
    obligaciones90:      n("obligaciones_90"),
    obligaciones90mas:   n("obligaciones_90_mas"),
    total:               n("total"),
    pv:                  n("pv"),
    d30:                 n("30"),
    d60:                 n("60"),
    d90:                 n("90"),
    d90mas:              n("+90"),
    carteraVencida:      n("carteravencida"),
    carteraVencidaPorc:  n("carteravencida_porc"),
    recaudoMesActual:    n("totalrecaudomesactual"),
    recaudoMesAnterior:  n("totalrecaudomesanterior"),
    porcentajeVariacion: n("porcentajevariacion"),
    indiceRecaudo:       n("indicerecaudo_porc"),
    recaudoPV:           n("recaudomesactual_pv"),
    recaudo30:           n("recaudomesactual_30"),
    recaudo60:           n("recaudomesactual_60"),
    recaudo90:           n("recaudomesactual_90"),
    recaudo90mas:        n("recaudomesactual_90_mas"),
    recaudoVencido:      n("recaudomesactual_vencido"),
    // Período anterior
    totalAnt:             n("total_ant"),
    pvAnt:                n("pv_ant"),
    d30Ant:               n("30_ant"),
    d60Ant:               n("60_ant"),
    d90Ant:               n("90_ant"),
    d90masAnt:            n("+90_ant"),
    pvAntPorc:            n("pv_ant_porc"),
    d30AntPorc:           n("30_ant_porc"),
    d60AntPorc:           n("60_ant_porc"),
    d90AntPorc:           n("90_ant_porc"),
    d90masAntPorc:        n("+90_ant_porc"),
    carteraVencidaAnt:    n("carteravencida_ant"),
    carteraVencidaAntPorc: n("carteravencida_ant_porc"),
  };
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function CarteraBoard() {
  const [fecha, setFecha] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  );
  const [data,  setData]  = useState<CarteraRow[]>(() => loadFromStorage()?.data ?? []);
  const [lastFecha, setLastFecha] = useState<string | null>(() => loadFromStorage()?.fecha ?? null);

  const { loading, error, request } = useApi<Record<string, unknown>[]>(
    "/api/v1/dashboard/cartera",
    { timeout: 30000 }
  );

  const handleConsultar = async () => {
    const res = await request({ method: "GET", params: { fecha } });
    if (res?.success && Array.isArray(res.data)) {
      const mapped = res.data.map(mapToCarteraRow);
      setData(mapped);
      setLastFecha(fecha);
      saveToStorage({ fecha, data: mapped });
    }
  };

  return (
    <MaximizeProvider>
      <>
        {/* ── Barra de consulta ── */}
        <div style={{
          display: "flex", alignItems: "center", flexWrap: "wrap",
          gap: 10, marginBottom: 14,
          padding: "10px 14px",
          background: "#fff",
          borderRadius: 8,
          border: "1px solid #e8eaed",
        }}>
          <label style={{ fontSize: 13, color: "#666", margin: 0, whiteSpace: "nowrap" }}>
            Fecha de corte:
          </label>

          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{
              fontSize: 13,
              border: "1px solid #ccc",
              borderRadius: 6,
              padding: "4px 8px",
              outline: "none",
            }}
          />

          <button
            onClick={handleConsultar}
            disabled={loading || !fecha}
            style={{
              padding: "5px 18px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 6,
              border: "none",
              background: loading ? "#aaa" : "#4f86c6",
              color: "#fff",
              cursor: loading || !fecha ? "not-allowed" : "pointer",
              transition: "background 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Consultando..." : "Consultar"}
          </button>

          {lastFecha && !loading && (
            <span style={{ fontSize: 11, color: "#aaa" }}>
              Dataset actual: {lastFecha}
            </span>
          )}

          {error && (
            <span style={{ fontSize: 12, color: "#d9534f" }}>
              {error}
            </span>
          )}
        </div>

        {/* ── Sin datos ── */}
        {data.length === 0 && !loading && (
          <div style={{
            textAlign: "center", color: "#bbb",
            padding: "80px 0", fontSize: 14,
          }}>
            Selecciona una fecha y presiona <strong style={{ color: "#4f86c6" }}>Consultar</strong> para cargar el dashboard.
          </div>
        )}

        {/* ── Dashboard ── */}
        {data.length > 0 && (
          <>
            <KpisSection data={data} />

            <Row className="g-3 mb-3">
              <Col md={12}>
                <MaximizeWrapper><ComparativoSaldoChart data={data} /></MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={12}>
                <MaximizeWrapper><ComparativoAgingChart data={data} /></MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={5}>
                <MaximizeWrapper><DistribucionSaldoChart data={data} /></MaximizeWrapper>
              </Col>
              <Col md={7}>
                <MaximizeWrapper><ConcentracionCarteraChart data={data} /></MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={7}>
                <MaximizeWrapper><BubbleRiesgoChart data={data} /></MaximizeWrapper>
              </Col>
              <Col md={5}>
                <MaximizeWrapper><RadarSaludChart data={data} /></MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={4}>
                <MaximizeWrapper><ComposicionRecaudoChart data={data} /></MaximizeWrapper>
              </Col>
              <Col md={8}>
                <MaximizeWrapper><EficienciaRecuperacionChart data={data} /></MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={12}>
                <MaximizeWrapper><ComposicionRecaudoPorCarteraChart data={data} /></MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={12}>
                <MaximizeWrapper><MixedRecaudoIndiceChart data={data} /></MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={12}>
                <MaximizeWrapper><CarteraVencidaChart data={data} /></MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={12}>
                <MaximizeWrapper><IndiceRecaudoChart data={data} /></MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={12}>
                <MaximizeWrapper><AgingChart data={data} /></MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={12}>
                <MaximizeWrapper><RecaudoChart data={data} /></MaximizeWrapper>
              </Col>
            </Row>
          </>
        )}
      </>
    </MaximizeProvider>
  );
}
