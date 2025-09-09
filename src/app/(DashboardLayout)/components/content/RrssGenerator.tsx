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
  const [latestStrategy, setLatestStrategy] = useState<any[]>([]);
  const [loadingLatest, setLoadingLatest] = useState(false);

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
      // For Distrito Legal, use the specific execution ID 320 as requested
      const latestExecutionId = client.id === 'distrito_legal' ? '320' : client.executionIds[client.executionIds.length - 1];

      console.log('Fetching execution:', `https://content-generator.nv0ey8.easypanel.host/workflow/${client.workflowId}/executions/${latestExecutionId}`);

      const response = await fetch(`https://content-generator.nv0ey8.easypanel.host/workflow/${client.workflowId}/executions/${latestExecutionId}`);

      console.log('Response status:', response.status);

      if (!response.ok) {
        console.log('Failed to load strategy, status:', response.status);
        setLatestStrategy([]);
        return;
      }

      const executionData = await response.json();
      console.log('Execution data received:', executionData);

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

  // Load latest strategy when client changes or component mounts
  useEffect(() => {
    if (client && client.executionIds && client.executionIds.length > 0) {
      loadLatestStrategy();
    }
  }, [selectedClientId]);

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
        else if (lowerHeader.includes('enlace') || lowerHeader.includes
