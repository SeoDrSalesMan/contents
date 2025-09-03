'use client';
import React from 'react';
import { Box, Typography, TextField, Paper, Grid } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useContentSettings } from '@/app/(DashboardLayout)/components/content/ContentSettingsContext';

const ClientManager = () => {
  const { clients, selectedClientId, updateClientField } = useContentSettings();
  const client = clients.find(c => c.id === selectedClientId);

  return (
    <PageContainer title="Gestor de Clientes" description="Gestiona los clientes y sus características">
      <DashboardCard title="Gestor de Clientes">
        <Grid container spacing={3}>
          {client ? (
            <Grid item xs={12} sm={6} md={4} key={client.id}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {client.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {client.info}
                </Typography>
                <TextField
                  label="Alcance"
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  value={client.alcance}
                  onChange={(e) => updateClientField(client.id, 'alcance', e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Estilo"
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  value={client.estilo}
                  onChange={(e) => updateClientField(client.id, 'estilo', e.target.value)}
                />
              </Paper>
            </Grid>
          ) : (
            <Typography>Selecciona un cliente para ver su configuración.</Typography>
          )}
        </Grid>
      </DashboardCard>
    </PageContainer>
  );
};

export default ClientManager;
