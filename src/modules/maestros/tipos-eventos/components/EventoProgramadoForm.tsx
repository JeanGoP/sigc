import { Button, Form } from "react-bootstrap";
import { SingleSelect } from "@app/components/singleSelect/singleSelect";
import type { HoraDispItem } from "@app/services/ConsultaCartera/HorasDispDiaService";
import type { Evento, TipoEventoOption } from "../domain/types";
import { HoraSelectorEvento } from "./HoraSelectorEvento";

interface EventoProgramadoFormProps {
  tiposEvento: TipoEventoOption[];
  formEvento: Evento;
  editIndex: number | null;
  horasDisponibles: HoraDispItem[];
  loadingHoras: boolean;
  loadingEvento: boolean;
  isValidatingEvent: boolean;
  onTipoEventoChange: (value: string | number) => void;
  onFormCampoChange: (campo: keyof Evento, valor: Evento[keyof Evento]) => void;
  onAgregarEvento: () => void;
  onActualizarEvento: () => void;
  onCancelarEdicion: () => void;
}

export function EventoProgramadoForm({
  tiposEvento,
  formEvento,
  editIndex,
  horasDisponibles,
  loadingHoras,
  loadingEvento,
  isValidatingEvent,
  onTipoEventoChange,
  onFormCampoChange,
  onAgregarEvento,
  onActualizarEvento,
  onCancelarEdicion,
}: EventoProgramadoFormProps) {
  const tipoSeleccionado = tiposEvento.find(
    (tipo) => tipo.nombre === formEvento.tipo
  );
  const isActionDisabled = loadingEvento || isValidatingEvent;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "end",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 16,
        background: "#fff",
        borderRadius: 8,
        padding: 12,
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <SingleSelect
        options={tiposEvento.map((tipo) => ({
          label: tipo.nombre,
          value: tipo.nombre,
        }))}
        selectedValue={formEvento.tipo}
        label="Tipo de evento"
        onChange={onTipoEventoChange}
      />

      {tipoSeleccionado?.requiereFecha && (
        <Form.Group>
          <Form.Label>Fecha</Form.Label>
          <input
            type="date"
            className="form-control"
            style={{ width: 140, borderRadius: 6, margin: 0 }}
            value={formEvento.fecha || ""}
            onChange={(event) =>
              onFormCampoChange("fecha", event.target.value)
            }
          />
        </Form.Group>
      )}

      {tipoSeleccionado?.requiereHora && (
        <Form.Group>
          <HoraSelectorEvento
            fecha={formEvento.fecha || ""}
            value={formEvento.hora ?? null}
            onChange={(hora) => onFormCampoChange("hora", hora)}
            horas={horasDisponibles}
            loading={loadingHoras}
          />
        </Form.Group>
      )}

      {tipoSeleccionado?.requiereMonto && (
        <Form.Group>
          <Form.Label>Monto</Form.Label>
          <input
            type="number"
            className="form-control"
            style={{ width: 120, borderRadius: 6 }}
            placeholder="Valor"
            value={formEvento.valor ?? ""}
            onChange={(event) =>
              onFormCampoChange(
                "valor",
                event.target.value === "" ? undefined : Number(event.target.value)
              )
            }
          />
        </Form.Group>
      )}

      <Form.Group>
        {editIndex === null ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={onAgregarEvento}
            style={{ borderRadius: 6 }}
            disabled={isActionDisabled}
          >
            + Agregar
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="success"
              onClick={onActualizarEvento}
              style={{ borderRadius: 6, marginRight: 4 }}
              disabled={isActionDisabled}
            >
              Actualizar
            </Button>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={onCancelarEdicion}
              style={{ borderRadius: 6 }}
            >
              Cancelar
            </Button>
          </>
        )}
      </Form.Group>
    </div>
  );
}
