# Liftoff — docs/

Esta carpeta contiene **investigación, materiales para la charla, e historial** del proyecto. Nada aquí es código de producción; es contexto que cualquier humano o agente puede leer para entender de dónde sale Liftoff.

> Para empezar a trabajar en Liftoff, lee primero `../mission.md` y luego `../CLAUDE.md`.

---

## Estructura

### `talk/` — La charla sobre agentic engineering
Materiales conceptuales sobre el tema de la charla en la que Liftoff se construirá en directo.

- **`layers.md`** — Las **4 capas** que estructuran la charla: prompt engineering, context engineering, harness engineering, agentic engineering. Incluye:
  - Cronología y atribuciones (Karpathy / Tobi Lütke / etc.).
  - Analogías (cocinero, médico, GPS).
  - Speech completo de ~9 minutos.
  - Estructura de slides (10 slides con visuales).
  - Notas de orador, objeciones a anticipar, plan B.

### `garaje-research/` — Workflow original que originó el proyecto
Capturas del flujo actual de Garaje (Team Owner / People Business Partner) en Google Sheets. Sirvió como detonador de la idea inicial (TeamPulse) que después pivotó a Liftoff.

- 3 capturas (TO Sheet, Business panel, ejemplo de notas).
- **No es la dirección actual del producto** — Liftoff es un juego, no una herramienta de RRHH. Pero se mantiene como referencia del *insight* original.

### `experiments/` — Pruebas técnicas hechas durante el descubrimiento
Pruebas del modelo de orquestación de Claude Code, capturadas como artefactos:

- **`team-snapshots/`** — Inspección del filesystem que usa Claude Code para Teams + TaskList. Contiene 4 snapshots cronológicos (`01-team-created/` → `04-tasks-completed/`) y un `README.md` que explica las invariantes observadas (grafo bidireccional, append-only, etc.).
- **`prompt-summary.md` / `context-summary.md`** — Outputs reales generados por agentes durante la prueba multi-agente. Quedan como evidencia de "esto fue construido por X agente con Y prompt".

---

## Lo que NO está aquí (a propósito)

- **Código** — vive en `../src/` (cuando exista).
- **Diseño** — vive en `../design/liftoff.pen`.
- **Mission / convenciones** — vive en raíz: `../mission.md` y `../CLAUDE.md`.
- **`tasks.jsonl`** y **`.claude/agents/*.md`** — se generarán cuando arranque el build con harness.

---

## Convención

Todo lo que vaya en `docs/` es:
- **Lectura humana** primero, agente después.
- **Histórico** o **research** — nunca debería ser editado por un agente durante el build.
- **Removible** — si esta carpeta se borrara, el proyecto seguiría funcionando.
