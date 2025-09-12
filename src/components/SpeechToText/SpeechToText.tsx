import React, { useEffect, useRef } from "react";
// @ts-ignore
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { Button, Alert, Spinner, OverlayTrigger, Tooltip } from "react-bootstrap";

interface HotkeyConfig {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // cmd en mac
  key: string; // tecla principal, por ejemplo 'm'
}

interface SpeechToTextProps {
  onResult: (text: string) => void; // callback al padre
  value?: string; // texto actual en el padre para sincronizar acumulación
  toggleHotkey?: HotkeyConfig; // combinación para alternar escuchar/detener
}

const SpeechToText: React.FC<SpeechToTextProps> = ({ onResult, value, toggleHotkey }) => {
  const {
    interimTranscript,
    finalTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Acumulador local para ir concatenando resultados finales y enviarlos al padre
  const accumulatedRef = useRef<string>("");

  // Mantener sincronizado el acumulador con el valor actual del padre
  useEffect(() => {
    if (typeof value === "string") {
      accumulatedRef.current = value;
    }
  }, [value]);

  const getHotkeyConfig = (): HotkeyConfig => toggleHotkey || { ctrl: true, key: "m" };

  const formatHotkey = (config: HotkeyConfig): string => {
    const parts: string[] = [];
    if (config.ctrl) parts.push("Ctrl");
    if (config.shift) parts.push("Shift");
    if (config.alt) parts.push("Alt");
    if (config.meta) parts.push("Cmd");
    parts.push(config.key.toUpperCase());
    return parts.join("+");
  };

  // Manejar hotkey para alternar grabación
  useEffect(() => {
    const config = getHotkeyConfig();

    const matchesHotkey = (e: KeyboardEvent) => {
      const keyMatches = e.key.toLowerCase() === config.key.toLowerCase();
      // Requerimos solo los modificadores especificados como true; ignoramos los no especificados
      const ctrlOk = !config.ctrl || e.ctrlKey;
      const shiftOk = !config.shift || e.shiftKey;
      const altOk = !config.alt || e.altKey;
      const metaOk = !config.meta || e.metaKey;
      return keyMatches && ctrlOk && shiftOk && altOk && metaOk;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!matchesHotkey(e)) return;
      console.log("[SpeechToText] Hotkey detectada:", formatHotkey(config), {
        key: e.key,
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey,
      });
      e.preventDefault();
      if (listening) {
        console.log("[SpeechToText] Deteniendo escucha por atajo");
        stopListening();
      } else {
        if (typeof value === "string") {
          accumulatedRef.current = value;
        }
        console.log("[SpeechToText] Iniciando escucha por atajo");
        startListening();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleHotkey, listening, value]);

  // Cada vez que llega un bloque final reconocido, se concatena y se informa al padre
  useEffect(() => {
    if (!finalTranscript) return;
    const textToAdd = finalTranscript.trim();
    if (!textToAdd) return;

    const needsSpace = accumulatedRef.current && !accumulatedRef.current.endsWith(" ");
    accumulatedRef.current = `${accumulatedRef.current}${needsSpace ? " " : ""}${textToAdd}`;
    onResult(accumulatedRef.current);

    // Limpiamos el transcript interno para evitar duplicaciones en siguientes bloques
    resetTranscript();
  }, [finalTranscript, onResult, resetTranscript]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <Alert variant="danger" className="text-center">
        <Alert.Heading>⚠️ Navegador no compatible</Alert.Heading>
        <p className="mb-0">
          Tu navegador no soporta Speech Recognition. 
          Por favor, usa Chrome, Firefox o Safari para esta funcionalidad.
        </p>
      </Alert>
    );
  }

  const startListening = () => {
    // Asegurar que partimos del valor más reciente del padre
    if (typeof value === "string") {
      accumulatedRef.current = value;
    }
    SpeechRecognition.startListening({ language: "es-ES", continuous: true });
  };

  const stopListening = () => SpeechRecognition.stopListening();

  return (
    <>
      {!browserSupportsSpeechRecognition ? (
        <Alert variant="danger" className="text-center">
          <Alert.Heading>⚠️ Navegador no compatible</Alert.Heading>
          <p className="mb-0">
            Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari.
          </p>
        </Alert>
      ) : (
        <>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="sst-hotkey-tip">Atajo: {formatHotkey(getHotkeyConfig())}</Tooltip>}
          >
            <Button
              variant={listening ? "danger" : "success"}
              onClick={listening ? stopListening : startListening}
              className="d-inline-flex align-items-center"
              title={`Atajo: ${formatHotkey(getHotkeyConfig())}`}
            >
              {listening ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Detener
                </>
              ) : (
                <>
                  <i className="fas fa-microphone me-2"></i>
                  Escuchar
                </>
              )}
            </Button>
          </OverlayTrigger>
          <small className="text-muted ms-2">[{formatHotkey(getHotkeyConfig())}]</small>
        </>
      )}
    </>
  );
};

export default SpeechToText;
