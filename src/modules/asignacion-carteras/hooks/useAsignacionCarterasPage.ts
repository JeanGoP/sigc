import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useAppSelector } from "@app/store/store";
import {
  type CarteraAsesor,
  type CarteraAsignacionActual,
  type CarteraAsignacionHistorial,
  useAsignacionCarterasService,
} from "@app/services/AsignacionCarteras/asignacionCarterasService";
import { can } from "@app/utils/security";
import {
  buildAllSelectedKeys,
  buildCarteraRowKey,
  buildDefaultAsignacionFilters,
  buildDefaultMasivoReasignacionForm,
  buildDefaultNuevaAsignacionForm,
  buildDefaultReasignacionForm,
  buildGuardarAsignacionPayload,
  buildListarAsignacionesParams,
  buildListarHistorialParams,
  buildReasignacionCambioPayload,
  buildReasignacionMasivaPayload,
  pruneSelectedKeys,
  toggleSelectedKey,
  toggleTramoSelection,
  validateNuevaAsignacion,
  validateReasignacion,
  validateReasignacionMasiva,
} from "../domain/helpers";
import type {
  AsignacionCarterasFilters,
  MasivoReasignacionFormState,
  NuevaAsignacionFormState,
  ReasignacionFormState,
} from "../domain/types";

export function useAsignacionCarterasPage() {
  const permisos = useAppSelector((state) => state.security.permissions);
  const puedeAsignar = can(permisos, "asignacion_carteras.assign");
  const puedeReasignar = can(permisos, "asignacion_carteras.reassign");
  const {
    loading,
    listarAsignaciones,
    listarAsesores,
    listarHistorial,
    guardarAsignacion,
    reasignarMasivo,
  } = useAsignacionCarterasService();

  const [asignaciones, setAsignaciones] = useState<CarteraAsignacionActual[]>([]);
  const [asesores, setAsesores] = useState<CarteraAsesor[]>([]);
  const [historial, setHistorial] = useState<CarteraAsignacionHistorial[]>([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardandoReasignacion, setGuardandoReasignacion] = useState(false);
  const [guardandoMasivo, setGuardandoMasivo] = useState(false);
  const [filters, setFilters] = useState<AsignacionCarterasFilters>(() =>
    buildDefaultAsignacionFilters(),
  );
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [modalNuevaOpen, setModalNuevaOpen] = useState(false);
  const [nuevaAsignacion, setNuevaAsignacion] = useState<NuevaAsignacionFormState>(
    () => buildDefaultNuevaAsignacionForm(),
  );
  const [filaReasignar, setFilaReasignar] =
    useState<CarteraAsignacionActual | null>(null);
  const [reasignacion, setReasignacion] = useState<ReasignacionFormState>(() =>
    buildDefaultReasignacionForm(),
  );
  const [modalMasivoOpen, setModalMasivoOpen] = useState(false);
  const [reasignacionMasiva, setReasignacionMasiva] =
    useState<MasivoReasignacionFormState>(() =>
      buildDefaultMasivoReasignacionForm(),
    );
  const initializedRef = useRef(false);

  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const filasSeleccionadas = useMemo(
    () => asignaciones.filter((item) => selectedSet.has(buildCarteraRowKey(item))),
    [asignaciones, selectedSet],
  );
  const allSelected = useMemo(
    () => asignaciones.length > 0 && selectedKeys.length === asignaciones.length,
    [asignaciones.length, selectedKeys.length],
  );

  const updateFilter = useCallback(
    (field: keyof AsignacionCarterasFilters, value: string) => {
      setFilters((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const updateNuevaAsignacion = useCallback(
    (field: keyof NuevaAsignacionFormState, value: string | string[]) => {
      setNuevaAsignacion((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const updateReasignacion = useCallback(
    (field: keyof ReasignacionFormState, value: string) => {
      setReasignacion((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const updateReasignacionMasiva = useCallback(
    (field: keyof MasivoReasignacionFormState, value: string) => {
      setReasignacionMasiva((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const cargarAsesoresData = useCallback(async () => {
    const response = await listarAsesores(true);
    if (response?.success) {
      setAsesores(response.data ?? []);
      return;
    }

    toast.error(response?.message || "No fue posible cargar los asesores");
  }, [listarAsesores]);

  const cargarAsignacionesData = useCallback(async () => {
    const response = await listarAsignaciones(
      buildListarAsignacionesParams(filters),
    );

    if (response?.success) {
      setAsignaciones(response.data ?? []);
      return;
    }

    toast.error(response?.message || "No fue posible cargar las asignaciones");
  }, [filters, listarAsignaciones]);

  const cargarHistorialData = useCallback(async () => {
    const response = await listarHistorial(buildListarHistorialParams(filters));

    if (response?.success) {
      setHistorial(response.data ?? []);
      return;
    }

    toast.error(response?.message || "No fue posible cargar el historial");
  }, [filters, listarHistorial]);

  const consultarAsignacionesEHistorial = useCallback(async () => {
    setCargandoInicial(true);
    try {
      await Promise.all([cargarAsignacionesData(), cargarHistorialData()]);
    } finally {
      setCargandoInicial(false);
    }
  }, [cargarAsignacionesData, cargarHistorialData]);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    const inicializar = async () => {
      setCargandoInicial(true);
      try {
        await cargarAsesoresData();
        await Promise.all([cargarAsignacionesData(), cargarHistorialData()]);
      } finally {
        setCargandoInicial(false);
      }
    };

    void inicializar();
  }, [cargarAsesoresData, cargarAsignacionesData, cargarHistorialData]);

  useEffect(() => {
    setSelectedKeys((prev) => {
      const next = pruneSelectedKeys(asignaciones, prev);
      return next.length === prev.length ? prev : next;
    });
  }, [asignaciones]);

  const clearFiltros = useCallback(() => {
    setFilters((current) => ({
      ...current,
      filtroCuenta: "",
      filtroTramo: "",
      filtroAsesorId: "",
    }));
  }, []);

  const handleToggleRow = useCallback((row: CarteraAsignacionActual) => {
    setSelectedKeys((current) => toggleSelectedKey(current, row));
  }, []);

  const handleToggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedKeys([]);
      return;
    }

    setSelectedKeys(buildAllSelectedKeys(asignaciones));
  }, [allSelected, asignaciones]);

  const openNuevaModal = useCallback(() => {
    setNuevaAsignacion(buildDefaultNuevaAsignacionForm());
    setModalNuevaOpen(true);
  }, []);

  const closeNuevaModal = useCallback(() => {
    if (guardando) {
      return;
    }

    setModalNuevaOpen(false);
  }, [guardando]);

  const handleToggleNuevoTramo = useCallback((tramoCodigo: string) => {
    setNuevaAsignacion((current) => ({
      ...current,
      tramos: toggleTramoSelection(current.tramos, tramoCodigo),
    }));
  }, []);

  const handleGuardarAsignacion = useCallback(async () => {
    const validationMessage = validateNuevaAsignacion(
      puedeAsignar,
      nuevaAsignacion,
    );

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    try {
      setGuardando(true);
      const response = await guardarAsignacion(
        buildGuardarAsignacionPayload(nuevaAsignacion),
      );

      if (response?.success) {
        toast.success(response.message || "Asignacion guardada exitosamente");
        setModalNuevaOpen(false);
        await consultarAsignacionesEHistorial();
        return;
      }

      toast.error(response?.message || "No fue posible guardar la asignacion");
    } finally {
      setGuardando(false);
    }
  }, [
    consultarAsignacionesEHistorial,
    guardarAsignacion,
    nuevaAsignacion,
    puedeAsignar,
  ]);

  const openReasignarModal = useCallback((row: CarteraAsignacionActual) => {
    setFilaReasignar(row);
    setReasignacion(buildDefaultReasignacionForm(String(row.asesorUserId)));
  }, []);

  const closeReasignarModal = useCallback(() => {
    if (guardandoReasignacion) {
      return;
    }

    setFilaReasignar(null);
  }, [guardandoReasignacion]);

  const handleReasignarFila = useCallback(async () => {
    if (!filaReasignar) {
      return;
    }

    const validationMessage = validateReasignacion(
      puedeReasignar,
      reasignacion.asesorId,
    );

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    try {
      setGuardandoReasignacion(true);
      const response = await reasignarMasivo({
        cambios: [buildReasignacionCambioPayload(filaReasignar, reasignacion)],
      });

      if (response?.success) {
        toast.success(response.message || "Reasignacion aplicada exitosamente");
        setFilaReasignar(null);
        await consultarAsignacionesEHistorial();
        return;
      }

      toast.error(response?.message || "No fue posible aplicar la reasignacion");
    } finally {
      setGuardandoReasignacion(false);
    }
  }, [
    consultarAsignacionesEHistorial,
    filaReasignar,
    puedeReasignar,
    reasignacion,
    reasignarMasivo,
  ]);

  const openMasivoModal = useCallback(() => {
    if (filasSeleccionadas.length === 0) {
      toast.info("Seleccione al menos una fila para reasignar");
      return;
    }

    setReasignacionMasiva(buildDefaultMasivoReasignacionForm());
    setModalMasivoOpen(true);
  }, [filasSeleccionadas.length]);

  const closeMasivoModal = useCallback(() => {
    if (guardandoMasivo) {
      return;
    }

    setModalMasivoOpen(false);
  }, [guardandoMasivo]);

  const handleReasignarMasivo = useCallback(async () => {
    const validationMessage = validateReasignacionMasiva(
      puedeReasignar,
      reasignacionMasiva.asesorId,
      filasSeleccionadas.length,
    );

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    try {
      setGuardandoMasivo(true);
      const response = await reasignarMasivo({
        cambios: buildReasignacionMasivaPayload(
          filasSeleccionadas,
          reasignacionMasiva,
        ),
      });

      if (response?.success) {
        toast.success(
          response.message || "Reasignacion masiva aplicada exitosamente",
        );
        setModalMasivoOpen(false);
        setSelectedKeys([]);
        await consultarAsignacionesEHistorial();
        return;
      }

      toast.error(
        response?.message || "No fue posible aplicar la reasignacion masiva",
      );
    } finally {
      setGuardandoMasivo(false);
    }
  }, [
    consultarAsignacionesEHistorial,
    filasSeleccionadas,
    puedeReasignar,
    reasignacionMasiva,
    reasignarMasivo,
  ]);

  return {
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
  };
}
