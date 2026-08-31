import React from "react";
import { EtiquetaClienteModal } from "./components/EtiquetaClienteModal";
import { EtiquetasClientesTableCard } from "./components/EtiquetasClientesTableCard";
import { useEtiquetasClientesPage } from "./hooks/useEtiquetasClientesPage";

const EtiquetasClientes: React.FC = () => {
  const {
    etiquetas,
    formData,
    handleCloseModal,
    handleDelete,
    handleInputChange,
    handleOpenModal,
    handleSubmit,
    modalOpen,
    page,
    rowsPerPage,
    saving,
    searchText,
    selectedEtiqueta,
    setPage,
    setRowsPerPage,
    setSearchText,
    updateFormField,
  } = useEtiquetasClientesPage();

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <h1 className="m-0">Etiquetas de Cliente</h1>
      </div>

      <section className="content">
        <div className="container-fluid">
          <EtiquetasClientesTableCard
            etiquetas={etiquetas}
            onDelete={handleDelete}
            onOpenModal={handleOpenModal}
            page={page}
            rowsPerPage={rowsPerPage}
            searchText={searchText}
            setPage={setPage}
            setRowsPerPage={setRowsPerPage}
            setSearchText={setSearchText}
          />
        </div>
      </section>

      <EtiquetaClienteModal
        formData={formData}
        onChange={handleInputChange}
        onClose={handleCloseModal}
        onColorChange={(color) => updateFormField("color", color)}
        onSubmit={() => {
          void handleSubmit();
        }}
        open={modalOpen}
        saving={saving}
        selectedEtiqueta={selectedEtiqueta}
      />
    </div>
  );
};

export default EtiquetasClientes;
