# Liftoff

Race multijugador de cohetes hacia un planeta. Hasta 50 jugadores compiten en directo a través de 3 etapas (typing, anagrama, memoria) durante una charla en directo. Construido como banco de pruebas de **agentic engineering** (multi-agente con harness vs single-agent con compactación).

## Cómo arrancar (orden de lectura)

1. **`mission.md`** — qué es el producto y por qué existe (inmutable).
2. **`CLAUDE.md`** — convenciones técnicas, stack, naming, anti-patterns.
3. **`harness.md`** — cómo está montado el setup externo (servicios, MCPs, gotchas).
4. **`progress.md`** — estado actual del build y plan de continuación.
5. **`design/liftoff.pen`** — diseño visual de las 8 vistas (abrir con Pencil).
6. **`docs/`** — research, charla, historial. Lectura opcional.

## Estructura

```
liftoff/
├── README.md               (este archivo)
├── mission.md              ⭐ qué construimos y por qué (inmutable)
├── CLAUDE.md               🔧 cómo lo construimos
├── harness.md              🛠️ setup externo + gotchas
├── progress.md             📍 estado actual y siguiente paso
├── src/                    código de la app
├── design/
│   └── liftoff.pen         🎨 8 vistas en Pencil
└── docs/                   research, charla, experimentos
```

## Estado

`vertical-slice-v1`. Pipa completa probada de extremo a extremo (DB Neon → API → Pusher realtime → UI → E2E multi-browser). Landing real + Host Pre-game + Player Join + Player Lobby con sync en vivo. Sin etapas de juego aún. Ver `progress.md` para detalle.

App: https://liftoff-app-dev.vercel.app/

## Stack

Next.js 16 · Tailwind v4 · shadcn/ui · Framer Motion · Pusher · Neon Postgres · Drizzle · Playwright · Vitest. Deploy: Vercel + Neon + Pusher.

## Idea base

> *"5, 4, 3, 2, 1, **liftoff!**"* — la palabra exacta del momento de despegue de un cohete.
