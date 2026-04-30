import React from "react";
import ModalTablaClientes from "@app/pages/ConsultaClientes/components/ModalTablaClientes";
import { AgregarEventoModal } from "./components/AgregarEventoModal";
import { buildClientesColumns } from "./components/clientesColumns";
import { EditarEventoModal } from "./components/EditarEventoModal";
import { GestionDetalleModal } from "./components/GestionDetalleModal";
import { GestionesTable } from "./components/GestionesTable";
import { ModificacionEventosFilters } from "./components/ModificacionEventosFilters";
import { useModificacionEventosPage } from "./hooks/useModificacionEventosPage";

export const ModificacionEventos: React.FC = () => {
  const {
    fechaInicio,
    fechaFin,
    erroresFechas,
    usuarioFiltro,
    usuarios,
    cuentaFiltro,
    clienteFiltro,
    loadingConsulta,
    showModalClientes,
    searchClienteTerm,
    tableRowsClientes,
    selectedRowsClientes,
    paginationModelClientes,
    rows,
    totalRows,
    rowsPerPage,
    page,
    filtrosConsulta,
    busquedaGestion,
    drawerGestion,
    editandoDescripcion,
    descripcionEdit,
    savingDescripcion,
    showModalEdicion,
    eventoEditando,
    savingEdicion,
    formEdicion,
    showModalAgregar,
    formAgregar,
    savingAgregar,
    horasDisponiblesEdicion,
    horasDisponiblesAgregar,
    loadingHoras,
    tipoEventoOptions,
    usuarioOptionsEdicion,
    tipoEventoOptionsEdicion,
    requiereFechaEdicion,
    requiereHoraEdicion,
    requiereMontoEdicion,
    requiereFechaAgregar,
    requiereHoraAgregar,
    requiereMontoAgregar,
    handleFechaInicioChange,
    handleFechaFinChange,
    clearFechaInicioError,
    clearFechaFinError,
    handleUsuarioFiltroChange,
    handleCuentaFiltroChange,
    handleClearCliente,
    handleSelectRowCliente,
    handleRowClickCliente,
    handleOpenModalCliente,
    handleHideModalClientes,
    handleSearchClienteTermChange,
    handlePaginationClientesChange,
    handleConsultar,
    handleBusquedaGestionChange,
    handleOpenDrawer,
    handlePageChange,
    handleRowsPerPageChange,
    handleCloseDrawer,
    handleIniciarEditarDescripcion,
    handleCancelarDescripcion,
    handleDescripcionChange,
    handleGuardarDescripcion,
    handleOpenModalAgregar,
    handleEditarEvento,
    handleEliminarEvento,
    handleIrSeguimientoEvento,
    resolverNombreTipo,
    resolverNombreUsuario,
    handleCloseModalEdicion,
    handleGuardarEdicion,
    handleUsuarioEdicionChange,
    handleChangeTipoEventoEdicion,
    handleFechaEventoEdicionChange,
    handleHoraEventoEdicionChange,
    handleMontoEdicionChange,
    handleCloseModalAgregar,
    handleGuardarAgregar,
    handleUsuarioAgregarChange,
    handleChangeTipoEventoAgregar,
    handleFechaEventoAgregarChange,
    handleHoraEventoAgregarChange,
    handleMontoAgregarChange,
    handleEliminarGestion,
  } = useModificacionEventosPage();

  const columnsClientes = React.useMemo(
    () => buildClientesColumns(handleSelectRowCliente),
    [handleSelectRowCliente],
  );

  return (
    <div className="mt-5" style={{ margin: "auto", width: "90%" }}>
      <h3>Modificacion de gestiones</h3>

      <ModificacionEventosFilters
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        erroresFechas={erroresFechas}
        usuarioFiltro={usuarioFiltro}
        usuarios={usuarios}
        cuentaFiltro={cuentaFiltro}
        clienteFiltro={clienteFiltro}
        loadingConsulta={loadingConsulta}
        onFechaInicioChange={handleFechaInicioChange}
        onFechaFinChange={handleFechaFinChange}
        onClearFechaInicioError={clearFechaInicioError}
        onClearFechaFinError={clearFechaFinError}
        onUsuarioFiltroChange={handleUsuarioFiltroChange}
        onCuentaFiltroChange={handleCuentaFiltroChange}
        onOpenModalCliente={handleOpenModalCliente}
        onClearCliente={handleClearCliente}
        onConsultar={handleConsultar}
      />

      <GestionesTable
        busquedaGestion={busquedaGestion}
        onBusquedaGestionChange={handleBusquedaGestionChange}
        loadingConsulta={loadingConsulta}
        rows={rows}
        filtrosConsulta={filtrosConsulta}
        drawerGestionId={drawerGestion?.idGestion ?? null}
        onOpenDrawer={handleOpenDrawer}
        totalRows={totalRows}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <GestionDetalleModal
        show={drawerGestion !== null}
        drawerGestion={drawerGestion}
        editandoDescripcion={editandoDescripcion}
        descripcionEdit={descripcionEdit}
        savingDescripcion={savingDescripcion}
        onClose={handleCloseDrawer}
        onEliminarGestion={handleEliminarGestion}
        onIniciarEditarDescripcion={handleIniciarEditarDescripcion}
        onCancelarDescripcion={handleCancelarDescripcion}
        onDescripcionChange={handleDescripcionChange}
        onGuardarDescripcion={handleGuardarDescripcion}
        onOpenModalAgregar={handleOpenModalAgregar}
        onEditarEvento={handleEditarEvento}
        onEliminarEvento={handleEliminarEvento}
        onIrSeguimientoEvento={handleIrSeguimientoEvento}
        resolverNombreTipo={resolverNombreTipo}
        resolverNombreUsuario={resolverNombreUsuario}
      />

      <EditarEventoModal
        show={showModalEdicion}
        eventoEditando={eventoEditando}
        form={formEdicion}
        usuarioOptions={usuarioOptionsEdicion}
        tipoEventoOptions={tipoEventoOptionsEdicion}
        requiereFecha={requiereFechaEdicion}
        requiereHora={requiereHoraEdicion}
        requiereMonto={requiereMontoEdicion}
        horasDisponibles={horasDisponiblesEdicion}
        loadingHoras={loadingHoras}
        saving={savingEdicion}
        onClose={handleCloseModalEdicion}
        onGuardar={handleGuardarEdicion}
        onUsuarioChange={handleUsuarioEdicionChange}
        onTipoEventoChange={handleChangeTipoEventoEdicion}
        onFechaEventoChange={handleFechaEventoEdicionChange}
        onHoraEventoChange={handleHoraEventoEdicionChange}
        onMontoChange={handleMontoEdicionChange}
      />

      <AgregarEventoModal
        show={showModalAgregar}
        gestionId={drawerGestion?.idGestion}
        form={formAgregar}
        usuarioOptions={usuarioOptionsEdicion}
        tipoEventoOptions={tipoEventoOptions}
        requiereFecha={requiereFechaAgregar}
        requiereHora={requiereHoraAgregar}
        requiereMonto={requiereMontoAgregar}
        horasDisponibles={horasDisponiblesAgregar}
        loadingHoras={loadingHoras}
        saving={savingAgregar}
        onClose={handleCloseModalAgregar}
        onGuardar={handleGuardarAgregar}
        onUsuarioChange={handleUsuarioAgregarChange}
        onTipoEventoChange={handleChangeTipoEventoAgregar}
        onFechaEventoChange={handleFechaEventoAgregarChange}
        onHoraEventoChange={handleHoraEventoAgregarChange}
        onMontoChange={handleMontoAgregarChange}
      />

      <ModalTablaClientes
        show={showModalClientes}
        onHide={handleHideModalClientes}
        searchTerm={searchClienteTerm}
        onSearchChange={handleSearchClienteTermChange}
        columns={columnsClientes}
        rows={tableRowsClientes}
        selectedRows={selectedRowsClientes}
        onSelectRow={handleSelectRowCliente}
        onPaginationChange={handlePaginationClientesChange}
        paginationModel={paginationModelClientes}
        onRowClick={handleRowClickCliente}
      />
    </div>
  );
};
