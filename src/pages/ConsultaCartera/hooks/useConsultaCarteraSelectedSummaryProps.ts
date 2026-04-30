import { useMemo } from "react";
import { SelectedClientSummary } from "../components/SelectedClientSummary";

type SelectedClientSummaryProps = Omit<
  React.ComponentProps<typeof SelectedClientSummary>,
  "clienteInfo"
>;

interface CurrentUserLike {
  id?: string | number | null;
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
}

interface UseConsultaCarteraSelectedSummaryPropsOptions {
  loadingCliente: boolean;
  selectedValue: string;
  currentUser: CurrentUserLike | null | undefined;
  telephonyEnabled: boolean;
  canStartOutboundCall: boolean;
  isCallInProgress: boolean;
  startCallBlockedReason: string;
  plantillaSeleccionadaKey: string;
  plantillasApi: { key: string; nombre: string }[];
  hasPendingInboundCalls: boolean;
  nextPendingInboundFrom?: string;
  gestionOperativaActiva: boolean;
  isAssociatingInboundCall: boolean;
  isSaveRequestInFlight: boolean;
  loadingTransitionGestionSession: boolean;
  wrongNumHovered: boolean;
  onOpenOutboundCallModal: () => void;
  onOpenWhatsApp: (telefono: string) => void;
  onPlantillaChange: (key: string) => void;
  onPreviewCorreo: () => void;
  onAttachPendingInboundToActiveSession: () => Promise<void>;
  onDismissWrongNumberInbound: () => Promise<void>;
  onWrongNumHoverChange: (hovered: boolean) => void;
}

export function useConsultaCarteraSelectedSummaryProps({
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
  nextPendingInboundFrom,
  gestionOperativaActiva,
  isAssociatingInboundCall,
  isSaveRequestInFlight,
  loadingTransitionGestionSession,
  wrongNumHovered,
  onOpenOutboundCallModal,
  onOpenWhatsApp,
  onPlantillaChange,
  onPreviewCorreo,
  onAttachPendingInboundToActiveSession,
  onDismissWrongNumberInbound,
  onWrongNumHoverChange,
}: UseConsultaCarteraSelectedSummaryPropsOptions): SelectedClientSummaryProps {
  return useMemo(
    () => ({
      loadingCliente,
      selectedValue,
      currentUserId: Number(currentUser?.id ?? 0),
      currentUserName: String(currentUser?.fullName ?? currentUser?.email ?? ""),
      isAdmin: String(currentUser?.role ?? "").trim().toLowerCase() === "administrador",
      telephonyEnabled,
      canStartOutboundCall,
      isCallInProgress,
      startCallBlockedReason,
      plantillaSeleccionadaKey,
      plantillasApi,
      hasPendingInboundCalls,
      nextPendingInboundFrom,
      gestionOperativaActiva,
      isAssociatingInboundCall,
      isSaveRequestInFlight,
      loadingTransitionGestionSession,
      wrongNumHovered,
      onOpenOutboundCallModal,
      onOpenWhatsApp,
      onPlantillaChange,
      onPreviewCorreo,
      onAttachPendingInboundToActiveSession: () => {
        void onAttachPendingInboundToActiveSession();
      },
      onDismissWrongNumberInbound: () => {
        void onDismissWrongNumberInbound();
      },
      onWrongNumHoverChange,
    }),
    [
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
      nextPendingInboundFrom,
      gestionOperativaActiva,
      isAssociatingInboundCall,
      isSaveRequestInFlight,
      loadingTransitionGestionSession,
      wrongNumHovered,
      onOpenOutboundCallModal,
      onOpenWhatsApp,
      onPlantillaChange,
      onPreviewCorreo,
      onAttachPendingInboundToActiveSession,
      onDismissWrongNumberInbound,
      onWrongNumHoverChange,
    ]
  );
}
