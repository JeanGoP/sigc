import { Badge, Button, Card, Form, Spinner, Table } from "react-bootstrap";
import type { CarteraAsignacionActual } from "@app/services/AsignacionCarteras/asignacionCarterasService";
import { buildCarteraRowKey, formatDateTime } from "../domain/helpers";

interface AsignacionesActualesTableProps {
  allSelected: boolean;
  asignaciones: CarteraAsignacionActual[];
  cargandoInicial: boolean;
  puedeReasignar: boolean;
  selectedSet: Set<string>;
  onOpenReasignarModal: (row: CarteraAsignacionActual) => void;
  onToggleAll: () => void;
  onToggleRow: (row: CarteraAsignacionActual) => void;
}

export function AsignacionesActualesTable({
  allSelected,
  asignaciones,
  cargandoInicial,
  puedeReasignar,
  selectedSet,
  onOpenReasignarModal,
  onToggleAll,
  onToggleRow,
}: AsignacionesActualesTableProps) {
  return (
    <Card className="shadow-sm mb-3">
      <Card.Header className="bg-white border-0">
        <strong>Asignaciones actuales</strong>
      </Card.Header>
      <Card.Body>
        {cargandoInicial ? (
          <div className="text-center py-4 text-muted">
            <Spinner animation="border" size="sm" /> Cargando asignaciones...
          </div>
        ) : (
          <Table responsive bordered hover>
            <thead className="thead-light">
              <tr>
                <th style={{ width: 40 }}>
                  <Form.Check
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleAll}
                  />
                </th>
                <th>Cuenta</th>
                <th>Tramo</th>
                <th>Asesor actual</th>
                <th>Fecha asignacion</th>
                <th>Actualizado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {asignaciones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No hay asignaciones para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                asignaciones.map((item) => {
                  const rowKey = buildCarteraRowKey(item);
                  return (
                    <tr key={rowKey}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedSet.has(rowKey)}
                          onChange={() => onToggleRow(item)}
                        />
                      </td>
                      <td>{item.cuenta}</td>
                      <td>
                        <Badge variant="info">
                          {item.tramoNombre || item.tramoCodigo}
                        </Badge>
                      </td>
                      <td>{item.asesorNombre}</td>
                      <td>{formatDateTime(item.fechaAsignacion)}</td>
                      <td>{formatDateTime(item.updatedAt)}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => onOpenReasignarModal(item)}
                          disabled={!puedeReasignar}
                        >
                          Reasignar
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}
