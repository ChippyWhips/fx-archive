---
slug: reaction-diffusion
name: Reaction-diffusion
synonyms:
  - Gray-Scott model
  - Turing patterns
  - morphogenesis patterns
collection: Diffusion and growth
tags:
  - generative
  - shader
oneLiner: Two simulated chemicals spread out and react with each other, and from nothing but those two rules grow the spots, stripes and mazes of animal markings and coral.
whatItIs: |
  Reaction-diffusion simulates two substances, usually called A and B, spread across a surface. Both diffuse, meaning they spread out and even out over time, but B diffuses more slowly than A. They also react: where B meets A it consumes it and makes more B. A is constantly topped up and B is constantly removed. Those few rules, run on a grid many thousands of times, settle into stable patterns that look grown rather than drawn: leopard spots, zebra stripes, fingerprints, brain coral, dividing cells.

  Alan Turing proposed the mechanism in 1952, in a paper on how an embryo could develop pattern from a uniform start, and these are still called Turing patterns. The specific system most people mean, and the one in this demo, is the Gray-Scott model, made famous for image making by John Pearson's 1993 map of its behaviours and by Karl Sims's tutorial. This is physical diffusion, the spreading of a substance, and has nothing to do with AI diffusion models.
renderer: webgl
motionDependent: false
controlsLayout: overlay
poster: /posters/reaction-diffusion.png
parameters:
  - name: Pattern
    what: A named pair of feed and kill rates. Each pair lands in a different region of the model's behaviour, so this is the choice between spots, stripes, mazes and worms.
    lock: lock
  - name: Feed
    what: How fast A is replenished. Together with kill this is the whole personality of the pattern, and a change in the third decimal place can switch it from spots to stripes or to nothing.
    lock: lock
  - name: Kill
    what: How fast B is removed. Higher kill starves the pattern into isolated spots; lower kill lets it spread into continuous labyrinths.
    lock: lock
  - name: Diffusion ratio
    what: How fast B spreads compared with A. Patterns only form when B is slower; push the ratio towards one and they dissolve.
    lock: lock
  - name: Grid cell
    what: How many screen pixels one simulation cell covers. This sets the physical scale of the pattern, and it is the one size control that does not change its character.
    lock: expose
  - name: Steps per second
    what: How fast the simulation runs. It changes the speed of growth, never the final pattern.
    lock: expose
  - name: Pointer seeds B
    what: Drops chemical B wherever the pointer moves or presses, so the pattern grows out from your marks.
    lock: lock
  - name: Edge softness
    what: How the concentration becomes ink. Near zero gives crisp, graphic shapes; higher values show the soft chemical gradient underneath.
    lock: expose
related:
  - voronoi
  - noise-warp
  - halftone
sources:
  - title: Reaction-diffusion tutorial
    url: https://www.karlsims.com/rd.html
    kind: tutorial
  - title: Reaction-diffusion system
    url: https://en.wikipedia.org/wiki/Reaction%E2%80%93diffusion_system
    kind: article
  - title: Xmorphia, the Gray-Scott parameter map
    url: https://mrob.com/pub/comp/xmorphia/
    kind: example
---

## How it works

The state is two numbers per grid cell, the concentrations of A and B, held in a float texture. Each step does two things. Diffusion: compare each cell with the weighted average of its eight neighbours, the Laplacian, and move it towards that average, A at full rate and B at half. Reaction: wherever both are present, an amount equal to A times B squared converts from A into B. Then a little A is fed in everywhere, scaled by how far A is from full, and a little B is removed.

That is the whole model, about six lines in the simulation shader. Because every cell only reads its immediate neighbours, the GPU runs every cell at once, and the demo runs that step around a thousand times a second, ping-ponging between two textures, one read and one written. The display pass then reads A minus B, upsamples it smoothly and thresholds it, so the edges are crisp at any screen resolution even though the simulation grid is coarser.

The feed and kill rates do almost all of the work. Pearson mapped this two-parameter plane and found a dozen distinct regimes packed into a tiny area, which is why the presets are numbers to four decimal places. Seeding matters too: a few small drops of B in a field of A is enough, and the pattern grows outwards until it fills the frame.

## Brand tool lens

The feed and kill pair is the identity, and it should never be a slider in a client tool. The space between good regimes is mostly patterns that die out, explode into noise or never settle. Lock each brand pattern to a named, tested pair, and if there is more than one, offer them as a choice of named presets.

Expose scale, through the grid cell size, and the seed, which changes where the pattern starts without changing what it becomes. That gives endless unique tiles that are all recognisably the same material. Edge softness is a reasonable third control, moving between graphic and organic.

Decide early whether the deliverable is the growing animation or a settled still. They are different products: the still needs a fixed step count so every export is equally mature, and the animation needs a fixed seed layout so it grows the same way each time. A brand pattern for textile or packaging also needs to tile, which this simulation does for free because its edges wrap.

## Easily confused with

**Voronoi** cells also look grown, but they have straight boundaries and come from a single geometric calculation, not a simulation. Reaction-diffusion has no straight lines anywhere.

**Cellular automata** like Conway's Game of Life also update a grid from its neighbours, but with discrete on and off states and hand-written rules. Reaction-diffusion is continuous, and its rules come from chemistry.

**Diffusion-limited aggregation** grows branching, fractal clusters as particles wander and stick. It produces coral-like branches, not the evenly spaced spots and stripes of a Turing pattern.

**Noise-based textures** can imitate the look, but noise has no preferred spacing. The tell of real reaction-diffusion is that every spot and every stripe sits at almost exactly the same distance from its neighbours.
