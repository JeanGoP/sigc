import React from "react";
import { Card, Col, Row } from "react-bootstrap";
import { useDataCreditoPrefijos } from "./hooks/useDataCreditoPrefijos";
import PrefijosOverviewCards from "./ui/PrefijosOverviewCards";
import PrefijosFiltersCard from "./ui/PrefijosFiltersCard";
import PrefijosTableCard from "./ui/PrefijosTableCard";
import PrefijoFormModal from "./ui/PrefijoFormModal";

export const DataCreditoPrefijosPage: React.FC = () => {
  const {
    items,
    totalCount,
    pagina,
    filasPorPagina,
    textoBusqueda,
    filtroEstado,
    estadisticas,
    cuentasDisponibles,
    loading,
    guardando,
    modalAbierto,
    modoEdicion,
    formulario,
    obligacionPreview,
    puedeCrear,
    puedeEditar,
    puedeEliminar,
    setTextoBusqueda,
    setFiltroEstado,
    setPagina,
    setFilasPorPagina,
    actualizarCampoFormulario,
    abrirModalNuevo,
    abrirModalEditar,
    cerrarModal,
    guardar,
    toggleEstado,
    handleEliminar,
    limpiarFiltros,
  } = useDataCreditoPrefijos();

  return (
    <Row className="mt-3">
      <Col xs={12}>
        {/* Tarjeta Superior de Resumen y Métricas KPI */}
        <PrefijosOverviewCards
          puedeCrear={puedeCrear}
          estadisticas={estadisticas}
          onCrearPrefijo={abrirModalNuevo}
        />

        {/* Tarjeta Principal: Filtros y Tabla */}
        <Card className="shadow-sm border-0 mt-3">
          <PrefijosFiltersCard
            textoBusqueda={textoBusqueda}
            filtroEstado={filtroEstado}
            onTextoBusquedaChange={setTextoBusqueda}
            onFiltroEstadoChange={setFiltroEstado}
            onLimpiar={limpiarFiltros}
          />

          <PrefijosTableCard
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
            onEliminar={handleEliminar}
          />
        </Card>
      </Col>

      {/* Modal Crear / Editar Prefijo */}
      <PrefijoFormModal
        abierto={modalAbierto}
        modoEdicion={modoEdicion}
        formulario={formulario}
        cuentasDisponibles={cuentasDisponibles}
        guardando={guardando}
        obligacionPreview={obligacionPreview}
        onCerrar={cerrarModal}
        onSubmit={guardar}
        onCampoChange={actualizarCampoFormulario}
      />
    </Row>
  );
};

export default DataCreditoPrefijosPage;
