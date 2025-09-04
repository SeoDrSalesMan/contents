"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Stack, FormControl, InputLabel, Select, MenuItem,
  TextField, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, Tabs, Tab, FormGroup, FormControlLabel, Checkbox, Link as MuiLink
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useContentSettings, ContentItem } from "./ContentSettingsContext";

interface Filters { from: string; to: string; channel: string; format: string; funnel: string; }

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
    if (!it || typeof it !== "object") return { fecha: "", canal: "", formato: "", titulo: String(it ?? ""), descripcion: "", keyword: "", funnel: "" };
    const n: Record<string, any> = {}; Object.keys(it).forEach(k => (n[normKey(k)] = (it as any)[k]));
    const asS = (v: any) => v == null ? "" : Array.isArray(v) ? v.join(", ") : String(v);
    const fecha = asS(n.fecha || n.date || n.fechaformato || "").slice(0, 10);
    return {
      fecha,
      canal: asS(n.canal || n.channel || n.source || ""),
      formato: asS(n.formato || n.format || ""),
      titulo: asS(n.titulo || n.title || ""),
      descripcion: asS(n.descripcion || n.description || ""),
      keyword: asS(n.keyword || n.keywords || n.palabra || ""),
      volumen: asS(n.volumen || n.volume || ""),
      tipos: asS(n.tipos || n.types || ""),
      funnel: asS(n.funnel || n.embudo || "")
    };
  });
}

export default function StrategyGenerator() {
  const router = useRouter();
  const { clients, selectedClientId, defaultIdeas, globalInstructions, addStrategies, addExecutionId } = useContentSettings();
  const [kw, setKw] = useState<string>("");
  const [ideasCount, setIdeasCount] = useState<number>(defaultIdeas);
  const [canales, setCanales] = useState<string[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);
  const [funnel, setFunnel] = useState<string>("");
  const [newStrategies, setNewStrategies] = useState<ContentItem[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<number[]>([]);

  useEffect(() => setIdeasCount(defaultIdeas), [defaultIdeas]);

  const client = useMemo(() => clients.find(c => c.id === selectedClientId) || null, [clients, selectedClientId]);
  const items = useMemo(() => client?.strategies || [], [client]);

  const [latestExecutions, setLatestExecutions] = useState<ContentItem[]>([]);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({ from: "", to: "", channel: "", format: "", funnel: "" });
  
  // Aplicar filtros a las últimas ejecuciones
  const filteredLatestExecutions = useMemo(() => {
    return latestExecutions.filter(it => {
      if (filters.from && it.fecha && it.fecha < filters.from) return false;
      if (filters.to && it.fecha && it.fecha > filters.to) return false;
      if (filters.channel && it.canal !== filters.channel) return false;
      if (filters.format && it.formato !== filters.format) return false;
      if (filters.funnel && it.funnel !== filters.funnel) return false;
      return true;
    });
  }, [latestExecutions, filters]);
  
  const filtered = useMemo(() => {
    return items.filter(it => {
      if (filters.from && it.fecha && it.fecha < filters.from) return false;
      if (filters.to && it.fecha && it.fecha > filters.to) return false;
      if (filters.channel && it.canal !== filters.channel) return false;
      if (filters.format && it.formato !== filters.format) return false;
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
      console.log(`Mostrando ${recentStrategies.length} estrategias guardadas para ${client.name}`, recentStrategies);
    } else {
      setLatestExecutions([]);
      setExecutionError(`No hay estrategias guardadas para ${client.name}. Genera algunas estrategias usando el formulario superior.`);
      console.log(`No hay estrategias guardadas para ${client.name}`);
    }

    setIsLoadingExecutions(false);
  }, [client]); // Ejecutar cuando cambia el cliente

  const executionUrl = (id: string) => {
    if (!client?.workflowId) return "#";
    return `https://content-generator.nv0ey8.easypanel.host/workflow/${client.workflowId}/executions/${id}`;
  };

  const channels = useMemo<string[]>(() => Array.from(new Set(items.map(i => i.canal).filter(Boolean))), [items]);
  const formats = useMemo<string[]>(() => Array.from(new Set(items.map(i => i.formato).filter(Boolean))), [items]);
  const funnels = useMemo<string[]>(() => Array.from(new Set(items.map(i => i.funnel).filter(Boolean))), [items]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!client) { alert("Selecciona un cliente válido."); return; }
    const ideasWebhook = client.ideasWebhook || client.webhook;
    let kwArray = (kw || "").split(",").map(s => s.trim()).filter(Boolean);
    if (kwArray.length > 3) kwArray = kwArray.slice(0, 3);
    while (kwArray.length < 3) kwArray.push("");

    const payload = {
      keyword1: kwArray,
      numeroIdeas: Number(ideasCount) || 0,
      canales: canales.join(", "),
      tipos: tipos.join(", "),
      funnelStage: funnel,
      cliente: client.name,
      instruccionesGlobales: globalInstructions,
      alcance: client.alcance || "",
      estilo: client.estilo || ""
    };

    try {
      const res = await fetch(ideasWebhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const text = await res.text();
      if (!res.ok) throw new Error(`Error webhook estrategia: ${res.status} - ${text}`);
      const executionId = res.headers.get("x-execution-id");
      if (executionId) {
        addExecutionId(selectedClientId, executionId);
      }
      let data: unknown; try { data = JSON.parse(text); } catch { data = text; }
      setNewStrategies(parseIdeasPayload(data));
    } catch (err) {
      console.error(err);
      alert("Error al generar la estrategia. Revisa la consola.");
    }
  }

  function exportCSV(): void {
    const rows = [
      ["Fecha","Canal","Formato","Título","Descripción","Keyword","Volumen","Tipos","Funnel"].map(v=>`"${String(v).replace(/"/g,'""')}"`),
      ...filteredLatestExecutions.map(it=>[`"${(it.fecha||"").replace(/"/g,'""')}"`,`"${(it.canal||"").replace(/"/g,'""')}"`,`"${(it.formato||"").replace(/"/g,'""')}"`,`"${(it.titulo||"").replace(/"/g,'""')}"`,`"${(it.descripcion||"").replace(/"/g,'""')}"`,`"${(it.keyword||"").replace(/"/g,'""')}"`,`"${(it.volumen||"").replace(/"/g,'""')}"`,`"${(it.tipos||"").replace(/"/g,'""')}"`,`"${(it.funnel||"").replace(/"/g,'""')}"`])
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

  const handleSaveSelected = () => {
    const strategiesToSave = newStrategies.filter((_, index) => selectedStrategies.includes(index));
    addStrategies(selectedClientId, strategiesToSave);
    setNewStrategies([]);
    setSelectedStrategies([]);
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
      channel: strategy.canal || "",
      description: strategy.descripcion || "",
      clientId: client.id,
      fromStrategy: "true"
    });
    
    router.push(`/estructuras?${params.toString()}`);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Box sx={{ maxWidth: 900, mx: "auto", mb: 2 }}>
        <Tabs value="ideas">
          <Tab value="ideas" label="Generador de Estrategias" />
        </Tabs>
      </Box>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Keyword 1 (separa por comas si son varias)"
            value={kw} onChange={e=>setKw(e.target.value)} required
          />

          <FormControl component="fieldset" variant="standard">
            <Typography component="legend">Tipo</Typography>
            <FormGroup row>
              <FormControlLabel
                control={<Checkbox checked={tipos.includes("Educar")} onChange={e => setTipos(c => (e.target as HTMLInputElement).checked ? [...c, "Educar"] : c.filter(i => i !== "Educar"))} name="Educar" />}
                label="Educar"
              />
              <FormControlLabel
                control={<Checkbox checked={tipos.includes("Inspirar")} onChange={e => setTipos(c => (e.target as HTMLInputElement).checked ? [...c, "Inspirar"] : c.filter(i => i !== "Inspirar"))} name="Inspirar" />}
                label="Inspirar"
              />
              <FormControlLabel
                control={<Checkbox checked={tipos.includes("Entretener")} onChange={e => setTipos(c => (e.target as HTMLInputElement).checked ? [...c, "Entretener"] : c.filter(i => i !== "Entretener"))} name="Entretener" />}
                label="Entretener"
              />
              <FormControlLabel
                control={<Checkbox checked={tipos.includes("Promocionar")} onChange={e => setTipos(c => (e.target as HTMLInputElement).checked ? [...c, "Promocionar"] : c.filter(i => i !== "Promocionar"))} name="Promocionar" />}
                label="Promocionar"
              />
            </FormGroup>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="funnel-strategy">Etapa del embudo</InputLabel>
            <Select<string>
              labelId="funnel-strategy"
              label="Etapa del embudo"
              value={funnel}
              onChange={e => setFunnel(e.target.value)}
            >
              <MenuItem value="">Selecciona etapa</MenuItem>
              <MenuItem value="TOFU">TOFU – Conocimiento</MenuItem>
              <MenuItem value="MOFU">MOFU – Consideración</MenuItem>
              <MenuItem value="BOFU">BOFU – Decisión</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Número de ideas a generar" type="number"
            value={ideasCount} onChange={e=>setIdeasCount(Number(e.target.value) || 0)}
            inputProps={{ min: 1, max: 100 }}
          />

          

          <Button type="submit" variant="contained">Generar estrategia</Button>
        </Stack>
      </Box>

      {/* Nuevas Estrategias deben aparecer después del historial de ejecuciones */}
      {client && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Historial de Estrategias {/* Título más descriptivo */}
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
            Últimas Estrategias Generadas
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
                <InputLabel id="canal-label-history">Canal</InputLabel>
                <Select<string>
                  labelId="canal-label-history" label="Canal" value={filters.channel}
                  onChange={e=>setFilters(f=>({ ...f, channel: e.target.value }))}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Array.from(new Set(latestExecutions.map(i => i.canal).filter(Boolean))).map(v=><MenuItem key={v} value={v}>{v}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel id="formato-label-history">Formato</InputLabel>
                <Select<string>
                  labelId="formato-label-history" label="Formato" value={filters.format}
                  onChange={e=>setFilters(f=>({ ...f, format: e.target.value }))}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Array.from(new Set(latestExecutions.map(i => i.formato).filter(Boolean))).map(v=><MenuItem key={v} value={v}>{v}</MenuItem>)}
                </Select>
              </FormControl>
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
                    <TableCell>
                      <Typography variant="body2">
                        {strategy.fecha || "Sin fecha"}
                        {index === 0 && (
                          <Typography component="span" color="primary" variant="caption" sx={{ ml: 1, fontWeight: 'bold' }}>
                         
                          </Typography>
                        )}
                      </Typography>
                    </TableCell>
                
                    <TableCell>
                      <Typography variant="body2" sx={{
                        fontWeight: index === 0 ? 'bold' : 'normal',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {strategy.titulo || "Sin título"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {strategy.descripcion || "Sin descripción"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {strategy.keyword || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {strategy.volumen || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {strategy.tipos || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {strategy.funnel || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleGenerateStructure(strategy)}
                        sx={{ 
                          fontSize: '0.75rem', 
                          minWidth: 'auto',
                          px: 1.5,
                          py: 0.5
                        }}
                      >
                        Generar Estructura
                      </Button>
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
          <Typography variant="h6" sx={{ mb: 2 }}>Nuevas Estrategias</Typography>
          <Button onClick={handleSaveSelected} variant="contained">Guardar Seleccionadas</Button>
          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Seleccionar</TableCell>
                  {["Fecha","Canal","Formato","Título","Descripción","Keyword","Volumen","Tipos","Funnel"].map(h=>(
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {newStrategies.map((it,idx)=>(
                  <TableRow key={idx}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStrategies.includes(idx)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStrategies(prev => [...prev, idx]);
                          } else {
                            setSelectedStrategies(prev => prev.filter(i => i !== idx));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>{it.fecha}</TableCell>
                    <TableCell>{it.canal}</TableCell>
                    <TableCell>{it.formato}</TableCell>
                    <TableCell>{it.titulo}</TableCell>
                    <TableCell>{it.descripcion}</TableCell>
                    <TableCell>{it.keyword}</TableCell>
                    <TableCell>{it.volumen}</TableCell>
                    <TableCell>{it.tipos}</TableCell>
                    <TableCell>{it.funnel}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}




    </Box>
  );
}
