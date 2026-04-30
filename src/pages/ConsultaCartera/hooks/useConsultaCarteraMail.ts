import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import type { ApiResponse } from "@app/models/apiResponse";
import type { PlantillaCorreo } from "@app/services/ConsultaCartera/ConsultaCarteraServices";
import {
  buildConsultaCarteraMailPayload,
  getDefaultPlantillaCorreoKey,
  normalizePlantillasCorreo,
} from "../domain/mail";

interface UseConsultaCarteraMailOptions {
  currentUserId?: string | number | null;
  fechaConsultaFacturas: string;
  getListTemplate: (
    tipo: string
  ) => Promise<ApiResponse<PlantillaCorreo[]> | null>;
  hasFullSelection: boolean;
  selectedCliente: string;
  selectedFactura: string;
  selectedCuenta: string;
  sendWithTemplate: (
    body: Record<string, unknown>
  ) => Promise<ApiResponse<unknown> | null>;
}

export function useConsultaCarteraMail({
  currentUserId,
  fechaConsultaFacturas,
  getListTemplate,
  hasFullSelection,
  selectedCliente,
  selectedFactura,
  selectedCuenta,
  sendWithTemplate,
}: UseConsultaCarteraMailOptions) {
  const templatesLoadedRef = useRef(false);

  const [plantillasApi, setPlantillasApi] = useState<PlantillaCorreo[]>([]);
  const [plantillaSeleccionadaKey, setPlantillaSeleccionadaKey] =
    useState<string>("");
  const [showModalCorreo, setShowModalCorreo] = useState(false);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);

  useEffect(() => {
    if (templatesLoadedRef.current) {
      return;
    }

    templatesLoadedRef.current = true;
    let active = true;

    const fetchPlantillas = async () => {
      const data = await getListTemplate("email");
      if (!active) {
        return;
      }

      if (data?.success && Array.isArray(data.data)) {
        const plantillas = normalizePlantillasCorreo(data.data);
        setPlantillasApi(plantillas);
        if (plantillas.length > 0) {
          setPlantillaSeleccionadaKey(getDefaultPlantillaCorreoKey(plantillas));
        }
        return;
      }

      toast.error("No se pudieron cargar las plantillas");
    };

    void fetchPlantillas();

    return () => {
      active = false;
    };
  }, [getListTemplate]);

  const handlePrevisualizarCorreo = useCallback(() => {
    setShowModalCorreo(true);
  }, []);

  const handleCerrarModalCorreo = useCallback(() => {
    if (enviandoCorreo) {
      return;
    }

    setShowModalCorreo(false);
  }, [enviandoCorreo]);

  const handleEnviarCorreo = useCallback(async () => {
    if (!hasFullSelection) {
      toast.error("Debe seleccionar un cliente, factura y cuenta");
      return;
    }

    setEnviandoCorreo(true);
    try {
      const result = await sendWithTemplate(
        buildConsultaCarteraMailPayload({
          fechaConsultaFacturas,
          plantillaSeleccionadaKey,
          registroSeleccionado: {
            cliente: selectedCliente,
            factura: selectedFactura,
            cuenta: selectedCuenta,
          },
          currentUserId,
        })
      );

      if (result?.success) {
        toast.success("Correo enviado correctamente");
        setShowModalCorreo(false);
        return;
      }

      toast.error(`Error: ${result?.message}`);
    } catch {
      toast.error("Error al enviar el correo");
    } finally {
      setEnviandoCorreo(false);
    }
  }, [
    currentUserId,
    fechaConsultaFacturas,
    hasFullSelection,
    plantillaSeleccionadaKey,
    selectedCliente,
    selectedCuenta,
    selectedFactura,
    sendWithTemplate,
  ]);

  return useMemo(
    () => ({
      enviandoCorreo,
      handleCerrarModalCorreo,
      handleEnviarCorreo,
      handlePrevisualizarCorreo,
      plantillaSeleccionadaKey,
      plantillasApi,
      setPlantillaSeleccionadaKey,
      showModalCorreo,
    }),
    [
      enviandoCorreo,
      handleCerrarModalCorreo,
      handleEnviarCorreo,
      handlePrevisualizarCorreo,
      plantillaSeleccionadaKey,
      plantillasApi,
      showModalCorreo,
    ]
  );
}
