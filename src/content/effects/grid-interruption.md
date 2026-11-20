---
slug: grid-interruption
name: Grid interruption
synonyms:
  - order and disorder
  - controlled randomness
  - disrupted grid
  - interruptions
collection: Interrupted systems
tags:
  - generative
oneLiner: A strict grid of identical marks, with a measured dose of randomness let in so the order is felt by where it breaks.
whatItIs: |
  Grid interruption starts from the most ordered picture possible, a regular grid of identical elements, and then lets disorder in by a controlled amount. Some elements turn, some shift, some go missing. The interest is not in the randomness itself but in the boundary between the two states, because a grid is only noticed once something disturbs it.

  The technique belongs to Vera Molnár, who began making work this way by hand in the late 1950s, with what she called an imaginary machine, before she had access to a real one. Her plotter drawing Interruptions, from 1969, is the canonical example: a field of short lines at random angles, with patches of the grid simply absent. Georg Nees's Schotter, from 1968, makes the same argument as a gradient: a grid of squares that begins in perfect order at the top and tumbles further out of line row by row.

  The name is descriptive rather than technical. What makes it a distinct effect is that disorder is a parameter, set like any other, rather than something the work is made of.
renderer: canvas2d
motionDependent: false
controlsLayout: overlay
poster: /posters/grid-interruption.png
parameters:
  - name: Element
    what: The mark repeated in each cell. Short lines are Interruptions, nested squares are closer to Molnár's later work, and filled blocks are Schotter. The element decides whether disorder reads as rotation or as deformation.
    lock: lock
  - name: Columns
    what: Grid density. Fewer, larger cells make each broken element an event; many small ones turn disorder into a texture.
    lock: expose
  - name: Disorder
    what: How far each element may turn and move from its place. The useful range is small. Past about half, the grid stops being legible and there is nothing left to interrupt.
    lock: expose
  - name: Interruption
    what: How much of the grid is removed. Gaps come from smooth noise, so they cluster into holes rather than scattering, which is what makes them read as a decision.
    lock: expose
  - name: Distribution
    what: Where the disorder is allowed. Uniform spreads it everywhere, gradient ramps it across the frame as Schotter does, and focus concentrates it around a point that follows the pointer.
    lock: lock
  - name: Seed
    what: Which random picture you get. Every value is hashed from the cell and the seed, so a seed is a specific composition you can return to and approve.
    lock: expose
  - name: Redraw every
    what: How long each random state holds before easing into the next. Long holds read as composition, short ones as agitation.
    lock: lock
related:
  - scale-modulated-grid
  - flow-fields
  - pixel-sorting
sources:
  - title: Vera Molnár
    url: https://en.wikipedia.org/wiki/Vera_Moln%C3%A1r
    kind: history
  - title: Schotter, Georg Nees (V&A)
    url: https://collections.vam.ac.uk/item/O221321/schotter-print-nees-georg/
    kind: history
  - title: Probability distributions for algorithmic artists
    url: https://www.tylerxhobbs.com/words/probability-distributions-for-algorithmic-artists
    kind: article
---

## How it works

Lay out the grid, then give every cell a few random numbers: one for its angle, two for its offset, one for whether it exists at all. Multiply each by a disorder amount before applying it. At zero you have the grid, at one you have noise, and everything worth looking at is in the first third.

Two details turn this from random scatter into the effect. The first is that the random numbers come from a hash of the cell's position and a seed, never from `Math.random`, so the same seed draws the same picture every time. The second is that the gaps come from smooth noise rather than an independent coin toss per cell. Independent gaps look like a printing fault; clustered gaps look like a hole someone chose to make.

The distribution is a weight per cell that scales the disorder. A constant weight gives Interruptions, a ramp across the frame gives Schotter, and a falloff around a point gives a disturbance that can move. In this demo the random values hold for a few seconds and then ease into a fresh set, so you watch one composition dissolve into the next.

## Brand tool lens

This is one of the most useful systems to hand a client, because it gives every output a family resemblance while making each one different. The grid, the element and the line weight are the identity and should be locked. Disorder and interruption are the voice and can be exposed, but over a short, tested range: the gap between a confident break and a mess is narrow.

Expose the seed, and treat it as the artwork. Someone generating a social post should be able to scroll through seeds, find one that works with the copy, and know that the seed number will reproduce it exactly for the print version. That is the whole case for seeded randomness over true randomness in a client tool.

For example, a cultural venue could lock a grid of short vertical rules and let each season's programme set its own disorder value, with the interruption shaped around the headline so the type sits in the hole.

## Easily confused with

**Noise textures** are disorder with no order underneath. Grid interruption only works because the grid is still visible; remove it and you have a texture with no tension.

**Glitch** effects break an image through a process failure, and the damage follows the data, not a composition. Interruption is deliberate and placed.

**Scale-modulated grids** keep every element in place and vary one property smoothly by a rule. Interruption varies by chance and breaks the grid's regularity; modulation preserves it.

**Truchet tiles** also randomise each cell, but they choose between a few designed orientations that join up at the edges. The randomness builds a continuous pattern instead of breaking one.
