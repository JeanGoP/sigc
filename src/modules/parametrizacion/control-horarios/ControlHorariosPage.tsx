import React from "react";
import { Col, Nav, Row, Spinner } from "react-bootstrap";
import { useControlHorariosPage } from "./hooks/useControlHorariosPage";
import { HorariosOverviewCard } from "./ui/HorariosOverviewCard";
import { HorariosSemanaCard } from "./ui/HorariosSemanaCard";
import { FestivosCard } from "./ui/FestivosCard";
import { PermisosExcepcionCard } from "./ui/PermisosExcepcionCard";
import { AsignarPermisoModal } from "./ui/AsignarPermisoModal";
import { RevocarPermisoModal } from "./ui/RevocarPermisoModal";
import { AuditoriaHorariosCard } from "./ui/AuditoriaHorariosCard";

export const ControlHorariosPage: React.FC = () => {
  const {
    canEditHorario,
    canAssignPermiso,
    canRevokePermiso,

    activeTab,
    setActiveTab,
    loading,

    generalConfig,
    isSavingGeneral,
    handleGuardarConfigGeneral,

    horariosSemana,
    isSavingSemana,
    handleUpdateDiaHorario,
    handleGuardarHorariosSemana,

    festivos,
    modalFestivoAbierto,
    setModalFestivoAbierto,
    festivoFecha,
    setFestivoFecha,
    festivoDescripcion,
    setFestivoDescripcion,
    festivoEsLaboral,
    setFestivoEsLaboral,
    isSubmittingFestivo,
    handleGuardarFestivo,
    handleEliminarFestivo,

    permisosFiltrados,
    filtroSoloActivos,
    setFiltroSoloActivos,
    filtroFechaPermiso,
    setFiltroFechaPermiso,
    busquedaPermiso,
    setBusquedaPermiso,

    modalAsignarAbierto,
    setModalAsignarAbierto,
    usuariosModalFiltrados,
    selectedUserIds,
    fechaAsignacion,
    setFechaAsignacion,
    horaInicioAsignacion,
    setHoraInicioAsignacion,
    horaFinAsignacion,
    setHoraFinAsignacion,
    motivoAsignacion,
    setMotivoAsignacion,
    busquedaUsuarioModal,
    setBusquedaUsuarioModal,
    isAssigningPermisos,
    handleToggleUserSelection,
    handleSelectAllUsers,
    handleAbrirModalAsignar,
    handleGuardarPermisosMasivo,

    permisoParaRevocar,
    setPermisoParaRevocar,
    motivoRevocacion,
    setMotivoRevocacion,
    isRevokingPermiso,
    handleAbrirModalRevocar,
    handleConfirmarRevocacion,

    auditoriaLogs,
    cargarDatos,
  } = useControlHorariosPage();

  const diasLaboralesCount = React.useMemo(
    () => horariosSemana.filter((d) => d.esLaboral).length,
    [horariosSemana]
  );

  const permisosActivosHoyCount = React.useMemo(() => {
    const hoyStr = new Date().toISOString().split("T")[0];
    return permisosFiltrados.filter((p) => p.isActive && p.fecha === hoyStr).length;
  }, [permisosFiltrados]);

  if (loading && horariosSemana.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <Spinner animation="border" variant="primary" className="mr-2" />
        <span className="text-muted">Cargando control de horarios...</span>
      </div>
    );
  }

  return (
    <div className="p-3">
      {/* Tarjeta Superior: Estado General y Resumen del Tenant */}
      <HorariosOverviewCard
        config={generalConfig}
        canEdit={canEditHorario}
        isSaving={isSavingGeneral}
        diasLaboralesCount={diasLaboralesCount}
        festivosCount={festivos.length}
        permisosActivosCount={permisosActivosHoyCount}
        onSaveGeneral={handleGuardarConfigGeneral}
      />

      {/* Pestañas de Navegación */}
      <Nav variant="tabs" className="mb-3 font-weight-600" style={{ borderBottomWidth: "2px" }}>
        <Nav.Item>
          <Nav.Link
            active={activeTab === "horarios"}
            onClick={() => setActiveTab("horarios")}
            style={{ cursor: "pointer" }}
          >
            <i className="far fa-calendar-alt mr-2" />
            Jornada Semanal y Festivos
          </Nav.Link>
        </Nav.Item>

        <Nav.Item>
          <Nav.Link
            active={activeTab === "permisos"}
            onClick={() => setActiveTab("permisos")}
            style={{ cursor: "pointer" }}
          >
            <i className="fas fa-user-clock mr-2 text-success" />
            Permisos de Acceso y Horas Extras
            {permisosFiltrados.filter((p) => p.isActive).length > 0 && (
              <span className="badge badge-success ml-2">
                {permisosFiltrados.filter((p) => p.isActive).length}
              </span>
            )}
          </Nav.Link>
        </Nav.Item>

        <Nav.Item>
          <Nav.Link
            active={activeTab === "auditoria"}
            onClick={() => setActiveTab("auditoria")}
            style={{ cursor: "pointer" }}
          >
            <i className="fas fa-history mr-2 text-info" />
            Registro de Auditoría
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Contenido de la Pestaña Activa */}
      {activeTab === "horarios" && (
        <Row>
          <Col lg={7} md={12}>
            <HorariosSemanaCard
              horariosSemana={horariosSemana}
              canEdit={canEditHorario}
              isSaving={isSavingSemana}
              onUpdateDia={handleUpdateDiaHorario}
              onSaveSemana={handleGuardarHorariosSemana}
            />
          </Col>
          <Col lg={5} md={12}>
            <FestivosCard
              festivos={festivos}
              canEdit={canEditHorario}
              modalAbierto={modalFestivoAbierto}
              setModalAbierto={setModalFestivoAbierto}
              fecha={festivoFecha}
              setFecha={setFestivoFecha}
              descripcion={festivoDescripcion}
              setDescripcion={setFestivoDescripcion}
              esLaboral={festivoEsLaboral}
              setEsLaboral={setFestivoEsLaboral}
              isSubmitting={isSubmittingFestivo}
              onGuardarFestivo={handleGuardarFestivo}
              onEliminarFestivo={handleEliminarFestivo}
              onRecargar={() => cargarDatos(true)}
            />
          </Col>
        </Row>
      )}

      {activeTab === "permisos" && (
        <PermisosExcepcionCard
          permisos={permisosFiltrados}
          canAssign={canAssignPermiso}
          canRevoke={canRevokePermiso}
          filtroSoloActivos={filtroSoloActivos}
          setFiltroSoloActivos={setFiltroSoloActivos}
          filtroFecha={filtroFechaPermiso}
          setFiltroFecha={setFiltroFechaPermiso}
          busqueda={busquedaPermiso}
          setBusqueda={setBusquedaPermiso}
          onAbrirModalAsignar={handleAbrirModalAsignar}
          onAbrirModalRevocar={handleAbrirModalRevocar}
        />
      )}

      {activeTab === "auditoria" && (
        <AuditoriaHorariosCard logs={auditoriaLogs} onRecargar={cargarDatos} />
      )}

      {/* Modal de Asignación Masiva */}
      <AsignarPermisoModal
        show={modalAsignarAbierto}
        onHide={() => setModalAsignarAbierto(false)}
        usuarios={usuariosModalFiltrados}
        selectedUserIds={selectedUserIds}
        fecha={fechaAsignacion}
        setFecha={setFechaAsignacion}
        horaInicio={horaInicioAsignacion}
        setHoraInicio={setHoraInicioAsignacion}
        horaFin={horaFinAsignacion}
        setHoraFin={setHoraFinAsignacion}
        motivo={motivoAsignacion}
        setMotivo={setMotivoAsignacion}
        busquedaUsuario={busquedaUsuarioModal}
        setBusquedaUsuario={setBusquedaUsuarioModal}
        isSubmitting={isAssigningPermisos}
        onToggleUser={handleToggleUserSelection}
        onSelectAll={handleSelectAllUsers}
        onSubmit={handleGuardarPermisosMasivo}
      />

      {/* Modal de Revocación */}
      <RevocarPermisoModal
        permiso={permisoParaRevocar}
        onHide={() => setPermisoParaRevocar(null)}
        motivoRevocacion={motivoRevocacion}
        setMotivoRevocacion={setMotivoRevocacion}
        isRevoking={isRevokingPermiso}
        onConfirmar={handleConfirmarRevocacion}
      />
    </div>
  );
};

export default ControlHorariosPage;
