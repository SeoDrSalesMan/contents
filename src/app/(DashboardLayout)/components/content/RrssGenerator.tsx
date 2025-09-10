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
    frecuencia_mensual: '',
    fecha_eventos: '',
    fecha_eventos_no: ''
  });
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [latestStrategy, setLatestStrategy] = useState<any[]>([]);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [recentStrategies, setRecentStrategies] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  // Function to load the latest strategy for the selected client
  const loadLatestStrategy = async () => {
    if (!client) {
      console.log('No client selected');
      setLatestStrategy([]);
      return;
    }

    console.log('Loading latest strategy for client:', client.name, client.id);
    console.log('Client data:', { workflowId: client.workflowId, executionIds: client.executionIds });

    setLoadingLatest(true);
    try {
      // For Distrito Legal, use the specific execution ID 322 as requested
      const latestExecutionId = client.id === 'distrito_legal' ? '322' : client.executionIds[client.executionIds.length - 1];

      console.log('Fetching latest strategy via API proxy for execution:', latestExecutionId);

      // Use the new API proxy route to avoid CORS issues
      const response = await fetch(`/api/execution/${latestExecutionId}`);

      console.log('API proxy response status:', response.status);

      if (!response.ok) {
        console.log('Failed to load strategy via proxy, status:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
        setLatestStrategy([]);
        return;
      }

      const executionData = await response.json();
      console.log('Execution data received via proxy:', executionData);

      // Try multiple possible response formats
      let strategyText = '';
      if (executionData.output && executionData.output.output) {
        strategyText = executionData.output.output;
      } else if (executionData.output) {
        strategyText = typeof executionData.output === 'string' ? executionData.output : JSON.stringify(executionData.output);
      } else if (executionData.data) {
        strategyText = typeof executionData.data === 'string' ? executionData.data : JSON.stringify(executionData.data);
      }

      console.log('Strategy text extracted:', strategyText);

      if (strategyText) {
        const strategyResults = parseMarkdownTable(strategyText);
        console.log('Parsed results:', strategyResults);
        setLatestStrategy(strategyResults);
      } else {
        console.log('No valid strategy text found');
        setLatestStrategy([]);
      }
    } catch (error) {
      console.error('Error loading latest strategy:', error);
      setLatestStrategy([]);
    } finally {
      setLoadingLatest(false);
    }
  };

  // Function to load the last 3 recent strategies for Distrito Legal
  const loadRecentStrategies = async () => {
    if (!client || client.id !== 'distrito_legal') {
      setRecentStrategies([]);
      return;
    }

    console.log('Loading last 3 strategies for Distrito Legal via API proxy');
    setLoadingRecent(true);

    try {
      const executionIds = ['322', '321', '320'];
      const allStrategies: any[] = [];

      // Load each execution one by one using the API proxy
      for (const executionId of executionIds) {
        try {
          console.log('Fetching execution via proxy:', `/api/execution/${executionId}`);

          const response = await fetch(`/api/execution/${executionId}`);

          console.log(`API proxy response status for ${executionId}:`, response.status);

          if (response.ok) {
            const executionData = await response.json();
            console.log(`Execution ${executionId} data received via proxy:`, executionData);

            // Try multiple possible response formats - improved logic
            let strategyText = '';

            // Check different possible data structures
            if (executionData && typeof executionData.output === 'string') {
              strategyText = executionData.output;
              console.log(`Found strategy in executionData.output (string):`, strategyText.substring(0, 200));
            } else if (executionData.output && typeof executionData.output === 'object' && executionData.output.output) {
              strategyText = executionData.output.output;
              console.log(`Found strategy in executionData.output.output:`, strategyText.substring(0, 200));
            } else if (executionData.output && typeof executionData.output === 'object') {
              strategyText = JSON.stringify(executionData.output);
              console.log(`Found strategy in executionData.output (object):`, strategyText.substring(0, 200));
            } else if (executionData.data) {
              strategyText = typeof executionData.data === 'string' ? executionData.data : JSON.stringify(executionData.data);
              console.log(`Found strategy in executionData.data:`, strategyText.substring(0, 200));
            } else {
              console.log(`No recognized data structure found for execution ${executionId}`);
              console.log('Available keys:', Object.keys(executionData));
            }

            if (strategyText && strategyText.trim().length > 0) {
              console.log(`Attempting to parse markdown table for execution ${executionId}`);
              const strategyResults = parseMarkdownTable(strategyText);
              console.log(`Parsed ${strategyResults.length} strategies from execution ${executionId}`);

              if (strategyResults.length > 0) {
                // Add execution ID to each item for identification
                const strategyWithId = strategyResults.map(item => ({
                  ...item,
                  executionId: executionId,
                  createdAt: executionData.createdAt || executionData.startDate
                }));

                allStrategies.push(...strategyWithId);
                console.log(`Added ${strategyWithId.length} strategies from execution ${executionId}`);
              } else {
                console.log(`No valid strategies parsed from execution ${executionId}, but strategyText exists:`, !!strategyText);
              }
            } else {
              console.log(`No strategy text found for execution ${executionId}`);
            }
          } else {
            console.log(`Execution ${executionId} failed to load via proxy - Status: ${response.status}`);
            const errorText = await response.text().catch(() => 'No error details');
            console.log('Error response:', errorText);
          }
        } catch (error) {
          console.error(`Error loading execution ${executionId}:`, error);
        }
      }

      console.log('=== SUMMARY ===');
      console.log(`Processing completed. Total strategies loaded: ${allStrategies.length}`);
      console.log('Strategies per execution:');
      allStrategies.forEach((strategy, index) => {
        console.log(`  ${index + 1}. Execution ${strategy.executionId}: "${(strategy.tema_titulo || strategy.titulo || 'No title').substring(0, 50)}..."`);
      });

      setRecentStrategies(allStrategies);

    } catch (error) {
      console.error('Error loading recent strategies:', error);
      setRecentStrategies([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  // Set mounted state to fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load strategies when client changes and component is mounted
  useEffect(() => {
    if (mounted && client && client.id === 'distrito_legal') {
      if (client.executionIds && client.executionIds.length > 0) {
        loadLatestStrategy();
      }
      loadRecentStrategies();
    }
  }, [selectedClientId, mounted]);

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
        frecuencia_mensual: formData.frecuencia_mensual,
        fecha_eventos: formData.fecha_eventos,
        fecha_eventos_no: formData.fecha_eventos_no
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
          return [item];  // If no output field, use the item directly
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
        frecuencia_mensual: '',
        fecha_eventos: '',
        fecha_eventos_no: ''
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

      <Stack spacing={4} sx={{ mt: 2 }}>
        <Box>
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
                  label="Fecha o evento para Tener en Cuenta"
                  value={formData.fecha_eventos}
                  onChange={handleInputChange('fecha_eventos')}
                  fullWidth
                  placeholder="Fechas importantes o eventos especiales (opcional)"
                  disabled={isLoading}
                />

                <TextField
                  label="Fecha o evento para NO Tener en Cuenta"
                  value={formData.fecha_eventos_no}
                  onChange={handleInputChange('fecha_eventos_no')}
                  fullWidth
                  placeholder="Fechas o eventos que NO deben considerarse (opcional)"
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
        </Box>

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
      </Stack>

      {/* Latest Strategy Section */}
      <Box sx={{ mt: 4, width: '100%' }}>
        {loadingLatest ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} />
            <Typography sx={{ ml: 2 }}>Cargando estrategia anterior...</Typography>
          </Box>
        ) : latestStrategy.length > 0 && (
          <Paper sx={{ overflow: 'hidden' }}>
            <Typography variant="h6" sx={{ p: 2, pb: 1, color: 'primary.main' }}>
              Última Estrategia Generada - {client?.name} ({latestStrategy.length} elementos)
            </Typography>

            <Alert
              severity="info"
              sx={{ mx: 2, mb: 2 }}
            >
              Esta es la estrategia más reciente generada para este cliente. Se actualizará automáticamente cuando se cambie de cliente.
            </Alert>

            <TableContainer sx={{ maxHeight: { xs: 400, lg: 600 }, overflow: 'auto' }}>
              <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
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
                  {latestStrategy.map((row, index) => (
                    <TableRow key={`latest-${index}`} hover sx={{ '&:nth-of-type(even)': { bgcolor: 'grey.25' }, backgroundColor: 'rgba(25, 118, 210, 0.04)' }}>
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

      {/* Recent Strategies Section - Last 3 executions */}
      <Box sx={{ mt: 4, width: '100%' }}>
        {loadingRecent ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} />
            <Typography sx={{ ml: 2 }}>Cargando últimas 3 estrategias...</Typography>
          </Box>
        ) : recentStrategies.length > 0 ? (
          <Paper sx={{ overflow: 'hidden' }}>
            <Typography variant="h6" sx={{ p: 2, pb: 1, color: 'primary.main' }}>
              Últimas 3 Estrategias Generadas - {client?.name} ({recentStrategies.length} elementos totales)
            </Typography>

            <Alert
              severity="info"
              sx={{ mx: 2, mb: 2 }}
            >
              Historial de las últimas 3 ejecuciones: 322, 321 y 320. Incluye todos los estrategias generadas en estos procesos.
            </Alert>

            <TableContainer sx={{ maxHeight: { xs: 400, lg: 600 }, overflow: 'auto' }}>
              <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover', '& th': { fontWeight: 'bold', fontSize: '0.8rem' } }}>
                    <TableCell sx={{ minWidth: 120, borderRight: 1, borderColor: 'divider' }}>
                      <strong>ID Ejecución</strong>
                    </TableCell>
                    <TableCell sx={{ minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Fecha</TableCell>
                    <TableCell sx={{ minWidth: 80, borderRight: 1, borderColor: 'divider' }}>Día</TableCell>
                    <TableCell sx={{ minWidth: 80, borderRight: 1, borderColor: 'divider' }}>Canal</TableCell>
                    <TableCell sx={{ minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Pilar</TableCell>
                    <TableCell sx={{ minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Objetivo</TableCell>
                    <TableCell sx={{ minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Formato</TableCell>
                    <TableCell sx={{ minWidth: 150, borderRight: 1, borderColor: 'divider' }}>Tema/Título</TableCell>
                    <TableCell sx={{ minWidth: 120, borderRight: 1, borderColor: 'divider' }}>Hook</TableCell>
                    <TableCell sx={{ minWidth: 200, borderRight: 1, borderColor: 'divider' }}>Copy</TableCell>
                    <TableCell sx={{ minWidth: 100, borderRight: 1, borderColor: 'divider' }}>CTA</TableCell>
                    <TableCell sx={{ minWidth: 120, borderRight: 1, borderColor: 'divider' }}>Hashtags</TableCell>
                    <TableCell sx={{ minWidth: 150, borderRight: 1, borderColor: 'divider' }}>Recurso/Asset</TableCell>
                    <TableCell sx={{ minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Duración</TableCell>
                    <TableCell sx={{ minWidth: 150, borderRight: 1, borderColor: 'divider' }}>Instrucciones</TableCell>
                    <TableCell sx={{ minWidth: 150, borderRight: 1, borderColor: 'divider' }}>Enlace/UTM</TableCell>
                    <TableCell sx={{ minWidth: 120, borderRight: 1, borderColor: 'divider' }}>KPI</TableCell>
                    <TableCell sx={{ minWidth: 120, borderRight: 1, borderColor: 'divider' }}>Responsable</TableCell>
                    <TableCell sx={{ minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Estado</TableCell>
                    <TableCell sx={{ minWidth: 200, borderRight: 1, borderColor: 'divider' }}>Notas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentStrategies.map((row, index) => (
                    <TableRow key={`recent-${index}`} hover sx={{ '&:nth-of-type(even)': { bgcolor: 'grey.50' } }}>
                      <TableCell
                        sx={{
                          fontSize: '0.8rem',
                          borderRight: 1,
                          borderColor: 'divider',
                          fontWeight: 'bold',
                          color: 'primary.main',
                          bgcolor: row.executionId === '322' ? 'primary.50' : row.executionId === '321' ? 'success.50' : 'warning.50'
                        }}
                      >
                        <Chip
                          label={row.executionId}
                          size="small"
                          color={row.executionId === '322' ? 'primary' : row.executionId === '321' ? 'success' : 'warning'}
                          variant="outlined"
                        />
                      </TableCell>
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
        ) : client?.id === 'distrito_legal' ? (
          <Alert severity="warning">
            No hay estrategias recientes disponibles para Distrito Legal.
          </Alert>
        ) : null}
      </Box>
    </Box>
  );
}
