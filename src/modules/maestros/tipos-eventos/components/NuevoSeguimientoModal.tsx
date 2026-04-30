import { Button, Modal } from "react-bootstrap";
import type { HoraDispItem } from "@app/services/ConsultaCartera/HorasDispDiaService";
import type { Evento, TipoEventoOption } from "../domain/types";
import { EventoProgramadoForm } from "./EventoProgramadoForm";
import { EventosProgramadosList } from "./EventosProgramadosList";
import { NuevoSeguimientoModalFooter } from "./NuevoSeguimientoModalFooter";
import { SeguimientoTextSection } from "./SeguimientoTextSection";
import { TipoContactoSection } from "./TipoContactoSection";

interface NuevoSeguimientoModalProps {
  show: boolean;
  texto: string;
  tipoContacto: string | number;
  eventos: Evento[];
  tiposEvento: TipoEventoOption[];
  formEvento: Evento;
  editIndex: number | null;
  errorValidacion: string | null;
  horasDisponibles: HoraDispItem[];
  loadingHoras: boolean;
  loadingEvento: boolean;
  isValidatingEvent: boolean;
  isGuardarDisabled: boolean;
  guardarBlockedReason: string;
  onTextoChange: (value: string) => void;
  onTipoContactoChange: (value: string | number) => void;
  onTipoEventoChange: (value: string | number) => void;
  onFormCampoChange: (campo: keyof Evento, valor: Evento[keyof Evento]) => void;
  onAgregarEvento: () => void;
  onActualizarEvento: () => void;
  onCancelarEdicion: () => void;
  onEditarEvento: (index: number) => void;
  onEliminarEvento: (index: number) => void;
  onGuardar: () => void;
  onCerrar: () => void;
}

export function NuevoSeguimientoModal({
  show,
  texto,
  tipoContacto,
  eventos,
  tiposEvento,
  formEvento,
  editIndex,
  errorValidacion,
  horasDisponibles,
  loadingHoras,
  loadingEvento,
  isValidatingEvent,
  isGuardarDisabled,
  guardarBlockedReason,
  onTextoChange,
  onTipoContactoChange,
  onTipoEventoChange,
  onFormCampoChange,
  onAgregarEvento,
  onActualizarEvento,
  onCancelarEdicion,
  onEditarEvento,
  onEliminarEvento,
  onGuardar,
  onCerrar,
}: NuevoSeguimientoModalProps) {
  return (
    <Modal
      show={show}
      onHide={onCerrar}
      centered
      size="xl"
      scrollable
      backdrop="static"
    >
      <Modal.Body style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: 20,
                color: "#1565c0",
              }}
            >
              Nuevo seguimiento
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#5f6b7a",
                marginTop: 4,
              }}
            >
              El borrador se conserva por gestion activa mientras no guardes.
            </div>
          </div>
          <Button
            variant="light"
            onClick={onCerrar}
            style={{ borderRadius: 999, padding: "4px 12px" }}
          >
            Cerrar
          </Button>
        </div>

        <div
          style={{
            background: "#e3f2fd",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: "1px solid #bbdefb",
          }}
        >
          <SeguimientoTextSection value={texto} onChange={onTextoChange} />

          <TipoContactoSection
            value={tipoContacto}
            onChange={onTipoContactoChange}
          />

          <div className="mb-3" style={{ padding: 0 }}>
            <label style={{ fontWeight: 500, marginBottom: 8 }}>
              Eventos programados
            </label>

            <EventoProgramadoForm
              tiposEvento={tiposEvento}
              formEvento={formEvento}
              editIndex={editIndex}
              horasDisponibles={horasDisponibles}
              loadingHoras={loadingHoras}
              loadingEvento={loadingEvento}
              isValidatingEvent={isValidatingEvent}
              onTipoEventoChange={onTipoEventoChange}
              onFormCampoChange={onFormCampoChange}
              onAgregarEvento={onAgregarEvento}
              onActualizarEvento={onActualizarEvento}
              onCancelarEdicion={onCancelarEdicion}
            />

            {errorValidacion && (
              <div style={{ color: "#d32f2f", fontSize: 12, marginBottom: 8 }}>
                {errorValidacion}
              </div>
            )}

            <EventosProgramadosList
              eventos={eventos}
              tiposEvento={tiposEvento}
              editIndex={editIndex}
              onEditarEvento={onEditarEvento}
              onEliminarEvento={onEliminarEvento}
            />
          </div>

          <NuevoSeguimientoModalFooter
            isGuardarDisabled={isGuardarDisabled}
            guardarBlockedReason={guardarBlockedReason}
            onGuardar={onGuardar}
            onCerrar={onCerrar}
          />
        </div>
      </Modal.Body>
    </Modal>
  );
}
