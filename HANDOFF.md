# Liftoff — Handoff

> **Si estás abriendo este repo en una sesión nueva, empieza aquí.** Este archivo apunta a todo lo demás. No duplica contenido — solo resume estado y siguientes pasos.

---

## TL;DR

Race multijugador de cohetes para una charla de agentic engineering (ver `mission.md` para el qué). Stack: Next.js 16 · Tailwind v4 · shadcn · Drizzle/Neon · Pusher · Playwright. Deploy: Vercel + Neon + Pusher.

**Estado**: `stage-1-typing-v1` (último tag) + `7acda09` (cleanup de player fantasma con `pagehide` + `sendBeacon`, harness ampliado con gotchas Vercel CLI G7/G8/G9, deploy producción verde). Pipa completa probada (DB → API → Pusher → UI → E2E multi-browser). Primera etapa de juego (typing race) funciona end-to-end y se reproduce en prod. Falta: 2 etapas más + endgame + animaciones.

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
- Diseño pixel-perfect del `.pen` no está al 100% en código (gradients, glows, etc.). Se aborda en `endgame-v1` o slice de polish.
- `playwright.config.ts` usa `workers: 1` y `fullyParallel: false` porque los specs comparten el invariante "una sola sala activa".

---

## Plan de la sesión anterior

Si quieres ver el plan detallado del último slice ejecutado: `~/.claude/plans/lo-de-auth-iria-wondrous-crayon.md`. Contiene la decisión final de arquitectura acoplable de etapas y el roadmap de slices restantes.
