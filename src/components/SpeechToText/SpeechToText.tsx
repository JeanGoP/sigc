import React, { useEffect, useRef, useState } from "react";
import { Button, Spinner, OverlayTrigger, Tooltip } from "react-bootstrap";

interface HotkeyConfig {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // cmd en mac
  key: string; // tecla principal, por ejemplo 'm'
}

interface SpeechToTextProps {
  onResult: (text: string) => void; // callback al padre
  value?: string; // texto actual en el padre para sincronizar acumulacion
  toggleHotkey?: HotkeyConfig; // combinacion para alternar escuchar/detener
}

const SpeechToText: React.FC<SpeechToTextProps> = ({ onResult, value, toggleHotkey }) => {
  const [listening, setListening] = useState(false);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] =
    useState(true);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [interimText, setInterimText] = useState<string>("");

  // Acumulador local para ir concatenando resultados finales y enviarlos al padre
  const accumulatedRef = useRef<string>("");
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const valueRef = useRef(value);
  const listeningRequestedRef = useRef(false);
  const lastErrorRef = useRef<string | null>(null);

  // Mantener sincronizado el acumulador con el valor actual del padre
  useEffect(() => {
    if (typeof value === "string") {
      accumulatedRef.current = value;
    }
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const hasWindow = typeof window !== "undefined";
    const supported =
      hasWindow &&
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setBrowserSupportsSpeechRecognition(supported);
    setIsSecureContext(hasWindow ? window.isSecureContext : false);
  }, []);

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      console.warn(
        "[SpeechToText] Navegador no compatible con SpeechRecognition."
      );
    }
  }, [browserSupportsSpeechRecognition]);

  useEffect(() => {
    if (!isSecureContext) {
      console.warn(
        "[SpeechToText] Contexto no seguro. SpeechRecognition requiere HTTPS."
      );
    }
  }, [isSecureContext]);

  useEffect(() => {
    if (errorMessage) {
      console.error("[SpeechToText] Error:", errorMessage);
    }
  }, [errorMessage]);

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

  // Manejar hotkey para alternar grabacion
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

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      if (recognition) {
        try {
          recognition.onstart = null;
          recognition.onend = null;
          recognition.onerror = null;
          recognition.onresult = null;
          recognition.abort();
        } catch (err) {
          console.warn("[SpeechToText] abort() fallo:", err);
        }
      }
    };
  }, []);

  const formatSpeechError = (err: string): string => {
    switch (err) {
      case "not-allowed":
        return "Permiso de microfono denegado. Habilitalo en el candado del navegador.";
      case "service-not-allowed":
        return "El servicio de reconocimiento esta bloqueado por el navegador o la politica del sitio.";
      case "audio-capture":
        return "No se detecto microfono. Verifica el dispositivo y permisos.";
      case "no-speech":
        return "No se detecto voz. Intenta hablar mas cerca del microfono.";
      case "network":
        return "Error de red. Revisa tu conexion a Internet.";
      case "aborted":
        return "Reconocimiento detenido.";
      default:
        return "Error de reconocimiento de voz. Revisa permisos y soporte del navegador.";
    }
  };

  const buildRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return null;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setErrorMessage(null);
      lastErrorRef.current = null;
      console.log("[SpeechToText] Reconocimiento iniciado");
    };

    recognition.onend = () => {
      setListening(false);
      setInterimText("");
      console.log("[SpeechToText] Reconocimiento finalizado");
      const fatalErrors = ["not-allowed", "service-not-allowed", "audio-capture"];
      if (
        listeningRequestedRef.current &&
        !fatalErrors.includes(lastErrorRef.current || "")
      ) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (err) {
            console.warn("[SpeechToText] Error reintentando reconocimiento:", err);
          }
        }, 200);
      }
    };

    recognition.onerror = (event: any) => {
      const err = event?.error || "unknown";
      lastErrorRef.current = err;
      const msg = formatSpeechError(err);
      setErrorMessage(msg);
      console.error("[SpeechToText] Error reconocimiento:", err, event);
      if (err === "not-allowed" || err === "service-not-allowed") {
        listeningRequestedRef.current = false;
      }
    };

    recognition.onresult = (event: any) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript || "";
        if (result.isFinal) {
          finalChunk += transcript;
        } else {
          interimChunk += transcript;
        }
      }

      if (interimChunk) {
        setInterimText(interimChunk.trim());
      } else {
        setInterimText("");
      }

      const textToAdd = finalChunk.trim();
      if (!textToAdd) return;
      const needsSpace = accumulatedRef.current && !accumulatedRef.current.endsWith(" ");
      accumulatedRef.current = `${accumulatedRef.current}${needsSpace ? " " : ""}${textToAdd}`;
      onResultRef.current(accumulatedRef.current);
    };

    recognitionRef.current = recognition;
    return recognition;
  };

  const ensureMicrophoneAccess = async (): Promise<boolean> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Tu navegador no permite acceso al microfono.");
      return false;
    }
    const policy = (document as any).permissionsPolicy;
    if (policy && typeof policy.allowsFeature === "function") {
      if (!policy.allowsFeature("microphone")) {
        setErrorMessage(
          "El sitio bloquea microfono por Permissions-Policy. Revisa los headers."
        );
        return false;
      }
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch (err: any) {
      const name = err?.name || "";
      switch (name) {
        case "NotAllowedError":
          setErrorMessage(
            "Permiso de microfono denegado o bloqueado por el navegador."
          );
          break;
        case "NotFoundError":
          setErrorMessage("No se encontro un microfono disponible.");
          break;
        case "NotReadableError":
          setErrorMessage("No se puede acceder al microfono. Puede estar en uso.");
          break;
        case "SecurityError":
          setErrorMessage("Bloqueado por contexto inseguro o politica del sitio.");
          break;
        default:
          setErrorMessage("Error al acceder al microfono. Revisa permisos.");
          break;
      }
      return false;
    }
  };

  const startListening = async () => {
    if (!browserSupportsSpeechRecognition) {
      setErrorMessage("Tu navegador no soporta reconocimiento de voz.");
      return;
    }
    if (!isSecureContext) {
      setErrorMessage("El sitio no esta en un contexto seguro (HTTPS).");
      return;
    }
    setErrorMessage(null);
    const micOk = await ensureMicrophoneAccess();
    if (!micOk) return;
    listeningRequestedRef.current = true;
    // Asegurar que partimos del valor mas reciente del padre
    if (typeof valueRef.current === "string") {
      accumulatedRef.current = valueRef.current;
    }
    const recognition = buildRecognition();
    if (!recognition) {
      setErrorMessage("No se pudo inicializar el reconocimiento de voz.");
      return;
    }
    try {
      recognition.start();
    } catch (err) {
      console.warn("[SpeechToText] start() fallo:", err);
    }
  };

  const stopListening = () => {
    listeningRequestedRef.current = false;
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        console.warn("[SpeechToText] stop() fallo:", err);
      }
    }
  };

  return (
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
          disabled={!browserSupportsSpeechRecognition}
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
      {interimText && (
        <div className="text-muted mt-2" style={{ fontSize: 12 }}>
          {interimText}
        </div>
      )}
    </>
  );
};

export default SpeechToText;
