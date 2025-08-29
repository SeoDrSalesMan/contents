"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Stack, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Paper, Tabs, Tab
} from "@mui/material";
import { Tone, useContentSettings } from "./ContentSettingsContext";

export default function ArticleCreator(): JSX.Element {
  const {
    clients, selectedClientId, setSelectedClientId,
    defaultTone, defaultLength, globalInstructions
  } = useContentSettings();

  const client = useMemo(() => clients.find(c => c.id === selectedClientId) || null, [clients, selectedClientId]);

  const [title,setTitle] = useState<string>("");
  const [structureRaw,setStructureRaw] = useState<string>("");
  const [keywords,setKeywords] = useState<string>("");
  const [refs,setRefs] = useState<string>("");
  const [length,setLength] = useState<number>(defaultLength);
  const [tone,setTone] = useState<Tone>(defaultTone);
  const [cta,setCta] = useState<string>("");
  const [funnel,setFunnel] = useState<string>("");
  const [funnelKnowledge,setFunnelKnowledge] = useState<string>("");
  const [contentType,setContentType] = useState<string>("");
  const [conceptTitle,setConceptTitle] = useState<string>("");
  const [objective,setObjective] = useState<string>("");
  const [instructions,setInstructions] = useState<string>("");
  const [article,setArticle] = useState<string>("");

  useEffect(()=>setTone(defaultTone),[defaultTone]);
  useEffect(()=>setLength(defaultLength),[defaultLength]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if(!client){ alert("Selecciona un cliente válido."); return; }
    const estructura: Array<{ nivel: string; titulo: string }> = [];
    structureRaw.trim().split(/\n+/).forEach(line=>{
      const t=line.trim(); if(!t) return;
      const parts=t.split(/\s+/); const nivel=parts.shift(); const titulo=parts.join(" ");
      if(nivel && titulo) estructura.push({ nivel: nivel.toUpperCase(), titulo });
    });

    const payload = {
      tema: title.trim(),
      estructura,
      palabrasClave: keywords.split(",").map(s=>s.trim()).filter(Boolean),
      referencias: refs.split(",").map(s=>s.trim()).filter(Boolean),
      longitud: Number(length)||0,
      tono: tone,
      cta: cta.trim(),
      instrucciones: [globalInstructions, instructions].filter(Boolean).join("\n\n"),
      funnelStage: funnel,
      etapaConocimiento: funnelKnowledge,
      tipoContenido: contentType,
      tituloConcepto: conceptTitle.trim(),
      objetivoUtilidad: objective.trim(),
      alcance: client.alcance || "",
      estilo: client.estilo || ""
    };

    try{
      const res = await fetch(client.webhook, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
      if(!res.ok) throw new Error(`Error en webhook de artículo: ${res.status}`);
      const data = await res.json();
      setArticle(data?.articulo || JSON.stringify(data,null,2));
    }catch(err){
      console.error(err);
      alert("Error al generar el artículo. Revisa la consola.");
    }
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Box sx={{ maxWidth: 900, mx: "auto", mb: 2 }}>
        <Tabs value="articles">
          <Tab value="articles" label="Creador de Artículos" />
        </Tabs>
      </Box>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="cliente-art">Cliente</InputLabel>
            <Select<string>
              labelId="cliente-art" label="Cliente" value={selectedClientId}
              onChange={e=>setSelectedClientId(e.target.value)}
            >
              <MenuItem value="">Selecciona un cliente</MenuItem>
              {clients.map(c=><MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">{client?.info || ""}</Typography>

          <TextField label="Tema o título provisional" value={title} onChange={e=>setTitle(e.target.value)} required />

          <TextField
            label="Estructura (encabezados)" multiline minRows={4}
            value={structureRaw} onChange={e=>setStructureRaw(e.target.value)}
            placeholder={"H1 Título principal\nH2 Subtítulo 1\nH2 Subtítulo 2"}
          />

          <TextField label="Palabras clave secundarias" value={keywords} onChange={e=>setKeywords(e.target.value)} />
          <TextField label="Referencias externas (URLs)" value={refs} onChange={e=>setRefs(e.target.value)} />

          <TextField
            label="Longitud (palabras)" type="number" value={length}
            onChange={e=>setLength(Number(e.target.value) || 0)} inputProps={{ min: 500 }}
          />

          <FormControl fullWidth>
            <InputLabel id="tono-art">Tono o voz</InputLabel>
            <Select<Tone> labelId="tono-art" label="Tono o voz" value={tone} onChange={e=>setTone(e.target.value as Tone)}>
              <MenuItem value="profesional">Profesional</MenuItem>
              <MenuItem value="informal">Informal</MenuItem>
              <MenuItem value="cercano">Cercano</MenuItem>
              <MenuItem value="didáctico">Didáctico</MenuItem>
            </Select>
          </FormControl>

          <TextField label="CTA" value={cta} onChange={e=>setCta(e.target.value)} />

          <FormControl fullWidth>
            <InputLabel id="funnel">Etapa del embudo</InputLabel>
            <Select<string> labelId="funnel" label="Etapa del embudo" value={funnel} onChange={e=>setFunnel(e.target.value)}>
              <MenuItem value="">Selecciona etapa</MenuItem>
              <MenuItem value="TOFU">TOFU – Conocimiento</MenuItem>
              <MenuItem value="MOFU">MOFU – Consideración</MenuItem>
              <MenuItem value="BOFU">BOFU – Decisión</MenuItem>
            </Select>
          </FormControl>

          {funnel && (
            <Stack spacing={2} component={Paper} variant="outlined" sx={{ p: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="etapa-cono">Etapa de conocimiento</InputLabel>
                <Select<string>
                  labelId="etapa-cono" label="Etapa de conocimiento"
                  value={funnelKnowledge} onChange={e=>setFunnelKnowledge(e.target.value)}
                >
                  <MenuItem value="">Selecciona etapa de conocimiento</MenuItem>
                  <MenuItem value="exploracion">Exploración</MenuItem>
                  <MenuItem value="investigacion">Investigación</MenuItem>
                  <MenuItem value="seleccion">Selección</MenuItem>
                  <MenuItem value="identificacion">Identificación</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="tipo-cont">Tipo de contenido</InputLabel>
                <Select<string>
                  labelId="tipo-cont" label="Tipo de contenido"
                  value={contentType} onChange={e=>setContentType(e.target.value)}
                >
                  <MenuItem value="">Selecciona tipo</MenuItem>
                  <MenuItem value="educar">Educar</MenuItem>
                  <MenuItem value="entretenimiento">Entretener</MenuItem>
                  <MenuItem value="promocionar">Promocionar</MenuItem>
                </Select>
              </FormControl>

              <TextField label="Título concepto" value={conceptTitle} onChange={e=>setConceptTitle(e.target.value)} />
              <TextField
                label="Objetivo y utilidad" multiline minRows={3}
                value={objective} onChange={e=>setObjective(e.target.value)}
              />
            </Stack>
          )}

          <TextField
            label="Instrucciones adicionales" multiline minRows={3}
            value={instructions} onChange={e=>setInstructions(e.target.value)}
            placeholder="Incluye FAQs y evita repeticiones..."
          />

          <Button type="submit" variant="contained">Generar artículo</Button>
        </Stack>
      </Box>

      {article && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Artículo generado</Typography>
          <Paper variant="outlined" sx={{ p: 2, minHeight: 400, whiteSpace: "pre-wrap" }} contentEditable>
            {article}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
