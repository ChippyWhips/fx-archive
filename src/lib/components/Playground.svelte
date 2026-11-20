<script>
	import { untrack } from 'svelte';
	import { createClock } from '../playground/clock.js';
	import { trackPointer } from '../playground/pointer.js';
	import Controls from './Controls.svelte';

	/**
	 * The single host for every demo. It owns the canvas, the animation loop,
	 * pause and speed, pointer tracking, resizing and teardown, so a demo module
	 * is only ever the effect itself.
	 *
	 * @type {{
	 *   module: { params: Record<string, Record<string, any>>, create: Function },
	 *   slug: string,
	 *   layout?: 'overlay' | 'sidebar'
	 * }}
	 */
	let { module, slug, layout = 'overlay' } = $props();

	/** Cap the backing store at 2× so a 3× phone does not render nine times the pixels. */
	const MAX_DPR = 2;

	/** @type {HTMLCanvasElement} */
	let canvas;
	/** @type {HTMLElement} */
	let stage;

	const defaults = $derived(
		Object.fromEntries(Object.entries(module.params).map(([key, spec]) => [key, spec.default]))
	);

	// Initial values only: one Playground hosts one demo for its lifetime, and
	// the effect page keys on the slug, so a different demo gets a new instance.
	// svelte-ignore state_referenced_locally
	let values = $state(
		Object.fromEntries(Object.entries(module.params).map(([key, spec]) => [key, spec.default]))
	);
	let playing = $state(false);
	let speed = $state(1);
	let controlsOpen = $state(true);
	let reducedMotion = $state(false);

	/** @type {{ update?: Function, frame: Function, resize?: Function, destroy?: Function } | null} */
	let instance = null;
	const clock = createClock();

	$effect(() => {
		const query = window.matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = query.matches;

		const pointerTracker = trackPointer(stage);
		let raf = 0;
		let visible = true;
		let onScreen = true;
		let lastFrame = performance.now();

		/** Size the backing store in device pixels; demos work in those units. */
		function size() {
			const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
			const width = Math.max(1, Math.round(stage.clientWidth * dpr));
			const height = Math.max(1, Math.round(stage.clientHeight * dpr));
			if (canvas.width === width && canvas.height === height) return;
			canvas.width = width;
			canvas.height = height;
			// resize, update and destroy are optional: a demo with nothing to
			// release or no size-dependent state can leave them out.
			instance?.resize?.(width, height);
		}

		// untrack: creating the demo must not make this effect depend on the
		// parameter values, or every slider move would tear it down and rebuild it.
		instance = module.create(
			canvas,
			untrack(() => ({ ...values }))
		);
		size();
		// Render one frame immediately, so a paused demo is never a blank box.
		instance?.frame(0, pointerTracker.pointer);

		function loop() {
			raf = requestAnimationFrame(loop);
			const now = performance.now();
			const dt = Math.min((now - lastFrame) / 1000, 1 / 20);
			lastFrame = now;
			pointerTracker.settle(dt);
			instance?.frame(clock.tick(now), pointerTracker.pointer);
		}

		/** Only one demo runs at a time, and never while off-screen or hidden. */
		function sync() {
			const shouldRun = playing && visible && onScreen;
			if (shouldRun && !raf) {
				lastFrame = performance.now();
				clock.start(lastFrame);
				raf = requestAnimationFrame(loop);
			} else if (!shouldRun && raf) {
				cancelAnimationFrame(raf);
				raf = 0;
				clock.stop();
			}
		}

		const resizeObserver = new ResizeObserver(size);
		resizeObserver.observe(stage);

		const intersectionObserver = new IntersectionObserver(
			([entry]) => {
				onScreen = entry.isIntersecting;
				sync();
			},
			{ rootMargin: '128px' }
		);
		intersectionObserver.observe(stage);

		const onVisibility = () => {
			visible = document.visibilityState === 'visible';
			sync();
		};
		document.addEventListener('visibilitychange', onVisibility);

		// Reduced motion starts the demo paused with a clear play button, rather
		// than removing the motion that makes most of these effects legible.
		playing = !query.matches;

		// Child effects: these re-run on their own dependencies and are torn down
		// with the parent, so the demo itself is only ever created once.
		$effect(() => {
			void playing;
			sync();
		});

		$effect(() => {
			clock.setSpeed(speed);
		});

		$effect(() => {
			instance?.update?.({ ...values });
			// A paused demo still redraws, so moving a slider shows its effect live.
			if (untrack(() => !playing)) instance?.frame(clock.elapsed, pointerTracker.pointer);
		});

		return () => {
			cancelAnimationFrame(raf);
			resizeObserver.disconnect();
			intersectionObserver.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
			pointerTracker.destroy();
			instance?.destroy?.();
			instance = null;
		};
	});

	/**
	 * @param {string} key
	 * @param {any} value
	 */
	function setValue(key, value) {
		values = { ...values, [key]: value };
	}

	function reset() {
		values = { ...defaults };
		clock.reset();
	}
</script>

<div class="playground" data-layout={layout}>
	<div class="stage" bind:this={stage}>
		<canvas bind:this={canvas} aria-label="Animated demonstration of this effect"></canvas>
	</div>

	<div class="panel-slot">
		<div class="panel">
			<div class="panel-head">
				<button type="button" class="text-action" onclick={() => (controlsOpen = !controlsOpen)}>
					{controlsOpen ? 'Hide controls' : 'Show controls'}
				</button>
			</div>

			{#if controlsOpen}
				<div class="panel-body">
					<Controls schema={module.params} {values} idPrefix={slug} onchange={setValue} />

					<section class="group playback">
						<h3 class="group-title">Playback</h3>
						<div class="row">
							<label class="label" for="{slug}-speed">Speed</label>
							<input
								id="{slug}-speed"
								class="speed"
								type="range"
								min="0.25"
								max="2"
								step="0.25"
								value={speed}
								oninput={(event) => (speed = event.currentTarget.valueAsNumber)}
							/>
							<output class="value" for="{slug}-speed">{speed.toFixed(2)}×</output>
						</div>

						<div class="transport">
							<button type="button" class="pill" onclick={() => (playing = !playing)}>
								{playing ? 'Pause' : 'Play'}
							</button>
							<button type="button" class="text-action" onclick={reset}>Reset</button>
						</div>

						{#if reducedMotion && !playing}
							<p class="help">Starts paused because your system asks for reduced motion.</p>
						{/if}
					</section>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.playground {
		display: grid;
		gap: var(--space-fluid-grid-gap);
	}

	.stage {
		position: relative;
		aspect-ratio: 16 / 10;
		background: var(--surface-panel);
		overflow: hidden;
	}

	canvas {
		inline-size: 100%;
		block-size: 100%;
		touch-action: none;
	}

	/* Default: the panel is overlaid in the top-right of the playground, set
	   apart from the canvas by tone alone. */
	.playground[data-layout='overlay'] {
		position: relative;
	}

	.playground[data-layout='overlay'] .panel-slot {
		position: absolute;
		inset-block: var(--space-4);
		inset-inline-end: var(--space-4);
		inline-size: min(280px, calc(100% - var(--space-8)));
		display: flex;
		justify-content: flex-end;
		pointer-events: none;
	}

	.playground[data-layout='overlay'] .panel {
		pointer-events: auto;
		max-block-size: 100%;
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	/* Sidebar fallback, for demos whose focal point would sit under the panel. */
	.playground[data-layout='sidebar'] {
		grid-template-columns: minmax(0, 1fr) minmax(0, 3fr);
	}

	.playground[data-layout='sidebar'] .panel-slot {
		order: -1;
	}

	/* The panel is solid, so it stays legible over any effect. No blur. */
	.panel {
		background: var(--surface-panel);
		border-radius: var(--radius-panel);
		padding: var(--space-6);
		color: var(--ink);
	}

	.panel-head {
		display: flex;
		justify-content: flex-end;
		margin-block-end: var(--space-4);
	}

	.panel-body {
		display: flex;
		flex-direction: column;
	}

	.group.playback {
		border-block-start: var(--stroke) solid var(--hairline);
		margin-block-start: var(--space-4);
		padding-block-start: var(--space-4);
	}

	.group-title {
		font-family: var(--font-sans);
		font-size: var(--text-ui);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-ui);
		margin-block-end: var(--space-2);
	}

	.row {
		display: grid;
		grid-template-columns: minmax(0, auto) minmax(var(--space-8), 1fr) minmax(0, auto);
		align-items: center;
		gap: var(--space-3);
		block-size: 32px;
	}

	.label {
		font-family: var(--font-sans);
		font-size: var(--text-ui);
		line-height: var(--leading-ui);
		white-space: nowrap;
	}

	.value {
		font-family: var(--font-mono);
		font-size: var(--text-ui);
		font-variant-numeric: tabular-nums;
		text-align: end;
		white-space: nowrap;
	}

	.speed {
		appearance: none;
		inline-size: 100%;
		block-size: 24px;
		background: none;
		margin: 0;
		cursor: ew-resize;
	}

	.speed::-webkit-slider-runnable-track {
		block-size: var(--stroke);
		background: var(--hairline);
	}

	.speed::-webkit-slider-thumb {
		appearance: none;
		inline-size: 2px;
		block-size: 10px;
		margin-block-start: -5px;
		background: var(--ink);
	}

	.speed::-moz-range-track {
		block-size: var(--stroke);
		background: var(--hairline);
	}

	.speed::-moz-range-thumb {
		inline-size: 2px;
		block-size: 10px;
		border: none;
		border-radius: 0;
		background: var(--ink);
	}

	.transport {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		margin-block-start: var(--space-4);
	}

	/* Primary action: oversized, fully rounded, text only. */
	.pill {
		font-family: var(--font-sans);
		font-size: var(--text-ui);
		line-height: 1;
		padding: var(--space-3) var(--space-6);
		border-radius: var(--radius-pill);
		background: var(--ink);
		color: var(--surface);
	}

	/* Every other action is plain text. */
	.text-action {
		font-family: var(--font-sans);
		font-size: var(--text-ui);
		line-height: var(--leading-ui);
		color: var(--ink-mid);
		transition: color var(--duration) var(--ease);
	}

	.text-action:hover {
		color: var(--ink);
	}

	.help {
		font-family: var(--font-sans);
		font-size: var(--text-ui-sm);
		line-height: var(--leading-tight);
		color: var(--ink-dim);
		margin-block-start: var(--space-3);
		max-inline-size: 32ch;
	}

	/* Below the tablet breakpoint the controls sit beneath the canvas. */
	@media (width < 768px) {
		.playground[data-layout='overlay'],
		.playground[data-layout='sidebar'] {
			grid-template-columns: minmax(0, 1fr);
		}

		.playground[data-layout='overlay'] .panel-slot,
		.playground[data-layout='sidebar'] .panel-slot {
			position: static;
			inline-size: 100%;
			order: 0;
		}
	}
</style>
