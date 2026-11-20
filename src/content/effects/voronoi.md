---
slug: voronoi
name: Voronoi diagram
synonyms:
  - Voronoi tessellation
  - Dirichlet tessellation
  - Thiessen polygons
  - cellular noise
  - Worley noise
collection: Generative fields
tags:
  - generative
  - shader
oneLiner: Scatter some points, give each one the territory that is closer to it than to any other, and the plane breaks into cells like cracked mud or a giraffe's coat.
whatItIs: |
  A Voronoi diagram starts with a set of points, called sites. Every location on the plane belongs to whichever site is nearest, and the boundaries fall exactly halfway between neighbouring sites. The result is a tiling of convex cells, one per site, with straight edges and corners where three cells meet. Nature arrives at the same structure whenever things grow outwards from separate centres at the same rate and stop where they meet: dried mud, soap foam, leaf veins, the scales of a crocodile's head.

  The diagram is named after Georgy Voronoi, who formalised it in 1908, though Descartes sketched the idea and John Snow used it in 1854 to map cholera deaths to the nearest water pump. In computer graphics the same calculation, read as a distance rather than a cell, is Worley or cellular noise, the basis of most procedural stone, water caustic and organic textures.
renderer: webgl
motionDependent: false
controlsLayout: overlay
poster: /posters/voronoi.png
parameters:
  - name: Cells across
    what: The density of sites. It sets the scale of the pattern and how it reads, from a few bold shapes to a fine crackle.
    lock: expose
  - name: Jitter
    what: How far each site may stray from its grid position. At zero the cells are squares; at one they are fully irregular. Between the two is a loose, hand-made grid that is often the most useful setting.
    lock: lock
  - name: Site motion
    what: How fast the sites wander. Moving sites make the cells swell, shrink and trade edges, which is the clearest way to understand the diagram.
    lock: expose
  - name: Distance
    what: The way nearness is measured. Euclidean gives the familiar organic cells; manhattan gives 45 degree facets; chebyshev gives stepped, axis-aligned cells. It changes the visual language entirely.
    lock: lock
  - name: Render
    what: What is drawn from the same calculation. Flat fills, edges only, the distance field as a gradient, or the crackle of F2 minus F1.
    lock: lock
  - name: Edge width
    what: The thickness of the boundaries. Thin edges read as a map; thick ones turn the cells into separate pebbles.
    lock: expose
  - name: Show sites
    what: Marks the seed points. Essential for learning, almost always off in a deliverable.
    lock: lock
  - name: Pointer adds a site
    what: Adds one live site under the cursor, so you can watch its neighbours give up territory as it moves.
    lock: lock
related:
  - flow-fields
  - reaction-diffusion
  - raymarched-metaballs
sources:
  - title: Voronoi diagram
    url: https://en.wikipedia.org/wiki/Voronoi_diagram
    kind: article
  - title: The Book of Shaders, Cellular noise
    url: https://thebookofshaders.com/12/
    kind: tutorial
  - title: Worley noise
    url: https://en.wikipedia.org/wiki/Worley_noise
    kind: history
---

## How it works

The direct approach is to compare every pixel against every site, which is slow and scales badly. The trick used here, from Steven Worley's 1996 cellular texture paper, is to place exactly one site in each square of a grid, offset by a random amount. Any pixel's nearest site is then guaranteed to be in its own grid square or a nearby one, so each pixel checks a small neighbourhood and the cost stays constant however many cells there are.

While it searches, the shader keeps two numbers: F1, the distance to the nearest site, and F2, the distance to the second nearest. F1 alone is cellular noise, dark at each site and brightening outwards. F2 minus F1 is zero exactly on a boundary, so it doubles as a cheap edge detector and gives the crackle look. For even edge widths in the euclidean case, a second pass measures the true distance to each bisector between the nearest site and its neighbours.

Swapping the distance function is a one-line change with a large visual effect. Manhattan distance sums the horizontal and vertical offsets, so boundaries run at 45 degrees; chebyshev takes the larger of the two, so cells become stepped rectangles.

## Brand tool lens

Voronoi is distinctive for one reason: the boundaries are always exactly halfway between sites. That gives it an engineered regularity inside its randomness, and the parameters that preserve that read are the ones to protect. Lock the distance metric and the render mode, since each one is effectively a different visual identity. Lock jitter at a chosen value too: it is the line between a grid and a growth pattern, and the brand should sit on one side of it deliberately.

Expose density and edge width, ideally as a few named steps rather than free sliders, plus a seed control for variation. Site motion is worth exposing for animated assets, kept slow; fast motion makes cells pop in and out in a way that reads as a glitch.

A practical example: a packaging system that fills each panel with Voronoi cells in the brand's three tones. Lock the metric, jitter, edge width and palette; expose the seed and two density presets. Every pack is then unique and every pack is clearly from the same family.

## Easily confused with

**Delaunay triangulation** is Voronoi's dual. Join every pair of sites whose cells share an edge and you get triangles instead of cells. If the pattern is made of triangles with points at the corners, it is Delaunay.

**Reaction-diffusion** also produces spotted and cellular patterns, but they emerge from a simulation, have soft rounded forms and no straight edges. Voronoi edges are always straight segments.

**Circle packing** fills a plane with circles that touch. The gaps between them are curved and empty, rather than shared straight boundaries.

**Lloyd relaxation** is not a different pattern but a refinement: move each site to the centre of its cell and repeat, and the cells even out into a soft honeycomb.
