import { Card, Col, Row } from "react-bootstrap";
import { useUsuariosPage } from "./hooks/useUsuariosPage";
import CambiarPasswordModal from "./ui/CambiarPasswordModal";
import UsuarioFormModal from "./ui/UsuarioFormModal";
import UsuariosFiltersCard from "./ui/UsuariosFiltersCard";
import UsuariosOverviewCard from "./ui/UsuariosOverviewCard";
import UsuariosTableCard from "./ui/UsuariosTableCard";

const UsuariosPage = () => {
  const {
    puedeCrear,
    puedeEditar,
    puedeCambiarContrasena,
    loading,
    usuarios,
    roles,
    usuarioSeleccionadoId,
    usuarioSeleccionado,
    formularioUsuario,
    guardandoUsuario,
    modalUsuarioAbierto,
    textoBusqueda,
    filtroRol,
    filtroEstado,
    pagina,
    filasPorPagina,
    usuarioParaContrasena,
    nuevaContrasena,
    estadisticas,
    usuariosFiltrados,
    filtroEstadoOptions,
    setTextoBusqueda,
    setFiltroRol,
    setFiltroEstado,
    setPagina,
    setFilasPorPagina,
    setNuevaContrasena,
    abrirModalNuevoUsuario,
    abrirModalEditarUsuario,
    cerrarModalUsuario,
    limpiarFiltros,
    abrirModalCambioContrasena,
    cerrarModalContrasena,
    actualizarCampoFormularioUsuario,
    guardarUsuario,
    cambiarEstado,
    actualizarContrasena,
  } = useUsuariosPage();

  return (
    <Row className="mt-3">
      <Col xs={12}>
        <UsuariosOverviewCard
          puedeCrear={puedeCrear}
          estadisticas={estadisticas}
          onCrearUsuario={abrirModalNuevoUsuario}
        />

        <Card className="shadow-sm border-0 mt-3">
          <UsuariosFiltersCard
            textoBusqueda={textoBusqueda}
            filtroRol={filtroRol}
            filtroEstado={filtroEstado}
            roles={roles}
            filtroEstadoOptions={filtroEstadoOptions}
            onTextoBusquedaChange={setTextoBusqueda}
            onFiltroRolChange={setFiltroRol}
            onFiltroEstadoChange={setFiltroEstado}
            onLimpiar={limpiarFiltros}
          />

          <UsuariosTableCard
            loading={loading}
            usuarios={usuarios}
            usuariosFiltrados={usuariosFiltrados}
            textoBusqueda={textoBusqueda}
            usuarioSeleccionadoId={usuarioSeleccionadoId}
            filasPorPagina={filasPorPagina}
            pagina={pagina}
            puedeEditar={puedeEditar}
            puedeCambiarContrasena={puedeCambiarContrasena}
            onTextoBusquedaChange={setTextoBusqueda}
            onFilasPorPaginaChange={setFilasPorPagina}
            onPaginaChange={setPagina}
            onEditarUsuario={abrirModalEditarUsuario}
            onCambiarEstado={cambiarEstado}
            onAbrirModalCambioContrasena={abrirModalCambioContrasena}
          />
        </Card>
      </Col>

      <UsuarioFormModal
        show={modalUsuarioAbierto}
        guardandoUsuario={guardandoUsuario}
        puedeCrear={puedeCrear}
        puedeEditar={puedeEditar}
        esEdicion={Boolean(usuarioSeleccionado)}
        roles={roles}
        formularioUsuario={formularioUsuario}
        onHide={cerrarModalUsuario}
        onSubmit={guardarUsuario}
        onCampoChange={actualizarCampoFormularioUsuario}
      />

      <CambiarPasswordModal
        usuario={usuarioParaContrasena}
        nuevaContrasena={nuevaContrasena}
        puedeCambiarContrasena={puedeCambiarContrasena}
        onHide={cerrarModalContrasena}
        onSubmit={actualizarContrasena}
        onNuevaContrasenaChange={setNuevaContrasena}
      />
    </Row>
  );
};

export default UsuariosPage;
