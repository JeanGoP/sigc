import { useState, useEffect } from 'react';

export interface Campaign {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  detalles: string;
}

const CAMPAIGNS_JSON_PATH = '/data/campaigns.json';

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(CAMPAIGNS_JSON_PATH)
      .then((res) => res.json())
      .then((data) => {
        setCampaigns(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Error al cargar campañas');
        setLoading(false);
      });
  }, []);

  const selectCampaign = (id: string) => {
    const found = campaigns.find((c) => c.id === id) || null;
    setSelectedCampaign(found);
  };

  return {
    campaigns,
    selectedCampaign,
    selectCampaign,
    loading,
    error,
  };
} 