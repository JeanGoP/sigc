import React, { useState } from 'react';
import { Container, Row, Col, Form, Modal, Button } from 'react-bootstrap';

export const FormularioCliente = () => {
  // Plantillas de ejemplo
  const plantillas = [
    { id: 1, nombre: 'Bienvenida', texto: 'Estimado cliente, bienvenido a nuestra empresa.' },
    { id: 2, nombre: 'Recordatorio de pago', texto: 'Le recordamos que tiene un pago pendiente. Por favor, póngase al día.' },
    { id: 3, nombre: 'Agradecimiento', texto: 'Gracias por confiar en nosotros. ¡Esperamos seguir atendiéndole!' },
  ];

  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<number>(plantillas[0].id);
  const [showModal, setShowModal] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const plantillaActual = plantillas.find(p => p.id === plantillaSeleccionada);

  const handlePrevisualizar = () => setShowModal(true);
  const handleCerrarModal = () => setShowModal(false);
  const handleEnviar = () => {
    setEnviando(true);
    setTimeout(() => {
      setEnviando(false);
      setShowModal(false);
      alert('Correo enviado correctamente');
    }, 1200);
  };

  return (
    // <div>
      <Form>
        {/* Fila 1: Nombre Cliente, Identificación, Tipo Iden */}
        <Row className="">
          <Col md={5}>
            <Form.Group controlId="nombreCliente">
              <Form.Label><strong>Nombre Cliente</strong></Form.Label>
              <Form.Control type="text" placeholder="" readOnly />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="identificacion">
              <Form.Label><strong>Identificación</strong></Form.Label>
              <Form.Control type="text" placeholder="" readOnly />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="tipoIdentificacion">
              <Form.Label><strong>Tipo Iden</strong></Form.Label>
              <Form.Control type="text" placeholder="" readOnly />
            </Form.Group>
          </Col>
        </Row>

        {/* Fila 2: Dirección */}
        <Row className="">
          <Col>
            <Form.Group controlId="direccion">
              <Form.Label><strong>Dirección</strong></Form.Label>
              <Form.Control type="text" placeholder="" readOnly />
            </Form.Group>
          </Col>
        </Row>

        {/* Fila 3: Email */}
        <Row className="">
          <Col>
            <Form.Group controlId="email">
              <Form.Label><strong>E-mail</strong></Form.Label>
              <Form.Control type="email" placeholder="" readOnly  />
            </Form.Group>
          </Col>
        </Row>

        {/* Fila 4: Teléfono, Celular */}
        <Row className="">
          <Col md={6}>
            <Form.Group controlId="telefono">
              <Form.Label><strong>Telefono</strong></Form.Label>
              <Form.Control type="text" placeholder="" readOnly />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="celular">
              <Form.Label><strong>Celular</strong></Form.Label>
              <Form.Control type="text" placeholder="" readOnly />
            </Form.Group>
          </Col>
        </Row>
        {/* Fila de plantilla de correo */}
        <Row className="mt-3 align-items-end">
          <Col md={8}>
            <Form.Group controlId="plantillaCorreo">
              <Form.Label><strong>Plantilla de correo</strong></Form.Label>
              <Form.Control
                as="select"
                value={plantillaSeleccionada}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPlantillaSeleccionada(Number(e.target.value))}
              >
                {plantillas.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </Form.Control>
            </Form.Group>
          </Col>
          <Col md={4} className="text-end">
            <Button variant="primary" onClick={handlePrevisualizar}>
              Previsualizar
            </Button>
          </Col>
        </Row>
        {/* Modal de previsualización */}
        <Modal show={showModal} onHide={handleCerrarModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>Previsualización de correo</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Contenido de la plantilla</Form.Label>
              <Form.Control as="textarea" rows={5} value={plantillaActual?.texto || ''} readOnly />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCerrarModal} disabled={enviando}>
              Cerrar
            </Button>
            <Button variant="success" onClick={handleEnviar} disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar correo'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Form>
    // </div>
  );
};
