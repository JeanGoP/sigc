import React, { useEffect, useState } from "react";
import { Row, Col, Form, Button, Card, Spinner, Alert } from "react-bootstrap";
import {
  DynamicTable,
  TableColumn,
} from "@app/pages/ConsultaClientes/components/tablaReutilizables";
import { StringToMoney } from "@app/utils/formattersFunctions";
import { useAppSelector } from "@app/store/store";
import { useRendimientoAsesoresService } from "@app/services/RendimientoAsesores/RendimientoAsesoresService";
import { ProductividadAsesorDto } from "@models/ProductividadAsesorDto";

export const RendimientoDeAsesores: React.FC = () => {
  const today = new Date().toISOString().split("T")[0];
  const [fechaInicial, setFechaInicial] = useState(today);
  const [fechaFinal, setFechaFinal] = useState(today);
  const [data, setData] = useState<ProductividadAsesorDto[]>([]);

  const { loading, error, listarRendimiento } = useRendimientoAsesoresService();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const fetchData = async () => {
    if (!currentUser?.id) return;

    const res = await listarRendimiento({
      IdUsuario: Number(currentUser.id),
      FechaInicial: fechaInicial,
      FechaFinal: fechaFinal,
    });

    if (res?.success) {
      setData(res.data ?? []);
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
      format: (value) => "$ " + StringToMoney(value),
    },
    {
      id: "acumuladoCompromisosCumplidos",
      label: "Acum. Cumplidos",
      align: "right",
      format: (value) => "$ " + StringToMoney(value),
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
