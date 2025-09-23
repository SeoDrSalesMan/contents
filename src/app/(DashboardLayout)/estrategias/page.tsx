"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TableSortLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from "@mui/material";

import {
  IconRocket,
  IconTarget,
  IconChartBar,
  IconTrendingUp,
  IconUsers,
  IconDownload,
  IconCheck,
  IconDeviceFloppy,
  IconAlertCircle
} from "@tabler/icons-react";
import { useContentSettings } from "../components/content/ContentSettingsContext";

export default function EstrategiasPage() {
  const { selectedClientId, createExecution, executions } = useContentSettings();

      // Mapping directo de clientId a UUIDs reales existentes en tabla clients
      const clientUuidMap: Record<string, string> = {
        "distrito_legal": "8f4927f3-2c86-4a94-987c-83a6e0d18bdd",
        "neuron": "63677400-1726-4893-a0b2-13cddf4717eb",
        /* "neuron_rehab": "63677400-1726-4893-a0b2-13cddf4717eb", */
        "sistemlab": "19ffe861-dcf9-4cbe-aedf-cabb6f9463f9",
        /* "gran_gala_flamenco": "07803765-6e64-476a-b9c7-8ff040f63555", */
        "grangala": "07803765-6e64-476a-b9c7-8ff040f63555",
        "deuda": "4e59e433-a15d-40ca-b3d1-eefdaada9591",
        "estudiantes": "3e5bba85-e027-4460-a6dc-91e1e4ec4eb5",
        "segunda": "560dd32e-dd05-4a89-976a-3cb17b9616a8",
        "comparador": "27a0547d-b50a-4253-b6b3-13bbc8700cc7"
      };

      // Mapping de clientId a nombres para display
      const clientNameMap = {
        "distrito_legal": "Distrito Legal",
        "grangala": "Gran Gala Flamenco",
        "neuron": "Neuron Rehab",
        "sistemlab": "SistemLab",
        "deuda": "Asociacion Deuda",
        "estudiantes": "Asociacion Estudiantes Extranjero",
        "segunda": "Nueva Ley Segunda Oportunidad",
        "comparador": "Comparador Aprender Idiomas"
      };
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStrategies, setGeneratedStrategies] = useState<any[]>([]);

  const [message, setMessage] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const clienteDisplayNames = {
    distrito_legal: 'Distrito Legal',
    neuron: 'Neuron',
    sistemlab: 'Sistem Lab',
    grangala: 'Gran Gala Flamenco',
    deuda: 'Asociacion Deuda',
    estudiantes: 'Asociacion Estudiantes Extranjero',
    segunda: 'Nueva Ley Segunda Oportunidad',
    comparador: 'Comparador Aprender Idiomas'
  };

  const getClienteDisplayName = (cliente: string) => {
    return clienteDisplayNames[cliente as keyof typeof clienteDisplayNames] || cliente;
  };

  const exportToCSV = () => {
    if (generatedStrategies.length === 0) {
      alert('No hay estrategias generadas para exportar');
      return;
    }

    let csvContent = 'Cliente,Ejecución ID,Estado,Fecha de Creación,';

    // Add table headers from the first strategy if available
    let allRows: any[] = [];

    generatedStrategies.forEach((strategy) => {
      const strategyResults = parseMarkdownTable(
        strategy.webhookResult && typeof strategy.webhookResult === 'string'
          ? strategy.webhookResult
          : strategy.webhookResult?.output ||
            (Array.isArray(strategy.webhookResult) && strategy.webhookResult[0]?.output) ||
            strategy.webhookResult?.response ||
            strategy.webhookResult?.data ||
            JSON.stringify(strategy.webhookResult, null, 2)
      );

      // Add table headers
      if (strategyResults.length > 0 && csvContent === 'Cliente,Ejecución ID,Estado,Fecha de Creación,') {
        const firstRow = strategyResults[0];
        const headers = ['Fecha', 'Canal', 'Tipo', 'Formato', 'Título', 'Copy', 'CTA', 'Hashtags'].filter(header =>
          Object.keys(firstRow).some(key =>
            key.toLowerCase().includes(header.toLowerCase())
          )
        );
        csvContent += headers.join(',') + '\n';
      }

      // Add strategy metadata
      const strategyMetadata = `${getClienteDisplayName(strategy.cliente)},${strategy.executionId || 'N/A'},${strategy.estado},${new Date(strategy.createdAt).toLocaleString()},`;

      strategyResults.forEach((row: any) => {
        const csvRow = [
          row.fecha || row.date || '',
          row.canal || row.channel || '',
          row.tipo || row.pilar || '',
          row.formato || row.format || '',
          `"${(row.tema_titulo || row.titulo || row.title || '').replace(/"/g, '""')}"`,
          `"${(row.copy || row.texto || '').replace(/"/g, '""')}"`,
          row.cta || '',
          row.hashtags || ''
        ];
        allRows.push(strategyMetadata + csvRow.join(','));
      });
    });

    csvContent += allRows.join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `estrategias_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para generar un ID único para cada fila
  const generateRowId = (strategyId: string, rowIndex: number) => {
    return `${strategyId}-${rowIndex}`;
  };

  // Función para manejar selección/deselección de fila
  const handleRowSelect = (rowId: string) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(rowId)) {
      newSelectedRows.delete(rowId);
    } else {
      newSelectedRows.add(rowId);
    }
    setSelectedRows(newSelectedRows);
  };

  // Función para seleccionar/deseleccionar todas las filas
  const handleSelectAll = () => {
    if (selectedRows.size === getAllRowIds().length) {
      // Deseleccionar todas
      setSelectedRows(new Set());
    } else {
      // Seleccionar todas
      setSelectedRows(new Set(getAllRowIds()));
    }
  };

  // Función para obtener todos los IDs de filas disponibles
  const getAllRowIds = () => {
    const allIds: string[] = [];
    generatedStrategies.forEach((strategy) => {
      const strategyResults = parseMarkdownTable(
        strategy.webhookResult && typeof strategy.webhookResult === 'string'
          ? strategy.webhookResult
          : strategy.webhookResult?.output ||
            (Array.isArray(strategy.webhookResult) && strategy.webhookResult[0]?.output) ||
            strategy.webhookResult?.response ||
            strategy.webhookResult?.data ||
            JSON.stringify(strategy.webhookResult, null, 2)
      );
      strategyResults.forEach((_, index) => {
        allIds.push(generateRowId(strategy.id, index));
      });
    });
    return allIds;
  };

  // Función para guardar las filas seleccionadas
  const saveSelectedRows = async () => {
    if (selectedRows.size === 0) {
      setMessage('Selecciona al menos una fila para guardar');
      return;
    }

    if (!selectedClientId) {
      setMessage('Seleccione un cliente primero');
      return;
    }

    setIsSaving(true);

    try {
      // Importar supabase-client
      const { supabase } = await import("@/utils/supabase-client");

      const rowsToSave: any[] = [];

      generatedStrategies.forEach((strategy) => {
        const strategyResults = parseMarkdownTable(
          strategy.webhookResult && typeof strategy.webhookResult === 'string'
            ? strategy.webhookResult
            : strategy.webhookResult?.output ||
              (Array.isArray(strategy.webhookResult) && strategy.webhookResult[0]?.output) ||
              strategy.webhookResult?.response ||
              strategy.webhookResult?.data ||
              JSON.stringify(strategy.webhookResult, null, 2)
        );

        strategyResults.forEach((row: any, index: number) => {
          const rowId = generateRowId(strategy.id, index);
          if (selectedRows.has(rowId)) {
            rowsToSave.push({
              client_id: selectedClientId,
              execution_id: strategy.executionId,
              estado: strategy.estado,
              fecha: row.fecha ? new Date(row.fecha).toISOString().split('T')[0] : null,
              canal: Array.isArray(row.canal) ? row.canal : (row.canal ? [row.canal] : []),
              tipo: row.pilar || row.tipo || null,
              formato: row.formato || null,
              titulo: row.tema_titulo || row.titulo || row.title || null,
              copy: row.copy || row.texto || null,
              cta: row.cta || null,
              hashtags: row.hashtags || null
            });
          }
        });
      });

      console.log('📋 Guardando en tabla unificada: estrategias');
      console.log('📊 Rows to save:', rowsToSave);

      // Get the client UUID directly from the mapping
      console.log('🔍 Looking up client UUID for:', selectedClientId);

      const clientUuid = clientUuidMap[selectedClientId];

      if (!clientUuid) {
        console.error('❌ No UUID found for client:', selectedClientId);
        console.error('🔍 Searched in mapping:', Object.keys(clientUuidMap));
        setMessage(`Error: Cliente "${selectedClientId}" no encontrado en el mapeo de UUIDs.`);
        return;
      }

      console.log('✅ Found client UUID in mapping:', clientUuid);

      // Create client record object
      const clientRecord = {
        id: clientUuid,
        name: (clientNameMap as any)[selectedClientId] || selectedClientId
      };

      // Update all rows with the proper client_id UUID
      const rowsWithClientId = rowsToSave.map(row => ({
        ...row,
        client_id: clientRecord.id
      }));

      console.log('📊 Updated rows with client UUID, sample:', rowsWithClientId.slice(0, 1));

      // Guardar en la tabla unificada "estrategias"
      const { data, error } = await supabase
        .from('estrategias')
        .insert(rowsWithClientId);

      if (error) {
        console.error('Error saving to database:', error);
        console.error('Rows to save:', rowsToSave);
        setMessage(`Error al guardar en la tabla estrategias. Ver detalles en consola.`);
        return;
      }

      setMessage(`✅ ${rowsToSave.length} fila(s) guardada(s) correctamente en la base de datos`);
      setSelectedRows(new Set());

    } catch (error) {
      console.error('Error saving rows:', error);
      setMessage('Error al guardar las filas');
    } finally {
      setIsSaving(false);
    }
  };

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



  // Function to export a specific execution to CSV
  const exportExecutionToCSV = (execution: any, clientName: string) => {
    let csvContent = 'Cliente,Ejecución ID,Fecha,Canal,Tipo,Formato,Título,Copy,CTA,Hashtags\n';

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
        strategy.hashtags || ''
      ];
      csvContent += csvRow.join(',') + '\n';
    });

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `estrategia_${execution.execution_id}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  const handleGenerateStrategy = async () => {
    if (!selectedClientId) {
      setMessage('Seleccione un cliente');
      return;
    }

    const webhookUrls: Record<string, string> = {
      distrito_legal: 'https://content-generator.nv0ey8.easypanel.host/webhook/rrss-distrito',
      neuron: 'https://content-generator.nv0ey8.easypanel.host/webhook/rrss-neuron',      
      sistemlab: 'https://content-generator.nv0ey8.easypanel.host/webhook/rrss-sistemlab',
      grangala: 'https://content-generator.nv0ey8.easypanel.host/webhook/rrss-grangala',
      deuda: 'https://content-generator.nv0ey8.easypanel.host/webhook/rrss-deuda',
      estudiantes: 'https://content-generator.nv0ey8.easypanel.host/webhook/rrss-estudiantes',
      segunda: 'https://content-generator.nv0ey8.easypanel.host/webhook/rrss-segunda',
      comparador: 'https://content-generator.nv0ey8.easypanel.host/webhook/rrss-comparador'
    };

    setIsGenerating(true);
    setMessage('');

    try {
      // 🔍 DEBUG: Log webhook lookup
      console.log('🟡 Debugging webhook lookup:');
      console.log('  selectedClientId:', selectedClientId);
      console.log('  available webhook keys:', Object.keys(webhookUrls));
      console.log('  webhook URL found:', webhookUrls[selectedClientId] || 'UNDEFINED');

      if (!webhookUrls[selectedClientId]) {
        const shortClientId = selectedClientId.replace('_rehab', '').replace('_legal', '');
        console.log('🔄 Trying shortened ID:', shortClientId);
        console.log('  Found webhook:', webhookUrls[shortClientId] || 'UNDEFINED');
      }

      const selectedWebhookUrl = webhookUrls[selectedClientId] || webhookUrls[selectedClientId.replace('_rehab', '').replace('_legal', '')];

      if (!selectedWebhookUrl) {
        throw new Error(`No webhook found for client: ${selectedClientId}`);
      }

      const response = await fetch(`${selectedWebhookUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cliente: selectedClientId,
          timestamp: new Date().toISOString(),
          action: 'generar_estrategia'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Use global execution tracking
      const execution = createExecution('strategy', selectedClientId, {
        cliente: selectedClientId,
        timestamp: new Date().toISOString(),
        action: 'generar_estrategia'
      }, result);

      const newStrategy = {
        id: execution.id,
        cliente: selectedClientId,
        executionId: execution.executionId,
        workflowUrl: execution.workflowUrl,
        webhookResult: result,
        createdAt: execution.createdAt,
        estado: 'Estrategia generada'
      };

      setGeneratedStrategies(prev => [newStrategy, ...prev]);
      setMessage(`Estrategia generada correctamente para ${getClienteDisplayName(selectedClientId)}. ${execution.executionId}`);

    } catch (error) {
      console.error('Error calling webhook:', error);
      setMessage('Error al generar la estrategia. Verifica tu conexión.');
    } finally {
      setIsGenerating(false);
    }
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
          <IconRocket size={32} color="#1976d2" />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Generador de Estrategias
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Crea una estrategia efectiva
        </Typography>
      </Box>

      {/* Client Alert */}
      {!selectedClientId && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Seleccione un cliente
        </Alert>
      )}

      {/* Action Button */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<IconRocket />}
          onClick={handleGenerateStrategy}
          disabled={!selectedClientId || isGenerating}
          sx={{
            px: 6,
            py: 2,
            fontSize: '1.1rem',
            borderRadius: 3,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            color: '#ffffff !important',
            boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)',
            '& .MuiButton-startIcon': {
              color: 'white'
            },
            '&:hover': {
              transform: 'translateY(-2px)',
              transition: 'all 0.3s ease'
            }
          }}
        >
          {isGenerating ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Generando Estrategia...
            </>
          ) : (
            'Generar Estrategia'
          )}
        </Button>
      </Box>

      {/* Features Cards */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        sx={{ mb: 4 }}
        justifyContent="center"
        alignItems="stretch"
      >
        <Card sx={{ flex: 1, borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <IconTarget size={48} color="#1976d2" style={{ marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom>
              Objetivos Claros
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Define objetivos específicos para maximizar el impacto de tu campaña
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <IconUsers size={48} color="#2e7d32" style={{ marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom>
              Público Objetivo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Genera estrategias más efectivas para tu audiencia específica
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <IconChartBar size={48} color="#ed6c02" style={{ marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom>
              Resultados
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Obtener resultados y ajusta estrategias 
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Message */}
      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}

      {/* Generated Strategies */}
      {generatedStrategies.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconTrendingUp size={20} />
              Estrategias Generadas ({generatedStrategies.length})
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<IconDownload />}
              onClick={exportToCSV}
              sx={{
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

          <Stack spacing={2}>
            {generatedStrategies.map((strategy) => (
              <Card key={strategy.id} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h6">
                      Estrategia para {getClienteDisplayName(strategy.cliente)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        backgroundColor: 'success.light',
                        color: 'success.contrastText',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {strategy.estado}
                    </Typography>
                    {strategy.executionId && (
                      <Typography
                        variant="body2"
                        sx={{
                          px: 2,
                          py: 0.5,
                          borderRadius: 2,
                          backgroundColor: 'info.light',
                          color: 'info.contrastText',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        ID: {strategy.executionId}
                      </Typography>
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Activada: {new Date(strategy.createdAt).toLocaleString()}
                  </Typography>

                 {/*  {strategy.workflowUrl && (
                    <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                      <strong></strong> <a href={strategy.workflowUrl} target="_blank" rel="noopener noreferrer">
                        Ver ejecución {strategy.executionId}
                      </a>
                    </Typography>
                  )} */}

                  {(() => {
                    console.log('🔍 Analyzing webhook response:', strategy.webhookResult);

                    let strategyResults: any[] = [];
                    let rawResponse = '';

                    // Handle different response formats
                    if (strategy.webhookResult) {
                      if (strategy.webhookResult.output) {
                        rawResponse = strategy.webhookResult.output;
                      } else if (Array.isArray(strategy.webhookResult) && strategy.webhookResult[0]?.output) {
                        rawResponse = strategy.webhookResult[0].output;
                      } else if (strategy.webhookResult.response || strategy.webhookResult.data) {
                        rawResponse = strategy.webhookResult.response || strategy.webhookResult.data;
                      } else {
                        // Convert object to string if it's not already
                        rawResponse = typeof strategy.webhookResult === 'string'
                          ? strategy.webhookResult
                          : JSON.stringify(strategy.webhookResult, null, 2);
                      }
                    }

                    // Try to parse table from response
                    if (rawResponse) {
                      strategyResults = parseMarkdownTable(rawResponse);
                      console.log('📊 Parsed results:', strategyResults.length, 'items');
                    }

                    // Debug: Always show raw response for troubleshooting
                    console.log('📄 Raw response for debugging:', rawResponse);

                    // Show table if we have parsed results
                    if (strategyResults.length > 0) {
                      return (
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                              ✅ {strategyResults.length} elementos
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<IconDeviceFloppy />}
                                onClick={saveSelectedRows}
                                disabled={selectedRows.size === 0 || isSaving}
                                sx={{
                                  borderColor: 'success.main',
                                  color: selectedRows.size === 0 ? 'grey.500' : 'success.main',
                                  '&:hover': {
                                    backgroundColor: 'success.main',
                                    color: 'white',
                                    borderColor: 'success.main'
                                  },
                                  '&.Mui-disabled': {
                                    color: 'grey.400',
                                    borderColor: 'grey.300'
                                  }
                                }}
                              >
                                {isSaving ? (
                                  <>
                                    <CircularProgress size={14} sx={{ mr: 1 }} />
                                    Guardando...
                                  </>
                                ) : (
                                  `Guardar (${selectedRows.size})`
                                )}
                              </Button>
                            </Box>
                          </Box>
                          <TableContainer>
                            <Table size="small" sx={{ minWidth: 800 }}>
                              <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', width: '50px' }}>
                                    <Checkbox
                                      size="small"
                                      checked={selectedRows.size === getAllRowIds().length && getAllRowIds().length > 0}
                                      indeterminate={selectedRows.size > 0 && selectedRows.size < getAllRowIds().length}
                                      onChange={handleSelectAll}
                                      sx={{ p: 0 }}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Fecha</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Canal</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Tipo</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Formato</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 150 }}>Título</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', minWidth: 200 }}>Copy</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>CTA</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Hashtags</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {strategyResults.map((row: any, index: number) => {
                                  const rowId = generateRowId(strategy.id, index);
                                  const isSelected = selectedRows.has(rowId);
                                  return (
                                    <TableRow key={index} sx={{
                                      '&:nth-of-type(even)': { bgcolor: 'grey.50' },
                                      bgcolor: isSelected ? 'action.selected' : 'inherit'
                                    }}>
                                      <TableCell sx={{ fontSize: '0.8rem', width: '50px', p: 0.5 }}>
                                        <Checkbox
                                          size="small"
                                          checked={isSelected}
                                          onChange={() => handleRowSelect(rowId)}
                                          sx={{ p: 0 }}
                                        />
                                      </TableCell>
                                      <TableCell sx={{ fontSize: '0.8rem' }}>{row.fecha || '-'}</TableCell>
                                      <TableCell sx={{ fontSize: '0.8rem' }}>{row.canal || '-'}</TableCell>
                                      <TableCell sx={{ fontSize: '0.8rem' }}>{row.tipo || row.pilar || '-'}</TableCell>
                                      <TableCell sx={{ fontSize: '0.8rem' }}>{row.formato || '-'}</TableCell>
                                      <TableCell sx={{ fontSize: '0.8rem', maxWidth: 150 }}>
                                        {row.tema_titulo || row.titulo || '-'}
                                      </TableCell>
                                      <TableCell sx={{ fontSize: '0.8rem', maxWidth: 200 }}>
                                        {row.copy || row.texto || '-'}
                                      </TableCell>
                                      <TableCell sx={{ fontSize: '0.8rem' }}>{row.cta || '-'}</TableCell>
                                      <TableCell sx={{ fontSize: '0.8rem' }}>{row.hashtags || '-'}</TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      );
                    }

                    // Fallback: Show raw response
                    return rawResponse ? (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'warning.main' }}>
                          ⚠️ Respuesta del servidor (formato raw):
                        </Typography>
                        <Typography variant="body2" sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          whiteSpace: 'pre-wrap',
                          maxHeight: '300px',
                          overflowY: 'auto',
                          p: 2,
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'warning.light'
                        }}>
                          {rawResponse}
                        </Typography>
                      </Box>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Paper>
      )}



    </Box>
  );
}
