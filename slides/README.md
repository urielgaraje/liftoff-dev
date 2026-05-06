# Slides — *No es el prompt, es el entorno*

Charla de ~30 min sobre cómo se construye software con IA en 2026: las cuatro capas (prompt → context → harness → agentic). Hecha con [Slidev](https://sli.dev/).

## Comandos

Desde esta carpeta (`slides/`):

```bash
pnpm install          # solo la primera vez
pnpm dev              # arranca el dev server en http://localhost:3030
pnpm build            # build estático en ./dist (para subir a Vercel/Netlify)
pnpm export           # PDF de backup en ./slides-export.pdf
```

## Para presentar en directo

1. `pnpm dev` y abre `http://localhost:3030/`.
2. **`f`** → pantalla completa.
3. **`→ / espacio`** → siguiente · **`←`** → atrás · **`o`** → overview.
4. Modo presenter (con notas + reloj, en otra ventana): `http://localhost:3030/presenter/`.

El dropdown lateral del menú no aparece por defecto en modo público. Si sale, ciérralo con click fuera o `Esc`.

## Estructura

```
slides/
├── slides.md           Contenido + frontmatter de cada slide
├── styles/index.css    Tokens Garaje, tipografía, layouts custom
├── layouts/            Layouts Vue (cover, garaje)
├── components/         GarajeFrame.vue (chrome header/footer)
└── public/memes/       Imágenes del slide intro y final
```

## Mapa de slides

| # | Slide | Tono |
|---|---|---|
| 1 | Memes intro (rompehielos) | light |
| 2 | Portada — *No es el prompt, es el entorno* | dark |
| 3 | Plan del talk | light |
| 4 | Prompt verbatim de Liftoff | dark |
| 5 | LIVE — lanzando agente | dark |
| 6 | Las cuatro capas (matrioska) | light |
| 7 | Capa 1 · La pregunta | light |
| 8 | Capa 1 · El techo (frase mágica matemática) | dark |
| 9 | Capa 2 · El onboarding | light |
| 10 | Capa 2 · Filling the window (cita Karpathy) | dark |
| 11 | Capa 3 · El puesto de trabajo | light |
| 12 | Capa 3 · 1.300 PRs (Stripe) | dark |
| 13 | Capa 4 · El tech lead | light |
| 14 | Capa 4 · 80% en un mes (Karpathy) | dark |
| 15 | Cita Karpathy (cierre filosófico) | dark |
| 16 | Volvamos al agente + memes finales | dark |

## Tokens y branding

Paleta y tipografías de Garaje (refresh 2026): documentado en `../docs/talk/tokens.md`.

- **Negro / Blanco** base 50/50.
- **Rosa** `#F67BBD` como acento (una vez por slide como mucho).
- **Inter** para titulares, body y labels secundarios.
- **IBM Plex Mono** para chrome (Garaje. / footer) y bloques de código / prompts.

## Memes

Ver `public/memes/README.md` para la lista de imágenes y dónde aparecen.
