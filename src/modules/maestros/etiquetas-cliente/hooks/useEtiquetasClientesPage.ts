import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAppSelector } from "@app/store/store";
import {
  useEliminarEtiquetaCliente,
  useGuardarEtiquetaCliente,
  useListarEtiquetasClientes,
} from "@app/services/Maestros/EtiquetasClientes/EtiquetasClienteService";
import {
  buildDefaultEtiquetaClienteForm,
  buildEtiquetaClienteForm,
  buildGuardarEtiquetaClientePayload,
  getEtiquetaClienteSuccessMessage,
} from "../domain/helpers";
import type {
  EtiquetaCliente,
  EtiquetaClienteFormState,
} from "../domain/types";

export function useEtiquetasClientesPage() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [etiquetas, setEtiquetas] = useState<EtiquetaCliente[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<EtiquetaClienteFormState>(
    buildDefaultEtiquetaClienteForm(),
  );
  const [selectedEtiqueta, setSelectedEtiqueta] =
    useState<EtiquetaCliente | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchText, setSearchText] = useState("");

  const { listarEtiquetasClientes } = useListarEtiquetasClientes();
  const { guardarEtiquetaCliente, loading: saving } =
    useGuardarEtiquetaCliente();
  const { eliminarEtiquetaCliente } = useEliminarEtiquetaCliente();

  const fetchEtiquetas = useCallback(
    async (filter: string = "") => {
      const result = await listarEtiquetasClientes(filter);
      if (result?.success) {
        setEtiquetas(result.data);
        return;
      }

      toast.error(result?.message || "Error al cargar las etiquetas");
    },
    [listarEtiquetasClientes],
  );

  useEffect(() => {
    void fetchEtiquetas(searchText);
  }, [fetchEtiquetas, searchText]);

  const handleOpenModal = useCallback((etiqueta?: EtiquetaCliente) => {
    setSelectedEtiqueta(etiqueta ?? null);
    setFormData(buildEtiquetaClienteForm(etiqueta));
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedEtiqueta(null);
  }, []);

  const updateFormField = useCallback(
    (field: keyof EtiquetaClienteFormState, value: string | boolean) => {
      setFormData((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = event.target;
      updateFormField(
        name as keyof EtiquetaClienteFormState,
        type === "checkbox" ? checked : value,
      );
    },
    [updateFormField],
  );

  const handleSubmit = useCallback(async () => {
    if (!currentUser?.id) {
      toast.error("Usuario no valido");
      return;
    }

    const payload = buildGuardarEtiquetaClientePayload(
      Number(currentUser.id),
      formData,
      selectedEtiqueta,
    );

    const result = await guardarEtiquetaCliente(payload);
    if (result?.success) {
      toast.success(getEtiquetaClienteSuccessMessage(selectedEtiqueta));
      await fetchEtiquetas(searchText);
      handleCloseModal();
      return;
    }

    toast.error(result?.message || "Error al guardar la etiqueta");
  }, [
    currentUser?.id,
    fetchEtiquetas,
    formData,
    guardarEtiquetaCliente,
    handleCloseModal,
    searchText,
    selectedEtiqueta,
  ]);

  const handleDelete = useCallback(
    async (id: number) => {
      if (!window.confirm("Esta seguro de eliminar esta etiqueta?")) {
        return;
      }

      const result = await eliminarEtiquetaCliente(id);
      if (result?.success) {
        await fetchEtiquetas(searchText);
        return;
      }

      toast.error(result?.message || "Error al eliminar");
    },
    [eliminarEtiquetaCliente, fetchEtiquetas, searchText],
  );

  return {
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
  };
}
