# Liftoff — Handoff

> **Si estás abriendo este repo en una sesión nueva, empieza aquí.** Este archivo apunta a todo lo demás. No duplica contenido — solo resume estado y siguientes pasos.

---

## TL;DR

Race multijugador de cohetes para una charla de agentic engineering (ver `mission.md` para el qué). Stack: Next.js 16 · Tailwind v4 · shadcn · Drizzle/Neon · Pusher · Playwright · Framer Motion. Deploy: Vercel + Neon + Pusher.

**Estado**: `stage-1-typing-v1` (último tag) + slice **`look-and-feel-v1`** (24 commits desde `7acda09` hasta `18ae8b8`). Polish visual completo previo a la charla:
- StarField global con paralaje + warp trails en host.
- Cohete con SVG custom + llama desde la cola + trail de partículas + intensidad por ranking.
- Player Lobby con cohete propio gigante y disco pulsante.
- Host PreGame rediseñado con planeta verde gigante animado (nubes, tormenta, halo).
- HostPodium con aterrizaje top 3 y pillars con medallas.
- Player End con top 3 + medallas + fila destacada.
- Typing scrollable de 3 líneas con karaoke-scroll.
- Microanimaciones (banner, lobby cards, logos, landing).
- Bug crítico fixeado: `selfPlayer` null tras join (cohete propio del lobby no renderizaba).
- `.pen` sincronizado: HostPodium reescrito en Pencil, share button del Player End borrado.

Pipa completa probada (DB → API → Pusher → UI → E2E multi-browser). Primera etapa de juego (typing race) funciona end-to-end y se reproduce en prod. Sigue faltando: 2 etapas más + endgame de juego (player progress real, no solo typing).

**Prod**: https://liftoff-app-dev.vercel.app/ · **Repo**: https://github.com/urielgaraje/liftoff-dev

---

## Orden de lectura (cold start)

1. **`mission.md`** — qué construimos y por qué. Inmutable salvo renegociación.
2. **`CLAUDE.md`** — convenciones técnicas, naming, anti-patterns, decisiones cerradas. Lee al final el bloque "Decisiones pendientes" para ver qué está abierto.
3. **`harness.md`** — cómo se montó la infra (Neon, Pusher, Vercel, MCPs) y gotchas.
4. **`progress.md`** — estado actual con todos los detalles (qué hay en DB, qué API existe, qué eventos Pusher, qué tests pasan, qué falta).
5. **`design/liftoff.pen`** — abrir con Pencil MCP. Quedan por implementar las vistas: Player Game stage 2 anagrama (`droMV`), stage 3 memoria (`aLVLp`), Host Broadcast versión final (`OCThd`), Player End (`Gib1D`), Host Podium (`KFLxV`).
6. **`docs/`** — research opcional.

---

## Verificación rápida del setup

```bash
pnpm install                                # si node_modules no está presente
pnpm typecheck && pnpm build                # debe ser verde
pnpm vitest run                             # 6 unit tests
pnpm test:e2e                               # 4 E2E chromium + firefox (~40s)
curl -s -o /dev/null -w "%{http_code}\n" \
  https://liftoff-app-dev.vercel.app/api/health    # 200
```

Si Neon MCP no aparece tras reinicio, llama a cualquier `mcp__neon__*` y completa OAuth. Token persiste en `~/.claude.json`.

---

## Para probar a mano

```bash
pnpm dev                                    # http://localhost:3000
```

- **Passphrase host** (de `.env.local`): `5ef25e58c39497f4ee3fa6bb5616c8db`.
- Crear partida en una pestaña normal (host) → otra pestaña incógnito → meter el code → nickname + skin → "Despegar".
- Repetir con otra incógnito.
- En el host clicar "Iniciar carrera". Players ven el typing race (30s reales).
- A los 30s: banner "Planeta alcanzado" en el host, leaderboard final + TOP 3 en los players.

---

## Próximo slice: `stage-2-anagram-v1`

Detallado en `progress.md §"Cómo continuar"`. Resumen:

- Crear `src/lib/game/stages/anagram/anagram.ts` (StageModule) + diccionario español.
- Endpoint para validación (`/api/room/[code]/anagram-submit` o reutilizar `/progress` con payload extendido — decidir al implementar).
- Componente `<AnagramStage>` cliente: 7 tiles clicables, palabra en formación, lista de palabras válidas.
- Registrar en `RENDERERS` (`src/components/game/stages/index.tsx`) y añadir a `STAGES[]` (`src/lib/game/stages/index.ts`).
- E2E corto.

La arquitectura ya está montada — añadir el stage no requiere tocar motor, API, schema ni `useRoomChannel`.

Slices siguientes: `stage-3-memoria-v1` y `endgame-v1` (Player End + Host Podium + share PNG + canvas stars + motion trails).

---

## Decisiones aún abiertas

Ver `CLAUDE.md §"Decisiones pendientes"` y `progress.md §"Decisiones aún abiertas"`. Las que afectan al próximo slice:

- Anti-cheat anagrama: cuántos clicks/s, cómo penalizar palabras inválidas (la mission dice -1 por inválido).
- Diccionario español: tamaño, fuente (lista hardcoded vs paquete npm).

---

## Limitaciones conocidas (no bloquean)

- F5 (refresh) en una pestaña de player la trata como cierre y elimina al jugador (consecuencia del fix de `pagehide` + `sendBeacon`). Hay que volver a hacer join. Si fuera necesario sobrevivir el refresh, ir a heartbeat + TTL server-side.
- Hydration warning de Grammarly (extensión navegador, ruido de consola, no funcional).
- **`HostBroadcast` (durante racing)** sigue con el layout original (grid `[1fr_360px]`). El `.pen` `OCThd` tiene un layout muy distinto pero no se sincronizó — pendiente para cuando se aborden stages 2/3.
- **Frame `dIApO` (Host PreGame) del `.pen`** desincronizado con el código (ya rediseñado en React). Actualizable con Pencil MCP cuando haya tiempo.
- `playwright.config.ts` usa `workers: 1` y `fullyParallel: false` porque los specs comparten el invariante "una sola sala activa".

---

## Sub-slices del look-and-feel-v1 (resumen rápido)

A — StarField global (3 capas paralaje + tints + warp trails en host).
B — Typing Stage scrollable de 3 líneas (karaoke-scroll).
C — Motion trails de partículas en cohetes del HostBroadcast.
D — HostPodium top 3 con aterrizaje + pillars.
E — Player End con medallas y fila propia destacada.
F — Microanimaciones (banner, lobby cards, logos, landing).
+ Cohete con SVG custom + llama, Player Lobby con cohete grande + disco pulsante, Host PreGame con planeta verde animado.

---

## Plan de la sesión anterior

`~/.claude/plans/vale-sabemos-como-continuar-tingly-llama.md` — plan look-and-feel-v1 con los 6 sub-slices A-F y notas finales.

Plan previo (arquitectura de stages): `~/.claude/plans/lo-de-auth-iria-wondrous-crayon.md`.
