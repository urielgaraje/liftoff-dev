# Liftoff — Harness Setup

> Documento operacional. Registro de todo lo provisionado y configurado **antes** de empezar a escribir código de la app.
>
> Sirve dos propósitos:
> 1. **Recetario** para preparar el `starter-rich` (y variantes más finas) cuando hagamos el experimento de one-shot.
> 2. **Memoria** de los gotchas que ya nos costaron tiempo, para no volver a tropezar.
>
> Si re-inicias el setup desde cero en otra máquina o cuenta, sigue el orden de §Pasos de provisión.

---

## Estado del setup actual

| Pieza | Estado | Verificado cómo |
|---|---|---|
| Repo GitHub `urielgaraje/liftoff-dev` (privado) | ✅ Creado, push activo | `gh repo view` + push exitoso |
| Sesión `gh` CLI (`urielgaraje`) | ✅ Activa | `gh auth status` |
| Email de commit ↔ user GitHub | ✅ `uri92.el@gmail.com` enlazado a `urielgaraje` | `gh api .../commits/main` resuelve `author.user` |
| Neon Postgres (`neondb`) | ✅ PG 17.8 reachable | Query `SELECT version()` desde Node |
| Pusher Channels (app `2151265`, cluster `eu`) | ✅ Credenciales válidas | `GET /apps/{id}/channels` → HTTP 200 |
| Vercel project `liftoff-app-dev` | ✅ Conectado al repo, primer deploy verde | `gh api .../deployments` |
| Pencil MCP | ✅ Conectado, 8 vistas en `liftoff.pen` | `mcp__pencil__get_editor_state` |
| Playwright MCP | ✅ Conectado | `claude mcp list` |
| Neon MCP (remoto SSE) | ✅ Conectado vía OAuth | `claude mcp list` + `mcp__neon__*` cargados |
| `.env.local` | ✅ Con secrets, fuera de git | Aparece en gitignore, no en `git status` |
| `.env.local.example` | ✅ Plantilla committeada | En repo |
| `.gitignore` | ✅ Cubre `.env*`, `node_modules`, `.next`, etc. | En repo |

### Pendientes cosméticos (no bloquean)

- Hay un proyecto Vercel duplicado huérfano (sin sufijo `liftoff-app-dev`) que conviene borrar para que cada push no dispare dos builds.
- El status check de Vercel en el commit `138d1d3` quedó rojo como artefacto histórico (el email todavía no estaba enlazado cuando se ejecutó). Próximos commits salen verdes solos.
- Aún sin instalar (vendrán con el scaffold): Next.js, Tailwind, shadcn, Drizzle, Pusher SDKs, Playwright dependencies.

---

## Pasos de provisión (orden ejecutable)

### 1. Cuentas y servicios externos

Estos requieren acción humana (signup, billing, OAuth). El agente no los puede crear.

1. **GitHub**: crear repo `liftoff-dev` (privado).
2. **`gh auth login`**: si tienes varias cuentas en la misma máquina, ojo con la SSH key (ver gotcha §G1).
3. **Neon**: crear proyecto, copiar `DATABASE_URL` (pooled). El UNPOOLED se deriva quitando `-pooler` del host (ver §G2).
4. **Pusher**: crear app en cluster `eu`, copiar `app_id`, `key`, `secret`, `cluster`.
5. **Vercel**: *Add New Project → Import Git Repository → liftoff-dev*. **Solo una vez** (ver §G3).
6. **Verificar email de commit**: el email con el que commiteas tiene que estar en https://github.com/settings/emails. Si no, los integrations (Vercel etc.) no atribuyen los commits.

### 2. Repo local + secrets

```bash
cd liftoff/
git init -b main
git remote add origin https://github.com/<owner>/liftoff-dev.git   # HTTPS, no SSH (ver §G1)
```

Crear `.env.local.example` (committeado, sin valores) y `.env.local` (NO committeado, con valores reales):

```
DATABASE_URL=
DATABASE_URL_UNPOOLED=
PUSHER_APP_ID=
NEXT_PUBLIC_PUSHER_KEY=
PUSHER_SECRET=
NEXT_PUBLIC_PUSHER_CLUSTER=
HOST_PASSPHRASE=
HOST_COOKIE_SECRET=
```

`HOST_PASSPHRASE` se genera con `openssl rand -hex 16`.
`HOST_COOKIE_SECRET` (firma HMAC de la cookie de host) se genera con `openssl rand -hex 32`.

`.gitignore` mínimo:

```
node_modules/
.next/
out/
.env
.env.local
.env*.local
*.log
.DS_Store
playwright-report/
test-results/
.vercel/
```

Primer commit + push:

```bash
git add .gitignore .env.local.example mission.md CLAUDE.md README.md design/ docs/
git commit -m "chore: initial mission, conventions and design"
git push -u origin main
```

### 3. MCP servers en Claude Code

**No editar `~/.claude/mcp.json`** — ese archivo lo lee Claude Desktop, no Claude Code (ver §G4).

Para Claude Code, usar el CLI:

```bash
# Pencil y Playwright vienen pre-registrados en este entorno.
# Solo añadimos Neon (paquete stdio @neondatabase/mcp-server-neon está deprecado, ver §G5):
claude mcp add --transport sse --scope user neon https://mcp.neon.tech/sse
```

Después: **reiniciar Claude Code** (cerrar la sesión y abrir nueva). Al primer uso, Neon abrirá OAuth en el navegador. Autorizas y queda enganchado.

Verificar:

```bash
claude mcp list
# Esperado:
#   pencil: ... ✓ Connected
#   playwright: ... ✓ Connected
#   neon: https://mcp.neon.tech/sse (SSE) - ✓ Connected
```

### 4. Verificación end-to-end de credenciales

Antes de declarar el setup listo, ejecutar estas cuatro comprobaciones. Si alguna falla, **arreglar antes** de scaffoldear.

#### 4.1 Pencil — leer el diseño

Vía MCP en Claude Code:
```
mcp__pencil__open_document(path: ".../liftoff.pen")
mcp__pencil__get_editor_state(include_schema: true)
```
Esperado: 8 frames `01..08` con los nombres de las vistas de `mission.md §Vistas`.

#### 4.2 Neon — la DB responde

Sin psql instalado, lo más rápido es Node:
```js
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
console.log(await sql`SELECT version(), current_database(), now()`);
```
Esperado: `PostgreSQL 17.x`, db `neondb`, timestamp actual.

#### 4.3 Pusher — la app existe

Sin SDK, llamada directa con HMAC:
```js
import { createHmac } from 'node:crypto';
const path = `/apps/${APP_ID}/channels`;
const params = { auth_key: KEY, auth_timestamp: Math.floor(Date.now()/1000), auth_version: '1.0' };
const qs = Object.entries(params).sort().map(([k,v])=>`${k}=${v}`).join('&');
const sig = createHmac('sha256', SECRET).update(`GET\n${path}\n${qs}`).digest('hex');
const r = await fetch(`https://api-${CLUSTER}.pusher.com${path}?${qs}&auth_signature=${sig}`);
console.log(r.status, await r.text());
```
Esperado: HTTP 200, body `{"channels":{}}`.

#### 4.4 Vercel — deploy verde

```bash
gh api repos/<owner>/liftoff-dev/commits/main/status \
  --jq '.statuses[] | select(.context | startswith("Vercel"))'
```
Esperado: `state: success` para `Vercel – liftoff-app-dev`.

---

## Gotchas que ya nos costaron tiempo

### G1. SSH key apunta a otra cuenta GitHub

Si tienes varias cuentas (personal + work) y el `~/.ssh/config` resuelve a la cuenta equivocada, `git push` falla con `Repository not found` aunque el repo exista.

**Síntoma**:
```
$ ssh -T git@github.com
Hi <work-account>! ...
$ gh api user --jq .login
<personal-account>
```
Las dos cuentas no coinciden → el push SSH se autentica como work, que no tiene acceso al repo personal.

**Fix**: usar HTTPS con el credential helper de `gh`:
```bash
gh auth setup-git
git remote set-url origin https://github.com/<owner>/<repo>.git
```
HTTPS usa el token de `gh`, que sí está logado a la cuenta correcta.

### G2. Neon expone dos URLs (pooled vs unpooled)

El dashboard suele dar solo la pooled. Drizzle y otros ORMs **necesitan la unpooled para migraciones** (las pooled rompen con prepared statements de larga vida).

**Convención**: la unpooled es idéntica a la pooled pero **sin `-pooler`** en el host.

```
pooled:   ep-foo-123-pooler.eu-central-1.aws.neon.tech
unpooled: ep-foo-123.eu-central-1.aws.neon.tech
```

Guardar las dos en `.env.local`.

### G3. Vercel duplica proyectos si importas dos veces

Si haces "Import Git Repository" más de una vez (típico cuando el primer intento falla), Vercel crea dos proyectos enlazados al mismo repo. Cada push dispara dos builds.

**Síntoma** (vía GitHub):
```
gh api repos/.../deployments
# devuelve dos deployments por el mismo commit con environments distintos.
```
**Fix**: Vercel dashboard → Settings → Delete Project en el huérfano.

### G4. `~/.claude/mcp.json` ≠ Claude Code config

Existen al menos dos archivos con apariencia similar:
- `~/.claude/mcp.json` → **lo lee Claude Desktop**, no Claude Code.
- `~/.claude.json` → lo lee Claude Code (sección `mcpServers`).

Editar el primero no hace nada para el agente. Si `claude mcp list` no muestra un MCP que añadiste manualmente al JSON, estás editando el archivo equivocado.

**Fix**: usar siempre el CLI:
```bash
claude mcp add --transport <stdio|sse|http> --scope <local|user|project> <name> <url-or-cmd>
```

### G5. `@neondatabase/mcp-server-neon` (stdio) está deprecado

El paquete npm lanzaba sin error pero no exponía herramientas. El warning sale al hacer `--help`:
> *"This package is deprecated. Use the remote MCP server at mcp.neon.tech instead."*

**Fix**: usar el endpoint remoto SSE (`https://mcp.neon.tech/sse`) con OAuth. Ver §3.

### G6. Reiniciar Claude Code de verdad

Para que Claude Code recargue `~/.claude.json`, hay que **terminar el proceso** del agente (cerrar el chat y abrir uno nuevo). Cerrar la pestaña del IDE no siempre basta; un comando o REPL persistente puede seguir vivo.

### G7. Vercel CLI no persiste OAuth dentro del sandbox de Claude Code

`vercel login` (OAuth device flow) escribe credenciales en `~/Library/Application Support/com.vercel.cli/auth.json`, pero **el sandbox de cada Bash de Claude Code aísla ese path**: el `auth.json` queda con 3 bytes (`{}`) entre invocaciones. Resultado: cada `vercel <cmd>` re-lanza OAuth → se llena de pestañas y se acumulan tokens "Vercel CLI from <hostname>" basura en el dashboard.

**Síntoma**: el output de cada llamada empieza con `> No existing credentials found. Starting login flow...`, aunque la anterior haya completado el login.

**Fix**: usar un **Personal Access Token** (no el OAuth device flow):

1. Generar en https://vercel.com/account/settings/tokens (scope = el team que toca, expiry razonable).
2. Guardarlo en `.env.local` como `VERCEL_TOKEN=vcp_…` (no committear, no es env var del producto, no se sube a Vercel).
3. Pasarlo en cada llamada: `vercel <cmd> --token=$VERCEL_TOKEN` o `export VERCEL_TOKEN=...` y dejar que el CLI lo lea automáticamente.

Limpieza: en https://vercel.com/account/settings/tokens borrar todos los tokens "Vercel CLI from <hostname>" creados durante los intentos OAuth fallidos — no se reusan.

### G8. Subir env vars en bulk con `vercel env add`

La sintaxis nueva (CLI ≥ 53) requiere `--value` y `--yes` para no-interactivo. El `vercel env add` falla si el par `(KEY, ENV)` ya existe — hay que `rm` primero o saltar.

**Trampa de Preview**: para `preview`, el CLI exige el `<gitbranch>` como tercer argumento incluso en modo no interactivo. Si lo omites, devuelve `{"reason": "git_branch_required"}` y no tiene flag tipo `--all-preview-branches`. **Fix**: pasar `""` (string vacío) como tercer arg → aplica a todas las preview branches. Pasar `"*"` falla con `branch_not_found`.

**Patrón en bash** (con `VERCEL_TOKEN` exportado), lee cada KEY del `.env.local` y la sube a los 3 environments:

```bash
KEYS="DATABASE_URL DATABASE_URL_UNPOOLED PUSHER_APP_ID PUSHER_SECRET \
      NEXT_PUBLIC_PUSHER_KEY NEXT_PUBLIC_PUSHER_CLUSTER \
      HOST_PASSPHRASE HOST_COOKIE_SECRET"

for KEY in $KEYS; do
  VAL=$(grep "^${KEY}=" .env.local | head -1 | sed "s/^${KEY}=//")
  vercel env add "$KEY" production         --value "$VAL" --yes
  vercel env add "$KEY" preview         "" --value "$VAL" --yes   # "" = all preview branches
  vercel env add "$KEY" development        --value "$VAL" --yes
done
```

`source .env.local` no sirve porque las URLs de Neon llevan `&` (channel_binding) y el shell las parsea. Por eso `grep | sed` por línea.

Verificación: `vercel env ls` debe mostrar 24 entradas (8 vars × 3 envs). Luego ver §G9 para forzar redeploy.

### G9. Redeploy programático tras subir env vars

Subir env vars **no** dispara rebuild — el último deploy sigue construido sin esas vars. Tres opciones:

1. **Push vacío**: `git commit --allow-empty -m "trigger redeploy" && git push`. La integración Git de Vercel construye desde scratch.
2. **`vercel redeploy <url>`** (CLI): redeploy del último deployment **sin rebuild from scratch** (más rápido, mismo commit). Requiere pasar la URL exacta del deployment (la encuentras con `vercel ls <project>`).
3. **Botón "Redeploy"** en el dashboard (Project → Deployments → último → ⋯).

**Trampa de scope**: `vercel redeploy <url>` falla con `Error: Deployment belongs to a different team. Use vc switch...` aunque tu token sea válido. **Fix**: pasar `--scope <team-slug>` explícitamente:

```bash
vercel redeploy https://liftoff-app-XXXX-urielblanco-1278s-projects.vercel.app \
  --scope urielblanco-1278s-projects
```

(El team slug aparece en el output de `vercel teams ls`.)

**Verificación post-deploy**:

```bash
# Estado del deployment
vercel inspect <url> --scope <team> | grep status   # esperado: "● Ready"

# Health check rápido al alias de prod
curl -s -o /dev/null -w "HTTP %{http_code}\n" -L https://<project>.vercel.app/
```

**Listado útil**:
```bash
vercel ls <project>   # historial reciente con status (Ready/Error) y URLs
```

---

## Cleanup automático de jugadores que cierran pestaña

**Contexto**: Pusher Channels (no presence) no detecta automáticamente cuando un cliente cae. Sin un disparador explícito, los players quedan como "fantasmas" en el lobby tras cerrar pestaña, F5 o crash de browser.

**Solución implementada** (`stage-1-typing-v1+`):

- Endpoint idempotente `POST /api/room/[code]/leave` que borra al player de la DB y broadcastea `PlayerLeft` por Pusher.
- En el cliente, dentro de `JoinedView` (`src/app/play/play-client.tsx`):

  ```tsx
  useEffect(() => {
    const onHide = () => {
      navigator.sendBeacon(`/api/room/${code}/leave`);
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [code]);
  ```

**Por qué `pagehide` y no `beforeunload`**: `beforeunload` no es fiable en Safari/iOS y bloquea bfcache. `pagehide` se dispara siempre (cierre de pestaña, navegación a otra URL, refresh).

**Por qué `sendBeacon` y no `fetch`**: `fetch` se cancela en mid-flight cuando la página se descarga; `sendBeacon` está diseñado exactamente para este caso (el browser se compromete a entregar el POST aun después del unload).

**Trade-off aceptado**: un F5 también dispara `pagehide` → el player es removido y debe re-joinear. Si en el futuro queremos que el refresh sobreviva, hay que ir a heartbeat + TTL server-side (ver `progress.md` "decisiones pendientes"). Para la demo de la charla, F5-mata-player es aceptable.

---

## Cómo verificar deploys de Vercel sin el MCP de Vercel

Truco útil: **toda la información de Vercel se publica de vuelta a GitHub** vía sus APIs de deployments y commit statuses. Con `gh` autenticado tienes lectura completa sin instalar el MCP de Vercel.

```bash
# Lista de deployments del repo
gh api repos/<owner>/<repo>/deployments \
  --jq '.[] | {id, environment, ref, creator: .creator.login}'

# Estado de checks (incluye Vercel) para el HEAD
gh api repos/<owner>/<repo>/commits/main/status \
  --jq '{state, statuses: [.statuses[] | {context, state, target_url}]}'
```

Esto vale para Vercel, GitHub Actions, code scanning, y cualquier integración que postee statuses.

---

## Definition of Done del setup

El harness está "listo para scaffold" cuando todas estas son verdaderas:

- [x] `git push` al main funciona sin pedir credenciales.
- [x] El primer commit aparece atribuido a un user GitHub real.
- [x] Vercel deploy en verde (aunque sea el repo vacío con docs).
- [x] `mcp__pencil__get_editor_state` lista las 8 vistas.
- [x] Conexión SQL directa a Neon devuelve `version()`.
- [x] HMAC contra Pusher devuelve 200.
- [x] `claude mcp list` muestra `neon: ✓ Connected`.

A partir de aquí, el siguiente paso es construir el **starter** (scaffold de Next.js 15 con tokens de Tailwind del CLAUDE.md, shadcn init, Drizzle skeleton, Pusher lib stubs, Playwright config) y tagear `starter-rich-v1`.

---

## Inventario de starters previstos (post-build)

Cuando terminemos la pasada de referencia, evaluaremos qué starter habría dado one-shot:

| Tag | Contenido | Hipótesis |
|---|---|---|
| `starter-thin` | Solo `mission.md` + `CLAUDE.md` + `design/` + `.env.local` + `.gitignore` (= estado actual del repo) | Demasiado fino, el agente se atasca en boilerplate |
| `starter-medium` | Lo anterior + `pnpm create next-app` con TS+Tailwind | Probablemente tampoco — sin tokens ni libs |
| `starter-rich` | Lo anterior + tokens de Tailwind cargados + shadcn init + Drizzle config + Pusher lib + Playwright config + Vercel linked | Hipótesis: este es el techo realista para one-shot |
| `starter-prod` | Lo anterior + 4-5 componentes shadcn ya añadidos + primer schema Drizzle + un E2E smoke pasando | Probablemente over-prepared — pierde valor del experimento |
