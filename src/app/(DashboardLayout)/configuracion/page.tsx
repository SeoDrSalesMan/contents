'use client';
import React, { useState } from 'react';
import { Box, TextField, Button, Alert, Snackbar, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Typography, LinearProgress } from '@mui/material';
import GridLegacy from "@mui/material/GridLegacy";
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useContentSettings, Client } from '@/app/(DashboardLayout)/components/content/ContentSettingsContext';

const ClientManager = () => {
  const { clients, selectedClientId, updateClientField, saveClientData } = useContentSettings();
  const client = clients.find(c => c.id === selectedClientId);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [formData, setFormData] = useState<any>(null);

  // Function to load saved client configuration
  const loadSavedClientConfig = (clientId: string) => {
    try {
      const storageKey = `client_${clientId}_config`;
      const savedData = localStorage.getItem(storageKey);

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log(`📥 Found saved data for ${clientId}:`, {
          nombre: parsedData.nombre,
          sector: parsedData.sector,
          keywords: parsedData.keywords?.substring(0, 50),
          frecuencia_mensual_blog: parsedData.frecuencia_mensual_blog
        });
        return parsedData;
      } else {
        console.log(`🆕 No saved data found for ${clientId}, using defaults`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error loading saved data for ${clientId}:`, error);
      return null;
    }
  };

  // Function to adjust percentages when user finishes editing a field
  const adjustPercentagesOnBlur = (clientId: string) => {
    const currentClient = clients.find(c => c.id === clientId);
    if (!currentClient) return;

    const percentageFields = [
      'porcentaje_educar',
      'porcentaje_inspirar',
      'porcentaje_entretener',
      'porcentaje_promocionar'
    ] as const;

    // Get current values
    const currentValues = percentageFields.map(field =>
      currentClient[field as keyof Client] as number
    );

    const total = currentValues.reduce((sum, val) => sum + val, 0);

    // If total is already 100%, do nothing
    if (total === 100) return;

    const difference = 100 - total;
    const numberOfOtherFields = percentageFields.length;

    // Distribute the difference evenly among all fields
    if (difference > 0) {
      // Need to increase values to reach 100%
      const incrementPerField = Math.floor(difference / numberOfOtherFields);
      const remainder = difference % numberOfOtherFields;

      percentageFields.forEach((field, index) => {
        const currentValue = currentValues[index];
        let newValue = currentValue + incrementPerField;

        // Distribute remainder (add 1 to first fields)
        if (index < remainder) {
          newValue += 1;
        }

        // Ensure we don't exceed 100%
        newValue = Math.min(100, newValue);

        updateClientField(clientId, field as keyof Client, Math.max(0, newValue).toString());
      });
    } else {
      // Need to reduce values to reach 100%
      const decrementPerField = Math.floor(Math.abs(difference) / numberOfOtherFields);
      const remainder = Math.abs(difference) % numberOfOtherFields;

      percentageFields.forEach((field, index) => {
        const currentValue = currentValues[index];
        let newValue = currentValue - decrementPerField;

        // Distribute remainder (subtract 1 from first fields)
        if (index < remainder) {
          newValue -= 1;
        }

        // Ensure we don't go below 0%
        newValue = Math.max(0, newValue);

        updateClientField(clientId, field as keyof Client, newValue.toString());
      });
    }
  };

  // Function to adjust percentages to always sum to 100%
  const adjustPercentages = (clientId: string, changedField: string, newValue: number) => {
    if (newValue < 0 || newValue > 100) return;

    const currentClient = clients.find(c => c.id === clientId);
    if (!currentClient) return;

    const percentageFields: (keyof Client)[] = [
      'porcentaje_educar',
      'porcentaje_inspirar',
      'porcentaje_entretener',
      'porcentaje_promocionar'
    ];

      // Get current values
    const currentValues = percentageFields.map(field => currentClient[field as keyof Client] as number);
    const totalCurrent = currentValues.reduce((sum, val) => sum + val, 0);

    if (totalCurrent === 0 && newValue === 0) {
      // If all were 0 and setting one to 0, do nothing
      return;
    }

    // Set the changed field
    const newValues = [...currentValues];
    const changedIndex = percentageFields.findIndex(field => field === changedField);
    if (changedIndex === -1) return;

    newValues[changedIndex] = newValue;

    // Calculate difference from 100%
    const totalWithNew = newValues.reduce((sum, val) => sum + val, 0);
    const difference = 100 - totalWithNew;

    if (difference === 0) {
      // Perfect, already sums to 100%
      percentageFields.forEach((field, index) => {
        if (field !== changedField) {
          updateClientField(clientId, field as keyof Client, newValues[index].toString());
        }
      });
      return;
    }

    // Distribute/collect the difference among other fields
    const otherFields = percentageFields.filter(field => field !== changedField);
    const adjustmentPerField = Math.floor(Math.abs(difference) / otherFields.length);
    const remainder = Math.abs(difference) % otherFields.length;

    let currentDifference = difference;
    let remainderDistributed = 0;

    otherFields.forEach((field, index) => {
      let newFieldValue = newValues[percentageFields.indexOf(field)];
      let adjustment = 0;

      if (difference > 0) {
        // Need to increase other fields
        adjustment = adjustmentPerField;
        if (remainderDistributed < remainder) {
          adjustment += 1;
          remainderDistributed += 1;
        }
        // Cap at 100
        adjustment = Math.min(adjustment, 100 - newFieldValue);
      } else {
        // Need to decrease other fields
        adjustment = -adjustmentPerField;
        if (remainderDistributed < remainder) {
          adjustment -= 1;
          remainderDistributed += 1;
        }
        // Don't go below 0
        adjustment = Math.max(adjustment, -newFieldValue);
      }

      newFieldValue += adjustment;
      currentDifference -= adjustment;

      updateClientField(clientId, field as keyof Client, newFieldValue.toString());
    });

    // Handle any remaining difference due to rounding
    if (currentDifference !== 0) {
      // Add/remove the remaining amount from the first other field
      const firstOtherField = otherFields[0];
      const currentValue = currentClient[firstOtherField as keyof Client] as number;

      if (difference > 0) {
        // Need to add to reach 100%
        updateClientField(clientId, firstOtherField, Math.min(100, currentValue + currentDifference).toString());
      } else {
        // Need to subtract to reach 100%
        updateClientField(clientId, firstOtherField, Math.max(0, currentValue + currentDifference).toString());
      }
    }
  };

  // Load client data on client change
  React.useEffect(() => {
    if (client && selectedClientId) {
      console.log(`🔄 Loading configuration for client: ${client.id} (${client.name})`);

      // First check if there's saved data in localStorage
      const savedData = loadSavedClientConfig(client.id);
      if (savedData) {
        setFormData(savedData);
        console.log(`✅ Form loaded with persisted data for ${client.name}`);
      } else {
        // Use current context data
        setFormData({ ...client });
        console.log(`✅ Form loaded with context data for ${client.name}`);
      }

      console.log(`📊 Current client data:`, {
        nombre: savedData?.nombre || client.nombre || 'N/A',
        sector: savedData?.sector || client.sector || 'N/A',
        keywords: (savedData?.keywords || client.keywords || '').substring(0, 50)
      });
    }
  }, [client, selectedClientId, clients]); // React to changes in client, selectedClientId, and clients array

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
      <DashboardCard
        title={`Configuración del Cliente: ${client?.name || 'Seleccionar cliente'}`}
      >
        {saving && <LinearProgress sx={{ mb: 2 }} />}

        {/* Current Client Info */}
        {client && (
          <Typography
            variant="subtitle2"
            sx={{
              mb: 3,
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              color: 'text.secondary'
            }}
          >
            ✏️ Editando configuración de: <strong>{client.name}</strong>
            (ID: {client.id})
          </Typography>
        )}

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
              <GridLegacy item xs={12}>
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

            {/* Distribution de Tipos de Contenido */}
            <Typography
              variant="h5"
              sx={{
                mt: 5,
                mb: 3,
                color: 'secondary.main',
                fontWeight: 'bold',
                borderBottom: '2px solid',
                borderColor: 'secondary.main',
                pb: 1
              }}
            >
              DISTRIBUCIÓN DE TIPOS DE CONTENIDO (100%)
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Define la distribución porcentual de tipos de contenido que debe mantener un total de 100%.
            </Typography>

            <GridLegacy container spacing={3} sx={{ mb: 4 }}>
              <GridLegacy item xs={12} md={3}>
                <TextField
                  label={`Educar (${client?.porcentaje_educar || 0}%)`}
                  type="number"
                  fullWidth
                  value={client?.porcentaje_educar || 0}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0;
                    console.log('🔄 Updating Educar to:', newValue);
                    updateClientField(client.id, 'porcentaje_educar', newValue.toString());
                  }}
                  InputProps={{
                    inputProps: { min: 0, max: 100 }
                  }}
                  sx={{ mb: 1 }}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={3}>
                <TextField
                  label={`Inspirar (${client?.porcentaje_inspirar || 0}%)`}
                  type="number"
                  fullWidth
                  value={client?.porcentaje_inspirar || 0}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0;
                    console.log('🔄 Updating Inspirar to:', newValue);
                    updateClientField(client.id, 'porcentaje_inspirar', newValue.toString());
                  }}
                  InputProps={{
                    inputProps: { min: 0, max: 100 }
                  }}
                  sx={{ mb: 1 }}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={3}>
                <TextField
                  label={`Entretener (${client?.porcentaje_entretener || 0}%)`}
                  type="number"
                  fullWidth
                  value={client?.porcentaje_entretener || 0}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0;
                    console.log('🔄 Updating Entretener to:', newValue);
                    updateClientField(client.id, 'porcentaje_entretener', newValue.toString());
                  }}
                  InputProps={{
                    inputProps: { min: 0, max: 100 }
                  }}
                  sx={{ mb: 1 }}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={3}>
                <TextField
                  label={`Promocionar (${client?.porcentaje_promocionar || 0}%)`}
                  type="number"
                  fullWidth
                  value={client?.porcentaje_promocionar || 0}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0;
                    console.log('🔄 Updating Promocionar to:', newValue);
                    updateClientField(client.id, 'porcentaje_promocionar', newValue.toString());
                  }}
                  InputProps={{
                    inputProps: { min: 0, max: 100 }
                  }}
                  sx={{ mb: 1 }}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={8}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: (client.porcentaje_educar + client.porcentaje_inspirar +
                            client.porcentaje_entretener + client.porcentaje_promocionar) === 100
                      ? 'success.main' : 'warning.main',
                    fontWeight: 'medium'
                  }}
                >
                  Total: {(client.porcentaje_educar + client.porcentaje_inspirar +
                          client.porcentaje_entretener + client.porcentaje_promocionar)}%
                  {(client.porcentaje_educar + client.porcentaje_inspirar +
                    client.porcentaje_entretener + client.porcentaje_promocionar) !== 100 &&
                    <span> ⚠️ Puede ajustar o usar {"Redistribuir para 100%"}</span>}
                </Typography>
              </GridLegacy>
              <GridLegacy item xs={12} md={4}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => adjustPercentagesOnBlur(client.id)}
                  sx={{ ml: 1 }}
                  disabled={(client.porcentaje_educar + client.porcentaje_inspirar +
                           client.porcentaje_entretener + client.porcentaje_promocionar) === 100}
                >
                  Redistribuir para 100%
                </Button>
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
