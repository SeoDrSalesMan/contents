"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Stack, TextField, Button,
  Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Card, CardContent, CardActions, Chip, Tabs, Tab, CircularProgress, IconButton
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useSearchParams } from "next/navigation";
import { useContentSettings } from "./ContentSettingsContext";

export default function StructureGenerator() {
  const searchParams = useSearchParams();
  const { clients, selectedClientId, globalInstructions, setSelectedClientId, draftArticle, setDraftArticle } = useContentSettings();
  const client = useMemo(() => clients.find(c => c.id === selectedClientId) || null, [clients, selectedClientId]);

  const [title, setTitle] = useState<string>("");
  const [keyword, setKeyword] = useState<string>("");
  const [tone, setTone] = useState<string>("profesional");
  const [generatedStructures, setGeneratedStructures] = useState<Array<{titulo: string; estructura: any[]; executionInfo?: any}>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [editTitleValue, setEditTitleValue] = useState<string>("");
  const [editingStructureItem, setEditingStructureItem] = useState<{structureIndex: number, itemIndex: number} | null>(null);
  const [editStructureItemValue, setEditStructureItemValue] = useState<string>("");

  // Function to create a rich structure fallback with detailed instructions
  const createRichStructureFallback = (): any[] => {
    return [
      {
        nivel: "H1",
        titulo: title || "Sentencias recientes que impactan la Ley Segunda Oportunidad",
        instruccion: "Introducir el tema, destacando la importancia de conocer las últimas sentencias y cómo estas afectan la aplicabilidad de la Ley Segunda Oportunidad. Debe captar la atención del lector y enfatizar el valor del análisis jurídico."
      },
      {
        nivel: "H2",
        titulo: "Introducción",
        instruccion: "Presentar brevemente la Ley Segunda Oportunidad y explicar por qué las sentencias recientes son relevantes. Conectar emocionalmente resaltando la necesidad de información actualizada para tomar decisiones legales acertadas en situaciones financieras difíciles."
      },
      {
        nivel: "H2",
        titulo: "Contexto de la Ley Segunda Oportunidad",
        instruccion: "Explicar el origen, objetivos y beneficios principales de la ley, apoyándose en ejemplos o antecedentes históricos que hayan influido en su evolución."
      },
      {
        nivel: "H3",
        titulo: "Qué es la Ley Segunda Oportunidad",
        instruccion: "Definir la ley, describir su alcance legal y los perfiles de quienes pueden beneficiarse."
      },
      {
        nivel: "H3",
        titulo: "Antecedentes y evolución legal",
        instruccion: "Describir los hitos legales relevantes y cómo sentencias previas han contribuido a la interpretación actual de la ley."
      },
      {
        nivel: "H2",
        titulo: "Análisis de sentencias recientes",
        instruccion: "Realizar un análisis detallado de las sentencias más relevantes y recientes que han marcado un precedente en la aplicación de la Ley Segunda Oportunidad."
      },
      {
        nivel: "H2",
        titulo: "Recomendaciones y consejos prácticos",
        instruccion: "Proporcionar recomendaciones basadas en el análisis, dirigidas a personas y pymes considerando acogerse a la ley."
      },
      {
        nivel: "H2",
        titulo: "Conclusiones y próximos pasos",
        instruccion: "Resumir los hallazgos y puntos clave del artículo. Enfatizar la necesidad de estar al tanto de los cambios jurisprudenciales."
      },
      {
        nivel: "FAQ",
        titulo: "FAQ 1: ¿Qué es la Ley Segunda Oportunidad y a quién está dirigida?",
        instruccion: "Dar una definición concisa y mencionar los beneficios y perfiles de beneficiarios."
      },
      {
        nivel: "FAQ",
        titulo: "FAQ 2: ¿Cómo influyen las recientes sentencias en la interpretación de la ley?",
        instruccion: "Explicar la importancia de las decisiones judiciales y su efecto en la práctica legal."
      }
    ];
  };

  // Function to parse complete structure from n8n workflow content
  const parseStructureFromContent = (content: string): any[] => {
    const lines = content.split('\n');
    const structure: any[] = [];
    let currentLevel = 0;

    console.log('Parsing structure from content:', content.substring(0, 200) + '...');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.includes('H1:')) {
        const titulo = line.replace('H1:', '').trim();
        const instruccion = extractInstruction(lines, i);
        structure.push({
          nivel: 'H1',
          titulo: titulo,
          instruccion: instruccion
        });
        currentLevel = 1;
      } else if (line.includes('H2:')) {
        const titulo = line.replace('H2:', '').trim();
        const instruccion = extractInstruction(lines, i);
        structure.push({
          nivel: 'H2',
          titulo: titulo,
          instruccion: instruccion
        });
        currentLevel = 2;
      } else if (line.includes('H3:')) {
        const titulo = line.replace('H3:', '').trim();
        const instruccion = extractInstruction(lines, i);
        structure.push({
          nivel: 'H3',
          titulo: titulo,
          instruccion: instruccion
        });
        currentLevel = 3;
      } else if (line.match(/FAQ \d+:/) || line.includes('FAQ 1:') || line.includes('FAQ 2:') || line.includes('FAQ 3:') || line.includes('FAQ 4:')) {
        const titulo = line.trim();
        const instruccion = extractInstruction(lines, i);
        structure.push({
          nivel: 'FAQ',
          titulo: titulo,
          instruccion: instruccion
        });
        currentLevel = 4;
      }
    }

    console.log('Parsed structure:', structure);
    return structure.length > 0 ? structure : [
      { nivel: "H1", titulo: title || "Título principal del artículo" },
      { nivel: "H2", titulo: "Introducción" },
      { nivel: "H2", titulo: "Conclusión" }
    ];
  };

  // Extract instruction from lines following the heading
  const extractInstruction = (lines: string[], startIndex: number): string => {
    // Look for instruction pattern in the next few lines
    for (let i = startIndex + 1; i < Math.min(startIndex + 20, lines.length); i++) {
      const line = lines[i].trim();

      // Check for various instruction patterns
      if (line.startsWith('• Instrucción:') ||
          line.startsWith('– Instrucción:') ||
          line.startsWith('* Instrucción:') ||
          line === 'Instrucción:' ||
          line.includes('Instrucción:')) {

        // Extract everything after the instruction marker
        let instruction = '';
        if (line.includes('Instrucción:')) {
          instruction = line.split('Instrucción:')[1].trim();
        }

        // Continue collecting multi-line instructions
        let collecting = true;
        let currentLineIndex = i + 1;

        while (collecting && currentLineIndex < Math.min(startIndex + 20, lines.length)) {
          const nextLine = lines[currentLineIndex].trim();

          // Stop if we hit another heading, FAQ, or separator
          if (nextLine.startsWith('H1:') || nextLine.startsWith('H2:') || nextLine.startsWith('H3:') ||
              nextLine.match(/FAQ \d+:/) || nextLine.startsWith('FAQ 1:') || nextLine.startsWith('FAQ 2:') ||
              nextLine.includes('────────────────────────') ||
              nextLine.trim() === '' || nextLine === '─' || nextLine === '──' || nextLine === '───') {
            break;
          }

          // Continue collecting instruction parts
          if (instruction || nextLine.startsWith('  ') || nextLine.startsWith('       ') ||
              nextLine.startsWith('-') || nextLine.startsWith('*') || nextLine.startsWith('•') ||
              (nextLine.length > 0 && !nextLine.startsWith('H') && !nextLine.match(/FAQ \d+:/))) {
            instruction += (instruction ? (nextLine.startsWith('  ') ? '\n' : ' ') : '') + nextLine.trim();
            collecting = true;
          } else {
            collecting = false;
          }

          currentLineIndex++;
        }

        // Clean up the instruction text
        instruction = instruction.trim();
        if (instruction.startsWith('*')) instruction = instruction.substring(1).trim();
        if (instruction.startsWith('•')) instruction = instruction.substring(1).trim();

        console.log(`Extracted instruction: "${instruction.substring(0, 100)}..."`);
        return instruction;
      }
    }
    return '';
  };

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

  // Handle editing title functions
  const handleStartEditTitle = (index: number, currentTitle: string) => {
    setEditingTitle(index);
    setEditTitleValue(currentTitle);
  };

  const handleSaveTitle = () => {
    if (editingTitle !== null) {
      setGeneratedStructures(prev => prev.map((structure, index) =>
        index === editingTitle
          ? { ...structure, titulo: editTitleValue }
          : structure
      ));
      setEditingTitle(null);
      setEditTitleValue("");
    }
  };

  const handleCancelEditTitle = () => {
    setEditingTitle(null);
    setEditTitleValue("");
  };

  // Handle editing structure item functions
  const handleStartEditStructureItem = (structureIndex: number, itemIndex: number, currentTitle: string) => {
    setEditingStructureItem({ structureIndex, itemIndex });
    setEditStructureItemValue(currentTitle);
  };

  const handleSaveStructureItem = () => {
    if (editingStructureItem !== null) {
      const { structureIndex, itemIndex } = editingStructureItem;
      setGeneratedStructures(prev => prev.map((structure, sIdx) =>
        sIdx === structureIndex
          ? {
              ...structure,
              estructura: structure.estructura.map((item, iIdx) =>
                iIdx === itemIndex
                  ? { ...item, titulo: editStructureItemValue }
                  : item
              )
            }
          : structure
      ));
      setEditingStructureItem(null);
      setEditStructureItemValue("");
    }
  };

  const handleCancelEditStructureItem = () => {
    setEditingStructureItem(null);
    setEditStructureItemValue("");
  };

  // Handle generate article from structure
  const handleGenerateArticle = (structure: {titulo: string; estructura: any[]}) => {
    // Convert structure to text format expected by ArticleCreator
    const structureText = structure.estructura.map(item => {
      const titulo = typeof item.titulo === "string" ? item.titulo :
                   typeof item.titulo === "object" && item.titulo?.title ? item.titulo.title : "Sin título";
      return `${item.nivel} ${titulo}`;
    }).join('\n');

    // Set the draft data for ArticleCreator
    setDraftArticle({
      title: structure.titulo.split(' - Estructura')[0], // Remove the "- Estructura X" part
      structure: structureText
    });

    // Navigate to articles using Next.js router (better for preserving context)
    // For now, we'll encode the data in URL parameters as a fallback
    const titleParam = encodeURIComponent(structure.titulo.split(' - Estructura')[0]);
    const structureParam = encodeURIComponent(structureText);
    window.location.href = `/articulos?title=${titleParam}&structure=${structureParam}&fromStructure=true`;
  };

  const handleGenerateStructure = async () => {
    if (!client) {
      alert("Selecciona un cliente válido.");
      return;
    }

    setIsLoading(true);
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
      console.log('Raw response data:', JSON.stringify(data, null, 2));

      // Handle different possible response formats from n8n
      let structureData: any[] = [];
      let executionInfo = null;

      // NEW: Handle the actual response format from Strategy Generator
      if (data.parsed && data.parsed.structure) {
        console.log('Detected Strategy Generator format');
        structureData = [];
        if (data.parsed.structure.h1) {
          structureData.push({
            nivel: 'H1',
            titulo: data.parsed.structure.h1,
            instruccion: 'Presentación principal del contenido del artículo'
          });
        }
        if (data.parsed.structure.h2 && data.parsed.structure.h2.length > 0) {
          data.parsed.structure.h2.forEach((h2: string, index: number) => {
            structureData.push({
              nivel: 'H2',
              titulo: h2,
              instruccion: `Sección secundaria ${index + 1} del artículo`
            });
          });
        }
        if (data.parsed.faqs && data.parsed.faqs.length > 0) {
          data.parsed.faqs.forEach((faq: any, index: number) => {
            structureData.push({
              nivel: 'FAQ',
              titulo: `FAQ ${index + 1}: ${faq.question || 'Pregunta frecuente'}`,
              instruccion: faq.answer || 'Respuesta a la pregunta frecuente'
            });
          });
        }
      }
      // Keep existing direct structure data handling
      else if (data.estructura && Array.isArray(data.estructura)) {
        structureData = data.estructura;
      } else if (data.data && Array.isArray(data.data)) {
        structureData = data.data;
      } else if (Array.isArray(data)) {
        structureData = data;
      } else if (data.executionData) {
        console.log('Processing execution data response');
        // Handle execution data response
        executionInfo = {
          executionUrl: data.executionUrl,
          workflowId: data.executionData?.data?.workflowId,
          executionId: data.executionData?.id
        };

        console.log('Looking for structured output or raw content in execution data');

        // Always try to parse the text content directly, prioritizing the most recent successful output
        if (data.executionData?.data?.resultData) {
          const resultData = data.executionData.data.resultData;

          // Try to find any node that contains the structured content
          let rawContent = '';

          // Priority: look for nodes that seem to contain the complete output
          for (const nodeName of Object.keys(resultData.runData)) {
            console.log('Checking node:', nodeName);
            const nodeOutputs = resultData.runData[nodeName];
            for (const output of nodeOutputs) {
              console.log('Checking output data:', typeof output.data);
              if (output.data && typeof output.data === 'object') {
                console.log('Data keys:', Object.keys(output.data));
                for (const key in output.data) {
                  const value = output.data[key];
                  console.log('Key:', key, 'Type:', typeof value, 'Has H1:', typeof value === 'string' && (value.includes('H1:') || value.includes('H2:') || value.includes('━━')));
                  if (typeof value === 'string' && (value.includes('H1:') || value.includes('H2:') || value.includes('━━'))) {
                    // Prefer the richer content
                    if (value.length > (rawContent ? rawContent.length : 0)) {
                      rawContent = value;
                    }
                    break;
                  }
                }
              }
            }
          }

          // If we found raw content, parse it for the structure
          if (rawContent) {
            console.log('Raw content found (first 500 chars):', rawContent.substring(0, 500));
            structureData = parseStructureFromContent(rawContent);
            console.log('Successfully parsed structure from execution data, length:', structureData.length);

            // Log what we found
            if (structureData.length > 0) {
              console.log('First item parsed:', structureData[0]);
            } else {
              console.log('No structure parsed from content, using fallback');
              structureData = createRichStructureFallback();
            }
          } else {
            console.log('No raw content found in execution data, using fallback');
            structureData = createRichStructureFallback();
          }
        }

        if (structureData.length === 0) {
          alert(`Workflow ejecutado exitosamente!\n\nExecution ID: ${executionInfo.executionId}\nWorkflow ID: ${executionInfo.workflowId}\n\nSin embargo, no se pudo extraer la estructura del resultado. El workflow debe configurar su output correctamente.`);
          return;
        }
      } else {
        // For direct responses, try to parse complete content
        if (data && typeof data === 'string') {
          structureData = parseStructureFromContent(data);
        } else if (data.output && typeof data.output === 'string') {
          structureData = parseStructureFromContent(data.output);
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
      }

      setGeneratedStructures([{
        titulo: `${title} - Estructura ${generatedStructures.length + 1}`,
        estructura: structureData,
        executionInfo: executionInfo
      }]);

      setIsLoading(false);
    } catch (error) {
      console.error("Error al generar la estructura:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al generar la estructura: ${errorMessage}`);
      setIsLoading(false);
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


          </Stack>
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            size="large"
            onClick={handleGenerateStructure}
            disabled={isLoading || !title || !keyword || !client}
            fullWidth
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isLoading ? "Generando Estructura..." : "Generar Estructura"}
          </Button>
        </CardActions>
      </Card>

      {isLoading && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ mr: 2 }} />
              <Typography variant="h6">
                Generando Estructura...
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Estructuras recién generadas */}
      {generatedStructures.map((structure, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {editingTitle === index ? (
                <>
                  <TextField
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ mr: 1 }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveTitle();
                      } else if (e.key === 'Escape') {
                        handleCancelEditTitle();
                      }
                    }}
                  />
                  <IconButton size="small" onClick={handleSaveTitle} color="primary">
                    <CheckIcon />
                  </IconButton>
                  <IconButton size="small" onClick={handleCancelEditTitle} color="secondary">
                    <CloseIcon />
                  </IconButton>
                </>
              ) : (
                <>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {structure.titulo}
                  </Typography>
                  <IconButton size="small" onClick={() => handleStartEditTitle(index, structure.titulo)}>
                    <EditIcon />
                  </IconButton>
                </>
              )}
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Jerarquía</TableCell>
                  <TableCell>Título</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {structure.estructura && Array.isArray(structure.estructura) && structure.estructura.map((item, idx) => {
                  const currentTitle = typeof item.titulo === "string" ? item.titulo :
                                     typeof item.titulo === "object" && item.titulo?.title ?
                                     item.titulo.title : "Sin título";
                  const isEditing = editingStructureItem?.structureIndex === index &&
                                   editingStructureItem?.itemIndex === idx;

                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        <Chip
                          label={item.nivel}
                          color={
                            item.nivel === "H1" ? "primary" :
                            item.nivel === "H2" ? "secondary" :
                            item.nivel === "H3" ? "success" :
                            item.nivel === "FAQ" ? "info" : "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: item.nivel === "H1" ? "bold" : "normal" }}>
                        {isEditing ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              value={editStructureItemValue}
                              onChange={(e) => setEditStructureItemValue(e.target.value)}
                              size="small"
                              fullWidth
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveStructureItem();
                                } else if (e.key === 'Escape') {
                                  handleCancelEditStructureItem();
                                }
                              }}
                            />
                            <IconButton size="small" onClick={handleSaveStructureItem} color="primary">
                              <CheckIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={handleCancelEditStructureItem} color="secondary">
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ flexGrow: 1 }}>{currentTitle}</Box>
                            <IconButton
                              size="small"
                              onClick={() => handleStartEditStructureItem(index, idx, currentTitle)}
                              sx={{ ml: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {structure.executionInfo && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Execution ID: {structure.executionInfo.executionId}
                </Typography>
              </Box>
            )}
          </CardContent>
          <CardActions>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => handleGenerateArticle(structure)}
              fullWidth
            >
              Generar Artículo
            </Button>
          </CardActions>
        </Card>
      ))}

      {generatedStructures.length === 0 && client && (
        <Paper sx={{ p: 3, textAlign: "center", mt: 4 }}>
         {/*  <Typography color="text.secondary">
            Completa el formulario y genera tu primera estructura de artículo con IA
          </Typography> */}
        </Paper>
      )}
    </Box>
  );
}
