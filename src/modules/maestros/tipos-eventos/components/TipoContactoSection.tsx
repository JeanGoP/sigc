import { Col, Row } from "react-bootstrap";
import BuscadorTipoContacto from "@app/components/BuscadorGeneral/BuscadorTipoContacto";

interface TipoContactoSectionProps {
  value: string | number;
  onChange: (value: string | number) => void;
}

export function TipoContactoSection({
  value,
  onChange,
}: TipoContactoSectionProps) {
  return (
    <div>
      <div
        style={{
          alignItems: "center",
          marginBottom: 12,
          background: "#fff",
          borderRadius: 8,
          padding: 12,
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <Row>
          <Col xs={12} lg={3} md={3} xl={3}>
            <BuscadorTipoContacto
              label="Tipo de contacto"
              value={value}
              onChange={(nextValue) => onChange(nextValue ?? 0)}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}
