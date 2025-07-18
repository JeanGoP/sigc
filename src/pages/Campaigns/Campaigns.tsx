import { Card, Button, Row, Col } from "react-bootstrap";
import React, { useState } from "react";
import {
  DynamicTablePagination,
  TableColumn,
} from "@app/pages/ConsultaClientes/components/tablaReutilizablePaginacion";
import { ViewNuevaCampaña } from "./ViewNuevaCampaña";
import { SelectOption } from "@app/components/MultiSelectCheckBox/MultiSelectCheckBox";

// Datos de ejemplo
const mockData = [
  {
    id: 1,
    nombre: "Campaña Julio",
    fechaInicio: "2025-07-01",
    fechaFin: "2025-07-31",
    estado: "Activa",
    cantidadCarteras: 25,
  },
  {
    id: 2,
    nombre: "Campaña Agosto",
    fechaInicio: "2025-08-01",
    fechaFin: "2025-08-31",
    estado: "Inactiva",
    cantidadCarteras: 15,
  },
  {
    id: 3,
    nombre: "Campaña Especial",
    fechaInicio: "2025-07-15",
    fechaFin: "2025-08-15",
    estado: "Pendiente",
    cantidadCarteras: 32,
  },
];

const Campaigns = () => {
  // BASE
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [nuevaCampana, setNuevaCampana] = useState(false);
  // BASE

  // Filtros
  const edades: SelectOption[] = [
  { value: 'PV', label: 'PV' },
  { value: '30', label: '30' },
  { value: '60', label: '60' },
  { value: '90', label: '90' },
  { value: '+90', label: '+90' },
];

const cuentas: SelectOption[] = [
  { value: '1105', label: 'Cuenta 1105' },
  { value: '1305', label: 'Cuenta 1305' },
  { value: '1405', label: 'Cuenta 1405' },
];

  // Filtros
  

  const filteredData = mockData.filter((row) =>
    row.nombre.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: TableColumn[] = [
    {
      id: "editar",
      label: "",
      align: "center",
      format: (_value, row) => (
        <Button
          variant="contained"
          color="primary"
          size="sm"
          onClick={() => handleEdit(row)}
        >
          Editar
        </Button>
      ),
    },
    { id: "nombre", label: "Nombre" },
    {
      id: "fechaInicio",
      label: "Fecha de Inicio",
      format: (value) => new Date(value).toLocaleDateString(),
    },
    {
      id: "fechaFin",
      label: "Fecha de Fin",
      format: (value) => new Date(value).toLocaleDateString(),
    },
    { id: "estado", label: "Estado" },
    {
      id: "cantidadCarteras",
      label: "Carteras",
      align: "right",
    },
  ];

  const handleEdit = (row: any) => {
    alert(`Editar campaña: ${row.nombre}`);
    // Aquí podrías abrir un modal o redirigir a una página de edición
  };

  return (
    <>
      <Card>
        <Card.Header>
          <h2>Gestión de Campañas</h2>
        </Card.Header>
        <Card.Body>
          {nuevaCampana ? (
            <div>
              <Row>
                <Col xs={12} md={12} className="">
                  <ViewNuevaCampaña />
                </Col>
              </Row>
              <Row>
                <Col xs={12} md={12} className="text-right">
                  <div className="container">
                    <Button
                      variant="secondary"
                      style={{ marginRight: "16px" }}
                      onClick={() => setNuevaCampana(!nuevaCampana)}
                      // style={{ marginBottom: "16px" }}
                      title="Cancelar"
                    >
                      <span className="">Cancelar</span>
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => setNuevaCampana(!nuevaCampana)}
                      // style={{ marginBottom: "16px" }}
                      title="Guardar"
                    >
                      <span className="">Guardar</span>
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>
          ) : (
            <div>
              <Button
                variant="primary"
                onClick={() => setNuevaCampana(!nuevaCampana)}
                // style={{ marginBottom: "16px" }}
                title="Nueva Campaña"
              >
                <span className="fa fa-plus-circle fa-2x"></span>
              </Button>

              <br />
              <DynamicTablePagination
                columns={columns}
                rows={filteredData}
                searchText={searchText}
                onSearchChange={setSearchText}
                page={page}
                onPageChange={setPage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={setRowsPerPage}
              />
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default Campaigns;
