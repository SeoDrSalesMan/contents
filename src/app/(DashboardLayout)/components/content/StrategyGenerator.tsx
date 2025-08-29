"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Stack, FormControl, InputLabel, Select, MenuItem,
  TextField, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, Tabs, Tab, FormGroup, FormControlLabel, Checkbox
} from "@mui/material";
import { useContentSettings } from "./ContentSettingsContext";

export interface ContentItem {
  fecha: string;
  canal: string;
  formato: string;
  titulo: string;
  descripcion: string;
  keyword: string;
  intencion: string;
  funnel: string;
}

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
    if (!it || typeof it !== "object") return { fecha: "", canal: "", formato: "", titulo: String(it ?? ""), descripcion: "", keyword: "", intencion: "", funnel: "" };
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
      intencion: asS(n.intencion || n.intent || ""),
      funnel: asS(n.funnel || n.embudo || "")
    };
  });
}

export default function StrategyGenerator(): JSX.Element {
  const { clients, selectedClientId, setSelectedClientId, defaultIdeas, globalInstructions } = useContentSettings();
  const [kw, setKw] = useState<string>("");
  const [ideasCount, setIdeasCount] = useState<number>(defaultIdeas);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [canales, setCanales] = useState<string[]>([]);

  useEffect(() => setIdeasCount(defaultIdeas), [defaultIdeas]);

  const client = useMemo(() => clients.find(c => c.id === selectedClientId) || null, [clients, selectedClientId]);

  const [filters, setFilters] = useState<Filters>({ from: "", to: "", channel: "", format: "", funnel: "" });
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
      cliente: client.name,
      instruccionesGlobales: globalInstructions,
      alcance: client.alcance || "",
      estilo: client.estilo || ""
    };

    try {
      const res = await fetch(ideasWebhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const text = await res.text();
      if (!res.ok) throw new Error(`Error webhook estrategia: ${res.status} - ${text}`);
      let data: unknown; try { data = JSON.parse(text); } catch { data = text; }
      setItems(parseIdeasPayload(data));
    } catch (err) {
      console.error(err);
      alert("Error al generar la estrategia. Revisa la consola.");
    }
  }

  function exportCSV(): void {
    const rows = [
      ["Fecha","Canal","Formato","Título","Descripción","Keyword","Intención","Funnel"].map(v=>`"${String(v).replace(/"/g,'""')}"`),
      ...filtered.map(it=>[`"${(it.fecha||"").replace(/"/g,'""')}"`,`"${(it.canal||"").replace(/"/g,'""')}"`,`"${(it.formato||"").replace(/"/g,'""')}"`,`"${(it.titulo||"").replace(/"/g,'""')}"`,`"${(it.descripcion||"").replace(/"/g,'""')}"`,`"${(it.keyword||"").replace(/"/g,'""')}"`,`"${(it.intencion||"").replace(/"/g,'""')}"`,`"${(it.funnel||"").replace(/"/g,'""')}"`])
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

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Box sx={{ maxWidth: 900, mx: "auto", mb: 2 }}>
        <Tabs value="ideas">
          <Tab value="ideas" label="Generador de Estrategias" />
        </Tabs>
      </Box>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="cliente-sel">Cliente</InputLabel>
            <Select<string>
              labelId="cliente-sel" label="Cliente" value={selectedClientId}
              onChange={e=>setSelectedClientId((e.target.value as string))}
            >
              <MenuItem value="">Selecciona un cliente</MenuItem>
              {clients.map(c=><MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            {clients.find(c=>c.id===selectedClientId)?.info || ""}
          </Typography>

          <TextField
            label="Keyword 1 (separa por comas si son varias)"
            value={kw} onChange={e=>setKw(e.target.value)} required
          />

          <TextField
            label="Número de ideas a generar" type="number"
            value={ideasCount} onChange={e=>setIdeasCount(Number(e.target.value) || 0)}
            inputProps={{ min: 1, max: 100 }}
          />

          <FormControl component="fieldset" variant="standard">
            <Typography component="legend">Canales</Typography>
            <FormGroup row>
              <FormControlLabel
                control={<Checkbox checked={canales.includes("Blog")} onChange={e => setCanales(c => (e.target as HTMLInputElement).checked ? [...c, "Blog"] : c.filter(i => i !== "Blog"))} name="Blog" />}
                label="Blog"
              />
              <FormControlLabel
                control={<Checkbox checked={canales.includes("Facebook")} onChange={e => setCanales(c => (e.target as HTMLInputElement).checked ? [...c, "Facebook"] : c.filter(i => i !== "Facebook"))} name="Facebook" />}
                label="Facebook"
              />
              <FormControlLabel
                control={<Checkbox checked={canales.includes("Reels")} onChange={e => setCanales(c => (e.target as HTMLInputElement).checked ? [...c, "Reels"] : c.filter(i => i !== "Reels"))} name="Reels" />}
                label="Reels"
              />
              <FormControlLabel
                control={<Checkbox checked={canales.includes("LinkedIn")} onChange={e => setCanales(c => (e.target as HTMLInputElement).checked ? [...c, "LinkedIn"] : c.filter(i => i !== "LinkedIn"))} name="LinkedIn" />}
                label="LinkedIn"
              />
              <FormControlLabel
                control={<Checkbox checked={canales.includes("Instagram")} onChange={e => setCanales(c => (e.target as HTMLInputElement).checked ? [...c, "Instagram"] : c.filter(i => i !== "Instagram"))} name="Instagram" />}
                label="Instagram"
              />
              <FormControlLabel
                control={<Checkbox checked={canales.includes("TikTok")} onChange={e => setCanales(c => (e.target as HTMLInputElement).checked ? [...c, "TikTok"] : c.filter(i => i !== "TikTok"))} name="TikTok" />}
                label="TikTok"
              />
            </FormGroup>
          </FormControl>

          <Button type="submit" variant="contained">Generar estrategia</Button>
        </Stack>
      </Box>

      {items.length>0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Estrategia generada</Typography>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: "wrap" }}>
            <TextField
              label="Desde" type="date" InputLabelProps={{ shrink: true }}
              value={filters.from} onChange={e=>setFilters(f=>({ ...f, from: e.target.value }))} sx={{ width: 180 }}
            />
            <TextField
              label="Hasta" type="date" InputLabelProps={{ shrink: true }}
              value={filters.to} onChange={e=>setFilters(f=>({ ...f, to: e.target.value }))} sx={{ width: 180 }}
            />
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel id="canal-label">Canal</InputLabel>
              <Select<string>
                labelId="canal-label" label="Canal" value={filters.channel}
                onChange={e=>setFilters(f=>({ ...f, channel: e.target.value }))}
              >
                <MenuItem value="">Todos</MenuItem>
                {channels.map(v=><MenuItem key={v} value={v}>{v}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel id="formato-label">Formato</InputLabel>
              <Select<string>
                labelId="formato-label" label="Formato" value={filters.format}
                onChange={e=>setFilters(f=>({ ...f, format: e.target.value }))}
              >
                <MenuItem value="">Todos</MenuItem>
                {formats.map(v=><MenuItem key={v} value={v}>{v}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel id="funnel-label">Funnel</InputLabel>
              <Select<string>
                labelId="funnel-label" label="Funnel" value={filters.funnel}
                onChange={e=>setFilters(f=>({ ...f, funnel: e.target.value }))}
              >
                <MenuItem value="">Todos</MenuItem>
                {funnels.map(v=><MenuItem key={v} value={v}>{v}</MenuItem>)}
              </Select>
            </FormControl>

            <Box sx={{ flexGrow: 1 }} />
            <Button variant="outlined" onClick={()=>setFilters({ from:"", to:"", channel:"", format:"", funnel:"" })}>
              Borrar filtros
            </Button>
            <Button variant="contained" onClick={exportCSV}>
              Exportar CSV
            </Button>
          </Stack>

          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Fecha","Canal","Formato","Título","Descripción","Keyword","Intención","Funnel"].map(h=>(
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length===0 ? (
                  <TableRow><TableCell colSpan={8} align="center">No hay resultados</TableCell></TableRow>
                ) : filtered.map((it,idx)=>(
                  <TableRow key={idx}>
                    <TableCell>{it.fecha}</TableCell>
                    <TableCell>{it.canal}</TableCell>
                    <TableCell>{it.formato}</TableCell>
                    <TableCell>{it.titulo}</TableCell>
                    <TableCell>{it.descripcion}</TableCell>
                    <TableCell>{it.keyword}</TableCell>
                    <TableCell>{it.intencion}</TableCell>
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
