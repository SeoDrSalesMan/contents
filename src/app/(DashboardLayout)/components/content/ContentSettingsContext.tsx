"use client";
import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase-client";
import { authHelpers } from "@/utils/auth";
import { diagnostics } from "@/utils/supabase-diagnostic";

export interface ExecutionRecord {
  id: string;
  executionId: number;
  type: 'strategy' | 'ideas' | 'structure' | 'article';
  clientId: string;
  payload: any;
  result: any;
  createdAt: string;
  workflowUrl: string;
}

export interface ContentItem {
  fecha: string;
  titulo: string;
  descripcion: string;
  keyword: string;
  volumen?: string;
  tipos?: string;
  funnel: string;
  feedback?: string;
}

export type Tone = "profesional" | "informal" | "cercano" | "didáctico";

export interface Client {
  id: string;
  name: string;
  webhook: string;
  ideasWebhook?: string;
  structureWebhook?: string;
  dataWebhook?: string;
  info: string;
  // Nuevos campos según requerimiento
  nombre: string;
  web: string;
  sector: string;
  propuesta_valor: string;
  publico_objetivo: string;
  keywords: string;
  numero_contenidos_blog: number;
  frecuencia_mensual_blog: string;
  numero_contenidos_rrss: number;
  frecuencia_mensual_rrss: string;
  porcentaje_educar: number;
  porcentaje_inspirar: number;
  porcentaje_entretener: number;
  porcentaje_promocionar: number;
  verticales_interes: string;
  audiencia_no_deseada: string;
  estilo_comunicacion: string;
  tono_voz: string;
  redes_sociales: string[];
  usar_historias: boolean;
  numero_historias: number;
  usar_reels: boolean;
  numero_reels: number;
  usar_carruseles: boolean;
  numero_carruseles: number;
  usar_post: boolean;
  numero_post: number;
  emojis: boolean;
  articulos: string;
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
  loadClientFromSupabase: (clientId: string) => Promise<void>;
  clients: Client[];
  updateClientField: (id: string, field: keyof Client, value: string | string[] | boolean | number) => void;
  saveClientData: (clientId: string) => Promise<boolean>;
  addStrategy: (clientId: string, strategy: ContentItem) => void;
  addStrategies: (clientId: string, strategies: ContentItem[]) => void;
  addArticle: (clientId: string, article: any) => void;
  updateStrategy: (clientId: string, index: number, strategy: ContentItem) => void;
  updateArticle: (clientId: string, index: number, article: any) => void;
  addExecutionId: (clientId: string, executionId: string) => void;
  draftArticle: { title: string; structure: string } | null;
  setDraftArticle: (data: { title: string; structure: string } | null) => void;
  executions: ExecutionRecord[];
  lastExecutionId: number;
  createExecution: (type: 'strategy' | 'ideas' | 'structure' | 'article', clientId: string, payload: any, result: any) => ExecutionRecord;
}

const ContentSettingsContext = createContext<ContentSettingsContextValue | null>(null);

// Static mapping from clientId to client name for Supabase queries
const clientNameMap: Record<string, string> = {
  "distrito_legal": "Distrito Legal",
  "grangala": "Gran Gala Flamenco",
  "neuron": "Neuron Rehab",
  "sistemlab": "SistemLab",
  "deuda": "Asociacion Deuda",
  "estudiantes": "Asociacion Estudiantes Extranjero",
  "segunda": "Nueva Ley Segunda Oportunidad",
  "comparador": "Comparador Aprender Idiomas"
};

const createClientDefaults = {
  nombre: '',
  web: '',
  sector: '',
  propuesta_valor: '',
  publico_objetivo: '',
  keywords: [],
  numero_contenidos_blog: 4,
  frecuencia_mensual_blog: 'Semanal',
  numero_contenidos_rrss: 12,
  frecuencia_mensual_rrss: 'Semanal',
  porcentaje_educar: 25,
  porcentaje_inspirar: 25,
  porcentaje_entretener: 25,
  porcentaje_promocionar: 25,
  verticales_interes: [],
  audiencia_no_deseada: [],
  estilo_comunicacion: 'Profesional',
  tono_voz: 'Profesional',
  redes_sociales: [],
  usar_historias: false,
  numero_historias: 0,
  usar_reels: false,
  numero_reels: 0,
  usar_carruseles: false,
  numero_carruseles: 0,
  usar_post: false,
  numero_post: 0,
  emojis: true,
  articulos: ''
};

const initialClients: Client[] = [
  {
    id: "distrito_legal",
    name: "Distrito Legal",
    webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/articulos-distrito",
    ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-distrito",
    structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-distrito",
    dataWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/datos-distrito",
    info: "Servicios legales online en España. Enfoque profesional con tono formal.",
    nombre: "Distrito Legal",
    web: "",
    sector: "",
    propuesta_valor: "",
    publico_objetivo: "",
    keywords: "",
    numero_contenidos_blog: 0,
    frecuencia_mensual_blog: "",
    numero_contenidos_rrss: 0,
    frecuencia_mensual_rrss: "",
    porcentaje_educar: 70,
    porcentaje_inspirar: 5,
    porcentaje_entretener: 10,
    porcentaje_promocionar: 15,
    verticales_interes: "",
    audiencia_no_deseada: "",
    estilo_comunicacion: "",
    tono_voz: "",
    redes_sociales: [],
    usar_historias: false,
    numero_historias: 0,
    usar_reels: false,
    numero_reels: 0,
    usar_carruseles: false,
    numero_carruseles: 0,
    usar_post: false,
    numero_post: 0,
    emojis: true,
    articulos: '',
    strategies: [],
    articles: [],
    workflowId: "zQw5IM51uOdywlMD",
    executionIds: ["300", "299", "298"]
  },
  {
    id: "grangala",
    name: "Gran Gala Flamenco",
    webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/articulos-grangala",
    ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-grangala",
    structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-grangala",
    dataWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/datos-grangala",
    info: "Espectaculo prefesional de Flamenco",
    nombre: "Gran Gala Flamenco",
    web: "",
    sector: "",
    propuesta_valor: "",
    publico_objetivo: "",
    keywords: "",
    numero_contenidos_blog: 0,
    frecuencia_mensual_blog: "",
    numero_contenidos_rrss: 0,
    frecuencia_mensual_rrss: "",
    porcentaje_educar: 25,
    porcentaje_inspirar: 25,
    porcentaje_entretener: 25,
    porcentaje_promocionar: 25,
    verticales_interes: "",
    audiencia_no_deseada: "",
    estilo_comunicacion: "",
    tono_voz: "",
    redes_sociales: [],
    usar_historias: false,
    numero_historias: 0,
    usar_reels: false,
    numero_reels: 0,
    usar_carruseles: false,
    numero_carruseles: 0,
    usar_post: false,
    numero_post: 0,
    emojis: true,
    articulos: '',
    strategies: [],
    articles: [],
    workflowId: "",
    executionIds: []
  },
  {
    id: "sistemlab",
    name: "SistemLab",
    webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/articulos-sistemlab",
    ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-sistemlab",
    structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-sistemlab",
    dataWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/datos-sistemlab",
    info: "Laboratorio de sistemas y tecnología. Enfoque técnico y profesional.",
    nombre: "SistemLab",
    web: "",
    sector: "",
    propuesta_valor: "",
    publico_objetivo: "",
    keywords: "",
    numero_contenidos_blog: 0,
    frecuencia_mensual_blog: "",
    numero_contenidos_rrss: 0,
    frecuencia_mensual_rrss: "",
    porcentaje_educar: 25,
    porcentaje_inspirar: 25,
    porcentaje_entretener: 25,
    porcentaje_promocionar: 25,
    verticales_interes: "",
    audiencia_no_deseada: "",
    estilo_comunicacion: "",
    tono_voz: "",
    redes_sociales: [],
    usar_historias: false,
    numero_historias: 0,
    usar_reels: false,
    numero_reels: 0,
    usar_carruseles: false,
    numero_carruseles: 0,
    usar_post: false,
    numero_post: 0,
    emojis: true,
    articulos: '',
    strategies: [],
    articles: [],
    workflowId: "",
    executionIds: []
  },
  {
    id: "neuron",
    name: "Neuron Rehab",
    webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/articulos-neuron",
    ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-neuron",
    structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-neuron",
    dataWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/datos-neuron",
    info: "Rehabilitación neurológica avanzada. Público: pacientes y familiares.",
    nombre: "Neuron Rehab",
    web: "",
    sector: "",
    propuesta_valor: "",
    publico_objetivo: "",
    keywords: "",
    numero_contenidos_blog: 0,
    frecuencia_mensual_blog: "",
    numero_contenidos_rrss: 0,
    frecuencia_mensual_rrss: "",
    porcentaje_educar: 25,
    porcentaje_inspirar: 25,
    porcentaje_entretener: 25,
    porcentaje_promocionar: 25,
    verticales_interes: "",
    audiencia_no_deseada: "",
    estilo_comunicacion: "",
    tono_voz: "",
    redes_sociales: [],
    usar_historias: false,
    numero_historias: 0,
    usar_reels: false,
    numero_reels: 0,
    usar_carruseles: false,
    numero_carruseles: 0,
    usar_post: false,
    numero_post: 0,
    emojis: true,
    articulos: '',
    strategies: [],
    articles: [],
    workflowId: "nUlAdnVfDwjnszRq",
    executionIds: []
  },
  {
    id: "deuda",
    name: "Asociacion Deuda",
    webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/articulos-deuda",
    ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-deuda",
    structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-deuda",
    dataWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/datos-deuda",
    info: "Asociación dedicada a ayudar con problemas de deuda en España.",
    nombre: "Asociacion Deuda",
    web: "",
    sector: "Legal",
    propuesta_valor: "Ayuda integral para resolver problemas de endeudamiento",
    publico_objetivo: "Personas físicas y autónomos con problemas de deuda",
    keywords: "",
    numero_contenidos_blog: 0,
    frecuencia_mensual_blog: "",
    numero_contenidos_rrss: 0,
    frecuencia_mensual_rrss: "",
    porcentaje_educar: 25,
    porcentaje_inspirar: 25,
    porcentaje_entretener: 25,
    porcentaje_promocionar: 25,
    verticales_interes: "",
    audiencia_no_deseada: "",
    estilo_comunicacion: "",
    tono_voz: "",
    redes_sociales: [],
    usar_historias: false,
    numero_historias: 0,
    usar_reels: false,
    numero_reels: 0,
    usar_carruseles: false,
    numero_carruseles: 0,
    usar_post: false,
    numero_post: 0,
    emojis: true,
    articulos: '',
    strategies: [],
    articles: [],
    workflowId: "UaWhybYUFKHNbyvs",
    executionIds: []
  },
  {
    id: "estudiantes",
    name: "Asociacion Estudiantes Extranjero",
    webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/articulos-estudiantes",
    ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-estudiantes",
    structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-estudiantes",
    dataWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/datos-estudiantes",
    info: "Asociación para estudiantes internacionales en España.",
    nombre: "Asociacion Estudiantes Extranjero",
    web: "",
    sector: "Educación",
    propuesta_valor: "Apoyo integral para estudiantes internacionales",
    publico_objetivo: "Estudiantes extranjeros en España",
    keywords: "",
    numero_contenidos_blog: 0,
    frecuencia_mensual_blog: "",
    numero_contenidos_rrss: 0,
    frecuencia_mensual_rrss: "",
    porcentaje_educar: 25,
    porcentaje_inspirar: 25,
    porcentaje_entretener: 25,
    porcentaje_promocionar: 25,
    verticales_interes: "",
    audiencia_no_deseada: "",
    estilo_comunicacion: "",
    tono_voz: "",
    redes_sociales: [],
    usar_historias: false,
    numero_historias: 0,
    usar_reels: false,
    numero_reels: 0,
    usar_carruseles: false,
    numero_carruseles: 0,
    usar_post: false,
    numero_post: 0,
    emojis: true,
    articulos: '',
    strategies: [],
    articles: [],
    workflowId: "",
    executionIds: []
  },
  {
    id: "segunda",
    name: "Nueva Ley Segunda Oportunidad",
    webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/articulos-segunda",
    ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-segunda",
    structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-segunda",
    dataWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/datos-segunda",
    info: "Información sobre la nueva ley de segunda oportunidad en España.",
    nombre: "Nueva Ley Segunda Oportunidad",
    web: "",
    sector: "Legal",
    propuesta_valor: "Información completa sobre la ley de segunda oportunidad",
    publico_objetivo: "Personas y empresas con problemas de deuda",
    keywords: "",
    numero_contenidos_blog: 0,
    frecuencia_mensual_blog: "",
    numero_contenidos_rrss: 0,
    frecuencia_mensual_rrss: "",
    porcentaje_educar: 25,
    porcentaje_inspirar: 25,
    porcentaje_entretener: 25,
    porcentaje_promocionar: 25,
    verticales_interes: "",
    audiencia_no_deseada: "",
    estilo_comunicacion: "",
    tono_voz: "",
    redes_sociales: [],
    usar_historias: false,
    numero_historias: 0,
    usar_reels: false,
    numero_reels: 0,
    usar_carruseles: false,
    numero_carruseles: 0,
    usar_post: false,
    numero_post: 0,
    emojis: true,
    articulos: '',
    strategies: [],
    articles: [],
    workflowId: "",
    executionIds: []
  },
  {
    id: "comparador",
    name: "Comparador Aprender Idiomas",
    webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/articulos-comparador",
    ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-comparador",
    structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-comparador",
    dataWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/datos-comparador",
    info: "Comparador para aprender idiomas online.",
    nombre: "Comparador Aprender Idiomas",
    web: "",
    sector: "Educación",
    propuesta_valor: "Comparación Exhaustiva de academias y métodos de aprendizaje de idiomas",
    publico_objetivo: "Personas interesadas en aprender idiomas",
    keywords: "",
    numero_contenidos_blog: 0,
    frecuencia_mensual_blog: "",
    numero_contenidos_rrss: 0,
    frecuencia_mensual_rrss: "",
    porcentaje_educar: 25,
    porcentaje_inspirar: 25,
    porcentaje_entretener: 25,
    porcentaje_promocionar: 25,
    verticales_interes: "",
    audiencia_no_deseada: "",
    estilo_comunicacion: "",
    tono_voz: "",
    redes_sociales: [],
    usar_historias: false,
    numero_historias: 0,
    usar_reels: false,
    numero_reels: 0,
    usar_carruseles: false,
    numero_carruseles: 0,
    usar_post: false,
    numero_post: 0,
    emojis: true,
    articulos: '',
    strategies: [],
    articles: [],
    workflowId: "",
    executionIds: []
  }
];

export function ContentSettingsProvider({ children }: { children: React.ReactNode }) {
  const [defaultTone, setDefaultTone] = useState<Tone>("profesional");
  const [defaultLength, setDefaultLength] = useState<number>(2000);
  const [defaultIdeas, setDefaultIdeas] = useState<number>(2);
  const [globalInstructions, setGlobalInstructions] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isHydrated, setIsHydrated] = useState(false);
  const [draftArticle, setDraftArticle] = useState<{ title: string; structure: string } | null>(null);
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [lastExecutionId, setLastExecutionId] = useState<number>(451); // Updated to match latest execution
  const [clientLoadingStates, setClientLoadingStates] = useState<Record<string, boolean>>({});

  // Función para cargar datos de cliente desde Supabase (definida antes de los useEffect)
  const loadClientFromSupabase = useCallback(async (clientId: string): Promise<void> => {
    try {
      console.log(`🔄 Loading client data from Supabase for ${clientId}`);

      // Get the client name for the API call
      const clientName = clientNameMap[clientId] || clientId;

      // Use API route to load data (bypasses RLS issues in production)
      console.log('🔍 Loading client data via API...');
      const response = await fetch(`/api/clients?clientName=${encodeURIComponent(clientName)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API error loading client:', errorData);
        return;
      }

      const result = await response.json();
      console.log(`📋 API response:`, result);

      // Find the specific client data
      const clientsData = result.data || [];
      const supabaseData = clientsData.find((client: any) => client.name === clientName);

      if (supabaseData) {
        console.log(`✅ Loaded client data from Supabase via API:`, supabaseData);

        // Update the client state with data from Supabase
        setClients(prev => prev.map(c => {
          if (c.id === clientId) {
            return {
              ...c,
              nombre: supabaseData.name || '',
              web: supabaseData.web || '',
              sector: supabaseData.sector || '',
              propuesta_valor: supabaseData.propuesta_valor || '',
              publico_objetivo: supabaseData.publico_objetivo || '',
              // Convert array keywords back to comma-separated string
              keywords: Array.isArray(supabaseData.keywords) ?
                supabaseData.keywords.join(', ') :
                (supabaseData.keywords || ''),
              numero_contenidos_blog: supabaseData.numero_contenidos_blog || 0,
              frecuencia_mensual_blog: supabaseData.frecuencia_mensual_blog || '',
              numero_contenidos_rrss: supabaseData.numero_contenidos_rrss || 0,
              frecuencia_mensual_rrss: supabaseData.frecuencia_mensual_rrss || '',
              porcentaje_educar: supabaseData.porcentaje_educar ?? c.porcentaje_educar,
              porcentaje_inspirar: supabaseData.porcentaje_inspirar ?? c.porcentaje_inspirar,
              porcentaje_entretener: supabaseData.porcentaje_entretener ?? c.porcentaje_entretener,
              porcentaje_promocionar: supabaseData.porcentaje_promocionar ?? c.porcentaje_promocionar,
              verticales_interes: supabaseData.verticales_interes || '',
              audiencia_no_deseada: supabaseData.audiencia_no_deseada || '',
              estilo_comunicacion: supabaseData.estilo_comunicacion || '',
              tono_voz: supabaseData.tono_voz || '',
              redes_sociales: Array.isArray(supabaseData.redes_sociales) ?
                supabaseData.redes_sociales :
                (supabaseData.redes_sociales || []),
              usar_historias: supabaseData.usar_historias ?? false,
              numero_historias: supabaseData.numero_historias ?? 0,
              usar_reels: supabaseData.usar_reels ?? false,
              numero_reels: supabaseData.numero_reels ?? 0,
              usar_carruseles: supabaseData.usar_carruseles ?? false,
              numero_carruseles: supabaseData.numero_carruseles ?? 0,
              usar_post: supabaseData.usar_post ?? false,
              numero_post: supabaseData.numero_post ?? 0,
              emojis: supabaseData.emojis ?? true,
              articulos: Array.isArray(supabaseData.articulos) ?
                supabaseData.articulos.join('\n') :
                (supabaseData.articulos || '')
            };
          }
          return c;
        }));

        // Sync to localStorage for offline availability
        const clientStorageKey = `client_${clientId}_config`;
        const localData = localStorage.getItem(clientStorageKey) || '{}';
        let clientData;

        try {
          clientData = JSON.parse(localData);
        } catch {
          clientData = {};
        }

        // Update with Supabase data
        clientData.nombre = supabaseData.name || '';
        clientData.web = supabaseData.web || '';
        clientData.sector = supabaseData.sector || '';
        clientData.propuesta_valor = supabaseData.propuesta_valor || '';
        clientData.publico_objetivo = supabaseData.publico_objetivo || '';
        clientData.keywords = Array.isArray(supabaseData.keywords) ?
          supabaseData.keywords.join(', ') :
          (supabaseData.keywords || '');
        clientData.numero_contenidos_blog = supabaseData.numero_contenidos_blog || 0;
        clientData.frecuencia_mensual_blog = supabaseData.frecuencia_mensual_blog || '';
        clientData.numero_contenidos_rrss = supabaseData.numero_contenidos_rrss || 0;
        clientData.frecuencia_mensual_rrss = supabaseData.frecuencia_mensual_rrss || '';
        clientData.porcentaje_educar = supabaseData.porcentaje_educar ?? 25;
        clientData.porcentaje_inspirar = supabaseData.porcentaje_inspirar ?? 25;
        clientData.porcentaje_entretener = supabaseData.porcentaje_entretener ?? 25;
        clientData.porcentaje_promocionar = supabaseData.porcentaje_promocionar ?? 25;
        clientData.verticales_interes = supabaseData.verticales_interes || '';
        clientData.audiencia_no_deseada = supabaseData.audiencia_no_deseada || '';
        clientData.estilo_comunicacion = supabaseData.estilo_comunicacion || '';
        clientData.tono_voz = supabaseData.tono_voz || '';
        clientData.redes_sociales = Array.isArray(supabaseData.redes_sociales) ?
          supabaseData.redes_sociales :
          (supabaseData.redes_sociales || []);
        clientData.usar_historias = supabaseData.usar_historias ?? false;
        clientData.numero_historias = supabaseData.numero_historias ?? 0;
        clientData.usar_reels = supabaseData.usar_reels ?? false;
        clientData.numero_reels = supabaseData.numero_reels ?? 0;
        clientData.usar_carruseles = supabaseData.usar_carruseles ?? false;
        clientData.numero_carruseles = supabaseData.numero_carruseles ?? 0;
        clientData.usar_post = supabaseData.usar_post ?? false;
        clientData.numero_post = supabaseData.numero_post ?? 0;
        clientData.emojis = supabaseData.emojis ?? true;
        clientData.articulos = Array.isArray(supabaseData.articulos) ?
          supabaseData.articulos.join('\n') :
          (supabaseData.articulos || '');
        clientData.loadedFromSupabase = true;
        clientData.lastSync = new Date().toISOString();

        localStorage.setItem(clientStorageKey, JSON.stringify(clientData));
        console.log(`✅ Client ${clientId} data synchronized from Supabase to localStorage`);

      } else {
        console.log(`ℹ️ No data found in Supabase for client ${clientId}`);
      }
    } catch (error) {
      console.error('❌ Error loading client from Supabase:', error);
    }
  }, []);

  // 🔍 Ejecutar diagnóstico de Supabase al inicializar
  useEffect(() => {
    const runInitialDiagnostic = async () => {
      try {
        console.log('🔍 Starting Supabase diagnostic...');
        await diagnostics.runAll();
      } catch (error) {
        console.error('❌ Diagnostic error:', error);
      }
    };

    runInitialDiagnostic();
  }, []);

  useEffect(() => {
    setIsHydrated(true);

    // Load lastExecutionId from localStorage
    try {
      const savedLastExecutionId = localStorage.getItem('lastExecutionId');
      if (savedLastExecutionId && !isNaN(parseInt(savedLastExecutionId))) {
        const savedId = parseInt(savedLastExecutionId);
        if (savedId > lastExecutionId) {
          console.log(`🔄 Updating lastExecutionId from ${lastExecutionId} to ${savedId}`);
          setLastExecutionId(savedId);
        }
      }
    } catch (error) {
      console.error('Error loading lastExecutionId from localStorage:', error);
    }

    // Load individual client configurations from localStorage
    const loadedClients = initialClients.map(client => {
      try {
        const clientStorageKey = `client_${client.id}_config`;
        const savedData = localStorage.getItem(clientStorageKey);

        if (savedData) {
          const parsedData = JSON.parse(savedData);

          // Validate that the saved data belongs to the correct client
          if (parsedData.id === client.id) {
            console.log(`📥 Loaded saved configuration for ${client.id} from localStorage`);

            return {
              ...client,
              // Load client-specific configuration
              nombre: parsedData.nombre || '',
              web: parsedData.web || '',
              sector: parsedData.sector || '',
              propuesta_valor: parsedData.propuesta_valor || '',
              publico_objetivo: parsedData.publico_objetivo || '',
              keywords: parsedData.keywords || '',
              numero_contenidos_blog: parsedData.numero_contenidos_blog || 0,
              frecuencia_mensual_blog: parsedData.frecuencia_mensual_blog || '',
              numero_contenidos_rrss: parsedData.numero_contenidos_rrss || 0,
              frecuencia_mensual_rrss: parsedData.frecuencia_mensual_rrss || '',
              porcentaje_educar: parsedData.porcentaje_educar ?? client.porcentaje_educar,
              porcentaje_inspirar: parsedData.porcentaje_inspirar ?? client.porcentaje_inspirar,
              porcentaje_entretener: parsedData.porcentaje_entretener ?? client.porcentaje_entretener,
              porcentaje_promocionar: parsedData.porcentaje_promocionar ?? client.porcentaje_promocionar,
              verticales_interes: parsedData.verticales_interes || '',
              audiencia_no_deseada: parsedData.audiencia_no_deseada || '',
              estilo_comunicacion: parsedData.estilo_comunicacion || '',
              tono_voz: parsedData.tono_voz || '',
              redes_sociales: parsedData.redes_sociales || [],
              usar_historias: parsedData.usar_historias ?? false,
              numero_historias: parsedData.numero_historias ?? 0,
              usar_reels: parsedData.usar_reels ?? false,
              numero_reels: parsedData.numero_reels ?? 0,
              usar_carruseles: parsedData.usar_carruseles ?? false,
              numero_carruseles: parsedData.numero_carruseles ?? 0,
              usar_post: parsedData.usar_post ?? false,
              numero_post: parsedData.numero_post ?? 0,
              articulos: parsedData.articulos || '',
              // Keep global fields intact
              strategies: client.strategies,
              articles: client.articles,
              workflowId: client.workflowId,
              executionIds: client.executionIds
            };
          }
        }

        console.log(`🆕 Using default configuration for ${client.id}`);

        // Always ensure Distrito Legal has sample strategies for demonstration
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
      } catch (error) {
        console.error(`Error loading client ${client.id} data:`, error);
        return client;
      }
    });

    setClients(loadedClients);
    console.log('✅ All client configurations loaded from localStorage');
  }, []);

  // Cargar datos desde Supabase cuando se selecciona un cliente
  useEffect(() => {
    if (selectedClientId && isHydrated) {
      console.log(`🟡 Client selected: ${selectedClientId}, loading from Supabase...`);
      loadClientFromSupabase(selectedClientId);
    }
  }, [selectedClientId, isHydrated, loadClientFromSupabase]);



  const updateClientField = (id: string, field: keyof Client, value: string | string[] | boolean | number) =>
    setClients(prev => prev.map(c => {
      // Manejar conversión para campos numéricos
      if (field === 'numero_contenidos_blog' || field === 'numero_contenidos_rrss') {
        return { ...c, [field]: parseInt(value as string) || 0 };
      }
      // Manejar conversión para campos de porcentaje
      if (field === 'porcentaje_educar' || field === 'porcentaje_inspirar' ||
          field === 'porcentaje_entretener' || field === 'porcentaje_promocionar') {
        return { ...c, [field]: parseInt(value as string) || 0 };
      }
      // Manejar conversión para campos de array
      if (field === 'redes_sociales') {
        return { ...c, [field]: Array.isArray(value) ? value : [] };
      }
      // Manejar conversión para campos booleanos
      if (typeof value === 'boolean') {
        return { ...c, [field]: value };
      }
      // Manejar conversión para campos numéricos (para las nuevas cantidades de contenido social)
      if (typeof value === 'number') {
        return { ...c, [field]: value };
      }
      return { ...c, [field]: value };
    }));

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



  const createExecution = useCallback((type: 'strategy' | 'ideas' | 'structure' | 'article', clientId: string, payload: any, result: any) => {
    const currentExecutionId = lastExecutionId + 1;
    setLastExecutionId(currentExecutionId);

    const execution: ExecutionRecord = {
      id: Date.now().toString(),
      executionId: currentExecutionId,
      type,
      clientId,
      payload,
      result,
      createdAt: new Date().toISOString(),
      workflowUrl: `https://content-generator.nv0ey8.easypanel.host/workflow/KpdNAOeZShs0PHpE/executions/${currentExecutionId}`
    };

    setExecutions(prev => [execution, ...prev]);

    // Persist executions
    const updatedExecutions = [execution, ...executions];
    localStorage.setItem('globalExecutions', JSON.stringify(updatedExecutions));
    localStorage.setItem('lastExecutionId', currentExecutionId.toString());

    return execution;
  }, [lastExecutionId, executions]);

  const saveClientData = useCallback(async (clientId: string): Promise<boolean> => {
    try {
      console.log(`💾 Starting save process for client: ${clientId}`);

      const client = clients.find(c => c.id === clientId);
      if (!client) {
        console.error('❌ Client not found');
        throw new Error('Client not found');
      }

      // Prepare client data for API
      const clientDataToSave = {
        clientId: client.id,
        nombre: client.nombre,
        web: client.web,
        sector: client.sector,
        propuesta_valor: client.propuesta_valor,
        publico_objetivo: client.publico_objetivo,
        keywords: client.keywords,
        numero_contenidos_blog: client.numero_contenidos_blog,
        frecuencia_mensual_blog: client.frecuencia_mensual_blog,
        numero_contenidos_rrss: client.numero_contenidos_rrss,
        frecuencia_mensual_rrss: client.frecuencia_mensual_rrss,
        porcentaje_educar: client.porcentaje_educar,
        porcentaje_inspirar: client.porcentaje_inspirar,
        porcentaje_entretener: client.porcentaje_entretener,
        porcentaje_promocionar: client.porcentaje_promocionar,
        verticales_interes: client.verticales_interes,
        audiencia_no_deseada: client.audiencia_no_deseada,
        estilo_comunicacion: client.estilo_comunicacion,
        tono_voz: client.tono_voz,
        redes_sociales: client.redes_sociales,
        usar_historias: client.usar_historias,
        numero_historias: client.numero_historias,
        usar_reels: client.usar_reels,
        numero_reels: client.numero_reels,
        usar_carruseles: client.usar_carruseles,
        numero_carruseles: client.numero_carruseles,
        usar_post: client.usar_post,
        numero_post: client.numero_post,
        emojis: client.emojis,
        articulos: client.articulos
      };

      console.log(`📤 Sending data to API:`, clientDataToSave);

      // Save to Supabase via API route (server-side)
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientDataToSave)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API error:', errorData);
        throw new Error(errorData.error || 'Failed to save to API');
      }

      const apiResult = await response.json();
      console.log('✅ API response:', apiResult);

      // Save to localStorage as backup and for immediate access
      const clientStorageKey = `client_${clientId}_config`;
      const localStorageData = {
        id: client.id,
        name: client.name,
        webhook: client.webhook,
        ideasWebhook: client.ideasWebhook,
        structureWebhook: client.structureWebhook,
        dataWebhook: client.dataWebhook,
        info: client.info,
        // Include all the saved fields
        ...clientDataToSave,
        // Keep global fields
        strategies: client.strategies,
        articles: client.articles,
        workflowId: client.workflowId,
        executionIds: client.executionIds,
        // Timestamp for versioning
        savedAt: new Date().toISOString()
      };

      localStorage.setItem(clientStorageKey, JSON.stringify(localStorageData));
      console.log(`✅ Client ${clientId} data saved to localStorage`);

      // Try to send to webhook if available (non-blocking - won't affect save success)
      if (client.dataWebhook) {
        try {
          console.log(`📤 Sending to webhook: ${client.dataWebhook}`);
          const webhookResponse = await fetch(client.dataWebhook, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(clientDataToSave)
          });

          if (webhookResponse.ok) {
            console.log('✅ Data sent to webhook successfully');
          } else {
            console.warn(`⚠️ Webhook failed with status ${webhookResponse.status}: ${webhookResponse.statusText}`);
            // Don't fail the save operation because of webhook issues
          }
        } catch (webhookError) {
          console.warn(`⚠️ Webhook failed (CORS/development error - normal in dev):`, webhookError instanceof Error ? webhookError.message : webhookError);
          // Log but don't fail - this is expected in development and shouldn't block saves
        }
      }

      console.log(`✅ Client ${clientId} saved successfully to Supabase and localStorage`);
      return true;

    } catch (error) {
      console.error('❌ Error saving client data:', error);
      return false;
    }
  }, [clients]);

  const value = useMemo<ContentSettingsContextValue>(
    () => ({
      defaultTone, setDefaultTone,
      defaultLength, setDefaultLength,
      defaultIdeas, setDefaultIdeas,
      globalInstructions, setGlobalInstructions,
      selectedClientId, setSelectedClientId,
      loadClientFromSupabase,
      clients, updateClientField, saveClientData,
      addStrategy, addStrategies, addArticle,
      updateStrategy, updateArticle,
      addExecutionId,
      draftArticle, setDraftArticle,
      executions, lastExecutionId, createExecution
    }),
    [defaultTone, defaultLength, defaultIdeas, globalInstructions, selectedClientId, loadClientFromSupabase, clients, saveClientData, draftArticle, executions, lastExecutionId, createExecution]
  );

  return <ContentSettingsContext.Provider value={value}>{children}</ContentSettingsContext.Provider>;
}

export const useContentSettings = () => {
  const ctx = useContext(ContentSettingsContext);
  if (!ctx) throw new Error("useContentSettings must be used within ContentSettingsProvider");
  return ctx;
};
