import { useMemo } from "react";
import { ContentHeader } from "@components";
import BuscadoClientes from "./components/BuscadoClientes";
import ModalTablaClientes from "./components/ModalTablaClientes";
import { CustomDatePicker } from "@app/components/DatePicker/DatePickerv2";
import { NumericField } from "@app/components/InputFields/NumericField";
import { ClienteEstadoCuenta } from "./components/EstadoClienteCompleto";
import { buildConsultaClientesColumns } from "./domain/columns";
import { useConsultaClientesPage } from "./hooks/useConsultaClientesPage";

const ConsultaClientes = () => {
  const {
    facturaSeleccionada,
    fechaConsultaFacturas,
    intMora,
    paginationModel,
    searchTerm,
    selectedRows,
    selectedValue,
    seguimientoTitle,
    showModal,
    tablaFacturasRef,
    tableRowsClientes,
    handleBuscarFacturas,
    handleClearSelection,
    handleCloseModal,
    handleIrConsultaCartera,
    handleOpenModal,
    handlePaginationChange,
    handleRowClick,
    handleSelectFactura,
    handleSelectRow,
    setFechaConsultaFacturas,
    setIntMora,
    setSearchTerm,
  } = useConsultaClientesPage();

  const columns = useMemo(
    () =>
      buildConsultaClientesColumns({
        onSelectRow: handleSelectRow,
      }),
    [handleSelectRow]
  );

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
                  <button type="button" className="btn btn-primary" onClick={handleBuscarFacturas}>
                    Buscar
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary ms-2"
                    onClick={handleIrConsultaCartera}
                    disabled={!facturaSeleccionada}
                    style={{ marginLeft: "15px" }}
                    title={seguimientoTitle}
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
                rows={tableRowsClientes}
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
