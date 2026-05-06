# Liftoff — Progreso

> Snapshot del estado del proyecto y plan de continuación.
> Si pierdes la sesión, leyendo `mission.md` + `CLAUDE.md` + `harness.md` + este archivo tienes todo el contexto necesario.

---

## Estado: `stage-1-typing-v1`

Tag `stage-1-typing-v1` en `main`. Arquitectura acoplable de etapas + primera etapa (typing race) end-to-end. 6 unit tests + 4 E2E (chromium + firefox) verdes en ~50s.

### URLs

- **App en producción**: https://liftoff-app-dev.vercel.app/
- **Repo**: https://github.com/urielgaraje/liftoff-dev
- **Vercel project**: `liftoff-app-dev` (team `urielblanco-1278s-projects`)

---

## Slices anteriores

- `starter-rich-v1` → scaffold + servicios externos.
- `vertical-slice-v1` → Landing + Player Join + Lobby + sync Pusher (DB → API → realtime → UI → E2E).

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
- Cerrar pestaña del player no llama `/leave` automáticamente — fantasma en lobby. Fix futuro: `beforeunload` con `navigator.sendBeacon` al endpoint `/leave`.
- Hydration warning de Grammarly (extensión navegador, ruido de consola, no funcional).
- Diseño pixel-perfect: el `.pen` tiene afinaciones que aún no están en código (gradients, glow del top de podio, etc.). No bloquea, lo abordamos en `endgame-v1` o un slice de polish.
- Animaciones: ni canvas stars ni motion trails Framer todavía. Para `endgame-v1`.
