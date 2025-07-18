import React, { useState } from 'react';
import { Card, Form, Button, Row, Col } from 'react-bootstrap';
import { NumericField } from '@app/components/InputFields/NumericField';

const ParametrosGenerales = () => {
  const [intMora, setIntMora] = useState('3.00');

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí puedes agregar la lógica para guardar el valor
    alert('Parámetro guardado: ' + intMora + ' %');
  };

  return (
    <Row className="justify-content-center mt-4">
      <Col xs={12} md={10} lg={8}>
        <Card>
          <Card.Header className="d-flex align-items-center" style={{ background: '#343a40', color: '#fff' }}>
            <i className="fas fa-cogs me-2" />
            <span>Parámetros Generales</span>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleGuardar}>
              <Row className="mb-3">
                <Col xs={12} md={3}>
                  <Form.Label>Porcentaje interés mora</Form.Label>
                  <NumericField value={intMora} onChange={setIntMora} />
                </Col>
                <Col xs={12} md={3}>
                  {/* Espacio para campo futuro */}
                </Col>
                <Col xs={12} md={3}>
                  {/* Espacio para campo futuro */}
                </Col>
                <Col xs={12} md={3}>
                  {/* Espacio para campo futuro */}
                </Col>
              </Row>
              <Button variant="primary" type="submit">
                Guardar
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default ParametrosGenerales; 