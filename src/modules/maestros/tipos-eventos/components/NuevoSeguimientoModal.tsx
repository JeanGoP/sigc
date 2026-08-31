import React from "react";
import { Button, Modal } from "react-bootstrap";
import type { HoraDispItem } from "@app/services/ConsultaCartera/HorasDispDiaService";
import type { Evento, TipoEventoOption } from "../domain/types";
import { EventoProgramadoForm } from "./EventoProgramadoForm";
import { EventosProgramadosList } from "./EventosProgramadosList";
import { NuevoSeguimientoModalFooter } from "./NuevoSeguimientoModalFooter";
import { SeguimientoTextSection } from "./SeguimientoTextSection";
import { TipoContactoSection } from "./TipoContactoSection";

interface NuevoSeguimientoModalProps {
  show: boolean;
  texto: string;
  tipoContacto: string | number;
  eventos: Evento[];
  adjuntos: File[];
  isUploadingAdjuntos: boolean;
  tiposEvento: TipoEventoOption[];
  formEvento: Evento;
  editIndex: number | null;
  errorValidacion: string | null;
  horasDisponibles: HoraDispItem[];
  loadingHoras: boolean;
  loadingEvento: boolean;
  isValidatingEvent: boolean;
  isGuardarDisabled: boolean;
  guardarBlockedReason: string;
  onTextoChange: (value: string) => void;
  onTipoContactoChange: (value: string | number) => void;
  onTipoEventoChange: (value: string | number) => void;
  onFormCampoChange: (campo: keyof Evento, valor: Evento[keyof Evento]) => void;
  onAgregarEvento: () => void;
  onActualizarEvento: () => void;
  onCancelarEdicion: () => void;
  onEditarEvento: (index: number) => void;
  onEliminarEvento: (index: number) => void;
  onAdjuntosAdd: (files: FileList | null) => void;
  onAdjuntoRemove: (index: number) => void;
  onGuardar: () => void;
  onCerrar: () => void;
}

export function NuevoSeguimientoModal({
  show,
  texto,
  tipoContacto,
  eventos,
  adjuntos,
  isUploadingAdjuntos,
  tiposEvento,
  formEvento,
  editIndex,
  errorValidacion,
  horasDisponibles,
  loadingHoras,
  loadingEvento,
  isValidatingEvent,
  isGuardarDisabled,
  guardarBlockedReason,
  onTextoChange,
  onTipoContactoChange,
  onTipoEventoChange,
  onFormCampoChange,
  onAgregarEvento,
  onActualizarEvento,
  onCancelarEdicion,
  onEditarEvento,
  onEliminarEvento,
  onAdjuntosAdd,
  onAdjuntoRemove,
  onGuardar,
  onCerrar,
}: NuevoSeguimientoModalProps) {
  const maxAdjuntosPorSeguimiento = 2;
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewIndex, setPreviewIndex] = React.useState<number | null>(null);
  const [objectUrls, setObjectUrls] = React.useState<Record<string, string>>(
    {}
  );
  const objectUrlsRef = React.useRef<Record<string, string>>({});

  const getFileKey = React.useCallback((file: File) => {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }, []);

  React.useEffect(() => {
    setObjectUrls((prev) => {
      const next: Record<string, string> = {};

      for (const file of adjuntos) {
        const key = getFileKey(file);
        const existing = prev[key];
        next[key] = existing || URL.createObjectURL(file);
      }

      for (const [key, url] of Object.entries(prev)) {
        if (!(key in next)) {
          URL.revokeObjectURL(url);
        }
      }

      return next;
    });
  }, [adjuntos, getFileKey]);

  React.useEffect(() => {
    objectUrlsRef.current = objectUrls;
  }, [objectUrls]);

  React.useEffect(() => {
    return () => {
      for (const url of Object.values(objectUrlsRef.current)) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const safeFileLabel = (file: File) => {
    const name = String(file?.name ?? "").trim() || "archivo";
    const kb = Math.max(0, Math.round((file?.size ?? 0) / 1024));
    return `${name} (${kb} KB)`;
  };

  const buildPreviewModel = React.useCallback(
    (file: File | null) => {
      if (!file) {
        return null;
      }

      const key = getFileKey(file);
      const url = objectUrls[key];
      if (!url) {
        return null;
      }

      const type = String(file.type ?? "").toLowerCase();
      const isPdf = type === "application/pdf";
      const isImage = type.startsWith("image/");

      return { url, isPdf, isImage, name: file.name };
    },
    [getFileKey, objectUrls]
  );

  const previewFile = previewIndex !== null ? adjuntos[previewIndex] ?? null : null;
  const previewModel = buildPreviewModel(previewFile);

  return (
    <>
      <Modal
        show={show}
        onHide={onCerrar}
        centered
        size="xl"
        scrollable
        backdrop="static"
      >
        <Modal.Body style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: 20,
                color: "#1565c0",
              }}
            >
              Nuevo seguimiento
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#5f6b7a",
                marginTop: 4,
              }}
            >
              El borrador se conserva por gestion activa mientras no guardes.
            </div>
          </div>
          <Button
            variant="light"
            onClick={onCerrar}
            style={{ borderRadius: 999, padding: "4px 12px" }}
          >
            Cerrar
          </Button>
        </div>

        <div
          style={{
            background: "#e3f2fd",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: "1px solid #bbdefb",
          }}
        >
          <SeguimientoTextSection value={texto} onChange={onTextoChange} />

          <TipoContactoSection
            value={tipoContacto}
            onChange={onTipoContactoChange}
          />

          <div className="mb-3" style={{ padding: 0 }}>
            <label style={{ fontWeight: 500, marginBottom: 8 }}>
              Eventos programados
            </label>

            <EventoProgramadoForm
              tiposEvento={tiposEvento}
              formEvento={formEvento}
              editIndex={editIndex}
              horasDisponibles={horasDisponibles}
              loadingHoras={loadingHoras}
              loadingEvento={loadingEvento}
              isValidatingEvent={isValidatingEvent}
              onTipoEventoChange={onTipoEventoChange}
              onFormCampoChange={onFormCampoChange}
              onAgregarEvento={onAgregarEvento}
              onActualizarEvento={onActualizarEvento}
              onCancelarEdicion={onCancelarEdicion}
            />

            {errorValidacion && (
              <div style={{ color: "#d32f2f", fontSize: 12, marginBottom: 8 }}>
                {errorValidacion}
              </div>
            )}

            <EventosProgramadosList
              eventos={eventos}
              tiposEvento={tiposEvento}
              editIndex={editIndex}
              onEditarEvento={onEditarEvento}
              onEliminarEvento={onEliminarEvento}
            />
          </div>

          <div className="mb-3" style={{ padding: 0 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <label style={{ fontWeight: 500, marginBottom: 0 }}>
                Adjuntos (PDF o imágenes) (máx {maxAdjuntosPorSeguimiento})
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    onAdjuntosAdd(e.target.files);
                    if (e.currentTarget) {
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => inputRef.current?.click()}
                  disabled={isUploadingAdjuntos || adjuntos.length >= maxAdjuntosPorSeguimiento}
                >
                  Agregar archivos
                </Button>
              </div>
            </div>

            <div
              style={{
                border: "1px solid #dee2e6",
                borderRadius: 8,
                background: "#fff",
                padding: 12,
              }}
            >
              {adjuntos.length === 0 ? (
                <div style={{ fontSize: 13, color: "#6c757d" }}>
                  Sin adjuntos
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {adjuntos.map((file, idx) => (
                    <div
                      key={`${file.name}-${file.size}-${idx}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        border: "1px solid #f1f3f5",
                        borderRadius: 8,
                        padding: "8px 10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <div style={{ fontSize: 13, color: "#343a40" }}>
                          {safeFileLabel(file)}
                        </div>
                        {String(file?.type ?? "")
                          .toLowerCase()
                          .startsWith("image/") && (
                          <img
                            src={objectUrls[getFileKey(file)]}
                            alt={file.name}
                            style={{
                              width: 52,
                              height: 36,
                              objectFit: "cover",
                              borderRadius: 6,
                              border: "1px solid #e9ecef",
                            }}
                          />
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => {
                            setPreviewIndex(idx);
                            setPreviewOpen(true);
                          }}
                        >
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => onAdjuntoRemove(idx)}
                          disabled={isUploadingAdjuntos}
                        >
                          Quitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isUploadingAdjuntos && (
                <div style={{ fontSize: 12, color: "#6c757d", marginTop: 10 }}>
                  Subiendo adjuntos...
                </div>
              )}
            </div>
          </div>

          <NuevoSeguimientoModalFooter
            isGuardarDisabled={isGuardarDisabled}
            guardarBlockedReason={guardarBlockedReason}
            onGuardar={onGuardar}
            onCerrar={onCerrar}
          />
        </div>
        </Modal.Body>
      </Modal>

      <Modal
        show={previewOpen}
        onHide={() => setPreviewOpen(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton={true} {...({} as any)}>
          <Modal.Title>{previewModel?.name || "Vista previa"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!previewModel ? (
            <div style={{ color: "#6c757d" }}>No disponible</div>
          ) : previewModel.isImage ? (
            <img
              src={previewModel.url}
              alt={previewModel.name}
              style={{
                width: "100%",
                maxHeight: 520,
                objectFit: "contain",
                borderRadius: 8,
                border: "1px solid #e9ecef",
              }}
            />
          ) : previewModel.isPdf ? (
            <iframe
              title={previewModel.name}
              src={previewModel.url}
              style={{
                width: "100%",
                height: 520,
                border: "1px solid #e9ecef",
                borderRadius: 8,
              }}
            />
          ) : (
            <div style={{ color: "#6c757d" }}>
              Tipo de archivo no soportado para vista previa
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setPreviewOpen(false)}
            style={{ borderRadius: 6 }}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
