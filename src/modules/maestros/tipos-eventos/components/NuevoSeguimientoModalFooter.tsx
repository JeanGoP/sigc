import { Button } from "react-bootstrap";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

interface NuevoSeguimientoModalFooterProps {
  isGuardarDisabled: boolean;
  guardarBlockedReason: string;
  onGuardar: () => void;
  onCerrar: () => void;
}

export function NuevoSeguimientoModalFooter({
  isGuardarDisabled,
  guardarBlockedReason,
  onGuardar,
  onCerrar,
}: NuevoSeguimientoModalFooterProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 12, color: "#5f6b7a" }}>
        Cerrar conserva el borrador de esta gestion.
      </span>
      <div style={{ display: "flex", gap: 12 }}>
        {isGuardarDisabled ? (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id="tooltip-guardar-seguimiento-bloqueado">
                {guardarBlockedReason ||
                  "No se puede guardar seguimiento en este momento."}
              </Tooltip>
            }
          >
            <span className="d-inline-block">
              <Button
                variant="success"
                onClick={onGuardar}
                style={{ borderRadius: 6 }}
                disabled
              >
                Guardar
              </Button>
            </span>
          </OverlayTrigger>
        ) : (
          <Button
            variant="success"
            onClick={onGuardar}
            style={{ borderRadius: 6 }}
          >
            Guardar
          </Button>
        )}
        <Button variant="secondary" onClick={onCerrar} style={{ borderRadius: 6 }}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
