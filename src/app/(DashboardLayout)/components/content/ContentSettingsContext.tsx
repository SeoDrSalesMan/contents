"use client";
import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

export interface ContentItem {
  fecha: string;
  canal?: string;
  formato?: string;
  titulo: string;
  descripcion: string;
  keyword: string;
  volumen?: string;
  tipos?: string;
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
  { id: "distrito_legal", name: "Distrito Legal", webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/distrito", ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-distrito", structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-distrito", info: "Servicios legales online en España. Enfoque profesional con tono formal.", alcance: "", estilo: "", strategies: [], articles: [], workflowId: "zQw5IM51uOdywlMD", executionIds: ["300", "299", "298"] },
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
            { fecha: "22-10", titulo: "Cómo sacar provecho al foro de Ley Segunda Oportunidad para resolver dudas y compartir experiencias", descripcion: "Estrategias para interactuar y aprovechar al máximo las comunidades especializadas en la ley", keyword: "foro ley segunda oportunidad", volumen: "390", tipos: "Entretener", funnel: "BOFU" },
            { fecha: "28-10", titulo: "Sentencias clave que marcan precedentes en la Ley Segunda Oportunidad y su aplicación práctica", descripcion: "Estudio de casos judiciales que impactan directamente en la interpretación y uso de la ley", keyword: "sentencias ley segunda oportunidad", volumen: "70", tipos: "Educar", funnel: "BOFU" },
            { fecha: "23-10", titulo: "Opiniones variadas sobre la Ley de Segunda Oportunidad: ¿qué piensan expertos y afectados?", descripcion: "Compilación de análisis y valoraciones que muestran perspectivas diversas sobre la efectividad de la ley", keyword: "ley de segunda oportunidad opiniones", volumen: "390", tipos: "Entretener", funnel: "MOFU" },
            { fecha: "28-10", titulo: "Últimas noticias y actualizaciones sobre la Ley Segunda Oportunidad: cómo afectan a los deudores", descripcion: "Resumen de novedades legales y jurisprudencia que influyen en el acceso y beneficios de la ley", keyword: "ultimas noticias ley segunda oportunidad", volumen: "50", tipos: "Inspirar", funnel: "MOFU" },
            { fecha: "19-10", titulo: "Cómo utilizar la Ley Segunda Oportunidad para autónomos: requisitos y estrategias para la gestión de deudas", descripcion: "Explicación especializada para autónomos con enfoque en cómo acogerse a la ley y maximizar sus ventajas", keyword: "ley segunda oportunidad autónomos", volumen: "70", tipos: "Educar", funnel: "BOFU" },
            { fecha: "26-10", titulo: "Sentencias recientes que impactan la Ley Segunda Oportunidad: qué significan para quienes buscan acogerse", descripcion: "Análisis de fallos relevantes que afectan la interpretación y aplicación de la ley para futuros solicitantes", keyword: "sentencias ley segunda oportunidad", volumen: "70", tipos: "Educar", funnel: "BOFU" }
          ],
          executionIds: ["300", "299", "298"]
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
