# Guía de Configuración Supabase

## 1. Crear Proyecto en Supabase

1. Ir a https://supabase.com
2. Click en "New Project"
3. Seleccionar organización
4. Nombre: `pepos-cake-logistics`
5. Contraseña de DB: generar segura
6. Region: la más cercana
7. Esperar inicialización (5-10 min)

## 2. Obtener Credenciales

En Project Settings:
- API URL → copiar a `VITE_SUPABASE_URL`
- anon key (public) → copiar a `VITE_SUPABASE_ANON_KEY`
- service_role key (secreto, no usar en frontend)

## 3. Ejecutar Esquema SQL

1. Ir a SQL Editor
2. Click "+ New Query"
3. Copiar contenido de `database_schema.sql`
4. Ejecutar

## 4. Verificar Tablas

En Table Editor deberías ver:
- [x] users
- [x] orders
- [x] locations
- [x] incidents
- [x] performance_metrics

## 5. Crear Usuarios Demo

Opción A: SQL (recomendado)
```sql
-- En SQL Editor ejecutar:
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('admin@pepos.com', crypt('demo-password', gen_salt('bf')), now(), now(), now()),
  ('deliverer@pepos.com', crypt('demo-password', gen_salt('bf')), now(), now(), now());

INSERT INTO public.users (id, email, full_name, role, is_active)
VALUES 
  ((SELECT id FROM auth.users WHERE email = 'admin@pepos.com'), 'admin@pepos.com', 'Admin PEPOS', 'admin', true),
  ((SELECT id FROM auth.users WHERE email = 'deliverer@pepos.com'), 'deliverer@pepos.com', 'Juan Domiciliario', 'deliverer', true);
```

Opción B: UI (manual)
1. Ir a Authentication → Users
2. Click "+ Invite"
3. Email: `admin@pepos.com`
4. Role: personalizado (configurar después)
5. Copiar enlace y crear contraseña

## 6. Configurar Autenticación

### Email/Password
1. Authentication → Providers
2. Email habilitado
3. Email Confirmations:
   - "Confirm email" → OFF (para desarrollo)
   
### Redirect URLs
1. Authentication → Redirect URLs
2. Añadir:
   ```
   http://localhost:5173
   http://localhost:5173/auth/callback
   ```
   
Para producción:
   ```
   https://tudominio.com
   https://tudominio.com/auth/callback
   ```

## 7. Configurar CORS

1. Authentication → CORS Allowed Origins
2. Añadir:
   ```
   http://localhost:5173
   http://localhost
   https://tudominio.com
   ```

## 8. Configurar RLS Policies

Se ejecutan automáticamente con el SQL, pero verificar:

### Para tabla 'users'
```sql
SELECT * FROM auth.request_object('policy_name')
WHERE table_name = 'users'
```

Debería haber:
- ✅ Users can view their own profile
- ✅ Admin can view all users
- ✅ Users can update their own profile
- ✅ Admin can update any user

### Para tabla 'orders'
- ✅ Admin can view all orders
- ✅ Deliverers can view their assigned orders
- ✅ Admin can create orders
- ✅ Admin can update orders
- ✅ Deliverers can update their assigned orders status

### Para tabla 'locations'
- ✅ Users can insert their own locations
- ✅ Admin can view all locations
- ✅ Users can view their own locations

## 9. Habilitar Realtime

1. Database → Replication
2. Seleccionar tablas a replicar:
   - [x] locations (importante para tracking)
   - [x] orders
   - [x] incidents

## 10. Configurar Storage (para fotos)

1. Storage → Create Bucket
2. Nombre: `delivery-photos`
3. Public: NO
4. Crear policy:

```sql
CREATE POLICY "Allow users to upload their own photos"
ON storage.objects FOR INSERT 
WITH CHECK (auth.uid() is not null);

CREATE POLICY "Allow users to read their own photos"
ON storage.objects FOR SELECT 
WHERE (bucket_id = 'delivery-photos');
```

## 11. Crear Índices (optimización)

Ya incluidos en `database_schema.sql`, pero verificar:

```sql
SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
```

Debería haber índices en:
- users(email, role)
- orders(status, assigned_to, created_at)
- locations(user_id, created_at)
- incidents(order_id, status, created_at)

## 12. Configurar Backups

1. Settings → Backup
2. Frequency: diario
3. Retention: 30 días

## Testing

### Verificar Conexión
```bash
curl -X GET 'https://YOUR_PROJECT.supabase.co/rest/v1/' \
  -H 'apikey: YOUR_ANON_KEY'
```

### Verificar RLS
Intentar login como demo user:
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'deliverer@pepos.com',
  password: 'demo-password'
})
```

### Verificar Realtime
```javascript
const subscription = supabase
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => console.log('New update:', payload)
  )
  .subscribe()
```

## Troubleshooting

**Error 401 Unauthorized**
- Verificar API Key en .env.local
- Verificar usuario existe en auth.users
- Comprobar email_confirmed_at si es requerido

**Error 403 Forbidden**
- RLS policy denegando acceso
- Verificar role en tabla users
- Comprobar user_id en política

**Realtime no funciona**
- Verificar Replication habilitado
- Comprobar tabla en lista de replicación
- Verificar permisos en tabla

**Storage upload falla**
- Bucket debe ser privado para usar policies
- Verificar policy está activa
- Comprobar tamaño máximo archivo

## Monitoreo

### Ver querys lentas
1. Database → Query Performance
2. Identificar querys lentas
3. Añadir índices según sea necesario

### Ver conexiones activas
1. Database → Connections
2. Monitorear simultáneas

### Logs
1. Project → Logs
2. Filtrar por evento/error

## Mantenimiento

### Limpiar ubicaciones antiguas (semanal)
```sql
DELETE FROM locations 
WHERE created_at < NOW() - INTERVAL '7 days'
```

### Backup manual
Settings → Backup → Download

### Actualizar schema
1. SQL Editor → New Query
2. Aplicar cambios incrementalmente
3. Testear RLS

---

Para más info: https://supabase.com/docs
