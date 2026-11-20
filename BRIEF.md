# Visual Vocabulary — Project Brief

5 November 2026 · Chris

Live version: https://claude.ai/artifact/D3bmH1eVFRV5hvuVt2chFW (this file is an export of it). Visual references are in `/references`; read `references/README.md` alongside the Visual direction section.

## Purpose

Build a personal, single-user learning site that serves one visual effect each working day, so I build a precise vocabulary for motion and image treatments used in brand identity work.

The end goal is professional. I want to design and deliver custom, rule-bound tools to clients so they can keep producing on-brand graphics. To do that I need to name effects precisely, know which parameters give each one its character, and know which of those to lock or expose in a tool.

Design principles:

- **Bite-size, not a catalogue.** One effect a day. The archive exists for browsing, but the daily drip is the product.
- **See it move.** Every demo animates by default. Many effects (chromatic aberration, motion blur, trails) only make sense in motion.
- **Vocabulary first.** Every entry teaches the correct name, its synonyms and a one-line description I could say to a client.
- **Portable demos.** Demo code should be readable and liftable into future client tools.

This brief is for Claude Code. Where something is marked as an open question, ask me before deciding.

## Scope

v1 is the site, about 30 seeded effects and the daily notification. The breakdown skill is phase 2.

**In v1**

- Archive home page, plus a `/today` redirect to the current weekday's effect
- One page per effect, with an embedded, interactive, animated playground
- Archive of every effect, browsable at any time, with served and favourite markers
- Favourites and viewed state stored in the browser, with JSON export and import
- Content and demos for about 30 seed effects drawn across the collections below
- A macOS notification at 09:30, Monday to Friday, that opens today's effect page when clicked

**Out of v1**

- Uploading my own images into demos (bundled sources only)
- Accounts, auth or any server-side storage
- Recipes (chaining several effects into one look), though the demo interface must allow it later
- The breakdown skill (phase 2, specified below)
- Recap or quiz days (possible later)

## Product

A simple index and child structure: the archive is the home page, each effect has its own page, and all personal state is held in the browser.

**Today's effect**

- There is no Today page. Today's effect is its own effect page, and the notification opens it directly.
- `/today` is a tiny client-side redirect to today's effect page, a bookmarkable shortcut for days the notification is missed.
- On Saturday and Sunday, "today" resolves to Friday's effect.

**Effect page (`/effects/[slug]`)**

- Every effect has its own URL. The page holds the full entry (see content model) and an embedded playground with its controls, so nothing opens elsewhere.
- Favourite toggle.
- Related effects as links.
- A home link back to the archive (the fixed "Archive" control; see Visual direction).

**Archive (`/`, the home page)**

- Every effect in the library, not just those already served.
- Grouped or filterable by collection; search by name and synonym.
- Per card: a static poster image (not a live canvas, to keep the page fast), name, collection, the date served in Geist Mono (blank if not yet served), and the favourite tick when favourited. No other icons.
- A filter for favourites only.
- Today's effect appears first, quietly marked as today.

**Selection logic**

- The order is a fixed, curated list in a `schedule` data file, plus a start date. It is not a shuffle computed at runtime, because a computed shuffle would reorder everything whenever an effect is added.
- Today's effect = the entry at index _(working days since start date)_. New effects are appended to the end, so past days never change.
- Order the seed list so neighbouring days come from different collections, while related effects within a family (for example ordered then error-diffusion dithering) land within the same fortnight.
- When the list runs out, wrap round to the start. Leave a hook for recap days later.
- Bank holidays are ignored; Monday to Friday only.

**Served, viewed and favourites**

- **Served** is derived, not stored: any effect scheduled on or before today has been served. This works on any device without storage.
- **Viewed** (opened the effect page) and **favourites** go in `localStorage` under one versioned key, for example `vv:v1`. Wrap every read and write in `try/catch`, and keep the site working if storage is unavailable.
- A small settings area offers **Export** (download JSON) and **Import** (upload JSON), as a backup in case the browser clears storage.
- IndexedDB and cookies are unnecessary at this size.

## Effect entry content model

Each effect is one Markdown file (via mdsvex) with frontmatter, in `src/content/effects/<slug>.md`, plus one demo module.

| Field             | Type                                      | Purpose                                                                                    |
| ----------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| `slug`            | string                                    | URL and schedule identifier                                                                |
| `name`            | string                                    | The correct, most widely used term                                                         |
| `synonyms`        | string[]                                  | Other names people use (for example "RGB split", "colour fringing")                        |
| `collection`      | string                                    | One primary collection (see backlog)                                                       |
| `tags`            | string[]                                  | Cross-cutting labels: `print`, `post-fx`, `motion-dependent`, `generative`, `3d`, `shader` |
| `oneLiner`        | string                                    | One plain sentence I could say to a client                                                 |
| `renderer`        | `canvas2d` \| `webgl` \| `three` \| `css` | What the demo uses                                                                         |
| `motionDependent` | boolean                                   | True when the effect is only legible in motion                                             |
| `controlsLayout`  | `overlay` \| `sidebar`                    | Placement of the playground controls (default `overlay`)                                   |
| `parameters`      | object[]                                  | Each: `name`, `what it does`, `lock or expose` suggestion                                  |
| `related`         | string[]                                  | Slugs of related or easily confused effects                                                |
| `sources`         | object[]                                  | 2–3 links: `title`, `url`, `kind` (article, tutorial, example, history)                    |
| `poster`          | string                                    | Path to static archive thumbnail                                                           |

The Markdown body has four short sections, about 250 words in total:

1. **What it is.** Plain-language description and where the name comes from.
2. **How it works.** The mechanism in a paragraph, with no more maths than helps.
3. **Brand tool lens.** Which parameters define the look, and which to lock or expose in a client-facing tool, with one example.
4. **Easily confused with.** How to tell it apart from its nearest neighbours.

Sources must be real, checked links that load. Prefer primary or authoritative sources: original papers or essays, well-known tutorials, Shadertoy, and print-process references. Good starting points to verify: The Book of Shaders, Inigo Quilez's articles, Tyler Hobbs's essays, The Nature of Code, Surma's "Ditherpunk" article and Codrops. Never invent a URL.

## Demo architecture and motion

Demos are plain HTML, CSS and JavaScript behind one shared interface. The site wraps them in a single Svelte component, but no demo depends on Svelte or any other framework.

**Module interface** (`src/lib/effects/<slug>/demo.js`)

```js
export const params = {
	threshold: { type: 'range', min: 0, max: 1, step: 0.01, default: 0.5, label: 'Threshold' },
	palette: { type: 'select', options: ['mono', 'duotone'], default: 'mono' }
};

export function create(canvas, initialParams) {
	// set up context, buffers, shaders
	return {
		update(nextParams) {}, // apply parameter changes
		frame(time, pointer) {}, // render one frame; pointer = { x, y, vx, vy, down }
		resize(width, height) {},
		destroy() {} // free GPU resources and listeners
	};
}
```

- The `params` schema drives auto-generated controls (range, select, toggle, colour), so no demo hand-builds its UI.
- The wrapper component owns the animation loop, pause/play, a speed control, pointer tracking (position and velocity), resizing via `ResizeObserver`, and teardown.
- Only one demo runs at a time. Pause it when it's off-screen (`IntersectionObserver`) or the tab is hidden.
- Keep demos readable. Comment the key lines that create the effect; these are learning material.
- Design the interface so a demo can later take another demo's output as its input texture (for recipes), but don't build chaining in v1.

**Portability (hard requirement)**

Every demo must be copyable into any project (React, Svelte, a custom tool, a plain page) and work as plain HTML, CSS and JavaScript.

- **One-way dependency.** Nothing in `src/lib/effects/<slug>/` imports Svelte, SvelteKit or site code. The site imports demos; demos never import the site.
- **Self-contained folders.** Each effect folder holds everything it needs: `demo.js`, any shaders, any demo CSS, and its own copies of small helpers (WebGL quad setup, pointer tracking, the animation loop). Duplicating a 40-line helper is an acceptable price for a folder you can lift whole.
- **Copyable snippet.** A build script inlines each effect's JavaScript, CSS and controls into one self-contained HTML snippet. The effect page shows it in a code panel with a copy button. Pasted into an empty HTML file or any project, it runs as is. There are no downloads and nothing to open elsewhere.
- **External libraries.** three.js comes from npm in the site and, in the copyable snippet, from a CDN via an import map, pinned to the same exact version.
- **Controls in the snippet.** The snippet includes a small vanilla `controls.js` that builds plain HTML inputs from the same `params` schema, so it behaves like the on-page playground.
- **Scoped CSS.** Demo CSS is scoped to a container class and uses its own custom properties. It never relies on the site's stylesheet.
- **Porting notes.** Each `demo.js` opens with a short comment explaining the lifecycle (`create` on mount, `update` on parameter change, `frame` per tick, `destroy` on unmount). It also notes how that maps to React `useEffect`, Svelte `$effect` and a plain page.
- **On the effect page.** The playground is embedded in the page itself. Below it, a code panel shows the copyable snippet, with a toggle to view just the `demo.js` module.

**Source material**

- Demos need something to act on. Use procedurally generated content (moving gradients, type, shapes, a simple 3D scene) or a small set of bundled CC0 images and one short CC0 video loop. Record each asset's licence in `static/sources/LICENSES.md`.
- Include bold type as a source option, since brand work often applies effects to wordmarks.

**Motion**

- Every demo animates by default. The source content moves even for "static" effects, so you see how the effect behaves over time.
- For `motionDependent` effects, tie the effect to movement. Chromatic aberration widens with pointer velocity, motion blur follows a moving object, and trails follow the cursor.
- Show a parameter's effect live as the slider moves; no apply button.
- Respect `prefers-reduced-motion` by starting paused with a clear play button, not by removing motion.

**Renderers**

- Canvas 2D for pixel-level effects where readability matters (dithering, pixelation, pixel sorting).
- Raw WebGL2 fragment shaders for post effects and distortion. A tiny shared helper sets up the full-screen quad, so each demo is mostly its shader.
- three.js for 3D, particles and the camera moves in the transitions collection.
- CSS for effects that are natively CSS (blend modes via `mix-blend-mode`, CSS filters), with a note on the CSS equivalent where one exists.

## Tech stack and conventions

SvelteKit (latest, Svelte 5 runes), fully prerendered, deployed to Vercel from a private GitHub repo.

- **Language:** JavaScript with JSDoc types, not TypeScript.
- **Framework:** latest SvelteKit with Svelte 5 runes (`$state`, `$derived`, `$effect`). Check the current docs rather than relying on memory.
- **Rendering:** prerender every route. Use `@sveltejs/adapter-vercel` or `adapter-static`; pick one and explain why. Today's effect is resolved client-side from the date, so the page is static.
- **Content:** mdsvex for effect entries. A build-time loader validates frontmatter and fails the build on missing fields, broken `related` slugs or a schedule entry with no effect.
- **Styling:** modern CSS, no Tailwind. Use custom properties for tokens, `@layer`, native nesting, container queries for archive cards, `:has()` where it simplifies things, `color-mix()` and `light-dark()` for themes, and fluid type with `clamp()`.
- **Dependencies:** keep them minimal. three.js only where a demo needs it, loaded only on those pages. No UI kits.
- **Spelling:** British English in all copy (colour, visualise, favourite).
- **Static endpoint:** prerender `/schedule.json` (start date plus ordered slugs and names), so the notification script can name today's effect.
- **Visual design of the site itself:** see Visual direction below.
- **Accessibility:** follow best practice by default: semantic HTML, keyboard-operable controls, a label on every control, visible focus, and reduced motion handled as described above. This is a personal tool for one user with no specific accessibility needs, so where best practice would compromise the design (for example, contrast on deliberately subtle grey text), the design wins. Note any such trade-off in a code comment rather than blocking on it.

## Visual direction

Highly minimal, with strict alignment: the demos and content carry the visual interest, and the interface stays out of the way. My visual references are listed below (images in `/references`) and take precedence over anything else in this section.

**Do**

- Align everything to one strict grid; no element sits off it.
- Use generous whitespace and a restrained type scale. Typefaces: Geist for titles and body copy, Geist Mono for metadata values, numerical values and links. Both are open source (SIL Open Font Licence); self-host the variable WOFF2 files rather than loading them from a third-party CDN.
- The favourite toggle is a plus (+) that switches to a tick once favourited. It is never a heart or a bookmark. Use the same stroke as other icons, keep any transition minimal, and expose state with `aria-pressed` and a text label for screen readers.
- Keep the interface palette neutral; colour comes from the demos.
- Keep iconography to an absolute minimum. Where an icon is needed, it is thin and line-based, on a consistent grid with one uniform stroke (for example 1px on a 16px grid), and drawn as inline SVG. The words to design to are precision and refined. Collection names are plain text.
- The interface is text-based. Mixing icons with text breaks visual alignment, so the only icons are the favourite plus/tick and the archive chevron. Both use the same thin, precise stroke.
- Primary actions use oversized, fully rounded (pill) buttons with generous padding and a text-only label. Secondary actions are plain text.
- **Theme toggle:** light and dark modes, switched by a tiny text-based control fixed in the top-right corner. It reads "Light Dark" in Geist Mono, with a small dot beside the active option, inside a fully rounded container with generous padding. It follows the system preference until used, then remembers the choice in `localStorage`.
- **Archive link:** on effect pages only, a fixed text link reading "Archive" sits top centre, offset slightly from the top edge. A small, precise left-facing chevron sits before the text, and the link has the same rounded container as the theme toggle. The home page has no navigation beyond the theme toggle.
- Both fixed controls sit on a solid surface (no blur or translucency) so they stay legible over any effect. The effect page title keeps a fluid top and bottom margin, so it clears the archive link at every viewport size and holds the page's vertical rhythm.

**Type and spacing**

Main content scales fluidly between 375px and 2560px viewports and stays fixed outside that range. Small interface text and spacing within components use fixed values.

- **Fluid type:** headings and body copy (the handful of main text styles) use `clamp()`, scaling fluidly between a set of breakpoints from 375px to 2560px (see breakpoint-based scaling below).
- **Accessible clamping:** every fluid value combines `rem` with `vw` and has `rem` bounds, so text still responds to browser zoom and user font-size settings. Pure `vw` sizing fails WCAG 1.4.4 (resize text).
- **Fixed type:** metadata, controls and core navigation are fixed at about 14px, set as `0.875rem` so they still respect user font-size settings.
- **Fluid spacing for layout:** page margins, grid gutters, section gaps, title margins and vertical rhythm use fluid space tokens on the same 375–2560px range.
- **Fixed spacing within content:** gaps between individual pieces of content (a label and its value, rows and controls inside a panel, button padding) use a fixed scale, for example 4, 8, 12, 16, 24 and 32px.
- **Tokens:** define both scales once as custom properties (for example `--step-0…--step-5` for type, `--space-fluid-*` and `--space-*` for spacing). Components never use raw values.
- **Breakpoint-based fluid scaling:** define a target size for each text style at each key breakpoint (suggested 375, 768, 1440 and 2560px; propose and confirm), and interpolate fluidly between neighbouring breakpoints with a separate `clamp()` per range, set in media queries. Each range must start exactly where the previous one ended, so there are no jumps. This gives designed sizes at common widths and smooth scaling in between, rather than one straight line from 375 to 2560.
- **Measure in `ch`:** wherever a paragraph or heading needs a maximum width, set it in `ch`. Because `ch` is relative to the element's own font size, the measure scales with the fluid type and the line breaks stay under control. Suggested starting points: body copy 60–70ch, the overview text 50–60ch, headings by eye per style.
- **Calibrate `ch` for Geist:** `ch` is the width of the "0" glyph, not an average character, and uppercase titles run wider than that. Tune each style's value visually rather than treating it as an exact character count.
- **Wrapping:** use `text-wrap: balance` on headings and titles, and `text-wrap: pretty` on paragraphs, to avoid widows and ragged single-word lines.
- **Vertical alignment:** where large type must sit precisely on the grid, use `text-box: trim-both cap alphabetic` to remove the extra space above and below the letters. Treat it as progressive enhancement, since browser support is still incomplete, and check alignment holds without it.
- **Tracking:** the larger the heading, the tighter the tracking. Body copy stays at the default. Set `letter-spacing` in `em` so it scales with fluid sizes, and tie each heading's value to its step, for example about −0.04em for the largest title, easing towards 0 for smaller headings.
- **Line height:** set as unitless values (`1.1`, `1.4`), never px or %. Headings 0.95–1.1, tighter as they get larger; body copy 1.3–1.5, depending on use and measure.
- **Small uppercase labels:** small uppercase text usually needs slight positive tracking (about +0.02 to +0.05em) to stay legible. This is Claude's suggestion; confirm with me.

```css
/* 16px at 375px → 22px at 2560px */
--step-0: clamp(1rem, 0.9356rem + 0.2746vw, 1.375rem);
```

**Don't**

- No eyebrow labels (small uppercase text above headings).
- No pill or tag chips, including slash-separated tag rows.
- No purple or violet accents, and no "AI" gradient palettes.

Also avoid other common AI-generated design tropes, unless my references say otherwise. These were added by Claude; confirm with me:

- gradient blobs or glows behind content
- glassmorphism
- emoji used as icons
- gradient text
- rounded, drop-shadowed cards as the default container
- centred hero sections with a tagline and two buttons

**References**

Visit or open each reference and study it before proposing directions. Take the qualities listed, not the layout, content or branding. Per-image notes are in `references/README.md`.

| Reference                                                                                                                                                                                                                                | What to take from it                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Museum Department — Projects](https://museumdepartment.com/projects)                                                                                                                                                                    | The general look and feel: super minimal, tight grid alignment, a simple typographic structure with well-chosen type, and intentional whitespace. Especially relevant to the archive (home) page as an index of items. |
| Museum Department — single project page (`references/do/01`)                                                                                                                                                                             | The structure for each effect page; see "Effect page layout" below.                                                                                                                                                    |
| Five control-panel screenshots (`references/do/02–06`): radial tick diagram with accordion list, light panel with hairline sliders and dials, light panel with pill buttons, light component sheet, dark generator with grouped controls | The direction for playground controls; see "Playground controls" below.                                                                                                                                                |
| Three "what not to do" control-panel screenshots (`references/dont/01–03`): dense default-widget panel, all-mono uppercase panel, rounded grey component panel                                                                           | What to avoid; see "Avoid" under Playground controls.                                                                                                                                                                  |

**Effect page layout** (from the project page reference)

The reference uses a four-column grid with a narrow outer margin of about 32px at desktop width. Every block below starts on a column line.

1. **Title.** The effect name in Geist at a heavy weight, uppercase, very large, centred, with tight leading (about 0.95), wrapping across lines. Large whitespace above and below.
2. **Information row.** Three blocks side by side:
   - **Column 1, metadata:** favourite (the plus/tick toggle), date served, collection and tags.
   - **Column 2, related details:** synonyms, renderer and related effects as links.
   - **Columns 3–4, overview:** the one-liner and "What it is", in Geist at a larger size and light weight. Later paragraphs use a first-line indent rather than extra space.
3. **Labels and values.** Metadata labels are small, uppercase Geist in semibold or bold, in the main text colour; values beneath are in Geist Mono, in grey. Tags and synonyms are plain lines of monospace text, never pills.
4. **Playground.** Where the reference places its lead image: full width within the outer margins, after generous whitespace. Controls sit in a panel inside the playground; see Playground controls below.
5. **Remaining sections.** "How it works", "Brand tool lens", "Easily confused with", then the code panel and sources, all on the same grid.

These small uppercase labels are field labels in a metadata block, which is allowed. The "no eyebrows" rule bans small labels sitting above headings or section titles.

Links, including those within body text, are set in Geist Mono and grey rather than underlined or coloured.

**Playground controls**

Every demo uses one shared control system that is precise, calm and quick to scan. Hierarchy comes from type, spacing and contrast, never from boxes and colour.

_Placement_

- **Default:** a solid panel overlaid in the top-right of the playground, with a large radius and set apart from the canvas by tone alone. It collapses and expands with a plain text control ("Hide controls" / "Show controls").
- **Sidebar fallback:** if a demo's focal point would sit under the panel, that demo uses a sidebar instead, with controls in column 1 and the canvas across columns 2–4. Set this per demo with the `controlsLayout` field.
- **Narrow screens:** below the tablet breakpoint, controls sit beneath the canvas.

_Structure_

- **Groups:** controls are in named groups. Group titles are in Geist, a step larger or heavier than row labels.
- **Rows:** the label sits on the left in Geist and the value is right-aligned in Geist Mono. **Mono is for values only**, never for labels, group titles or helper text.
- **Two alignment edges:** each panel has just two edges, the labels' left edge and the values' right edge. Every control spans between them, and every row is the same height.
- **Spacing:** hairline (1px) dividers between groups, generous padding inside the panel, and the fixed spacing scale between rows.
- **Helper text:** Geist, sentence case, grey, one line at most, and only where it's genuinely needed.

_Controls_

- **Sliders:** a 1px track with a heavier fill for the active portion, and a minimal thumb or none. The value is always shown.
- **State:** inactive or default-value rows are dimmed; state is shown by contrast, not colour.
- **Instrument-style inputs** where they fit: tick-mark rulers, dragging the value itself to scrub it, +/− steppers, and rotary dials for angles.
- **Choices:** text-based segmented options, with the active option marked by contrast or the small dot used in the theme toggle. Use small rectangular toggles, not round switches.
- **Colour:** a swatch plus the hex value in mono.
- **Primary actions** (for example Replay or Reset): pill buttons with text only. All other actions are plain text.
- **Colour use:** monochrome. Whether to allow one sparing accent is an open question.
- **Focus:** visible, high-contrast and neutral, not a blue ring.
- **Native elements:** keep native inputs underneath for accessibility, but restyle them fully (`appearance: none`) so no OS default styling shows.

_Avoid_ (from the "what not to do" references)

- Default OS widgets: native selects, checkboxes and ×-style ticks.
- Dense, cramped rows with several competing alignment columns, which make a panel slow to scan.
- Mono or uppercase for everything. When labels, headings and helper text are all mono, the hierarchy flattens and the panel can't be chunked.
- Bordered boxes around every control and option.
- The generic design-system look: filled grey input boxes, several stacked grey layers, soft rounding on every element, default chevron dropdowns, blue focus rings, and an app-style header with an icon and close button. Rounding is for the panel and primary buttons only, and use two surface tones at most (panel and canvas).

## Collections, backlog and seed list

The library has 18 collections and a backlog of about 110 effects. v1 ships with 33 seed effects, about seven weeks of weekdays.

Two structural decisions:

- **"Post FX" is a tag, not a collection.** Halftone, duotone, pixelate, RGB shift and threshold colour each have a natural home; the `post-fx` tag gathers them in the archive.
- **Blend modes are grouped by family**, one entry per family rather than one per mode. They are easier to learn as darken/lighten, contrast, inversion and component.

| Collection                           | Backlog (not exhaustive)                                                                                                                                                    | v1 seed                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Print and screen                     | Halftone (AM screening), dot grid, stochastic (FM) screening, risograph misregistration, duotone, threshold colour, overprint, screen print, linocut/woodcut                | Halftone, risograph misregistration, duotone                  |
| Dithering and quantisation           | Ordered (Bayer) dithering, error diffusion (Floyd–Steinberg, Atkinson), blue-noise dithering, posterisation, palette quantisation                                           | Ordered dithering, error-diffusion dithering, posterisation   |
| Sampling and mosaic                  | Pixelation, ASCII, mosaic sampling, dot-matrix/LED, scanlines                                                                                                               | Pixelation, ASCII                                             |
| Distortion                           | Bulge/pinch, displacement map, fluid warp, fluted (reeded) glass, noise warp, ripple, twirl, barrel/lens distortion, polar coordinates                                      | Fluted glass, noise warp                                      |
| Blur                                 | Gaussian, directional/motion blur, radial (zoom) blur, spin blur, repeat/step blur, tilt-shift, bokeh/depth of field                                                        | Motion blur, radial blur                                      |
| Optical and lens                     | Chromatic aberration/RGB shift, bloom, halation, film grain, vignette, anamorphic flare, light leak                                                                         | Chromatic aberration, film grain                              |
| Digital and glitch                   | Pixel sorting, datamosh, CRT, compression artefacts, bit-crush, channel swap, slit-scan                                                                                     | Pixel sorting, datamosh                                       |
| Compositing and blend modes          | Darken/lighten (multiply, screen), contrast (overlay, soft light), inversion (difference, exclusion), component (hue, colour, luminosity), masking/knockout, feedback loops | Multiply and screen, difference and exclusion, feedback loops |
| Echoes, tiles and repeats            | Echo/trails, step and repeat, mirror/kaleidoscope, Droste (recursive) effect, Truchet tiles, wallpaper groups, offset/slip tiling                                           | Echo and trails, kaleidoscope                                 |
| Periodic structures and interference | Moiré, line gratings and op art, interference patterns, lenticular, guilloche                                                                                               | Moiré                                                         |
| Interrupted systems                  | Order and disorder (after Vera Molnár), grid interruption, rhythm breaks, controlled randomness, glitched pattern                                                           | Grid interruption                                             |
| Pattern and systems (composition)    | Repetition and rhythm, proximity and grouping, scale modulation, contrast modulation, shape interpolation, modular grids, Gestalt continuity                                | Scale-modulated grid                                          |
| Relief and dimensionality            | Emboss/bevel, height-map and normal-map lighting, extrusion, contour/topographic lines, isometric projection, blind emboss                                                  | Height-map relief                                             |
| Impossible objects and illusion      | Penrose triangle, impossible staircase, Escher-style tessellation, ambiguous figures (Necker cube), anamorphosis, forced perspective                                        | Impossible objects                                            |
| Diffusion and growth                 | Reaction–diffusion, diffusion-limited aggregation, ink bleed, cellular automata                                                                                             | Reaction–diffusion                                            |
| Generative fields                    | Flow fields, Voronoi/Delaunay, Perlin/simplex noise fields, metaballs, L-systems, circle packing                                                                            | Flow fields, Voronoi                                          |
| 3D and particles                     | Particle systems, point clouds, raymarched SDFs, mesh displacement, instancing, curl-noise GPU particles                                                                    | Particle systems, raymarched metaballs                        |
| Motion cuts and transitions          | Match cut, jump cut, smash cut, whip pan, pan/tilt, dolly, dolly zoom, truck, crane, wipe, iris, mask reveal, morph cut, cross-dissolve, push/slide                         | Match cut, dolly zoom                                         |

**Motion cuts and transitions need an adapted template.** They're editing and camera grammar rather than image processing, so:

- "Parameters" become timing, duration and easing.
- The demo is a three.js or 2D scene with two shots and a replay button.
- The brand tool lens becomes "how to brief it to an editor or motion designer".

**Diffusion means simulated and physical diffusion processes**: reaction–diffusion, ink bleed and related growth processes such as diffusion-limited aggregation. AI diffusion-model aesthetics are out of scope.

## Daily macOS notification

A launchd user agent fires at 09:30 Monday to Friday and posts a native notification; clicking it opens today's effect page.

- **Scheduler:** a LaunchAgent plist in `~/Library/LaunchAgents/` with `StartCalendarInterval` set to an array of five entries (Weekday 1–5, Hour 9, Minute 30). If the Mac is asleep at 09:30, launchd runs the job on wake, which is the behaviour I want.
- **Script:** a small shell or Node script fetches `/schedule.json`, works out today's effect name, and posts the notification, for example "Today: Fluted glass". If the fetch fails, fall back to a generic message.
- **Notifier:** a plain AppleScript `display notification` can't open a URL when clicked. Use a notifier that supports a click action (for example `terminal-notifier` with `-open`). Check it works on current macOS first, and propose an alternative if it doesn't.
- **Click target:** today's effect page (`/effects/<slug>`), opened in the default browser. If the schedule fetch fails, open the archive instead.
- **Repo layout:** keep the plist, script and an `install.sh` and `uninstall.sh` in `/notify` in the repo, with a short README. The site URL is set in one place.
- **Testing:** include a way to fire the notification on demand without waiting for 09:30.

## Breakdown skill (phase 2)

The breakdown skill is a Claude skill that takes a screenshot or clip of a look I admire and names the likely techniques in my library's vocabulary. Its purpose is learning to articulate, not perfect accuracy, and it should never help copy the work.

**Input**

- One or more images, or a short video clip.
- An optional line from me describing anything the frames can't show ("it snaps, then settles").

**Video handling**

Claude reads frames, not video, so the skill uses ffmpeg to produce:

- a contact sheet of evenly spaced frames
- difference frames between consecutive samples, which isolate what moved

The skill should say plainly that timing and easing are approximate.

**Output, in this order**

1. **What I'm seeing.** A plain-language description of the image or motion.
2. **Likely techniques.** Two or three candidates, each with a confidence level and the visual tells that point to it. Include how to tell close candidates apart (for example shader halftone versus scanned risograph).
3. **Probable parameters.** For example: "coarse cell size, 45° screen angle, two-colour palette".
4. **How I'd describe it to a client.** One sentence.
5. **Library entries.** Links to matching entries on the site, using `/schedule.json` or a prerendered `/effects.json` index, so the vocabulary stays consistent.
6. **Further examples.** Two to four web links to good examples or tutorials for each technique, found by searching at run time.

**Deliverable:** a `SKILL.md` plus any helper script (the ffmpeg frame extraction), in `/skill` in the repo, with install instructions.

## Phases, acceptance criteria and open questions

Build in five phases, and check in with me at the end of each one.

1. **Foundations.** SvelteKit scaffold, content loader with validation, schedule logic, the demo wrapper and module interface, and three reference demos, one per renderer (ordered dithering in Canvas 2D, chromatic aberration in WebGL, particle systems in three.js). Propose two visual directions for the site, within the Visual direction rules and based on my references.
2. **Site.** Archive (home) and effect pages, the `/today` redirect; favourites, viewed state, and export and import.
3. **Seed content.** The remaining 30 seed effects, built in batches of about six, each batch spanning several collections. Verify every source link loads.
4. **Notification.** LaunchAgent, script and installer in `/notify`; tested on demand.
5. **Breakdown skill.** Skill and frame-extraction helper in `/skill`.

**Done means**

- [ ] The site builds with zero frontmatter validation errors and deploys to Vercel as a fully static site.
- [ ] Today's effect is correct for any weekday and holds Friday's effect over the weekend; adding an effect never changes a past day.
- [ ] Every seed entry has all fields, four body sections, 2–3 working sources and a running demo.
- [ ] Every demo animates by default, has pause and speed controls, and starts paused under reduced motion.
- [ ] Archive cards use static posters; only one live demo runs at a time.
- [ ] Favourites and viewed state survive a reload, and export and import round-trip correctly.
- [ ] The notification appears at 09:30 on weekdays, names the effect, and opens today's effect page when clicked.
- [ ] All copy uses British English.
- [ ] Every effect's copyable snippet runs when pasted into an empty HTML file, with no build step or site code.
- [ ] No file in an effect folder imports Svelte, SvelteKit or site code.
- [ ] The site breaks none of the Visual direction rules.

**Open questions (ask me)**

- `adapter-vercel` or `adapter-static`.
- Final order of the seed schedule. Propose it, and I'll approve it before phase 3.
- The start date for the schedule (default: the first weekday after deployment).
- Whether playground controls allow one sparing accent colour, or stay fully monochrome.
- Case for control labels: sentence case, or small uppercase to match the metadata labels.
- Positive tracking on small uppercase labels (Claude's suggestion).
- The type breakpoints (suggested 375, 768, 1440 and 2560px) and target sizes per style.
