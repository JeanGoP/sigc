import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  GridPaginationModel,
  GridRowParams,
} from "@mui/x-data-grid";
import { useAppSelector } from "@app/store/store";
import { useClientesService } from "@app/services/GestionCartera/ConsultaClientes/clientesService";
import {
  ActualizarDescripcionGestionRequest,
  EliminarEventoGestionRequest,
  EliminarGestionRequest,
  useEventosService,
} from "@app/services/Calendario/CalendarioService";
import { useListarTiposEvento } from "@app/services/ConsultaCartera/TipoEventoService";
import {
  HoraDispItem,
  useHorasDispDia,
} from "@app/services/ConsultaCartera/HorasDispDiaService";
import { buildConsultaCarteraUrl } from "@app/utils/consultaCarteraNavigation";
import {
  aplicarReseteosPorRequerimientosEvento,
  estaHoraOcupada,
} from "@app/utils/eventosCompartidos";
import {
  EMPTY_FORM,
  type EdicionEventoForm,
  type EventoGestion,
  type EventoModificacion,
  type FiltrosConsultaGestiones,
  type FechaConsultaErrors,
  type GestionModificacion,
  type TipoEventoItem,
} from "../domain/types";
import {
  extractDatePart,
  extractTimePart,
  getApiErrorMessage,
  normalizeGestionFilterValue,
  parseNumberValue,
} from "../domain/helpers";
import {
  mapGestionFromApi,
  mapTipoEventoItemFromApi,
  normalizeGestionesResponse,
} from "../domain/mappers";
import {
  buildActualizarEventoValidation,
  buildCrearEventoValidation,
  validateFechasConsulta,
} from "../domain/validation";

interface SelectOption {
  label: string;
  value: string | number;
}

export function useModificacionEventosPage() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const {
    obtenerUsuariosPorRol,
    actualizarModificacionEvento,
    listarGestionesModificacion,
    crearEventoGestion,
    eliminarEventoGestion,
    eliminarGestion,
    actualizarDescripcionGestion,
  } = useEventosService();
  const { listarTiposEvento } = useListarTiposEvento();
  const { listarClientes } = useClientesService();
  const { obtenerHoras, loading: loadingHoras } = useHorasDispDia();

  const [usuarios, setUsuarios] = useState<SelectOption[]>([
    { label: "Todos", value: "" },
  ]);
  const [tiposEvento, setTiposEvento] = useState<TipoEventoItem[]>([]);

  const [fechaInicio, setFechaInicio] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [erroresFechas, setErroresFechas] = useState<FechaConsultaErrors>({});
  const [usuarioFiltro, setUsuarioFiltro] = useState<string | number>("");
  const [cuentaFiltro, setCuentaFiltro] = useState("");
  const [clienteFiltro, setClienteFiltro] = useState("");

  const [showModalClientes, setShowModalClientes] = useState(false);
  const [searchClienteTerm, setSearchClienteTerm] = useState("");
  const [tableRowsClientes, setTableRowsClientes] = useState<any[]>([]);
  const [selectedRowsClientes, setSelectedRowsClientes] = useState<string[]>([]);
  const [paginationModelClientes, setPaginationModelClientes] =
    useState<GridPaginationModel>({
      page: 0,
      pageSize: 20,
    });

  const [rows, setRows] = useState<GestionModificacion[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [page, setPage] = useState(0);
  const [filtrosConsulta, setFiltrosConsulta] =
    useState<FiltrosConsultaGestiones | null>(null);
  const [loadingConsulta, setLoadingConsulta] = useState(false);
  const [busquedaGestion, setBusquedaGestion] = useState("");

  const [drawerGestion, setDrawerGestion] =
    useState<GestionModificacion | null>(null);

  const [editandoDescripcion, setEditandoDescripcion] = useState(false);
  const [descripcionEdit, setDescripcionEdit] = useState("");
  const [savingDescripcion, setSavingDescripcion] = useState(false);

  const [showModalEdicion, setShowModalEdicion] = useState(false);
  const [eventoEditando, setEventoEditando] =
    useState<EventoModificacion | null>(null);
  const [savingEdicion, setSavingEdicion] = useState(false);
  const [formEdicion, setFormEdicion] = useState<EdicionEventoForm>(EMPTY_FORM);
  const [formEdicionInicial, setFormEdicionInicial] =
    useState<EdicionEventoForm | null>(null);

  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [formAgregar, setFormAgregar] = useState<EdicionEventoForm>(EMPTY_FORM);
  const [savingAgregar, setSavingAgregar] = useState(false);

  const [horasDisponiblesEdicion, setHorasDisponiblesEdicion] = useState<
    HoraDispItem[]
  >([]);
  const [horasDisponiblesAgregar, setHorasDisponiblesAgregar] = useState<
    HoraDispItem[]
  >([]);
  const horasFechaEdicionRef = useRef<string>("");
  const horasFechaAgregarRef = useRef<string>("");

  const searchClientes = useCallback(
    async (filter = "") => {
      const params = {
        page: paginationModelClientes.page + 1,
        numpage: paginationModelClientes.pageSize,
        filter,
        intmora: "3.00",
      };
      if (params.filter.length <= 2) {
        setTableRowsClientes([]);
        return;
      }
      try {
        const response: any = await listarClientes(params);
        setTableRowsClientes(response?.success ? response.data || [] : []);
      } catch {
        setTableRowsClientes([]);
      }
    },
    [
      listarClientes,
      paginationModelClientes.page,
      paginationModelClientes.pageSize,
    ],
  );

  const handleSelectRowCliente = useCallback((id: string) => {
    setSelectedRowsClientes((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  }, []);

  const handleRowClickCliente = useCallback((params: GridRowParams) => {
    setClienteFiltro(params.row.id.toString());
    setShowModalClientes(false);
    setSelectedRowsClientes([]);
  }, []);

  const handleOpenModalCliente = useCallback(() => {
    setSearchClienteTerm("");
    setShowModalClientes(true);
  }, []);

  const handleHideModalClientes = useCallback(() => {
    setShowModalClientes(false);
  }, []);

  const handleSearchClienteTermChange = useCallback((value: string) => {
    setSearchClienteTerm(value);
  }, []);

  const handlePaginationClientesChange = useCallback(
    (model: GridPaginationModel) => {
      setPaginationModelClientes((previousModel) => {
        if (
          previousModel.page === model.page &&
          previousModel.pageSize === model.pageSize
        ) {
          return previousModel;
        }

        return model;
      });
    },
    [],
  );

  const handleFechaInicioChange = useCallback((value: string) => {
    setFechaInicio(value);
  }, []);

  const handleFechaFinChange = useCallback((value: string) => {
    setFechaFin(value);
  }, []);

  const clearFechaInicioError = useCallback(() => {
    setErroresFechas((prev) => ({
      ...prev,
      fechaInicio: undefined,
    }));
  }, []);

  const clearFechaFinError = useCallback(() => {
    setErroresFechas((prev) => ({
      ...prev,
      fechaFin: undefined,
    }));
  }, []);

  const handleUsuarioFiltroChange = useCallback((value: string | number) => {
    setUsuarioFiltro(value);
  }, []);

  const handleCuentaFiltroChange = useCallback((value: string) => {
    setCuentaFiltro(value);
  }, []);

  const handleClearCliente = useCallback(() => {
    setClienteFiltro("");
  }, []);

  const handleBusquedaGestionChange = useCallback((value: string) => {
    setBusquedaGestion(value);
  }, []);

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  const handleRowsPerPageChange = useCallback((nextRowsPerPage: number) => {
    setRowsPerPage(nextRowsPerPage);
    setPage(0);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      if (!currentUser?.id) return;
      try {
        const response = await obtenerUsuariosPorRol(
          "Asesor",
          Number(currentUser.id),
        );
        if (response?.success && Array.isArray(response.data)) {
          setUsuarios([
            { label: "Todos", value: "" },
            ...response.data.map((usuario: any) => ({
              label: usuario.fullName,
              value: String(usuario.userId),
            })),
          ]);
        }
      } catch {
        /* silent */
      }
    };

    void fetch();
  }, [currentUser, obtenerUsuariosPorRol]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response: any = await listarTiposEvento();
        if (response?.success && Array.isArray(response.data)) {
          setTiposEvento(
            response.data
              .map(mapTipoEventoItemFromApi)
              .filter((item: TipoEventoItem) => item.id && item.nombre),
          );
        }
      } catch {
        setTiposEvento([]);
      }
    };

    void fetch();
  }, [listarTiposEvento]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(totalRows / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [page, rowsPerPage, totalRows]);


  useEffect(() => {
    if (!showModalClientes) return;
    const timeoutId = window.setTimeout(() => {
      void searchClientes(searchClienteTerm);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchClienteTerm, showModalClientes, searchClientes]);

  useEffect(() => {
    if (!filtrosConsulta) return;

    const fetch = async () => {
      setLoadingConsulta(true);
      try {
        const response: any = await listarGestionesModificacion({
          ...filtrosConsulta,
          page: page + 1,
          pageSize: rowsPerPage,
        });
        if (response?.success) {
          const { rows: raw, totalRows: total } = normalizeGestionesResponse(
            response.data,
          );
          const mapped = raw.map((item: any) => mapGestionFromApi(item));
          setRows(mapped);
          setTotalRows(Math.max(total, page * rowsPerPage + mapped.length));
        } else {
          setRows([]);
          setTotalRows(0);
          toast.error(
            getApiErrorMessage(response, "No fue posible consultar gestiones."),
          );
        }
      } catch (error) {
        setRows([]);
        setTotalRows(0);
        toast.error(
          getApiErrorMessage(
            (error as any)?.response?.data ?? error,
            "No fue posible consultar gestiones.",
          ),
        );
      } finally {
        setLoadingConsulta(false);
      }
    };

    void fetch();
  }, [filtrosConsulta, page, rowsPerPage, listarGestionesModificacion]);

  useEffect(() => {
    if (!filtrosConsulta) return undefined;

    const nextFiltro = normalizeGestionFilterValue(busquedaGestion);
    const currentFiltro = normalizeGestionFilterValue(
      filtrosConsulta.filtro ?? "",
    );

    if (nextFiltro === currentFiltro) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setPage(0);
      setDrawerGestion(null);
      setFiltrosConsulta((prev) => {
        if (!prev) return prev;

        const prevFiltro = normalizeGestionFilterValue(prev.filtro ?? "");
        if (prevFiltro === nextFiltro) {
          return prev;
        }

        return {
          ...prev,
          filtro: nextFiltro,
        };
      });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [busquedaGestion, filtrosConsulta]);

  const tipoEventoOptions = useMemo(
    () => [
      { label: "Seleccione tipo de evento", value: "" },
      ...tiposEvento.map((tipo) => ({ label: tipo.nombre, value: tipo.id })),
    ],
    [tiposEvento],
  );

  const usuarioOptionsEdicion = useMemo(() => {
    const sinTodos = usuarios.filter(
      (option) =>
        String(option.value ?? "").trim() !== "" &&
        String(option.label ?? "").trim().toLowerCase() !== "todos",
    );
    const current = String(formEdicion.usuario ?? "").trim();
    if (!current) return sinTodos;
    const exists = sinTodos.some(
      (option) => String(option.value) === current || option.label === current,
    );
    if (exists || current.toLowerCase() === "todos") return sinTodos;
    return [{ label: current, value: current }, ...sinTodos];
  }, [formEdicion.usuario, usuarios]);

  const tipoEventoOptionsEdicion = useMemo(() => {
    const nombre = eventoEditando?.tipoEvento ?? "";
    const value = String(formEdicion.tipoEventoId ?? "");
    const exists = tipoEventoOptions.some(
      (option) => String(option.value) === value,
    );
    if (!nombre || exists || value === "") return tipoEventoOptions;
    return [{ label: nombre, value }, ...tipoEventoOptions];
  }, [eventoEditando, formEdicion.tipoEventoId, tipoEventoOptions]);

  const tipoEventoSeleccionadoEdicion = useMemo(
    () =>
      tiposEvento.find(
        (tipo) =>
          String(tipo.id) === String(formEdicion.tipoEventoId ?? "").trim(),
      ) ?? null,
    [formEdicion.tipoEventoId, tiposEvento],
  );

  const tipoEventoInicialEdicion = useMemo(
    () =>
      tiposEvento.find(
        (tipo) =>
          String(tipo.id) === String(formEdicionInicial?.tipoEventoId ?? "").trim(),
      ) ?? null,
    [formEdicionInicial?.tipoEventoId, tiposEvento],
  );

  const tipoEventoSeleccionadoAgregar = useMemo(
    () =>
      tiposEvento.find(
        (tipo) =>
          String(tipo.id) === String(formAgregar.tipoEventoId ?? "").trim(),
      ) ?? null,
    [formAgregar.tipoEventoId, tiposEvento],
  );

  const requiereFechaEdicion =
    tipoEventoSeleccionadoEdicion?.requiereFecha ??
    eventoEditando?.requiereFecha ??
    false;
  const requiereHoraEdicion =
    tipoEventoSeleccionadoEdicion?.requiereHora ??
    eventoEditando?.requiereHora ??
    false;
  const requiereMontoEdicion =
    tipoEventoSeleccionadoEdicion?.requiereMonto ??
    eventoEditando?.requiereMonto ??
    false;
  const requiereHoraInicialEdicion =
    tipoEventoInicialEdicion?.requiereHora ??
    eventoEditando?.requiereHora ??
    false;

  const requiereFechaAgregar =
    tipoEventoSeleccionadoAgregar?.requiereFecha ?? false;
  const requiereHoraAgregar =
    tipoEventoSeleccionadoAgregar?.requiereHora ?? false;
  const requiereMontoAgregar =
    tipoEventoSeleccionadoAgregar?.requiereMonto ?? false;

  const handleConsultar = useCallback(() => {
    const fechasValidation = validateFechasConsulta(fechaInicio, fechaFin);
    setErroresFechas(fechasValidation.errors);
    if (!fechasValidation.isValid) return;

    setFiltrosConsulta({
      fechaInicio,
      fechaFin,
      userId: parseNumberValue(usuarioFiltro),
      cuenta: cuentaFiltro.trim() || null,
      cliente: clienteFiltro.trim() || null,
      filtro: normalizeGestionFilterValue(busquedaGestion),
    });
    setPage(0);
    setDrawerGestion(null);
  }, [
    busquedaGestion,
    clienteFiltro,
    cuentaFiltro,
    fechaFin,
    fechaInicio,
    usuarioFiltro,
  ]);

  useEffect(() => {
    const fecha = formEdicion.fechaEvento;
    const idUsuario = formEdicion.usuario;
    if (!requiereHoraEdicion || !fecha || !idUsuario) {
      setHorasDisponiblesEdicion([]);
      horasFechaEdicionRef.current = "";
      return;
    }
    if (horasFechaEdicionRef.current === fecha) return;
    horasFechaEdicionRef.current = fecha;
    setHorasDisponiblesEdicion([]);
    void obtenerHoras(fecha, idUsuario).then((response) => {
      const data = (response as any)?.data as HoraDispItem[] | undefined;
      if (!data) return;
      setHorasDisponiblesEdicion(data);
      setFormEdicion((prev) => {
        if (estaHoraOcupada(prev.horaEvento, data)) {
          return { ...prev, horaEvento: "" };
        }
        return prev;
      });
    });
  }, [
    formEdicion.fechaEvento,
    formEdicion.usuario,
    requiereHoraEdicion,
    obtenerHoras,
  ]);

  useEffect(() => {
    const fecha = formAgregar.fechaEvento;
    const idUsuario = formAgregar.usuario;
    if (!requiereHoraAgregar || !fecha || !idUsuario) {
      setHorasDisponiblesAgregar([]);
      horasFechaAgregarRef.current = "";
      return;
    }
    if (horasFechaAgregarRef.current === fecha) return;
    horasFechaAgregarRef.current = fecha;
    setHorasDisponiblesAgregar([]);
    void obtenerHoras(fecha, idUsuario).then((response) => {
      const data = (response as any)?.data as HoraDispItem[] | undefined;
      if (!data) return;
      setHorasDisponiblesAgregar(data);
      setFormAgregar((prev) => {
        if (estaHoraOcupada(prev.horaEvento, data)) {
          return { ...prev, horaEvento: "" };
        }
        return prev;
      });
    });
  }, [
    formAgregar.fechaEvento,
    formAgregar.usuario,
    requiereHoraAgregar,
    obtenerHoras,
  ]);

  const handleOpenDrawer = useCallback((gestion: GestionModificacion) => {
    setDrawerGestion(gestion);
    setEditandoDescripcion(false);
    setDescripcionEdit(gestion.descripcion ?? "");
    setShowModalAgregar(false);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerGestion(null);
    setEditandoDescripcion(false);
  }, []);

  const handleIniciarEditarDescripcion = useCallback(() => {
    setDescripcionEdit(drawerGestion?.descripcion ?? "");
    setEditandoDescripcion(true);
  }, [drawerGestion]);

  const handleCancelarDescripcion = useCallback(() => {
    setEditandoDescripcion(false);
    setDescripcionEdit("");
  }, []);

  const handleDescripcionChange = useCallback((value: string) => {
    setDescripcionEdit(value);
  }, []);

  const handleGuardarDescripcion = useCallback(async () => {
    if (!drawerGestion) return;
    setSavingDescripcion(true);
    try {
      const payload: ActualizarDescripcionGestionRequest = {
        idGestion: drawerGestion.idGestion,
        descripcion: descripcionEdit,
      };
      const result: any = await actualizarDescripcionGestion(payload);
      if (!result?.success) {
        toast.error(
          getApiErrorMessage(
            result,
            "No fue posible actualizar la descripcion.",
          ),
        );
        return;
      }
      const updated = { ...drawerGestion, descripcion: descripcionEdit };
      setRows((prev) =>
        prev.map((gestion) =>
          gestion.idGestion === drawerGestion.idGestion ? updated : gestion,
        ),
      );
      setDrawerGestion(updated);
      setEditandoDescripcion(false);
      toast.success("Descripcion actualizada.");
    } catch {
      toast.error("No fue posible actualizar la descripcion.");
    } finally {
      setSavingDescripcion(false);
    }
  }, [actualizarDescripcionGestion, descripcionEdit, drawerGestion]);

  const handleEditarEvento = useCallback(
    (evento: EventoGestion) => {
      const tipoEncontrado = tiposEvento.find(
        (tipo) => String(tipo.id) === String(evento.idTipoEvento),
      );
      const usuarioEncontrado = usuarios.find(
        (usuario) =>
          String(usuario.value) === String(evento.idUsuarioAsignado),
      );

      const eventoMapped: EventoModificacion = {
        id: evento.id,
        cliente: evento.cliente,
        factura: evento.factura,
        cuenta: evento.cuenta,
        tipoEventoId: String(evento.idTipoEvento),
        tipoEvento: tipoEncontrado?.nombre ?? String(evento.idTipoEvento),
        fechaCreacion: "",
        fechaEvento: evento.fechaHoraProgramada ?? "",
        monto: evento.montoCompromiso,
        usuario: usuarioEncontrado?.label ?? String(evento.idUsuarioAsignado),
        requiereFecha: evento.requiereFecha,
        requiereHora: evento.requiereHora,
        requiereMonto: evento.requiereMonto,
      };

      const initialForm: EdicionEventoForm = {
        usuario: usuarioEncontrado?.value ?? String(evento.idUsuarioAsignado),
        cuenta: evento.cuenta,
        cliente: evento.cliente,
        tipoEventoId: tipoEncontrado?.id ?? String(evento.idTipoEvento),
        fechaEvento: extractDatePart(evento.fechaHoraProgramada),
        horaEvento: extractTimePart(evento.fechaHoraProgramada),
        monto:
          evento.montoCompromiso == null ? "" : String(evento.montoCompromiso),
      };

      setEventoEditando(eventoMapped);
      setFormEdicion(initialForm);
      setFormEdicionInicial(initialForm);
      setShowModalEdicion(true);
    },
    [tiposEvento, usuarios],
  );

  const handleCloseModalEdicion = useCallback(() => {
    setShowModalEdicion(false);
    setEventoEditando(null);
    setFormEdicionInicial(null);
  }, []);

  const setFieldEdicion = useCallback(
    <K extends keyof EdicionEventoForm>(field: K, value: EdicionEventoForm[K]) => {
      setFormEdicion((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleUsuarioEdicionChange = useCallback(
    (value: string | number) => {
      setFieldEdicion("usuario", value);
    },
    [setFieldEdicion],
  );

  const handleFechaEventoEdicionChange = useCallback(
    (value: string) => {
      setFieldEdicion("fechaEvento", value);
    },
    [setFieldEdicion],
  );

  const handleHoraEventoEdicionChange = useCallback(
    (value: string) => {
      setFieldEdicion("horaEvento", value);
    },
    [setFieldEdicion],
  );

  const handleMontoEdicionChange = useCallback(
    (value: string) => {
      setFieldEdicion("monto", value);
    },
    [setFieldEdicion],
  );

  const handleChangeTipoEventoEdicion = useCallback(
    (value: string | number) => {
      const tipo = tiposEvento.find((item) => String(item.id) === String(value));
      setFormEdicion((prev) =>
        aplicarReseteosPorRequerimientosEvento({
          state: {
            ...prev,
            tipoEventoId: value,
          },
          requerimientos: tipo,
          fechaKey: "fechaEvento",
          fechaVacia: "",
          horaKey: "horaEvento",
          horaVacia: "",
          montoKey: "monto",
          montoVacio: "",
        }),
      );
    },
    [tiposEvento],
  );

  const handleGuardarEdicion = useCallback(async () => {
    if (!eventoEditando || !formEdicionInicial) return;

    const validation = buildActualizarEventoValidation({
      eventoEditando,
      formEdicion,
      formEdicionInicial,
      requirements: {
        requiereFecha: requiereFechaEdicion,
        requiereHora: requiereHoraEdicion,
        requiereMonto: requiereMontoEdicion,
        requiereHoraInicial: requiereHoraInicialEdicion,
      },
    });

    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }

    const { payload, changes } = validation;
    setSavingEdicion(true);
    try {
      const result: any = await actualizarModificacionEvento(payload);
      if (!result?.success) {
        toast.error(
          getApiErrorMessage(result, "No fue posible guardar la edicion."),
        );
        return;
      }

      const tipoSeleccionado = tiposEvento.find(
        (tipo) => String(tipo.id) === String(formEdicion.tipoEventoId),
      );

      const updateEvento = (evento: EventoGestion): EventoGestion =>
        evento.id !== eventoEditando.id
          ? evento
          : {
              ...evento,
              idUsuarioAsignado: changes.usuarioChanged
                ? payload.idUsuarioAsignado ?? evento.idUsuarioAsignado
                : evento.idUsuarioAsignado,
              idTipoEvento: changes.tipoEventoChanged
                ? payload.idTipoEvento ?? evento.idTipoEvento
                : evento.idTipoEvento,
              requiereFecha:
                tipoSeleccionado?.requiereFecha ?? evento.requiereFecha,
              requiereHora:
                tipoSeleccionado?.requiereHora ?? evento.requiereHora,
              requiereMonto:
                tipoSeleccionado?.requiereMonto ?? evento.requiereMonto,
              fechaHoraProgramada: changes.fechaHoraChanged
                ? changes.currentFHP
                : evento.fechaHoraProgramada,
              montoCompromiso: changes.montoChanged
                ? changes.currentMonto
                : evento.montoCompromiso,
            };

      setRows((prev) =>
        prev.map((gestion) => ({
          ...gestion,
          eventos: gestion.eventos.map(updateEvento),
        })),
      );
      setDrawerGestion((prev) =>
        prev ? { ...prev, eventos: prev.eventos.map(updateEvento) } : prev,
      );

      toast.success(result?.message || "Evento actualizado correctamente.");
      handleCloseModalEdicion();
    } catch {
      toast.error("No fue posible guardar la edicion del evento.");
    } finally {
      setSavingEdicion(false);
    }
  }, [
    actualizarModificacionEvento,
    eventoEditando,
    formEdicion,
    formEdicionInicial,
    handleCloseModalEdicion,
    requiereFechaEdicion,
    requiereHoraEdicion,
    requiereHoraInicialEdicion,
    requiereMontoEdicion,
    tiposEvento,
  ]);

  const handleOpenModalAgregar = useCallback(() => {
    if (!drawerGestion) return;
    setFormAgregar({
      ...EMPTY_FORM,
      cuenta: drawerGestion.cuenta,
      cliente: drawerGestion.cliente,
    });
    setShowModalAgregar(true);
  }, [drawerGestion]);

  const handleCloseModalAgregar = useCallback(() => {
    setShowModalAgregar(false);
    setFormAgregar(EMPTY_FORM);
  }, []);

  const setFieldAgregar = useCallback(
    <K extends keyof EdicionEventoForm>(field: K, value: EdicionEventoForm[K]) => {
      setFormAgregar((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleUsuarioAgregarChange = useCallback(
    (value: string | number) => {
      setFieldAgregar("usuario", value);
    },
    [setFieldAgregar],
  );

  const handleFechaEventoAgregarChange = useCallback(
    (value: string) => {
      setFieldAgregar("fechaEvento", value);
    },
    [setFieldAgregar],
  );

  const handleHoraEventoAgregarChange = useCallback(
    (value: string) => {
      setFieldAgregar("horaEvento", value);
    },
    [setFieldAgregar],
  );

  const handleMontoAgregarChange = useCallback(
    (value: string) => {
      setFieldAgregar("monto", value);
    },
    [setFieldAgregar],
  );

  const handleChangeTipoEventoAgregar = useCallback(
    (value: string | number) => {
      const tipo = tiposEvento.find((item) => String(item.id) === String(value));
      setFormAgregar((prev) =>
        aplicarReseteosPorRequerimientosEvento({
          state: {
            ...prev,
            tipoEventoId: value,
          },
          requerimientos: tipo,
          fechaKey: "fechaEvento",
          fechaVacia: "",
          horaKey: "horaEvento",
          horaVacia: "",
          montoKey: "monto",
          montoVacio: "",
        }),
      );
    },
    [tiposEvento],
  );

  const handleGuardarAgregar = useCallback(async () => {
    if (!drawerGestion) return;

    const validation = buildCrearEventoValidation({
      drawerGestion,
      formAgregar,
      requirements: {
        requiereFecha: requiereFechaAgregar,
        requiereHora: requiereHoraAgregar,
        requiereMonto: requiereMontoAgregar,
      },
    });

    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }

    const { payload } = validation;
    const idUsuario = payload.idUsuarioAsignado;
    const idTipo = payload.idTipoEvento;

    setSavingAgregar(true);
    try {
      const result: any = await crearEventoGestion(payload);
      if (!result?.success) {
        toast.error(
          getApiErrorMessage(result, "No fue posible agregar el evento."),
        );
        return;
      }

      const tipoSeleccionado = tiposEvento.find(
        (tipo) => String(tipo.id) === String(idTipo),
      );
      const nuevoEvento: EventoGestion = {
        id: result?.data?.id ?? Date.now(),
        idGestion: drawerGestion.idGestion,
        cliente: drawerGestion.cliente,
        factura: drawerGestion.factura,
        cuenta: drawerGestion.cuenta,
        idUsuarioAsignado: idUsuario,
        idTipoEvento: idTipo,
        fechaHoraProgramada: payload.fechaHoraProgramada ?? "",
        montoCompromiso: payload.montoCompromiso ?? null,
        requiereFecha: tipoSeleccionado?.requiereFecha ?? false,
        requiereHora: tipoSeleccionado?.requiereHora ?? false,
        requiereMonto: tipoSeleccionado?.requiereMonto ?? false,
      };

      const addEvento = (gestion: GestionModificacion): GestionModificacion =>
        gestion.idGestion === drawerGestion.idGestion
          ? { ...gestion, eventos: [...gestion.eventos, nuevoEvento] }
          : gestion;

      setRows((prev) => prev.map(addEvento));
      setDrawerGestion((prev) =>
        prev ? { ...prev, eventos: [...prev.eventos, nuevoEvento] } : prev,
      );

      toast.success(result?.message || "Evento agregado correctamente.");
      handleCloseModalAgregar();
    } catch {
      toast.error("No fue posible agregar el evento.");
    } finally {
      setSavingAgregar(false);
    }
  }, [
    crearEventoGestion,
    drawerGestion,
    formAgregar,
    handleCloseModalAgregar,
    requiereFechaAgregar,
    requiereHoraAgregar,
    requiereMontoAgregar,
    tiposEvento,
  ]);

  const handleEliminarGestion = useCallback(async () => {
    if (!drawerGestion) return;
    if (
      !window.confirm(
        `¿Desea eliminar la gestión #${drawerGestion.idGestion}? Esta acción también eliminará todos sus eventos.`,
      )
    ) {
      return;
    }
    try {
      const payload: EliminarGestionRequest = {
        idGestion: drawerGestion.idGestion,
      };
      const result: any = await eliminarGestion(payload);
      if (!result?.success) {
        toast.error(
          getApiErrorMessage(result, "No fue posible eliminar la gestión."),
        );
        return;
      }
      setRows((prev) =>
        prev.filter((gestion) => gestion.idGestion !== drawerGestion.idGestion),
      );
      handleCloseDrawer();
      toast.success("Gestión eliminada correctamente.");
    } catch {
      toast.error("No fue posible eliminar la gestión.");
    }
  }, [drawerGestion, eliminarGestion, handleCloseDrawer]);

  const handleEliminarEvento = useCallback(
    async (evento: EventoGestion) => {
      if (!window.confirm(`¿Desea eliminar el evento con id ${evento.id}?`)) {
        return;
      }
      try {
        const payload: EliminarEventoGestionRequest = { idEvento: evento.id };
        const result: any = await eliminarEventoGestion(payload);
        if (!result?.success) {
          toast.error(
            getApiErrorMessage(result, "No fue posible eliminar el evento."),
          );
          return;
        }
        const removeEvento = (
          gestion: GestionModificacion,
        ): GestionModificacion => ({
          ...gestion,
          eventos: gestion.eventos.filter((item) => item.id !== evento.id),
        });
        setRows((prev) => prev.map(removeEvento));
        setDrawerGestion((prev) => (prev ? removeEvento(prev) : prev));
        toast.success("Evento eliminado correctamente.");
      } catch {
        toast.error("No fue posible eliminar el evento.");
      }
    },
    [eliminarEventoGestion],
  );

  const handleIrSeguimientoEvento = useCallback((evento: EventoGestion) => {
    const url = buildConsultaCarteraUrl({
      cuenta: evento.cuenta,
      factura: evento.factura,
      identificacionCliente: evento.cliente,
    });
    window.open(
      `${window.location.origin}${window.location.pathname}#${url}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, []);

  const resolverNombreTipo = useCallback(
    (id: number) =>
      tiposEvento.find((tipo) => String(tipo.id) === String(id))?.nombre ??
      String(id),
    [tiposEvento],
  );

  const resolverNombreUsuario = useCallback(
    (id: number) =>
      usuarios.find((usuario) => String(usuario.value) === String(id))?.label ??
      String(id),
    [usuarios],
  );

  return {
    fechaInicio,
    fechaFin,
    erroresFechas,
    usuarioFiltro,
    usuarios,
    cuentaFiltro,
    clienteFiltro,
    loadingConsulta,
    showModalClientes,
    searchClienteTerm,
    tableRowsClientes,
    selectedRowsClientes,
    paginationModelClientes,
    rows,
    totalRows,
    rowsPerPage,
    page,
    filtrosConsulta,
    busquedaGestion,
    drawerGestion,
    editandoDescripcion,
    descripcionEdit,
    savingDescripcion,
    showModalEdicion,
    eventoEditando,
    savingEdicion,
    formEdicion,
    showModalAgregar,
    formAgregar,
    savingAgregar,
    horasDisponiblesEdicion,
    horasDisponiblesAgregar,
    loadingHoras,
    tipoEventoOptions,
    usuarioOptionsEdicion,
    tipoEventoOptionsEdicion,
    requiereFechaEdicion,
    requiereHoraEdicion,
    requiereMontoEdicion,
    requiereFechaAgregar,
    requiereHoraAgregar,
    requiereMontoAgregar,
    handleFechaInicioChange,
    handleFechaFinChange,
    clearFechaInicioError,
    clearFechaFinError,
    handleUsuarioFiltroChange,
    handleCuentaFiltroChange,
    handleClearCliente,
    handleSelectRowCliente,
    handleRowClickCliente,
    handleOpenModalCliente,
    handleHideModalClientes,
    handleSearchClienteTermChange,
    handlePaginationClientesChange,
    handleConsultar,
    handleBusquedaGestionChange,
    handleOpenDrawer,
    handlePageChange,
    handleRowsPerPageChange,
    handleCloseDrawer,
    handleIniciarEditarDescripcion,
    handleCancelarDescripcion,
    handleDescripcionChange,
    handleGuardarDescripcion,
    handleOpenModalAgregar,
    handleEditarEvento,
    handleEliminarEvento,
    handleIrSeguimientoEvento,
    resolverNombreTipo,
    resolverNombreUsuario,
    handleCloseModalEdicion,
    handleGuardarEdicion,
    handleUsuarioEdicionChange,
    handleChangeTipoEventoEdicion,
    handleFechaEventoEdicionChange,
    handleHoraEventoEdicionChange,
    handleMontoEdicionChange,
    handleCloseModalAgregar,
    handleGuardarAgregar,
    handleUsuarioAgregarChange,
    handleChangeTipoEventoAgregar,
    handleFechaEventoAgregarChange,
    handleHoraEventoAgregarChange,
    handleMontoAgregarChange,
    handleEliminarGestion,
  };
}

