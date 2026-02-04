import { useState, useEffect, useRef } from "react";
import { ContentHeader } from "@components";
import BuscadoClientes from "./components/BuscadoClientes";
import ModalTablaClientes from "./components/ModalTablaClientes";
import { Checkbox } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { GridColDef, GridPaginationModel, GridRowParams } from "@mui/x-data-grid";
import { CustomDatePicker } from "@app/components/DatePicker/DatePickerv2";
import { NumericField } from "@app/components/InputFields/NumericField";
import { ClienteEstadoCuenta, FetchFacturasRef } from "./components/EstadoClienteCompleto";
import { useClientesService } from "@app/services/GestionCartera/ConsultaClientes/clientesService";
import { useNavigate } from "react-router-dom";
import { buildConsultaCarteraUrl } from "@app/utils/consultaCarteraNavigation";

const ConsultaClientes = () => {
  const [selectedValue, setSelectedValue] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [TableRowsClientes, setTableRowsClientes] = useState<any[]>([]);
  const [fechaConsultaFacturas, setFechaConsultaFacturas] = useState(new Date().toISOString().split("T")[0]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [intMora, setIntMora] = useState<string>("3.00");
  const tablaFacturasRef = useRef<FetchFacturasRef>(null);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<{
    cuenta: string;
    factura: string;
    identificacionCliente: string;
  } | null>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });
  const navigate = useNavigate();

  const { loading, error, listarClientes } = useClientesService();

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleRowClick = (params: GridRowParams) => {
    setSelectedValue(params.row.id.toString());
    setShowModal(false);
    setSelectedRows([]);
  };

  const handleClearSelection = () => {
    setSelectedValue("");
    setFacturaSeleccionada(null);
  };
  const handleOpenModal = () => {
    setSearchTerm("");
    setShowModal(true);
    searchClientes();
  };
  const handleCloseModal = () => setShowModal(false);

  const handlePaginationChange = (model: GridPaginationModel) => {
    setPaginationModel(model);
  };

  const manejarClick = () => {
    setFacturaSeleccionada(null);
    tablaFacturasRef.current?.fetchFacturas({ force: true });
  };

  const handleSelectFactura = (row: any) => {
    const cuenta = row?.CUENTA ?? row?.cuenta ?? "";
    const factura = row?.NUMEFAC ?? row?.factura ?? "";
    const identificacionCliente =
      row?.cliente ?? row?.identificacionCliente ?? selectedValue ?? "";

    if (!cuenta || !factura || !identificacionCliente) {
      setFacturaSeleccionada(null);
      return;
    }

    setFacturaSeleccionada({
      cuenta: String(cuenta),
      factura: String(factura),
      identificacionCliente: String(identificacionCliente),
    });
  };

  const handleIrConsultaCartera = () => {
    if (!facturaSeleccionada) return;
    const url = buildConsultaCarteraUrl(facturaSeleccionada);
    navigate(url);
  };

  const searchClientes = async (filter = "") => {
    const params = {
      page: paginationModel.page + 1,
      numpage: paginationModel.pageSize,
      filter,
      intmora: intMora,
    };
    if (params.filter.length > 2) {
      const res: any = await listarClientes(params);
      if (res?.success) {
        setTableRowsClientes(res.data || []);
      } else {
        setTableRowsClientes([]);
      }
    }
  };

  useEffect(() => {
    searchClientes(searchTerm);
  }, [paginationModel.page, paginationModel.pageSize]);

  useEffect(() => {
    setFacturaSeleccionada(null);
  }, [selectedValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchClientes(searchTerm);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const columns: GridColDef[] = [
    {
      field: "select",
      headerName: "",
      width: 40,
      minWidth: 20,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Checkbox
          checked={params.row.selected || false}
          onChange={() => handleSelectRow(params.row.id)}
          icon={<FontAwesomeIcon icon={faCircleCheck} style={{ color: "#63E6BE" }} />}
        />
      ),
    },
    { field: "id", headerName: "Identificación", width: 150 },
    { field: "nombre", headerName: "Nombre", flex: 1, maxWidth: 550 },
    { field: "telefono", headerName: "Teléfono", width: 150 },
    { field: "codIcta", headerName: "Código ICTA", width: 150 },
  ];

  return (
    <div>
      <ContentHeader title="Consulta Clientes" />
      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Consulta de Clientes</h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-2">
                  <BuscadoClientes
                    selectedValue={selectedValue}
                    onClear={handleClearSelection}
                    onOpenModal={handleOpenModal}
                  />
                </div>
                <div className="col-md-2 text-start">
                  <CustomDatePicker
                    label="Seleccione la fecha"
                    selectedDate={fechaConsultaFacturas}
                    onDateChange={setFechaConsultaFacturas}
                  />
                </div>
                <div className="col-sm-1 col-md-1 col-lg-1 text-start">
                  <NumericField value={intMora} onChange={setIntMora} />
                </div>
                <div className="col-md-2 mt-2">
                  <br />
                  <button type="button" className="btn btn-primary" onClick={manejarClick}>
                    Buscar
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary ms-2"
                    onClick={handleIrConsultaCartera}
                    disabled={!facturaSeleccionada}
                    style={{marginLeft:"15px"}}
                    title={
                      facturaSeleccionada
                        ? "Ir a consulta de cartera"
                        : "Seleccione una factura con el ícono del ojo"
                    }
                  >
                    Seguimiento
                  </button>
                </div>
              </div>

              <div style={{ padding: 20 }}>
                <ClienteEstadoCuenta
                  cliente={selectedValue}
                  fecha={fechaConsultaFacturas}
                  intmora={intMora}
                  ref={tablaFacturasRef}
                  onSelectFactura={handleSelectFactura}
                />
              </div>

              <ModalTablaClientes
                show={showModal}
                onHide={handleCloseModal}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                columns={columns}
                rows={TableRowsClientes}
                selectedRows={selectedRows}
                onSelectRow={handleSelectRow}
                onPaginationChange={handlePaginationChange}
                paginationModel={paginationModel}
                onRowClick={handleRowClick}
              />
            </div>
            <div className="card-footer">Footer</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ConsultaClientes;
