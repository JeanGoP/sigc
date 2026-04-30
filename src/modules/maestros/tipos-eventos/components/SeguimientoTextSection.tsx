import { Button, Col, Row } from "react-bootstrap";
import SpeechToText from "@app/components/SpeechToText/SpeechToText";

interface SeguimientoTextSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function SeguimientoTextSection({
  value,
  onChange,
}: SeguimientoTextSectionProps) {
  return (
    <div className="mb-3">
      <label style={{ fontWeight: 500, marginBottom: 8 }}>
        Texto del seguimiento
      </label>

      <Row>
        <Col xs={12} sm={12} md={12} lg={12} xl={1}>
          <SpeechToText value={value} onResult={onChange} />
        </Col>
        <Col xs={12} sm={12} md={12} lg={12} xl={1}>
          <Button type="button" variant="secondary" onClick={() => onChange("")}>
            Limpiar
          </Button>
        </Col>
      </Row>
      <br />

      <textarea
        id="textoSeguimiento"
        className="form-control"
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          borderRadius: 8,
          border: "1px solid #bbdefb",
          padding: 12,
        }}
      />
    </div>
  );
}
