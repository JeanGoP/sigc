import React, { useState } from 'react';
import { DynamicTablePagination, TableColumn } from '@pages/ConsultaClientes/components/tablaReutilizablePaginacion';
import { Button, Modal, Form, Row, Col, Card } from 'react-bootstrap';
import Select from 'react-select';

const mockData = [
  {
    numefac: 'F001',
    cliente: 'Juan Pérez',
    cuenta: 'C123',
    usuario: 'admin',
    FechaHora: '2024-06-10 10:00',
    Descripcion: 'Llamada para informar sobre el estado de la cuenta.',
    TipoContacto: 'Llamada',
    IdGrabacionLlamada: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    eventos: [
      { tipo: 'Llamada', fecha: '2024-06-10', hora: '10:00' },
      { tipo: 'Visita', fecha: '2024-06-12', hora: '15:00' }
    ]
  },
  {
    numefac: 'F002',
    cliente: 'Ana Gómez',
    cuenta: 'C456',
    usuario: 'gestor1',
    FechaHora: '2024-06-11 09:00',
    Descripcion: 'Correo enviado para recordar el pago pendiente.',
    TipoContacto: 'Correo',
    IdGrabacionLlamada: '',
    eventos: [
      { tipo: 'Correo', fecha: '2024-06-11', hora: '09:00' }
    ]
  },
  {
    numefac: 'F002',
    cliente: 'Ana Gómez',
    cuenta: 'C456',
    usuario: 'gestor1',
    FechaHora: '2024-06-11 09:00',
    Descripcion: 'Correo enviado para recordar el pago pendiente.',
    TipoContacto: 'Correo',
    IdGrabacionLlamada: '',
    eventos: [
      { tipo: 'Correo', fecha: '2024-06-11', hora: '09:00' }
    ]
  },
  {
    numefac: 'F002',
    cliente: 'Ana Gómez',
    cuenta: 'C456',
    usuario: 'gestor1',
    FechaHora: '2024-06-11 09:00',
    Descripcion: 'Correo enviado para recordar el pago pendiente.',
    TipoContacto: 'Correo',
    IdGrabacionLlamada: '',
    eventos: [
      { tipo: 'Correo', fecha: '2024-06-11', hora: '09:00' }
    ]
  },
  {
    numefac: 'F002',
    cliente: 'Ana Gómez',
    cuenta: 'C456',
    usuario: 'gestor1',
    FechaHora: '2024-06-11 09:00',
    Descripcion: 'Correo enviado para recordar el pago pendiente.',
    TipoContacto: 'Correo',
    IdGrabacionLlamada: '',
    eventos: [
      { tipo: 'Correo', fecha: '2024-06-11', hora: '09:00' }
    ]
  },
  {
    numefac: 'F002',
    cliente: 'Ana Gómez',
    cuenta: 'C456',
    usuario: 'gestor1',
    FechaHora: '2024-06-11 09:00',
    Descripcion: 'Correo enviado para recordar el pago pendiente.',
    TipoContacto: 'Correo',
    IdGrabacionLlamada: '',
    eventos: [
      { tipo: 'Correo', fecha: '2024-06-11', hora: '09:00' }
    ]
  },
  {
    numefac: 'F002',
    cliente: 'Ana Gómez',
    cuenta: 'C456',
    usuario: 'gestor1',
    FechaHora: '2024-06-11 09:00',
    Descripcion: 'Correo enviado para recordar el pago pendiente.',
    TipoContacto: 'Correo',
    IdGrabacionLlamada: '',
    eventos: [
      { tipo: 'Correo', fecha: '2024-06-11', hora: '09:00' }
    ]
  }
];

const usuarios = [
  { label: 'Todos', value: '' },
  { label: 'admin', value: 'admin' },
  { label: 'gestor1', value: 'gestor1' }
];

const campañas = [
  { label: 'Todas', value: '' },
  { label: 'Campaña 1', value: 'camp1' },
  { label: 'Campaña 2', value: 'camp2' }
];

const MonitorSeguimientos: React.FC = () => {
  const [rows, setRows] = useState(mockData);
  const [searchText, setSearchText] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [eventosModal, setEventosModal] = useState<any[]>([]);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    usuario: '',
    campaña: ''
  });
  const [showDetalle, setShowDetalle] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState<any>(null);

  const columns: TableColumn[] = [
    { id: 'cliente', label: 'Cliente' },
    { id: 'factura', label: 'Factura', format: (_v, row) => row.numefac },
    { id: 'cuenta', label: 'Cuenta' },
    { id: 'usuario', label: 'Usuario' },
    {
      id: 'eventos',
      label: 'Eventos programados',
      format: (_value, row) => (
        <Button size="sm" variant="info" onClick={() => handleVerEventos(row.eventos)}>
          Ver eventos
        </Button>
      )
    },
    {
      id: 'ver',
      label: 'Ver',
      format: (_value, row) => (
        <Button size="sm" variant="primary" onClick={() => handleVerDetalle(row)}>
          Ver
        </Button>
      )
    }
  ];

  function handleVerEventos(eventos: any[]) {
    setEventosModal(eventos);
    setShowModal(true);
  }

  function handleVerDetalle(row: any) {
    setDetalleSeleccionado(row);
    setShowDetalle(true);
  }

  function handleFiltroChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  }

  // Aquí puedes filtrar los datos según los filtros seleccionados
  // ...

  return (
    <div className="container mt-4">
      <h3>Monitor de seguimientos</h3>
      <Card className="shadow-sm border-0">
        <Card.Body>
          <Form className="mb-3 position-relative" style={{ zIndex: 2 }}>
            <Row className="filtros-zindex" style={{ zIndex: 2, position: 'relative', background: '#fff' }}>
              <Col md={3}>
                <Form.Label>Fecha inicial</Form.Label>
                <Form.Control type="date" name="fechaInicio" value={filtros.fechaInicio} onChange={handleFiltroChange} />
              </Col>
              <Col md={3}>
                <Form.Label>Fecha final</Form.Label>
                <Form.Control type="date" name="fechaFin" value={filtros.fechaFin} onChange={handleFiltroChange} />
              </Col>
              <Col md={3}>
                <Form.Label>Usuario</Form.Label>
                <Select
                  name="usuario"
                  value={usuarios.find(u => u.value === filtros.usuario)}
                  onChange={option => setFiltros({ ...filtros, usuario: option ? option.value : '' })}
                  options={usuarios}
                  isClearable
                />
              </Col>
              <Col md={3}>
                <Form.Label>Campaña</Form.Label>
                <Select
                  name="campaña"
                  value={campañas.find(c => c.value === filtros.campaña)}
                  onChange={option => setFiltros({ ...filtros, campaña: option ? option.value : '' })}
                  options={campañas}
                  isClearable
                />
              </Col>
            </Row>
          </Form>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <DynamicTablePagination
              columns={columns}
              rows={rows}
              searchText={searchText}
              onSearchChange={setSearchText}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={setRowsPerPage}
              page={page}
              onPageChange={setPage}
            />
          </div>
        </Card.Body>
      </Card>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Eventos programados</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {eventosModal.length === 0 ? (
            <p>No hay eventos programados.</p>
          ) : (
            <ul>
              {eventosModal.map((ev, idx) => (
                <li key={idx}>{ev.tipo} - {ev.fecha} {ev.hora}</li>
              ))}
            </ul>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showDetalle} onHide={() => setShowDetalle(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalle del seguimiento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detalleSeleccionado && (
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Row className="mb-2">
                  <Col xs={6}><b>Factura:</b> {detalleSeleccionado.numefac}</Col>
                  <Col xs={6}><b>Cliente:</b> {detalleSeleccionado.cliente}</Col>
                </Row>
                <Row className="mb-2">
                  <Col xs={6}><b>Cuenta:</b> {detalleSeleccionado.cuenta}</Col>
                  <Col xs={6}><b>Usuario:</b> {detalleSeleccionado.usuario}</Col>
                </Row>
                <Row className="mb-2">
                  <Col xs={6}><b>Fecha y Hora:</b> {detalleSeleccionado.FechaHora}</Col>
                  <Col xs={6}><b>Tipo de Contacto:</b> {detalleSeleccionado.TipoContacto}</Col>
                </Row>
                <Row className="mb-2">
                  <Col xs={12}><b>Descripción:</b><br />{detalleSeleccionado.Descripcion}</Col>
                </Row>
                <Row className="mb-2">
                  <Col xs={12}>
                    <b>Grabación de llamada:</b><br />
                    {detalleSeleccionado.IdGrabacionLlamada ? (
                      <audio controls src={detalleSeleccionado.IdGrabacionLlamada} style={{ width: '100%' }} />
                    ) : (
                      <span>No disponible</span>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetalle(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MonitorSeguimientos; 