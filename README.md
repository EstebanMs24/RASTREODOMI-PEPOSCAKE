# PEPOS CAKE - Sistema de Gestión de Domiciliarios

Plataforma profesional para monitoreo en tiempo real, gestión de pedidos y rutas de entrega con seguimiento GPS.

## 🚀 Características

- **Mapa en Vivo**: Rastrear domiciliarios en tiempo real
- **Gestión de Pedidos**: CRUD completo de órdenes de entrega
- **Dashboard Admin**: Estadísticas y métricas operativas
- **Portal Domiciliario**: Vista móvil optimizada para entregas
- **Tracking GPS**: Ubicación automática cada 10-15 segundos
- **Tiempo Real**: Actualizaciones instantáneas con Supabase Realtime
- **PWA**: Funciona offline con sincronización en background
- **Autenticación**: Sistema seguro con roles (Admin/Domiciliario)

## 🛠️ Stack Tecnológico

### Frontend
- React 18 + TypeScript
- Vite (bundler)
- TailwindCSS (estilos)
- Zustand (estado global)
- React Query (datos async)
- Google Maps API

### Backend
- Supabase (PostgreSQL + Auth + Realtime)
- Row Level Security (RLS)
- Storage para fotos

### Infraestructura
- PWA (Progressive Web App)
- Service Worker
- Responsive Design

## 📋 Requisitos Previos

- Node.js 16+
- npm o yarn
- Cuenta Supabase
- API Key Google Maps
- Navegador moderno con soporte geolocalización

## 🔧 Instalación

### 1. Clonar repositorio
```bash
git clone <tu-repo>
cd RASTREO-DOMIPEPOS
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD...
```

### 4. Configurar Supabase

#### 4.1 Crear proyecto en Supabase
- Ir a https://supabase.com
- Crear nuevo proyecto
- Esperar inicialización

#### 4.2 Ejecutar esquema SQL
- Ir a SQL Editor en Supabase
- Pegar contenido de `database_schema.sql`
- Ejecutar

#### 4.3 Habilitar Autenticación
- Settings → Authentication → Providers
- Email/Password habilitado
- URL de redirección: `http://localhost:5173`

#### 4.4 Crear usuarios demo
```sql
INSERT INTO auth.users (email, password)
VALUES 
  ('admin@pepos.com', crypt('demo-password', gen_salt('bf'))),
  ('deliverer@pepos.com', crypt('demo-password', gen_salt('bf')));

INSERT INTO users (id, email, full_name, role)
VALUES 
  ((SELECT id FROM auth.users WHERE email = 'admin@pepos.com'), 'admin@pepos.com', 'Admin PEPOS', 'admin'),
  ((SELECT id FROM auth.users WHERE email = 'deliverer@pepos.com'), 'deliverer@pepos.com', 'Juan Domiciliario', 'deliverer');
```

### 5. Configurar Google Maps
- Habilitar APIs: Maps JavaScript API, Places API
- Crear API Key
- Añadir dominios autorizados

## 🚀 Desarrollo

```bash
npm run dev
```

Abre http://localhost:5173

### Build
```bash
npm run build
npm run preview
```

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes React reutilizables
├── pages/              # Páginas principales
├── stores/             # Zustand stores (estado global)
├── types/              # TypeScript types
├── config/             # Configuración (Supabase)
├── App.tsx             # Componente raíz
└── main.tsx            # Entrada de la aplicación

public/
├── sw.js              # Service Worker
├── manifest.json      # PWA Manifest
└── icons/             # Íconos de PWA

database_schema.sql    # Esquema SQL para Supabase
```

## 👥 Roles del Sistema

### Admin
- Acceso: `/admin`
- Visualizar mapa con todos los domiciliarios
- Crear, asignar y editar pedidos
- Ver estadísticas y métricas
- Gestionar incidencias

### Domiciliario
- Acceso: `/deliverer`
- Ver pedidos asignados
- Rastreamiento GPS automático
- Marcar entregas completadas
- Reportar incidencias

## 🗺️ Rutas API (Supabase)

Las siguientes tablas están disponibles en Supabase:

- `users` - Gestión de usuarios
- `orders` - Pedidos y entregas
- `locations` - Tracking GPS en tiempo real
- `incidents` - Incidencias reportadas
- `performance_metrics` - Métricas de domiciliarios

## 🔐 Seguridad

- ✅ Row Level Security (RLS) configurado
- ✅ Autenticación con Supabase Auth
- ✅ Validación de roles en RLS
- ✅ HTTPS recomendado en producción
- ✅ Variables de entorno en .env.local

## 📱 PWA (Progressive Web App)

La aplicación funciona como PWA:
- Instalar en home screen (mobile)
- Funciona offline (parcialmente)
- Sincronización en background
- Service Worker cachea recursos

## 🗄️ Base de Datos

### Tablas Principales
- `users` - Usuarios del sistema
- `orders` - Órdenes de entrega
- `locations` - Historial GPS (últimos 7 días)
- `incidents` - Problemas reportados
- `performance_metrics` - KPIs por domiciliario

### Limpieza de Datos
Las ubicaciones se guardan 7 días máximo para optimizar almacenamiento. Configurado mediante:
```sql
DELETE FROM locations WHERE created_at < NOW() - INTERVAL '7 days'
```

## 🚀 Deployment

### Vercel/Netlify
```bash
npm run build
# Deploy carpeta 'dist'
```

### Railway/Render
Requiere configurar Node.js + variables de entorno

## 📊 Métricas Monitoreadas

- Pedidos completados por día
- Tiempo promedio de entrega
- Domiciliarios activos
- Incidencias reportadas
- Rating por domiciliario
- Entregas a tiempo vs retrasadas

## 🐛 Troubleshooting

**"Geolocation denied"**
- Habilitar ubicación en navegador
- HTTPS requerido en producción

**"Maps API Error"**
- Verificar API Key en .env.local
- Comprobar dominios autorizados

**"Supabase connection failed"**
- Verificar URL y API Key
- Comprobar CORS en Supabase

## 📝 Licencia

Privado - PEPOS CAKE

## 👨‍💻 Desarrollado por

Tu Nombre/Equipo

---

**Versión**: 1.0.0  
**Última actualización**: 2026-05-01
