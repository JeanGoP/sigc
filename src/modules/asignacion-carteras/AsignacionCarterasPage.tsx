import React from "react";
import { AsignacionCarterasFiltersCard } from "./components/AsignacionCarterasFiltersCard";
import { AsignacionesActualesTable } from "./components/AsignacionesActualesTable";
import { AsignacionesHistorialCard } from "./components/AsignacionesHistorialCard";
import { NuevaAsignacionModal } from "./components/NuevaAsignacionModal";
import { ReasignacionMasivaModal } from "./components/ReasignacionMasivaModal";
import { ReasignarCarteraModal } from "./components/ReasignarCarteraModal";
import { useAsignacionCarterasPage } from "./hooks/useAsignacionCarterasPage";

const AsignacionCarterasPage: React.FC = () => {
  const {
    allSelected,
    asesores,
    asignaciones,
    cargandoInicial,
    clearFiltros,
    closeMasivoModal,
    closeNuevaModal,
    closeReasignarModal,
    consultarAsignacionesEHistorial,
    filaReasignar,
    filasSeleccionadas,
    filters,
    guardando,
    guardandoMasivo,
    guardandoReasignacion,
    handleGuardarAsignacion,
    handleReasignarFila,
    handleReasignarMasivo,
    handleToggleAll,
    handleToggleNuevoTramo,
    handleToggleRow,
    historial,
    loading,
    modalMasivoOpen,
    modalNuevaOpen,
    nuevaAsignacion,
    openMasivoModal,
    openNuevaModal,
    openReasignarModal,
    puedeAsignar,
    puedeReasignar,
    reasignacion,
    reasignacionMasiva,
    selectedKeys,
    selectedSet,
    updateFilter,
    updateNuevaAsignacion,
    updateReasignacion,
    updateReasignacionMasiva,
  } = useAsignacionCarterasPage();

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">Asignacion de Carteras</h1>
            </div>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <AsignacionCarterasFiltersCard
            asesores={asesores}
            asignacionesCount={asignaciones.length}
            filters={filters}
            onApplyFilters={() => {
              void consultarAsignacionesEHistorial();
            }}
            onChangeFilter={updateFilter}
            onClearFilters={clearFiltros}
            onOpenMasivoModal={openMasivoModal}
            onOpenNuevaModal={openNuevaModal}
            puedeAsignar={puedeAsignar}
            puedeReasignar={puedeReasignar}
            selectedCount={selectedKeys.length}
          />

          <AsignacionesActualesTable
            allSelected={allSelected}
            asignaciones={asignaciones}
            cargandoInicial={cargandoInicial}
            puedeReasignar={puedeReasignar}
            selectedSet={selectedSet}
            onOpenReasignarModal={openReasignarModal}
            onToggleAll={handleToggleAll}
            onToggleRow={handleToggleRow}
          />

          <AsignacionesHistorialCard
            cargandoInicial={cargandoInicial}
            filters={filters}
            historial={historial}
            onChangeFilter={updateFilter}
            onRefresh={() => {
              void consultarAsignacionesEHistorial();
            }}
          />
        </div>
      </section>

      <NuevaAsignacionModal
        asesores={asesores}
        form={nuevaAsignacion}
        guardando={guardando}
        open={modalNuevaOpen}
        puedeAsignar={puedeAsignar}
        onClose={closeNuevaModal}
        onGuardar={() => {
          void handleGuardarAsignacion();
        }}
        onToggleTramo={handleToggleNuevoTramo}
        onUpdateForm={updateNuevaAsignacion}
      />

      <ReasignarCarteraModal
        asesores={asesores}
        fila={filaReasignar}
        form={reasignacion}
        guardando={guardandoReasignacion}
        puedeReasignar={puedeReasignar}
        onClose={closeReasignarModal}
        onGuardar={() => {
          void handleReasignarFila();
        }}
        onUpdateForm={updateReasignacion}
      />

      <ReasignacionMasivaModal
        asesores={asesores}
        form={reasignacionMasiva}
        guardando={guardandoMasivo}
        open={modalMasivoOpen}
        puedeReasignar={puedeReasignar}
        selectedCount={filasSeleccionadas.length}
        onClose={closeMasivoModal}
        onGuardar={() => {
          void handleReasignarMasivo();
        }}
        onUpdateForm={updateReasignacionMasiva}
      />

      {loading && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 9999,
            background: "rgba(33, 37, 41, 0.9)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          Procesando...
        </div>
      )}
    </div>
  );
};

export default AsignacionCarterasPage;
