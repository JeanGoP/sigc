import React, { useRef, useState, useEffect, useCallback } from "react";
import "./GestionCobroLayout.css";
import {
  useGestionFacturaService,
} from "@app/services/GestionFacturaService";
// import { obtenerCliente, ClienteInfo } from "@app/services/ClienteService";
import { useClienteService } from "@app/services/ClienteService";
import { useAppSelector } from "@app/store/store";
import { useConsultaCarteraService } from "@app/services/ConsultaCartera/ConsultaCarteraServices";
import { ConsultaCarteraBitacoraTab } from "./components/ConsultaCarteraBitacoraTab";
import { ConsultaCarteraGestionFab } from "./components/ConsultaCarteraGestionFab";
import { ConsultaCarteraInfoTab } from "./components/ConsultaCarteraInfoTab";
import { ConsultaCarteraRuntimeModals } from "./components/ConsultaCarteraRuntimeModals";
import { ConsultaCarteraSeguimientoTab } from "./components/ConsultaCarteraSeguimientoTab";
import { ConsultaCarteraSidebar } from "./components/ConsultaCarteraSidebar";
import { ConsultaCarteraTabsShell } from "./components/ConsultaCarteraTabsShell";
import { getCurrentTabId } from "@app/services/GestionLlamadas";
import { useConsultaCarteraController } from "./hooks/useConsultaCarteraController";
import { useConsultaCarteraGestionSession } from "./hooks/useConsultaCarteraGestionSession";
import { useConsultaCarteraMail } from "./hooks/useConsultaCarteraMail";
import { useExportCarteraCsv } from "./hooks/useExportCarteraCsv";
import { useConsultaCarteraSelectedSummaryProps } from "./hooks/useConsultaCarteraSelectedSummaryProps";
import { useConsultaCarteraSeguimiento } from "./hooks/useConsultaCarteraSeguimiento";
import { useConsultaCarteraTelephony } from "./hooks/useConsultaCarteraTelephony";
import { buildConsultaCarteraSidebarColumns } from "./domain/sidebarColumns";
// import { ScoringVisual } from "./components/score";

export const ConsultaCartera: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [intMora, setIntMora] = useState<string>("3.00");
  const [MenuFiltrosState, setMenuFiltrosState] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const {
    loading: loadingCliente,
    obtenerCliente,
  } = useClienteService();

  const {
    buscarGestiones,
    GestionarFactura,
    loadingInsertar,
  } = useGestionFacturaService();

  const { getFacturasList, getListTemplate, sendWithTemplate, loading } =
    useConsultaCarteraService();

  const {
    activeTab,
    clienteInfo,
    fechaConsultaFacturas,
    filtroSaldoCero,
    isSeguimientoDraftOpen,
    montoEventoSugerido,
    registroSeleccionado,
    selectedValue,
    tablaFacturasRef,
    tablaLoading,
    tablaPage,
    tablaRows,
    tablaRowsPerPage,
    tablaSearch,
    tablaTotalRows,
    totalSaldoCartera,
    fetchFacturas,
    handleBuscar,
    handleClicLupaBuscar,
    handleFechaFiltroChange,
    handleSeleccionarFactura,
    setActiveTab,
    setIsSeguimientoDraftOpen,
    setRegistroSeleccionado,
    setSelectedValue,
    setTablaPage,
    setTablaRowsPerPage,
    setTablaSearch,
  } = useConsultaCarteraController({
    currentUserId: currentUser?.id,
    getFacturasList,
    obtenerCliente,
  });

  const { exportToCsv, exporting } = useExportCarteraCsv({
    getFacturasList,
    currentUserId: currentUser?.id,
    fechaConsultaFacturas,
    tablaSearch,
  });

  const hasFullSelection = Boolean(
    registroSeleccionado?.cliente &&
      registroSeleccionado?.numefac &&
      registroSeleccionado?.cuenta
  );
  const selectedCliente = String(registroSeleccionado?.cliente ?? "").trim();
  const selectedFactura = String(registroSeleccionado?.numefac ?? "").trim();
  const selectedCuenta = String(registroSeleccionado?.cuenta ?? "").trim();
  const tabId = getCurrentTabId();
  const {
    activeGestionSession,
    currentContextGestionSession,
    fabDisabled,
    fabLabel,
    gestionElapsedLabel,
    gestionOperativaActiva,
    gestionStatusLabel,
    handleConfirmSwitchToSelectedContext,
    handleContinueCurrentActiveGestion,
    handleGestionSessionFabClick,
    handleHideGestionConflictModal,
    hasActiveGestionInContext,
    hasLiveCall,
    isSwitchingGestionContext,
    listInProgressGestionSessions,
    loadingStartGestionSession,
    loadingTransitionGestionSession,
    refreshSessions,
    showGestionConflictModal,
    switchBlockedReason,
  } = useConsultaCarteraGestionSession({
    hasFullSelection,
    selectedCliente,
    selectedFactura,
    selectedCuenta,
    isSeguimientoDraftOpen,
    setActiveTab,
    setIsSeguimientoDraftOpen,
    setRegistroSeleccionado,
    setSelectedValue,
    setTablaSearch,
    tabId,
  });
  const telephonyEnabled = Boolean(currentUser?.telephonyEnabled);
  const numeroPrincipalCliente = String(clienteInfo?.telefono ?? "").trim();
  const {
    alternatePhoneLabel,
    alternatePhoneObservation,
    canStartOutboundCall,
    dialDestination,
    handleAttachPendingInboundToActiveSession,
    handleCloseOutboundCallModal,
    handleCloseSaveAlternatePhoneModal,
    handleDismissWrongNumberInbound,
    handleOpenOutboundCallModal,
    handleSubmitOutboundCallModal,
    handleSubmitSaveAlternatePhone,
    hasPendingInboundCalls,
    isAssociatingInboundCall,
    isCallInProgress,
    isDialDestinationSelected,
    loadingGuardarTelefonoAlterno,
    loadingTelefonosAlternos,
    nextPendingInboundCall,
    openWhatsApp,
    pendingSaveAlternatePhonePrompt,
    setAlternatePhoneLabel,
    setAlternatePhoneObservation,
    setDialDestination,
    setWrongNumHovered,
    showOutboundCallModal,
    showSaveAlternatePhoneModal,
    startCallBlockedReason,
    telefonosAlternosActivos,
    wrongNumHovered,
  } = useConsultaCarteraTelephony({
    activeGestionSession,
    telephonyEnabled,
    gestionOperativaActiva,
    hasLiveCall,
    numeroPrincipalCliente,
    selectedCliente,
  });
  const {
    enviandoCorreo,
    handleCerrarModalCorreo,
    handleEnviarCorreo,
    handlePrevisualizarCorreo,
    plantillaSeleccionadaKey,
    plantillasApi,
    setPlantillaSeleccionadaKey,
    showModalCorreo,
  } = useConsultaCarteraMail({
    currentUserId: currentUser?.id,
    fechaConsultaFacturas,
    getListTemplate,
    hasFullSelection,
    selectedCliente,
    selectedFactura,
    selectedCuenta,
    sendWithTemplate,
  });

  const collapseHandler = useCallback(() => {
    setCollapsed((previousValue) => !previousValue);
    // remor
  }, []);

  useEffect(() => {
    if (
      !loading &&
      inputRef.current &&
      inputRef.current.offsetParent !== null
    ) {
      inputRef.current.focus();
    }
  }, [tablaLoading]);
  const {
    canSaveSeguimiento,
    handleNuevoSeguimiento,
    isSaveRequestInFlight,
    saveSeguimientoBlockedReason,
    seguimientoDraftStorageKey,
    seguimientos,
  } = useConsultaCarteraSeguimiento({
    currentUser,
    registroSeleccionado,
    hasFullSelection,
    activeGestionSession,
    gestionOperativaActiva,
    isCallInProgress,
    hasPendingInboundCalls,
    isAssociatingInboundCall,
    loadingInsertar,
    tabId,
    buscarGestiones,
    GestionarFactura,
    listInProgressGestionSessions,
    refreshSessions,
    setIsSeguimientoDraftOpen,
  });

  const columns = buildConsultaCarteraSidebarColumns({
    onBuscarRow: handleClicLupaBuscar,
  });
  const selectedClientSummaryProps = useConsultaCarteraSelectedSummaryProps({
    loadingCliente,
    selectedValue,
    currentUser,
    telephonyEnabled,
    canStartOutboundCall,
    isCallInProgress,
    startCallBlockedReason,
    plantillaSeleccionadaKey,
    plantillasApi,
    hasPendingInboundCalls,
    nextPendingInboundFrom: nextPendingInboundCall?.from ?? undefined,
    gestionOperativaActiva,
    isAssociatingInboundCall,
    isSaveRequestInFlight,
    loadingTransitionGestionSession,
    wrongNumHovered,
    onOpenOutboundCallModal: handleOpenOutboundCallModal,
    onOpenWhatsApp: openWhatsApp,
    onPlantillaChange: setPlantillaSeleccionadaKey,
    onPreviewCorreo: handlePrevisualizarCorreo,
    onAttachPendingInboundToActiveSession: handleAttachPendingInboundToActiveSession,
    onDismissWrongNumberInbound: handleDismissWrongNumberInbound,
    onWrongNumHoverChange: setWrongNumHovered,
  });

  const handleMenuFiltrosStateChange = (): void => {
    setMenuFiltrosState(!MenuFiltrosState);
    fetchFacturas();
  };

  const infoTabContent = (
    <ConsultaCarteraInfoTab
      fechaConsultaFacturas={fechaConsultaFacturas}
      onFechaConsultaFacturasChange={handleFechaFiltroChange}
      intMora={intMora}
      onIntMoraChange={setIntMora}
      selectedCliente={selectedCliente}
      selectedFactura={selectedFactura}
      selectedCuenta={selectedCuenta}
      currentUserId={Number(currentUser?.id ?? 0)}
      clienteInfo={clienteInfo}
      selectedClientSummaryProps={selectedClientSummaryProps}
      selectedValue={selectedValue}
      filtroSaldoCero={filtroSaldoCero}
      tablaFacturasRef={tablaFacturasRef}
      onSelectFactura={handleSeleccionarFactura}
    />
  );

  const seguimientoTabContent = (
    <ConsultaCarteraSeguimientoTab
      seguimientos={seguimientos}
      onNuevoSeguimiento={handleNuevoSeguimiento}
      onBuscar={handleBuscar}
      isSeguimientoDraftOpen={isSeguimientoDraftOpen}
      onSeguimientoDraftOpenChange={setIsSeguimientoDraftOpen}
      seguimientoDraftStorageKey={seguimientoDraftStorageKey}
      canSaveSeguimiento={canSaveSeguimiento}
      saveSeguimientoBlockedReason={saveSeguimientoBlockedReason}
      currentUserId={Number(currentUser?.id ?? 0)}
      selectedCliente={selectedCliente}
      selectedFactura={selectedFactura}
      selectedCuenta={selectedCuenta}
      montoEventoSugerido={montoEventoSugerido}
    />
  );

  const bitacoraTabContent = (
    <ConsultaCarteraBitacoraTab
      hasFullSelection={hasFullSelection}
      selectedCliente={selectedCliente}
      selectedFactura={selectedFactura}
      selectedCuenta={selectedCuenta}
    />
  );

  return (
    <div>
      {/* <ContentHeader title="Consulta de Cartera" /> */}
      <section className="content">
        <div className="container-fluid">
          <div className="row" style={{ height: "100vh" }}>
            <ConsultaCarteraSidebar
              collapsed={collapsed}
              menuFiltrosState={MenuFiltrosState}
              inputRef={inputRef}
              tablaSearch={tablaSearch}
              tablaLoading={tablaLoading}
              columns={columns}
              tablaRows={tablaRows}
              tablaTotalRows={tablaTotalRows}
              totalSaldoCartera={totalSaldoCartera}
              tablaRowsPerPage={tablaRowsPerPage}
              tablaPage={tablaPage}
              hasFullSelection={hasFullSelection}
              registroSeleccionado={registroSeleccionado}
              onSearchChange={setTablaSearch}
              onFetchFacturas={fetchFacturas}
              onToggleFilters={handleMenuFiltrosStateChange}
              onToggleCollapsed={collapseHandler}
              onRowsPerPageChange={setTablaRowsPerPage}
              onPageChange={setTablaPage}
              onExportToCsv={exportToCsv}
              exporting={exporting}
              onRowEnter={(row) => {
                handleClicLupaBuscar(row);
              }}
            />

            <div className="col main-panel">
              <ConsultaCarteraTabsShell
                activeTab={activeTab}
                selectedFacturaLabel={String(registroSeleccionado?.numefac ?? "")}
                hasFullSelection={hasFullSelection}
                infoContent={infoTabContent}
                seguimientoContent={seguimientoTabContent}
                bitacoraContent={bitacoraTabContent}
                onSelect={setActiveTab}
              />
            </div>
          </div>
        </div>
      </section>
      <ConsultaCarteraGestionFab
        hasActiveGestionInContext={hasActiveGestionInContext}
        gestionStatusLabel={gestionStatusLabel}
        gestionElapsedLabel={gestionElapsedLabel}
        gestionOperativaActiva={gestionOperativaActiva}
        fabDisabled={fabDisabled}
        loadingStartGestionSession={loadingStartGestionSession}
        isSwitchingGestionContext={isSwitchingGestionContext}
        fabLabel={fabLabel}
        onFabClick={handleGestionSessionFabClick}
      />

      <ConsultaCarteraRuntimeModals
        gestionConflictModalProps={{
          show: showGestionConflictModal,
          activeSession: activeGestionSession,
          targetCliente: selectedCliente,
          targetFactura: selectedFactura,
          targetCuenta: selectedCuenta,
          targetHasExistingSession: Boolean(currentContextGestionSession),
          blockedReason: switchBlockedReason,
          switching: isSwitchingGestionContext,
          onContinueActive: handleContinueCurrentActiveGestion,
          onConfirmSwitch: () => {
            void handleConfirmSwitchToSelectedContext();
          },
          onHide: handleHideGestionConflictModal,
        }}
        outboundCallModalProps={{
          show: showOutboundCallModal,
          dialDestination,
          loadingTelefonosAlternos,
          numeroPrincipalCliente,
          telefonosAlternosActivos,
          canStartOutboundCall,
          isCallInProgress,
          isPhoneSelected: isDialDestinationSelected,
          onHide: handleCloseOutboundCallModal,
          onSubmit: handleSubmitOutboundCallModal,
          onDialDestinationChange: setDialDestination,
          onSelectPhone: setDialDestination,
        }}
        saveAlternatePhoneModalProps={{
          show: showSaveAlternatePhoneModal,
          loadingGuardarTelefonoAlterno,
          pendingSaveAlternatePhonePrompt,
          alternatePhoneLabel,
          alternatePhoneObservation,
          onHide: handleCloseSaveAlternatePhoneModal,
          onSubmit: handleSubmitSaveAlternatePhone,
          onAlternatePhoneLabelChange: setAlternatePhoneLabel,
          onAlternatePhoneObservationChange: setAlternatePhoneObservation,
        }}
        mailConfirmationModalProps={{
          show: showModalCorreo,
          enviandoCorreo,
          onHide: handleCerrarModalCorreo,
          onConfirm: handleEnviarCorreo,
        }}
      />
    </div>
  );
};
