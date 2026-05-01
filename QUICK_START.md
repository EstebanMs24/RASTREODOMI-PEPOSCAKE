# 🚀 Quick Start - PEPOS CAKE

## ⏱️ 5 minutos para correr el proyecto

### Paso 1: Clonar y preparar
```bash
cd c:\Users\user\Desktop\Pruebas\ IA\RASTREO-DOMIPEPOS
npm install
```

### Paso 2: Crear proyecto Supabase
1. https://supabase.com → Sign up/Login
2. New Project → nombre: `pepos-cake-dev`
3. Esperar 2-3 minutos

### Paso 3: Ejecutar SQL
1. En Supabase → SQL Editor → New Query
2. Copiar todo el contenido de `database_schema.sql`
3. Ejecutar

### Paso 4: Configurar .env.local
```bash
cp .env.example .env.local
```

Editar `.env.local`:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD...
```

### Paso 5: Crear usuarios demo
En Supabase → SQL Editor:
```sql
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES 
  ('admin@pepos.com', crypt('demo-password', gen_salt('bf')), now()),
  ('deliverer@pepos.com', crypt('demo-password', gen_salt('bf')), now());

INSERT INTO public.users (id, email, full_name, role, is_active)
SELECT 
  id, 
  email,
  CASE WHEN email = 'admin@pepos.com' THEN 'Admin PEPOS' ELSE 'Juan Domiciliario' END,
  CASE WHEN email = 'admin@pepos.com' THEN 'admin' ELSE 'deliverer' END,
  true
FROM auth.users
WHERE email IN ('admin@pepos.com', 'deliverer@pepos.com');
```

### Paso 6: Correr desarrollo
```bash
npm run dev
```
Abre http://localhost:5173

## 🎯 Testing Quick Flow

### Como Admin
1. Login: `admin@pepos.com` / `demo-password`
2. Ir a "Mapa en Vivo" → verás mapa de Google
3. Ir a "Pedidos" → crear pedido nuevo
4. Ir a "Estadísticas" → ver KPIs

### Como Domiciliario
1. Login: `deliverer@pepos.com` / `demo-password`
2. Ver "Mis Pedidos" → (estará vacío hasta que admin asigne)
3. Ir a "Mi Ubicación" → click "Rastreando" para activar GPS
4. Aceptar permisos de ubicación en navegador

## 📡 Realtime Demo

Para ver realtime en acción:
1. Abre 2 ventanas en paralelo
2. Una como admin, otra como deliverer
3. Admin crea pedido
4. Ambas ventanas se actualizan al instante

## 🗺️ Google Maps

Si no tienes API Key:

1. https://console.cloud.google.com
2. Create Project → nombre
3. Maps → Activate
4. Credentials → Create API Key
5. Copiar a `.env.local`

## ⚠️ Troubleshooting Rápido

**"Maps error"**
- Verificar API Key en .env.local
- Recargar página (Ctrl+F5)

**"Supabase connection error"**
- Copiar URL y key correctas
- Verificar que proyecto está activo en Supabase

**"Geolocation denied"**
- Click en ícono candado en barra dirección
- Permitir ubicación

**"Login no funciona"**
- Verificar usuario creado en SQL
- Verificar email_confirmed_at es NOT NULL

## 📁 Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `database_schema.sql` | Esquema SQL para ejecutar en Supabase |
| `SETUP_SUPABASE.md` | Guía detallada de Supabase |
| `ARCHITECTURE.md` | Documentación de arquitectura |
| `.env.example` | Variables de entorno necesarias |
| `src/stores/` | Estado global (Zustand) |
| `src/components/` | Componentes React reutilizables |

## 🔄 Próximos Pasos

- [ ] Completar integraciones de API Key Google Maps
- [ ] Verificar Realtime en tabla locations
- [ ] Habilitar storage para fotos
- [ ] Configurar CORS en Supabase
- [ ] Deploy a Vercel/Netlify
- [ ] Añadir tests automatizados

## 📞 Support

Para errores específicos, revisar:
- `README.md` → instalación completa
- `SETUP_SUPABASE.md` → problemas con DB
- `ARCHITECTURE.md` → entender flujos
- Console del navegador (F12 → Console)

---

**¡Listo!** 🎉 Tienes un sistema de tracking de domiciliarios funcional en minutos.
