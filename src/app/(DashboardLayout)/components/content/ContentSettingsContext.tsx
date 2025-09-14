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
  updateClientField: (id: string, field: keyof Client, value: string) => void;
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

const initialClients: Client[] = [
  {
    id: "gran_gala_flamenco",
    name: "Gran Gala Flamenco",
    webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/gala",
    ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-gala",
    structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-grangala",
    dataWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/datos-grangala",
    info: "Espectáculos flamencos en España. Enfoque cultural y turístico.",
    // Nuevos campos con valores iniciales vacíos
    nombre: "",
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
    strategies: [],
    articles: [],
    workflowId: "j9lMwR2UTgqDsI1g",
    executionIds: []
  },
  {
    id: "distrito_legal",
    name: "Distrito Legal",
    webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/distrito",
    ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-distrito",
    structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-distrito",
    dataWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/datos-distrito",
    info: "Servicios legales online en España. Enfoque profesional con tono formal.",
    // Nuevos campos con valores iniciales vacíos
    nombre: "",
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
    strategies: [],
    articles: [],
    workflowId: "zQw5IM51uOdywlMD",
    executionIds: ["300", "299", "298"]
  },
  {
    id: "neuron_rehab",
    name: "Neuron Rehab",
    webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/neuron",
    ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-neuron",
    structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-neuron",
    dataWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/datos-neuron",
    info: "Rehabilitación neurológica avanzada. Público: pacientes y familiares.",
    // Nuevos campos con valores iniciales vacíos
    nombre: "",
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
    strategies: [],
    articles: [],
    workflowId: "nUlAdnVfDwjnszRq",
    executionIds: []
  },
  {
    id: "sistem_lab",
    name: "SistemLab",
    webhook: "https://content-generator.nv0ey8.easypanel.host/webhook/sistemlab",
    ideasWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/ideas-sistemlab",
    structureWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/estructura-sistemlab",
    dataWebhook: "https://content-generator.nv0ey8.easypanel.host/webhook/datos-sistemlab",
    info: "Laboratorio de sistemas y tecnología. Enfoque técnico y profesional.",
    // Nuevos campos con valores iniciales vacíos
    nombre: "",
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
    strategies: [],
    articles: [],
    workflowId: "sistemlab",
    executionIds: []
  },
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
  const [lastExecutionId, setLastExecutionId] = useState<number>(352);

  // Función para cargar datos de cliente desde Supabase (definida antes de los useEffect)
  const loadClientFromSupabase = useCallback(async (clientId: string): Promise<void> => {
    try {
      console.log(`🔄 Loading client data from Supabase for ${clientId}`);

      // 🆔 IMPORTANTE: Verificar/Crear usuario autenticado para RLS
      let { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.log('⚠️ No user authenticated. Creating test session...');
        user = await authHelpers.initializeTestSession(supabase);
        if (!user) {
          console.error('❌ Failed to initialize test session for RLS');
          return;
        }
      }

      console.log('✅ Usuario autenticado para carga:', user.id);

      // Para cargar datos, necesitamos buscar por el campo que tenemos disponible (name) en lugar de id
      // Como clientId viene del código del cliente, buscaremos por name correspondiente
      const client = clients.find(c => c.id === clientId);
      const clientName = client?.name || clientId;

      // 🆔 CAMBIO: Usar RLS para cargar solo datos del usuario autenticado
      const { data: supabaseData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('name', clientName)
        .eq('created_by', user.id)  // <- RLS requiere filtro por created_by
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        console.error('Error loading from Supabase:', error);
        return;
      }

      if (supabaseData) {
        console.log(`✅ Loaded client data from Supabase:`, supabaseData);

        // Actualizar el estado del cliente con los datos de Supabase
        setClients(prev => prev.map(c => {
          if (c.id === clientId) {
            return {
              ...c,
              nombre: supabaseData.name || '',
              web: supabaseData.web || '',
              sector: supabaseData.sector || '',
              propuesta_valor: supabaseData.propuesta_valor || '',
              publico_objetivo: supabaseData.publico_objetivo || '',
              // Tratar keywords como array si viene de Supabase, o convertir string si viene de localStorage
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
              tono_voz: supabaseData.tono_voz || ''
            };
          }
          return c;
        }));

        // También guardar en localStorage para mantener sincronización
        const clientStorageKey = `client_${clientId}_config`;
        const localData = localStorage.getItem(clientStorageKey);
        let clientData: any = {};

        if (localData) {
          clientData = JSON.parse(localData);
        }

        // Actualizar con datos de Supabase
        clientData.nombre = supabaseData.name || '';
        clientData.web = supabaseData.web || '';
        clientData.sector = supabaseData.sector || '';
        clientData.propuesta_valor = supabaseData.propuesta_valor || '';
        clientData.publico_objetivo = supabaseData.publico_objetivo || '';
        clientData.keywords = supabaseData.keywords || '';
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

        localStorage.setItem(clientStorageKey, JSON.stringify(clientData));
        console.log(`✅ Client ${clientId} data synchronized from Supabase to localStorage`);

      } else {
        console.log(`ℹ️ No data found in Supabase for client ${clientId}`);
      }
    } catch (error) {
      console.error('❌ Error loading client from Supabase:', error);
    }
  }, [clients]);

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



  const updateClientField = (id: string, field: keyof Client, value: string) =>
    setClients(prev => prev.map(c => {
      // Manejar conversión para campos numéricos
      if (field === 'numero_contenidos_blog' || field === 'numero_contenidos_rrss') {
        return { ...c, [field]: parseInt(value) || 0 };
      }
      // Manejar conversión para campos de porcentaje
      if (field === 'porcentaje_educar' || field === 'porcentaje_inspirar' ||
          field === 'porcentaje_entretener' || field === 'porcentaje_promocionar') {
        return { ...c, [field]: parseInt(value) || 0 };
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
      // 🆔 IMPORTANTE: Verificar/Crear usuario autenticado para RLS
      let { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.log('⚠️ No user authenticated. Creating test session...');
        user = await authHelpers.initializeTestSession(supabase);
        if (!user) {
          console.error('❌ Failed to initialize test session for RLS');
          return false;
        }
      }

      console.log('✅ Usuario autenticado:', user.id);

      const client = clients.find(c => c.id === clientId);
      if (!client) {
        console.error('Client not found');
        return false;
      }

      // Save each client individually to localStorage using client-specific key
      const clientStorageKey = `client_${clientId}_config`;
      const clientDataToSave = {
        id: client.id,
        name: client.name,
        webhook: client.webhook,
        ideasWebhook: client.ideasWebhook,
        structureWebhook: client.structureWebhook,
        dataWebhook: client.dataWebhook,
        info: client.info,
        // Client-specific configuration fields
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
        verticales_interes: client.verticales_interes,
        audiencia_no_deseada: client.audiencia_no_deseada,
        estilo_comunicacion: client.estilo_comunicacion,
        tono_voz: client.tono_voz,
        // Global fields that shouldn't be overwritten
        strategies: client.strategies,
        articles: client.articles,
        workflowId: client.workflowId,
        executionIds: client.executionIds
      };

      localStorage.setItem(clientStorageKey, JSON.stringify(clientDataToSave));
      console.log(`✅ Client ${clientId} data saved to localStorage with key: ${clientStorageKey}`);

      // Save to Supabase table "clients" (usando la estructura REAL de la tabla)
      try {
        // 🆔 CAMBIO CRÍTICO: Mapear campos correctamente al esquema de Supabase
        const supabaseData = {
          // ✅ NO enviar 'id' - Dejar que Supabase genere UUID automáticamente
          // ✅ Usar 'name' como identificador único
          name: client.nombre || '',  // El nombre del cliente va aquí
          web: client.web || '',
          sector: client.sector || '',
          propuesta_valor: client.propuesta_valor || '',
          publico_objetivo: client.publico_objetivo || '',
          // Formatear keywords como PostgreSQL ARRAY - contiene comas
          keywords: client.keywords ? client.keywords.split(',').map(k => k.trim()) : [],
          numero_contenidos_blog: client.numero_contenidos_blog || 0,
          frecuencia_mensual_blog: client.frecuencia_mensual_blog || '',
          numero_contenidos_rrss: client.numero_contenidos_rrss || 0,
          frecuencia_mensual_rrss: client.frecuencia_mensual_rrss || '',
          porcentaje_educar: client.porcentaje_educar || 0,
          porcentaje_inspirar: client.porcentaje_inspirar || 0,
          porcentaje_entretener: client.porcentaje_entretener || 0,
          porcentaje_promocionar: client.porcentaje_promocionar || 0,
          verticales_interes: client.verticales_interes || '',
          audiencia_no_deseada: client.audiencia_no_deseada || '',
          estilo_comunicacion: client.estilo_comunicacion || '',
          tono_voz: client.tono_voz || '',
          // 🆔 CAMBIO CRÍTICO: Agregar el campo created_by requerido por el esquema
          created_by: user.id,  // <- Necesario para foreign key constraint
        };

        console.log(`📝 Attempting to save to Supabase with auth:`, {
          user: user.id,
          data: supabaseData
        });

        // Verificar si ya existe un registro con mismo name y hacer UPDATE o INSERT según corresponda
        // Usar maybeSingle() para manejar casos donde no existe el registro
        let operationResult;

        try {
          // Intentar hacer UPDATE primero (si existe)
          const updateResult = await supabase
            .from('clients')
            .update(supabaseData)
            .eq('name', client.nombre)
            .select('id');

          console.log('Update result:', updateResult);

          // Si el update afectó 0 filas (no existe), hacer INSERT
          if (updateResult.data && updateResult.data.length === 0) {
            console.log('No existing record found, doing INSERT instead');
            operationResult = await supabase
              .from('clients')
              .insert([supabaseData]);
          } else {
            operationResult = updateResult;
          }
        } catch (error: any) {
          console.log('Error during update, trying INSERT:', error);

          // Si hay error en update, intentar INSERT
          operationResult = await supabase
            .from('clients')
            .insert([supabaseData]);
        }

        const { data, error: supabaseError } = operationResult;

        console.log(`💾 Supabase response:`, { data, error: supabaseError });

        if (supabaseError) {
          console.error(`❌ Client ${clientId} data saved to localStorage but Supabase failed:`, supabaseError);
          // Don't return false here since localStorage save was successful
        } else {
          console.log(`✅ Client ${clientId} data saved to Supabase table "clients" successfully:`, data);
        }
      } catch (supabaseError) {
        console.warn(`⚠️ Client ${clientId} data saved to localStorage but Supabase error:`, supabaseError);
        // Don't return false here since localStorage save was successful
      }

      // Try to send to webhook if available
      if (client.dataWebhook) {
        try {
          const response = await fetch(client.dataWebhook, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
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
              verticales_interes: client.verticales_interes,
              audiencia_no_deseada: client.audiencia_no_deseada,
              estilo_comunicacion: client.estilo_comunicacion,
              tono_voz: client.tono_voz,
            })
          });

          if (response.ok) {
            console.log('✅ Client data saved to both localStorage and webhook');
            return true;
          } else {
            console.warn(`⚠️ Client ${clientId} data saved to localStorage but webhook failed:`, response.statusText);
            return true; // Still return true since localStorage save worked
          }
        } catch (webhookError) {
          console.warn(`⚠️ Client ${clientId} data saved to localStorage but webhook error:`, webhookError);
          return true; // Still return true since localStorage save worked
        }
      } else {
        console.log(`✅ Client ${clientId} data saved to localStorage (no webhook configured)`);
        return true;
      }
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
