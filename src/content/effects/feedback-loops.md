---
slug: feedback-loops
name: Feedback loops
synonyms:
  - video feedback
  - howlround
  - recursive composite
  - infinite tunnel
collection: Compositing and blend modes
tags:
  - motion-dependent
  - generative
  - shader
oneLiner: Each frame is the last frame, slightly zoomed, turned and faded, with something new composited on top, so a small seed grows into spirals and tunnels.
whatItIs: |
  Point a camera at the monitor showing its own picture and you have a feedback loop. Whatever the camera sees appears on the screen, which the camera sees again a moment later, a little smaller or larger, turned slightly, with a little light lost. Repeat that sixty times a second and a single spot of light becomes a spiral, a tunnel or a flickering bloom that seems to have a life of its own.

  British television called it howlround, after the audio equivalent. It made the original Doctor Who titles in 1963, when a camera was pointed at a monitor showing its own picture, and it ran through the video art of the late 1960s and 1970s. In software it is the same loop with the camera replaced by a texture: draw the previous frame, transformed, then add the new material on top.

  That last step is why it belongs with blend modes. The loop itself only smears and spins what is already there. What it looks like depends on how the new seed is combined with the echo of everything before it: screen and add brighten towards white, over replaces, and difference makes every trip round the loop invert what it lands on.
renderer: webgl
motionDependent: true
controlsLayout: overlay
poster: /posters/feedback-loops.png
parameters:
  - name: Seed
    what: The only new image the loop receives. Everything else on screen is its echo. Small, moving seeds give clear spirals; large, static ones fill the frame with a single glow. Drawing on the canvas adds a second seed at the pointer.
    lock: expose
  - name: Zoom per frame
    what: How much larger or smaller the previous frame is drawn each trip. Above one the echoes rush outwards into a tunnel, below one they shrink into the centre. Tiny changes matter, because the zoom is compounded every frame.
    lock: lock
  - name: Turn per frame
    what: How far the previous frame is rotated each trip. Together with zoom it sets the shape of the spiral, and it is the pair of values that most defines a particular feedback look.
    lock: lock
  - name: Feedback gain
    what: How much of each frame survives the trip. It decides how long the trails are. At one nothing ever fades and the screen saturates; a few percent lower and the loop settles into a steady state.
    lock: expose
  - name: Hue shift per frame
    what: Rotates the colour of the echo each trip, so older echoes drift round the colour wheel. The source of the rainbow banding in most feedback work, and easy to overdo.
    lock: lock
  - name: Edges
    what: What the camera sees beyond the monitor. Black lets the frame fade out at the edges, mirror folds it back for a kaleidoscopic tunnel, and wrap tiles it.
    lock: lock
  - name: Seed blend
    what: How the seed is combined with the echo. Screen and add brighten, over replaces, and difference inverts wherever the seed lands, which turns trails into alternating bands.
    lock: lock
related:
  - echo-and-trails
  - kaleidoscope
  - multiply-and-screen
sources:
  - title: Video feedback
    url: https://en.wikipedia.org/wiki/Video_feedback
    kind: history
  - title: WebGL2 rendering to a texture
    url: https://webgl2fundamentals.org/webgl/lessons/webgl-render-to-texture.html
    kind: tutorial
  - title: Droste effect
    url: https://en.wikipedia.org/wiki/Droste_effect
    kind: article
---

## How it works

Two textures take turns. Each frame, a shader reads the one written last frame, samples it zoomed and rotated about the centre, rotates its hue slightly, multiplies it by the gain and composites the seed over it. The result is written to the other texture and shown. Next frame the roles swap. That ping-pong is the whole effect, and it is the camera pointed at its own monitor.

The transform is applied in reverse: for every output pixel, the shader asks where in the previous frame that pixel came from. Zooming in by two percent means reading from a point two percent closer to the centre. This is the standard way to warp an image in a shader, and getting the direction backwards is the most common bug in feedback code.

Because the transform compounds, the per-frame amounts are scaled by elapsed time, so the loop runs at the same pace at any frame rate and with the speed control. The textures are half float where the GPU allows it. Eight-bit colour bands badly when a value is multiplied by 0.97 a few hundred times, and the bands are the first thing that gives cheap feedback away.

## Brand tool lens

Zoom, turn and hue shift are the signature, and they should be locked as a set. A feedback look is recognisable from those three numbers the way a typeface is recognisable from its proportions, and letting users move them independently produces a different look rather than a variation.

Expose the seed and the gain. The seed is where a brand's own material enters, a mark or a word or a shape, and the gain is a sensible single control for intensity: longer or shorter trails. Keep the gain range below one, because at one the loop never settles and the frame fills with white.

Feedback is also a strong poster generator. Running the loop for a fixed time from a fixed seed always produces the same frame, so a tool can let someone choose a seed and a moment, then export a still that is unmistakably from the same system as the animated version.

## Easily confused with

**Echo and trails** keep a fixed number of past frames and fade them. Feedback keeps only one buffer and feeds it back into itself, so its trails are transformed again on every trip, which is what bends them into spirals.

**Kaleidoscope** reflects one image into symmetric segments in a single pass. Feedback with mirrored edges can look similar, but its symmetry is built up over time and keeps moving.

**The Droste effect** is a picture that contains itself, nested forever in one still frame. Feedback is the same idea unfolding in time, with each nesting one frame older than the last.
