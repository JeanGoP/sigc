import { useCallback, useEffect, useState } from "react";
import type { View } from "react-big-calendar";
import { useAppSelector } from "@app/store/store";
import { useEventosService, type Evento } from "@app/services/Calendario/CalendarioService";
import {
  buildCalendarioEventosParams,
  buildInitialCalendarRange,
  getEventosDelDia,
  isValidCalendarUserFilter,
  mapCalendarioEventos,
  normalizeCalendarRange,
} from "../domain/helpers";
import {
  persistCalendarioCuentaFiltro,
  persistCalendarioUsuarioFiltro,
  readCalendarioCuentaFiltro,
  readCalendarioUsuarioFiltro,
} from "../domain/filterStorage";
import type { CalendarioRangeInput, CalendarioUserOption, CalendarioVisibleRange } from "../domain/types";

export function useCalendarioPage() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { obtenerUsuariosPorRol, obtenerEventos } = useEventosService();

  const [usuarios, setUsuarios] = useState<CalendarioUserOption[]>([]);
  const [usuarioFiltro, setUsuarioFiltro] = useState<string | number>(() =>
    readCalendarioUsuarioFiltro(),
  );
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [mostrarModalEvento, setMostrarModalEvento] = useState(false);
  const [mostrarModalDia, setMostrarModalDia] = useState(false);
  const [incluirAnteriores] = useState(false);
  const [incluirCumplidos] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(
    null,
  );
  const [cuentaFiltro, setCuentaFiltro] = useState<string>(() =>
    readCalendarioCuentaFiltro(),
  );
  const [eventosDelDia, setEventosDelDia] = useState<Evento[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  const [rangoVisible, setRangoVisible] = useState<CalendarioVisibleRange>(
    buildInitialCalendarRange(),
  );

  const handleUsuarioFiltroChange = useCallback((value: string | number) => {
    setUsuarioFiltro(value);
  }, []);

  const handleCuentaFiltroChange = useCallback((cuenta: string | null) => {
    setCuentaFiltro(cuenta ?? "");
  }, []);

  const handleRangeChange = useCallback(
    (range: CalendarioRangeInput, _view?: View) => {
      setRangoVisible(normalizeCalendarRange(range));
    },
    [],
  );

  const handleSeleccionEvento = useCallback((evento: Evento) => {
    setEventoSeleccionado(evento);
    setMostrarModalEvento(true);
  }, []);

  const handleSeleccionDia = useCallback(
    (slotInfo: { start: Date }) => {
      setEventosDelDia(getEventosDelDia(eventos, slotInfo.start));
      setFechaSeleccionada(slotInfo.start);
      setMostrarModalDia(true);
    },
    [eventos],
  );

  const cerrarModalEvento = useCallback(() => {
    setMostrarModalEvento(false);
    setEventoSeleccionado(null);
  }, []);

  const cerrarModalDia = useCallback(() => {
    setMostrarModalDia(false);
    setEventosDelDia([]);
    setFechaSeleccionada(null);
  }, []);

  const handleMostrarMas = useCallback((eventosDia: Evento[], fecha: Date) => {
    setEventosDelDia(eventosDia);
    setFechaSeleccionada(fecha);
    setMostrarModalDia(true);
  }, []);

  useEffect(() => {
    const fetchUsuarios = async () => {
      const response = await obtenerUsuariosPorRol("Asesor", Number(currentUser?.id));
      if (response?.success && Array.isArray(response.data)) {
        const opciones = response.data.map((user: any) => ({
          label: user.fullName,
          value: user.userId,
        }));
        setUsuarios(opciones);
        if (opciones.length > 0) {
          setUsuarioFiltro((prev) => {
            if (isValidCalendarUserFilter(prev)) return prev;
            const firstValid = opciones.find((option) =>
              isValidCalendarUserFilter(option.value),
            );
            return firstValid ? firstValid.value : prev;
          });
        }
      }
    };

    if (currentUser?.id) {
      void fetchUsuarios();
    }
  }, [currentUser, obtenerUsuariosPorRol]);

  useEffect(() => {
    persistCalendarioUsuarioFiltro(usuarioFiltro);
  }, [usuarioFiltro]);

  useEffect(() => {
    persistCalendarioCuentaFiltro(cuentaFiltro);
  }, [cuentaFiltro]);

  useEffect(() => {
    const fetchEventos = async () => {
      if (!isValidCalendarUserFilter(usuarioFiltro) || !rangoVisible) return;

      const response = await obtenerEventos(
        buildCalendarioEventosParams({
          cuentaFiltro,
          eventosAnteriores: incluirAnteriores,
          eventosCumplidos: incluirCumplidos,
          fechaInicio: rangoVisible.start,
          fechaFin: rangoVisible.end,
          userId: usuarioFiltro,
        }),
      );

      if (response?.success && Array.isArray(response.data)) {
        setEventos(mapCalendarioEventos(response.data));
      }
    };

    void fetchEventos();
  }, [
    cuentaFiltro,
    incluirAnteriores,
    incluirCumplidos,
    obtenerEventos,
    rangoVisible,
    usuarioFiltro,
  ]);

  return {
    usuarios,
    usuarioFiltro,
    eventos,
    mostrarModalEvento,
    mostrarModalDia,
    eventoSeleccionado,
    cuentaFiltro,
    eventosDelDia,
    fechaSeleccionada,
    handleUsuarioFiltroChange,
    handleCuentaFiltroChange,
    handleRangeChange,
    handleSeleccionEvento,
    handleSeleccionDia,
    cerrarModalEvento,
    cerrarModalDia,
    handleMostrarMas,
  };
}
