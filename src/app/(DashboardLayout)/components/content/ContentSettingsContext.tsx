"use client";
import React, { createContext, useContext, useMemo, useState } from "react";

export type Tone = "profesional" | "informal" | "cercano" | "didáctico";

export interface Client {
  id: string;
  name: string;
  webhook: string;
  ideasWebhook?: string;
  info: string;
  alcance: string;
  estilo: string;
}

interface ContentSettingsContextValue {
  defaultTone: Tone;
  setDefaultTone: (v: Tone) => void;
  defaultLength: number;
  setDefaultLength: (n: number) => void;
  defaultIdeas: number;
  setDefaultIdeas: (n: number) => void;
  globalInstructions: string;
  setGlobalInstructions: (s: string) => void;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  clients: Client[];
  updateClientField: (id: string, field: "alcance" | "estilo", value: string) => void;
}

const ContentSettingsContext = createContext<ContentSettingsContextValue | null>(null);

export function ContentSettingsProvider({ children }: { children: React.ReactNode }) {
  const [defaultTone, setDefaultTone] = useState<Tone>("profesional");
  const [defaultLength, setDefaultLength] = useState<number>(2000);
  const [defaultIdeas, setDefaultIdeas] = useState<number>(2);
  const [globalInstructions, setGlobalInstructions] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const [clients, setClients] = useState<Client[]>([
    { id: "gran_gala_flamenco", name: "Gran Gala Flamenco", webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/gala", ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-gala", info: "Espectáculos flamencos en España. Enfoque cultural y turístico.", alcance: "", estilo: "" },
    { id: "distrito_legal", name: "Distrito Legal", webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/distrito", ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-distrito", info: "Servicios legales online en España. Enfoque profesional con tono formal.", alcance: "", estilo: "" },
    { id: "neuron_rehab", name: "Neuron Rehab", webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/neuron", ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-neuron", info: "Rehabilitación neurológica avanzada. Público: pacientes y familiares.", alcance: "", estilo: "" },
    { id: "sistem_lab", name: "SistemLab", webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/sistemlab", ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-sistemlab", info: "Laboratorio de sistemas y tecnología. Enfoque técnico y profesional.", alcance: "", estilo: "" },
  ]);

  const updateClientField = (id: string, field: "alcance" | "estilo", value: string) =>
    setClients(prev => prev.map(c => (c.id === id ? { ...c, [field]: value } : c)));

  const value = useMemo<ContentSettingsContextValue>(
    () => ({
      defaultTone, setDefaultTone,
      defaultLength, setDefaultLength,
      defaultIdeas, setDefaultIdeas,
      globalInstructions, setGlobalInstructions,
      selectedClientId, setSelectedClientId,
      clients, updateClientField
    }),
    [defaultTone, defaultLength, defaultIdeas, globalInstructions, selectedClientId, clients]
  );

  return <ContentSettingsContext.Provider value={value}>{children}</ContentSettingsContext.Provider>;
}

export const useContentSettings = () => {
  const ctx = useContext(ContentSettingsContext);
  if (!ctx) throw new Error("useContentSettings must be used within ContentSettingsProvider");
  return ctx;
};