import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { useAppSelector } from "@app/store/store";
import { can } from "@app/utils/security";
import { useDataCreditoPrefijosService } from "@app/services/Maestros/DataCreditoPrefijosService";
import type {
  DataCreditoPrefijoItem,
  DataCreditoEstadisticas,
  CuentaCarteraDisponible,
  SaveDataCreditoPrefijoPayload,
} from "@app/services/Maestros/dataCreditoPrefijosTypes";

export type FiltroEstadoPrefijo = "todos" | "activos" | "inactivos";

export interface FormularioPrefijoState {
  cuenta: string;
  descripcionCuenta: string;
  prefijo: string;
  separador: string;
  manejoNumero: "ULTIMOS_4" | "QUITAR_CEROS" | "MANTENER" | "PAD_LEFT";
  longitudPadding: number;
  sufijo: string;
  ejemploFactura: string;
  activo: boolean;
}

export const FORMULARIO_PREFIJO_INICIAL: FormularioPrefijoState = {
  cuenta: "",
  descripcionCuenta: "",
  prefijo: "",
  separador: "",
  manejoNumero: "ULTIMOS_4",
  longitudPadding: 4,
  sufijo: "",
  ejemploFactura: "0005004314",
  activo: true,
};

export function formatearPreviewObligacion(form: FormularioPrefijoState): string {
  const pref = (form.prefijo || "").trim().toUpperCase();
  const sep = form.separador || "";
  const suf = (form.sufijo || "").trim().toUpperCase();
  const fac = (form.ejemploFactura || "0005004314").trim();

  let numParte = fac;
  switch (form.manejoNumero) {
    case "MANTENER":
      numParte = fac;
      break;
    case "QUITAR_CEROS":
      numParte = /^\d+$/.test(fac) ? String(BigInt(fac)) : fac;
      break;
    case "PAD_LEFT":
      if (/^\d+$/.test(fac)) {
        const pad = form.longitudPadding > 0 ? form.longitudPadding : 4;
        numParte = String(BigInt(fac)).padStart(pad, "0");
      }
      break;
    case "ULTIMOS_4":
    default:
      if (fac.length >= 4) {
        numParte = fac.slice(-4);
      } else if (/^\d+$/.test(fac)) {
        numParte = fac.padStart(4, "0");
      }
      break;
  }

  return `${pref}${sep}${numParte}${suf}`;
}

export function useDataCreditoPrefijos() {
  const permisos = useAppSelector((state) => state.security.permissions);
  const userRole = useAppSelector((state) => state.auth.currentUser?.role);
  const isAdmin = userRole === "Administrador" || userRole === "Admin";

  const puedeCrear = isAdmin || can(permisos, "datacredito_prefijos.create") || can(permisos, "maestros.create");
  const puedeEditar = isAdmin || can(permisos, "datacredito_prefijos.edit") || can(permisos, "maestros.edit");
  const puedeEliminar = isAdmin || can(permisos, "datacredito_prefijos.delete") || can(permisos, "maestros.delete");

  const {
    loading,
    listar,
    obtenerEstadisticas,
    listarCuentasDisponibles,
    crear,
    actualizar,
    cambiarEstado,
    eliminar,
  } = useDataCreditoPrefijosService();

  const [items, setItems] = useState<DataCreditoPrefijoItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pagina, setPagina] = useState(0); // 0-indexed para TablePagination de MUI
  const [filasPorPagina, setFilasPorPagina] = useState(15);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoPrefijo>("todos");

  const [estadisticas, setEstadisticas] = useState<DataCreditoEstadisticas>({
    total: 0,
    activos: 0,
    inactivos: 0,
  });

  const [cuentasDisponibles, setCuentasDisponibles] = useState<CuentaCarteraDisponible[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [itemSeleccionadoId, setItemSeleccionadoId] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<FormularioPrefijoState>(FORMULARIO_PREFIJO_INICIAL);
  const [guardando, setGuardando] = useState(false);

  // Cargar estadísticas
  const recargarEstadisticas = useCallback(async () => {
    try {
      const res = await obtenerEstadisticas();
      if (res && res.data) {
        setEstadisticas(res.data);
      }
    } catch {
      // Silencioso
    }
  }, [obtenerEstadisticas]);

  // Cargar cuentas disponibles
  const recargarCuentasDisponibles = useCallback(async () => {
    try {
      const res = await listarCuentasDisponibles();
      if (res && res.data) {
        setCuentasDisponibles(res.data);
      }
    } catch {
      // Silencioso
    }
  }, [listarCuentasDisponibles]);

  // Cargar lista con filtros y paginación
  const recargarLista = useCallback(async () => {
    try {
      const activoParam =
        filtroEstado === "activos"
          ? true
          : filtroEstado === "inactivos"
          ? false
          : undefined;

      const res = await listar({
        search: textoBusqueda.trim() || undefined,
        activo: activoParam,
        page: pagina + 1,
        pageSize: filasPorPagina,
      });

      if (res && res.data) {
        setItems(res.data.items || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err: any) {
      toast.error(err?.message || "Error al cargar la lista de prefijos");
    }
  }, [listar, textoBusqueda, filtroEstado, pagina, filasPorPagina]);

  useEffect(() => {
    recargarLista();
  }, [recargarLista]);

  useEffect(() => {
    recargarEstadisticas();
    recargarCuentasDisponibles();
  }, [recargarEstadisticas, recargarCuentasDisponibles]);

  // Abrir modal crear
  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setItemSeleccionadoId(null);
    setFormulario(FORMULARIO_PREFIJO_INICIAL);
    setModalAbierto(true);
  };

  // Abrir modal editar
  const abrirModalEditar = (item: DataCreditoPrefijoItem) => {
    setModoEdicion(true);
    setItemSeleccionadoId(item.id);
    setFormulario({
      cuenta: item.cuenta,
      descripcionCuenta: item.descripcionCuenta || "",
      prefijo: item.prefijo,
      separador: item.separador || "",
      manejoNumero: item.manejoNumero || "ULTIMOS_4",
      longitudPadding: item.longitudPadding || 4,
      sufijo: item.sufijo || "",
      ejemploFactura: item.ejemploFactura || "0005004314",
      activo: item.activo,
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setItemSeleccionadoId(null);
    setFormulario(FORMULARIO_PREFIJO_INICIAL);
  };

  const actualizarCampoFormulario = (campo: keyof FormularioPrefijoState, valor: any) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const limpiarFiltros = () => {
    setTextoBusqueda("");
    setFiltroEstado("todos");
    setPagina(0);
  };

  // Guardar formulario
  const guardar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formulario.cuenta.trim()) {
      toast.warning("Debe seleccionar o ingresar la cuenta contable.");
      return;
    }
    if (!formulario.prefijo.trim()) {
      toast.warning("El prefijo es obligatorio (ej: MON, PTO, CAU, ZMON).");
      return;
    }

    setGuardando(true);
    try {
      const payload: SaveDataCreditoPrefijoPayload = {
        cuenta: formulario.cuenta.trim(),
        descripcionCuenta: formulario.descripcionCuenta.trim() || undefined,
        prefijo: formulario.prefijo.trim().toUpperCase(),
        separador: formulario.separador,
        manejoNumero: formulario.manejoNumero,
        longitudPadding: formulario.longitudPadding,
        sufijo: formulario.sufijo.trim() || undefined,
        ejemploFactura: formulario.ejemploFactura.trim() || "0005004314",
        activo: formulario.activo,
      };

      if (modoEdicion && itemSeleccionadoId) {
        await actualizar(itemSeleccionadoId, payload);
        toast.success("Configuración de prefijo actualizada exitosamente.");
      } else {
        await crear(payload);
        toast.success("Configuración de prefijo creada exitosamente.");
      }

      cerrarModal();
      recargarLista();
      recargarEstadisticas();
      recargarCuentasDisponibles();
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar la configuración");
    } finally {
      setGuardando(false);
    }
  };

  // Toggle estado activo/inactivo
  const toggleEstado = async (item: DataCreditoPrefijoItem) => {
    try {
      const nuevoEstado = !item.activo;
      await cambiarEstado(item.id, nuevoEstado);
      toast.success(
        `Cuenta ${item.cuenta} marcada como ${nuevoEstado ? "Activa" : "Inactiva"}.`
      );
      recargarLista();
      recargarEstadisticas();
    } catch (err: any) {
      toast.error(err?.message || "Error al cambiar el estado");
    }
  };

  // Eliminar
  const handleEliminar = async (item: DataCreditoPrefijoItem) => {
    if (!window.confirm(`¿Está seguro de eliminar la regla para la cuenta ${item.cuenta} (${item.prefijo})?`)) {
      return;
    }
    try {
      await eliminar(item.id);
      toast.success("Regla de prefijo eliminada.");
      recargarLista();
      recargarEstadisticas();
      recargarCuentasDisponibles();
    } catch (err: any) {
      toast.error(err?.message || "Error al eliminar");
    }
  };

  // Vista previa en vivo
  const obligacionPreview = useMemo(() => {
    return formatearPreviewObligacion(formulario);
  }, [formulario]);

  return {
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
    setFormulario,
    actualizarCampoFormulario,
    abrirModalNuevo,
    abrirModalEditar,
    cerrarModal,
    guardar,
    toggleEstado,
    handleEliminar,
    limpiarFiltros,
    recargarLista,
  };
}
