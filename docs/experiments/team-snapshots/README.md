# Team & Task filesystem snapshots

Esta carpeta contiene **fotos en disco** del estado interno de Claude Code mientras se corría una prueba de `TeamCreate` + `TaskCreate` + 2 teammates en paralelo.

Los archivos originales viven en `~/.claude/teams/{team}/` y `~/.claude/tasks/{team}/` y son **borrados al hacer `TeamDelete`**. Estos snapshots los preservan para que puedas inspeccionar la evolución del sistema.

---

## Estructura de snapshots

```
team-demo-snapshots/
├── README.md                          ← este archivo
│
├── 01-team-created/                   ← justo después de TeamCreate
│   ├── team-config.json               ← solo team-lead en members[]
│   └── tasks-dir-listing.txt          ← directorio de tasks vacío (solo .lock)
│
├── 02-tasks-created-with-deps/        ← tras 3 TaskCreate + 1 TaskUpdate(addBlockedBy)
│   ├── team-config.json
│   ├── 1.json                         ← prompt task — pending, sin owner
│   ├── 2.json                         ← context task — pending, sin owner
│   ├── 3.json                         ← combine task — blockedBy: [1, 2]
│   └── tasks-dir-listing.txt
│
├── 03-teammates-spawned/              ← tras lanzar 2 Agent en paralelo
│   ├── team-config.json               ← members[] crece a 3 (lead + 2 agentes)
│   ├── 1.json, 2.json, 3.json
│   └── tasks-dir-listing.txt
│
├── 04-tasks-completed/                ← tras teammates reclamar y terminar
│   ├── team-config.json               ← members[] aún tiene 3 (no shut down todavía)
│   ├── 1.json                         ← owner: prompt-researcher, status: completed
│   ├── 2.json                         ← owner: context-researcher, status: completed
│   ├── 3.json                         ← sigue pending; blockedBy [1,2] no se autopurga
│   └── tasks-dir-listing.txt
│
├── prompt-summary.md                  ← output que escribió prompt-researcher
└── context-summary.md                 ← output que escribió context-researcher
```

---

## Qué mirar en cada snapshot

### 01 → 02: cómo aparecen los tasks
- Compara `tasks-dir-listing.txt` de ambos: en 01 solo hay `.lock`; en 02 ya están los tres `.json` numerados.
- El `id` de cada task es **sequential** (`1`, `2`, `3`).
- Fíjate cómo en `1.json` y `2.json` apareció `"blocks": [3]` **automáticamente** cuando hicimos `addBlockedBy: [1, 2]` en el #3. Es un grafo bidireccional auto-mantenido.

### 02 → 03: cómo crece el team
- Compara `team-config.json`. El `members[]` pasa de 1 (solo `team-lead`) a 3 (más `prompt-researcher` y `context-researcher`).
- Cada nuevo miembro guarda:
  - `agentId`, `name`, `agentType`, `model`
  - `color` (asignado por el sistema: blue, green…)
  - **El prompt completo** con el que fue lanzado (auditable)
  - `joinedAt` timestamp en ms

### 03 → 04: cómo cambian los tasks al ser reclamados y completados
- En 03 los tasks #1 y #2 siguen `"status": "pending"`, sin `owner`.
- En 04:
  - `1.json` → `"owner": "prompt-researcher"`, `"status": "completed"`
  - `2.json` → `"owner": "context-researcher"`, `"status": "completed"`
  - `3.json` → **sigue igual** que en 02: `"status": "pending"`, `"blockedBy": ["1", "2"]`
- **Detalle clave**: el `blockedBy` del #3 NO se purga aunque #1 y #2 estén completados. El sistema deduce "está realmente bloqueado" en tiempo de query mirando el status de las dependencias, no mutando el grafo.

---

## Modelo conceptual

```
~/.claude/
├── teams/{team-name}/
│   └── config.json          ← single source of truth del team:
│                              metadata + members[] (incluye prompts spawn)
│
└── tasks/{team-name}/        ← directorio paralelo, mismo nombre que el team
    ├── .lock                ← serializa accesos a la TaskList completa
    └── {id}.json            ← un fichero por task, id numérico secuencial
```

### Invariantes observadas

| # | Invariante | Por qué importa |
|---|---|---|
| 1 | **Team ↔ TaskList es 1:1** (mismo nombre) | No hay TaskLists huérfanas |
| 2 | Cada task = un JSON aislado | Permite escrituras paralelas sin colisión |
| 3 | `.lock` para el directorio | Serializa creación / listado, no edición individual |
| 4 | `config.json` guarda el **prompt original** de cada teammate | Auditable, otros agentes pueden entender qué hace cada uno |
| 5 | Grafo `blocks ↔ blockedBy` se mantiene bidireccional al añadir | Coherencia automática |
| 6 | Pero NO se purga al completar deps | Grafo declarativo/histórico; disponibilidad se deriva |
| 7 | Teammates corren `in-process` | Comunicación vía mailbox interno, no IPC de procesos |
| 8 | Cada teammate recibe un `color` | UI/observabilidad |
| 9 | Shutdown = protocolo de 2 pasos | `shutdown_request` → `shutdown_approved` → `teammate_terminated` |
| 10 | `TeamDelete` borra team + tasks pero NO outputs externos | Los archivos que escribieron los teammates fuera de `~/.claude/` sobreviven |

---

## Comandos útiles para inspeccionar en vivo

Si vuelves a montar un team y quieres ver el estado **mientras corre** (sin esperar a snapshots):

```bash
# Ver el config del team
cat ~/.claude/teams/<team-name>/config.json | jq

# Ver todas las tasks
cat ~/.claude/tasks/<team-name>/*.json | jq -s

# Vista en vivo refrescada cada segundo (perfecta para una demo)
watch -n 1 'echo "=== TASKS ==="; cat ~/.claude/tasks/<team-name>/*.json 2>/dev/null | jq -s "map({id, status, owner, blockedBy})"'
```

---

## Para la presentación

En el bloque de demo de la **Capa 4 (agentic engineering)**, abre una segunda terminal con `watch` apuntando a `~/.claude/tasks/<team>/`. Mientras Claude crea el team y los teammates, la audiencia ve en tiempo real cómo:

1. Aparecen JSONs en el directorio.
2. Los `status` cambian de `pending` → `in_progress` → `completed`.
3. Los `owner` se rellenan con los nombres de los agentes.
4. El `members[]` del config crece y se reduce.

Es la prueba más visceral de que **agentic engineering no es magia**: es **state coordinado en disco** con un protocolo simple. Eso conecta de vuelta con la idea del speech: el cuello de botella humano sube hacia el diseño del sistema, no hacia escribir cada línea de código.
