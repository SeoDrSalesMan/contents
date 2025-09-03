"use client";
import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

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

export type Tone = "profesional" | "informal" | "cercano" | "didáctico";

export interface Client {
  id: string;
  name: string;
  webhook: string;
  ideasWebhook?: string;
  structureWebhook?: string;
  info: string;
  alcance: string;
  estilo: string;
  strategies: ContentItem[];
  articles: any[];
  workflowId: string;
  executionIds: string[];
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
  addStrategy: (clientId: string, strategy: ContentItem) => void;
  addStrategies: (clientId: string, strategies: ContentItem[]) => void;
  addArticle: (clientId: string, article: any) => void;
  updateStrategy: (clientId: string, index: number, strategy: ContentItem) => void;
  updateArticle: (clientId: string, index: number, article: any) => void;
  addExecutionId: (clientId: string, executionId: string) => void;
}

const ContentSettingsContext = createContext<ContentSettingsContextValue | null>(null);

const initialClients: Client[] = [
  { id: "gran_gala_flamenco", name: "Gran Gala Flamenco", webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/gala", ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-gala", structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-grangala", info: "Espectáculos flamencos en España. Enfoque cultural y turístico.", alcance: "", estilo: "", strategies: [], articles: [], workflowId: "j9lMwR2UTgqDsI1g", executionIds: [] },
  { id: "distrito_legal", name: "Distrito Legal", webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/distrito", ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-distrito", structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-distrito", info: "Servicios legales online en España. Enfoque profesional con tono formal.", alcance: "", estilo: "", strategies: [
    { fecha: "2025-09-01", canal: "Blog", formato: "Artículo informativo", titulo: "¿Cómo elegir el mejor abogado para tu caso?", descripcion: "Guía completa para seleccionar asesoría legal especializada en derecho civil y mercantil", keyword: "abogado, asesoría legal", intencion: "Informar", funnel: "TOFU" },
    { fecha: "2025-09-01", canal: "LinkedIn", formato: "Post profesional", titulo: "Nuevas regulaciones mercantiles 2025", descripcion: "Análisis de los cambios normativos que afectarán a las empresas españolas", keyword: "derecho mercantil, regulaciones", intencion: "Posicionar", funnel: "MOFU" },
    { fecha: "2025-09-01", canal: "Facebook", formato: "Video explicativo", titulo: "5 errores legales que cometen las startups", descripcion: "Video educativo sobre los principales errores legales en empresas emergentes", keyword: "startups, errores legales", intencion: "Educar", funnel: "TOFU" },
    { fecha: "2025-09-01", canal: "Blog", formato: "Guía práctica", titulo: "Contratos digitales: todo lo que necesitas saber", descripcion: "Manual completo sobre la validez y requisitos de los contratos en el ámbito digital", keyword: "contratos digitales, derecho digital", intencion: "Informar", funnel: "MOFU" },
    { fecha: "2025-09-01", canal: "Instagram", formato: "Carousel", titulo: "Derechos del consumidor en España", descripcion: "Infografía con los principales derechos que todo consumidor debe conocer", keyword: "derechos consumidor, protección", intencion: "Concienciar", funnel: "TOFU" }
  ], articles: [], workflowId: "zQw5IM51uOdywlMD", executionIds: ["241", "240", "239"] },
  { id: "neuron_rehab", name: "Neuron Rehab", webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/neuron", ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-neuron", structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-neuron", info: "Rehabilitación neurológica avanzada. Público: pacientes y familiares.", alcance: "", estilo: "", strategies: [], articles: [], workflowId: "nUlAdnVfDwjnszRq", executionIds: [] },
  { id: "sistem_lab", name: "SistemLab", webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/sistemlab", ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-sistemlab", structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-sistemlab", info: "Laboratorio de sistemas y tecnología. Enfoque técnico y profesional.", alcance: "", estilo: "", strategies: [], articles: [], workflowId: "sistemlab", executionIds: [] },
];

export function ContentSettingsProvider({ children }: { children: React.ReactNode }) {
  const [defaultTone, setDefaultTone] = useState<Tone>("profesional");
  const [defaultLength, setDefaultLength] = useState<number>(2000);
  const [defaultIdeas, setDefaultIdeas] = useState<number>(2);
  const [globalInstructions, setGlobalInstructions] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    
    // Always ensure Distrito Legal has sample strategies for demonstration
    const clientsWithSampleData = initialClients.map(client => {
      if (client.id === "distrito_legal") {
        return {
          ...client,
          strategies: [
            { fecha: "2025-09-01", canal: "Blog", formato: "Artículo informativo", titulo: "¿Cómo elegir el mejor abogado para tu caso?", descripcion: "Guía completa para seleccionar asesoría legal especializada en derecho civil y mercantil", keyword: "abogado, asesoría legal", intencion: "Informar", funnel: "TOFU" },
            { fecha: "2025-09-01", canal: "LinkedIn", formato: "Post profesional", titulo: "Nuevas regulaciones mercantiles 2025", descripcion: "Análisis de los cambios normativos que afectarán a las empresas españolas", keyword: "derecho mercantil, regulaciones", intencion: "Posicionar", funnel: "MOFU" },
            { fecha: "2025-09-01", canal: "Facebook", formato: "Video explicativo", titulo: "5 errores legales que cometen las startups", descripcion: "Video educativo sobre los principales errores legales en empresas emergentes", keyword: "startups, errores legales", intencion: "Educar", funnel: "TOFU" },
            { fecha: "2025-09-01", canal: "Blog", formato: "Guía práctica", titulo: "Contratos digitales: todo lo que necesitas saber", descripcion: "Manual completo sobre la validez y requisitos de los contratos en el ámbito digital", keyword: "contratos digitales, derecho digital", intencion: "Informar", funnel: "MOFU" },
            { fecha: "2025-09-01", canal: "Instagram", formato: "Carousel", titulo: "Derechos del consumidor en España", descripcion: "Infografía con los principales derechos que todo consumidor debe conocer", keyword: "derechos consumidor, protección", intencion: "Concienciar", funnel: "TOFU" }
          ],
          executionIds: ["241", "240", "239"]
        };
      }
      return client;
    });

    setClients(clientsWithSampleData);
  }, []);

  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem("clients", JSON.stringify(clients));
    }
  }, [clients]);

  const updateClientField = (id: string, field: "alcance" | "estilo", value: string) =>
    setClients(prev => prev.map(c => (c.id === id ? { ...c, [field]: value } : c)));

  const addStrategy = (clientId: string, strategy: ContentItem) => {
    setClients(prev => prev.map(c => (c.id === clientId ? { ...c, strategies: [...c.strategies, strategy] } : c)));
  };

  const addArticle = (clientId: string, article: any) => {
    setClients(prev => prev.map(c => (c.id === clientId ? { ...c, articles: [...c.articles, article] } : c)));
  };

  const addStrategies = (clientId: string, strategies: ContentItem[]) => {
    setClients(prev => prev.map(c => (c.id === clientId ? { ...c, strategies: [...c.strategies, ...strategies] } : c)));
  };

  const updateStrategy = (clientId: string, index: number, strategy: ContentItem) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const newStrategies = [...c.strategies];
        newStrategies[index] = strategy;
        return { ...c, strategies: newStrategies };
      }
      return c;
    }));
  };

  const updateArticle = (clientId: string, index: number, article: any) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const newArticles = [...c.articles];
        newArticles[index] = article;
        return { ...c, articles: newArticles };
      }
      return c;
    }));
  };

  const addExecutionId = (clientId: string, executionId: string) => {
    setClients(prev => prev.map(c => (c.id === clientId ? { ...c, executionIds: [executionId, ...c.executionIds.slice(0, 4)] } : c)));
  };

  const value = useMemo<ContentSettingsContextValue>(
    () => ({
      defaultTone, setDefaultTone,
      defaultLength, setDefaultLength,
      defaultIdeas, setDefaultIdeas,
      globalInstructions, setGlobalInstructions,
      selectedClientId, setSelectedClientId,
      clients, updateClientField,
      addStrategy, addStrategies, addArticle,
      updateStrategy, updateArticle,
      addExecutionId
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
