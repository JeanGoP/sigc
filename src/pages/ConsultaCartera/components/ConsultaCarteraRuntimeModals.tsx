import React from "react";
import GestionSessionConflictModal from "./GestionSessionConflictModal";
import { MailConfirmationModal } from "./MailConfirmationModal";
import { OutboundCallModal } from "./OutboundCallModal";
import { SaveAlternatePhoneModal } from "./SaveAlternatePhoneModal";

interface ConsultaCarteraRuntimeModalsProps {
  gestionConflictModalProps: React.ComponentProps<typeof GestionSessionConflictModal>;
  outboundCallModalProps: React.ComponentProps<typeof OutboundCallModal>;
  saveAlternatePhoneModalProps: React.ComponentProps<typeof SaveAlternatePhoneModal>;
  mailConfirmationModalProps: React.ComponentProps<typeof MailConfirmationModal>;
}

export function ConsultaCarteraRuntimeModals({
  gestionConflictModalProps,
  outboundCallModalProps,
  saveAlternatePhoneModalProps,
  mailConfirmationModalProps,
}: ConsultaCarteraRuntimeModalsProps) {
  return (
    <>
      <GestionSessionConflictModal {...gestionConflictModalProps} />
      <OutboundCallModal {...outboundCallModalProps} />
      <SaveAlternatePhoneModal {...saveAlternatePhoneModalProps} />
      <MailConfirmationModal {...mailConfirmationModalProps} />
    </>
  );
}
