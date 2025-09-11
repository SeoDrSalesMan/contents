"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  const { clients, selectedClientId, createExecution } = useContentSettings();
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



  // Function to load the last 3 recent strategies for Distrito Legal
  const loadRecentStrategies = useCallback(async () => {
    if (!client || client.id !== 'distrito_legal') {
      setRecentStrategies([]);
      return;
    }

    console.log('Loading last 3 recent strategies for Distrito Legal via API proxy');
    setLoadingRecent(true);

    try {
      // Try to find the 3 most recent executions by testing higher execution IDs
      const allStrategies: any[] = [];
      let foundExecutions = 0;
      const maxExecutionId = 330; // Updated to include the latest generated execution 330
      const minExecutionId = 320; // Don't go below this number

      // Try executions from highest to lowest
      for (let executionId = maxExecutionId; executionId >= minExecutionId && foundExecutions < 3; executionId--) {
        try {
          console.log(`Testing execution ${executionId}...`);

          const response = await fetch(`/api/execution/${executionId}`);

          if (response.ok) {
            const executionData = await response.json();
            console.log(`✅ Execution ${executionId} found and valid`);

            // Try multiple possible response formats - improved logic
            let strategyText = '';

            // Check different possible data structures
            if (executionData && typeof executionData.output === 'string') {
              strategyText = executionData.output;
            } else if (executionData.output && typeof executionData.output === 'object' && executionData.output.output) {
              strategyText = executionData.output.output;
            } else if (executionData.output && typeof executionData.output === 'object') {
              strategyText = JSON.stringify(executionData.output);
            } else if (executionData.data) {
              strategyText = typeof executionData.data === 'string' ? executionData.data : JSON.stringify(executionData.data);
            }

            if (strategyText && strategyText.trim().length > 0) {
              console.log(`✅ Processing markdown table for execution ${executionId}`);
              const strategyResults = parseMarkdownTable(strategyText);
              console.log(`✅ Parsed ${strategyResults.length} strategies from execution ${executionId}`);

              if (strategyResults.length > 0) {
                // Add execution ID to each item for identification
                const strategyWithId = strategyResults.map(item => ({
                  ...item,
                  executionId: executionId.toString(),
                  createdAt: executionData.createdAt || executionData.startDate
                }));

                allStrategies.push(...strategyWithId);
                foundExecutions++;
                console.log(`✅ Added ${strategyWithId.length} strategies from execution ${executionId}`);
              }
            } else {
              console.log(`❌ No strategy text found for execution ${executionId}`);
            }
          } else {
            console.log(`❌ Execution ${executionId} not found`);
          }
        } catch (error) {
          console.log(`❌ Error processing execution ${executionId}:`, error);
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
  }, [client, setLoadingRecent, setRecentStrategies]);

  // Set mounted state to fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, [client, setRecentStrategies, setResults, setMessage, loadRecentStrategies]);

  // Load strategies when client changes and component is mounted
  useEffect(() => {
    if (mounted && client && client.id === 'distrito_legal') {
      loadRecentStrategies();
    }
  }, [mounted, client, loadRecentStrategies]);

  const parseMarkdownTable = (markdown: string): any[] => {
    const lines = markdown.split('\n').filter(line => line.trim() !== '');

    // Find table start and header
    const tableStart = lines.findIndex(line => line.includes('|'));
    if (tableStart === -1) return [];

    const headerLine = lines.slice(tableStart).find(line => line.trim() !== '' && !line.includes('---'));
    const separatorLine = lines.slice(tableStart).find(line => line.includes('---'));
    const dataLines = lines.slice(tableStart).filter(line =>
      line.trim() !== '' &&
      !line.includes('---') &&
      line.startsWith('|')
    );

    if (!headerLine || !dataLines || dataLines.length === 0) return [];

    // Parse headers
    const headers = headerLine.split('|').slice(1, -1).map(h => h.trim().toLowerCase());

    // Parse rows
    const rows = dataLines.slice(1).map(line => {
      const values = line.split('|').slice(1, -1).map(v => v.trim());
      const row: any = {};

      values.forEach((value, index) => {
        const header = headers[index] || `column_${index}`;
        const lowerHeader = header.toLowerCase();

        // Map known headers to standardized fields
        if (lowerHeader.includes('fecha') || lowerHeader.includes('date')) row.fecha = value;
        else if (lowerHeader.includes('canal') || lowerHeader.includes('channel')) row.canal = value;
        else if (lowerHeader.includes('formato') || lowerHeader.includes('format')) row.formato = value;
        else if (lowerHeader.includes('pilar')) row.pilar = value;
        else if (lowerHeader.includes('titulo') || lowerHeader.includes('título') || lowerHeader.includes('title')) row.titulo = value;
        else if (lowerHeader.includes('tema') && lowerHeader.includes('titulo')) row.tema_titulo = value;
        else if (lowerHeader.includes('copy') || lowerHeader.includes('texto')) row.copy = value;
        else if (lowerHeader.includes('hashtag')) row.hashtags = value;
        else if (lowerHeader.includes('cta')) row.cta = value;
        else if (lowerHeader.includes('recurso') || lowerHeader.includes('asset')) row.recurso_asset = value;
        else if (lowerHeader.includes('duración') || lowerHeader.includes('duracion')) row.duracion = value;
        else if (lowerHeader.includes('instrucciones')) row.instrucciones = value;
        else if (lowerHeader.includes('enlace') || lowerHeader.includes('utm')) row.enlace_utm = value;
        else if (lowerHeader.includes('kpi')) row.kpi = value;
        else if (lowerHeader.includes('responsable')) row.responsable = value;
        else if (lowerHeader.includes('estado')) row.estado = value;
        else if (lowerHeader.includes('notas')) row.notas = value;
        else if (lowerHeader.includes('dia') || lowerHeader.includes('día')) row.dia = value;
        else if (lowerHeader.includes('hook')) row.hook = value;
        else if (lowerHeader.includes('objetivo')) row.objetivo = value;
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

      console.log('🚀 Llamando al webhook de generación:', webhook);
      console.log('📤 Payload enviado:', payload);

      const response = await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Respuesta del webhook - Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        console.error('❌ Error en la respuesta del webhook:', errorText);
        throw new Error(`Error HTTP: ${response.status} - ${errorText.substring(0, 200)}`);
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

      if (parsedResults.length > 0) {
        setResults(parsedResults);
        setMessage(`Estrategia generada exitosamente para ${client.name} (${parsedResults.length} elementos)`);

        // Recargar las estrategias recientes después de generar una nueva
        if (client.id === 'distrito_legal') {
          console.log('🔄 Recargando estrategias recientes después de generar nueva estrategia...');
          setTimeout(() => {
            loadRecentStrategies();
          }, 1000); // Dar un poco de tiempo para que se guarde la nueva estrategia
        }

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
      } else {
        setMessage('No se pudieron procesar los resultados. Verifica la respuesta del servidor.');
        console.error('❌ No se pudieron parsear los resultados:', { resultText, resultData });
      }

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
                      <TableCell sx={{ display: 'none' }}>Día</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 80, borderRight: 1, borderColor: 'divider' }}>Canal</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Pilar</TableCell>
                      <TableCell sx={{ display: 'none' }}>Objetivo</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Formato</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 150, borderRight: 1, borderColor: 'divider' }}>Título</TableCell>
                      <TableCell sx={{ display: 'none' }}>Hook</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 200, borderRight: 1, borderColor: 'divider' }}>Copy</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 100, borderRight: 1, borderColor: 'divider' }}>CTA</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 120, borderRight: 1, borderColor: 'divider' }}>Hashtags</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 150, borderRight: 1, borderColor: 'divider' }}>Assets requeridos</TableCell>
                      <TableCell sx={{ display: 'none' }}>Duración</TableCell>
                      <TableCell sx={{ display: 'none' }}>Instrucciones</TableCell>
                      <TableCell sx={{ display: 'none' }}>Enlace/UTM</TableCell>
                      <TableCell sx={{ display: 'none' }}>KPI</TableCell>
                      <TableCell sx={{ display: 'none' }}>Responsable</TableCell>
                      <TableCell sx={{ display: 'none' }}>Estado</TableCell>
                      <TableCell sx={{ display: 'none' }}>Notas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((row, index) => (
                      <TableRow key={index} hover sx={{ '&:nth-of-type(even)': { bgcolor: 'grey.50' } }}>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: 1, borderColor: 'divider' }}>{row.fecha || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>{row.dia || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: 1, borderColor: 'divider' }}>{row.canal || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0' }}>{row.pilar || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>{row.objetivo || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0' }}>{row.formato || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0', maxWidth: 150 }}>{row.tema_titulo || row.titulo || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>{row.hook || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0', maxWidth: 200 }}>{row.copy || row.texto || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0' }}>{row.cta || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0', maxWidth: 120 }}>{row.hashtags || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0', maxWidth: 150 }}>{row.recurso_asset || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>{row.duracion || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>{row.instrucciones || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>
                        <Box sx={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 'inherit'
                        }}>
                          {row.enlace_utm || '-'}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: 'none' }}>{row.kpi || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>{row.responsable || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>{row.estado || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>
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



            <TableContainer sx={{ maxHeight: { xs: 400, lg: 600 }, overflow: 'auto' }}>
              <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover', '& th': { fontWeight: 'bold', fontSize: '0.8rem' } }}>
                    <TableCell sx={{ minWidth: 120, borderRight: 1, borderColor: 'divider' }}>
                      <strong>ID Ejecución</strong>
                    </TableCell>
                    <TableCell sx={{ minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Fecha</TableCell>
                    <TableCell sx={{ display: 'none' }}>Día</TableCell>
                    <TableCell sx={{ minWidth: 80, borderRight: 1, borderColor: 'divider' }}>Canal</TableCell>
                    <TableCell sx={{ minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Pilar</TableCell>
                    <TableCell sx={{ display: 'none' }}>Objetivo</TableCell>
                    <TableCell sx={{ minWidth: 100, borderRight: 1, borderColor: 'divider' }}>Formato</TableCell>
                    <TableCell sx={{ minWidth: 150, borderRight: 1, borderColor: 'divider' }}>Título</TableCell>
                    <TableCell sx={{ display: 'none' }}>Hook</TableCell>
                    <TableCell sx={{ minWidth: 200, borderRight: 1, borderColor: 'divider' }}>Copy</TableCell>
                    <TableCell sx={{ minWidth: 100, borderRight: 1, borderColor: 'divider' }}>CTA</TableCell>
                    <TableCell sx={{ minWidth: 120, borderRight: 1, borderColor: 'divider' }}>Hashtags</TableCell>
                    <TableCell sx={{ minWidth: 150, borderRight: 1, borderColor: 'divider' }}>Assets requeridos</TableCell>
                    <TableCell sx={{ display: 'none' }}>Duración</TableCell>
                    <TableCell sx={{ display: 'none' }}>Instrucciones</TableCell>
                    <TableCell sx={{ display: 'none' }}>Enlace/UTM</TableCell>
                    <TableCell sx={{ display: 'none' }}>KPI</TableCell>
                    <TableCell sx={{ display: 'none' }}>Responsable</TableCell>
                    <TableCell sx={{ display: 'none' }}>Estado</TableCell>
                    <TableCell sx={{ display: 'none' }}>Notas</TableCell>
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
                          bgcolor: row.executionId === '330' ? 'success.50' : row.executionId === '329' ? 'primary.50' : row.executionId === '328' ? 'warning.50' : 'info.50'
                        }}
                      >
                        <Chip
                          label={row.executionId}
                          size="small"
                          color={row.executionId === '330' ? 'success' : row.executionId === '329' ? 'primary' : row.executionId === '328' ? 'warning' : 'info'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: 1, borderColor: 'divider' }}>{row.fecha || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>{row.dia || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: 1, borderColor: 'divider' }}>{row.canal || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0' }}>{row.pilar || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>{row.objetivo || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0' }}>{row.formato || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0', maxWidth: 150 }}>{row.tema_titulo || row.titulo || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>{row.hook || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0', maxWidth: 200 }}>{row.copy || row.texto || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0' }}>{row.cta || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0', maxWidth: 120 }}>{row.hashtags || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', borderRight: '1px solid #e0e0e0', maxWidth: 150 }}>{row.recurso_asset || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>{row.duracion || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>{row.instrucciones || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>
                        <Box sx={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 'inherit'
                        }}>
                          {row.enlace_utm || '-'}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: 'none' }}>{row.kpi || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>{row.responsable || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>{row.estado || '-'}</TableCell>
                      <TableCell sx={{ display: 'none' }}>
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
