import React from 'react';
import {
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
} from '@mui/material';

interface CampaignFiltersProps {
  searchTerm: string;
  showOnlyActive: boolean;
  onSearchChange: (value: string) => void;
  onShowOnlyActiveChange: (value: boolean) => void;
}

export const CampaignFilters: React.FC<CampaignFiltersProps> = ({
  searchTerm,
  showOnlyActive,
  onSearchChange,
  onShowOnlyActiveChange,
}) => {
  return (
    <Grid container spacing={2} alignItems="center" className="mb-3">
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Buscar campaña"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={showOnlyActive}
              onChange={(e) => onShowOnlyActiveChange(e.target.checked)}
            />
          }
          label="Mostrar solo campañas activas"
        />
      </Grid>
    </Grid>
  );
}; 