import { Button } from "react-bootstrap";
import type { Evento, TipoEventoOption } from "../domain/types";

interface EventosProgramadosListProps {
  eventos: Evento[];
  tiposEvento: TipoEventoOption[];
  editIndex: number | null;
  onEditarEvento: (index: number) => void;
  onEliminarEvento: (index: number) => void;
}

export function EventosProgramadosList({
  eventos,
  tiposEvento,
  editIndex,
  onEditarEvento,
  onEliminarEvento,
}: EventosProgramadosListProps) {
  return (
    <>
      {eventos.map((evento, index) => {
        const tipo = tiposEvento.find((current) => current.nombre === evento.tipo);
        return (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 8,
              background: "#fff",
              borderRadius: 8,
              padding: 12,
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              opacity: editIndex === index ? 0.6 : 1,
            }}
          >
            <div style={{ minWidth: 160, fontWeight: 500 }}>{evento.tipo}</div>
            {tipo?.requiereFecha && (
              <div style={{ minWidth: 100 }}>
                Fecha: {evento.fecha || "-"}
              </div>
            )}
            {tipo?.requiereHora && (
              <div style={{ minWidth: 80 }}>Hora: {evento.hora || "-"}</div>
            )}
            {tipo?.requiereMonto && (
              <div style={{ minWidth: 100 }}>Monto: {evento.valor ?? "-"}</div>
            )}

            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => onEditarEvento(index)}
                style={{ borderRadius: 6 }}
              >
                Editar
              </Button>
              <Button
                size="sm"
                onClick={() => onEliminarEvento(index)}
                style={{ borderRadius: 6 }}
                title="Eliminar evento"
              >
                &times;
              </Button>
            </div>
          </div>
        );
      })}
    </>
  );
}
