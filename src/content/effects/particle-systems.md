---
slug: particle-systems
name: Particle systems
synonyms:
  - particles
  - emitters
  - point clouds in motion
collection: 3D and particles
tags:
  - 3d
  - generative
  - motion-dependent
oneLiner: Thousands of simple points, each following the same few rules, which together behave like smoke, sparks or dust.
whatItIs: |
  A particle system models something with no definite surface — smoke, fire, dust, spray — as a large population of individually trivial elements. Each particle has a position, a velocity, an age and a lifetime, and nothing else. No particle knows about any other. The appearance of a coherent, fluid mass is entirely an emergent property of running the same few rules across thousands of copies.

  William Reeves introduced the technique at Lucasfilm in 1983 for the Genesis sequence in Star Trek II, and the structure he described — emitter, per-particle attributes, stochastic variation, birth and death — is still the structure every implementation uses.
renderer: three
motionDependent: true
controlsLayout: sidebar
poster: /posters/particle-systems.png
parameters:
  - name: Count
    what: How many particles exist at once. Density changes the read far more than any single particle's behaviour does.
    lock: expose
  - name: Particle size
    what: Screen size of one point, scaled by distance. Together with count it decides whether the system reads as dust, smoke or sparks.
    lock: expose
  - name: Lifetime
    what: How long a particle lives before respawning at the emitter. Short lifetimes give sparks, long ones give drifting smoke.
    lock: expose
  - name: Emission speed
    what: Initial outward velocity at spawn. Sets how far the system throws material before the forces take over.
    lock: expose
  - name: Gravity
    what: Constant downward acceleration. Negative values lift the system, which is what sells smoke rather than debris.
    lock: lock
  - name: Turbulence
    what: Strength of the drifting force field. This is what stops the system looking like a fountain.
    lock: lock
  - name: Drag
    what: How quickly velocity bleeds away. High drag makes particles settle into the field; low drag lets them keep their initial throw.
    lock: lock
related:
  - chromatic-aberration
sources:
  - title: Reeves — Particle Systems, A Technique for Modeling a Class of Fuzzy Objects (1983)
    url: https://graphics.pixar.com/library/ParticleSystems/paper.pdf
    kind: history
  - title: The Nature of Code — Particle Systems
    url: https://natureofcode.com/particles/
    kind: tutorial
  - title: three.js — dynamic points example
    url: https://threejs.org/examples/#webgl_points_dynamic
    kind: example
---

## How it works

Each frame, every particle does the same four things: age, accumulate forces into its velocity, integrate velocity into its position, and respawn at the emitter if its lifetime has run out. The forces here are gravity, a drifting field standing in for air movement, and drag.

Two details do most of the work. Spawn directions are sampled evenly over a sphere rather than by picking random angles, which would bunch particles at the poles. And alpha ramps up over the first tenth of a particle's life and down over the last third, so nothing pops into or out of existence — without that fade, the respawn is the first thing you notice.

The simulation runs on the CPU over a flat `Float32Array`, with one buffer allocated at the maximum count and only the active range drawn. At these counts that is fast enough, and it keeps the forces legible. Pushing the simulation onto the GPU is a different technique with different trade-offs, and belongs in its own entry.

## Brand tool lens

Expose count, size and lifetime. Those three are the composition controls — they change how dense, how fine and how long-lived the system looks, and none of them can produce something unusable.

Lock the forces. Gravity, turbulence and drag together define the system's character, and they interact: raising turbulence while lowering drag turns smoke into confetti. Tune them once as art direction, then hide them. If a client needs variety, give them two or three named presets — "drift", "spark", "settle" — each a fixed set of force values, rather than the sliders themselves.

The emitter path is the other thing worth locking. Tying it to a logo outline or a fixed motion path keeps every output recognisably the same system.

## Easily confused with

**Point clouds** are static sampled geometry. They may look similar in a still frame, but they have no emitter, no lifetime and no forces — nothing is being simulated.

**Flow fields** drive motion from a field sampled at each position, usually with particles that never die. The visual overlap is real, but a flow field's character comes from the field, while a particle system's comes from the emitter and the lifetime.

**Curl-noise GPU particles** run the same conceptual model, but the integration happens in a shader over a texture holding positions. That allows millions rather than thousands, and changes what is practical rather than what it means.
