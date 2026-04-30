import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { toast } from "react-toastify";
import { useAppSelector } from "@app/store/store";
import { useEliminarTipoContacto } from "@app/services/Maestros/TiposContactos/EliminarTipoContacto";
import { useGuardarTipoContacto } from "@app/services/Maestros/TiposContactos/GuardarTipoContacto";
import { useListarTiposContacto } from "@app/services/Maestros/TiposContactos/ListarTipoContactos";
import {
  TIPO_CONTACTO_DEFAULT,
  TIPO_GESTION_FORMULARIO_INICIAL,
} from "../domain/constants";
import {
  buildGuardarTipoGestionPayload,
  buildTipoGestionFormData,
} from "../domain/helpers";
import type {
  TipoContactoValue,
  TipoGestion,
  TipoGestionFormState,
} from "../domain/types";

interface CargarTiposGestionesParams {
  nombre: string;
  page: number;
  pageSize: number;
}

export function useTiposGestionesPage() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [tiposGestiones, setTiposGestiones] = useState<TipoGestion[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [formulario, setFormulario] = useState<TipoGestionFormState>(
    TIPO_GESTION_FORMULARIO_INICIAL
  );
  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoGestion | null>(null);
  const [tipoContacto, setTipoContacto] =
    useState<TipoContactoValue>(TIPO_CONTACTO_DEFAULT);

  const { listarTiposContacto, loading: cargandoListado } = useListarTiposContacto();
  const { guardarTipoContacto, loading: guardandoTipoGestion } =
    useGuardarTipoContacto();
  const { eliminarTipoContacto, loading: eliminandoTipoGestion } =
    useEliminarTipoContacto();

  const cargarTiposGestiones = useCallback(
    async ({ nombre, page, pageSize }: CargarTiposGestionesParams) => {
      const result = await listarTiposContacto({
        nombre,
        page,
        pageSize,
      });

      if (result?.success) {
        setTiposGestiones(result.data ?? []);
        return;
      }

      toast.error(result?.message || "Error al cargar los tipos de contacto");
    },
    [listarTiposContacto]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void cargarTiposGestiones({
        nombre: textoBusqueda,
        page: pagina + 1,
        pageSize: filasPorPagina,
      });
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [cargarTiposGestiones, textoBusqueda]);

  useEffect(() => {
    void cargarTiposGestiones({
      nombre: textoBusqueda,
      page: pagina + 1,
      pageSize: filasPorPagina,
    });
  }, [cargarTiposGestiones, filasPorPagina, pagina]);

  const abrirModal = useCallback((tipoGestion?: TipoGestion) => {
    setTipoSeleccionado(tipoGestion ?? null);
    setFormulario(buildTipoGestionFormData(tipoGestion));
    setModalAbierto(true);
  }, []);

  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    setTipoSeleccionado(null);
  }, []);

  const actualizarCampoFormulario = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = event.target as HTMLInputElement;
      const { name, value, type } = target;

      setFormulario((previous) => ({
        ...previous,
        [name]: type === "checkbox" ? target.checked : value,
      }));
    },
    []
  );

  const guardarTipoGestion = useCallback(async () => {
    const payload = buildGuardarTipoGestionPayload({
      tipoSeleccionado,
      formulario,
      tipoContacto,
      idUser: Number(currentUser?.id) || 0,
    });

    const result = await guardarTipoContacto(payload);

    if (result?.success) {
      toast.success("Guardado exitosamente");
      await cargarTiposGestiones({
        nombre: textoBusqueda,
        page: pagina + 1,
        pageSize: filasPorPagina,
      });
      cerrarModal();
      return;
    }

    toast.error(result?.message || "Error al guardar el tipo de contacto");
  }, [
    cargarTiposGestiones,
    cerrarModal,
    filasPorPagina,
    formulario,
    guardarTipoContacto,
    currentUser?.id,
    pagina,
    textoBusqueda,
    tipoContacto,
    tipoSeleccionado,
  ]);

  const eliminarTipoGestion = useCallback(
    async (id: number) => {
      if (!window.confirm("Eliminar este tipo de contacto?")) {
        return;
      }

      const result = await eliminarTipoContacto(id);

      if (result?.success) {
        toast.success("Eliminado correctamente");
        await cargarTiposGestiones({
          nombre: textoBusqueda,
          page: pagina + 1,
          pageSize: filasPorPagina,
        });
        return;
      }

      toast.error(result?.message || "Error al eliminar el tipo de contacto");
    },
    [cargarTiposGestiones, eliminarTipoContacto, filasPorPagina, pagina, textoBusqueda]
  );

  return {
    tiposGestiones,
    modalAbierto,
    formulario,
    pagina,
    filasPorPagina,
    textoBusqueda,
    tipoSeleccionado,
    tipoContacto,
    cargandoListado,
    guardandoTipoGestion,
    eliminandoTipoGestion,
    setPagina,
    setFilasPorPagina,
    setTextoBusqueda,
    setTipoContacto,
    abrirModal,
    cerrarModal,
    actualizarCampoFormulario,
    guardarTipoGestion,
    eliminarTipoGestion,
  };
}
