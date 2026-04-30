import { Button, Card, Col, Row } from "react-bootstrap";
import type { UsuariosEstadisticas } from "../domain/types";

interface UsuariosOverviewCardProps {
  puedeCrear: boolean;
  estadisticas: UsuariosEstadisticas;
  onCrearUsuario: () => void;
}

export default function UsuariosOverviewCard({
  puedeCrear,
  estadisticas,
  onCrearUsuario,
}: UsuariosOverviewCardProps) {
  return (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <div
          className="d-flex justify-content-between align-items-center flex-wrap"
          style={{ gap: 12 }}
        >
          <div>
            <h5 className="mb-1" style={{ fontWeight: 700 }}>
              Gestion de usuarios
            </h5>
            <small className="text-muted">
              Controla usuarios, estado de acceso y rol asignado.
            </small>
          </div>
          <Button
            variant="primary"
            onClick={onCrearUsuario}
            disabled={!puedeCrear}
            style={{ minWidth: 140 }}
          >
            + Nuevo usuario
          </Button>
        </div>

        <Row className="mt-3">
          <Col md={4}>
            <div className="border rounded bg-light px-3 py-2">
              <div className="text-muted small">Total usuarios</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{estadisticas.total}</div>
            </div>
          </Col>
          <Col md={4} className="mt-2 mt-md-0">
            <div className="border rounded bg-light px-3 py-2">
              <div className="text-muted small">Activos</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1f8b4c" }}>
                {estadisticas.activos}
              </div>
            </div>
          </Col>
          <Col md={4} className="mt-2 mt-md-0">
            <div className="border rounded bg-light px-3 py-2">
              <div className="text-muted small">Inactivos</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#6c757d" }}>
                {estadisticas.inactivos}
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
