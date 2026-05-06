# Liftoff — Progreso

> Snapshot del estado del proyecto y plan de continuación.
> Si pierdes la sesión, leyendo `mission.md` + `CLAUDE.md` + `harness.md` + este archivo tienes todo el contexto necesario.

---

## Estado: `vertical-slice-v1`

Tag `vertical-slice-v1` en `main`. Pipa completa validada de extremo a extremo: DB Neon → API → Pusher realtime → UI → E2E multi-browser (chromium + firefox). 3 contextos Playwright simultáneos sincronizan vía Pusher en <2s. Aún sin etapas de juego.

### URLs

- **App en producción**: https://liftoff-app-dev.vercel.app/
- **Repo**: https://github.com/urielgaraje/liftoff-dev
- **Vercel project**: `liftoff-app-dev` (team `urielblanco-1278s-projects`)

---

## Lo que está hecho

### Slice anterior (`starter-rich-v1`)

Scaffold + servicios externos (Neon, Pusher, Vercel). Sin features.

### Este slice (`vertical-slice-v1`)

#### Schema (Drizzle)

```
rooms (id uuid, code varchar(4) unique, status enum lobby|racing|ended, created_at)
players (id uuid, room_id fk, nickname, rocket_skin, joined_at)
```

Migración `drizzle/0000_parallel_chronomancer.sql` aplicada a Neon.

#### API routes

- `POST /api/room` — host crea room (cierra cualquier room activa antes), set cookie `liftoff_host` HMAC-firmada.
- `GET /api/room/[code]` — snapshot (status + players ordenados por joined_at).
- `POST /api/room/[code]/join` — player insert + cookie `liftoff_player_<code>` + Pusher `player-joined`.
- `POST /api/room/[code]/leave` — player delete + Pusher `player-left` (usado para futuros tests/cleanups).

Validación con `zod`. Auth host = passphrase env + HMAC-SHA256 cookie (`HOST_COOKIE_SECRET`).

#### Pusher

- Canal único `room-<code>`.
- Eventos: `player-joined`, `player-left`, `room-updated` (este último con contrato listo, sin uso aún).
- Helper `broadcast(code, event, payload)` server-side.
- Hook `useRoomChannel(code)` cliente: snapshot inicial vía GET + merge incremental.

#### UI

- **Landing** (`src/app/(public)/page.tsx`) — Hero, dos formularios (Soy host / Soy jugador). Sin Dialog: ambos inline para minimizar piezas.
- **`/host`** (`src/app/host/page.tsx` + `host-client.tsx`) — Server component verifica cookie, redirect a `/` si falta. Render: code XXL Geist Mono, URL pill, botón "Copiar URL", lista players live, botón "Iniciar carrera" disabled.
- **`/play?code=XXXX`** (`src/app/play/page.tsx` + `play-client.tsx`) — State machine `pre-join` → `lobby`. Form nickname + 8 skins (lucide Rocket × tokens `rocket-*`). Lobby muestra flota live.
- **Mobile gate** — bloqueo CSS `<1024px` aplicado en `src/app/layout.tsx` (no UA sniff).
- Componentes nuevos: `Rocket` (game/) y `RoomBadge` (shared/).

#### Auth

- `src/lib/auth/host.ts` — sign/verify cookie HMAC, set/clear, `getHostRoomId()`, `checkHostPassphrase()` con `timingSafeEqual`.
- `src/lib/auth/player.ts` — cookie `liftoff_player_<code>` (no firmada, solo identifica al cliente).

#### Tests

- E2E `src/e2e/lobby.spec.ts`: 3 contextos (host + 2 players) — host crea, players entran en paralelo, todos se ven mutuamente. Pasa en chromium y firefox.
- Unit: 0 tests aún (decisión: la lógica de negocio de este slice es trivial, los tests E2E ya cubren la pipa).

#### Diseño

`design/liftoff.pen` actualizado: frame `vADag` (Landing) con joinForm añadido y copy QR removido; frame `dIApO` (Host Pre-game) con `qrCard` reemplazado por `codeDisplay` + `urlPill` + `copyBtn`. Diseño y código alineados.

---

## Decisiones cerradas en este slice

- **Layout `/play`**: state machine en una sola page (no rutas separadas) — evita reconnects de Pusher.
- **Canal Pusher**: único `room-<code>` con eventos filtrados por nombre.
- **Auth host**: passphrase env + cookie HMAC. Sin tabla de sesiones, sin bcrypt — mínimo viable.
- **Room code**: 4 chars uppercase, alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sin `0/O/1/I`).
- **QR del Host Pre-game**: eliminado (renegociación de mission §Vistas — desktop-only). Sustituido por code XXL + URL copyable.
- **Salas activas**: sólo una con status `lobby` o `racing` a la vez. Crear nueva → la anterior se marca `ended`.

---

## Lo que NO está hecho

- **Stages de juego**: cero. Falta typing race, anagrama, memoria.
- **Tablas `scores` y `events`**: no creadas. Schema actual sólo tiene rooms + players.
- **Animaciones**: cero canvas (stars background), cero motion trails. Estático puro.
- **Player End / Host Podium**: vistas no implementadas.
- **Word lists del typing race**: no decidido idioma/longitud/dificultad.
- **Anti-cheat thresholds**: pendiente de medir reales.
- **Auth host robusta**: bcrypt + tabla de sesiones — promotable cuando haga falta.

---

## Cómo continuar

### Próxima decisión: cuál de las 3 etapas atacar primero

Recomendación: **Stage 1 — Typing race**, porque (a) la mission lo lista primero, (b) es la más simple mecánicamente, (c) ya tenemos el copy literal del placeholder en el `.pen`.

Plan de tareas tentativo para `stage-1-typing-v1`:

- Schema: tabla `scores` (player_id, room_id, stage, value, created_at) + `events` (room_id, type, payload, created_at) si decidimos auditar.
- Server: state machine de partida (lobby → racing-stage-1 → … → ended). Probablemente endpoint `POST /api/room/[code]/start`.
- Pusher events: `stage-started`, `tick`, `stage-ended`.
- Word lists: decidir `es` short list para empezar; archivo JSON estático en `src/lib/game/words/`.
- UI Player Game stage 1 (typing): vista del `.pen`, captura `keydown`, validación letra a letra, anti-cheat trivial (chars/s máximo).
- UI Host Broadcast: 8 cohetes top + leaderboard 50.
- E2E: 3 players completan stage 1, podio coherente.

### Si arrancas en sesión nueva (cold start)

1. `mission.md` — qué construimos.
2. `CLAUDE.md` — cómo (stack, naming, anti-patterns).
3. `harness.md` — estado de la infra + gotchas.
4. **este archivo** — dónde nos quedamos.
5. `design/liftoff.pen` vía Pencil MCP — las vistas.
6. `git log --oneline -10` — historia reciente.

Verificaciones rápidas:

```bash
pnpm typecheck && pnpm build
pnpm test:e2e            # debería pasar en <30s, chromium + firefox
/usr/bin/curl -s -o /dev/null -w "%{http_code}\n" https://liftoff-app-dev.vercel.app/api/health
```

---

## Decisiones aún abiertas

- **Word lists del typing race**: idioma + 3 niveles de dificultad. Sin decidir.
- **Anti-cheat thresholds**: chars/s en typing, clicks/s en Simon. Sin decidir, depende de medición real.
- **Auth host robusta**: cuándo promover a bcrypt + tabla de sesiones. Por ahora sobra con env+HMAC.

---

## Pendientes cosméticos sin resolver

- Status check rojo de `Vercel` en commit `138d1d3` (artefacto histórico, GitHub no permite borrar status checks).
- Screenshots `s*-*.png` en raíz: regenerar tras la actualización del `.pen` si los seguimos usando en docs.
