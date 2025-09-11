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
  CircularProgress
} from "@mui/material";

import {
  IconRocket,
  IconTarget,
  IconChartBar,
  IconTrendingUp,
  IconUsers
} from "@tabler/icons-react";
import { useContentSettings } from "../components/content/ContentSettingsContext";

export default function EstrategiasPage() {
  const { selectedClientId, createExecution, executions } = useContentSettings();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStrategies, setGeneratedStrategies] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  const clienteDisplayNames = {
    distrito_legal: 'Distrito Legal',
    neuron: 'Neuron',
    sistem_lab: 'Sistem Lab',
    gran_gala_flamenco: 'Gran Gala Flamenco'
  };

  const getClienteDisplayName = (cliente: string) => {
    return clienteDisplayNames[cliente as keyof typeof clienteDisplayNames] || cliente;
  };



  const handleGenerateStrategy = async () => {
    if (!selectedClientId) {
      setMessage('Seleccione un cliente');
      return;
    }

    const webhookUrls = {
      distrito_legal: 'https://content-generator.nv0ey8.easypanel.host/webhook/rrss-distrito',
      neuron: 'https://content-generator.nv0ey8.easypanel.host/webhook/rrss-neuron',
      sistem_lab: 'https://content-generator.nv0ey8.easypanel.host/webhook/rrss-sistemlab',
      gran_gala_flamenco: 'https://content-generator.nv0ey8.easypanel.host/webhook/rrss-grangala'
    };

    setIsGenerating(true);
    setMessage('');

    try {
      const response = await fetch(`${webhookUrls[selectedClientId as keyof typeof webhookUrls]}`, {
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
      setMessage(`Estrategia generada correctamente para ${getClienteDisplayName(selectedClientId)}. Ejecución ${execution.executionId}`);

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
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconTrendingUp size={20} />
            Estrategias Generadas ({generatedStrategies.length})
          </Typography>

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

                  {strategy.workflowUrl && (
                    <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                      <strong>Workflow:</strong> <a href={strategy.workflowUrl} target="_blank" rel="noopener noreferrer">
                        Ver ejecución {strategy.executionId}
                      </a>
                    </Typography>
                  )}

                  {strategy.webhookResult && strategy.webhookResult[0]?.output && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
                        {strategy.webhookResult[0].output}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Paper>
      )}


    </Box>
  );
}
