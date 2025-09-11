'use client';
import React, { useState } from 'react';
import { Box, TextField, Button, Alert, Snackbar, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Typography, LinearProgress } from '@mui/material';
import GridLegacy from "@mui/material/GridLegacy";
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useContentSettings } from '@/app/(DashboardLayout)/components/content/ContentSettingsContext';

const ClientManager = () => {
  const { clients, selectedClientId, updateClientField, saveClientData } = useContentSettings();
  const client = clients.find(c => c.id === selectedClientId);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [formData, setFormData] = useState<any>(null);

  // Load client data on client change
  React.useEffect(() => {
    if (client) {
      setFormData({ ...client });
    }
  }, [client, selectedClientId]);

  const handleSave = async () => {
    if (!client || !client.id) return;

    setSaving(true);
    try {
      const success = await saveClientData(client.id);
      const message = success ? 'Configuración guardada exitosamente' : 'Error al guardar la configuración';
      setSnackbar({
        open: true,
        message,
        severity: success ? 'success' : 'error'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al guardar la configuración',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Opciones para los desplegables
  const sectorOptions = ['Tecnología', 'Salud', 'Educación', 'Finanzas', 'Legal', 'Marketing', 'Consultoría', 'E-commerce', 'Inmobiliaria', 'Turismo'];
  const frecuenciaOptions = ['Diario', '2-3 veces/semana', 'Semanal', 'Bisemanal', 'Semanal alterno', 'Mensual', 'Trimestral'];
  const estiloComunicacionOptions = ['Formal', 'Profesional', 'Casual', 'Amigable', 'Directo', 'Informativo', 'Persuasivo', 'Educativo'];
  const tonoVozOptions = ['Profesional', 'Amigable', 'Autosuficiente', 'Compasivo', 'Confidente', 'Transparente', 'Motivador', 'Empático'];

  return (
    <PageContainer title="Configuración del Cliente" description="Gestiona la configuración detallada de tu cliente">
      <DashboardCard title="Configuración del Cliente">
        {saving && <LinearProgress sx={{ mb: 2 }} />}
        {client ? (
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {/* Datos cliente */}
            <Typography
              variant="h5"
              sx={{
                mt: 3,
                mb: 3,
                color: 'primary.main',
                fontWeight: 'bold',
                borderBottom: '2px solid',
                borderColor: 'primary.main',
                pb: 1
              }}
            >
              DATOS DEL CLIENTE
            </Typography>

            <GridLegacy container spacing={3} sx={{ mb: 4 }}>
              <GridLegacy item xs={12} md={6}>
                <TextField
                  label="Nombre Marca"
                  fullWidth
                  value={client.nombre}
                  onChange={(e) => updateClientField(client.id, 'nombre', e.target.value)}
                  sx={{ mb: 2 }}
                  placeholder="Ingresa el nombre de la marca"
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={6}>
                <TextField
                  label="Web"
                  fullWidth
                  value={client.web}
                  onChange={(e) => updateClientField(client.id, 'web', e.target.value)}
                  sx={{ mb: 2 }}
                  placeholder="https://www.ejemplo.com"
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Sector</InputLabel>
                  <Select
                    value={client.sector}
                    label="Sector"
                    onChange={(e) => updateClientField(client.id, 'sector', e.target.value)}
                  >
                    {sectorOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </GridLegacy>
              <GridLegacy item xs={12} md={6}>
                <TextField
                  label="Keywords"
                  fullWidth
                  multiline
                  rows={2}
                  value={client.keywords || ''}
                  onChange={(e) => updateClientField(client.id, 'keywords', e.target.value)}
                  sx={{ mb: 2 }}
                  placeholder="Palabras clave separadas por comas"
                />
              </GridLegacy>
            </GridLegacy>

            <GridLegacy container spacing={3} sx={{ mb: 4 }}>
              <GridLegacy item xs={12}>
                <TextField
                  label="Propuesta de valor y servicios ofrecidos"
                  fullWidth
                  multiline
                  rows={4}
                  value={client.propuesta_valor}
                  onChange={(e) => updateClientField(client.id, 'propuesta_valor', e.target.value)}
                  placeholder="Describe detalladamente la propuesta de valor y los servicios que ofrece la marca..."
                />
              </GridLegacy>
            </GridLegacy>

            <GridLegacy container spacing={3} sx={{ mb: 4 }}>
              <GridLegacy item xs={12} md={6}>
                <TextField
                  label="Audiencia o Público objetivo"
                  fullWidth
                  multiline
                  rows={4}
                  value={client.publico_objetivo}
                  onChange={(e) => updateClientField(client.id, 'publico_objetivo', e.target.value)}
                  placeholder="Define claramente tu público objetivo..."
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={6}>
                <TextField
                  label="Verticales de interés"
                  fullWidth
                  multiline
                  rows={4}
                  value={client.verticales_interes}
                  onChange={(e) => updateClientField(client.id, 'verticales_interes', e.target.value)}
                  placeholder="Indica las verticales de mercado específicas que te interesan (ej: fintech, insurtech, healthtech)..."
                />
              </GridLegacy>
            </GridLegacy>

            <GridLegacy container spacing={3} sx={{ mb: 4 }}>
              <GridLegacy item xs={12} md={6}>
                <TextField
                  label="Audiencia NO deseada"
                  fullWidth
                  multiline
                  rows={3}
                  value={client.audiencia_no_deseada}
                  onChange={(e) => updateClientField(client.id, 'audiencia_no_deseada', e.target.value)}
                  placeholder="Describe la audiencia que NO quieres atraer..."
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Estilo de comunicación</InputLabel>
                  <Select
                    value={client.estilo_comunicacion}
                    label="Estilo de comunicación"
                    onChange={(e) => updateClientField(client.id, 'estilo_comunicacion', e.target.value)}
                  >
                    {estiloComunicacionOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </GridLegacy>
              <GridLegacy item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Tono de voz</InputLabel>
                  <Select
                    value={client.tono_voz}
                    label="Tono de voz"
                    onChange={(e) => updateClientField(client.id, 'tono_voz', e.target.value)}
                  >
                    {tonoVozOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </GridLegacy>
            </GridLegacy>

            {/* Alcance */}
            <Typography
              variant="h5"
              sx={{
                mt: 5,
                mb: 3,
                color: 'primary.main',
                fontWeight: 'bold',
                borderBottom: '2px solid',
                borderColor: 'primary.main',
                pb: 1
              }}
            >
              ALCANCE
            </Typography>

            <GridLegacy container spacing={3} sx={{ mb: 4 }}>
              <GridLegacy item xs={12} md={6}>
                <TextField
                  label="Número de contenidos blog"
                  type="number"
                  fullWidth
                  value={client.numero_contenidos_blog}
                  onChange={(e) => updateClientField(client.id, 'numero_contenidos_blog', e.target.value)}
                  InputProps={{ inputProps: { min: 0, max: 1000 } }}
                  sx={{ mb: 2 }}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={6}>
                <TextField
                  label="Número contenidos redes sociales"
                  type="number"
                  fullWidth
                  value={client.numero_contenidos_rrss}
                  onChange={(e) => updateClientField(client.id, 'numero_contenidos_rrss', e.target.value)}
                  InputProps={{ inputProps: { min: 0, max: 10000 } }}
                  sx={{ mb: 2 }}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Frecuencia mensual blog</InputLabel>
                  <Select
                    value={client.frecuencia_mensual_blog}
                    label="Frecuencia mensual blog"
                    onChange={(e) => updateClientField(client.id, 'frecuencia_mensual_blog', e.target.value)}
                  >
                    {frecuenciaOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </GridLegacy>
              <GridLegacy item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Frecuencia mensual redes sociales</InputLabel>
                  <Select
                    value={client.frecuencia_mensual_rrss}
                    label="Frecuencia mensual redes sociales"
                    onChange={(e) => updateClientField(client.id, 'frecuencia_mensual_rrss', e.target.value)}
                  >
                    {frecuenciaOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </GridLegacy>
            </GridLegacy>

            {/* Save Button */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleSave}
                disabled={saving}
                sx={{
                  minWidth: 200,
                  padding: '12px 30px',
                  fontSize: '1.1rem',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </Box>
          </Box>
        ) : (
          <Typography>Selecciona un cliente para ver su configuración.</Typography>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </DashboardCard>
    </PageContainer>
  );
};

export default ClientManager;
