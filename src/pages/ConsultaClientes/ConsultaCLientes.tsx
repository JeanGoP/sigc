import { useState, useEffect, useRef ,useCallback } from "react";
import { ContentHeader } from "@components";
import {
  ClientesListRequest,
  getClientesList,
} from "@app/services/GetClientesListByFilter";
import BuscadoClientes from "./components/BuscadoClientes";
import ModalTablaClientes from "./components/ModalTablaClientes";
import { Box, Checkbox } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import {
  GridColDef,
  GridPaginationModel,
  GridRowParams,
} from "@mui/x-data-grid";
import DatePickerMui from "@app/components/DatePicker/DatePicker";
import { TablaFacturas } from "./components/TablaFacturas";
import { FormularioCliente } from "./components/FormularioCliente";
import { Card, Form, FormControl, FormLabel } from "react-bootstrap";
import EstadoClienteTable from "./components/prueba_tablaSaldos";
import { FacturasTablePrueba } from "./components/prueba_facturas";
import { TableColumn } from "./components/tablaReutilizables";
import {
  EstadoCuentaRequest,
  FetchEstadoCuentaClienteFactura,
} from "@app/services/GetEstadoCuentaClienteFactura";
import { StringToMoney} from "@app/utils/formattersFunctions";
import { RecibosCajaTable } from "./components/TablaRecibosCaja";
import { handleApiResponse } from "@app/utils/handleApiResponse";
import { FacturaListado } from "@app/models/facturaConsultaclienteModel";
import { ObtenerRecibosCajaPorFactura } from "@app/services/GetRecibosCajaListService";
import { CustomDatePicker } from "@app/components/DatePicker/DatePickerv2";
import { NumericField } from "@app/components/InputFields/NumericField";
import { ClienteEstadoCuenta, FetchFacturasRef} from "./components/EstadoClienteCompleto";

// import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const ConsultaClientes = () => {
  const [selectedValue, setSelectedValue] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [TableRowsClientes, setTableRowsClientes] = useState<any[]>([]);
  // const [rowsFacturas, setRowsFacturas] = useState<FacturaListado[]>([]);
  // const [clienteCuotasRows, setClienteCuotasRows] = useState<any[]>([]);
  // const [TableRowsRecibosCaja, setTableRowsRecibosCaja] = useState<any[]>([]);
  const [fechaConsultaFacturas, setFechaConsultaFacturas] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [FacturaSelected, setFacturaSelected] = useState<string>();
  const [intMora, setIntMora] = useState<string>("3.00");
  const tablaFacturasRef = useRef<FetchFacturasRef>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({

    page: 0,
    pageSize: 20,
  });

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

  const handleClearSelection = () => setSelectedValue("");
  const handleOpenModal = () => {
    setSearchTerm("");
    setShowModal(true);
    searchClientes();
  };
  const handleCloseModal = () => setShowModal(false);

  const handlePaginationChange = (model: GridPaginationModel) => {
    setPaginationModel(model);
    // searchClientes();
  };

  
  const manejarClick = () => {
    console.log("Selected value: asdasdasdasd" );
    tablaFacturasRef.current?.fetchFacturas(); // Llama la función del hijo
  };
  const searchClientes = async (filter = "") => {
    const data: ClientesListRequest = {
      page: paginationModel.page + 1,
      numpage: paginationModel.pageSize,
      filter,
      intmora: intMora
    };
    if (data.filter.length > 2) {
      const res: any = await getClientesList(data);
      setTableRowsClientes(res.data || []);
    }
  };

  const changeDate = (date: string | null) => {
    console.log("Selected date:", date);
    if (date) {
      setFechaConsultaFacturas(date);
    }
  };

  

  useEffect(() => {
    searchClientes(searchTerm);
  }, [paginationModel.page, paginationModel.pageSize]);

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
          icon={
            <FontAwesomeIcon
              icon={faCircleCheck}
              style={{ color: "#63E6BE" }}
            />
          }
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
              {/* <div className="container"> */}
              <div className="row">
                <div className="col-md-2">
                  <BuscadoClientes
                    selectedValue={selectedValue}
                    onClear={handleClearSelection}
                    onOpenModal={handleOpenModal}
                  />
                </div>
                <div className="col-md-2 text-start">
                  {/* <DatePickerMui
                    placeHolder="Fecha"
                    onDateChange={(dateStr) =>
                      setFechaConsultaFacturas(dateStr)
                    }
                  /> */}
                  <CustomDatePicker label="Seleccione la fecha" selectedDate={fechaConsultaFacturas} onDateChange={(dateStr) =>
                      setFechaConsultaFacturas(dateStr)
                    } />
                </div>
                 <div className="col-sm-1 col-md-1 col-lg-1 text-start">
                  <NumericField
                    value={intMora}
                    onChange={(int) => setIntMora(int) }
                  />
                  </div>
                <div className="col-md-2 mt-2">
                  <br />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={manejarClick}
                  >
                    Buscar
                  </button>
                </div>
              </div>
              <div className="row">
                <div className="col col-sm-12 col-md-6 col-lg-6 col-xl-6 mt-2 border border-2 border rounded">
                  <FormularioCliente />
                </div>
                <div className="col col-sm-12 col-md-6 col-lg-6 col-xl-4 mt-2"></div>
              </div>
              <br />
              <div className="row">
                <div className="col-sm-12 col-md-12 col-lg-12 col-xl-12 mt-2 mx-auto shadow">
                  {/* <Card className="">
                        <Card.Header style={{backgroundColor: '#343A40', color:'#ffff'}}>Facturas</Card.Header>
                        <div className="col-sm-12 col-md-12 col-lg-12 col-xl-12 mt-2 mx-auto"> */}
                  {/* </div>
                      </Card> */}
                </div>
              </div>
              <div style={{ padding: 20 }}>
                {/* <TablaFacturas
                  rows={rowsFacturas}
                  cliente={selectedValue}
                  fecha={fechaConsultaFacturas}
                  intmora={intMora}
                  setFacturaFather={ReciboCajaHandler}
                  setCuotas={setClienteCuotasRows}
                />
                <EstadoClienteTable
                  rows={clienteCuotasRows}
                  columns={columns_saldos}
                />
                <RecibosCajaTable rows={TableRowsRecibosCaja} /> */}
                
                <ClienteEstadoCuenta                  
                  cliente={selectedValue}
                  fecha={fechaConsultaFacturas}
                  intmora={intMora}
                  ref={tablaFacturasRef}               
                  />

                {/* <FacturasTablePrueba /> */}
              </div>
              {/* </div> */}
              {/* <DatePicker label="Basic date picker" /> */}
              {/* <DatePickerMui /> */}

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
