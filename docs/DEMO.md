# Demo Guide — EdificiOS `0.18.0-alpha`

Guía para presentar el sistema de principio a fin en **10–15 minutos**, usando **exclusivamente la interfaz web** durante la demostración.

**Audiencia:** evaluadores técnicos, stakeholders de producto o desarrolladores que retoman el proyecto.

**Objetivo:** mostrar que EdificiOS es un producto navegable y coherente — no un conjunto de endpoints aislados.

---

## Antes de presentar (preparación única, ~15 min)

Esta preparación **no forma parte** de los 10–15 minutos de demo ante audiencia. Se hace una vez por entorno limpio.

### 1. Levantar el entorno

Seguir el [README.md](../README.md) — sección *Inicio rápido*. Resumen:

```bash
npm install
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
npm run db:setup
# Cargar .env en la terminal del backend (ver README)
npm run start:dev
```

En otra terminal:

```bash
cd frontend && npm install && npm run dev
```

### 2. Verificar salud del sistema

| URL | Resultado esperado |
|-----|-------------------|
| http://localhost:3000/api/v1/health | `"status": "UP"`, `"database": "UP"` |
| http://localhost:3000/api/v1/info | `"version": "0.18.0-alpha"` |
| http://localhost:5173 | Home con “Backend disponible” |

### 3. Crear datos operativos (solo bootstrap)

La UI **no crea** Sites, Assets ni Incidencias. Para que el dashboard muestre contenido, cargá datos **una vez** vía Swagger:

**http://localhost:3000/api/docs**

Orden obligatorio:

```
1. POST /api/v1/authentication/users
   { "email": "demo@edificios.local", "displayName": "Demo User" }

2. POST /api/v1/operations/sites
   { "name": "Edificio Central", "address": "Av. Demo 123" }

3. POST /api/v1/operations/assets
   { "siteId": "<uuid-del-site>", "name": "Bomba principal", "type": "PUMP" }

4. POST /api/v1/operations/actors
   { "siteId": "<uuid-del-site>", "displayName": "Operador demo" }

5. POST /api/v1/operations/sites/{siteId}/shifts/start
   { "actorId": "<uuid-del-actor>" }

6. POST /api/v1/operations/incidents
   { "assetId": "<uuid-del-asset>", "description": "Fuga de agua en hall principal" }
```

> **Nota:** Swagger se usa **solo para bootstrap de datos**, no durante la presentación. El recorrido ante audiencia es 100 % interfaz web.

---

## Guión de presentación (10–15 minutos)

### Minutos 0–2 — Home: bienvenida al producto

1. Abrir **http://localhost:5173/**
2. Mostrar:
   - Nombre del proyecto: **EdificiOS**
   - Versión desde la API (`0.18.0-alpha`)
   - Indicador **Backend disponible**
3. Mensaje clave: *“El cliente web consume la API existente; no hay mocks ni datos inventados en el frontend.”*
4. Sin sesión activa, el CTA es **Iniciar sesión**.

**Qué demostrar:** el producto se presenta a sí mismo; la Home valida conectividad con el backend.

---

### Minutos 2–4 — Login: sesión real

1. Clic en **Iniciar sesión** → `/login`
2. Ingresar `demo@edificios.local`
3. Observar:
   - Botón deshabilitado y spinner durante la autenticación
   - Toast de sesión iniciada
   - Redirección automática al Dashboard

**Qué demostrar:** autenticación por email + JWT (`POST /authentication/login` → `GET /authentication/me`). Sin pegar tokens manualmente.

**Frase sugerida:** *“La sesión persiste en el navegador y se restaura al recargar la página.”*

---

### Minutos 4–7 — Dashboard: vista operativa

1. Revisar **Dashboard Summary** — métricas agregadas del edificio
2. Abrir **Incidencias recientes** — listado con enlace al detalle
3. Mostrar **Activity Feed** — eventos cronológicos con enlaces a incidencias
4. Mencionar **Notifications** (pueden estar vacías si el actor no tiene notificaciones pendientes; comportamiento esperado)
5. Sidebar: Home, Dashboard, Incidencias, Logout
6. Header: nombre, email e indicador de sesión activa

**Qué demostrar:** panel operativo en tiempo real desde `GET /api/v1/operations/dashboard`.

**Frase sugerida:** *“Todo lo que ves proviene de la API; el frontend no calcula métricas de negocio.”*

---

### Minutos 7–10 — Incidencia y Timeline

1. Desde **Incidencias recientes** o el Activity Feed, abrir una incidencia
2. Observar breadcrumbs: `Dashboard > Incidencia`
3. Revisar **Información general** (ID, status, descripción, actor, fechas)
4. Usar **Ver timeline ↓** para saltar a la sección Timeline
5. Recorrer entradas cronológicas (eventos, evidencias, órdenes, notificaciones según datos existentes)
6. Clic en **Volver al Dashboard** (al pie del timeline)

**Qué demostrar:** circuito `Dashboard → Detalle → Timeline → Dashboard` sin perder contexto de navegación.

---

### Minutos 10–12 — Incidencias y navegación lateral

1. En el sidebar, ir a **Incidencias** (`/incidents`)
2. Mostrar el mismo listado (reutiliza caché del dashboard — sin nueva consulta si ya visitaste el dashboard)
3. Volver al Dashboard con el enlace de retorno
4. Ir a **Home** desde el sidebar
5. Con sesión activa, la Home muestra **Ir al Dashboard** (ya no “Iniciar sesión”)

**Qué demostrar:** navegación completa del producto; la app no son páginas aisladas.

---

### Minutos 12–14 — Cierre de sesión

1. Clic en **Logout** (sidebar)
2. Observar:
   - Toast “Sesión cerrada”
   - Redirección a Login
   - Token eliminado (no hace falta refrescar la página)
3. Intentar acceder a `/dashboard` sin sesión → redirección a Login

**Qué demostrar:** logout centralizado; limpieza de sesión y caché.

---

### Minuto 14–15 — Cierre y contexto

Frases de cierre sugeridas:

- *“`0.18.0-alpha` es un Release Candidate: demostrable de punta a punta, no producción.”*
- *“Las acciones de escritura (detectar, asignar, resolver) siguen en la API; la UI es de consulta y navegación.”*
- *“La deuda técnica conocida está documentada en `docs/architecture_backlog.md` — no está oculta.”*

Opcional: mencionar que Swagger sigue disponible en `/api/docs` para desarrolladores, pero **no es necesario** para usar el producto día a día una vez cargados los datos.

---

## Recorrido completo (referencia rápida)

```
Home
  ↓
Login (demo@edificios.local)
  ↓
Dashboard (métricas + incidencias + feed)
  ↓
Incidencia (detalle)
  ↓
Timeline
  ↓
Dashboard
  ↓
Incidencias (caché)
  ↓
Home (con sesión)
  ↓
Logout
```

---

## Qué NO mostrar en esta demo

| Tema | Motivo |
|------|--------|
| Swagger durante la presentación | La demo es interfaz web; Swagger es herramienta de bootstrap |
| Postman / curl | Mismo motivo |
| Crear incidencias desde la UI | Fuera de alcance en `0.18.0-alpha` (deuda documentada) |
| Roles y permisos | No implementados (ver backlog) |

---

## Problemas durante la demo

| Síntoma | Solución rápida |
|---------|-----------------|
| Home: “Backend no disponible” | Verificar `npm run start:dev` y variables `.env` |
| Login falla con 401 | Crear usuario `demo@edificios.local` vía Swagger (prep paso 3) |
| Dashboard vacío | Ejecutar cadena Site → Asset → Actor → Shift → Incident (prep paso 3) |
| “La sesión expiró” | Token inválido o usuario eliminado; volver a iniciar sesión |
| Health: database DOWN | `npm run db:up` |

Más detalle: [GUIA_USO.md](GUIA_USO.md) sección 10.

---

## Documentación relacionada

| Documento | Uso |
|-----------|-----|
| [README.md](../README.md) | Punto de entrada técnico del repositorio |
| [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) | Verificación antes de etiquetar o presentar |
| [GUIA_USO.md](GUIA_USO.md) | Guía operativa detallada (DB, API, troubleshooting) |
| [frontend/README.md](../frontend/README.md) | Cliente web y flujo de demo |
| [architecture_backlog.md](architecture_backlog.md) | Deuda técnica priorizada |

---

**Versión:** `0.18.0-alpha`  
**Última actualización:** 2026-07-15 (Sprint 19 — cierre)
