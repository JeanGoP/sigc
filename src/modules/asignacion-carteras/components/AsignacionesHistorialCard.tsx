import { Button, Card, Form, Spinner, Table } from "react-bootstrap";
import type { CarteraAsignacionHistorial } from "@app/services/AsignacionCarteras/asignacionCarterasService";
import { formatDateTime } from "../domain/helpers";
import type { AsignacionCarterasFilters } from "../domain/types";

interface AsignacionesHistorialCardProps {
  cargandoInicial: boolean;
  filters: AsignacionCarterasFilters;
  historial: CarteraAsignacionHistorial[];
  onChangeFilter: (field: keyof AsignacionCarterasFilters, value: string) => void;
  onRefresh: () => void;
}

export function AsignacionesHistorialCard({
  cargandoInicial,
  filters,
  historial,
  onChangeFilter,
  onRefresh,
}: AsignacionesHistorialCardProps) {
  return (
    <Card className="shadow-sm">
      <Card.Header
        className="bg-white border-0 d-flex justify-content-between align-items-center flex-wrap"
        style={{ gap: 8 }}
      >
        <strong>Historial</strong>
        <div className="d-flex align-items-center flex-wrap" style={{ gap: 8 }}>
          <Form.Control
            type="date"
            value={filters.fechaInicio}
            onChange={(event) =>
              onChangeFilter("fechaInicio", event.target.value)
            }
            style={{ width: 160 }}
          />
          <Form.Control
            type="date"
            value={filters.fechaFin}
            onChange={(event) =>
              onChangeFilter("fechaFin", event.target.value)
            }
            style={{ width: 160 }}
          />
          <Button variant="outline-dark" onClick={onRefresh}>
            Actualizar historial
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {cargandoInicial ? (
          <div className="text-center py-4 text-muted">
            <Spinner animation="border" size="sm" /> Cargando historial...
          </div>
        ) : (
          <Table responsive bordered hover size="sm">
            <thead className="thead-light">
              <tr>
                <th>Fecha cambio</th>
                <th>Cuenta</th>
                <th>Tramo</th>
                <th>Asesor anterior</th>
                <th>Asesor nuevo</th>
                <th>Cambiado por</th>
                <th>Origen</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    No hay historial para el rango seleccionado.
                  </td>
                </tr>
              ) : (
                historial.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDateTime(item.fechaCambio)}</td>
                    <td>{item.cuenta}</td>
                    <td>{item.tramoNombre || item.tramoCodigo}</td>
                    <td>{item.asesorAnteriorNombre || "-"}</td>
                    <td>{item.asesorNuevoNombre}</td>
                    <td>{item.cambiadoPorNombre}</td>
                    <td>{item.origen}</td>
                    <td>{item.motivo || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}
