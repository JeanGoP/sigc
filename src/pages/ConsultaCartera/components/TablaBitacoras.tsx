import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Row, Col, Card, Spinner } from 'react-bootstrap';
import { obtenerBitacoras, crearBitacora, Bitacora, obtenerResumenBitacora, ResumenBitacora } from '@app/services/BitacoraService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt, faEye } from '@fortawesome/free-solid-svg-icons';
import { useAppSelector } from '@app/store/store';
import { toast } from 'react-toastify';

interface Props {
  cliente: string;
}

export const TablaBitacoras: React.FC<Props> = ({ cliente }) => {
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([]);
  const [resumen, setResumen] = useState<ResumenBitacora | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showComentarioModal, setShowComentarioModal] = useState(false);
  const [comentarioSeleccionado, setComentarioSeleccionado] = useState<Bitacora | null>(null);
  const [nuevaBitacora, setNuevaBitacora] = useState({
    comentario: '',
    calificacion: 5
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const cargarDatos = async () => {
    if (!cliente) {
      setBitacoras([]);
      setResumen(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [bitacorasResponse, resumenResponse] = await Promise.all([
        obtenerBitacoras(cliente),
        obtenerResumenBitacora(cliente)
      ]);

      if (bitacorasResponse.success) {
        setBitacoras(bitacorasResponse.data);
      }

      if (resumenResponse.success) {
        setResumen(resumenResponse.data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos del cliente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [cliente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      toast.error('No hay usuario logueado. Por favor, inicie sesión nuevamente.');
      return;
    }

    try {
      const response = await crearBitacora({
        cliente,
        usuario: currentUser.id,
        fechaHora: new Date().toISOString(),
        comentario: nuevaBitacora.comentario,
        calificacion: nuevaBitacora.calificacion
      });

      if (response.success) {
        setShowModal(false);
        setNuevaBitacora({ comentario: '', calificacion: 5 });
        toast.success('Bitácora creada exitosamente');
        cargarDatos(); // Recargar todos los datos después de crear una nueva bitácora
      } else {
        setError(response.errors[0] || 'Error al crear la bitácora');
        toast.error(response.errors[0] || 'Error al crear la bitácora');
      }
    } catch (error) {
      setError('Error al crear la bitácora');
      toast.error('Error al crear la bitácora');
    }
  };

  const renderStars = (calificacion: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesomeIcon
          key={i}
          icon={i <= calificacion ? faStar : faStarHalfAlt}
          style={{ color: i <= calificacion ? '#ffc107' : '#e4e5e9' }}
        />
      );
    }
    return <div>{stars}</div>;
  };

  const handleVerComentario = (bitacora: Bitacora) => {
    setComentarioSeleccionado(bitacora);
    setShowComentarioModal(true);
  };

  return (
    <div>
      {loading ? (
        <div className="text-center py-3">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : (
        <>
          {resumen && (
            <Card className="mb-3" style={{ backgroundColor: '#f8f9fa' }}>
              <Card.Body className="py-2">
                <Row className="align-items-center">
                  <Col md={4} className="border-end">
                    <div className="text-center">
                      <div className="h4 mb-0">{resumen.promedioCalificacion.toFixed(1)}</div>
                      {renderStars(Math.round(resumen.promedioCalificacion))}
                      <small className="text-muted d-block">{resumen.totalCalificaciones} calificaciones</small>
                    </div>
                  </Col>
                  <Col md={8}>
                    <div className="d-flex justify-content-between align-items-center">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <div key={rating} className="text-center px-2">
                          {renderStars(rating)}
                          <div className="small text-muted mt-1">
                            {resumen[`cantidad${rating}` as keyof ResumenBitacora]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Bitácora de Cliente</h5>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Nueva Bitácora
            </Button>
          </div>

          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Comentario</th>
                <th>Calificación</th>
                <th style={{ width: '60px' }}>Ver</th>
              </tr>
            </thead>
            <tbody>
              {bitacoras.map((bitacora) => (
                <tr key={bitacora.id}>
                  <td>{new Date(bitacora.fechaHora).toLocaleString()}</td>
                  <td>{bitacora.usuario}</td>
                  <td>
                    <div style={{ 
                      maxWidth: '300px', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}>
                      {bitacora.comentario}
                    </div>
                  </td>
                  <td>{renderStars(bitacora.calificacion)}</td>
                  <td className="text-center">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleVerComentario(bitacora)}
                      title="Ver comentario completo"
                      style={{ padding: '0.25rem 0.5rem' }}
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Nueva Bitácora</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Comentario</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={nuevaBitacora.comentario}
                    onChange={(e) => setNuevaBitacora({ ...nuevaBitacora, comentario: e.target.value })}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Calificación</Form.Label>
                  <div>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant={nuevaBitacora.calificacion === rating ? 'warning' : 'outline-warning'}
                        className="me-2"
                        onClick={() => setNuevaBitacora({ ...nuevaBitacora, calificacion: rating })}
                      >
                        {renderStars(rating)}
                      </Button>
                    ))}
                  </div>
                </Form.Group>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <div className="d-flex justify-content-end">
                  <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                    Cancelar
                  </Button>
                  <Button variant="primary" type="submit">
                    Guardar
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

          <Modal show={showComentarioModal} onHide={() => setShowComentarioModal(false)}>
            <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
              <Modal.Title>
                <FontAwesomeIcon icon={faStar} className="text-warning me-2" />
                Detalle del Comentario
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {comentarioSeleccionado && (
                <div className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <div className="text-muted small">Fecha y Hora</div>
                      <div className="fw-bold">{new Date(comentarioSeleccionado.fechaHora).toLocaleString()}</div>
                    </div>
                    <div className="text-end">
                      <div className="text-muted small">Usuario</div>
                      <div className="fw-bold">{comentarioSeleccionado.usuario}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-muted small mb-2">Calificación</div>
                    <div className="d-flex align-items-center">
                      {renderStars(comentarioSeleccionado.calificacion)}
                      <span className="ms-2 text-muted">
                        ({comentarioSeleccionado.calificacion}/5)
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-muted small mb-2">Comentario</div>
                    <div 
                      className="p-3 bg-light rounded" 
                      style={{ 
                        whiteSpace: 'pre-wrap',
                        maxHeight: '300px',
                        overflowY: 'auto'
                      }}
                    >
                      {comentarioSeleccionado.comentario}
                    </div>
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
              <Button 
                variant="secondary" 
                onClick={() => setShowComentarioModal(false)}
                className="px-4"
              >
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
}; 