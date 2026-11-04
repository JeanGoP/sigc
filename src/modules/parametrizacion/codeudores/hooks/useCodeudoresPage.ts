import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAppSelector } from "@app/store/store";
import { can } from "@app/utils/security";
import { useCodeudoresService } from "@app/services/Parametrizacion/codeudoresService";
import type {
  CodeudorItem,
  CodeudorCreatePayload,
  CodeudorUpdatePayload,
  CodeudorEstadisticas,
  FacturaLookupItem,
} from "@app/services/Parametrizacion/codeudoresTypes";

export type FiltroEstadoCodeudor = "todos" | "activos" | "inactivos";

export interface FormularioCodeudorState {
  numefac: string;
  cliente: string;
  nombreTitular: string;
  cuenta: string;
  tipoIdentificacion: string;
  identificacion: string;
  nombre: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  email: string;
  tipoRelacion: string;
  activo: boolean;
  observacion: string;
}

export const FORMULARIO_INICIAL: FormularioCodeudorState = {
  numefac: "",
  cliente: "",
  nombreTitular: "",
  cuenta: "",
  tipoIdentificacion: "CC",
  identificacion: "",
  nombre: "",
  telefono: "",
  direccion: "",
  ciudad: "",
  email: "",
  tipoRelacion: "CODEUDOR",
  activo: true,
  observacion: "",
};

export function useCodeudoresPage() {
  const permisos = useAppSelector((state) => state.security.permissions);
  const userRole = useAppSelector((state) => state.auth.currentUser?.role);
  const isAdmin = userRole === "Administrador" || userRole === "Admin";

  const puedeCrear = isAdmin || can(permisos, "codeudores.create") || can(permisos, "parametrizacion.create");
  const puedeEditar = isAdmin || can(permisos, "codeudores.edit") || can(permisos, "parametrizacion.edit");
  const puedeEliminar = isAdmin || can(permisos, "codeudores.delete") || can(permisos, "parametrizacion.delete");

  const {
    loading,
    listarCodeudores,
    obtenerEstadisticas,
    buscarFacturas,
    crearCodeudor,
    actualizarCodeudor,
    cambiarEstado,
    eliminarCodeudor,
  } = useCodeudoresService();

  // Estados de listado
  const [items, setItems] = useState<CodeudorItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [estadisticas, setEstadisticas] = useState<CodeudorEstadisticas>({
    total: 0,
    activos: 0,
    inactivos: 0,
  });

  // Filtros y paginación
  const [textoBusqueda, setTextoBusqueda] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoCodeudor>("todos");
  const [pagina, setPagina] = useState<number>(0); // 0-indexed para MUI TablePagination
  const [filasPorPagina, setFilasPorPagina] = useState<number>(20);

  // Modal
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [codeudorSeleccionado, setCodeudorSeleccionado] = useState<CodeudorItem | null>(null);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [formulario, setFormulario] = useState<FormularioCodeudorState>(FORMULARIO_INICIAL);

  // Autocompletado de facturas
  const [facturaSuggestions, setFacturaSuggestions] = useState<FacturaLookupItem[]>([]);
  const [buscandoFacturas, setBuscandoFacturas] = useState<boolean>(false);

  // Cargar estadísticas
  const cargarEstadisticas = useCallback(async () => {
    try {
      const res = await obtenerEstadisticas();
      if (res && res.data) {
        setEstadisticas(res.data);
      }
    } catch {
      // Silencioso
    }
  }, [obtenerEstadisticas]);

  // Cargar listado
  const cargarCodeudores = useCallback(async () => {
    try {
      let activoParam: boolean | undefined = undefined;
      if (filtroEstado === "activos") activoParam = true;
      if (filtroEstado === "inactivos") activoParam = false;

      const res = await listarCodeudores({
        search: textoBusqueda,
        activo: activoParam,
        page: pagina + 1, // API es 1-indexed
        pageSize: filasPorPagina,
      });

      if (res && res.data) {
        setItems(res.data.items || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err: any) {
      toast.error(err?.message || "Error al cargar la lista de codeudores.");
    }
  }, [filasPorPagina, filtroEstado, listarCodeudores, pagina, textoBusqueda]);

  useEffect(() => {
    void cargarEstadisticas();
  }, [cargarEstadisticas]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void cargarCodeudores();
    }, 250);
    return () => clearTimeout(timer);
  }, [cargarCodeudores]);

  // Autocompletado de obligaciones
  const buscarObligaciones = useCallback(
    async (query: string) => {
      if (!query || query.trim().length < 2) {
        setFacturaSuggestions([]);
        return;
      }
      setBuscandoFacturas(true);
      try {
        const res = await buscarFacturas(query.trim());
        if (res && res.data) {
          setFacturaSuggestions(res.data);
        }
      } catch {
        setFacturaSuggestions([]);
      } finally {
        setBuscandoFacturas(false);
      }
    },
    [buscarFacturas]
  );

  const seleccionarFactura = useCallback((fac: FacturaLookupItem) => {
    setFormulario((prev) => ({
      ...prev,
      numefac: fac.numefac,
      cliente: fac.cliente,
      nombreTitular: fac.nombreTitular,
      cuenta: fac.cuenta || "",
    }));
    setFacturaSuggestions([]);
  }, []);

  const actualizarCampoFormulario = useCallback(
    (campo: keyof FormularioCodeudorState, valor: any) => {
      setFormulario((prev) => ({ ...prev, [campo]: valor }));
    },
    []
  );

  const abrirModalNuevo = useCallback(() => {
    setCodeudorSeleccionado(null);
    setFormulario(FORMULARIO_INICIAL);
    setFacturaSuggestions([]);
    setModalAbierto(true);
  }, []);

  const abrirModalEditar = useCallback((item: CodeudorItem) => {
    setCodeudorSeleccionado(item);
    setFormulario({
      numefac: item.numefac,
      cliente: item.cliente || "",
      nombreTitular: item.nombreTitular || "",
      cuenta: item.cuenta || "",
      tipoIdentificacion: item.tipoIdentificacion || "CC",
      identificacion: item.identificacion || "",
      nombre: item.nombre || "",
      telefono: item.telefono || "",
      direccion: item.direccion || "",
      ciudad: item.ciudad || "",
      email: item.email || "",
      tipoRelacion: item.tipoRelacion || "CODEUDOR",
      activo: item.activo,
      observacion: item.observacion || "",
    });
    setFacturaSuggestions([]);
    setModalAbierto(true);
  }, []);

  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    setCodeudorSeleccionado(null);
    setFormulario(FORMULARIO_INICIAL);
    setFacturaSuggestions([]);
  }, []);

  const guardarCodeudor = useCallback(async () => {
    if (!formulario.numefac.trim()) {
      toast.warning("Debe especificar el número de factura u obligación.");
      return;
    }
    if (!formulario.identificacion.trim()) {
      toast.warning("El documento de identificación del codeudor es obligatorio.");
      return;
    }
    if (!formulario.nombre.trim()) {
      toast.warning("El nombre completo del codeudor es obligatorio.");
      return;
    }

    setGuardando(true);
    try {
      if (codeudorSeleccionado) {
        const updatePayload: CodeudorUpdatePayload = {
          tipoIdentificacion: formulario.tipoIdentificacion,
          identificacion: formulario.identificacion.trim(),
          nombre: formulario.nombre.trim(),
          telefono: formulario.telefono.trim() || null,
          direccion: formulario.direccion.trim() || null,
          ciudad: formulario.ciudad.trim() || null,
          email: formulario.email.trim() || null,
          tipoRelacion: formulario.tipoRelacion || "CODEUDOR",
          activo: formulario.activo,
          observacion: formulario.observacion.trim() || null,
        };
        await actualizarCodeudor(codeudorSeleccionado.id, updatePayload);
        toast.success("Codeudor actualizado exitosamente.");
      } else {
        const createPayload: CodeudorCreatePayload = {
          numefac: formulario.numefac.trim(),
          cliente: formulario.cliente.trim() || null,
          cuenta: formulario.cuenta.trim() || null,
          tipoIdentificacion: formulario.tipoIdentificacion,
          identificacion: formulario.identificacion.trim(),
          nombre: formulario.nombre.trim(),
          telefono: formulario.telefono.trim() || null,
          direccion: formulario.direccion.trim() || null,
          ciudad: formulario.ciudad.trim() || null,
          email: formulario.email.trim() || null,
          tipoRelacion: formulario.tipoRelacion || "CODEUDOR",
          observacion: formulario.observacion.trim() || null,
        };
        await crearCodeudor(createPayload);
        toast.success("Codeudor registrado exitosamente.");
      }
      cerrarModal();
      void cargarCodeudores();
      void cargarEstadisticas();
    } catch (err: any) {
      toast.error(err?.message || "Ocurrió un error al guardar el codeudor.");
    } finally {
      setGuardando(false);
    }
  }, [
    actualizarCodeudor,
    cargarCodeudores,
    cargarEstadisticas,
    cerrarModal,
    codeudorSeleccionado,
    crearCodeudor,
    formulario,
  ]);

  const toggleEstado = useCallback(
    async (item: CodeudorItem) => {
      try {
        const nuevoEstado = !item.activo;
        await cambiarEstado(item.id, nuevoEstado);
        toast.success(
          `Codeudor ${nuevoEstado ? "activado" : "inactivado"} exitosamente.`
        );
        void cargarCodeudores();
        void cargarEstadisticas();
      } catch (err: any) {
        toast.error(err?.message || "Error al cambiar el estado del codeudor.");
      }
    },
    [cambiarEstado, cargarCodeudores, cargarEstadisticas]
  );

  const eliminar = useCallback(
    async (item: CodeudorItem) => {
      if (
        !window.confirm(
          `¿Está seguro de eliminar al codeudor "${item.nombre}" (${item.identificacion}) de la obligación ${item.numefac}?`
        )
      ) {
        return;
      }
      try {
        await eliminarCodeudor(item.id);
        toast.success("Codeudor eliminado exitosamente.");
        void cargarCodeudores();
        void cargarEstadisticas();
      } catch (err: any) {
        toast.error(err?.message || "Error al eliminar el codeudor.");
      }
    },
    [cargarCodeudores, cargarEstadisticas, eliminarCodeudor]
  );

  const limpiarFiltros = useCallback(() => {
    setTextoBusqueda("");
    setFiltroEstado("todos");
    setPagina(0);
  }, []);

  return {
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
    refrescar: cargarCodeudores,
  };
}
