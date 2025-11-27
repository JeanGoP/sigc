import React, { useEffect, useMemo, useState } from "react";
import {
  useBuscadorGeneralService,
  BuscadorParams,
} from "../../services/General/BuscadorGeneralService";
import { SingleSelect } from "../singleSelect/singleSelect";

interface TipoEventoItem {
  id: string;
  nombre: string;
}

type Props = {
  label?: string;
  value?: string | number | null;
  placeholder?: string;
  onChange?: (value: string | number | null) => void;
  onSelect?: (id: string | number, item: TipoEventoItem) => void;
};

const BuscadorTiposEvento = React.memo((props: Props): JSX.Element => {
  const { label, value, placeholder, onChange, onSelect } = props;
  const { loading, buscarGeneral } = useBuscadorGeneralService();

  const [items, setItems] = useState<TipoEventoItem[]>([]);
  const [internalValue, setInternalValue] = useState<string | number | "">(
    value ?? ""
  );

  const normalizeEventos = (rawValue: unknown): TipoEventoItem[] => {
    if (rawValue == null) return [];

    let parsed: unknown = rawValue;
    try {
      if (typeof rawValue === "string") parsed = JSON.parse(rawValue);
    } catch (err) {
      console.error("JSON invalido en tipos de evento:", err);
      return [];
    }

    // Caso 1: ["TIPOSEVENTO", [...] ]
    if (Array.isArray(parsed)) {
      const maybeArr = (parsed as unknown[])[1];
      if (Array.isArray(maybeArr)) {
        return maybeArr
          .map((x: any) => ({
            id: x?.id?.toString?.() ?? "",
            nombre: x?.nombre ?? "",
          }))
          .filter((x) => x.id && x.nombre);
      }
      // Caso 1b: arreglo directo
      return (parsed as any[])
        .map((x: any) => ({
          id: x?.id?.toString?.() ?? "",
          nombre: x?.nombre ?? "",
        }))
        .filter((x) => x.id && x.nombre);
    }

    // Caso 2: objeto con propiedad arreglo
    if (typeof parsed === "object" && parsed) {
      for (const key of Object.keys(parsed as any)) {
        const val = (parsed as any)[key];
        if (Array.isArray(val)) {
          return val
            .map((x: any) => ({
              id: x?.id?.toString?.() ?? "",
              nombre: x?.nombre ?? "",
            }))
            .filter((x) => x.id && x.nombre);
        }
      }
    }

    return [];
  };

  useEffect(() => {
    const load = async () => {
      const params: BuscadorParams = {
        opcion: "EV",
        op: "FILTRO_GESTION_CARTERAS",
      };
      try {
        const response = await buscarGeneral(params);
        const d: any = (response as any)?.data;

        let raw: any;
        if (Array.isArray(d) && typeof d[0]?.value === "string") raw = d[0].value;
        else if (typeof d?.value === "string") raw = d.value;
        else if (typeof d === "string") raw = d;
        else raw = d;

        const list = normalizeEventos(raw);
        const listWithDefault = [
            { id: "X", nombre: "Sin filtro" }, 
            { id: "All", nombre: "Todos" }, 
            ...list];
        setItems(listWithDefault);
      } catch (e) {
        console.error("Error cargando tipos de evento", e);
        setItems([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setInternalValue(value ?? "");
  }, [value]);

  const options = useMemo(() => {
    const base = items.map((i) => ({ label: i.nombre, value: i.id }));

    if (loading && base.length === 0) {
      return [{ label: "Cargando...", value: "" as const }];
    }

    return base;
  }, [items, placeholder, loading]);

  const handleChange = (newValue: string | number) => {
    setInternalValue(newValue);

    // 🔥 Si el valor es "null", enviamos null al padre
    onChange?.(newValue);

    const selected = items.find((i) => i.id === String(newValue));
    if (selected) onSelect?.(selected.id, selected);
  };

  return (
    <SingleSelect
      label={label}
      options={options}
      selectedValue={internalValue}
      onChange={handleChange}
    />
  );
});

export default BuscadorTiposEvento;
