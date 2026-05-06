# Liftoff — Mission

> Documento inmutable. Es el "norte" del producto.
> Cualquier agente o persona que trabaje en esta app debe leerlo primero.
> Cambios a este archivo = re-evaluación del proyecto, no iteración.

> *Nombre código provisional: Liftoff. Sustituible si el equipo encuentra otro mejor.*

---

## Qué es

**Una sola aplicación web** con un único punto de entrada (la landing) y dos perfiles de uso:

- El **host** (la persona que da la charla) clica *"Crear partida"* en la landing, introduce la passphrase, y queda en una vista pre-game con **QR + link** prominentes y la lista en directo de jugadores entrando. Cuando lo decide, inicia la partida y comparte su pantalla.
- Los **jugadores** (hasta 50 asistentes con su laptop) escanean el QR proyectado, abren la URL en su laptop, meten nickname, eligen skin de cohete, y esperan en el lobby. Cuando el host inicia, compiten en una **carrera de cohetes hacia un planeta** atravesando 3 etapas (typing, anagrama, memoria).

Una partida dura 4-6 minutos.

## Por qué existe

Es la app que se construye en directo durante una charla sobre **agentic engineering**. Sirve dos propósitos a la vez:

1. **Producto real desplegado**, jugable por la audiencia el día del talk (cada asistente entra con su móvil, juega, y ve a los demás).
2. **Banco de pruebas** del experimento de la charla: la misma app se construirá dos veces — una con harness completo y team multi-agente, otra con un single-agent y compactación de contexto. La audiencia compara los resultados en directo.

Esta `mission.md` documenta **qué es la app** sin distinguir entre las dos pasadas. Las decisiones de orquestación viven en archivos separados.

---

## Personas

### Player (jugador)
Asistente del talk con su **laptop/desktop**. Abre la URL (o escanea el QR proyectado y abre la URL en su laptop), mete nickname, elige skin de cohete, juega 3 etapas seguidas. Total ~4-5 minutos. Ve su propia posición + leaderboard agregado en tiempo real.

> Móvil **no soportado para jugar** — la mecánica (typing especialmente) requiere teclado físico. La app detecta viewport <1024px y muestra un mensaje *"abre esto en un portátil para jugar"*.

### Host
La persona que da la charla. Crea la sala, abre la inscripción, controla el inicio de la partida y proyecta la pantalla principal de retransmisión. **No participa**: solo observa y narra.

---

## Mecánica del juego

Una partida = un race de **3 etapas en cadena**, cada una con un mini-juego distinto. El cohete de cada jugador atraviesa las 3 fases del viaje espacial. Score acumulativo entre etapas.

### Etapa 1 — Despegue (Typing race)
Aparece un párrafo (50-80 palabras). El jugador lo teclea exacto. Cada caracter correcto = 1 metro de altitud. **Errores bloquean el avance hasta corregir** — no se atraviesan como en typing.com; hay que volver atrás y poner el caracter correcto.

- *Penalty visual:* humo gris saliendo del cohete mientras hay error pendiente.
- *Duración aprox:* 60-90s.

### Etapa 2 — Órbita (Anagram race)
7 letras barajadas. El jugador forma palabras válidas (mín 3 letras) en 60s. **Score de la etapa = suma de longitudes de palabras válidas**. Repetidas no cuentan; envíos inválidos restan -1.

- *Penalty visual:* pulso rojo en el cohete + animación de "fuga de combustible" al enviar inválida.
- *Duración:* 60s fijos.

### Etapa 3 — Aproximación (Memoria / Simon)
Se muestra una secuencia de N símbolos (estrella, planeta, luna, cometa). Empieza en 4 y crece. El jugador la repite. Acierto = sigue, secuencia + 1. **Fallo = la secuencia se reinicia desde 4** (penalty catastrófico).

- *Penalty visual:* el cohete "explota" brevemente y reaparece en su última posición consolidada.
- *Duración:* hasta llegar a nivel 8 o timeout 90s.

### Scoring final

```
score_total = (altitud_etapa1 × 1)
            + (palabras_etapa2 × 5)
            + (nivel_etapa3 × 50)
            + bonus_top3_por_etapa
```

Podio final ranqueado por `score_total`. Empates por tiempo total.

---

## Vistas (8, agrupadas en 3 rutas)

### Landing — entrada única (`/`)
1. **Landing** — pública. Dos CTAs: *"Crear partida"* (passphrase, solo el host puede crear) y mensaje *"¿Eres jugador? Escanea el QR de tu host"*. Si llegas con `?code=ABC` (vía QR), salta directo a Player Join.

### Player flow — `/play`
2. **Player Join** — form de nickname + selector de skin de cohete (8 colores/diseños). Bloquea acceso desde móvil con CTA *"abre esto en un portátil"*.
3. **Player Lobby** — tu cohete + nickname + *"23/50 listos · esperando al host"*. Ves a los demás entrando.
4. **Player Game** — vista del stage activo (state machine entre las 3 etapas + overlays de transición). Siempre muestra: etapa activa, mini progress propio, ranking actual del jugador (#X/50) y distancia al líder.
5. **Player End** — rank final, breakdown por etapa, botón share.

### Host flow — `/host`
6. **Host Pre-game** — al crear partida, vista con **QR + link** prominentes y lista live de jugadores que van entrando. Ajustes mínimos (idioma, longitud de párrafo, dificultad anagram). Botón *"Iniciar carrera"* (mín. 1 jugador).
7. **Host Broadcast** ⭐ — pantalla principal proyectada. Escena de espacio con **top 8 cohetes visibles** + **leaderboard lateral con los 50** jugadores. Indicador de etapa activa. Cronómetro.
8. **Host Podium** — top 3 cohetes aterrizando con animación + ranking completo + botón *"Descargar resumen como imagen"*.

---

## Principios inmutables

1. **Desktop-only para player y para host.** Player UI requiere teclado físico y viewport ≥1024px. Host se diseña para 1920×1080 y 2560×1440. Móvil bloqueado con mensaje claro al usuario.
2. **Tiempo real sub-250ms.** El sync de eventos entre jugador y host no debe pasar de 250ms p95.
3. **50 jugadores concurrentes baseline**, target 100. Si no escala a 50, la app no está terminada.
4. **Estado efímero por sesión.** No hay cuentas ni leaderboards persistentes entre partidas. Una sala vive lo que dura la partida + 24h post-juego para revisitar.
5. **Acceso simple para player.** Solo nickname + room code. Cero login, cero email.
6. **Una sola sala activa, un solo host.** El host accede desde la landing clicando *"Crear partida"* + passphrase env var. No hay OAuth, email magic links ni cuentas. Una sola partida en curso por instancia desplegada — al crear nueva, la anterior se cierra. Mínimo 1 jugador para iniciar.
7. **Anti-cheat de mínimos.** Validación server-side de tiempos por etapa, rate-limit por jugador, rechazo de inputs imposibles (e.g., >1000 chars/s en typing).
8. **Idioma primario español, fallback inglés.** Mensajes UI bilingües. Word lists configurables al crear sala.
9. **Cero IA dentro de la app.** El juego es CRUD + game logic + websockets. No hay LLM en runtime. La IA está en cómo se construye, no en qué hace.
10. **Animación con propósito.** Cada animación tiene función comunicativa (penalty, progreso, transición). Cero decoración pura.

---

## Criterios de éxito (definition of done)

La app se considera lograda si:

- 50 navegadores simulados con Playwright completan una partida end-to-end sin desconexión ni desync detectable.
- Tests E2E multi-browser cubren: lobby de 3+ jugadores, una etapa completa de cada tipo, transición entre etapas, fin de partida, podio.
- Latencia p95 de sync < 250ms con 50 conexiones activas.
- Player UI funciona correctamente en navegadores desktop modernos desde 1024px hasta 4K.
- Vista de host renderiza correctamente en 1920×1080 y 2560×1440.
- Acceso desde móvil (viewport <1024px) muestra el bloqueo con mensaje claro y CTA *"abre esto en un portátil"*.
- Una partida completa termina en 4-6 minutos sin intervención manual del host (excepto el *"iniciar"*).
- El ranking final es determinista (mismas inputs → mismo orden).
- El leaderboard y la escena de host actualizan estado de cada jugador en < 200ms tras cada evento.
- El skin de cohete elegido por el jugador es el que aparece en host broadcast.

---

## Stack

- **Frontend**: Next.js 15 (App Router) · Tailwind CSS · shadcn/ui · Framer Motion (animaciones de cohetes/transiciones) · React 19 Server Components donde aplique.
- **Realtime**: Pusher Channels (websockets gestionados; soporta 50 conexiones simultáneas en free tier).
- **DB**: Neon Postgres (estado de sala, scores efímeros).
- **ORM**: Drizzle.
- **Tests**: Playwright (multi-browser E2E), Vitest (unit).
- **Lenguaje**: TypeScript estricto.

## Deploy

- **App**: Vercel.
- **DB**: Neon (free tier suficiente para 50 jugadores efímeros).
- **Realtime**: Pusher (free tier ≤100 conexiones concurrentes, ≤200k mensajes/día).
- **Dominio**: por definir.

---

## Fuera de alcance (no-goals)

- Cuentas de usuario / perfiles persistentes.
- Leaderboards entre partidas / salas / global.
- Apps móviles nativas (responsive web es suficiente).
- Idiomas más allá de español + inglés.
- Streaming / integración con OBS.
- Modo espectador (más allá del host).
- IA / LLM en runtime.
- Skins desbloqueables / progresión / monetización.
- Soporte offline.

---

## La pantalla estrella

**Host Broadcast durante la Etapa 3**, justo antes del podio. Espacio negro, estrellas, los 8 cohetes punteros aproximándose al planeta, leaderboard lateral con los 50 jugadores agitándose en tiempo real, indicador *"APROXIMACIÓN AL PLANETA"* en la parte superior. Es la imagen que la audiencia hará foto y compartirá.
