"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Stack, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Paper, Tabs, Tab
} from "@mui/material";
import { Tone, useContentSettings } from "./ContentSettingsContext";

export default function ArticleCreator() {
  const {
    clients, selectedClientId,
    defaultTone, defaultLength, globalInstructions, addArticle, updateArticle, draftArticle, setDraftArticle
  } = useContentSettings();

  const client = useMemo(() => clients.find(c => c.id === selectedClientId) || null, [clients, selectedClientId]);
  const articles = useMemo(() => client?.articles || [], [client]);

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
  const [newArticle, setNewArticle] = useState<string | null>(null);

  useEffect(()=>setTone(defaultTone),[defaultTone]);
  useEffect(()=>setLength(defaultLength),[defaultLength]);

  // Auto-populate form when draft article is available or from URL parameters
  useEffect(() => {
    // First priority: draftArticle from context
    if (draftArticle) {
      setTitle(draftArticle.title);
      setStructureRaw(draftArticle.structure);
      setKeywords("");
      // Clear the draft after populating to prevent re-population on further visits
      setDraftArticle(null);
    }
    // Second priority: URL parameters as fallback
    else if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      console.log('URL parameters:', Object.fromEntries(urlParams.entries()));

      const fromStructure = urlParams.get('fromStructure');
      const titleParam = urlParams.get('title');
      const structureParam = urlParams.get('structure');

      if (fromStructure === 'true' && titleParam && structureParam) {
        console.log('Loading data from URL parameters');
        try {
          const decodedTitle = decodeURIComponent(titleParam);
          const decodedStructure = decodeURIComponent(structureParam);

          setTitle(decodedTitle);
          setStructureRaw(decodedStructure);
          setKeywords("");

          // Clean URL after loading data
          window.history.replaceState({}, document.title, '/articulos');
        } catch (error) {
          console.error('Error decoding URL parameters:', error);
        }
      }
    }
  }, [draftArticle, setDraftArticle]);

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
      // Removiendo campos obsoletos alcance y estilo
    };

    try{
      const res = await fetch(client.webhook, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
      if(!res.ok) throw new Error(`Error en webhook de artículo: ${res.status}`);
      const data = await res.json();
      setNewArticle(data?.articulo || JSON.stringify(data,null,2));
    }catch(err){
      console.error(err);
      alert("Error al generar el artículo. Revisa la consola.");
    }
  }

  const handleSave = () => {
    if (newArticle) {
      addArticle(selectedClientId, newArticle);
      setNewArticle(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Box sx={{ maxWidth: 900, mx: "auto", mb: 2 }}>
        <Tabs value="articles">
          <Tab value="articles" label="Creador de Artículos" />
        </Tabs>
      </Box>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
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

      {newArticle && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Nuevo Artículo</Typography>
          <Paper variant="outlined" sx={{ p: 2, minHeight: 400, whiteSpace: "pre-wrap" }} contentEditable onBlur={(e) => setNewArticle(e.currentTarget.textContent)}>
            {newArticle}
          </Paper>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleSave}>Guardar</Button>
            <Button variant="outlined" onClick={(e) => onSubmit(e as any)}>Volver a generar</Button>
          </Stack>
        </Box>
      )}

      {articles.map((article, index) => (
        <Box key={index} sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Artículo Guardado</Typography>
          <Paper variant="outlined" sx={{ p: 2, minHeight: 400, whiteSpace: "pre-wrap" }} contentEditable onBlur={(e) => updateArticle(selectedClientId, index, e.currentTarget.textContent)}>
            {article}
          </Paper>
        </Box>
      ))}
    </Box>
  );
}
