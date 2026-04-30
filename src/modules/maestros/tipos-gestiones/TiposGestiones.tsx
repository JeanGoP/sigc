import { useTiposGestionesPage } from "./hooks/useTiposGestionesPage";
import TipoGestionFormModal from "./ui/TipoGestionFormModal";
import TiposGestionesTableCard from "./ui/TiposGestionesTableCard";

const TiposGestionesPage = () => {
  const {
    tiposGestiones,
    modalAbierto,
    formulario,
    pagina,
    filasPorPagina,
    textoBusqueda,
    tipoSeleccionado,
    tipoContacto,
    guardandoTipoGestion,
    setPagina,
    setFilasPorPagina,
    setTextoBusqueda,
    setTipoContacto,
    abrirModal,
    cerrarModal,
    actualizarCampoFormulario,
    guardarTipoGestion,
    eliminarTipoGestion,
  } = useTiposGestionesPage();

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <h1 className="m-0">Tipos de Contacto</h1>
      </div>

      <section className="content">
        <div className="container-fluid">
          <TiposGestionesTableCard
            tiposGestiones={tiposGestiones}
            textoBusqueda={textoBusqueda}
            filasPorPagina={filasPorPagina}
            pagina={pagina}
            onTextoBusquedaChange={setTextoBusqueda}
            onFilasPorPaginaChange={setFilasPorPagina}
            onPaginaChange={setPagina}
            onNuevoTipoGestion={() => abrirModal()}
            onEditarTipoGestion={abrirModal}
            onEliminarTipoGestion={eliminarTipoGestion}
          />
        </div>
      </section>

      <TipoGestionFormModal
        show={modalAbierto}
        esEdicion={Boolean(tipoSeleccionado)}
        formulario={formulario}
        tipoContacto={tipoContacto}
        guardandoTipoGestion={guardandoTipoGestion}
        onHide={cerrarModal}
        onSubmit={guardarTipoGestion}
        onCampoChange={actualizarCampoFormulario}
        onTipoContactoChange={setTipoContacto}
      />
    </div>
  );
};

export default TiposGestionesPage;
