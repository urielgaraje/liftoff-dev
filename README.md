# Liftoff

Race multijugador de cohetes hacia un planeta. Hasta 50 jugadores compiten en directo a través de 3 etapas (typing, anagrama, memoria) durante una charla en directo. Construido como banco de pruebas de **agentic engineering** (multi-agente con harness vs single-agent con compactación).

## Cómo arrancar (orden de lectura)

1. **`mission.md`** — qué es el producto y por qué existe (inmutable).
2. **`CLAUDE.md`** — convenciones técnicas, stack, naming, anti-patterns.
3. **`design/liftoff.pen`** — diseño visual de las 10 vistas (abrir con Pencil).
4. **`docs/`** — research, charla, historial. Lectura opcional, contexto humano.

## Estructura

```
liftoff/
├── README.md               (este archivo)
├── mission.md              ⭐ qué construimos y por qué
├── CLAUDE.md               🔧 cómo lo construimos
├── design/
│   └── liftoff.pen         🎨 10 vistas en Pencil
└── docs/
    ├── README.md           índice de la carpeta
    ├── talk/               materiales de la charla (4 capas)
    ├── garaje-research/    workflow original que detonó la idea
    └── experiments/        pruebas técnicas durante el discovery
```

## Estado

Pre-build. El siguiente paso es:
1. Generar `tasks.jsonl` desde mission con un agente `spec-author`.
2. Definir agentes (`backend-dev`, `frontend-dev`, `test-author`, etc.) en `.claude/agents/`.
3. Primera pasada single-agent (baseline para A/B).
4. Segunda pasada multi-agente con harness (la apuesta).

## Stack

Next.js 15 · Tailwind · shadcn/ui · Framer Motion · Pusher · Neon Postgres · Drizzle · Playwright. Deploy: Vercel + Neon + Pusher.

## Idea base

> *"5, 4, 3, 2, 1, **liftoff!**"* — la palabra exacta del momento de despegue de un cohete.
