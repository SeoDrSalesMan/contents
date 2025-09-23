"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Card,
  CardContent,
  Chip,
  Button,
  Alert
} from "@mui/material";
import { IconDownload, IconTrendingUp, IconCheck } from "@tabler/icons-react";
import { useContentSettings } from "../components/content/ContentSettingsContext";

export default function HistoricoPage() {
  const { selectedClientId } = useContentSettings();

  // Mapping for client display names
  const clientNameMap: Record<string, string> = {
    "distrito_legal": "Distrito Legal",
    "neuron": "Neuron Rehab",
    "sistemlab": "SistemLab",
    "grangala": "Gran Gala Flamenco",
    "deuda": "Asociación Deuda",
    "estudiantes": "Asociación Estudiantes Extranjero",
    "segunda": "Nueva Ley Segunda Oportunidad",
    "comparador": "Comparador Aprender Idiomas"
  };

  const currentClientName = selectedClientId ? clientNameMap[selectedClientId] || selectedClientId : null;
  const [savedStrategies, setSavedStrategies] = useState<Record<string, any[]>>({});
  const [isLoadingSavedStrategies, setIsLoadingSavedStrategies] = useState(false);

  // Fetch saved strategies on mount and when selectedClientId changes
  useEffect(() => {
    fetchSavedStrategies();
  }, [selectedClientId]);

  // Function to fetch last 10 saved strategies per client
  const fetchSavedStrategies = async () => {
    if (!selectedClientId) {
      console.log('No client selected, skipping fetch');
      setSavedStrategies({});
      setIsLoadingSavedStrategies(false);
      return;
    }

    setIsLoadingSavedStrategies(true);
    try {
      const { supabase } = await import("@/utils/supabase-client");

      // Get the client UUID directly from the mapping
      const clientUuidMap: Record<string, string> = {
        "distrito_legal": "8f4927f3-2c86-4a94-987c-83a6e0d18bdd",
        "neuron": "63677400-1726-4893-a0b2-13cddf4717eb",
        "sistemlab": "19ffe861-dcf9-4cbe-aedf-cabb6f9463f9",
        "grangala": "07803765-6e64-476a-b9c7-8ff040f63555",
        "deuda": "4e59e433-a15d-40ca-b3d1-eefdaada9591",
        "estudiantes": "3e5bba85-e027-4460-a6dc-91e1e4ec4eb5",
        "segunda": "560dd32e-dd05-4a89-976a-3cb17b9616a8",
        "comparador": "27a0547d-b50a-4253-b6b3-13bbc8700cc7"
      };

      const clientUuid = clientUuidMap[selectedClientId];

      if (!clientUuid) {
        console.error('❌ No UUID found for client:', selectedClientId);
        alert(`Error: Cliente "${selectedClientId}" no encontrado en el mapeo de UUIDs.`);
        setSavedStrategies({});
        setIsLoadingSavedStrategies(false);
        return;
      }

      // Only fetch strategies for the selected client
      const { data, error } = await supabase
        .from('estrategias')
        .select('*')
        .eq('client_id', clientUuid)
        .order('created_at', { ascending: false })
        .limit(100); // Get enough to cover last 10 executions for this client

      if (error) {
        console.error('Error fetching saved strategies:', error);
        return;
      }

      // Group by client and take last 10 unique execution_ids for the selected client
      const groupedByClient: Record<string, any[]> = {};

      data.forEach((strategy: any) => {
        const clientUuid = strategy.client_id;
        const executionId = strategy.execution_id;

        if (!groupedByClient[clientUuid]) {
          groupedByClient[clientUuid] = [];
        }

        // Find if we already have this execution_id for this client
        const existingExecution = groupedByClient[clientUuid].find((item: any) => item.execution_id === executionId);

        if (!existingExecution && groupedByClient[clientUuid].length < 10) {
          groupedByClient[clientUuid].push({
            execution_id: executionId,
            strategies: [strategy] // Will collect all strategies for this execution
          });
        } else if (existingExecution) {
          // Add to existing execution
          existingExecution.strategies.push(strategy);
        }
      });

      console.log('✅ Fetched saved strategies for client:', selectedClientId, groupedByClient);
      setSavedStrategies(groupedByClient);

    } catch (error) {
      console.error('Error loading saved strategies:', error);
    } finally {
      setIsLoadingSavedStrategies(false);
    }
  };

  // Function to export a specific execution to CSV
  const exportExecutionToCSV = (execution: any, clientName: string) => {
    let csvContent = 'Cliente,Ejecución ID,Fecha,Canal,Tipo,Formato,Título,Copy,CTA,Hashtags,Fecha Creación\n';

    execution.strategies.forEach((strategy: any) => {
      const csvRow = [
        clientName,
        execution.execution_id,
        strategy.fecha || '',
        Array.isArray(strategy.canal) ? strategy.canal.join('; ') : strategy.canal || '',
        strategy.tipo || '',
        strategy.formato || '',
        `"${(strategy.titulo || '').replace(/"/g, '""')}"`,
        `"${(strategy.copy || '').replace(/"/g, '""')}"`,
        strategy.cta || '',
        strategy.hashtags || '',
        new Date(strategy.created_at).toLocaleString()
      ];
      csvContent += csvRow.join(',') + '\n';
    });

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `estrategias_${execution.execution_id}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '1200px',
      mx: 'auto',
      px: { xs: 2, sm: 3 }
    }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconCheck size={32} color="#2e7d32" />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Histórico de Estrategias
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Vista completa del histórico de estrategias guardadas{" "}
          {currentClientName && (
            <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              de {currentClientName}
            </Box>
          )}
        </Typography>
      </Box>

      {/* Client Alert */}
      {!selectedClientId && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Seleccione un cliente en el sidebar para ver su histórico de estrategias guardadas.
        </Alert>
      )}

      {/* Historic Strategies */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconCheck size={24} color="#2e7d32" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Estrategias Guardadas
          </Typography>
          {isLoadingSavedStrategies && <Typography variant="body2" sx={{ ml: 2 }}>Cargando...</Typography>}
        </Box>

        {Object.keys(savedStrategies).length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No hay estrategias guardadas aún. Genera y guarda estrategias para ver el historial aquí.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {Object.entries(savedStrategies).map(([clientUuid, executions]) => {
              // Find the display name for this client UUID
              const clientId = Object.keys({
                "distrito_legal": "8f4927f3-2c86-4a94-987c-83a6e0d18bdd",
                "neuron": "63677400-1726-4893-a0b2-13cddf4717eb",
                "sistemlab": "19ffe861-dcf9-4cbe-aedf-cabb6f9463f9",
                "grangala": "07803765-6e64-476a-b9c7-8ff040f63555",
                "deuda": "4e59e433-a15d-40ca-b3d1-eefdaada9591",
                "estudiantes": "3e5bba85-e027-4460-a6dc-91e1e4ec4eb5",
                "segunda": "560dd32e-dd05-4a89-976a-3cb17b9616a8",
                "comparador": "27a0547d-b50a-4253-b6b3-13bbc8700cc7"
              }).find(key => ({
                "distrito_legal": "8f4927f3-2c86-4a94-987c-83a6e0d18bdd",
                "neuron": "63677400-1726-4893-a0b2-13cddf4717eb",
                "sistemlab": "19ffe861-dcf9-4cbe-aedf-cabb6f9463f9",
                "grangala": "07803765-6e64-476a-b9c7-8ff040f63555",
                "deuda": "4e59e433-a15d-40ca-b3d1-eefdaada9591",
                "estudiantes": "3e5bba85-e027-4460-a6dc-91e1e4ec4eb5",
                "segunda": "560dd32e-dd05-4a89-976a-3cb17b9616a8",
                "comparador": "27a0547d-b50a-4253-b6b3-13bbc8700cc7"
              } as any)[key] === clientUuid);

              const clientNameMap: Record<string, string> = {
                "distrito_legal": "Distrito Legal",
                "neuron": "Neuron Rehab",
                "sistemlab": "SistemLab",
                "grangala": "Gran Gala Flamenco",
                "deuda": "Asociación Deuda",
                "estudiantes": "Asociación Estudiantes Extranjero",
                "segunda": "Nueva Ley Segunda Oportunidad",
                "comparador": "Comparador Aprender Idiomas"
              };

              const displayName = clientId ? clientNameMap[clientId] : clientUuid;

              return executions.length > 0 ? (
                <Accordion key={clientUuid} sx={{ mb: 1, borderRadius: 2 }}>
                  <AccordionSummary
                    expandIcon={<IconTrendingUp size={16} />}
                    sx={{
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      '&:hover': { bgcolor: 'grey.100' },
                      '&.Mui-expanded': { bgcolor: 'primary.light', color: 'primary.contrastText' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {displayName}
                      </Typography>
                      <Chip
                        label={`${executions.length} estrategia(s)`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Stack spacing={1.5}>
                      {executions.map((execution: any, index: number) => (
                        <Card key={`${execution.execution_id}-${index}`} sx={{ borderRadius: 1, p: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                              Ejecutado: {execution.execution_id}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                {execution.strategies.length} elementos
                              </Typography>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<IconDownload />}
                                onClick={() => exportExecutionToCSV(execution, displayName)}
                                sx={{
                                  fontSize: '0.7rem',
                                  borderColor: 'primary.main',
                                  color: 'primary.main',
                                  '&:hover': {
                                    backgroundColor: 'primary.main',
                                    color: 'white'
                                  }
                                }}
                              >
                                Exportar CSV
                              </Button>
                            </Box>
                          </Box>

                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1 }}>Fecha</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1 }}>Canal</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1 }}>Tipo</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1, maxWidth: 120 }}>
                                    <Box sx={{
                                      wordWrap: 'break-word',
                                      whiteSpace: 'normal',
                                      lineHeight: 1.4
                                    }}>
                                      Título
                                    </Box>
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1, maxWidth: 180 }}>
                                    <Box sx={{
                                      wordWrap: 'break-word',
                                      whiteSpace: 'normal',
                                      lineHeight: 1.4
                                    }}>
                                      Copy
                                    </Box>
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1 }}>CTA</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1 }}>Hashtags</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {execution.strategies.map((strategy: any, strategyIndex: number) => (
                                  <TableRow key={strategyIndex} sx={{ height: 'auto' }}>
                                    <TableCell sx={{ fontSize: '0.7rem', py: 1 }}>{strategy.fecha || '-'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.7rem', py: 1 }}>{Array.isArray(strategy.canal) ? strategy.canal.join(', ') : strategy.canal || '-'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.7rem', py: 1 }}>{strategy.tipo || '-'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.7rem', py: 1, maxWidth: 120 }}>
                                      <Box sx={{
                                        wordWrap: 'break-word',
                                        whiteSpace: 'normal',
                                        lineHeight: 1.4
                                      }}>
                                        {strategy.titulo || '-'}
                                      </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.7rem', py: 1, maxWidth: 180 }}>
                                      <Box sx={{
                                        wordWrap: 'break-word',
                                        whiteSpace: 'normal',
                                        lineHeight: 1.4
                                      }}>
                                        {strategy.copy || '-'}
                                      </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.7rem', py: 1 }}>{strategy.cta || '-'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.7rem', py: 1 }}>{strategy.hashtags || '-'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Card>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ) : null;
            })}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
