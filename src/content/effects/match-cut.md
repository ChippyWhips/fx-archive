---
slug: match-cut
name: Match cut
synonyms:
  - graphic match
  - match on action
  - graphic match cut
  - match dissolve
collection: Motion cuts and transitions
tags:
  - motion-dependent
oneLiner: A cut between two different things that share a shape, a position or a movement, so the eye carries straight across and the edit feels like a rhyme.
whatItIs: |
  A match cut joins two shots through something they have in common. The subject changes completely, but the shape, its place in the frame, its size or its movement carries on across the cut, so the viewer's eye never has to search for the new subject. It is already looking at it.

  The best-known example is the cut in 2001: A Space Odyssey from a bone thrown into the air to a spacecraft drifting in orbit: two objects of the same rough shape and angle, separated by millions of years. Most match cuts are quieter than that. A door closing on one scene matched to a door opening in the next, a turning wheel matched to a turning clock face. When the match is done as a crossfade rather than a hard cut it is called a match dissolve.
renderer: canvas2d
motionDependent: true
controlsLayout: overlay
poster: /posters/match-cut.png
parameters:
  - name: Shot A length
    what: How long the first shot runs before the cut. Long enough for the shape to register, short enough that the cut lands while the eye is still on it.
    lock: expose
  - name: Shot B length
    what: How long the second shot runs, including a short hold at the end. This is where the rhyme lands, so it usually wants to be longer than shot A.
    lock: expose
  - name: Dissolve
    what: Zero is a hard cut. Any duration turns it into a match dissolve, where both subjects are briefly visible together.
    lock: lock
  - name: Match
    what: What carries across the cut. Shape and motion is a full match; shape only keeps the position but reverses the movement; unmatched shows what the cut looks like without either.
    lock: lock
  - name: Camera push
    what: A single camera move running through both shots. Continuing the move across the cut is what makes it feel like one shot rather than two.
    lock: expose
  - name: Easing
    what: The curve of the camera move. It runs once across both shots, so the cut lands at the same point on the curve in each.
    lock: lock
related:
  - dolly-zoom
  - datamosh
  - motion-blur
sources:
  - title: Match cut
    url: https://en.wikipedia.org/wiki/Match_cut
    kind: article
  - title: Continuity editing
    url: https://en.wikipedia.org/wiki/Continuity_editing
    kind: article
  - title: 2001, A Space Odyssey
    url: https://en.wikipedia.org/wiki/2001:_A_Space_Odyssey
    kind: history
---

## How it works

A cut is an instant. Everything that happens to the viewer happens in the few frames after it, when the eye looks for the new subject. A match cut removes that search: the new subject is already where the eye is pointing, at the size it expects, moving the way it was moving.

In the demo, both shots read their circle's position, size, rotation and camera push from one shared clock. A matched cut is then not a matter of lining things up by hand. At the cut, shot B simply starts drawing with the values shot A would have had. Switch the match to shape only and the circle stays put but the spin reverses and the camera starts pulling out, and the cut immediately feels like a bump. Switch to unmatched and it becomes an ordinary cut, with a brief moment of looking for the subject.

Graphic matches carry shape and position. Matches on action carry movement, which is usually the stronger of the two: the eye forgives a change of shape far more easily than a change of direction.

## Briefing an editor

Name the two shots and what they share, before anything else: "the record's label becomes the centre of the lemon, same size, same place, same spin". An editor can only find a match in the footage if they know what is supposed to carry across.

Then specify the timing in frames, not feelings. Where the cut falls relative to the movement (mid-move is almost always stronger than at rest), how long each shot runs, and whether it is a hard cut or a match dissolve, with the dissolve in frames. If there is a camera move, say that it continues through the cut, and give one easing curve for the move as a whole rather than one per shot.

For a motion designer building it from scratch, the useful brief is the shared rig: one transform, one clock, two layers. For example: "a 2.4-second shot A and a 3-second shot B, cut at frame 58, one push-in eased in-out across both, hold for a second at the end". Built that way, both sides of the cut can be swapped for new artwork without the match breaking.

## Easily confused with

**Jump cuts** cut between two moments of the same shot, so the subject jumps. A match cut changes the subject and keeps the composition.

**Morph cuts** interpolate the frames either side of a cut so a jump disappears. Nothing is matched; the seam is hidden.

**Smash cuts** do the opposite of a match cut. They break continuity deliberately, usually from loud to quiet, for shock.

**Cross-dissolves** blend any two shots. A match dissolve is a cross-dissolve where the shapes have been lined up first.
