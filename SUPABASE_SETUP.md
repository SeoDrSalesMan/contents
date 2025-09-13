# Supabase Setup and Usage Guide

Este documento explica cómo configurar y usar Supabase en el proyecto de content-generator.

## 🚀 Configuración Inicial

### 1. Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Haz clic en "New project"
4. Llena los detalles del proyecto:
   - Project Name
   - Database Password
   - Region (selecciona la más cercana a tus usuarios)

### 2. Obtener credenciales
Una vez creado el proyecto, ve a Settings → API:

```env
# Client-side (copia del dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui

# Server-side (solo para operaciones administrativas)
SUPABASE_URL=https://tu-proyecto-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### 3. Configurar variables de entorno
Actualiza tu archivo `.env.local` con tus credenciales reales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://tu-proyecto-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🗄️ Esquema de Base de Datos

### Tabla: clients
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS clients_name_idx ON clients(name);
CREATE INDEX IF NOT EXISTS clients_status_idx ON clients(status);
CREATE INDEX IF NOT EXISTS clients_created_at_idx ON clients(created_at DESC);

-- Habilitar Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Política de lectura para usuarios autenticados
CREATE POLICY "Users can read their own clients" ON clients
  FOR SELECT TO authenticated
  USING (auth.uid()::text = id OR auth.role() = 'service_role');

-- Política de creación
CREATE POLICY "Users can insert clients" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = id OR auth.role() = 'service_role');

-- Política de actualización
CREATE POLICY "Users can update their own clients" ON clients
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = id OR auth.role() = 'service_role');

-- Política de eliminación
CREATE POLICY "Users can delete their own clients" ON clients
  FOR DELETE TO authenticated
  USING (auth.uid()::text = id OR auth.role() = 'service_role');
```

### Crear tabla desde Supabase Dashboard
1. Ve a la sección "SQL Editor" en el dashboard
2. Copia y pega el SQL anterior
3. Ejecuta el código

## 📁 Estructura de Archivos

```
src/
├── utils/
│   ├── supabase-client.ts     # Cliente para el navegador
│   ├── supabase-server.ts     # Cliente para API routes
│   └── supabase-hooks.ts      # Hooks personalizados
├── app/api/
│   └── clients/
│       └── route.ts          # API routes para clients
├── components/
│   └── clients/
│       └── ClientsList.tsx   # Componente de ejemplo
├── .env.example               # Variables de ejemplo
├── .env.local                # Variables locales (no subir a git)
└── SUPABASE_SETUP.md         # Este archivo
```

## 🛠️ Hooks Disponibles

### useSupabaseTable
Para leer datos de una tabla:

```tsx
import { useSupabaseTable } from '@/utils/supabase-hooks'

const MyComponent = () => {
  const { data: clients, loading, error, refetch } = useSupabaseTable(
    'clients',
    { status: 'active' } // Filtros opcionales
  )

  if (loading) return <p>Cargando...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <ul>
      {clients.map(client => (
        <li key={client.id}>{client.name}</li>
      ))}
    </ul>
  )
}
```

### useSupabaseCrud
Para operaciones CRUD:

```tsx
import { useSupabaseCrud } from '@/utils/supabase-hooks'

const MyComponent = () => {
  const { loading, error, create, update, remove, getById } = useSupabaseCrud('clients')

  const handleCreate = async () => {
    try {
      const newClient = await create({
        name: 'Nuevo Cliente',
        email: 'cliente@email.com'
      })
      console.log('Cliente creado:', newClient)
    } catch (err) {
      console.error('Error:', err)
    }
  }
}
```

### useSupabaseSubscription
Para actualizaciones en tiempo real:

```tsx
import { useSupabaseSubscription } from '@/utils/supabase-hooks'

const MyComponent = () => {
  const { isSubscribed } = useSupabaseSubscription('clients', (payload) => {
    console.log('Cambios en clients:', payload)
    // Actualizar UI según sea necesario
  })

  return <p>{isSubscribed ? 'Conectado' : 'Desconectado'}</p>
}
```

## 🌐 API Routes

### GET /api/clients
Lee todos los clientes con paginación:

```
GET /api/clients?limit=20&offset=0
```

Respuesta:
```json
{
  "data": [...],
  "count": 100,
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### POST /api/clients
Crea un nuevo cliente:

```json
{
  "name": "Cliente Nuevo",
  "email": "cliente@email.com",
  "status": "active"
}
```

## 🔒 Seguridad

### Variables de Entorno
- ✅ `.env.local` está en `.gitignore`
- ✅ Solo `.env.example` se sube al repositorio
- ✅ Variables sensibles no se exponen al cliente

### Row Level Security (RLS)
- ✅ Políticas RLS activadas por defecto
- ✅ Usuarios solo ven/editan sus propios datos
- ✅ Service role key solo en el servidor

## 🚀 Despliegue

### Variables de Entorno en Producción
Asegúrate de configurar estas variables en tu plataforma de despliegue:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Docker
El Dockerfile actualizado incluye la nueva dependencia de Supabase:

```dockerfile
RUN npm install @supabase/supabase-js
```

## 🔄 Próximos Pasos

1. **Crear más tablas**: Extiende el esquema según tus necesidades
2. **Añadir autenticación**: Implementa login con Supabase Auth
3. **Real-time**: Configura más tablas con suscripciones
4. **Storage**: Usa Supabase Storage para archivos
5. **Edge Functions**: Implementa funciones serverless

## 📖 Recursos

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Client Reference](https://supabase.com/docs/reference/javascript)
