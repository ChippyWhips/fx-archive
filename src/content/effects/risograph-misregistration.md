---
slug: risograph-misregistration
name: Risograph misregistration
synonyms:
  - off-register printing
  - registration shift
  - riso look
collection: Print and screen
tags:
  - print
  - post-fx
  - shader
oneLiner: Flat translucent inks printed one colour per pass, where each pass lands slightly out of line with the last, so edges split into fringes and overlaps make colours of their own.
whatItIs: |
  A Risograph is a digital stencil duplicator, made by the Riso Kagaku Corporation in Japan from the 1980s and designed for schools and offices that needed thousands of cheap copies. It burns a master stencil with a thermal head, wraps it round an ink drum, and pushes soy-based ink through it onto the paper. One drum holds one colour, so a three-colour print goes through the machine three times, or once through a machine with two drums and once more.

  Every pass is a fresh chance for the paper to sit a little differently. Misregistration is the gap between where a colour was meant to land and where it did: a shift of a millimetre or so, occasionally a small rotation, and never quite the same on two sheets in a run. Where the same shape appears on two drums, it splits into two edges with a sliver of each ink showing.

  The rest of the look comes along with it. Riso inks are translucent, so overlapping colours multiply into a third. Tone is reproduced as a coarse grain rather than a clean screen. Coverage is uneven because the drum starves in heavy areas. None of these were intended, and independent publishers adopted the machine precisely because the faults read as made by hand.
renderer: webgl
motionDependent: false
controlsLayout: overlay
poster: /posters/risograph-misregistration.png
parameters:
  - name: Misregistration
    what: The largest shift any one drum can take, as a fraction of the sheet. This is the control that decides whether it reads as a print or as a mistake. Around half a percent is a well-run machine, above two percent looks broken.
    lock: expose
  - name: Skew
    what: The rotation each pass can pick up. Real misregistration is mostly translation with a little twist. Push this far and the result looks like a careless digital effect rather than a press.
    lock: lock
  - name: Sheets per second
    what: How often a new print comes off the machine with fresh random offsets. Not a print property, but the only honest way to show that misregistration differs on every sheet of a run.
    lock: lock
  - name: Grain
    what: How coarsely the stencil breaks tone into dots. High grain is the authentic riso texture. Low grain smooths the tone back out and leaves only the offset, which is when the effect starts to look like chromatic aberration.
    lock: lock
  - name: Ink unevenness
    what: Broad blotches where the drum laid down less ink. Subtle is right. It is one of the strongest cues that something was printed rather than rendered.
    lock: lock
  - name: Drums and inks
    what: Two or three colours, each from a fixed list of real riso inks such as fluorescent pink, blue and yellow. The colours are the brand decision. Overprints are a consequence of them, not a separate choice.
    lock: lock
related:
  - halftone
  - duotone
  - chromatic-aberration
  - multiply-and-screen
sources:
  - title: Risograph
    url: https://en.wikipedia.org/wiki/Risograph
    kind: history
  - title: Registration mark
    url: https://en.wikipedia.org/wiki/Registration_mark
    kind: article
  - title: stencil.wiki
    url: https://www.stencil.wiki/
    kind: tutorial
---

## How it works

The artwork is drawn already separated, one ink per colour channel, exactly as a riso is fed: one greyscale master per drum. Red holds drum one, green drum two, blue drum three. Keeping the separation in the source rather than deriving it in the shader means the same artwork can be swapped between inks without redrawing it.

Each drum then samples its channel through its own small transform: a shift and a rotation about the centre of the sheet, picked from a hash of the sheet number and the drum. Change the sheet and every drum moves at once, independently, which is what a run of prints looks like when you flip through them.

The ink itself is the other half. Coverage passes through a random threshold per pixel, so tone breaks up into scattered dots rather than smooth gradient, a stand-in for the thermal head's stencil. A low-frequency noise then thins the ink in broad patches. Finally each drum multiplies over the paper and everything already printed on it. Translucent ink on translucent ink is multiplication, and that is why pink over blue gives a deep violet-black without a fourth drum.

## Brand tool lens

The risk with this look in a brand tool is that it drifts into parody. The defining parameters are the ink set and the offset magnitude, and both should be locked to values that a real machine could produce. Use real riso ink colours, keep to two or three of them, and cap the shift at a level a printer would let out of the door. If the brand uses riso for real, measure the offset on a few sheets of an actual run and match that.

Expose the offset, if anything, as a small range, and make the randomness seeded so that the same artwork exports the same way twice. A client who regenerates a poster and gets a different misregistration will think the file has broken. Exposing a "new print" button that changes the seed is the friendlier version of the same freedom.

One example: a festival identity printed on riso for posters and simulated for social. Lock fluorescent pink and blue, lock the grain, expose a seed. The digital assets then sit beside the printed ones without the screen versions looking cleaner than the real thing.

## Easily confused with

**Chromatic aberration** also splits an image into offset colours, but it is additive light from a lens, the shift grows towards the frame edge, and the fringes are red, green and blue. Misregistration is a whole-layer shift in printed ink colours, constant across the sheet.

**Halftone** is how most presses make tone. A riso can halftone too, but its native texture is a coarser, irregular grain, and its look is defined by flat ink and offsets rather than by the screen.

**Overprint** is the deliberate instruction to print one ink over another without knocking out. Riso work is almost always overprinted, which is why misregistration shows colour fringes rather than white gaps.

**Duotone** is two inks carrying one image's tones. A riso print can be a duotone, but a duotone need not be misregistered at all.
