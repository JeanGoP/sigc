import {
  buildGestionFacturaSaveRequest,
  buildSaveSeguimientoBlockedReason,
  buildSeguimientoDraftStorageKey,
  buildSeguimientoSelection,
  canSaveSeguimiento,
  hasMatchingSeguimientoContext,
  mapGestionesFacturaResultToSeguimientos,
} from "./seguimiento";

describe("seguimiento domain helpers", () => {
  it("builds the seguimiento selection only when all keys exist", () => {
    expect(
      buildSeguimientoSelection({
        cliente: "123",
        numefac: "F001",
        cuenta: "C001",
      })
    ).toEqual({
      cliente: "123",
      factura: "F001",
      cuenta: "C001",
    });

    expect(
      buildSeguimientoSelection({
        cliente: "123",
        numefac: "F001",
      })
    ).toBeNull();
  });

  it("maps gestiones y eventos al timeline", () => {
    const result = mapGestionesFacturaResultToSeguimientos({
      gestiones: [
        {
          id: 7,
          numefac: "F001",
          cliente: "123",
          cuenta: "C001",
          usuario: 99,
          fechaHora: "2026-04-26T14:35:00",
          descripcion: "Seguimiento creado",
          tipoContacto: "2",
          idGrabacionLlamada: "rec-1",
        },
      ],
      eventos: [
        {
          id: 10,
          idGestion: 7,
          cliente: "123",
          idUsuarioAsignado: null,
          tipoEvento: "Pago",
          color: "#123456",
          icono: "fas fa-money-bill",
          fechaHoraProgramada: "2026-04-27T09:00:00",
          descripcion: "",
          montoCompromiso: 25000,
          cumplido: true,
          fechaCumplimiento: null,
        },
      ],
    });

    expect(result).toEqual([
      {
        id: 7,
        usuario: "99",
        fecha: "2026-04-26",
        hora: "14:35",
        texto: "Seguimiento creado",
        detalle: "Seguimiento creado",
        tipoContacto: "2",
        grabacion: "rec-1",
        eventos: [
          {
            id: 10,
            tipo: "Pago",
            fecha: "2026-04-27",
            hora: "09:00",
            color: "#123456",
            icono: "fas fa-money-bill",
            valor: 25000,
            cumplido: true,
          },
        ],
      },
    ]);
  });

  it("builds the draft storage key with the stable contract", () => {
    expect(
      buildSeguimientoDraftStorageKey({
        tenantId: "tenant-a",
        userId: 8,
        sessionRef: "session-1",
        cliente: "123",
        factura: "F001",
        cuenta: "C001",
      })
    ).toBe("sigc.gestion.seguimiento-draft:tenant-a:8:session-1:123:F001:C001");

    expect(
      buildSeguimientoDraftStorageKey({
        tenantId: "tenant-a",
        userId: 8,
        sessionRef: "",
        cliente: "123",
        factura: "F001",
        cuenta: "C001",
      })
    ).toBeUndefined();

    expect(
      buildSeguimientoDraftStorageKey({
        tenantId: "tenant-a",
        userId: 8,
        sessionRef: "session-1",
        cliente: "123",
        factura: "F002",
        cuenta: "C001",
      })
    ).toBe("sigc.gestion.seguimiento-draft:tenant-a:8:session-1:123:F002:C001");
  });

  it("computes the save block reason and canSaveSeguimiento", () => {
    const blockedState = {
      gestionOperativaActiva: false,
      isCallInProgress: false,
      hasPendingInboundCalls: false,
      isAssociatingInboundCall: false,
      isSaveRequestInFlight: false,
    };

    expect(buildSaveSeguimientoBlockedReason(blockedState)).toBe(
      "Debes iniciar una gestión activa antes de guardar seguimiento."
    );
    expect(canSaveSeguimiento(blockedState)).toBe(false);

    expect(
      canSaveSeguimiento({
        gestionOperativaActiva: true,
        isCallInProgress: false,
        hasPendingInboundCalls: false,
        isAssociatingInboundCall: false,
        isSaveRequestInFlight: false,
      })
    ).toBe(true);
  });

  it("compares active session context and builds the save request", () => {
    const selection = {
      cliente: "123",
      factura: "F001",
      cuenta: "C001",
    };

    expect(
      hasMatchingSeguimientoContext(
        {
          cliente: "123",
          factura: "F001",
          cuenta: "C001",
        },
        selection
      )
    ).toBe(true);

    expect(
      buildGestionFacturaSaveRequest({
        registroSeleccionado: selection,
        currentUserId: 15,
        seguimiento: {
          texto: "Seguimiento final",
          detalle: "Seguimiento final",
          eventos: [],
          tipoContacto: 3,
          grabacion: null,
        },
        eventosXml: "<Evento />",
        activeSessionId: 99,
        activeSessionRef: "session-1",
        idempotencyKey: "save-1",
        tabId: "tab-1",
      })
    ).toEqual({
      numefac: "F001",
      cliente: "123",
      cuenta: "C001",
      usuario: 15,
      descripcion: "Seguimiento final",
      tipoContacto: 3,
      eventos: "<Eventos><Evento /></Eventos>",
      idGrabacionLlamada: "",
      idGestionSession: 99,
      sessionRef: "session-1",
      idempotencyKey: "save-1",
      source: "consulta_cartera_save",
      tabId: "tab-1",
    });
  });
});
