# Effect demo modules

Each effect lives in `src/lib/effects/<slug>/` and is plain HTML, CSS and
JavaScript. **Nothing in here imports Svelte, SvelteKit or site code.** The site
imports demos; demos never import the site. That one-way dependency is what
makes every folder liftable into any project.

Each folder is self-contained: `demo.js`, any shaders, any demo CSS, and its own
copy of whatever small helpers it needs. Duplicating a forty-line WebGL quad
helper across folders is the price of a folder you can copy whole, and it is
worth paying.

## Module interface

```js
/** Controls are generated from this schema; no demo builds its own UI. */
export const params = {
	threshold: {
		type: 'range', // range | select | toggle | colour
		label: 'Threshold', // sentence case, Geist
		group: 'Screen', // named group, sentence case
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.5
	}
};

export function create(canvas, initialParams) {
	// set up context, buffers, shaders
	return {
		update(nextParams) {}, // optional: a parameter changed
		frame(time, pointer) {}, // required: render one frame
		resize(width, height) {}, // optional
		destroy() {} // optional: free GPU resources and listeners
	};
}
```

### What the host guarantees

- `canvas.width` and `canvas.height` are already set to **device pixels**
  (CSS size × devicePixelRatio, capped at 2). `resize(width, height)`, if the demo
  defines it, is called with those same device pixels immediately after `create`
  and on every change. `frame` is the only required method.
- `time` is **seconds since the demo started**, already scaled by the speed
  control and paused when the demo is paused. Demos should never read
  `performance.now()` themselves, or the speed and pause controls will not work.
- `pointer` is `{ x, y, vx, vy, down, inside }`. `x`/`y` are in device pixels to
  match the canvas; `vx`/`vy` are device pixels per second, smoothed.
- Only one demo runs at a time. The loop stops when the demo scrolls out of
  view or the tab is hidden, and `destroy()` runs on unmount.

### Lifecycle, mapped to other frameworks

| Host       | `create`                       | `update`                          | `frame`                             | `destroy`                    |
| ---------- | ------------------------------ | --------------------------------- | ----------------------------------- | ---------------------------- |
| Plain page | after the canvas is in the DOM | on `input`                        | inside `requestAnimationFrame`      | on unload                    |
| React      | `useEffect(() => {...}, [])`   | `useEffect(..., [params])`        | the RAF loop started in that effect | the effect's cleanup return  |
| Svelte     | `$effect(() => {...})`         | `$effect` reading the params rune | the RAF loop started in that effect | the effect's teardown return |

Every `demo.js` repeats this as a short comment at the top of the file.
