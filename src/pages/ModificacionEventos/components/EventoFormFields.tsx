import { Col, Form, Row } from "react-bootstrap";
import { SingleSelect } from "@app/components/singleSelect/singleSelect";
import { validarDiaParaEvento } from "@app/utils/colombianHolidays";
import type { HoraDispItem } from "@app/services/ConsultaCartera/HorasDispDiaService";
import { HoraSelectorEvento } from "@app/modules/maestros/tipos-eventos/components/HoraSelectorEvento";
import type { EdicionEventoForm } from "../domain/types";

interface SelectOption {
  label: string;
  value: string | number;
}

interface EventoFormFieldsProps {
  form: EdicionEventoForm;
  usuarioOptions: SelectOption[];
  tipoEventoOptions: SelectOption[];
  requiereFecha: boolean;
  requiereHora: boolean;
  requiereMonto: boolean;
  horasDisponibles: HoraDispItem[];
  loadingHoras: boolean;
  onUsuarioChange: (value: string | number) => void;
  onTipoEventoChange: (value: string | number) => void;
  onFechaEventoChange: (value: string) => void;
  onHoraEventoChange: (value: string) => void;
  onMontoChange: (value: string) => void;
}

export function EventoFormFields({
  form,
  usuarioOptions,
  tipoEventoOptions,
  requiereFecha,
  requiereHora,
  requiereMonto,
  horasDisponibles,
  loadingHoras,
  onUsuarioChange,
  onTipoEventoChange,
  onFechaEventoChange,
  onHoraEventoChange,
  onMontoChange,
}: EventoFormFieldsProps) {
  return (
    <>
      <Row>
        <Col xs={12} sm={6} md={3}>
          <SingleSelect
            label="Usuario"
            options={usuarioOptions}
            selectedValue={form.usuario}
            onChange={onUsuarioChange}
          />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Form.Group>
            <Form.Label>Cuenta</Form.Label>
            <Form.Control type="text" value={form.cuenta} readOnly />
          </Form.Group>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Form.Group>
            <Form.Label>Cliente</Form.Label>
            <Form.Control type="text" value={form.cliente} readOnly />
          </Form.Group>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <SingleSelect
            label="Tipo de evento"
            options={tipoEventoOptions}
            selectedValue={form.tipoEventoId}
            onChange={onTipoEventoChange}
          />
        </Col>
      </Row>
      <Row className="mt-3">
        <Col xs={12} sm={6} md={3}>
          <Form.Group>
            <Form.Label>Fecha evento</Form.Label>
            {(() => {
              const diaVal = validarDiaParaEvento(form.fechaEvento);
              const isInvalid = Boolean(requiereFecha && form.fechaEvento && diaVal.noHabil);
              return (
                <>
                  <Form.Control
                    type="date"
                    value={form.fechaEvento}
                    disabled={!requiereFecha}
                    isInvalid={isInvalid}
                    onChange={(event) => onFechaEventoChange(event.target.value)}
                  />
                  {isInvalid && (
                    <div
                      className="text-danger mt-1 font-weight-bold"
                      style={{ fontSize: "0.75rem", lineHeight: 1.2 }}
                    >
                      ⚠️ {diaVal.motivo} (No permitido)
                    </div>
                  )}
                </>
              );
            })()}
          </Form.Group>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Form.Group>
            <HoraSelectorEvento
              fecha={requiereHora ? form.fechaEvento : ""}
              value={requiereHora ? form.horaEvento || null : null}
              onChange={(hora) => onHoraEventoChange(hora ?? "")}
              horas={horasDisponibles}
              loading={loadingHoras}
            />
          </Form.Group>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Form.Group>
            <Form.Label>Monto</Form.Label>
            <Form.Control
              type="number"
              value={form.monto}
              disabled={!requiereMonto}
              onChange={(event) => onMontoChange(event.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
}
