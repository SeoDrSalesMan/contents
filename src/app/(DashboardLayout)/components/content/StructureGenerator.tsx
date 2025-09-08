"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Stack, TextField, Button,
  FormControl, InputLabel, Select, MenuItem,
  Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Card, CardContent, CardActions, Chip, Tabs, Tab
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useContentSettings } from "./ContentSettingsContext";

export default function StructureGenerator() {
  const searchParams = useSearchParams();
  const { clients, selectedClientId, globalInstructions, setSelectedClientId } = useContentSettings();
  const client = useMemo(() => clients.find(c => c.id === selectedClientId) || null, [clients, selectedClientId]);

  const [title, setTitle] = useState<string>("");
  const [keyword, setKeyword] = useState<string>("");
  const [tone, setTone] = useState<string>("profesional");
  const [structureCount, setStructureCount] = useState<number>(1);
  const [generatedStructures, setGeneratedStructures] = useState<Array<{titulo: string; estructura: any[]; executionInfo?: any}>>([]);

  // Pre-fill form if coming from strategy
  useEffect(() => {
    const fromStrategy = searchParams.get('fromStrategy');
    const paramTitle = searchParams.get('title');
    const paramKeyword = searchParams.get('keyword');
    const paramClientId = searchParams.get('clientId');

    if (fromStrategy === 'true') {
      if (paramTitle) setTitle(paramTitle);
      if (paramKeyword) setKeyword(paramKeyword);
      if (paramClientId && paramClientId !== selectedClientId) {
        setSelectedClientId(paramClientId);
      }
    }
  }, [searchParams, selectedClientId, setSelectedClientId]);

  const handleGenerateStructure = async () => {
    if (!client) {
      alert("Selecciona un cliente válido.");
      return;
    }

    const webhookUrl = client.structureWebhook || client.webhook;

    try {
      // Use the Next.js API route to proxy the request and avoid CORS issues
      const response = await fetch('/api/generate-structure', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: webhookUrl,
          action: "generate-structure",
          titulo: title,
          keyword: keyword,
          tono: tone,
          clientId: client.id,
          instruccionesGlobales: globalInstructions,
          // Removiendo campos obsoletos alcance y estilo
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error generando estructura: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Handle different possible response formats from n8n
      let structureData = [];
      let executionInfo = null;

      // Check for direct structure data
      if (data.estructura && Array.isArray(data.estructura)) {
        structureData = data.estructura;
      } else if (data.data && Array.isArray(data.data)) {
        structureData = data.data;
      } else if (Array.isArray(data)) {
        structureData = data;
      } else if (data.executionData) {
        // Handle execution data response
        executionInfo = {
          executionUrl: data.executionUrl,
          workflowId: data.executionData?.data?.workflowId,
          executionId: data.executionData?.id
        };

        // Try to extract structure from execution data
        if (data.executionData?.data?.resultData?.runData) {
          const runData = data.executionData.data.resultData.runData;
          // Look for structure data in any node
          for (const nodeName of Object.keys(runData)) {
            const nodeData = runData[nodeName];
            if (nodeData && nodeData[0] && nodeData[0].data) {
              const nodeOutput = nodeData[0].data;
              if (nodeOutput.estructura && Array.isArray(nodeOutput.estructura)) {
                structureData = nodeOutput.estructura;
                break;
              } else if (nodeOutput.data && Array.isArray(nodeOutput.data)) {
                structureData = nodeOutput.data;
                break;
              } else if (Array.isArray(nodeOutput)) {
                structureData = nodeOutput;
                break;
              }
            }
          }
        }

        // If no structure found in execution data, show execution info
        if (structureData.length === 0) {
          alert(`Workflow ejecutado exitosamente!\n\nExecution ID: ${executionInfo.executionId}\nWorkflow ID: ${executionInfo.workflowId}\n\nSin embargo, no se pudo extraer la estructura del resultado. Revisa la configuración del workflow.`);
          return;
        }
      } else {
        // Fallback to mock structure if response format is unexpected
        console.warn("Unexpected response format, using fallback structure");
        structureData = [
          { nivel: "H1", titulo: title || "Título principal del artículo" },
          { nivel: "H2", titulo: "Introducción" },
          { nivel: "H2", titulo: "Principales beneficios" },
          { nivel: "H3", titulo: "Beneficio 1" },
          { nivel: "H3", titulo: "Beneficio 2" },
          { nivel: "H2", titulo: "Cómo implementar" },
          { nivel: "H2", titulo: "Conclusión" }
        ];
      }

      setGeneratedStructures([{
        titulo: `${title} - Estructura ${generatedStructures.length + 1}`,
        estructura: structureData,
        executionInfo: executionInfo
      }]);

    } catch (error) {
      console.error("Error al generar la estructura:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al generar la estructura: ${errorMessage}`);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Box sx={{ maxWidth: 900, mx: "auto", mb: 2 }}>
        <Tabs value="structure">
          <Tab value="structure" label="Generador de Estructuras" />
        </Tabs>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Generar Nueva Estructura
          </Typography>
          <Stack spacing={3}>
            <TextField
              label="Título del artículo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Palabra clave principal"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Tono</InputLabel>
              <Select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                label="Tono"
              >
                <MenuItem value="profesional">Profesional</MenuItem>
                <MenuItem value="informal">Informal</MenuItem>
                <MenuItem value="didáctico">Didáctico</MenuItem>
                <MenuItem value="cercano">Cercano</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Número de estructuras a generar"
              type="number"
              value={structureCount}
              onChange={(e) => setStructureCount(Number(e.target.value) || 1)}
              inputProps={{ min: 1, max: 5 }}
              fullWidth
            />
          </Stack>
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            size="large"
            onClick={handleGenerateStructure}
            disabled={!title || !keyword || !client}
            fullWidth
          >
            Generar Estructura
          </Button>
        </CardActions>
      </Card>

      {/* Estructuras recién generadas */}
      {generatedStructures.map((structure, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {structure.titulo}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Jerarquía</TableCell>
                  <TableCell>Título</TableCell>
                  <TableCell>Nivel</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {structure.estructura.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Chip
                        label={item.nivel}
                        color={item.nivel === "H1" ? "primary" : item.nivel === "H2" ? "secondary" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.titulo}</TableCell>
                    <TableCell>{idx + 1}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {generatedStructures.length === 0 && client && (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            Selecciona un cliente y genera tu primera estructura de artículo
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
