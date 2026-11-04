import React from "react";
import { Button, Card, Col, Row } from "react-bootstrap";
import type { DataCreditoEstadisticas } from "@app/services/Maestros/dataCreditoPrefijosTypes";

interface PrefijosOverviewCardsProps {
  puedeCrear: boolean;
  estadisticas: DataCreditoEstadisticas;
  onCrearPrefijo: () => void;
}

export const PrefijosOverviewCards: React.FC<PrefijosOverviewCardsProps> = ({
  puedeCrear,
  estadisticas,
  onCrearPrefijo,
}) => {
  return (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <div
          className="d-flex justify-content-between align-items-center flex-wrap"
          style={{ gap: 12 }}
        >
          <div>
            <h5 className="mb-1" style={{ fontWeight: 700 }}>
              Maestro de Prefijos DataCrédito
            </h5>
            <small className="text-muted">
              Configuración de prefijos por cuenta contable y reglas de consecutivo para la generación de obligaciones en centrales de riesgo.
            </small>
          </div>
          <div>
            <Button
              variant="primary"
              onClick={onCrearPrefijo}
              disabled={!puedeCrear}
              style={{ minWidth: 170 }}
            >
              + Configurar cuenta
            </Button>
          </div>
        </div>

        <Row className="mt-3">
          <Col md={4}>
            <div className="border rounded bg-light px-3 py-2">
              <div className="text-muted small">Total cuentas configuradas</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {estadisticas.total.toLocaleString()}
              </div>
            </div>
          </Col>
          <Col md={4} className="mt-2 mt-md-0">
            <div className="border rounded bg-light px-3 py-2">
              <div className="text-muted small">Cuentas activas en reporte</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1f8b4c" }}>
                {estadisticas.activos.toLocaleString()}
              </div>
            </div>
          </Col>
          <Col md={4} className="mt-2 mt-md-0">
            <div className="border rounded bg-light px-3 py-2">
              <div className="text-muted small">Cuentas inactivas</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#6c757d" }}>
                {estadisticas.inactivos.toLocaleString()}
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default PrefijosOverviewCards;
