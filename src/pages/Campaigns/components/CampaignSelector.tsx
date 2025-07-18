import React from 'react';
import { useCampaigns } from '../hooks/useCampaigns';

const CampaignSelector = () => {
  const { campaigns, selectedCampaign, selectCampaign, loading, error } = useCampaigns();

  if (loading) return <div>Cargando campañas...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <label htmlFor="campaign-select">Selecciona una campaña:</label>
      <select
        id="campaign-select"
        value={selectedCampaign ? selectedCampaign.id : ''}
        onChange={e => selectCampaign(e.target.value)}
      >
        <option value="">-- Nueva campaña --</option>
        {campaigns.map(c => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
      </select>
      {selectedCampaign && (
        <div style={{ marginTop: 8 }}>
          <strong>Campaña seleccionada:</strong> {selectedCampaign.nombre}
        </div>
      )}
    </div>
  );
};

export default CampaignSelector; 