import { useState, useEffect } from 'react';
import { TipoCampana } from '@pages/Campaigns/types/campaign';
import { fetchTiposCampana } from '@app/services/tipoCampanaService';

export const useTiposCampana = () => {
  const [tiposCampana, setTiposCampana] = useState<TipoCampana[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTiposCampana = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTiposCampana();
        setTiposCampana(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar los tipos de campaña';
        setError(errorMessage);
        setTiposCampana([]);
      } finally {
        setLoading(false);
      }
    };

    loadTiposCampana();
  }, []);

  return { tiposCampana, loading, error };
}; 