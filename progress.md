# Liftoff — Progreso

> Snapshot del estado del proyecto y plan de continuación.
> Si pierdes la sesión, leyendo `mission.md` + `CLAUDE.md` + `harness.md` + este archivo tienes todo el contexto necesario.

---

## Estado: `polish-podium-music-v1` (post-`scale-50p-v1`)

Sesión de pulido pre-demo enfocada en **carga sensorial (música) + flujo de partida (cerrar/reiniciar) + parametrización en runtime (duración stage + max jugadores)**. Sin tocar el motor del juego ni la arquitectura de stages.

### 1. Música ambiente + mute

- 4 pistas en `public/music/`: `lobby.mp3` (suena en todos los lobbies, host y player) + 3 pistas de stage random (`last_sector_run_2`, `lunar_base_jump_1`, `vector_decendent_3`). Cuando el `room.status` pasa a `racing` se elige una al azar; al cambiar `stage.stageIndex` se vuelve a sortear. En `ended` (podio) → silencio.
- Componente `src/components/shared/background-music.tsx`: un único `<audio loop>` controlado por refs + botón mute fijo `bottom-4 right-4` (`Volume2`/`VolumeX` de lucide). Mute persiste en `localStorage["liftoff:music:muted"]`.
- Autoplay-resilient: si `play()` rechaza por la política del navegador, registra listener one-shot `pointerdown`/`keydown` en `document` y reintenta. El primer click del host/jugador desbloquea audio.
- Volumen: 0.4 lobby / 0.35 stage. Cambiar mute no detiene la pista, solo silencia (`audio.muted`).
- Mount points (uno vivo por pestaña):
  - `host-router.tsx`: deriva `phase` de `room.status`, pasa `stageIndex`.
  - `play-client.tsx`: en pre-join `phase="lobby"` fijo; en `JoinedView` deriva igual que el host.

### 2. Botones del podio + flujo de cerrar/reiniciar

`HostBroadcast` cuando `room.status === "ended"` ahora dibuja una franja inferior con 2 CTAs:

- **Cerrar partida** (outline) → `window.location.assign("/")`. **No** toca la cookie. El host sigue autenticado para crear más partidas sin re-passphrase.
- **Reiniciar partida** (cyan glow) → `window.location.assign("/?restart=1")`. La home detecta el query param y abre el dialog "Crear partida" automáticamente.

Por qué hard-navigation y no `router.push`: `useRoomChannel` tiene un guard `maxStatus(prev, data)` (anti-race entre Pusher y polling) que impide bajar de `ended` a `lobby` en el cliente. Si reusas el árbol React tras crear una sala nueva, el cliente sigue creyendo que está `ended` y `HostBroadcast` no se desmonta. El reload limpio lo resuelve sin tocar el invariante.

`EndedView` del player gana un botón **Volver al inicio** (`router.push("/")` — aquí sí sirve porque el route cambia y la suscripción Pusher se recrea limpia).

### 3. Parametrización runtime: duración stage + max jugadores

Schema:

```sql
ALTER TABLE rooms ADD COLUMN stage_duration_ms int NOT NULL DEFAULT 30000;
ALTER TABLE rooms ADD COLUMN max_players int NOT NULL DEFAULT 50;
```

Migración: `drizzle/0002_odd_senator_kelly.sql`. La `STAGE_DURATION_OVERRIDE_MS` env var del módulo `typing.ts` queda obsoleta (sigue ahí pero ya nadie la lee — la duración se decide por sala, no por proceso).

Endpoints:

- **`GET /api/host/me`** (nuevo): `{ authenticated: boolean }`. La home lo llama on-mount para decidir si esconde el campo passphrase del dialog.
- **`POST /api/room`**: ahora acepta `{ passphrase?, stageDurationMs?, maxPlayers? }`. Auth = cookie host válida **o** passphrase correcta. Validación zod: `stageDurationMs ∈ [5000, 600000]`, `maxPlayers ∈ [1, 100]`. Defaults 30000 / 50.
- **`POST /api/room/[code]/join`**: cuenta `players` actuales y devuelve `409 room full` si llega al `room.maxPlayers`.
- **`POST /api/room/[code]/start`** y **`/end-stage`**: usan `room.stageDurationMs` (no `stage.durationMs` del módulo) tanto en el broadcast como en el check de `elapsed >= duration`.
- **`GET /api/room/[code]`**: snapshot incluye `maxPlayers` y `stageDurationMs`.

Cliente:

- `useRoomChannel` añade `maxPlayers` al state (default 50, override desde el snapshot).
- Todos los `/50` hardcodeados en `host-pregame.tsx`, `host-broadcast.tsx`, `play-client.tsx` lobby ahora leen `room.maxPlayers`.
- Dialog "Crear partida" en `(public)/page.tsx`: passphrase condicional (oculta si `hostAuthed`), grid 2-col con 2 number inputs (DURACIÓN seg, JUGADORES MÁX). Auto-abre si `?restart=1` en la URL.

### Lo que NO se cambió

- Motor de stages, anti-cheat, schema de `players`/`scores`, eventos Pusher.
- `useRoomChannel.maxStatus` (el invariante anti-race sigue intacto — la solución del restart fue navegación dura, no romper el guard).

---

## Estado: `scale-50p-v1` (post-`look-and-feel-v1`)

Plan ejecutado: `~/.claude/plans/me-gustaria-planificar-como-squishy-hopcroft.md`. Sesión enfocada en **validar y arreglar la promesa de 50 jugadores concurrentes** de `mission.md`. Tres commits:

- `d5fe6e1` perf(realtime+db): in-memory progress, Neon WS pool, split Pusher channel
- `1a8409a` test: harness load test 50 jugadores + helpers e2e compartidos
- `73622f5` refactor(typing): quitar pill de posición del jugador

**Resultado del stress test 50 jugadores (medido):**

| Métrica | Antes | Después |
|---|---|---|
| Error rate | 77.25% | **0.00%** |
| 5xx + network errors | 2129 | **0** |
| Progress p95 | 23.095ms | **~500ms** (46×) |
| Broadcast p95 | 18.174ms | **~600ms** (31×) |
| Mensajes Pusher / partida 50p | ~150.000 | **~3.000** (50×) |

### Lo que aporta `scale-50p-v1`

**1. Progress store en memoria** (`src/lib/game/progress-store.ts`).
`/api/room/[code]/progress` ya no escribe a DB en cada tick. El store es un `Map<{code,stageIndex}, Map<playerId, value>>` a nivel de proceso Next. Lee `prev` de memoria, valida (`validateProgress`, mismo anti-cheat), escribe `next` a memoria. La DB pasa de 100 writes/s a 50 writes por stage (uno por jugador al cerrar, en bulk INSERT desde `/end-stage`). GET snapshot también lee del store para rooms en racing.

Trade-off documentado: el store vive en el proceso. Si Liftoff escala a multi-instancia en Vercel, el map se migra a Upstash Redis (marketplace) — cambio aislado en `progress-store.ts`. Hoy no hace falta (1 instancia, 1 región durante el evento).

**2. Driver Neon HTTP → WebSocket Pool** (`src/lib/db/index.ts`).
`@neondatabase/serverless` `neon()` hace fetch HTTP por query — bajo carga sostenida se satura (NeonDbError: fetch failed en cascada, vimos el error en logs). Swap a `Pool` con WebSocket persistente vía `drizzle-orm/neon-serverless`. Connection reuse real, latencia de queries de ~50-200ms a ~5-15ms.

**3. Canal Pusher split** (`src/lib/realtime/server.ts`, `src/lib/realtime/use-room-channel.ts`).
Antes: un solo canal `room-{code}` al que TODOS suscribían y por el que pasaban TODOS los eventos. Cada `progress-updated` se entregaba × 50 suscriptores → 50× amplificación de coste Pusher. Ahora:

- `room-{code}` (control): `player-joined`, `player-left`, `room-updated`, `stage-started`, `stage-ended`. Todos suscriben.
- `room-{code}-progress`: solo el host opta in vía `useRoomChannel(code, { withProgress: true })` (en `host-router.tsx`). El jugador NO suscribe.

Consecuencia: el jugador ya no recibe `progress-updated` durante el stage. El pill "POSICIÓN #N de 50" se ha eliminado del typing-stage (`refactor 73622f5`) — no se actualizaba en vivo, solo cada 5s vía polling, y mentía más que ayudaba. El ranking final sigue apareciendo en el leaderboard al cierre del stage.

**4. Tick rate del cliente 500ms → 1000ms** (`typing-stage.tsx:10`).
Halves la huella Pusher sin pérdida visual perceptible (Framer Motion sigue interpolando los saltos de los cohetes en el host broadcast).

**5. Robustez: errores Pusher no propagan al cliente.**
`/progress` ahora envuelve `broadcastProgress` en try/catch. Si Pusher falla (rate limit, downtime, lo que sea), el estado ya quedó guardado en el store y el cliente recibe `200`. El polling de 5s recupera el estado eventualmente. Antes un fallo Pusher devolvía 500 y rompía la partida.

### Harness de load test (`src/load-test/`)

Script: `pnpm test:load`. Orquestador en Node que lanza:
- 1 host browser real (Playwright `chromium.launch()`, no usa el runner — sin `webServer` ni `test()`).
- N-1 browser players (configurable `BROWSER_COUNT`).
- M = `PLAYER_COUNT - (BROWSER_COUNT-1)` simuladores Node headless con `pusher-js` + cookie capture del `/join` + setInterval de progress cada 1s con curva 15 chars/s.
- 1 monitor único suscrito a `room-{code}-progress` que mide broadcast lag para todos los simuladores (vía `sentRegistry` compartido).

Configuración por env: `LOAD_BASE_URL`, `PLAYER_COUNT`, `BROWSER_COUNT`, `STAGE_DURATION_MS` (polling budget), `HEADLESS`, `JOIN_STAGGER_MS`.

Reporte tabular con thresholds (errores >1%, p95 progress >800ms, p95 broadcast >1s = FAIL). Útil pre-evento para validar que la infra aguanta.

Refactor menor incluido: extraídos `fresh`, `hostCreatesRoom`, `playerJoins`, `typeChars` desde los specs e2e a `src/e2e/helpers.ts` para que el harness los reuse sin duplicar. Los specs existentes los importan; comportamiento idéntico, solo subo timeouts del `toHaveURL`/`toBeVisible` para tolerar Turbopack first-compile en dev.

Caveats descubiertos durante validación:
- Pusher cuenta cada delivery × cada subscriber (no por publish). Una partida 50p con la arquitectura vieja eran 150k mensajes; con la nueva, 3k.
- El contador del dashboard de Pusher se resetea a las 00:00 UTC, NO al renovar/upgradear plan. Una renovación mid-day no borra el conteo del día.
- Corriendo el load test en local, los Playwright browsers headless saturan CPU si subes mucho `BROWSER_COUNT`. Para mediciones limpias del backend usar `BROWSER_COUNT=1` (solo host); en producción cada cliente está en su propia máquina, esa contención no existe.

### Lo que NO se cambió

- Schema (no hace falta — el store usa la tabla `scores` existente, solo cambia QUIÉN escribe y CUÁNDO).
- Game logic / anti-cheat (`validateProgress` igual, ahora con `prev` de memoria en vez de DB).
- API contract (mismas rutas, mismos shapes de request/response).
- Eventos Pusher (mismos nombres, mismo payload — solo el canal cambia para `progress-updated`).

---

### Lo que vino en `look-and-feel-v1` (slice anterior)

Plan ejecutado: `~/.claude/plans/vale-sabemos-como-continuar-tingly-llama.md`. Stage 1 (typing race) sigue siendo el único stage implementado; toda la sesión fue **polish visual, animaciones, fix del bug de selfPlayer y sincronización con el `.pen`** para llegar a la charla con la app pulida.

**Commit más reciente** (`18ae8b8`): planeta del Host PreGame definitivo — sin anillos Saturn, sin highlight especular, ancho 100vw asomando desde arriba (~10-12vw inferiores), bandas atmosféricas + nubes en motion + tormenta puntual pulsante. Conjunto de ~24 commits desde `7acda09` cubriendo:

- **Sub-slice A — StarField**: canvas con 200 estrellas en 3 capas de paralaje, tintes ocasionales (cyan/magenta/yellow), 20% bright con halo radial. En `/host*` velocidad base 6× con ramp gradual hasta 9× en 45s + warp trails (líneas con gradient transparent→alpha) en estrellas medias y cercanas. `prefers-reduced-motion` respetado. (`src/components/shared/star-field.tsx`)
- **Sub-slice B — Typing Stage scrollable**: ventana de 3 líneas con karaoke-scroll cuando el cursor entra en línea 2+. `lineHeight` fijo 64px, `useLayoutEffect` mide `cursorRef.offsetTop` y desliza el `<p>` con `motion.translateY` (0.45s easeOut). Mask top/bottom 12% para fade. Header con tabs "Despegue/Órbita/Aproximación" (despegue activo amarillo), "POSICIÓN #N de M" a la derecha. Footer con countdown grande con cambio de color (cyan>10s / magenta≤10s / red≤5s). Cursor magenta con parpadeo, shake suave en error, flash verde en palabra completada. (`src/components/game/stages/typing/typing-stage.tsx` + `typing-paragraph.tsx`)
- **Sub-slice C — Motion trails**: cohetes del HostBroadcast pasados a `motion.div` con spring + trail de partículas (3-12 chispas amarillas/naranjas/rojas con tamaños/jitter/duración pseudo-random estables por seed) que caen detrás. Cantidad e intensidad escalan con el ranking — el líder lleva más cola y llama más grande. (`src/components/game/rocket-trail.tsx`)
- **Sub-slice D — HostPodium**: top 3 con cohetes en posiciones 2/1/3 (1° centro más alto), pillars (oro/plata/bronce) que crecen desde 0 con stagger Framer, glow radial detrás del 1°. Render condicional — solo se dibujan los slots con player real (sin fantasmas cyan). (`src/components/game/host-podium.tsx`)
- **Sub-slice E — Player End**: top 3 con medallas (mismo lenguaje visual que el Host Podium); fila destacada (ring cyan + shadow) si soy yo en top 3, o línea aparte "TÚ #N · X m" si no. (`EndedView` en `play-client.tsx`)
- **Sub-slice F — Microanimaciones**: banner "Planeta alcanzado" del host con entrada spring + glow más fuerte; lobby cards con stagger entry + whileHover lift; pulso lento del logo `LIFTOFF` en todos los headers; entrada motion del título "Liftoff" en landing.

**Cohete + animaciones**:
- `Rocket` reescrito con SVG custom (sin la llama interna del icon de lucide). Llama externa de dos capas (outer naranja-amarilla + inner blanca-amarilla) anclada a la cola del cohete con `transformOrigin: top center`. Prop `intensity` (0..1) escala flame width/height. Pulso suave del cohete entero (y -1.5px + scale 1.03). (`src/components/game/rocket.tsx`)

**Player Lobby** (`LobbyView` en `play-client.tsx`):
- Cohete propio centrado size 120 con `animate=true`, encerrado en un disco con radial gradient del color del skin + anillo fino exterior pulsante (escala leve + opacity). Nickname text-4xl con text-shadow del skin. "PREPARANDO DESPEGUE" con dot cyan pulsante.
- Bottom: fila horizontal de cohetes mini (size 28, animate, glow del skin) de los OTROS jugadores. Hasta 8 visibles + chip "+N más".

**Host PreGame** (`HostPreGame` reescrito):
- Layout vertical centrado (no más 2 columnas).
- Planeta gigante de fondo (verde, asoma desde arriba como una "U") en componente `<PlanetBackdrop/>` con animaciones internas — 5 capas: base esfera con radial gradient sólido, bandas atmosféricas finas (overlay), bandas anchas (multiply), nubes/manchas en motion.div trasladándose 90s linear (simula rotación), tormenta puntual pulsante 8s, polos oscuros, terminator y halo atmosférico exterior pulsante.
- Código de sala XL (88px) con text-shadow cyan, URL pill compacta con botón COPIAR en línea, fila de cohetes en pista, botón "Iniciar carrera" pill grande con glow.

**Sync con `.pen` (Pencil MCP)**:
- Frame `KFLxV` (Host Podium) actualizado para reflejar la implementación React: layout 2/1/3 con cohetes + pillars + medallas (era una vista personal con un solo cohete grande).
- Frame `Gib1D` (Player End): borrado el botón "Compartir resultado" (`S1cgf`) — no implementado en código, alto riesgo en demo.

**Bug fix crítico** (`a3fcf29`): `selfPlayer` quedaba `null` tras un join nuevo porque `playerId` se calculaba server-side ANTES del POST `/join`. Fix: capturar `playerId` de la respuesta del join y guardarlo en `localPlayerId` state. JoinedView ahora usa el local. Sin esto el cohete grande del lobby no renderizaba.

**Commit anterior al slice** (`7acda09`): fix del player fantasma al cerrar pestaña + harness ampliado con G7/G8/G9 sobre Vercel CLI + deploy producción verde.

### URLs

- **App en producción**: https://liftoff-app-dev.vercel.app/
- **Repo**: https://github.com/urielgaraje/liftoff-dev
- **Vercel project**: `liftoff-app-dev` (team `urielblanco-1278s-projects`)

---

## Slices anteriores

- `starter-rich-v1` → scaffold + servicios externos.
- `vertical-slice-v1` → Landing + Player Join + Lobby + sync Pusher (DB → API → realtime → UI → E2E).
- `stage-1-typing-v1` → typing race con StageModule + scores + anti-cheat + E2E.
- `look-and-feel-v1` → polish visual completo previo a la charla (StarField, motion trails, podium, planeta del PreGame, microanimaciones, fix `selfPlayer`).

---

## Lo que aporta `stage-1-typing-v1`

### Arquitectura acoplable de etapas

Cada etapa es un `StageModule` (`src/lib/game/stages/types.ts`):

```ts
interface StageModule<Init = unknown> {
  id: string;
  durationMs: number;
  scoreMultiplier: number;
  buildInit(): Init;
  validateProgress({ prev, next, elapsedMs }): boolean;
}
```

Las etapas se registran en `STAGES[]` (`src/lib/game/stages/index.ts`). Añadir una nueva etapa = `import` del módulo + `push` al array. Cero cambios en motor, API, UI engine, schema. El componente cliente que pinta la etapa se registra en `RENDERERS` (`src/components/game/stages/index.tsx`); si no hay renderer, fallback a `<UnknownStage>`.

Por ahora el array contiene solo `typingStage` (`src/lib/game/stages/typing/typing.ts`).

### Schema (cambios)

```sql
ALTER TABLE rooms ADD COLUMN current_stage_index int NOT NULL DEFAULT -1;
ALTER TABLE rooms ADD COLUMN stage_started_at timestamptz NULL;
ALTER TABLE rooms ADD COLUMN stage_init jsonb NULL;

CREATE TABLE scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  stage_index int NOT NULL,
  value int NOT NULL DEFAULT 0,
  completed_at timestamptz NULL,
  UNIQUE (player_id, stage_index)
);
```

Migración: `drizzle/0001_talented_randall_flagg.sql`.

### API routes (nuevas)

- `POST /api/room/[code]/start` — host crea partida (cookie host validada). Set `currentStageIndex=0`, `stageStartedAt=now()`, `stageInit=stages[0].buildInit()`. Broadcast `stage-started`.
- `POST /api/room/[code]/progress` — player (cookie player). Valida monotónico + 25 chars/s techo + ≤ longitud paragraph. Upsert con `GREATEST(existing, next)`. Broadcast `progress-updated`.
- `POST /api/room/[code]/end-stage` — idempotente. 409 si stage no expirado o índice mismatch. Si OK: marca `completedAt`, avanza al siguiente stage o pasa la sala a `ended`. Broadcast `stage-ended` (+ `stage-started` del siguiente si lo hay).

`GET /api/room/[code]` ampliado para devolver también `stage` y `progress` cuando la sala está en racing.

### Pusher (nuevos eventos)

- `stage-started` `{ stageIndex, stageId, durationMs, init, startedAt }`
- `progress-updated` `{ playerId, stageIndex, value }`
- `stage-ended` `{ stageIndex, leaderboard, nextStageIndex }`

### UI

- **Landing** y **Player Join**: sin cambios.
- **Player `/play`** (state machine ampliada en `play-client.tsx`): `pre-join → joined`. `joined` decide entre `LobbyView | StageRenderer | EndedView` según `room.status`/`room.stage`.
  - `TypingStage` (`src/components/game/stages/typing/typing-stage.tsx`): keydown global, validación char-a-char, errores no atravesables, throttle progress 500ms, timer cliente, POST `/end-stage` al hit 0.
  - `TypingParagraph`: pinta el párrafo con cursor magenta y flash rojo en error.
- **Host `/host`**: ahora vía `HostRouter` que decide entre `HostPreGame` y `HostBroadcast` según `room.status`. **El hook `useRoomChannel` se llama UNA sola vez en `HostRouter` y se prop-drillea** — si lo llamaba cada componente, el `pusher.unsubscribe` del que se desmontaba mataba la suscripción del otro.
  - `HostBroadcast`: top-8 cohetes con altura proporcional al líder (CSS transform), leaderboard lateral 50, timer countdown, banner "PLANETA ALCANZADO" 1.5s al `stage-ended`, footer "carrera completada" al final.

### Tests

- **Unit** `src/lib/game/stages/typing/typing.test.ts`: 6 tests de `validateProgress` y `buildInit`.
- **E2E** `src/e2e/stage1.spec.ts`: 3 contextos (host + alice + bob). Host inicia, ambos teclean (alice 30 chars, bob 10), leaderboard ordenado correcto, sala pasa a `ended`, vista `play-ended` visible para ambos players.
- E2E lobby (`lobby.spec.ts`) sigue pasando.
- `playwright.config.ts`: `workers: 1` y `fullyParallel: false` porque ambos specs comparten el invariante "una sola sala activa" del backend; sin esto compitan por la misma sala.
- `webServer.env.STAGE_DURATION_OVERRIDE_MS = "3000"` para que la stage dure 3s en tests (vs 30s en dev).

---

## Decisiones cerradas en este slice

- **Stages timer-driven** con duración por módulo. Planeta = flair visual al cerrar timer (no objetivo binario de score).
- **Cierre de etapa** = cliente-driven idempotente vía `POST /end-stage`. 409 si pronto o mismatch.
- **Persistencia de progreso** = upsert por throttle a `scores` con `GREATEST(existing, next)`.
- **Anti-cheat typing** = `validateProgress`: monotónico, techo 25 chars/s, `≤ paragraph.length`.
- **Hook realtime único por árbol** = lift `useRoomChannel` al ancestro común, prop-drill de `room`.
- **Word list typing** = 5 párrafos en español ≥200 palabras (`words.ts`). Sin niveles ni inglés.
- **Cleanup de jugador fantasma** = `pagehide` + `navigator.sendBeacon` → `/leave` en `JoinedView` (`src/app/play/play-client.tsx`). Trade-off aceptado: F5 también remueve al player; refresh = re-join. Si en el futuro queremos sobrevivir el F5, ir a heartbeat + TTL server-side.

---

## Decisiones cerradas en `look-and-feel-v1`

- **`selfPlayer` resuelto en cliente** vía `localPlayerId` capturado de la respuesta del POST `/join`. `playerId` server-side (de `page.tsx`) ya no es la única fuente de verdad — el cliente actualiza su state tras un join nuevo. Sin esto el cohete propio del lobby no renderizaba en pestañas frescas.
- **StarField velocidad**: `usePathname` detecta `/host*` y aplica base 6× con ramp lineal hasta 9× en 45s. Reset al cambiar de ruta. Player y landing siguen a 1× para lectura cómoda.
- **Warp trails**: solo se dibujan cuando `speed > 2` y solo en estrellas de capas 1 y 2 (medias y cercanas). Línea con gradient transparent→alpha hacia el bottom, longitud proporcional a `vy * speed * 22`.
- **Typing scrollable**: `lineHeight` fijo en 64px (no responsive). El cálculo de `currentLine` hace `Math.round(offsetTop / 64)`. Texto en sans-serif text-4xl/40px (no monospace) para legibilidad cinematográfica. Mask gradient top/bottom 12% para fade in/out de las líneas.
- **Trail de partículas**: viven dentro del `motion.div` del cohete (siguen al cohete cuando sube), no son un trail físicamente realista en el suelo. Cantidad = `3 + ratio*9` chispas. Seed estable por `playerId.charCodeAt() + index` para que las posiciones no cambien en re-renders.
- **HostPodium render condicional**: con menos de 3 jugadores no se dibujan los slots vacíos (antes había placeholders cyan fantasmagóricos). Solo aparecen las columnas con player real.
- **Planeta del Host PreGame**: 100vw × 100vw, top -88vw, asomando desde arriba (forma de U). Color verde-mar (no azul). Sin anillos Saturno (probados en varios commits intermedios pero no convencieron). Tres animaciones internas: capa de nubes/manchas trasladándose 90s, tormenta puntual pulsante 8s, halo atmosférico exterior pulsante 6s.
- **Cohete `Rocket`** rotado SIEMPRE (icon de lucide es diagonal, lo apuntamos vertical). Llama vertical anclada a la cola con `transformOrigin: top center`. Sin llama interna del icon original (eliminada al rehacerlo como SVG custom).

---

## Decisiones cerradas en `scale-50p-v1`

- **Progress write path**: `/progress` no escribe a DB, solo a memoria del proceso (`progress-store.ts`). DB solo se toca en `/end-stage` con un bulk INSERT al cerrar. Trade-off aceptado: el store es per-proceso; promote a Upstash Redis si pasamos a multi-instancia. Para 1 instancia / 1 región durante un evento, suficiente.
- **DB driver**: `Pool` (WebSocket) sobre `drizzle-orm/neon-serverless`. Connection reuse persistente. El driver HTTP `neon()` se descartó tras ver `NeonDbError: fetch failed` en cascada bajo 100 req/s.
- **Pusher channel split**: control en `room-{code}` (todos), progress en `room-{code}-progress` (solo host). Reduce mensajes Pusher por partida 50×. El jugador pierde el rank en vivo durante el typing — aceptado, ya no era fiable post-polling.
- **Tick rate cliente**: 1000ms (antes 500ms). Mitiga la huella Pusher otra mitad sin pérdida visual.
- **Errores Pusher en `/progress` no bubble al cliente**: el estado ya quedó en el store, devolvemos `200`. El polling de 5s recupera. Resiliente a baches de Pusher / quota exceeded.
- **Threshold del load test**: errores >1%, p95 progress >800ms, p95 broadcast >1s = FAIL. Defendibles para 50p en una máquina de evento (1 server Vercel + 50 clientes en su LAN).

---

## Cómo continuar

### Próximo slice: `stage-2-anagram-v1`

El esfuerzo estimado es bajo: la arquitectura está montada. Pasos previstos:

1. `src/lib/game/stages/anagram/anagram.ts` con `StageModule`. `buildInit()` devuelve `{ letters: string[] }` (7 letras seleccionadas para que tengan al menos N palabras válidas). `validateProgress`: rate-limit razonable de envíos (palabras/s).
2. Diccionario español de palabras válidas (set de strings) en `src/lib/game/stages/anagram/dictionary.ts` o similar.
3. Endpoint POST `/api/room/[code]/anagram-submit` (o reutilizar `progress` con un payload extendido — decidir al implementar).
4. `<AnagramStage>` cliente: 7 tiles clicables, palabra en formación, lista de palabras válidas, ⏎ valida, ⌫ borra.
5. Registrar en `RENDERERS` y añadir `anagramStage` a `STAGES[]`.
6. E2E corto: `stage2.spec.ts`.

Stage 3 (memoria) y endgame (`Player End` + `Host Podium` + share PNG + animaciones) son los slices que cierran la mission.

### Si arrancas en sesión nueva (cold start)

1. `mission.md` — qué construimos.
2. `CLAUDE.md` — convenciones + decisiones cerradas (al final).
3. `harness.md` — infra + gotchas.
4. **este archivo** — dónde estamos.
5. `design/liftoff.pen` vía Pencil MCP — vistas pendientes (anagrama, memoria, end, podio).
6. `git log --oneline -10` — historia.

Verificaciones rápidas:

```bash
pnpm typecheck && pnpm build
pnpm vitest run
pnpm test:e2e
curl -s -o /dev/null -w "%{http_code}\n" https://liftoff-app-dev.vercel.app/api/health

# Stress test 50 jugadores (requiere prod build local en otro terminal):
#   pnpm build && pnpm start
PLAYER_COUNT=50 BROWSER_COUNT=1 pnpm test:load
```

---

## Decisiones aún abiertas

- **Anti-cheat anagrama / memoria**: thresholds dependen de medir reales.
- **Word lists multilingües y por dificultad**: `en` + niveles short/medium/long.
- **Bonus top-3 por etapa** al score total final (mission `score_total = ... + bonus_top3_por_etapa`).
- **Auth host robusta**: cuándo promover a bcrypt + tabla de sesiones.

---

## Pendientes cosméticos / deuda técnica

- Status check rojo de `Vercel` en commit `138d1d3` (artefacto histórico).
- Hydration warning de Grammarly (extensión navegador, ruido de consola, no funcional).
- **`HostBroadcast` durante racing** sigue con su layout original (grid `[1fr_360px]` con 8 cohetes en grid + leaderboard lateral). El `.pen` `OCThd` tiene un layout muy distinto (planeta arriba, cohetes flotando libres, leaderboard derecho más detallado). Sin sincronizar — decisión: mantenemos el actual hasta `stage-2` o `stage-3` (la "pantalla estrella" según mission). Si se quiere acercar al `.pen`, requiere refactor del layout.
- **Frame `dIApO` (Host PreGame) del `.pen`** sigue con el layout viejo de 2 columnas (AB12 + lista jugadores + botón). El código React usa el layout vertical centrado con planeta gigante. Desincronizados — actualizar el `.pen` cuando haya tiempo (operación Pencil MCP rápida, similar a la del `KFLxV`).
- **`docs/talk/` y `slides/`** evolucionan en paralelo (commits del usuario en la misma sesión: `c17d87b`, `99e57f1`, `5a51ec6`, `075d772`, `999a117`). Son del proyecto Slidev de la charla, no del producto Liftoff.
