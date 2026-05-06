---
theme: default
titleTemplate: 'No es el prompt, es el entorno'
info: |
  Charla ~30 min sobre cómo se construye software con IA en 2026.
  Las cuatro capas: prompt → context → harness → agentic.
class: text-left
highlighter: shiki
lineNumbers: false
drawings:
  persist: false
mdc: true
contextMenu: false
fonts:
  sans: 'Inter'
  mono: 'IBM Plex Mono'
  weights: '400,500,700'
layout: garaje
chapter: Intro
page: 1
title: Memes intro
---

<div class="slide-body slide-welcome">
  <p class="eyebrow">Garaje · Formaciones de IA</p>
  <h2 class="lead">
    Bienvenido a<br/>
    <span class="accent-pink">formaciones de IA</span>.
  </h2>
</div>

<div class="meme-stack meme-stack-welcome">
  <img src="/memes/01-no-vine-a-jugal.png" class="meme meme-1" alt="no vine a jugal" v-click="1" />
  <img src="/memes/02-how-to-fly.jpg" class="meme meme-2" alt="how to fly" v-click="2" />
  <img src="/memes/03-verdad-1.jpg" class="meme meme-3" alt="verdad 1" v-click="3" />
  <img src="/memes/04-verdad-2.jpg" class="meme meme-4" alt="verdad 2" v-click="4" />
  <img src="/memes/05-modo-serio.jpeg" class="meme meme-5" alt="modo serio" v-click="5" />
</div>

---
layout: cover
chapter: Portada
page: 2
dark: true
title: Portada
---

<h1>
No es el prompt,<br/>
es el <span class="accent-pink">entorno</span>.
</h1>

<p class="subtitle">
Cómo se construye software con IA en 2026.
</p>

<p class="meta">Uriel Blanco · Garaje · Mayo 2026</p>

---
layout: garaje
chapter: 00 — Intro
page: 3
title: El plan
---

<div class="slide-body">
  <p class="eyebrow">El plan</p>
  <h2 class="lead">
    Te lo <span class="accent-pink">enseño</span>,<br/>
    no te lo cuento.
  </h2>
  <ol class="numbered">
    <li><span class="num">01</span><span>Lanzo un prompt en directo.</span></li>
    <li><span class="num">02</span><span>Mientras Claude trabaja, vamos a la teoría.</span></li>
    <li><span class="num">03</span><span>Al final volvemos y vemos qué construyó.</span></li>
  </ol>
</div>

---
layout: garaje
chapter: 01 — El prompt
page: 4
dark: true
title: El prompt verbatim
---

<div class="slide-body">
  <p class="eyebrow">Esto es lo que le voy a pedir</p>
  <div class="prompt-block">
    <p>Construye <span class="accent-pink">Liftoff</span>: un trivia multijugador estilo Kahoot con tema espacial.</p>
    <ul>
      <li>Next.js 16 + Tailwind v4 + Pusher</li>
      <li>3 minijuegos: typing race, anagram, memoria</li>
      <li>Host comparte código de sala, players entran desde móvil</li>
      <li>50 jugadores simultáneos</li>
      <li>Diseño "space neon" en /design/liftoff.pen</li>
    </ul>
    <p>Lee mission.md y CLAUDE.md primero. Tests E2E con Playwright. Deploy a Vercel.</p>
  </div>
</div>

---
layout: garaje
chapter: 02 — Live
page: 5
dark: true
title: LIVE — lanzando agente
---

<div class="slide-body slide-live">
  <p class="live-dot">●</p>
  <h2 class="lead-xl">
    Lanzando<br/>
    <span class="accent-pink">agente</span>.
  </h2>
  <p class="meta-mono">Volvemos en ~25 minutos.</p>
</div>

---
layout: garaje
chapter: 03 — Las cuatro capas
page: 6
title: Las cuatro capas
---

<div class="slide-split">
  <div class="slide-split-left">
    <p class="eyebrow">Mapa mental</p>
    <h2 class="lead">
      Cuatro capas,<br/>
      una <span class="accent-pink">dentro</span> de otra.
    </h2>
    <p class="caveat">
      La de fuera contiene a la de dentro.<br/>
      Cuando algo falle, sube por la pila.
    </p>
  </div>
  <div class="slide-split-right">
    <div class="matrioska">
      <div class="ring ring-4">
        <span class="label">Agentic</span>
        <div class="ring ring-3">
          <span class="label">Harness</span>
          <div class="ring ring-2">
            <span class="label">Context</span>
            <div class="ring ring-1">
              <span class="label">Prompt</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

---
layout: garaje
chapter: 04 — Capa 1 · Prompt
page: 7
title: Capa 1 — La pregunta
---

<div class="slide-split">
  <div class="slide-split-left">
    <p class="eyebrow">Capa 1 — Prompt engineering</p>
    <h2 class="lead">
      La <span class="accent-pink">pregunta</span>.
    </h2>
    <p class="paragraph">
      Lo que pides en un solo turno.<br/>
      La capa más visible y la primera<br/>
      que aprende cualquiera.
    </p>
  </div>
  <div class="slide-split-right slide-side-card">
    <div class="analogy-card">
      <p class="analogy-tag">Analogía — nuevo empleado</p>
      <p class="analogy-line">
        Es la <span class="accent-pink">tarea concreta</span> del día.
      </p>
      <p class="analogy-foot">
        "Arregla este bug." · "Hazme una tortilla."
      </p>
    </div>
  </div>
</div>

---
layout: garaje
chapter: 04 — Capa 1 · Prompt
page: 8
dark: true
title: Capa 1 — El techo
---

<div class="slide-split">
  <div class="slide-split-left">
    <p class="eyebrow">Capa 1 — el techo</p>
    <h2 class="lead">
      La frase mágica<br/>
      no existe.
    </h2>
    <p class="lead-after">
      …o <span class="accent-pink">sí</span>, pero no en lenguaje entendible.
    </p>
    <p class="caveat caveat-dark">
      Un LLM es <span class="mono">P(token | prompt)</span>. Despejas hacia atrás y existe un prompt para cualquier output.
    </p>
  </div>
  <div class="slide-split-right">
    <div class="prompt-glitch">
      <p class="glitch-tag">Un prompt mágico real, encontrado por gradiente</p>
      <p class="glitch-text">
        describing.\ + similarlyNow write opposite contents.](Me giving**ONE please? revert with "\!--Two
      </p>
      <p class="glitch-foot">
        Existe — pero solo en <span class="accent-pink">matemáticas</span>.
      </p>
    </div>
  </div>
</div>

---
layout: garaje
chapter: 05 — Capa 2 · Context
page: 9
title: Capa 2 — El onboarding
---

<div class="slide-split">
  <div class="slide-split-left">
    <p class="eyebrow">Capa 2 — Context engineering</p>
    <h2 class="lead">
      El <span class="accent-pink">onboarding</span>.
    </h2>
    <p class="paragraph">
      Lo que el modelo carga <em>antes</em> de empezar.<br/>
      Documentación, decisiones, convenciones,<br/>
      errores comunes, historial.
    </p>
  </div>
  <div class="slide-split-right slide-side-card">
    <div class="analogy-card">
      <p class="analogy-tag">Analogía — nuevo empleado</p>
      <p class="analogy-line">
        Su primera <span class="accent-pink">semana</span> antes de tocar código.
      </p>
      <p class="analogy-foot">
        "Lee el wiki, los repos, el Notion del equipo,<br/>
        y luego hablamos."
      </p>
    </div>
  </div>
</div>

---
layout: garaje
chapter: 05 — Capa 2 · Context
page: 10
dark: true
title: Capa 2 — Filling the window
---

<div class="slide-split">
  <div class="slide-split-left">
    <p class="eyebrow">Junio 2025 — Karpathy</p>
    <blockquote class="pull-quote pull-quote-dark">
      "The delicate art and science of filling the context window
      with just the right information for the next step."
      <cite>— Andrej Karpathy</cite>
    </blockquote>
    <p class="caveat caveat-dark">
      Es la <span class="accent-pink">memoria de trabajo</span> del modelo.<br/>
      Lo que cabe en su escritorio mientras razona.<br/>
      Cada token cuenta — finita por diseño.
    </p>
  </div>
  <div class="slide-split-right">
    <svg viewBox="0 0 260 200" class="ill" fill="none" stroke="currentColor" aria-hidden="true">
      <rect x="10" y="14" width="240" height="150" rx="4" stroke-width="1.6"/>
      <line x1="32" y1="42" x2="120" y2="42" stroke-width="1.4"/>
      <line x1="32" y1="62" x2="100" y2="62" stroke-width="1.4"/>
      <line x1="32" y1="82" x2="138" y2="82" stroke-width="1.4"/>
      <line x1="32" y1="118" x2="86" y2="118" stroke-width="1.4"/>
      <line x1="32" y1="138" x2="120" y2="138" stroke-width="1.4"/>
      <rect x="158" y="46" width="74" height="74" fill="#f67bbd" stroke="none"/>
      <line x1="170" y1="66" x2="218" y2="66" stroke="#000" stroke-width="1.4"/>
      <line x1="170" y1="80" x2="208" y2="80" stroke="#000" stroke-width="1.4"/>
      <line x1="170" y1="94" x2="220" y2="94" stroke="#000" stroke-width="1.4"/>
      <line x1="170" y1="108" x2="200" y2="108" stroke="#000" stroke-width="1.4"/>
      <line x1="50" y1="164" x2="50" y2="186" stroke-width="1.6"/>
      <line x1="210" y1="164" x2="210" y2="186" stroke-width="1.6"/>
      <line x1="40" y1="186" x2="220" y2="186" stroke-width="1.6"/>
    </svg>
    <p class="ill-caption">Lo que cabe en la pizarra: docs, memoria, schemas, salidas de tools, historial.</p>
  </div>
</div>

---
layout: garaje
chapter: 06 — Capa 3 · Harness
page: 11
title: Capa 3 — El puesto de trabajo
---

<div class="slide-split">
  <div class="slide-split-left">
    <p class="eyebrow">Capa 3 — Harness engineering</p>
    <h2 class="lead">
      El <span class="accent-pink">puesto</span> de trabajo.
    </h2>
    <p class="paragraph">
      Tools, validadores, sandboxes, retries.<br/>
      Lo que <span class="accent-pink">convierte</span> un modelo en un agente.
    </p>
  </div>
  <div class="slide-split-right slide-side-card">
    <div class="analogy-card">
      <p class="analogy-tag">Analogía — nuevo empleado</p>
      <p class="analogy-line">
        Su <span class="accent-pink">despacho</span>: CI, linter, sandbox, revisor.
      </p>
      <p class="analogy-foot">
        "No puede borrar producción.<br/>
        Sus PRs pasan revisión obligatoria."
      </p>
    </div>
  </div>
</div>

---
layout: garaje
chapter: 06 — Capa 3 · Harness
page: 12
dark: true
title: Capa 3 — 1.300 PRs
---

<div class="slide-body">
  <p class="eyebrow">Capa 3 — el dato</p>
  <div class="bigstat">
    <span class="stat">1.300</span>
    <span class="stat-label">PRs por semana<br/>generados por IA en Stripe.</span>
  </div>
  <p class="caveat caveat-dark caveat-quote">
    "Cada vez que el agente comete un error, no esperes<br/>
    que la próxima vez lo haga mejor — diseña el entorno<br/>
    para que <span class="accent-pink">no pueda</span> cometer ese error otra vez."
  </p>
</div>

---
layout: garaje
chapter: 07 — Capa 4 · Agentic
page: 13
title: Capa 4 — El tech lead
---

<div class="slide-split">
  <div class="slide-split-left">
    <p class="eyebrow">Capa 4 — Agentic engineering</p>
    <h2 class="lead">
      Tú <span class="accent-pink">diriges</span>,<br/>
      no tecleas.
    </h2>
    <p class="paragraph">
      Asignas tareas. Supervisas.<br/>
      Mantienes el listón: tests,<br/>
      arquitectura, criterio.
    </p>
  </div>
  <div class="slide-split-right slide-side-card">
    <div class="analogy-card">
      <p class="analogy-tag">Analogía — nuevo empleado</p>
      <p class="analogy-line">
        Has dejado de teclear.<br/>
        Eres el <span class="accent-pink">tech lead</span>.
      </p>
      <p class="analogy-foot">
        Tres agentes trabajando en paralelo.<br/>
        Tú eliges qué construyen y revisas.
      </p>
    </div>
  </div>
</div>

---
layout: garaje
chapter: 07 — Capa 4 · Agentic
page: 14
dark: true
title: Capa 4 — 80% en un mes
---

<div class="slide-body">
  <p class="eyebrow">Capa 4 — el dato personal de Karpathy</p>
  <div class="shift-row">
    <div class="shift-cell">
      <span class="shift-month">Noviembre 2025</span>
      <span class="shift-pct">80%</span>
      <span class="shift-foot">a mano</span>
    </div>
    <span class="shift-arrow">→</span>
    <div class="shift-cell shift-cell-after">
      <span class="shift-month">Diciembre 2025</span>
      <span class="shift-pct accent-pink">80%</span>
      <span class="shift-foot">delegado a agentes</span>
    </div>
  </div>
  <p class="caveat caveat-dark">
    En cuatro semanas. Llama "<span class="accent-pink">ghosts</span>"<br/>
    a los agentes que trabajan en paralelo en su repo.
  </p>
  <p class="meta-mono">
    →&nbsp; Mientras hablo, hay un agente construyendo Liftoff aquí al lado.
  </p>
</div>

---
layout: garaje
chapter: 08 — Cita
page: 15
dark: true
title: Cita — Karpathy
---

<div class="slide-body slide-quote">
  <blockquote class="quote-xl">
    You can <span class="strike">outsource your thinking</span>,<br/>
    but you can't outsource your<br/>
    <span class="accent-pink">understanding</span>.
  </blockquote>
  <p class="quote-translation">
    Puedes delegar el pensamiento, no el entendimiento.
  </p>
  <cite class="quote-cite">— Andrej Karpathy · Sequoia AI Ascent 2026</cite>
</div>

---
layout: garaje
chapter: 09 — Volvamos
page: 16
dark: true
title: Volvamos al agente
---

<div class="slide-split">
  <div class="slide-split-left">
    <p class="eyebrow">Volvamos al agente</p>
    <h2 class="lead">
      Veamos qué construyó<br/>
      <span class="accent-pink">Claude</span>.
    </h2>
    <p class="meta-mono">→ liftoff.local</p>
  </div>
  <div class="slide-split-right">
    <div class="meme-stack meme-stack-end">
      <img src="/memes/layers.jpeg" class="meme meme-end-1" alt="layers" v-click="1" />
      <img src="/memes/end.jpg" class="meme meme-end-2" alt="end" v-click="2" />
    </div>
  </div>
</div>
