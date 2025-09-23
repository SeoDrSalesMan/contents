"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Stack, FormControl, InputLabel, Select, MenuItem,
  TextField, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, Tabs, Tab, FormGroup, FormControlLabel, Checkbox, Link as MuiLink, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, IconButton, Chip, Card, CardContent
} from "@mui/material";
import { IconDownload, IconTrendingUp } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useContentSettings, ContentItem } from "./ContentSettingsContext";

interface Filters { from: string; to: string; channel: string; format: string; funnel: string; }

// Estado para edición de nuevas estrategias
interface EditableStrategy extends ContentItem {
  isEditing?: boolean;
  originalIndex?: number;
}

function normKey(k: unknown): string {
  return String(k ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function parseIdeasPayload(data: unknown): ContentItem[] {
  let items: any[] = [];
  if (data && Array.isArray((data as any).rows)) items = (data as any).rows;
  else if (Array.isArray(data)) items = data as any[];
  else if (data && typeof data === "object" && Array.isArray((data as any).ideas)) items = (data as any).ideas;
  else if (data && typeof data === "object" && Array.isArray((data as any).items)) items = (data as any).items;
  else if (data && typeof data === "object" && Array.isArray((data as any).data)) items = (data as any).data;
  else if (typeof data === "string") {
    let text = data.trim();
    if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) text = text.slice(1, -1).trim();
    try {
      const p = JSON.parse(text);
      if (Array.isArray(p)) items = p;
      else if (p && typeof p === "object") { const fa = Object.values(p).find(v => Array.isArray(v)); items = (fa as any[]) || [p]; }
    } catch {
      const a = text.indexOf("["); const b = text.lastIndexOf("]");
      if (a !== -1 && b !== -1 && b > a) { try { items = JSON.parse(text.slice(a, b + 1)); } catch { items = [{ descripcion: text }]; } }
      else {
        const A = text.indexOf("{"); const B = text.lastIndexOf("}");
        if (A !== -1 && B !== -1 && B > A) { try { const p = JSON.parse(text.slice(A, B + 1)); const fa = Object.values(p).find(v => Array.isArray(v)); items = (fa as any[]) || [p]; } catch { items = [{ descripcion: text }]; } }
        else items = [{ descripcion: text }];
      }
    }
  } else if (data && typeof data === "object") { const fa = Object.values(data as any).find(v => Array.isArray(v)); items = (fa as any[]) || [data]; }
  else items = [data];

  return items.map((it: any): ContentItem => {
    if (!it || typeof it !== "object") return { fecha: "", titulo: String(it ?? ""), descripcion: "", keyword: "", funnel: "" };
    const n: Record<string, any> = {}; Object.keys(it).forEach(k => (n[normKey(k)] = (it as any)[k]));
    const asS = (v: any) => v == null ? "" : Array.isArray(v) ? v.join(", ") : String(v);
    const fecha = asS(n.fecha || n.date || n.fechaformato || "").slice(0, 10);
    return {
      fecha,
      titulo: asS(n.titulo || n.title || ""),
      descripcion: asS(n.descripcion || n.description || ""),
      keyword: asS(n.keyword || n.keywords || n.palabra || ""),
      volumen: asS(n.volumen || n.volume || ""),
      tipos: asS(n.tipos || n.tipo || n.types || ""),
      funnel: asS(n.funnel || n.embudo || "")
    };
  });
}

export default function StrategyGenerator() {
  const router = useRouter();
  const { clients, selectedClientId, defaultIdeas, globalInstructions, addStrategies, updateStrategy, addExecutionId } = useContentSettings();
  const [kw, setKw] = useState<string>("");
  const [ideasCount, setIdeasCount] = useState<number>(defaultIdeas);
  const [eventDate, setEventDate] = useState<string>("");
  const [canales, setCanales] = useState<string[]>([]);
  const [additionalInstructions, setAdditionalInstructions] = useState<string>("");
  const [newStrategies, setNewStrategies] = useState<ContentItem[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<number[]>([]);

  useEffect(() => setIdeasCount(defaultIdeas), [defaultIdeas]);

  const client = useMemo(() => clients.find(c => c.id === selectedClientId) || null, [clients, selectedClientId]);
  const items = useMemo(() => client?.strategies || [], [client]);

  const [latestExecutions, setLatestExecutions] = useState<ContentItem[]>([]);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({ from: "", to: "", channel: "", format: "", funnel: "" });

  // Estado para edición en línea de estrategias guardadas
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<ContentItem | null>(null);

  // Estado para edición en línea de nuevas estrategias
  const [editingNewStrategyIndex, setEditingNewStrategyIndex] = useState<number | null>(null);
  const [editingNewStrategyData, setEditingNewStrategyData] = useState<ContentItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Estado para historial guardado de ideas
  const [savedIdeas, setSavedIdeas] = useState<Record<string, any[]>>({});
  const [isLoadingSavedIdeas, setIsLoadingSavedIdeas] = useState(false);

  // Aplicar filtros a las últimas ejecuciones
  const filteredLatestExecutions = useMemo(() => {
    return latestExecutions.filter(it => {
      if (filters.from && it.fecha && it.fecha < filters.from) return false;
      if (filters.to && it.fecha && it.fecha > filters.to) return false;
      if (filters.funnel && it.funnel !== filters.funnel) return false;
      return true;
    });
  }, [latestExecutions, filters]);
  
  const filtered = useMemo(() => {
    return items.filter(it => {
      if (filters.from && it.fecha && it.fecha < filters.from) return false;
      if (filters.to && it.fecha && it.fecha > filters.to) return false;
      if (filters.funnel && it.funnel !== filters.funnel) return false;
      return true;
    });
  }, [items, filters]);

  // Mostrar las últimas estrategias guardadas del cliente
  useEffect(() => {
    if (!client) {
      setLatestExecutions([]);
      return;
    }

    setIsLoadingExecutions(true);
    setExecutionError(null);

    // Usar las estrategias ya guardadas del cliente (las últimas 25)
    const clientStrategies = client.strategies || [];

    console.log(`Cliente: ${client.name}`, clientStrategies);

    if (clientStrategies.length > 0) {
      // Mostrar las últimas 25 estrategias, las más recientes primero
      const recentStrategies = clientStrategies.slice(-25).reverse();
      setLatestExecutions(recentStrategies);
      setExecutionError(null);
      console.log(`Mostrando ${recentStrategies.length} ideas guardadas para ${client.name}`, recentStrategies);
    } else {
      setLatestExecutions([]);
      setExecutionError(`No hay ideas guardadas para ${client.name}. Genera algunas ideas usando el formulario superior.`);
      console.log(`No hay ideas guardadas para ${client.name}`);
    }

    setIsLoadingExecutions(false);
  }, [client]); // Ejecutar cuando cambia el cliente

  // Fetch saved ideas on mount and when selectedClientId changes
  useEffect(() => {
    fetchSavedIdeas();
  }, [selectedClientId]);

  // Function to fetch last 10 saved ideas per client
  const fetchSavedIdeas = async () => {
    setIsLoadingSavedIdeas(true);
    try {
      const { supabase } = await import("@/utils/supabase-client");

      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Get enough to cover last 10 per client

      if (error) {
        console.error('Error fetching saved ideas:', error);
        return;
      }

      // Group by client and take last 10 unique execution_ids per client
      const groupedByClient: Record<string, any[]> = {};

      data.forEach((idea: any) => {
        const clientUuid = idea.client_id;
        const executionId = idea.execution_id;

        if (!groupedByClient[clientUuid]) {
          groupedByClient[clientUuid] = [];
        }

        // Find if we already have this execution_id for this client
        const existingExecution = groupedByClient[clientUuid].find((item: any) => item.execution_id === executionId);

        if (!existingExecution && groupedByClient[clientUuid].length < 10) {
          groupedByClient[clientUuid].push({
            execution_id: executionId,
            ideas: [idea] // Will collect all ideas for this execution
          });
        } else if (existingExecution) {
          // Add to existing execution
          existingExecution.ideas.push(idea);
        }
      });

      console.log('✅ Fetched saved ideas:', groupedByClient);
      setSavedIdeas(groupedByClient);

    } catch (error) {
      console.error('Error loading saved ideas:', error);
    } finally {
      setIsLoadingSavedIdeas(false);
    }
  };

  // Function to export a specific execution to CSV
  const exportIdeasExecutionToCSV = (execution: any, clientName: string) => {
    let csvContent = 'ID,Ejecución ID,Fecha,Estado,Tipo,Título,Descripción,Keyword,Volumen,Hashtags,Fecha Creación\n';

    execution.ideas.forEach((idea: any) => {
      const csvRow = [
        idea.id,
        execution.execution_id,
        idea.fecha || '',
        idea.estado || '',
        idea.tipo || '',
        `"${(idea.titulo || '').replace(/"/g, '""')}"`,
        `"${(idea.copy || '').replace(/"/g, '""')}"`,
        '"NULL"',
        '"NULL"',
        idea.hashtags || '',
        new Date(idea.created_at).toLocaleString()
      ];
      csvContent += csvRow.join(',') + '\n';
    });

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ideas_${execution.execution_id}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executionUrl = (id: string) => {
    if (!client?.workflowId) return "#";
    return `https://content-generator.nv0ey8.easypanel.host/workflow/${client.workflowId}/executions/${id}`;
  };

  const funnels = useMemo<string[]>(() => Array.from(new Set(items.map(i => i.funnel).filter(Boolean))), [items]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!client) { alert("Selecciona un cliente válido."); return; }

    setIsGenerating(true);
    const ideasWebhook = client.ideasWebhook || client.webhook;
    let kwArray = (kw || "").split(",").map(s => s.trim()).filter(Boolean);
    if (kwArray.length > 3) kwArray = kwArray.slice(0, 3);
    while (kwArray.length < 3) kwArray.push("");

    const payload = {
      keyword1: kwArray,
      numeroIdeas: Number(ideasCount) || 0,
      eventoFechaEspecial: eventDate,
      canales: canales.join(", "),
      cliente: client.name,
      instruccionesGlobales: globalInstructions,
      instruccionesAdicionales: additionalInstructions || "",
    };

    try {
      const res = await fetch(ideasWebhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const text = await res.text();
      if (!res.ok) throw new Error(`Error webhook idea: ${res.status} - ${text}`);
      const executionId = res.headers.get("x-execution-id");
      if (executionId) {
        addExecutionId(selectedClientId, executionId);
      }
      let data: unknown; try { data = JSON.parse(text); } catch { data = text; }
      setNewStrategies(parseIdeasPayload(data));
    } catch (err) {
      console.error(err);
      alert("Error al generar las ideas. Revisa la consola.");
    } finally {
      setIsGenerating(false);
    }
  }

  function exportCSV(): void {
    const rows = [
      ["Fecha","Título","Descripción","Keyword","Volumen","Tipos","Funnel"].map(v=>`"${String(v).replace(/"/g,'""')}"`),
      ...filteredLatestExecutions.map(it=>[`"${(it.fecha||"").replace(/"/g,'""')}"`,`"${(it.titulo||"").replace(/"/g,'""')}"`,`"${(it.descripcion||"").replace(/"/g,'""')}"`,`"${(it.keyword||"").replace(/"/g,'""')}"`,`"${(it.volumen||"").replace(/"/g,'""')}"`,`"${(it.tipos||"").replace(/"/g,'""')}"`,`"${(it.funnel||"").replace(/"/g,'""')}"`])
    ].map(r=>r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF"+rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const clientName = client?.name || "estrategia";
    const today = new Date().toISOString().slice(0,10).replace(/-/g,"");
    a.href = url; a.download = `estrategia-${clientName.replace(/\s+/g,"_")}-${today}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const handleSaveSelected = async () => {
    const strategiesToSave = newStrategies.filter((_, index) => selectedStrategies.includes(index));

    if (strategiesToSave.length === 0) {
      alert('Selecciona al menos una idea para guardar');
      return;
    }

    if (!client) {
      alert('Cliente no encontrado');
      return;
    }

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
        alert(`Error: Cliente "${selectedClientId}" no encontrado en el mapeo de UUIDs.`);
        return;
      }

      const rowsToSave: any[] = strategiesToSave.map(strategy => ({
        client_id: clientUuid,
        execution_id: client.executionIds?.[client.executionIds.length - 1] || 'manual',
        estado: 'Idea generada',
        fecha: strategy.fecha ? new Date(strategy.fecha).toISOString().split('T')[0] : null,
        canal: [],
        tipo: strategy.tipos || null,
        formato: null,
        titulo: strategy.titulo || null,
        copy: strategy.descripcion || null,
        cta: null,
        hashtags: null
      }));

      const { data, error } = await supabase
        .from('ideas')
        .insert(rowsToSave);

      if (error) {
        console.error('Error saving ideas to database:', error);
        alert(`Error al guardar ideas: ${error.message}`);
        return;
      }

      alert(`✅ ${rowsToSave.length} idea(s) guardada(s) correctamente en la base de datos`);

      // Also add to context for immediate display
      addStrategies(selectedClientId, strategiesToSave);

      setNewStrategies([]);
      setSelectedStrategies([]);

    } catch (error) {
      console.error('Error saving ideas:', error);
      alert('Error al guardar las ideas');
    }
  };

  const handleGenerateStructure = (strategy: ContentItem) => {
    if (!client) {
      alert("Selecciona un cliente válido.");
      return;
    }

    // Navegar a la página de estructuras con parámetros de la estrategia
    const params = new URLSearchParams({
      title: strategy.titulo || "",
      keyword: strategy.keyword || "",
      description: strategy.descripcion || "",
      clientId: client.id,
      fromStrategy: "true"
    });

    router.push(`/estructuras?${params.toString()}`);
  };

  const handleEditStart = (index: number, strategy: ContentItem) => {
    setEditingIndex(index);
    setEditedData({ ...strategy });
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditedData(null);
  };

  const handleEditSave = () => {
    if (!client || editingIndex === null || !editedData) return;

    // Calcular el índice real en client.strategies
    const totalStrategies = client.strategies.length;
    const realIndex = totalStrategies - 1 - editingIndex;

    updateStrategy(client.id, realIndex, editedData);

    setEditingIndex(null);
    setEditedData(null);
  };

  const handleGenerateRrss = (strategy: ContentItem) => {
    if (!client) {
      alert("Selecciona un cliente válido.");
      return;
    }

    // Navegar a la página de RRSS con parámetros para auto-rellenar
    const params = new URLSearchParams({
      titulo: strategy.titulo || "",
      descripcion: strategy.descripcion || ""
    });

    router.push(`/rrss?${params.toString()}`);
  };

  // Funciones para edición de nuevas estrategias
  const handleEditNewStrategyStart = (index: number, strategy: ContentItem) => {
    setEditingNewStrategyIndex(index);
    setEditingNewStrategyData({ ...strategy });
  };

  const handleEditNewStrategyCancel = () => {
    setEditingNewStrategyIndex(null);
    setEditingNewStrategyData(null);
  };

  const handleEditNewStrategySave = () => {
    if (editingNewStrategyIndex === null || !editingNewStrategyData) return;

    // Actualizar la estrategia en newStrategies
    setNewStrategies(prev =>
      prev.map((strategy, index) =>
        index === editingNewStrategyIndex ? editingNewStrategyData : strategy
      )
    );

    setEditingNewStrategyIndex(null);
    setEditingNewStrategyData(null);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Box sx={{ maxWidth: 900, mx: "auto", mb: 2 }}>
        <Tabs value="ideas">
          <Tab value="ideas" label="Generador de Ideas" />
        </Tabs>
      </Box>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Termino clave"
            value={kw} onChange={e=>setKw(e.target.value)} required
            disabled={isGenerating}
          />





          <TextField
            label="Número de ideas a generar" type="number"
            value={ideasCount} onChange={e=>setIdeasCount(Number(e.target.value) || 0)}
            inputProps={{ min: 1, max: 100 }}
            disabled={isGenerating}
          />

          <TextField
            label="Evento o Fecha especial"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            placeholder="Ej: Navidad, Día de la Madre, etc."
            fullWidth
            disabled={isGenerating}
          />

          <TextField
            label="Instrucciones adicionales"
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            multiline
            rows={3}
            placeholder="Agrega instrucciones específicas para la generación de ideas..."
            fullWidth
            disabled={isGenerating}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={isGenerating}
            sx={{ minWidth: 180 }}
          >
            {isGenerating ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                Generando...
              </>
            ) : (
              'Generar ideas'
            )}
          </Button>
        </Stack>
      </Box>

      {/* Nuevas Estrategias deben aparecer después del historial de ejecuciones */}
      {client && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Historial de Ideas {/* Título más descriptivo */}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cliente: {client.name}
          </Typography>
        </Box>
      )}

      {/* Mostrar últimas estrategias con filtros */}
      {client && (
        <Paper variant="outlined" sx={{ mb: 3, bgcolor: isLoadingExecutions ? 'grey.50' : 'grey.25' }}>
          <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
            Últimas Ideas Generadas
            {isLoadingExecutions && " (Buscando...)"}
          </Typography>

          {executionError && (
            <Typography color="error" variant="body2" sx={{ px: 2 }}>
              {executionError}
            </Typography>
          )}

          {/* Filtros movidos aquí */}
          {latestExecutions.length > 0 && (
            <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2, flexWrap: "wrap" }}>
              <TextField
                label="Desde" type="date" InputLabelProps={{ shrink: true }}
                value={filters.from} onChange={e=>setFilters(f=>({ ...f, from: e.target.value }))} sx={{ width: 180 }}
              />
              <TextField
                label="Hasta" type="date" InputLabelProps={{ shrink: true }}
                value={filters.to} onChange={e=>setFilters(f=>({ ...f, to: e.target.value }))} sx={{ width: 180 }}
              />
            
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel id="funnel-label-history">Funnel</InputLabel>
                <Select<string>
                  labelId="funnel-label-history" label="Funnel" value={filters.funnel}
                  onChange={e=>setFilters(f=>({ ...f, funnel: e.target.value }))}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Array.from(new Set(latestExecutions.map(i => i.funnel).filter(Boolean))).map(v=><MenuItem key={v} value={v}>{v}</MenuItem>)}
                </Select>
              </FormControl>

              <Box sx={{ flexGrow: 1 }} />
              <Button variant="outlined" size="small" onClick={()=>setFilters({ from:"", to:"", channel:"", format:"", funnel:"" })}>
                Borrar Filtros
              </Button>
              <Button variant="contained" size="small" onClick={exportCSV}>
                Exportar CSV
              </Button>
            </Stack>
          )}

          <Table size="small">
            <TableHead>
              <TableRow>
                {["Fecha","Título","Descripción","Keyword","Volumen","Tipos","Funnel","Acciones"].map(h=>(
                  <TableCell key={h} sx={{ fontWeight: 'bold', textAlign: h === "Fecha" ? 'left' : 'left' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                      {h}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLatestExecutions.length > 0 ? (
                filteredLatestExecutions.map((strategy, index) => (
                  <TableRow key={`${strategy.titulo}-${index}`} sx={{ bgcolor: index === 0 ? 'action.selected' : 'inherit' }}>
                    <TableCell sx={{ width: '10%' }}>
                      {editingIndex === index ? (
                        <TextField
                          value={editedData?.fecha || ""}
                          onChange={(e) => setEditedData(prev => prev ? { ...prev, fecha: e.target.value } : null)}
                          fullWidth
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2">
                          {strategy.fecha || "Sin fecha"}
                          {index === 0 && (
                            <Typography component="span" color="primary" variant="caption" sx={{ ml: 1, fontWeight: 'bold' }}>
                            </Typography>
                          )}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ width: '20%' }}>
                      {editingIndex === index ? (
                        <TextField
                          value={editedData?.titulo || ""}
                          onChange={(e) => setEditedData(prev => prev ? { ...prev, titulo: e.target.value } : null)}
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                        />
                      ) : (
                        <Typography variant="body2" sx={{
                          fontWeight: index === 0 ? 'bold' : 'normal',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {strategy.titulo || "Sin título"}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ width: '25%' }}>
                      {editingIndex === index ? (
                        <TextField
                          value={editedData?.descripcion || ""}
                          onChange={(e) => setEditedData(prev => prev ? { ...prev, descripcion: e.target.value } : null)}
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                        />
                      ) : (
                        <Typography variant="body2" sx={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {strategy.descripcion || "Sin descripción"}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ width: '10%' }}>
                      {editingIndex === index ? (
                        <TextField
                          value={editedData?.keyword || ""}
                          onChange={(e) => setEditedData(prev => prev ? { ...prev, keyword: e.target.value } : null)}
                          fullWidth
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {strategy.keyword || "-"}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ width: '8%' }}>
                      {editingIndex === index ? (
                        <TextField
                          value={editedData?.volumen || ""}
                          onChange={(e) => setEditedData(prev => prev ? { ...prev, volumen: e.target.value } : null)}
                          fullWidth
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {strategy.volumen || "-"}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ width: '10%' }}>
                      {editingIndex === index ? (
                        <TextField
                          value={editedData?.tipos || ""}
                          onChange={(e) => setEditedData(prev => prev ? { ...prev, tipos: e.target.value } : null)}
                          fullWidth
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {strategy.tipos || "-"}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ width: '10%' }}>
                      {editingIndex === index ? (
                        <Select
                          value={editedData?.funnel || ""}
                          onChange={(e) => setEditedData(prev => prev ? { ...prev, funnel: e.target.value } : null)}
                          fullWidth
                          size="small"
                        >
                          <MenuItem value="TOFU">TOFU</MenuItem>
                          <MenuItem value="MOFU">MOFU</MenuItem>
                          <MenuItem value="BOFU">BOFU</MenuItem>
                        </Select>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {strategy.funnel || "-"}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ width: '15%' }}>
                      {editingIndex === index ? (
                        <Box>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={handleEditSave}
                            sx={{ mr: 1, fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                          >
                            Guardar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={handleEditCancel}
                            sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                          >
                            Cancelar
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleEditStart(index, strategy)}
                            sx={{ mr: 1, fontSize: '0.75rem', minWidth: 'auto', px: 1.5, py: 0.5 }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleGenerateStructure(strategy)}
                            sx={{ mr: 1, fontSize: '0.75rem', minWidth: 'auto', px: 1.5, py: 0.5 }}
                          >
                            Estructura
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleGenerateRrss(strategy)}
                            sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1.5, py: 0.5 }}
                          >
                            RRSS
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : !isLoadingExecutions && (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                    <Typography variant="body2">
                      No se encontraron ejecuciones recientes para {client.name}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {newStrategies.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Nuevas Ideas Generadas</Typography>
            <Button onClick={handleSaveSelected} variant="contained">Guardar Seleccionadas</Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Edite las estrategias antes de guardarlas en la base de datos
          </Typography>
          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Seleccionar</TableCell>
                  {["Fecha","Título","Descripción","Keyword","Volumen","Tipos","Funnel","Acciones"].map(h=>(
                    <TableCell key={h} sx={{ fontWeight: 'bold', textAlign: 'left' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                        {h}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {newStrategies.map((strategy, index) => (
                  <TableRow key={`${strategy.titulo}-${index}`}>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Checkbox
                        checked={selectedStrategies.includes(index)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStrategies(prev => [...prev, index]);
                          } else {
                            setSelectedStrategies(prev => prev.filter(i => i !== index));
                          }
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ width: '10%' }}>
                      {editingNewStrategyIndex === index ? (
                        <TextField
                          value={editingNewStrategyData?.fecha || ""}
                          onChange={(e) => setEditingNewStrategyData(prev => prev ? { ...prev, fecha: e.target.value } : null)}
                          fullWidth
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2">{strategy.fecha || "Sin fecha"}</Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ width: '15%' }}>
                      {editingNewStrategyIndex === index ? (
                        <TextField
                          value={editingNewStrategyData?.titulo || ""}
                          onChange={(e) => setEditingNewStrategyData(prev => prev ? { ...prev, titulo: e.target.value } : null)}
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {strategy.titulo || "Sin título"}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ width: '20%' }}>
                      {editingNewStrategyIndex === index ? (
                        <TextField
                          value={editingNewStrategyData?.descripcion || ""}
                          onChange={(e) => setEditingNewStrategyData(prev => prev ? { ...prev, descripcion: e.target.value } : null)}
                          fullWidth
                          size="small"
                          multiline
                          rows={3}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {strategy.descripcion || "Sin descripción"}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ width: '10%' }}>
                      {editingNewStrategyIndex === index ? (
                        <TextField
                          value={editingNewStrategyData?.keyword || ""}
                          onChange={(e) => setEditingNewStrategyData(prev => prev ? { ...prev, keyword: e.target.value } : null)}
                          fullWidth
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">{strategy.keyword || "-"}</Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ width: '8%' }}>
                      {editingNewStrategyIndex === index ? (
                        <TextField
                          value={editingNewStrategyData?.volumen || ""}
                          onChange={(e) => setEditingNewStrategyData(prev => prev ? { ...prev, volumen: e.target.value } : null)}
                          fullWidth
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">{strategy.volumen || "-"}</Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ width: '10%' }}>
                      {editingNewStrategyIndex === index ? (
                        <TextField
                          value={editingNewStrategyData?.tipos || ""}
                          onChange={(e) => setEditingNewStrategyData(prev => prev ? { ...prev, tipos: e.target.value } : null)}
                          fullWidth
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">{strategy.tipos || "-"}</Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ width: '10%' }}>
                      {editingNewStrategyIndex === index ? (
                        <Select
                          value={editingNewStrategyData?.funnel || ""}
                          onChange={(e) => setEditingNewStrategyData(prev => prev ? { ...prev, funnel: e.target.value } : null)}
                          fullWidth
                          size="small"
                        >
                          <MenuItem value="TOFU">TOFU</MenuItem>
                          <MenuItem value="MOFU">MOFU</MenuItem>
                          <MenuItem value="BOFU">BOFU</MenuItem>
                        </Select>
                      ) : (
                        <Typography variant="body2" color="text.secondary">{strategy.funnel || "-"}</Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ width: '17%' }}>
                      {editingNewStrategyIndex === index ? (
                        <Box>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={handleEditNewStrategySave}
                            sx={{ mr: 1, fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                          >
                            Guardar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={handleEditNewStrategyCancel}
                            sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                          >
                            Cancelar
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleEditNewStrategyStart(index, strategy)}
                            sx={{ mr: 1, fontSize: '0.75rem', minWidth: 'auto', px: 1.5, py: 0.5 }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleGenerateStructure(strategy)}
                            sx={{ mr: 1, fontSize: '0.75rem', minWidth: 'auto', px: 1.5, py: 0.5 }}
                          >
                            Estructura
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleGenerateRrss(strategy)}
                            sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1.5, py: 0.5 }}
                          >
                            RRSS
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}

      {/* Saved Ideas History */}
      <Paper sx={{ p: 3, borderRadius: 2, mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconTrendingUp size={24} color="#1976d2" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Histórico de Ideas Guardadas
          </Typography>
          {isLoadingSavedIdeas && <CircularProgress size={16} />}
        </Box>

        {Object.keys(savedIdeas).length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No hay ideas guardadas aún. Genera y guarda ideas para ver el historial aquí.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {Object.entries(savedIdeas).map(([clientUuid, executions]) => {
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
                        label={`${executions.length} ejecución(es)`}
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
                                {execution.ideas?.length || 0} idea(s)
                              </Typography>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<IconDownload />}
                                onClick={() => exportIdeasExecutionToCSV(execution, displayName)}
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

                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1 }}>ID</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1 }}>Fecha</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1 }}>Estado</TableCell>
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
                                    Descripción
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1 }}>Hashtags</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1 }}>Fecha Creación</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {execution.ideas.map((idea: any, strategyIndex: number) => (
                                <TableRow key={strategyIndex} sx={{ height: 'auto' }}>
                                  <TableCell sx={{ fontSize: '0.7rem', py: 1 }}>{idea.id}</TableCell>
                                  <TableCell sx={{ fontSize: '0.7rem', py: 1 }}>{idea.fecha || '-'}</TableCell>
                                  <TableCell sx={{ fontSize: '0.7rem', py: 1 }}>{idea.estado || '-'}</TableCell>
                                  <TableCell sx={{ fontSize: '0.7rem', py: 1 }}>{idea.tipo || '-'}</TableCell>
                                  <TableCell sx={{ fontSize: '0.7rem', py: 1, maxWidth: 120 }}>
                                    <Box sx={{
                                      wordWrap: 'break-word',
                                      whiteSpace: 'normal',
                                      lineHeight: 1.4
                                    }}>
                                      {idea.titulo || '-'}
                                    </Box>
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.7rem', py: 1, maxWidth: 180 }}>
                                    <Box sx={{
                                      wordWrap: 'break-word',
                                      whiteSpace: 'normal',
                                      lineHeight: 1.4
                                    }}>
                                      {idea.copy || '-'}
                                    </Box>
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.7rem', py: 1 }}>{idea.hashtags || '-'}</TableCell>
                                  <TableCell sx={{ fontSize: '0.7rem', py: 1 }}>{new Date(idea.created_at).toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
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
