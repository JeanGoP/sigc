import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import type { Evento } from "@app/services/Calendario/CalendarioService";
import { buildCalendarioConsultaCarteraUrl } from "../domain/helpers";

interface BotonGestionCarteraProps {
  type: "A" | "B";
  evento: Evento;
}

export const BotonGestionCartera: React.FC<BotonGestionCarteraProps> = ({
  type = "A",
  evento,
}) => {
  const navigate = useNavigate();

  const handleIrACartera = () => {
    navigate(buildCalendarioConsultaCarteraUrl(evento));
  };

  return (
    <div>
      {type.toUpperCase() === "A" ? (
        <Button variant="primary" onClick={handleIrACartera}>
          Seguimiento
        </Button>
      ) : (
        <i
          className="fas fa-search"
          onClick={handleIrACartera}
          style={{
            color: "#007bff",
            fontSize: "20px",
            cursor: "pointer",
            paddingLeft: "10px",
          }}
        />
      )}
    </div>
  );
};
