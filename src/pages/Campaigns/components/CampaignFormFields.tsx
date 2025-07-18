import React from 'react';
import { Campaign } from '../hooks/useCampaigns';

interface Props {
  campaign?: Campaign;
  editable: boolean;
  onChange?: (fields: Partial<Campaign>) => void;
}

const CampaignFormFields: React.FC<Props> = ({ campaign, editable, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onChange) {
      onChange({ [e.target.name]: e.target.value });
    }
  };

  return (
    <form className="container-fluid p-3 border rounded bg-light mb-3">
      <div className="row g-3 align-items-end">
        <div className="col-12 col-md-6 mb-3">
          <label className="form-label fw-bold" htmlFor="nombre-campana">Nombre de campaña</label>
          <input
            type="text"
            id="nombre-campana"
            name="nombre"
            className="form-control"
            value={campaign?.nombre || ''}
            onChange={handleChange}
            disabled={!editable}
          />
        </div>
        <div className="col-12 col-md-3 mb-3">
          <label className="form-label fw-bold" htmlFor="fecha-inicio">Fecha de inicio</label>
          <input
            type="date"
            id="fecha-inicio"
            name="fechaInicio"
            className="form-control"
            value={campaign?.fechaInicio || ''}
            onChange={handleChange}
            disabled={!editable}
          />
        </div>
        <div className="col-12 col-md-3 mb-3">
          <label className="form-label fw-bold" htmlFor="fecha-fin">Fecha de fin</label>
          <input
            type="date"
            id="fecha-fin"
            name="fechaFin"
            className="form-control"
            value={campaign?.fechaFin || ''}
            onChange={handleChange}
            disabled={!editable}
          />
        </div>
        <div className="col-12 mb-3">
          <label className="form-label fw-bold" htmlFor="detalles-campana">Detalles</label>
          <textarea
            id="detalles-campana"
            name="detalles"
            className="form-control"
            value={campaign?.detalles || ''}
            onChange={handleChange}
            disabled={!editable}
            rows={2}
          />
        </div>
      </div>
    </form>
  );
};

export default CampaignFormFields; 