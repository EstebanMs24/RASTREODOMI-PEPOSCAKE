# Arquitectura de PEPOS CAKE

## 📐 Visión General

SPA moderna con arquitectura cliente-servidor basada en:
- **Frontend**: React + TypeScript (Vite)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Mapas**: Google Maps API
- **Estado**: Zustand (local) + Supabase (remoto)

## 🏗️ Componentes Principales

### 1. Autenticación (Auth)
```
LoginPage → useAuthStore.login()
  ↓
supabase.auth.signInWithPassword()
  ↓
Fetch user from users table
  ↓
setUser() → Redux store
  ↓
Router → /admin o /deliverer
```

**Seguridad**:
- Tokens JWT automáticos en Supabase
- RLS policies por rol
- Session persistence en localStorage

### 2. Gestión de Pedidos (Orders)
```
AdminDashboard → useOrdersStore.fetchOrders()
  ↓
SELECT * FROM orders (RLS filtra por rol)
  ↓
OrdersPanel renderiza lista
  ↓
createOrder() → INSERT en DB
  ↓
subscribeToOrders() → Realtime updates
```

**Flujo de un pedido**:
```
pending → assigned → in_route → delivered
   ↓        ↓           ↓          ↓
 Admin   Admin/   Domiciliario  Completado
        Domiciliario
```

### 3. Tracking GPS (Locations)
```
DelivererDashboard.startTracking()
  ↓
navigator.geolocation.watchPosition()
  ↓
Cada 10-15 segundos
  ↓
useMapStore.sendLocation()
  ↓
INSERT INTO locations
  ↓
Realtime subscription
  ↓
AdminDashboard MapView actualiza marcadores
```

**Optimización**:
- watchPosition() con timeout 30s
- Skip duplicados de ubicación
- Limpieza automática después 7 días

### 4. Dashboard Admin
```
AdminDashboard (componente principal)
├── Header (user info + logout)
├── Tabs (map, orders, stats)
├── MapView
│   ├── Google Maps instance
│   ├── useMapStore.markers
│   └── Realtime location updates
├── OrdersPanel
│   ├── Lista de pedidos
│   ├── Crear pedido form
│   └── Acciones (assign, update status)
└── DashboardStats
    ├── KPI cards
    └── Gráfico placeholder
```

### 5. Portal Domiciliario
```
DelivererDashboard
├── Header (tracking toggle)
├── Tabs (orders, map)
├── DeliveryOrders
│   ├── Mis pedidos asignados
│   ├── Detalles cliente
│   └── Acciones (iniciar entrega, marcar entregado)
└── DeliveryMap
    ├── Mi ubicación
    ├── Status de rastreo
    └── Info geolocalización
```

## 💾 Estructura de Datos

### users
```sql
id (UUID)
├── email (unique)
├── full_name
├── role (admin | deliverer)
├── phone
├── is_active
├── avatar_url
└── timestamps
```

### orders
```sql
id (UUID)
├── order_number (unique)
├── customer_*
├── assigned_to (FK users)
├── status (pending | assigned | in_route | delivered | cancelled)
├── total_amount
├── delivery_photo_url
└── timestamps + delivered_at
```

### locations
```sql
id (UUID)
├── user_id (FK users)
├── latitude / longitude
├── accuracy / speed / heading
└── created_at
```

### incidents
```sql
id (UUID)
├── order_id (FK orders, nullable)
├── reported_by (FK users)
├── incident_type
├── description
├── photo_url
├── status (open | in_progress | resolved | closed)
├── severity (low | medium | high)
└── timestamps
```

### performance_metrics
```sql
id (UUID)
├── user_id (FK users)
├── date
├── total_deliveries
├── average_delivery_time
├── on_time_deliveries
├── delayed_deliveries
├── incidents_count
├── rating
└── timestamps
```

## 🔐 Seguridad (RLS)

### Políticas por Rol

**Admin**:
- Ver todos los usuarios
- Ver todos los pedidos
- Ver todas las ubicaciones
- Ver todos los incidentes
- Crear/actualizar pedidos

**Deliverer**:
- Ver su perfil
- Ver solo sus pedidos asignados
- Enviar su ubicación
- Ver su ubicación
- Reportar incidentes en sus pedidos

## 🔄 Flujos de Datos

### Flujo 1: Crear Pedido (Admin)
```
1. Admin llena formulario en OrdersPanel
2. onClick → useOrdersStore.createOrder()
3. Supabase: INSERT INTO orders
4. RLS: permitido (admin)
5. Broadcast Realtime → todos los admins
6. Actualizar orders[] en Zustand
7. Renderizar en lista
```

### Flujo 2: Rastreo GPS (Domiciliario)
```
1. Domiciliario en DelivererDashboard
2. Click en "Activar rastreo"
3. startTracking() → navigator.geolocation.watchPosition()
4. Callback cada 10-15 seg
5. sendLocation(latitude, longitude)
6. Supabase: INSERT INTO locations
7. Realtime broadcast
8. Admin ve marcador actualizado en mapa
9. Timestamp guardado para historial
```

### Flujo 3: Marcar Entregado (Domiciliario)
```
1. Domiciliario selecciona pedido en DeliveryOrders
2. Click "Marcar entregado"
3. updateOrderStatus(orderId, 'delivered')
4. Supabase: UPDATE orders SET status='delivered', delivered_at=NOW()
5. RLS: permitido (su pedido asignado)
6. Realtime → Admin ve cambio
7. Actualizar stats dashboard
```

## 🚀 Performance

### Optimizaciones Implementadas

**Frontend**:
- Lazy loading de componentes
- Zustand para estado local (no re-renders innecesarios)
- React Query para caching de datos
- TailwindCSS (no JS, solo CSS)
- Service Worker para cacheo

**Backend (Supabase)**:
- Índices en columnas frecuentes (status, user_id, created_at)
- Replicación Realtime solo en tablas necesarias
- RLS policies eficientes
- Limpieza automática de datos antiguos

**Mapas**:
- Instancia única de Google Map
- Reutilización de marcadores
- Actualización de posición sin recrear
- Bounds fitting automático

## 🔌 Integraciones

### Google Maps API
- Maps JavaScript API (v3)
- Símbolo personalizado para marcadores
- Info Windows al click
- Auto-fitting de bounds

### Supabase
- PostgreSQL database
- Auth con JWT
- Realtime subscriptions
- Storage para fotos

## 📱 PWA

### Service Worker
- Cacheo de assets estáticos (JS, CSS, HTML)
- Stale-while-revalidate para APIs
- Fallback a /index.html para SPA

### Manifest
- Ícono 192x192 y 512x512
- Shortcuts: Mapa, Mis Pedidos
- Standalone: sí (sin UI del navegador)

## 🧪 Testing Strategy

**Manual**:
1. Login as admin → verificar /admin
2. Login as deliverer → verificar /deliverer
3. Crear pedido → verificar INSERT en DB
4. Asignar pedido → verificar UPDATE + RLS
5. Rastreo → verificar ubicaciones en tiempo real
6. Mapa → verificar marcadores activos/inactivos

**Automatizado** (próxima fase):
- Unit tests con Vitest
- Integration tests con Supabase local
- E2E con Playwright/Cypress

## 🚢 Deployment

### Build
```bash
npm run build  # → dist/
```

### Hosting Options

**Vercel** (recomendado):
- Gratuito para proyectos públicos
- Deployment automático desde Git
- Edge functions disponibles
- HTTPS automático

**Netlify**:
- Similar a Vercel
- Functions (para serverless)
- Forms integration

**Railway/Render**:
- Full stack hosting
- Database + API en mismo lugar

## 📊 Métricas Monitoreadas

1. **Operacionales**:
   - Pedidos/día
   - Entregas completadas
   - Tiempo promedio entrega

2. **Técnicas**:
   - Realtime subscription lag
   - Query latency
   - Service Worker offline hits

3. **Usuarios**:
   - Domiciliarios activos
   - Rating/calificación
   - Incidencias reportadas

## 🔮 Próximas Mejoras

**Corto plazo**:
- [ ] Gráficos con Recharts
- [ ] Upload de fotos de entrega
- [ ] Notificaciones push
- [ ] Ranking de domiciliarios

**Mediano plazo**:
- [ ] Optimización de rutas
- [ ] Machine learning para predicción de tiempos
- [ ] Estimaciones de ETA automáticas
- [ ] Integración con SMS

**Largo plazo**:
- [ ] App nativa (React Native)
- [ ] Video llamadas (Twilio)
- [ ] Blockchain para prueba de entrega
- [ ] Integraciones con plataformas de pago

---

**Última actualización**: 2026-05-01
**Versión**: 1.0.0
