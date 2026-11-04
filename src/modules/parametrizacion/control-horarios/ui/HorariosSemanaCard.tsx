import React from "react";
import { Badge, Button, Card, Form, Spinner, Table } from "react-bootstrap";
import type { HorarioLaboralDia } from "@app/services/Parametrizacion/controlHorarioTypes";

interface Props {
  horariosSemana: HorarioLaboralDia[];
  canEdit: boolean;
  isSaving: boolean;
  onUpdateDia: (diaSemana: number, field: "esLaboral" | "horaInicio" | "horaFin", value: any) => void;
  onSaveSemana: () => void;
}

export const HorariosSemanaCard: React.FC<Props> = ({
  horariosSemana,
  canEdit,
  isSaving,
  onUpdateDia,
  onSaveSemana,
}) => {
  const calcularHoras = (inicio: string, fin: string) => {
    if (!inicio || !fin) return "";
    const [h1, m1] = inicio.split(":").map(Number);
    const [h2, m2] = fin.split(":").map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return "";
    let diff = h2 * 60 + m2 - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    const horas = Math.floor(diff / 60);
    const minutos = diff % 60;
    return `${horas}h ${minutos > 0 ? minutos + "m" : ""}`;
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0 font-weight-bold">
            <i className="far fa-calendar-alt text-primary mr-2" /> Horario Semanal de Trabajo
          </h5>
          <small className="text-muted">
            Configure los días laborables del Tenant y la franja de horario permitido.
          </small>
        </div>
        {canEdit && (
          <Button
            variant="primary"
            size="sm"
            disabled={isSaving}
            onClick={onSaveSemana}
            className="px-3"
          >
            {isSaving ? (
              <>
                <Spinner animation="border" size="sm" className="mr-2" /> Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-1" /> Guardar Horario Semanal
              </>
            )}
          </Button>
        )}
      </Card.Header>

      <Card.Body className="p-0">
        <div className="table-responsive">
          <Table hover className="mb-0 align-middle">
            <thead style={{ backgroundColor: "#f8f9fa", fontSize: "0.86rem", color: "#6c757d" }}>
              <tr>
                <th style={{ width: "22%" }}>DÍA</th>
                <th style={{ width: "18%" }}>¿ES LABORAL?</th>
                <th style={{ width: "25%" }}>HORA INICIO</th>
                <th style={{ width: "25%" }}>HORA FIN</th>
                <th style={{ width: "10%", textAlign: "center" }}>DURACIÓN</th>
              </tr>
            </thead>
            <tbody>
              {horariosSemana.map((dia) => {
                const duracion = dia.esLaboral
                  ? calcularHoras(dia.horaInicio, dia.horaFin)
                  : "No laboral";

                return (
                  <tr
                    key={dia.diaSemana}
                    style={{
                      backgroundColor: dia.esLaboral ? "transparent" : "#fdfdfe",
                      opacity: dia.esLaboral ? 1 : 0.75,
                    }}
                  >
                    <td className="font-weight-600">
                      <i
                        className={`fas fa-circle mr-2 ${
                          dia.esLaboral ? "text-success" : "text-secondary"
                        }`}
                        style={{ fontSize: "0.55rem" }}
                      />
                      {dia.nombreDia}
                    </td>

                    <td>
                      <Form.Check
                        type="switch"
                        id={`switch-dia-${dia.diaSemana}`}
                        label={dia.esLaboral ? "Habilitado" : "Cerrado"}
                        checked={dia.esLaboral}
                        disabled={!canEdit || isSaving}
                        onChange={(e) =>
                          onUpdateDia(dia.diaSemana, "esLaboral", e.target.checked)
                        }
                      />
                    </td>

                    <td>
                      <Form.Control
                        type="time"
                        size="sm"
                        style={{ maxWidth: "160px" }}
                        value={dia.horaInicio ? dia.horaInicio.substring(0, 5) : "08:00"}
                        disabled={!dia.esLaboral || !canEdit || isSaving}
                        onChange={(e) =>
                          onUpdateDia(
                            dia.diaSemana,
                            "horaInicio",
                            `${e.target.value}:00`
                          )
                        }
                      />
                    </td>

                    <td>
                      <Form.Control
                        type="time"
                        size="sm"
                        style={{ maxWidth: "160px" }}
                        value={dia.horaFin ? dia.horaFin.substring(0, 5) : "17:00"}
                        disabled={!dia.esLaboral || !canEdit || isSaving}
                        onChange={(e) =>
                          onUpdateDia(
                            dia.diaSemana,
                            "horaFin",
                            `${e.target.value}:00`
                          )
                        }
                      />
                    </td>

                    <td className="text-center">
                      {dia.esLaboral ? (
                        <Badge variant="light" className="border px-2 py-1 text-muted">
                          {duracion}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="px-2 py-1">
                          Inhábil
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};
