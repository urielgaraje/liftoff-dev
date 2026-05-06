# Liftoff — Convenciones técnicas

> Documento que acompaña a `mission.md`. Mission contiene el **qué** del producto; este archivo contiene el **cómo** técnico.
>
> Cualquier agente que toque código debe leer **primero `mission.md`, después este archivo** antes de hacer nada.

---

## Stack

- **Frontend**: Next.js 15 (App Router) · React 19 · TypeScript estricto.
- **Estilos**: Tailwind CSS · shadcn/ui · Framer Motion (animaciones).
- **Realtime**: Pusher Channels (websockets gestionados, soporta 50+ jugadores).
- **DB**: Neon Postgres + Drizzle ORM.
- **Tests**: Playwright (E2E multi-browser) · Vitest (unit).
- **Deploy**: Vercel + Neon + Pusher.
- **Idioma del producto**: español. Inglés como fallback en UI bilingüe.

## Tokens de diseño (Liftoff space neon)

Definidos en `tailwind.config.ts`:

```ts
colors: {
  bg: {
    primary: '#08081E',     // navy profundo (canvas)
    secondary: '#13132E',   // tiles, cards
    tertiary: '#1F1F45',    // hover/active surfaces
  },
  fg: {
    primary: '#FFFFFF',
    secondary: '#9CA3D9',   // lavender muted
    muted: '#5C6087',
  },
  accent: {
    cyan: '#22D3EE',        // primary CTA, active state
    magenta: '#EC4899',     // alerts, cursor, errors
    yellow: '#FACC15',      // highlights, achievements
    green: '#34D399',       // success
  },
  rocket: {
    cyan: '#22D3EE',
    magenta: '#EC4899',
    yellow: '#FACC15',
    orange: '#FB923C',
    green: '#34D399',
    purple: '#A78BFA',
    red: '#F87171',
    blue: '#60A5FA',
  },
}
```

Tipografía:
- **Inter** — body, headlines.
- **Geist Mono** — data, scores, countdowns, paragraph del typing race.

Roundness:
- `lg: 8` · `xl: 12` · `2xl: 16` · `full: 9999`

---

## Reglas de código

- **TypeScript estricto.** Cero `any` salvo justificado en comentario.
- **Server Components por defecto.** Client Components solo cuando hay interactividad o hooks.
- **Tailwind con tokens**. No hardcodear hex colors fuera del config.
- **shadcn/ui**: añadir vía CLI (`npx shadcn@latest add <component>`). No copiar código manualmente.
- **Imports** ordenados: 1) external, 2) internal alias `@/`, 3) relativo.
- **No hay un componente / archivo**: si un archivo tiene una función principal, el archivo se llama igual que la función (kebab-case).
- **No comments salvo necesarios**: código autoexplicativo. Comments solo para invariantes no obvios.

---

## Estructura de carpetas

```
src/
├── app/                        # Routes (Next App Router)
│   ├── (public)/               # Landing + Player flow (/, /play)
│   ├── host/                   # Host flow (passphrase-protected)
│   └── api/                    # API routes / webhooks
├── components/
│   ├── ui/                     # shadcn primitives
│   ├── game/                   # Rocket, Leaderboard, StageBadge, StarField
│   └── shared/                 # Logo, RoomBadge, etc.
├── lib/
│   ├── db/                     # Drizzle schema + queries
│   ├── realtime/               # Pusher client + server
│   ├── game/                   # Game logic (scoring, validation, anti-cheat)
│   └── utils.ts                # Generic helpers
└── e2e/                        # Playwright tests

design/
└── liftoff.pen                 # Diseño Pencil (no editar a mano)

docs/
├── talk/                       # Charla agentic engineering (4 capas)
├── garaje-research/            # Workflow original Garaje (referencia)
└── experiments/                # Pruebas técnicas (team filesystem, etc.)
```

---

## Naming

- **Archivos**: `kebab-case.tsx`
- **Componentes React**: `PascalCase`
- **Hooks**: `useCamelCase`
- **Tablas DB**: `snake_case`
- **CSS / Tailwind tokens**: `kebab-case`
- **Routes**: minúsculas, hyphen-separated cuando aplique

---

## Animación

- **Stars background**: `<canvas>` + `requestAnimationFrame`. **No DOM por estrella** (rendimiento con 50 jugadores activos).
- **Pulse rings, cursor blink, dot animations**: Framer Motion `animate` props o CSS keyframes.
- **Cohete trails** (Host Broadcast): Framer Motion `motion.path` con interpolación entre updates de Pusher.
- **Transiciones entre stages**: Framer Motion `AnimatePresence`.

---

## Tests

- **E2E mínimo**: lobby con 3+ jugadores, una etapa de cada tipo, transiciones entre stages, fin de partida con podio.
- **Multi-browser**: tests usan al menos 2 contextos de Playwright simultáneos para validar sync entre clientes.
- **Unit**: scoring + game logic ≥ 80% cobertura.
- **Smoke** en CI: cada PR corre el E2E principal.

---

## Anti-patterns prohibidos

- ❌ **WebSockets nativos sin pub/sub gestionado** (no escala a 50, ver mission #3).
- ❌ **Polling de DB en bucle** desde el cliente. Usar Pusher.
- ❌ **Game state en Zustand/Redux sin sync con server** (race conditions).
- ❌ **Hardcodear colores**, usar tokens del config.
- ❌ **UI mobile para player** (rechazada por mission, mín 1024px).
- ❌ **AI / LLM en runtime del juego** (ver mission principio #9).
- ❌ **Zindex inflations**: si necesitas z-index >50, replantea el layout.
- ❌ **Cambios al `mission.md`** sin renegociación explícita.

---

## Hooks de Claude Code

*(A definir cuando montemos el harness — pre-commit, post-edit, etc.)*

---

## Decisiones pendientes

Estas son cosas que aún no están decididas y que requieren elección antes o durante el primer build:

- **Layout strategy** del player game: ¿una sola page con state machine, o tres pages separadas (`/play/typing`, `/play/anagram`, `/play/memoria`)? Tentativamente: state machine en una sola page para evitar reconnects.
- **Word lists** del typing race: idioma, longitud, dificultad. Probablemente `en` y `es` con 3 niveles (corto / medio / largo).
- **Schema de Pusher channels**: `room-<id>`, `player-<id>`, `host-<id>` o un único `room-<id>` con subscriptions filtradas.
- **Anti-cheat exact thresholds**: cuántos chars/s bloquean en el typing race; cuántos clicks/s en Simon.
