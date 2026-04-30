import { saveOrUpdateSessionValue } from "@app/utils/localStorageHandler";
import { useEffect, useRef, useState } from "react";

export const useUnsavedChanges = (initialValue: any) => {
  const [value, setValue] = useState(initialValue);
  const prevValueRef = useRef(initialValue);


  const hasChanges =
    JSON.stringify(prevValueRef.current) !== JSON.stringify(value);

  saveOrUpdateSessionValue("unsaveFilters", hasChanges);

  const markAsSaved = () => {
    prevValueRef.current = value;
  };

  // Evita cerrar la pestaña si hay cambios sin guardar
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  return { value, setValue, hasChanges, markAsSaved };
};
