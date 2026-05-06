# Tokens — charla "No es el prompt, es el entorno"

> Paleta de marca de Garaje (refresh 2026) que se usa en las slides.
> **No confundir** con los tokens space-neon de Liftoff (`CLAUDE.md`), que son solo para la demo en vivo.

---

## Filosofía

> *"Refresh de marca: paleta más neutra y elegante, manteniendo tonos secundarios que reflejan nuestra esencia. Base neutra 50/50 negro+blanco, con gamas cromáticas originales de Garaje para jerarquía, equilibrio y dinamismo. Evitamos un uso excesivo del color en las presentaciones."*

Regla práctica: **negro y blanco hacen el trabajo pesado**, el resto son acentos puntuales.

---

## Paleta principal (base 50/50)

| Token | Hex | RGB | HSL |
|---|---|---|---|
| `--color-black` | `#000000` | 0, 0, 0 | 0°, 0%, 0% |
| `--color-white` | `#FFFFFF` | 255, 255, 255 | 0°, 0%, 100% |

---

## Paleta secundaria (acentos + neutros extendidos)

### Rosa (acento de marca)

| Token | Hex | RGB | HSL |
|---|---|---|---|
| `--color-pink` | `#F67BBD` | 246, 123, 189 | 328°, 87%, 72% |
| `--color-pink-soft` | `#FFE7FB` | 255, 231, 251 | 315°, 100%, 95% |

### Neutros extendidos

| Token | Hex | HSL |
|---|---|---|
| `--color-paper` | `#F9F5F9` | 300°, 21%, 97% |
| `--color-gray-200` | `#D9D9D9` | 0°, 0%, 85% |
| `--color-gray-500` | `#989898` | 0°, 0%, 60% |
| `--color-gray-600` | `#7E7E7E` | 0°, 0%, 49% |

Total: **8 colores** (2 base + 2 rosa + 4 neutros).

---

## Uso recomendado en slides

> Pendiente de validar contra la guía completa cuando lleguen tipografías y reglas de layout.

- **Fondo por defecto**: `#FFFFFF` o `#000000`. Alternar entre slides de "concepto" (blanco) y "remate" (negro) para crear ritmo.
- **Cuerpo de texto**: `#000000` sobre blanco, `#FFFFFF` sobre negro. Evitar grises medios para texto principal.
- **Texto secundario / metadatos**: `#7E7E7E` sobre blanco; `#D9D9D9` sobre negro.
- **Acento rosa (`#F67BBD`)**: subrayados, números de capa, *call-outs* puntuales. **Una vez por slide como mucho.**
- **Rosa suave (`#FFE7FB`)** y **paper (`#F9F5F9`)**: fondos de bloques de cita o destacados, no para texto.
- **Grises 200/500**: separadores, bordes, ilustraciones del cocinero (sombreado).

---

## Tipografías

| Rol | Familia | Uso |
|---|---|---|
| Principal | **Inter** | Titulares, citas y body. La fuente que hace el trabajo pesado. |
| Secundaria | **IBM Plex Mono** | Textos secundarios, detalles, etiquetas, metadatos del chrome. |

Ambas en Google Fonts:
- https://fonts.google.com/specimen/Inter
- https://fonts.google.com/specimen/IBM+Plex+Mono

Pesos a cargar (mínimo): Inter 400/500/700 · IBM Plex Mono 400.

---

## Layout del slide (chrome)

Estructura observada en la guía:

```
┌──────────────────────────────────────────────────────────┐
│ Garaje.                              Título presentación │  ← header (Inter bold + Mono)
│ ────────────────────────────────────────────────────── │  ← hairline
│                                                          │
│                                                          │
│                  [contenido del slide]                   │
│                                                          │
│                                                          │
│ ────────────────────────────────────────────────────── │  ← hairline
│ DIGITAL FOR NONCONFORMISTS®   Subtítulo capítulo      6 │  ← footer (Mono)
└──────────────────────────────────────────────────────────┘
```

- **Header izquierda**: logo `Garaje.` (Inter bold).
- **Header derecha**: título de la presentación (IBM Plex Mono, tamaño pequeño).
- **Footer izquierda**: `DIGITAL FOR NONCONFORMISTS®` (Mono).
- **Footer centro**: subtítulo del capítulo (Mono).
- **Footer derecha**: número de página (Mono).
- **Hairlines** separando header/footer del cuerpo (1px, color del fg).

---

## Pendientes de la guía

- [ ] Tamaños de tipografía exactos (titular, subtítulo, body, caption).
- [ ] Márgenes y rejilla de slide.
- [ ] Logo Garaje en SVG (blanco / negro).
- [ ] Glifo `✱` — confirmar si es decorativo o tiene uso reservado.
