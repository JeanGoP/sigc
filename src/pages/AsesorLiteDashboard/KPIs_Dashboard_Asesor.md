# KPIs propuestos — Dashboard de Asesores (Motivación / Presión de desempeño)

## Objetivo de negocio
Este tablero lo consumen los **asesores** para auto-monitorear su desempeño:
- **Cómo van en el mes (MTD)**: avance acumulado y comparación contra el mes anterior (en recaudos).
- **Cómo van hoy (HOY)**: actividad y efectividad intradía para “ritmo” y presión operativa.

La fuente de verdad es el endpoint:
- `POST /api/v1/dashboard/asesor` (payload: `{ userId }`)

## Fuentes de datos disponibles en la API
La respuesta entrega:
- `gestiones[]` (tabla/resultado #2 del SP)
- `recaudos[]` (tabla/resultado #3 del SP)
- `cuentasTramos[]` (tabla/resultado #1 del SP) (auxiliar; no requerida para la mayoría de KPIs)

### 1) `gestiones[]` (grano: gestión)
Campos relevantes (nombres según dataset; en algunos casos pueden venir en mayúsculas/minúsculas):
- Identificadores:
  - `IdGestion`
  - Cliente: `cliente` o `CLIENTE` o `IDCLIPRV`
  - Cuenta: `cuenta` o `Cuenta` o `CUENTA` o `CODICTA`
  - Factura: `numefac` o `NUMEFAC` o `factura`
- Temporal:
  - `FechaHora` (datetime)
  - `FechaGestion` (date)
  - `HoraGestion` (time)
- Segmentación y categóricos:
  - `TipoContactoGrupo`
  - `TipoContactoNombre` (o `TipoContactoCodigo`)
  - `NombreTipoEvento`
  - `TramoCodigoCalc` (p.ej. PV/30/60/90/+90)
  - `DiasVencidosCalc`
- Flags/estado:
  - `TieneEvento`, `EventoVencido`, `EventoFuturo`
  - `TieneCompromisoMonto`
  - `PagoCumplido`, `PagoParcial`, `GestionCumplida`
  - `EstadoPagoCompromiso`
  - `EsPrincipalValor` (clave para evitar doble conteo monetario)
- Montos:
  - `MontoCompromiso`
  - `TotalPagado`

### 2) `recaudos[]` (grano: cuenta, mes actual vs mes anterior)
Campos relevantes:
- Cuenta: `CODICTA`, `DESCCTA`
- Totales:
  - `TotalRecaudoMesActual`, `TotalRecaudoMesAnterior`
  - `Diferencia`, `PorcentajeVariacion`
- Mix mes actual por “edad”:
  - `RecaudoMesActual_PV`, `RecaudoMesActual_30`, `RecaudoMesActual_60`, `RecaudoMesActual_90`, `RecaudoMesActual_90_MAS`
  - `RecaudoMesActual_SinEdad`
  - `RecaudoMesActual_Vencido`, `RecaudoMesActual_Vencido_Porc`
- Volumen:
  - `TotalTransaccionesMesActual`, `TotalTransaccionesMesAnterior`
  - `FacturasRecaudadasMesActual`
  - `CuentasConRecaudoMesActual`

## Definiciones operativas (importantes)
### Definición de HOY
Se define “HOY” por:
- `gestiones.FechaGestion = Today()` (formato `YYYY-MM-DD`)

Esto evita ambigüedades de zona horaria en `FechaHora`.

### Definición de MTD (mes a la fecha)
Se asume que el SP retorna **todo lo del mes**. Aun así, si se requiere robustez:
- `MONTH(FechaGestion) = MONTH(Today()) AND YEAR(FechaGestion) = YEAR(Today())`

### Regla anti doble conteo monetario en gestiones
Todo KPI monetario basado en `gestiones` debe aplicar:
- `EsPrincipalValor = 1`

## Benchmarks (umbrales) sin metas externas
Para “presionar” sin depender de metas externas, se usan benchmarks internos calculables con la misma API:
- **Promedio diario MTD**:
  - `avgDailyMTD = totalMTD / diasConDatosMTD`
  - `diasConDatosMTD = COUNT_DISTINCT(FechaGestion en el mes)`
- **Clasificación HOY vs Promedio MTD**:
  - Positivo: `HOY >= 110% * avgDailyMTD`
  - Neutro: `90%–110% * avgDailyMTD`
  - Negativo: `HOY < 90% * avgDailyMTD`

> Nota: el promedio se calcula con “días con datos”, no con días calendario, para que sea comparable.

---

# KPIs esenciales (prioridad alta)

## A) Actividad (HOY y MTD)

### KPI A1 — Gestiones HOY
- **Definición:** número de gestiones realizadas hoy.
- **Fórmula:** `COUNT_DISTINCT(IdGestion) WHERE FechaGestion = HOY`
- **Campos:** `gestiones.IdGestion`, `gestiones.FechaGestion`
- **Relevancia:** presión directa de volumen diario.
- **Umbrales:** HOY vs `avgDailyMTD` (ver Benchmarks).
- **Visual recomendado:** tarjeta grande + semáforo + delta vs promedio.
- **Frecuencia:** cada 1–5 min (o manual).

### KPI A2 — Clientes únicos HOY
- **Definición:** clientes distintos gestionados hoy.
- **Fórmula:** `COUNT_DISTINCT(cliente) WHERE FechaGestion = HOY`
- **Campos:** `cliente|CLIENTE|IDCLIPRV`, `FechaGestion`
- **Relevancia:** evita “inflar” con múltiples gestiones al mismo cliente.
- **Umbrales:** HOY vs `avgDailyMTD` (mismo esquema A1).
- **Visual:** tarjeta + semáforo.
- **Frecuencia:** 1–5 min (o manual).

### KPI A3 — Gestiones MTD
- **Definición:** total de gestiones del mes.
- **Fórmula:** `COUNT_DISTINCT(IdGestion)`
- **Campos:** `IdGestion`
- **Relevancia:** avance acumulado del mes.
- **Umbrales:** usar tendencia con HOY y proyección simple:
  - `proyeccionFinMes = (totalMTD / diasConDatosMTD) * diasCalendarioMes`
  - Positivo: proyección creciente vs el propio promedio histórico (si se guarda), si no, neutro.
- **Visual:** tarjeta + “proyección fin de mes”.
- **Frecuencia:** 15–60 min (o manual).

## B) Efectividad (HOY y MTD)

### KPI B1 — % Gestiones HOY con compromiso
- **Definición:** proporción de gestiones de hoy que generan compromiso con monto.
- **Fórmula:** `SUM(TieneCompromisoMonto=1)/COUNT(IdGestion) WHERE FechaGestion=HOY`
- **Campos:** `TieneCompromisoMonto`, `IdGestion`, `FechaGestion`
- **Relevancia:** mide calidad del trabajo (no solo volumen).
- **Umbrales sugeridos:** >35% positivo, 20–35% neutro, <20% negativo.
- **Visual:** tarjeta % + semáforo.
- **Frecuencia:** 1–5 min (o manual).

### KPI B2 — Monto comprometido HOY (principal)
- **Definición:** suma de montos comprometidos hoy (sin doble conteo).
- **Fórmula:** `SUM(MontoCompromiso WHERE EsPrincipalValor=1 AND FechaGestion=HOY)`
- **Campos:** `MontoCompromiso`, `EsPrincipalValor`, `FechaGestion`
- **Relevancia:** output monetario diario.
- **Umbrales:** HOY vs `avgDailyMTD` de “monto comprometido”.
- **Visual:** tarjeta monetaria + semáforo.
- **Frecuencia:** 1–5 min (o manual).

### KPI B3 — Tasa de pago monetaria MTD (principal)
- **Definición:** qué porcentaje del monto comprometido ya fue pagado (mes).
- **Fórmula:** `SUM(TotalPagado)/SUM(MontoCompromiso)` filtrando `EsPrincipalValor=1`
- **Campos:** `TotalPagado`, `MontoCompromiso`, `EsPrincipalValor`
- **Relevancia:** KPI núcleo: convierte compromisos en pago real.
- **Umbrales sugeridos:** >80% positivo, 60–80% neutro, <60% negativo.
- **Visual:** tarjeta % + barra de progreso.
- **Frecuencia:** 15–60 min (o manual).

### KPI B4 — Saldo pendiente MTD (principal)
- **Definición:** monto comprometido aún no pagado.
- **Fórmula:** `SUM(MAX(0, MontoCompromiso - TotalPagado))` con `EsPrincipalValor=1`
- **Campos:** `MontoCompromiso`, `TotalPagado`, `EsPrincipalValor`
- **Relevancia:** backlog; alimenta la priorización.
- **Umbrales:** como % de comprometido:
  - Positivo: `<20%`
  - Neutro: `20–40%`
  - Negativo: `>40%`
- **Visual:** tarjeta monetaria + % del comprometido.
- **Frecuencia:** 15–60 min (o manual).

## C) Disciplina / riesgo (HOY)

### KPI C1 — % Eventos vencidos HOY
- **Definición:** proporción de gestiones de hoy con evento vencido.
- **Fórmula:** `SUM(EventoVencido=1)/COUNT(IdGestion) WHERE FechaGestion=HOY`
- **Campos:** `EventoVencido`, `IdGestion`, `FechaGestion`
- **Relevancia:** presión de disciplina y foco en pendientes críticos.
- **Umbrales sugeridos:** <10% positivo, 10–20% neutro, >20% negativo.
- **Visual:** tarjeta % + semáforo.
- **Frecuencia:** 1–5 min (o manual).

### KPI C2 — Mix HOY por tramo de mora
- **Definición:** distribución de gestiones de hoy por `TramoCodigoCalc`.
- **Fórmula:** `COUNT(*) GROUP BY TramoCodigoCalc WHERE FechaGestion=HOY`
- **Campos:** `TramoCodigoCalc`, `FechaGestion`
- **Relevancia:** evidencia el enfoque del día (prevención vs mora dura).
- **Umbrales (alerta):** si `(%90 + %+90) > 30%` del día → revisar estrategia (ajustable).
- **Visual:** barras horizontales apiladas (100%).
- **Frecuencia:** 1–5 min (o manual).

## D) Ritmo intradía (HOY)

### KPI D1 — Gestiones por hora (HOY)
- **Definición:** cantidad de gestiones hoy, segmentadas por hora.
- **Fórmula:** `COUNT(*) GROUP BY HOUR(HoraGestion) WHERE FechaGestion=HOY`
- **Campos:** `HoraGestion`, `FechaGestion`
- **Relevancia:** empuja ritmo (si “va lento” temprano, se ve).
- **Umbrales:** comparar la hora actual contra el promedio MTD en esa misma hora (si se calcula).
- **Visual:** línea o barras por hora con “hora actual” destacada.
- **Frecuencia:** 1–5 min.

---

# KPIs de recaudo (MTD, comparativo) — prioridad alta

## E) Recaudo del mes (recaudos[])

### KPI E1 — Recaudo mes actual (total)
- **Definición:** recaudo total del mes actual.
- **Fórmula:** `SUM(TotalRecaudoMesActual)`
- **Campos:** `recaudos.TotalRecaudoMesActual`
- **Relevancia:** resultado monetario principal del mes.
- **Umbrales:** se interpreta con E2/E3.
- **Visual:** tarjeta monetaria.
- **Frecuencia:** diario o al consultar.

### KPI E2 — Variación vs mes anterior (valor y %)
- **Definición:** cambio de recaudo vs mes anterior.
- **Fórmula:**
  - Valor: `SUM(actual) - SUM(anterior)`
  - %: `(SUM(actual)-SUM(anterior))/NULLIF(SUM(anterior),0)`
- **Campos:** `TotalRecaudoMesActual`, `TotalRecaudoMesAnterior`
- **Relevancia:** motivación por mejora/deterioro.
- **Umbrales sugeridos (%):** >+5% positivo, -5% a +5% neutro, <-5% negativo.
- **Visual:** tarjeta + flecha + color.
- **Frecuencia:** diario o al consultar.

### KPI E3 — % Recaudo aplicado a vencido (mes actual)
- **Definición:** proporción del recaudo del mes que fue a cartera vencida.
- **Fórmula:** `SUM(RecaudoMesActual_Vencido)/SUM(TotalRecaudoMesActual)`
- **Campos:** `RecaudoMesActual_Vencido`, `TotalRecaudoMesActual`
- **Relevancia:** mide foco en saneamiento (o mezcla).
- **Umbrales:** ajustable por política; sugerido: <30% bajo foco en vencido, 30–60% balance, >60% alto foco.
- **Visual:** dona “Vencido vs No vencido”.
- **Frecuencia:** diario o al consultar.

### KPI E4 — Mix de recaudo por edad (mes actual)
- **Definición:** distribución del recaudo por tramo (PV/30/60/90/+90/SinEdad).
- **Fórmula:** para cada X:
  - `SUM(RecaudoMesActual_X)` y `% = SUM(X)/SUM(TotalRecaudoMesActual)`
- **Campos:** `RecaudoMesActual_PV`, `_30`, `_60`, `_90`, `_90_MAS`, `_SinEdad`
- **Relevancia:** muestra composición del recaudo y cambios de estrategia.
- **Umbrales:** alerta si `90_MAS% > 25%` (ajustable).
- **Visual:** barras apiladas 100% o dona.
- **Frecuencia:** diario o al consultar.

### KPI E5 — Ticket promedio (recaudo por transacción)
- **Definición:** valor promedio por transacción en el mes actual.
- **Fórmula:** `SUM(TotalRecaudoMesActual)/NULLIF(SUM(TotalTransaccionesMesActual),0)`
- **Campos:** `TotalRecaudoMesActual`, `TotalTransaccionesMesActual`
- **Relevancia:** eficiencia de cobro (muchas transacciones pequeñas vs pocas grandes).
- **Umbrales:** sin histórico, neutro; si se guarda histórico, usar comparación.
- **Visual:** tarjeta monetaria pequeña.
- **Frecuencia:** diario o al consultar.

---

# Resúmenes accionables (listas)

## F) Lista “Presión” (HOY)
- **Definición:** top de casos críticos a gestionar.
- **Construcción:** ordenar `gestiones` con score interno usando:
  - `EventoVencido`, `TramoCodigoCalc`, `DiasVencidosCalc`, `EstadoPagoCompromiso`, `TieneCompromisoMonto`, `MontoCompromiso`, `TotalPagado`
  - filtrado por `FechaGestion=HOY` o “pendientes” (según regla de negocio).
- **Relevancia:** convierte KPIs en acción.
- **Visual:** tabla con 10–20 filas + botón “Gestionar”.

## G) Top cuentas por recaudo (MTD)
- **Definición:** ranking de cuentas por `TotalRecaudoMesActual`.
- **Campos:** `CODICTA`, `DESCCTA`, `TotalRecaudoMesActual`
- **Relevancia:** foco en cuentas de mayor aporte y variación.
- **Visual:** tabla Top 10 + variación.

---

# Notas de implementación (para que sea consistente)
- Normalizar números: campos pueden venir como string; convertir a number y tratar `null` como 0.
- Comparaciones de fecha: usar `FechaGestion` (no `FechaHora`) para HOY.
- Ratios: calcular como `SUM(numerador) / SUM(denominador)` (no promediar porcentajes fila a fila).
- Evitar división por cero con `NULLIF`/guardas.

# Recomendación de layout mínimo (para motivar/presionar)
- Fila superior: A1, A2, B1, C1 (HOY) con semáforo vs promedio MTD.
- Segunda fila: B2 (monto HOY), D1 (ritmo por hora), C2 (mix por tramo HOY).
- Bloque MTD: B3, B4, E1, E2.
- Tablas: “Presión” (F) y “Top cuentas por recaudo” (G).

---

# Guía para agregar/modificar KPIs (mantenibilidad)
## Dónde se calcula
- Lógica de cálculo: `src/pages/AsesorLiteDashboard/domain/kpis.ts` (función `computeAsesorLiteDashboardKpis`).
- Consumo/caché: `src/pages/AsesorLiteDashboard/hooks/useAsesorLiteDashboard.ts`.
- UI: `src/pages/AsesorLiteDashboard/AsesorLiteDashboardPage.tsx`.

## Pasos recomendados
1. Añade el KPI como campo tipado en `AsesorLiteDashboardKpis` (domain).
2. Implementa el cálculo dentro de `computeAsesorLiteDashboardKpis` (idealmente en una sola pasada por `gestiones[]` o `recaudos[]`).
3. Agrega pruebas unitarias en `src/pages/AsesorLiteDashboard/domain/kpis.test.ts`.
4. Renderiza el KPI en la UI (tarjeta, barra, tabla) y, si aplica, añade paginación para listas largas.
5. Re-ejecuta `pnpm -C "sigc produccion" typecheck` y `pnpm -C "sigc produccion" test:ci`.
