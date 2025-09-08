"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  TextField,
  Button,
  Paper,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from "@mui/material";
import { useContentSettings } from "./ContentSettingsContext";
import { useSearchParams } from "next/navigation";

const getRrssWebhook = (clientId: string): string => {
  const webhookMap: Record<string, string> = {
    'distrito_legal': 'https://content-generator.nv0ey8.easypanel.host/webhook/rrss-distrito',
    'neuron_rehab': 'https://content-generator.nv0ey8.easypanel.host/webhook/rrss-neuron',
    'sistem_lab': 'https://content-generator.nv0ey8.easypanel.host/webhook/rrss-sistemlab',
    'gran_gala_flamenco': 'https://content-generator.nv0ey8.easypanel.host/webhook/rrss-grangala'
  };
  return webhookMap[clientId] || '';
};

export default function RrssGenerator() {
  const { clients, selectedClientId } = useContentSettings();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    objetivo: [] as string[],
    audiencia: '',
    canales: [] as string[],
    fecha_eventos: ''
  });
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const client = useMemo(() => clients.find(c => c.id === selectedClientId) || null, [clients, selectedClientId]);

  // Auto-fill fields from URL parameters
  useEffect(() => {
    const tituloParam = searchParams.get('titulo');
    const descripcionParam = searchParams.get('descripcion');

    if (tituloParam) {
      setFormData(prev => ({
        ...prev,
        titulo: decodeURIComponent(tituloParam)
      }));
    }

    if (descripcionParam) {
      setFormData(prev => ({
        ...prev,
        descripcion: decodeURIComponent(descripcionParam)
      }));
    }
  }, [searchParams]);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleCanalesChange = (event: any) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      canales: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleObjetivoChange = (event: any) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      objetivo: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!client) {
      setMessage('Selecciona un cliente válido.');
      setIsLoading(false);
      return;
    }

    const webhook = getRrssWebhook(client.id);
    if (!webhook) {
      setMessage('No hay webhook configurado para este cliente.');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        cliente: client.name,
        objetivo: formData.objetivo.join(', '),
        audiencia: formData.audiencia,
        canales: formData.canales.join(', '),
        fecha_eventos: formData.fecha_eventos
      };

      const response = await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.text();
      setMessage(`Estrategia generada exitosamente para ${client.name}`);
      console.log('Respuesta del webhook:', result);

      // Limpiar formulario después del éxito
      setFormData({
        titulo: '',
        descripcion: '',
        objetivo: [] as string[],
        audiencia: '',
        canales: [] as string[],
        fecha_eventos: ''
      });

    } catch (error) {
      console.error('Error generando estrategia RRSS:', error);
      setMessage('Error al generar la estrategia.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Generador de Estrategias RRSS
      </Typography>

      {client && (
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Cliente: {client.name}
        </Typography>
      )}

      <Paper variant="outlined" sx={{ p: 3, mt: 2 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Título"
              value={formData.titulo}
              onChange={handleInputChange('titulo')}
              fullWidth
              placeholder="Título para la estrategia de redes sociales"
              disabled={isLoading}
            />

            <TextField
              label="Descripción"
              value={formData.descripcion}
              onChange={handleInputChange('descripcion')}
              fullWidth
              multiline
              rows={3}
              placeholder="Descripción de la estrategia"
              disabled={isLoading}
            />

            <FormControl fullWidth required>
              <InputLabel id="objetivo-label">Objetivo</InputLabel>
              <Select
                labelId="objetivo-label"
                id="objetivo"
                multiple
                value={formData.objetivo}
                onChange={handleObjetivoChange}
                input={<OutlinedInput label="Objetivo" />}
                renderValue={(selected: any) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value: string) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
                disabled={isLoading}
              >
                <MenuItem value="Educar">Educar</MenuItem>
                <MenuItem value="Inspirar">Inspirar</MenuItem>
                <MenuItem value="Entretener">Entretener</MenuItem>
                <MenuItem value="Promocionar">Promocionar</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Audiencia"
              value={formData.audiencia}
              onChange={handleInputChange('audiencia')}
              required
              fullWidth
              multiline
              rows={2}
              placeholder="Define la audiencia objetivo"
              disabled={isLoading}
            />

            <FormControl fullWidth required>
              <InputLabel id="canales-label">Canales</InputLabel>
              <Select
                labelId="canales-label"
                id="canales"
                multiple
                value={formData.canales}
                onChange={handleCanalesChange}
                input={<OutlinedInput label="Canales" />}
                renderValue={(selected: any) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value: string) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
                disabled={isLoading}
              >
                <MenuItem value="IG">Instagram (IG)</MenuItem>
                <MenuItem value="LI">LinkedIn (LI)</MenuItem>
                <MenuItem value="TikTok">TikTok</MenuItem>
                <MenuItem value="X">X (Twitter)</MenuItem>
                <MenuItem value="FB">Facebook (FB)</MenuItem>
                <MenuItem value="YT Shorts">YouTube Shorts</MenuItem>
              </Select>
            </FormControl>



            <TextField
              label="Fecha o Eventos"
              value={formData.fecha_eventos}
              onChange={handleInputChange('fecha_eventos')}
              fullWidth
              placeholder="Fechas importantes o eventos especiales (opcional)"
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              fullWidth
              sx={{ minHeight: 48 }}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                  Generando...
                </>
              ) : (
                'Generar Estrategia'
              )}
            </Button>
          </Stack>
        </Box>
      </Paper>

      {message && (
        <Alert
          severity={message.includes('Error') ? 'error' : 'success'}
          sx={{ mt: 2 }}
        >
          {message}
        </Alert>
      )}

      {results.length > 0 && (
        <TableContainer component={Paper} sx={{ mt: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Canal</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Formato</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Pilar</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Título</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Texto</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Hashtags</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>CTA</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>KPI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.fecha || '-'}</TableCell>
                  <TableCell>{row.canal || '-'}</TableCell>
                  <TableCell>{row.formato || '-'}</TableCell>
                  <TableCell>{row.pilar || '-'}</TableCell>
                  <TableCell>{row.titulo || '-'}</TableCell>
                  <TableCell>{row.descripcion || '-'}</TableCell>
                  <TableCell>{row.texto || '-'}</TableCell>
                  <TableCell>{row.hashtags || '-'}</TableCell>
                  <TableCell>{row.cta || '-'}</TableCell>
                  <TableCell>{row.kpi || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
