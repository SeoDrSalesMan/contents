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
    numero_estrategias: 1,
    frecuencia_mensual: '',
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

  const parseMarkdownTable = (markdown: string): any[] => {
    const lines = markdown.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return []; // Need at least header and separator

    // Find table lines (skip code blocks)
    const tableStart = lines.findIndex(line => line.startsWith('|'));
    if (tableStart === -1) return [];

    const headerLine = lines.slice(tableStart).find(line => line.trim() !== '' && !line.includes('---'));
    const separatorLine = lines.slice(tableStart).find(line => line.includes('---'));
    const dataLines = lines.slice(tableStart).filter(line =>
      line.trim() !== '' &&
      !line.includes('---') &&
      line.startsWith('|')
    );

    if (!headerLine || !dataLines || dataLines.length === 0) return [];

    // Parse header columns
    const headers = headerLine.split('|').slice(1, -1).map(h => h.trim());

    // Parse data rows
    const rows = dataLines.slice(1).map(line => {
      const rowData = line.split('|').slice(1, -1).map(cell => cell.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        const value = rowData[index] || '';
        // Map common headers to standardized keys
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('fecha')) row.fecha = value;
        else if (lowerHeader.includes('día')) row.dia = value;
        else if (lowerHeader.includes('canal')) row.canal = value;
        else if (lowerHeader.includes('pilar')) row.pilar = value;
        else if (lowerHeader.includes('objetivo')) row.objetivo = value;
        else if (lowerHeader.includes('formato')) row.formato = value;
        else if (lowerHeader.includes('tema') || lowerHeader.includes('título')) row.tema_titulo = value;
        else if (lowerHeader.includes('hook')) row.hook = value;
        else if (lowerHeader.includes('copy')) row.copy = value;
        else if (lowerHeader.includes('cta')) row.cta = value;
        else if (lowerHeader.includes('hashtags')) row.hashtags = value;
        else if (lowerHeader.includes('recurso') || lowerHeader.includes('asset')) row.recurso_asset = value;
        else if (lowerHeader.includes('duración')) row.duracion = value;
        else if (lowerHeader.includes('instrucciones')) row.instrucciones = value;
        else if (lowerHeader.includes('enlace') || lowerHeader.includes('utm')) row.enlace_utm = value;
        else if (lowerHeader.includes('kpi')) row.kpi = value;
        else if (lowerHeader.includes('responsable')) row.responsable = value;
        else if (lowerHeader.includes('estado')) row.estado = value;
        else if (lowerHeader.includes('notas')) row.notas = value;
        else row[header] = value; // Fallback to original header
      });

      return row;
    });

    return rows;
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
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        objetivo: formData.objetivo.join(', '),
        audiencia: formData.audiencia,
        canales: formData.canales.join(', '),
        numero_estrategias: formData.numero_estrategias,
        frecuencia_mensual: formData.frecuencia_mensual,
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

      const resultText = await response.text();
      console.log('Respuesta del webhook:', resultText);

      // Try to parse response as JSON first
      let resultData;
      try {
        resultData = JSON.parse(resultText);
      } catch {
        // If not JSON, treat as plain text and set as output
        resultData = [{ output: resultText }];
      }

      // Handle array of objects or single object
      let parsedResults: any[] = [];
      if (Array.isArray(resultData)) {
        parsedResults = resultData.flatMap(item => {
          if (item.output) {
            // Parse markdown table from output field
            return parseMarkdownTable(item.output);
          }
          return [item]; // If no output field, use the item directly
        });
      } else if (resultData.output) {
        parsedResults = parseMarkdownTable(resultData.output);
      } else {
        parsedResults = [resultData];
      }

      setResults(parsedResults);
      setMessage(`Estrategia generada exitosamente para ${client.name} (${parsedResults.length} elementos)`);

      // Limpiar formulario después del éxito
      setFormData({
        titulo: '',
        descripcion: '',
        objetivo: [] as string[],
        audiencia: '',
        canales: [] as string[],
        numero_estrategias: 1,
        frecuencia_mensual: '',
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
    <Box sx={{
      width: '100%',
      maxWidth: '1400px',
      mx: "auto",
      px: { xs: 1, sm: 2 }
    }}>
      <Typography variant="h5" gutterBottom>
        Generador de Estrategias RRSS
      </Typography>

      {client && (
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Cliente: {client.name}
        </Typography>
      )}

      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: 3,
        mt: 2
      }}>
        <Box sx={{ flex: 1, minWidth: { xs: '100%', lg: '400px' }, maxWidth: { lg: '500px' } }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
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
                  label="Número de Estrategias"
                  type="number"
                  value={formData.numero_estrategias}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    numero_estrategias: Number(e.target.value) || 1
                  }))}
                  fullWidth
                  placeholder="Número de estrategias a generar"
                  disabled={isLoading}
                  InputProps={{ inputProps: { min: 1, max: 50 } }}
                />

                <FormControl fullWidth>
                  <InputLabel id="frecuencia-label">Frecuencia Mensual</InputLabel>
                  <Select
                    labelId="frecuencia-label"
                    id="frecuencia"
                    value={formData.frecuencia_mensual}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      frecuencia_mensual: e.target.value
                    }))}
                    disabled={isLoading}
                    label="Frecuencia Mensual"
                  >
                    <MenuItem value="Diario">Diario</MenuItem>
                    <MenuItem value="2-3 veces/semana">2-3 veces/semana</MenuItem>
                    <MenuItem value="Semanal">Semanal</MenuItem>
                    <MenuItem value="Bisemanal">Bisemanal</MenuItem>
                    <MenuItem value="Semanal alterno">Semanal alterno</MenuItem>
                    <MenuItem value="Mensual">Mensual</MenuItem>
                    <MenuItem value="Trimestral">Trimestral</MenuItem>
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

        <Box sx={{ flex: 1, width: '100%', overflow: 'hidden' }}>
          {message && (
            <Alert
              severity={message.includes('Error') ? 'error' : 'success'}
              sx={{ mb: 2 }}
            >
              {message}
            </Alert>
          )}

          {results.length > 0 && (
            <Paper sx={{ overflow: 'hidden' }}>
              <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
                Resultados de la Estrategia ({results.length} elementos)
              </Typography>
              <TableContainer sx={{ maxHeight: { xs: 400, lg: 600 }, overflow: 'auto' }}>
                <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 80, borderRight: 1, borderColor: 'divider' }}>Día</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 80, borderRight: 1, borderColor: 'divider' }}>Canal</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Pilar</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Objetivo</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Formato</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 150, borderRight: 1, borderColor: 'divider' }}>Tema/Título</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 120, borderRight: 1, borderColor: 'divider' }}>Hook</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 200, borderRight: 1, borderColor: 'divider' }}>Copy</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 100, borderRight: 1, borderColor: 'divider' }}>CTA</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 120, borderRight: 1, borderColor: 'divider' }}>Hashtags</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 150, borderRight: 1, borderColor: 'divider' }}>Recurso/Asset</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Duración</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 150, borderRight: 1, borderColor: 'divider' }}>Instrucciones</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 150, borderRight: 1, borderColor: 'divider' }}>Enlace/UTM</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 120, borderRight: 1, borderColor: 'divider' }}>KPI</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 120, borderRight: 1, borderColor: 'divider' }}>Responsable</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 200, borderRight: 1, borderColor: 'divider' }}>Notas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((row, index) => (
                      <TableRow key={index} hover sx={{ '&:nth-of-type(even)': { bgcolor: 'grey.50' } }}>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: 1, borderColor: 'divider' }}>{row.fecha || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: 1, borderColor: 'divider' }}>{row.dia || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: 1, borderColor: 'divider' }}>{row.canal || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0' }}>{row.pilar || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0' }}>{row.objetivo || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0' }}>{row.formato || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0', maxWidth: 150 }}>{row.tema_titulo || row.titulo || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0', maxWidth: 120 }}>{row.hook || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0', maxWidth: 200 }}>{row.copy || row.texto || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0' }}>{row.cta || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0', maxWidth: 120 }}>{row.hashtags || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0', maxWidth: 150 }}>{row.recurso_asset || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0' }}>{row.duracion || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0', maxWidth: 150 }}>{row.instrucciones || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0', maxWidth: 150 }}>
                          <Box sx={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 'inherit'
                          }}>
                            {row.enlace_utm || '-'}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0', maxWidth: 120 }}>{row.kpi || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0' }}>{row.responsable || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0' }}>{row.estado || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', maxWidth: 200 }}>
                          <Box sx={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 'inherit'
                          }}>
                            {row.notas || '-'}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}
