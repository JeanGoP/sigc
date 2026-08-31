import React from "react";
import { Card, Col, Row } from "react-bootstrap";
import { SingleSelect } from "@app/components/singleSelect/singleSelect";
import BuscadorCuentas from "@app/components/BuscadorGeneral/BuscadorCuentas";

interface CalendarioFiltersProps {
  usuarios: { label: string; value: string | number }[];
  usuarioFiltro: string | number;
  cuentaFiltro: string;
  onUsuarioFiltroChange: (value: string | number) => void;
  onCuentaFiltroChange: (value: string | null) => void;
}

export const CalendarioFilters: React.FC<CalendarioFiltersProps> = ({
  usuarios,
  usuarioFiltro,
  cuentaFiltro,
  onUsuarioFiltroChange,
  onCuentaFiltroChange,
}) => {
  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Body>
        <Row>
          <Col xs={12} sm={6} md={4}>
            <SingleSelect
              label="Filtrar por usuario"
              options={usuarios}
              selectedValue={usuarioFiltro}
              onChange={onUsuarioFiltroChange}
              placeholder="Seleccione un usuario"
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <BuscadorCuentas
              opcion="CU"
              op="CLIENTE"
              placeholder="Buscar cuenta..."
              label="Cuenta"
              value={cuentaFiltro || undefined}
              onChange={onCuentaFiltroChange}
              onSelect={() => {}}
            />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};
