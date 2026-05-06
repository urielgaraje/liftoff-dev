# Liftoff — Progreso

> Snapshot del estado del proyecto y plan de continuación.
> Si pierdes la sesión, leyendo `mission.md` + `CLAUDE.md` + `harness.md` + este archivo tienes todo el contexto necesario.

---

## Estado: `starter-rich-v1`

Tag `starter-rich-v1` en `main`. Build + deploy verde, todos los servicios externos validados, scaffold completo. **Cero código de producto aún** — solo infra.

### URLs

- **App en producción**: https://liftoff-app-dev.vercel.app/
- **Repo**: https://github.com/urielgaraje/liftoff-dev
- **Vercel project**: `liftoff-app-dev` (team `urielblanco-1278s-projects`)

### Cronología de commits

| Commit | Qué |
|---|---|
| `138d1d3` | initial mission, conventions and design (mission + CLAUDE + design + docs) |
| `3bdca7d` | docs: add harness setup playbook |
| `0236fad` | chore: scaffold starter-rich (← `starter-rich-v1` apunta aquí) |

---

## Lo que está hecho

### Infra externa (provisionada manualmente por el usuario)

- GitHub repo privado, push HTTPS vía `gh` credential helper.
- Neon Postgres (PG 17.8), DB `neondb`, pooled + unpooled URLs en `.env.local`.
- Pusher Channels app `2151265` cluster `eu`.
- Vercel project con framework Next.js correcto, Production Domain.
- `HOST_PASSPHRASE` generada con `openssl rand -hex 16`.

### MCPs activos en Claude Code

- Pencil — lee `design/liftoff.pen` (8 vistas).
- Playwright — automatización browser para E2E.
- Neon — OAuth completado, `mcp__neon__*` cargado.

Para añadir nuevos: `claude mcp add ...` (no editar `~/.claude/mcp.json`, ver `harness.md §G4`).

### Código del scaffold

```
src/app/(public)/page.tsx       Landing con tokens Liftoff
src/app/host/page.tsx           Placeholder
src/app/api/health/route.ts     JSON smoke endpoint (edge runtime)
src/app/layout.tsx              Inter + Geist Mono
src/app/globals.css             Paleta space neon + shadcn tokens mapeados
src/components/ui/              button, card, input, dialog, sonner
src/lib/db/{index,schema}.ts    Drizzle skeleton (schema vacío)
src/lib/realtime/{server,client}.ts  Pusher singletons (sin lógica)
src/lib/utils.ts                cn() helper
```

Configs raíz: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `playwright.config.ts`, `vitest.config.ts`, `vitest.setup.ts`, `drizzle.config.ts`, `components.json`.

### Scripts disponibles

```
pnpm dev          Next dev server (Turbopack)
pnpm build        Next build (verde)
pnpm typecheck    tsc --noEmit (verde)
pnpm test         Vitest (sin tests aún)
pnpm test:e2e     Playwright (sin tests aún)
pnpm db:generate  Drizzle: genera SQL desde schema
pnpm db:migrate   Drizzle: aplica migraciones
pnpm db:push      Drizzle: push directo (dev)
pnpm db:studio    Drizzle Studio
```

---

## Lo que NO está hecho

Cero feature de producto. En concreto:

- **DB**: schema vacío. Sin tablas `rooms`, `players`, `scores`, `events`.
- **API routes**: solo `/api/health`. Falta `/api/room` (crear/leer), `/api/join`, `/api/event`, etc.
- **Pusher channels**: cliente y servidor instanciados, pero ningún canal se usa aún.
- **UI**: solo landing placeholder + `/host` placeholder. Faltan las 8 vistas de `mission.md §Vistas`.
- **Game logic**: `src/lib/game/` está vacío. Sin scoring, sin validación, sin anti-cheat.
- **Tests**: cero tests E2E ni unit.
- **Animaciones**: cero canvas, cero Framer Motion en uso.

---

## Cómo continuar

### Próxima decisión: qué atacar primero

Tres opciones razonables:

1. **Vertical slice mínimo** — Landing + Player Join + Player Lobby + sync vía Pusher real. **Recomendado**.
   Valida la pipa completa (DB → API → realtime → UI → tests E2E) con la mínima complejidad de juego. Las 3 etapas se construyen mejor cuando el armazón ya está probado. Habilita el primer test multi-browser (lobby con 3 jugadores) que es la prueba de fuego del realtime sub-250ms.

2. **Schema + API primero** — Tablas Drizzle, todas las API routes, después UI.
   Más conservador. Riesgo: diseñar el schema sin haber tropezado con sync real.

3. **Una etapa de juego completa** — Typing race end-to-end.
   Más ambicioso, mucha señal por iteración. Riesgo: meter una mecánica compleja sin armazón probado.

### Si arrancamos con la opción 1

Plan de tareas (tentativo, refinable):

- **Schema mínimo**: `rooms` (id, code, status, host_passphrase_hash, created_at), `players` (id, room_id, nickname, rocket_skin, joined_at). Drizzle migrate + push a Neon.
- **API**: `POST /api/room` (host crea), `POST /api/room/:code/join` (jugador entra), `GET /api/room/:code` (estado).
- **Pusher channel**: un único `room-<id>` con eventos `player-joined`, `player-left`, `room-updated`. Decisión que estaba abierta en CLAUDE.md → cierro: canal único.
- **UI**:
  - Landing real con CTA "Crear partida" (passphrase) + mensaje QR.
  - `/host` con QR del room code + lista live de jugadores.
  - `/play` con form nickname + selector skin (8 colores de `rocket-*` tokens).
  - `/play/lobby` con tu cohete + lista de los demás.
- **Mobile block**: detector viewport <1024px en `(public)/layout.tsx` con CTA *"abre esto en un portátil"*.
- **Test E2E**: 3 contextos Playwright simultáneos completan el flow lobby. `pnpm test:e2e` debe pasar.

Cuando esto esté verde, tag `vertical-slice-v1` y pasamos a la primera etapa de juego.

### Si arrancas en sesión nueva (cold start)

Orden de lectura:
1. `mission.md` — qué construimos.
2. `CLAUDE.md` — cómo (stack, naming, anti-patterns).
3. `harness.md` — estado de la infra + gotchas.
4. **este archivo** — dónde nos quedamos.
5. `design/liftoff.pen` vía Pencil MCP — las vistas.
6. `git log --oneline -10` — historia reciente.

Verificaciones rápidas para confirmar que el setup sigue sano:

```bash
pnpm typecheck && pnpm build
gh api repos/urielgaraje/liftoff-dev/commits/main/status --jq '.statuses'
/usr/bin/curl -s -o /dev/null -w "%{http_code}\n" https://liftoff-app-dev.vercel.app/api/health
```

Si Neon MCP no aparece tras reinicio, intenta usar cualquier `mcp__neon__*` y completas OAuth otra vez (token persistido en `~/.claude.json`).

---

## Decisiones aún abiertas

De `CLAUDE.md §Decisiones pendientes`, sin resolver:

- **Layout del Player Game**: state machine en `/play` vs rutas separadas (`/play/typing`, etc.). Tentativamente: state machine.
- **Word lists del typing race**: idioma + 3 niveles de dificultad. Sin decidir.
- **Schema de canales Pusher**: en este plan cerramos en `room-<id>` único. Falta validar bajo 50 conexiones.
- **Anti-cheat thresholds**: chars/s en typing, clicks/s en Simon. Sin decidir, depende de medición real.

Cada una bloquea features concretas. Resolver cuando toque, no antes.

---

## Pendientes cosméticos sin resolver

- Status check rojo de `Vercel` en commit `138d1d3` (artefacto histórico, GitHub no permite borrar status checks).
- README.md aún tiene la sección "Estado: Pre-build" desactualizada.
