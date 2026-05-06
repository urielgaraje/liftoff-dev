# De prompts a agentes: las cuatro capas de construir con IA

> Documento de apoyo para una presentación de ~10 minutos con demo en vivo.
> Cubre conceptos, cronología, analogías, speech, slides y notas de orador.
> Estado del vocabulario: mayo 2026.

---

## 1. Los cuatro conceptos en una frase

| Capa | Una línea |
|---|---|
| **Prompt engineering** | Es escribir bien la pregunta. |
| **Context engineering** | Es darle al modelo lo que necesita saber **antes** de responder. |
| **Harness engineering** | Es el **andamio** alrededor del modelo: las herramientas que puede usar y las reglas que no puede romper. |
| **Agentic engineering** | Es **dirigir un equipo** de agentes en lugar de teclear código. |

No son alternativas: son **capas concéntricas**. La de fuera contiene a la de dentro.

```
┌─────────────────────────────────────────────┐
│  AGENTIC ENGINEERING (la disciplina)        │
│  ┌───────────────────────────────────────┐  │
│  │  HARNESS ENGINEERING (el andamiaje)   │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  CONTEXT ENGINEERING (qué ve)   │  │  │
│  │  │  ┌───────────────────────────┐  │  │  │
│  │  │  │  PROMPT ENGINEERING       │  │  │  │
│  │  │  └───────────────────────────┘  │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 2. Cronología

| Término | Apareció | Quién lo empujó |
|---|---|---|
| Prompt engineering | 2022–2023 | Comunidad post-ChatGPT |
| Context engineering | Junio 2025 | Karpathy + Tobi Lütke (Shopify) en X |
| Harness engineering | Finales 2025 / principios 2026 | OpenAI (post sobre Codex), Martin Fowler, equipo de Stripe |
| Agentic engineering | Sequoia AI Ascent 2026 | Karpathy (paraguas) |

Mención aparte: **environment engineering** existe pero pertenece al lado del **entrenamiento** de agentes (entornos de RL, RLVR), no al uso. Solo mencionar si sale en Q&A.

---

## 3. Definiciones detalladas

### 3.1 Prompt engineering
Lo que pides al modelo en un solo turno. La capa más visible y la primera que aprende cualquiera. Tiene un techo claro: si el modelo no tiene la información necesaria, ninguna frase mágica lo arregla.

### 3.2 Context engineering
Definición de Karpathy (junio 2025):

> *"The delicate art and science of filling the context window with just the right information for the next step."*

Gestiona **qué información ve el modelo**: documentos recuperados, memoria, historiales comprimidos, schemas, salidas de tools. Prompt engineering es un subconjunto.

### 3.3 Harness engineering
Es **todo el código que rodea al modelo**: qué herramientas puede llamar, cómo valida sus decisiones, cuándo para, qué hace cuando un test falla, qué reintentos permite. Es lo que **convierte un modelo en un agente**.

Filosofía clave:
> *"Cada vez que el agente comete un error, no esperes que la próxima vez lo haga mejor — diseña el entorno para que **no pueda** cometer ese error otra vez."*

Dato de impacto: Stripe envía **1.300 PRs generados por IA por semana** gracias a su harness.

### 3.4 Agentic engineering
Karpathy lo presentó en **Sequoia AI Ascent 2026** como evolución del *vibe coding*. Es la disciplina profesional de construir software con agentes manteniendo el listón: tests, arquitectura, mantenibilidad, criterio.

Cita central:
> *"You can outsource your thinking, but you can't outsource your understanding."*

Dato personal de Karpathy: en noviembre 2025 escribía a mano el 80% de su código; en diciembre 2025 esa proporción se invirtió y delegaba el 80% a agentes. Llama "ghosts" a los agentes autónomos trabajando en paralelo en su repo.

Encaja dentro de su tesis de **Software 3.0** (1.0 = código, 2.0 = pesos de redes, 3.0 = agentes).

---

## 4. La regla mental (el takeaway)

Cuando un modelo falle, antes de cambiar el prompt, pregúntate:

- ¿Estoy ajustando **una frase**? → prompt engineering
- ¿Estoy decidiendo **qué información** ve el modelo? → context engineering
- ¿Estoy diseñando **tools, loops y validaciones**? → harness engineering
- ¿Estoy organizando **todo el proceso de desarrollo**? → agentic engineering

7 de cada 10 veces el problema **no es la frase** — es el contexto o el harness.

---

## 5. Analogías

### Analogía maestra — el cocinero
Un modelo es un cocinero brillante que **no recuerda nada** y solo sabe lo que le pongas delante.

- **Prompt** → *"Hazme una tortilla."*
- **Context** → *"Aquí tienes los huevos, la receta de la abuela y la lista de alergias del cliente."*
- **Harness** → *"Esta es la cocina: con horno, temporizador, alarma de humo y un inspector que prueba el plato antes de que salga."*
- **Agentic** → *"Eres el dueño del restaurante: decides la carta, contratas cocineros y garantizas que cada plato que sale es digno del nombre del local."*

### Analogía alternativa — el médico
- Prompt → *"¿qué tengo?"*
- Context → historial clínico, análisis, radiografías
- Harness → el hospital con sus protocolos
- Agentic → el director del hospital

### Analogía alternativa — el nuevo empleado
- Prompt → la tarea del día
- Context → el onboarding
- Harness → el puesto de trabajo con accesos y revisor
- Agentic → tú como manager

### Analogía de cierre — el GPS (recomendada para remate)
> *"Hace 30 años preguntabas a un desconocido en la calle: 'oiga, ¿por dónde a la estación?'. Eso era prompt engineering — la frase tenía que ser perfecta."*
>
> *"Luego llegó Google Maps: ubicación, destino, preferencias. Eso es context engineering."*
>
> *"Después llegó Waze: te recalcula, te avisa de un radar, te corrige si te equivocas. Eso es harness engineering."*
>
> *"Y ahora llega el coche autónomo: tú dices 'a casa' y supervisas. Eso es agentic engineering."*

---

## 6. Speech (versión completa, ~9 min)

### 6.1 Apertura (~45 s)
> *"En 2023, todos queríamos ser prompt engineers. Salieron cursos, libros, ofertas de trabajo de 300.000 dólares por escribir frases en una caja de texto. Tres años después, ese término se nos ha quedado pequeño."*
>
> *"Hoy quien construye software con IA en serio no piensa en frases sueltas. Piensa en cuatro capas, una dentro de la otra. Y en los próximos minutos quiero que os llevéis el mapa mental de esas cuatro capas."*

### 6.2 Analogía (~1 min)
> *"Imaginad que el modelo de lenguaje es un actor — o mejor, un cocinero. Brillante, capaz de improvisar casi cualquier cosa, pero que no recuerda nada de un día para otro y solo sabe lo que le pongan delante."*

### 6.3 Capa 1 — Prompt (~1 min)
> *"El prompt es lo que pides en un solo turno. 'Hazme una tortilla.' Es la capa más visible. Pero tiene un techo: si el modelo no sabe a quién, qué pasó antes, o qué restricciones hay, ninguna frase mágica lo arregla."*

### 6.4 Capa 2 — Context (~1 min 30 s)
> *"Junio de 2025. Karpathy escribe en X una frase que cambia el vocabulario: 'context engineering is the delicate art and science of filling the context window with just the right information for the next step'."*
>
> *"Si prompt era escribir una frase mágica, context es escribir el guion completo: qué documentos recuperas, qué memoria incluyes, qué cortas porque no cabe."*

### 6.5 Capa 3 — Harness (~2 min)
> *"Un harness es todo el código que rodea al modelo: qué tools puede usar, cómo valida sus decisiones, cuándo para. Es lo que convierte un modelo en un agente."*
>
> *"Stripe envía 1.300 pull requests generados por IA cada semana. No es porque tengan prompts mejores — es porque construyeron un harness que les obliga a correr tests, les impide tocar ciertos archivos y les hace parar cuando un linter explota."*
>
> *"La filosofía: cada vez que el agente comete un error, no esperes que la próxima vez lo haga mejor — diseña el entorno para que no pueda fallar igual."*

### 6.6 Capa 4 — Agentic (~2 min)
> *"Sequoia AI Ascent, principios de 2026. Karpathy declara obsoleto el vibe coding y propone un nombre para la disciplina profesional: agentic engineering."*
>
> *"Es el restaurante: decides la carta, contratas cocineros, garantizas calidad."*
>
> *"En noviembre de 2025 Karpathy escribía a mano el 80% de su código. Un mes después, delegaba el 80% a agentes. En cuatro semanas."*
>
> *"Y dijo la frase que mejor resume todo esto: 'You can outsource your thinking, but you can't outsource your understanding'."*

### 6.7 Cierre (~1 min)
> *"En 2023 la pregunta era 'qué le pido al modelo'. En 2025 era 'qué le enseño'. En 2026 es 'qué mundo le construyo'. El año que viene, casi seguro, será otra."*
>
> *"Lo único que no cambia es que el cuello de botella se mueve hacia arriba: hacia vuestro criterio, vuestro gusto, vuestra capacidad de decidir qué vale la pena construir."*

---

## 7. Estructura de slides (con demo en vivo)

Total: **8 slides + bloque de demo**.

| # | Slide | Visual clave | Texto principal |
|---|---|---|---|
| 1 | Portada | Matrioshka pequeña en esquina | *"De prompts a agentes — Las cuatro capas de construir con IA"* |
| 2 | El problema | Línea de tiempo 2022→2027 | *"'Prompt engineer' se nos ha quedado pequeño."* |
| 3 | Analogía | Cocinero solo | *"Un modelo es un cocinero brillante que no recuerda nada."* |
| 4 | Prompt | Cocinero + bocadillo *"Hazme una tortilla"* | **Prompt engineering** — *"La pregunta."* |
| 5 | Context | Cocinero + mesa con receta, ingredientes, alergias | **Context engineering** — *"Lo que necesita saber antes de cocinar."* |
| 6 | Harness | Cocina entera con hornos, temporizador, inspector | **Harness engineering** — *"La cocina y sus reglas."* + *"Stripe → 1.300 PRs / semana"* |
| 7 | DEMO | Slide negra con la palabra **DEMO** | (vacía — la atención salta a la pantalla compartida) |
| 8 | Agentic | Restaurante visto desde fuera con varias cocinas dentro (los "ghosts") | **Agentic engineering** — *"Tú eres el dueño del restaurante."* |
| 9 | Cita asesina | Fondo negro, tipografía grande | *"You can outsource your thinking, but you can't outsource your understanding."* — Karpathy |
| 10 | Cierre | Matrioshka abierta + 4 preguntas | Las 4 preguntas de la regla mental |

### Reglas de diseño
1. **Reusar el cocinero** en slides 3–6, solo cambiando lo que tiene alrededor. Esto enseña la idea de capas concéntricas sin verbalizarla.
2. **Una idea por slide.** Si te da pereza recortar texto, ese es el texto que sobra.
3. **Slide 7 (demo) y slide 9 (cita) son las que más recordarán.** Cuídalas más.

---

## 8. Notas de orador (cosas a tener en cuenta)

### Antes
- **Calibra la audiencia** con una pregunta de manos al inicio: *"¿quién ha usado Cursor / Copilot / Claude Code esta semana?"*
- **Pon fecha al talk:** *"esto es un mapa de mayo de 2026; en seis meses parte de estos nombres habrán cambiado"*. Da credibilidad y te protege.

### Durante
- **Hay un valle de atención al minuto 5** — coincide con harness. Mete ahí el dato de Stripe o la frase del *"diseña el entorno para que no pueda fallar igual"*.
- **Demo > slides.** Mientras corre la demo, señala en voz alta cada capa que aparece: *"esto que veis es el contexto que cargó… esto es el harness ejecutando los tests"*.
- **Pausa de 3 segundos** después de la cita de Karpathy. Deja que la lean.

### Objeciones a anticipar
- *"Esto es lo de siempre con un nombre nuevo."* → *"En parte sí. Lo nuevo no son los conceptos, son los **roles, equipos y presupuestos** dedicados a cada capa. Stripe no tenía un equipo de harness en 2023."*
- *"¿Y los riesgos? alucinaciones, seguridad?"* → El harness existe precisamente para eso (sandboxes, validadores, permisos).
- *"¿Esto reemplaza developers?"* → *Outsourcing thinking, not understanding*. El cuello de botella sube, no desaparece.
- *"¿Por qué Karpathy y no otro?"* → Él **populariza**, no inventa solo. Context fue Karpathy + Tobi Lütke; harness viene de OpenAI/Codex y Martin Fowler.

### Lo que NO debes hacer
- No leas las slides. Solo las 4 preguntas del cierre conviene leer literal.
- No metas más siglas (RAG, RLVR, MCP, ReAct…). Si las usas, defínelas.
- No prometas predicciones. *"No lo sé; hace un año nadie hablaba de harness."*
- No vendas humo: cita fuentes, reconoce límites, evita *"esto lo cambia todo"*.

### Llamada a la acción del cierre
> *"La próxima vez que un modelo os falle, en lugar de cambiar el prompt, preguntaos en qué capa está el problema. 7 de cada 10 veces no es la frase — es el contexto o el harness. Ahí está el 80% de la mejora que os queda por exprimir."*

### Plan B de 5 minutos (si te cortan tiempo)
**Analogía del cocinero + las 4 preguntas del cierre + cita de Karpathy.** Con eso solo, ya entregaste el mensaje completo.

---

## 9. Fuentes

- [Karpathy en X sobre "context engineering"](https://x.com/karpathy/status/1937902205765607626)
- [Sequoia Ascent 2026 summary — karpathy.bearblog](https://karpathy.bearblog.dev/sequoia-ascent-2026/)
- [Harness engineering for coding agent users — Martin Fowler](https://martinfowler.com/articles/harness-engineering.html)
- [Harness engineering: leveraging Codex in an agent-first world — OpenAI](https://openai.com/index/harness-engineering/)
- [Prompt vs Context vs Harness Engineering — Atlan](https://atlan.com/know/harness-engineering-vs-prompt-engineering/)
- [How Stripe Ships 1,300 AI PRs a Week — MindStudio](https://www.mindstudio.ai/blog/what-is-harness-engineering-beyond-prompt-context-engineering)
- [From Vibe Coding to Agentic Engineering — aiagentssimplified](https://aiagentssimplified.substack.com/p/from-vibe-coding-to-agentic-engineering)
- [What is Agentic Engineering? — IBM](https://www.ibm.com/think/topics/agentic-engineering)
