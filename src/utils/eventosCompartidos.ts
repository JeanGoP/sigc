export interface EventoRequerimientosLike {
  requiereFecha?: boolean;
  requiereHora?: boolean;
  requiereMonto?: boolean;
}

export interface HoraDisponibleLike {
  hora: number;
  minuto: number;
  ocupado?: boolean;
}

interface AplicarReseteosParams<
  T extends Record<string, unknown>,
  FechaKey extends keyof T,
  HoraKey extends keyof T,
  MontoKey extends keyof T,
> {
  state: T;
  requerimientos?: EventoRequerimientosLike | null;
  fechaKey: FechaKey;
  fechaVacia: T[FechaKey];
  horaKey: HoraKey;
  horaVacia: T[HoraKey];
  montoKey: MontoKey;
  montoVacio: T[MontoKey];
}

export function aplicarReseteosPorRequerimientosEvento<
  T extends Record<string, unknown>,
  FechaKey extends keyof T,
  HoraKey extends keyof T,
  MontoKey extends keyof T,
>({
  state,
  requerimientos,
  fechaKey,
  fechaVacia,
  horaKey,
  horaVacia,
  montoKey,
  montoVacio,
}: AplicarReseteosParams<T, FechaKey, HoraKey, MontoKey>): T {
  const next = { ...state };

  if (!requerimientos?.requiereFecha) {
    next[fechaKey] = fechaVacia;
  }

  if (!requerimientos?.requiereHora) {
    next[horaKey] = horaVacia;
  }

  if (!requerimientos?.requiereMonto) {
    next[montoKey] = montoVacio;
  }

  return next;
}

export function estaHoraOcupada(
  horaSeleccionada: string | null | undefined,
  horasDisponibles: readonly HoraDisponibleLike[],
): boolean {
  if (!horaSeleccionada) {
    return false;
  }

  const [hora, minuto] = horaSeleccionada.split(":").map(Number);

  if (!Number.isFinite(hora) || !Number.isFinite(minuto)) {
    return false;
  }

  return horasDisponibles.some(
    (item) => item.hora === hora && item.minuto === minuto && Boolean(item.ocupado),
  );
}
