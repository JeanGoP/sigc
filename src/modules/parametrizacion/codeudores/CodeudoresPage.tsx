import React from "react";
import { Card, Col, Row } from "react-bootstrap";
import { useCodeudoresPage } from "./hooks/useCodeudoresPage";
import CodeudoresOverviewCard from "./ui/CodeudoresOverviewCard";
import CodeudoresFiltersCard from "./ui/CodeudoresFiltersCard";
import CodeudoresTableCard from "./ui/CodeudoresTableCard";
import CodeudorFormModal from "./ui/CodeudorFormModal";

export const CodeudoresPage: React.FC = () => {
  const {
    puedeCrear,
    puedeEditar,
    puedeEliminar,
    loading,
    items,
    totalCount,
    estadisticas,
    textoBusqueda,
    filtroEstado,
    pagina,
    filasPorPagina,
    modalAbierto,
    codeudorSeleccionado,
    guardando,
    formulario,
    facturaSuggestions,
    buscandoFacturas,
    setTextoBusqueda,
    setFiltroEstado,
    setPagina,
    setFilasPorPagina,
    abrirModalNuevo,
    abrirModalEditar,
    cerrarModal,
    actualizarCampoFormulario,
    buscarObligaciones,
    seleccionarFactura,
    guardarCodeudor,
    toggleEstado,
    eliminar,
    limpiarFiltros,
  } = useCodeudoresPage();

  return (
    <Row className="mt-3">
      <Col xs={12}>
        {/* Tarjeta Superior de Resumen y Métricas KPI */}
        <CodeudoresOverviewCard
          puedeCrear={puedeCrear}
          estadisticas={estadisticas}
          onCrearCodeudor={abrirModalNuevo}
        />

        {/* Tarjeta Principal: Filtros y Tabla */}
        <Card className="shadow-sm border-0 mt-3">
          <CodeudoresFiltersCard
            textoBusqueda={textoBusqueda}
            filtroEstado={filtroEstado}
            onTextoBusquedaChange={setTextoBusqueda}
            onFiltroEstadoChange={setFiltroEstado}
            onLimpiar={limpiarFiltros}
          />

          <CodeudoresTableCard
            loading={loading}
            items={items}
            totalCount={totalCount}
            pagina={pagina}
            filasPorPagina={filasPorPagina}
            puedeEditar={puedeEditar}
            puedeEliminar={puedeEliminar}
            onPaginaChange={setPagina}
            onFilasPorPaginaChange={setFilasPorPagina}
            onEditar={abrirModalEditar}
            onToggleEstado={toggleEstado}
            onEliminar={eliminar}
          />
        </Card>
      </Col>

      {/* Modal Crear / Editar Codeudor */}
      <CodeudorFormModal
        show={modalAbierto}
        guardando={guardando}
        esEdicion={Boolean(codeudorSeleccionado)}
        formulario={formulario}
        facturaSuggestions={facturaSuggestions}
        buscandoFacturas={buscandoFacturas}
        onHide={cerrarModal}
        onSubmit={guardarCodeudor}
        onCampoChange={actualizarCampoFormulario}
        onBuscarObligacion={buscarObligaciones}
        onSeleccionarFactura={seleccionarFactura}
      />
    </Row>
  );
};

export default CodeudoresPage;
