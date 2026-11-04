import { Button, Card, Col, Row } from "react-bootstrap";
import type { CodeudorEstadisticas } from "@app/services/Parametrizacion/codeudoresTypes";

interface CodeudoresOverviewCardProps {
  puedeCrear: boolean;
  estadisticas: CodeudorEstadisticas;
  onCrearCodeudor: () => void;
}

export default function CodeudoresOverviewCard({
  puedeCrear,
  estadisticas,
  onCrearCodeudor,
}: CodeudoresOverviewCardProps) {
  return (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <div
          className="d-flex justify-content-between align-items-center flex-wrap"
          style={{ gap: 12 }}
        >
          <div>
            <h5 className="mb-1" style={{ fontWeight: 700 }}>
              Gestión de codeudores
            </h5>
            <small className="text-muted">
              Controla codeudores solidarios por obligación y sincronización para centrales de riesgo.
            </small>
          </div>
          <div>
            <Button
              variant="primary"
              onClick={onCrearCodeudor}
              disabled={!puedeCrear}
              style={{ minWidth: 160 }}
            >
              + Nuevo codeudor
            </Button>
          </div>
        </div>

        <Row className="mt-3">
          <Col md={4}>
            <div className="border rounded bg-light px-3 py-2">
              <div className="text-muted small">Total codeudores</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {estadisticas.total.toLocaleString()}
              </div>
            </div>
          </Col>
          <Col md={4} className="mt-2 mt-md-0">
            <div className="border rounded bg-light px-3 py-2">
              <div className="text-muted small">Activos</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1f8b4c" }}>
                {estadisticas.activos.toLocaleString()}
              </div>
            </div>
          </Col>
          <Col md={4} className="mt-2 mt-md-0">
            <div className="border rounded bg-light px-3 py-2">
              <div className="text-muted small">Inactivos</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#6c757d" }}>
                {estadisticas.inactivos.toLocaleString()}
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
