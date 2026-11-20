# FX Archive

A personal learning site that serves one visual effect each working day, to build
a precise vocabulary for the motion and image treatments used in brand identity
work. See [BRIEF.md](BRIEF.md) for the full brief.

## Running it

```bash
pnpm install
pnpm dev
```

| Command                                                           | What it does                               |
| ----------------------------------------------------------------- | ------------------------------------------ |
| `pnpm dev`                                                        | Dev server                                 |
| `pnpm build`                                                      | Static build into `build/`                 |
| `pnpm preview`                                                    | Serve the static build                     |
| `pnpm check`                                                      | Type-check the JSDoc types                 |
| `pnpm lint`                                                       | Prettier and ESLint                        |
| `pnpm test`                                                       | Unit tests                                 |
| `pnpm posters`                                                    | Re-render the archive posters              |
| `pnpm snippets`                                                   | Rebuild the copyable snippets              |
| `node scripts/type-scale.js > src/lib/styles/generated-scale.css` | Regenerate the fluid type and space tokens |

Posters and snippets are generated and committed. Re-run both after adding or
retuning an effect; `pnpm posters` drives headless Chromium, so it needs the
Playwright browser cache present.

## Seed running order

33 effects, about seven weeks of weekdays. Built so no two neighbouring days
share a collection, while every collection's entries land inside one fortnight.

| #   | Effect                    | Collection                           | Renderer |
| --- | ------------------------- | ------------------------------------ | -------- |
| 1   | Ordered dithering         | Dithering and quantisation           | canvas2d |
| 2   | Chromatic aberration      | Optical and lens                     | webgl    |
| 3   | Particle systems          | 3D and particles                     | three    |
| 4   | Pixelation                | Sampling and mosaic                  | canvas2d |
| 5   | Error-diffusion dithering | Dithering and quantisation           | canvas2d |
| 6   | Moire                     | Periodic structures and interference | webgl    |
| 7   | Raymarched metaballs      | 3D and particles                     | webgl    |
| 8   | Posterisation             | Dithering and quantisation           | canvas2d |
| 9   | Film grain                | Optical and lens                     | webgl    |
| 10  | ASCII art                 | Sampling and mosaic                  | canvas2d |
| 11  | Height-map relief         | Relief and dimensionality            | webgl    |
| 12  | Halftone                  | Print and screen                     | webgl    |
| 13  | Fluted glass              | Distortion                           | webgl    |
| 14  | Multiply and screen       | Compositing and blend modes          | canvas2d |
| 15  | Motion blur               | Blur                                 | webgl    |
| 16  | Risograph misregistration | Print and screen                     | canvas2d |
| 17  | Difference and exclusion  | Compositing and blend modes          | canvas2d |
| 18  | Noise warp                | Distortion                           | webgl    |
| 19  | Duotone                   | Print and screen                     | webgl    |
| 20  | Radial blur               | Blur                                 | webgl    |
| 21  | Feedback loops            | Compositing and blend modes          | webgl    |
| 22  | Grid interruption         | Interrupted systems                  | canvas2d |
| 23  | Flow fields               | Generative fields                    | canvas2d |
| 24  | Pixel sorting             | Digital and glitch                   | canvas2d |
| 25  | Echo and trails           | Echoes, tiles and repeats            | canvas2d |
| 26  | Reaction-diffusion        | Diffusion and growth                 | webgl    |
| 27  | Match cut                 | Motion cuts and transitions          | three    |
| 28  | Voronoi                   | Generative fields                    | webgl    |
| 29  | Datamosh                  | Digital and glitch                   | canvas2d |
| 30  | Scale-modulated grid      | Pattern and systems                  | canvas2d |
| 31  | Kaleidoscope              | Echoes, tiles and repeats            | webgl    |
| 32  | Dolly zoom                | Motion cuts and transitions          | three    |
| 33  | Impossible objects        | Impossible objects and illusion      | canvas2d |

## Layout

```
src/
  content/
    effects/<slug>.md    one entry: frontmatter plus four body sections
    schedule.js          the curated running order and the start date
  lib/
    effects/<slug>/      demo modules — plain JS, no site imports (see its README)
    components/          the site's Svelte components
    playground/          the host's clock and pointer tracking
    styles/              tokens, reset, base, generated type scale
    content/             build-time loader and frontmatter validation
    schedule.js          working-day date arithmetic
    storage.js           favourites and viewed state
    personal.svelte.js   the shared reactive mirror of that state
  generated/
    snippets/<slug>.js   built by scripts/snippets.mjs — do not edit
  routes/
    +page.svelte             the archive: search, collection and favourite filters
    effects/[slug]/          one page per effect
    today/                   client-side redirect to today's effect
    schedule.json/           prerendered, for the notification script
scripts/
  type-scale.js          the fluid type and space tokens
  posters.mjs            renders each demo to a static archive poster
  snippets.mjs           inlines each demo into one self-contained HTML file
  snippet/               the controls, CSS and loop inlined into every snippet
```

## The one rule that matters

Nothing in `src/lib/effects/<slug>/` may import Svelte, SvelteKit or site code.
The site imports demos; demos never import the site. That is what makes each
folder liftable into a client tool. See `src/lib/effects/README.md`.

## Deployment

Fully prerendered with `@sveltejs/adapter-static`, deployed to Vercel. Nothing in
v1 needs a server: today's effect is resolved client-side from the date.
