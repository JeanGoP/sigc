import {
  getDomingoPascua,
  getFestivosColombia,
  esDomingo,
  obtenerFestivoNacional,
  validarDiaParaEvento,
  getMensajeDiaInvalidoEvento,
} from "./colombianHolidays";

describe("colombianHolidays utility", () => {
  test("calcula el Domingo de Pascua correctamente para 2026 y 2025", () => {
    const pascua2026 = getDomingoPascua(2026);
    expect(pascua2026.getFullYear()).toBe(2026);
    expect(pascua2026.getMonth()).toBe(3); // Abril (0-indexado)
    expect(pascua2026.getDate()).toBe(5);

    const pascua2025 = getDomingoPascua(2025);
    expect(pascua2025.getFullYear()).toBe(2025);
    expect(pascua2025.getMonth()).toBe(3); // Abril
    expect(pascua2025.getDate()).toBe(20);
  });

  test("obtiene exactamente 18 festivos en el año 2026", () => {
    const festivos = getFestivosColombia(2026);
    expect(festivos.length).toBe(18);

    const nombres = festivos.map((f) => f.nombre);
    expect(nombres).toContain("Año Nuevo");
    expect(nombres).toContain("Día del Trabajo");
    expect(nombres).toContain("Jueves Santo");
    expect(nombres).toContain("Viernes Santo");
    expect(nombres).toContain("Batalla de Boyacá");
    expect(nombres).toContain("Navidad");
    expect(nombres).toContain("Reyes Magos");
    expect(nombres).toContain("Corpus Christi");
  });

  test("verifica traslados de la Ley Emiliani en 2026", () => {
    // 6 de Enero (martes) se traslada al lunes 12 de Enero
    const reyes = obtenerFestivoNacional("2026-01-12");
    expect(reyes).not.toBeNull();
    expect(reyes?.nombre).toBe("Reyes Magos");

    // El 6 de Enero no es el festivo observado
    expect(obtenerFestivoNacional("2026-01-06")).toBeNull();

    // 20 de Julio es lunes en 2026 (fijo)
    const independencia = obtenerFestivoNacional("2026-07-20");
    expect(independencia).not.toBeNull();
    expect(independencia?.nombre).toBe("Día de la Independencia");

    // 7 de Agosto (Batalla de Boyacá - fijo)
    const boyaca = obtenerFestivoNacional("2026-08-07");
    expect(boyaca).not.toBeNull();
    expect(boyaca?.nombre).toBe("Batalla de Boyacá");
  });

  test("detecta domingos correctamente", () => {
    expect(esDomingo("2026-05-17")).toBe(true); // Domingo
    expect(esDomingo("2026-05-18")).toBe(false); // Lunes
    expect(esDomingo("2026-05-19")).toBe(false); // Martes
  });

  test("validarDiaParaEvento bloquea domingos y festivos, pero aprueba días hábiles", () => {
    // Domingo común
    const resDomingo = validarDiaParaEvento("2026-05-17");
    expect(resDomingo.noHabil).toBe(true);
    expect(resDomingo.tipo).toBe("DOMINGO");

    // Festivo (2026-05-01 Día del Trabajo)
    const resFestivo = validarDiaParaEvento("2026-05-01");
    expect(resFestivo.noHabil).toBe(true);
    expect(resFestivo.tipo).toBe("FESTIVO");
    expect(resFestivo.motivo).toContain("Día del Trabajo");

    // Día hábil normal (Miércoles 2026-05-13)
    const resHabil = validarDiaParaEvento("2026-05-13");
    expect(resHabil.noHabil).toBe(false);
    expect(resHabil.motivo).toBeNull();
  });

  test("getMensajeDiaInvalidoEvento produce el mensaje esperado", () => {
    const msg = getMensajeDiaInvalidoEvento("2026-12-25");
    expect(msg).toContain("Navidad");
    expect(msg).toContain("No se pueden programar eventos");

    const msgHabil = getMensajeDiaInvalidoEvento("2026-06-10");
    expect(msgHabil).toBeNull();
  });
});
