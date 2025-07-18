import React, { useEffect, useState } from "react";
import { Row, Col, Form, Button, Card, Spinner, Alert } from "react-bootstrap";
import {
  DynamicTable,
  TableColumn,
} from "@app/pages/ConsultaClientes/components/tablaReutilizables";
import { StringToMoney } from "@app/utils/formattersFunctions";
import { current } from "@reduxjs/toolkit";
import { setCurrentUser } from "@app/store/reducers/auth";
import { useAppSelector } from "@app/store/store";

interface ProductividadAsesorDto {
  asesor: string;
  totalGestiones: number;
  clientesGestionados: number;
  contactoDirecto: number;
  contactoIndirecto: number;
  noContacto: number;
  numCompromisosdePago: number;
  acumuladoCompromisos: number;
  acumuladoCompromisosCumplidos: number;
}

export const RendimientoDeAsesores: React.FC = () => {
  const today = new Date().toISOString().split("T")[0];
  const [fechaInicial, setFechaInicial] = useState(today);
  const [fechaFinal, setFechaFinal] = useState(today);
  const [data, setData] = useState<ProductividadAsesorDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://localhost:7013/api/ProductividadAsesores/GetList?IdUsuario=${currentUser?.id}&FechaInicial=${fechaInicial}&FechaFinal=${fechaFinal}`;
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || "Error al consultar los datos");
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: TableColumn[] = [
    { id: "asesor", label: "Asesor" },
    { id: "totalGestiones", label: "Total Gestiones", align: "right" },
    { id: "clientesGestionados", label: "Clientes", align: "right" },
    { id: "contactoDirecto", label: "Contacto Directo", align: "right" },
    { id: "contactoIndirecto", label: "Contacto Indirecto", align: "right" },
    { id: "noContacto", label: "No Contacto", align: "right" },
    { id: "numCompromisosdePago", label: "# Compromisos", align: "right" },
    {
      id: "acumuladoCompromisos",
      label: "Acumulado",
      align: "right",
      format: (value: string | number) => "$ " + StringToMoney(value),
    },
    {
      id: "acumuladoCompromisosCumplidos",
      label: "Acum. Cumplidos",
      align: "right",
      format: (value: string | number) => "$ " + StringToMoney(value),
    },
  ];

  return (
    <div className="container-fluid mt-3">
      <Card className="p-3 mb-3">
        <Row className="g-2 align-items-end">
          <Col md={3}>
            <Form.Group>
              <Form.Label>Fecha Inicial</Form.Label>
              <Form.Control
                type="date"
                value={fechaInicial}
                onChange={(e) => setFechaInicial(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Fecha Final</Form.Label>
              <Form.Control
                type="date"
                value={fechaFinal}
                onChange={(e) => setFechaFinal(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Button variant="primary" onClick={fetchData}>
                Consultar
              </Button>
            </Form.Group>
          </Col>
        </Row>
      </Card>

      {loading && (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && data.length > 0 && (
        <DynamicTable columns={columns} rows={data} showFooter={true} />
      )}
    </div>
  );
};
