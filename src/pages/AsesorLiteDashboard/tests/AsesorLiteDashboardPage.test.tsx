import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AsesorLiteDashboardPage } from "../AsesorLiteDashboardPage";
import { fmtCOP } from "../../../utils/formattersFunctions";

jest.mock(
  "@app/constants/ageBuckets",
  () => ({
    AGE_BUCKET_BY_KEY: {
      PV: { fillColor: "#10B981" },
      "30": { fillColor: "#FBBF24" },
      "60": { fillColor: "#F97316" },
      "90": { fillColor: "#EF4444" },
      "+90": { fillColor: "#B91C1C" },
    },
  }),
  { virtual: true },
);

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function moveToNextMonday(date: Date): Date {
  const weekDay = date.getDay();
  if (weekDay === 1) return date;
  const daysUntilMonday = weekDay === 0 ? 1 : 8 - weekDay;
  return addDays(date, daysUntilMonday);
}

function computeEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getColombiaHolidayKeys(year: number): Set<string> {
  const keys = new Set<string>();
  const addHoliday = (date: Date) => keys.add(getDateKey(date));
  const addObservedHoliday = (month: number, day: number) => addHoliday(moveToNextMonday(new Date(year, month - 1, day)));

  addHoliday(new Date(year, 0, 1));
  addHoliday(new Date(year, 4, 1));
  addHoliday(new Date(year, 6, 20));
  addHoliday(new Date(year, 7, 7));
  addHoliday(new Date(year, 11, 8));
  addHoliday(new Date(year, 11, 25));

  addObservedHoliday(1, 6);
  addObservedHoliday(3, 19);
  addObservedHoliday(6, 29);
  addObservedHoliday(8, 15);
  addObservedHoliday(10, 12);
  addObservedHoliday(11, 1);
  addObservedHoliday(11, 11);

  const easterSunday = computeEasterSunday(year);
  addHoliday(addDays(easterSunday, -3));
  addHoliday(addDays(easterSunday, -2));
  addHoliday(addDays(easterSunday, 43));
  addHoliday(addDays(easterSunday, 64));
  addHoliday(addDays(easterSunday, 71));

  return keys;
}

function getRemainingWorkingDays(now: Date): number {
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const holidayKeys = getColombiaHolidayKeys(year);
  let remainingIncludingToday = 0;

  for (let day = 1; day <= lastDay; day += 1) {
    const currentDate = new Date(year, month, day);
    const weekDay = currentDate.getDay();
    if (weekDay === 0) continue;
    if (holidayKeys.has(getDateKey(currentDate))) continue;
    if (day >= today) remainingIncludingToday += 1;
  }

  return remainingIncludingToday;
}

function getExpectedWorkingProgress(now: Date): string {
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const holidayKeys = getColombiaHolidayKeys(year);
  let total = 0;
  let elapsedClosed = 0;

  for (let day = 1; day <= lastDay; day += 1) {
    const currentDate = new Date(year, month, day);
    const weekDay = currentDate.getDay();
    if (weekDay === 0) continue;
    if (holidayKeys.has(getDateKey(currentDate))) continue;
    total += 1;
    if (day < today) elapsedClosed += 1;
  }

  const progress = total > 0 ? elapsedClosed / total : 0;
  return `${(progress * 100).toFixed(1).replace(".", ",")}%`;
}

function getCurrentDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const currentDateKey = getCurrentDateKey();
const mockConsultar = jest.fn();
const mockedNow = new Date(2026, 4, 2, 10, 0, 0);

const mockData = {
  cuentasTramos: [],
  gestiones: [
    {
      IdGestion: 1,
      cuenta: "130505011",
      cliente: "1001",
      numefac: "FAC-011",
      FechaGestion: currentDateKey,
      HoraGestion: "09:30:00",
      TipoContactoNombre: "Llamada",
      TipoContactoGrupo: "contacto efectivo",
      TieneEvento: 1,
      TieneCompromisoMonto: 1,
      EsPrincipalValor: 1,
      MontoCompromiso: 250000,
      TotalPagado: 50000,
      EstadoPagoCompromiso: "ACTIVO",
      EventoFuturo: 1,
      EventoVencido: 0,
      PagoCumplido: 0,
      PagoParcial: 1,
      GestionCumplida: 0,
      TramoCodigoCalc: "30",
      DiasVencidosCalc: 15,
      NombreTipoEvento: "Compromiso de pago",
    },
    {
      IdGestion: 2,
      cuenta: "130505007",
      cliente: "2002",
      numefac: "FAC-007",
      FechaGestion: currentDateKey,
      HoraGestion: "10:15:00",
      TipoContactoNombre: "WhastsApp",
      TipoContactoGrupo: "contacto efectivo",
      TieneEvento: 1,
      TieneCompromisoMonto: 1,
      EsPrincipalValor: 1,
      MontoCompromiso: 100000,
      TotalPagado: 0,
      EstadoPagoCompromiso: "SIN_PAGO",
      EventoFuturo: 0,
      EventoVencido: 1,
      PagoCumplido: 0,
      PagoParcial: 0,
      GestionCumplida: 0,
      TramoCodigoCalc: "60",
      DiasVencidosCalc: 45,
      NombreTipoEvento: "Seguimiento",
    },
  ],
  recaudos: [
    {
      CODICTA: "130505007",
      DESCCTA: "CARTERA A",
      TotalRecaudoMesActual: 30,
      TotalRecaudoMesAnterior: 50,
      RecaudoMesActual_Vencido: 10,
      TotalTransaccionesMesActual: 3,
      RecaudoMesActual_PV: 20,
      RecaudoMesActual_30: 10,
      RecaudoMesActual_60: 0,
      RecaudoMesActual_90: 0,
      RecaudoMesActual_90_MAS: 0,
    },
    {
      CODICTA: "130505011",
      DESCCTA: "CARTERA MOTOCICLETAS MONTELIBANO",
      TotalRecaudoMesActual: 47402000,
      TotalRecaudoMesAnterior: 56654500,
      RecaudoMesActual_Vencido: 42508000,
      TotalTransaccionesMesActual: 121,
      RecaudoMesActual_PV: 4894000,
      RecaudoMesActual_30: 36589000,
      RecaudoMesActual_60: 4953000,
      RecaudoMesActual_90: 966000,
      RecaudoMesActual_90_MAS: 0,
    },
  ],
  cartera: [
    {
      CODICTA: "130505007",
      PV: 100,
      "30": 50,
      "60": 0,
      "90": 0,
      "+90": 0,
      PV_Ant: 150,
      "30_Ant": 100,
      "60_Ant": 0,
      "90_Ant": 0,
      "+90_Ant": 0,
    },
    {
      CODICTA: "130505011",
      PV: 1093436015,
      "30": 62573500,
      "60": 3875000,
      "90": 1478000,
      "+90": 5997400,
      PV_Ant: 1140938514,
      "30_Ant": 8828000,
      "60_Ant": 2444000,
      "90_Ant": 796000,
      "+90_Ant": 5201400,
    },
  ],
};

const mockHookState = {
  currentUser: { id: 1, fullName: "Asesor Demo", username: "demo", role: "Asesor" },
  currentUserId: "1",
  data: mockData,
  consultar: mockConsultar,
  lastUpdatedAtMs: mockedNow.getTime(),
  loading: false,
  error: null as string | null,
};

jest.mock("../hooks/useAsesorLiteDashboard", () => ({
  useAsesorLiteDashboard: () => mockHookState,
}));

describe("AsesorLiteDashboardPage", () => {
  beforeEach(() => {
    mockConsultar.mockReset();
    Object.assign(mockHookState, {
      currentUser: { id: 1, fullName: "Asesor Demo", username: "demo", role: "Asesor" },
      currentUserId: "1",
      data: mockData,
      consultar: mockConsultar,
      lastUpdatedAtMs: mockedNow.getTime(),
      loading: false,
      error: null,
    });
  });

  it("renders the advisor collection dashboard layout", () => {
    render(
      <MemoryRouter>
        <AsesorLiteDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Panel de cobranza · Asesor")).toBeInTheDocument();
    expect(screen.getByText("Días hábiles restantes")).toBeInTheDocument();
    expect(screen.getByText(/cartera y meta de recaudo por edad/i)).toBeInTheDocument();
    expect(screen.getByText(/gestión del mes frente a la meta/i)).toBeInTheDocument();
    expect(screen.getByText(/gestiones realizadas y compromisos/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/seleccionar cuenta del dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /todas las cuentas/i })).toBeInTheDocument();
    expect(screen.queryByText(/ticket promedio/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Consultar" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/indicar usuario para consultar dashboard/i)).not.toBeInTheDocument();
  });

  it("applies the global account filter to kpis and age table", () => {
    render(
      <MemoryRouter>
        <AsesorLiteDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByText(/consolidado de todas las cuentas/i)).toHaveLength(2);

    fireEvent.change(screen.getByLabelText(/seleccionar cuenta del dashboard/i), {
      target: { value: "130505011" },
    });

    expect(screen.getAllByText(/mostrando cartera motocicletas montelibano/i)).toHaveLength(2);

    const thirtyRow = screen.getByText("1 a 30 días").closest("tr");
    expect(thirtyRow).not.toBeNull();

    const sixtyRow = screen.getByText("31 a 60 días").closest("tr");
    expect(sixtyRow).not.toBeNull();

    const ninetyRow = screen.getByText("61 a 90 días").closest("tr");
    expect(ninetyRow).not.toBeNull();

    const plusNinetyRow = screen.getByText("Más de 90 días").closest("tr");
    expect(plusNinetyRow).not.toBeNull();

    const totalRow = screen.getByText("Total general").closest("tr");
    expect(totalRow).not.toBeNull();

    const tramo30Row = thirtyRow!;
    expect(within(tramo30Row).getByText(fmtCOP(62573500))).toBeInTheDocument();
    expect(within(tramo30Row).getByText(fmtCOP(8828000))).toBeInTheDocument();
    expect(within(tramo30Row).getByText(fmtCOP(36589000))).toBeInTheDocument();
    expect(within(tramo30Row).getByText(fmtCOP(53745500))).toBeInTheDocument();

    const tramo60Row = sixtyRow!;
    expect(within(tramo60Row).getByText(fmtCOP(3875000))).toBeInTheDocument();
    expect(within(tramo60Row).getByText(fmtCOP(2444000))).toBeInTheDocument();
    expect(within(tramo60Row).getByText(fmtCOP(4953000))).toBeInTheDocument();
    expect(within(tramo60Row).getByText(fmtCOP(1431000))).toBeInTheDocument();

    const tramo90Row = ninetyRow!;
    expect(within(tramo90Row).getByText(fmtCOP(1478000))).toBeInTheDocument();
    expect(within(tramo90Row).getByText(fmtCOP(796000))).toBeInTheDocument();
    expect(within(tramo90Row).getByText(fmtCOP(966000))).toBeInTheDocument();
    expect(within(tramo90Row).getByText(fmtCOP(682000))).toBeInTheDocument();

    const tramoPlus90Row = plusNinetyRow!;
    expect(within(tramoPlus90Row).getByText(fmtCOP(5997400))).toBeInTheDocument();
    expect(within(tramoPlus90Row).getByText(fmtCOP(5201400))).toBeInTheDocument();
    expect(within(tramoPlus90Row).getByText(fmtCOP(0))).toBeInTheDocument();
    expect(within(tramoPlus90Row).getByText(fmtCOP(796000))).toBeInTheDocument();

    const row = totalRow!;
    expect(within(row).getByText(fmtCOP(73923900))).toBeInTheDocument();
    expect(within(row).getByText(fmtCOP(17269400))).toBeInTheDocument();
    expect(within(row).getByText(fmtCOP(42508000))).toBeInTheDocument();
    expect(within(row).getByText(fmtCOP(56654500))).toBeInTheDocument();

    const metaCard = screen.getByText("Meta de recaudo").closest(".asesor-mockup-kpi");
    const recaudadoCard = screen.getByText("Gestión / recaudado").closest(".asesor-mockup-kpi");
    const faltanteCard = screen.getByText("Faltante para la meta").closest(".asesor-mockup-kpi");
    const diarioCard = screen.getByText("Recaudo diario requerido").closest(".asesor-mockup-kpi");
    const monthCard = screen.getByText(/gestión del mes frente a la meta/i).closest("section");
    const remainingDays = getRemainingWorkingDays(new Date());
    const expectedWorkingProgress = getExpectedWorkingProgress(new Date());
    const overdueSaldo = 62573500 + 3875000 + 1478000 + 5997400;
    const overdueRecaudado = 36589000 + 4953000 + 966000;
    const overdueFaltante = 53745500 + 1431000 + 682000 + 796000;
    const expectedMeta = overdueSaldo + overdueRecaudado;
    const coveredAmount = expectedMeta - overdueFaltante;
    const coveredPct = `${((coveredAmount / expectedMeta) * 100).toFixed(1).replace(".", ",")}%`;

    expect(metaCard).not.toBeNull();
    expect(recaudadoCard).not.toBeNull();
    expect(faltanteCard).not.toBeNull();
    expect(diarioCard).not.toBeNull();
    expect(monthCard).not.toBeNull();

    expect(within(metaCard!).getByText(fmtCOP(expectedMeta))).toBeInTheDocument();
    expect(within(recaudadoCard!).getByText(fmtCOP(overdueRecaudado))).toBeInTheDocument();
    expect(within(faltanteCard!).getByText(fmtCOP(overdueFaltante))).toBeInTheDocument();
    expect(within(diarioCard!).getByText(fmtCOP(overdueFaltante / remainingDays))).toBeInTheDocument();
    expect(within(monthCard!).getAllByText(coveredPct).length).toBeGreaterThan(0);
    expect(within(monthCard!).getByText(`${fmtCOP(coveredAmount)} · ${coveredPct}`)).toBeInTheDocument();
    expect(within(monthCard!).getByText(expectedWorkingProgress)).toBeInTheDocument();
  });

  it("removes the monthly breakdown when the filter is global", () => {
    render(
      <MemoryRouter>
        <AsesorLiteDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: /ver desglose por cuenta/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/desglose por cuenta de gestión del mes frente a la meta/i)).not.toBeInTheDocument();
  });

  it("keeps gestiones y compromisos visible when filtering by account", () => {
    render(
      <MemoryRouter>
        <AsesorLiteDashboardPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/seleccionar cuenta del dashboard/i), {
      target: { value: "130505011" },
    });

    expect(screen.getByText(/gestiones del día · vínculos con clientes/i)).toBeInTheDocument();
    expect(screen.getByText(/hoy ·/i)).toBeInTheDocument();
    expect(screen.getByText("Llamadas")).toBeInTheDocument();
    expect(screen.getByText("1001")).toBeInTheDocument();
    expect(screen.getByText(fmtCOP(250000))).toBeInTheDocument();
  });

  it("preserves negative falta values in the age table, total row and top kpi", () => {
    render(
      <MemoryRouter>
        <AsesorLiteDashboardPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/seleccionar cuenta del dashboard/i), {
      target: { value: "130505007" },
    });

    const thirtyRow = screen.getByText("1 a 30 días").closest("tr");
    const totalRow = screen.getByText("Total general").closest("tr");
    const faltanteCard = screen.getByText("Faltante para la meta").closest(".asesor-mockup-kpi");

    expect(thirtyRow).not.toBeNull();
    expect(totalRow).not.toBeNull();
    expect(faltanteCard).not.toBeNull();

    expect(within(thirtyRow!).getByText(fmtCOP(-50, true))).toBeInTheDocument();
    expect(within(totalRow!).getByText(fmtCOP(-50, true))).toBeInTheDocument();
    expect(within(faltanteCard!).getByText(fmtCOP(-50, true))).toBeInTheDocument();
    expect(within(thirtyRow!).getByText(fmtCOP(-50, true))).toHaveClass("asesor-mockup-text--green");
    expect(within(totalRow!).getByText(fmtCOP(-50, true))).toHaveClass("asesor-mockup-text--green");
  });

  it("shows the numeric user id field only for administrators and uses it in the query", () => {
    mockHookState.currentUser = {
      id: 1,
      fullName: "Administrador Demo",
      username: "admin",
      role: "Administrador",
    };

    render(
      <MemoryRouter>
        <AsesorLiteDashboardPage />
      </MemoryRouter>,
    );

    const input = screen.getByLabelText(/indicar usuario para consultar dashboard/i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "25" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));
    fireEvent.click(screen.getByRole("button", { name: "Forzar" }));

    expect(mockConsultar).toHaveBeenNthCalledWith(1, { force: false, userId: 25 });
    expect(mockConsultar).toHaveBeenNthCalledWith(2, { force: true, userId: 25 });
  });
});
