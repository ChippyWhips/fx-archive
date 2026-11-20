<script>
	/**
	 * A 1px track with a heavier fill for the active portion and a minimal
	 * thumb. The native input stays underneath for keyboard and screen reader
	 * support, fully restyled so no OS chrome shows.
	 *
	 * @type {{ id: string, spec: Record<string, any>, value: number, onchange: (v: number) => void }}
	 */
	let { id, spec, value, onchange } = $props();

	const min = $derived(spec.min ?? 0);
	const max = $derived(spec.max ?? 1);
	const fill = $derived(((value - min) / (max - min)) * 100);
</script>

<input
	{id}
	type="range"
	{min}
	{max}
	step={spec.step ?? 0.01}
	{value}
	style:--fill="{fill}%"
	oninput={(event) => onchange(event.currentTarget.valueAsNumber)}
/>

<style>
	input {
		appearance: none;
		inline-size: 100%;
		background: none;
		cursor: ew-resize;
		/* A taller hit area than the 1px track, without changing the look. */
		block-size: 24px;
		margin: 0;
	}

	input::-webkit-slider-runnable-track {
		block-size: var(--stroke);
		background: linear-gradient(
			to right,
			var(--row-ink, var(--ink)) var(--fill),
			var(--hairline) var(--fill)
		);
	}

	input::-moz-range-track {
		block-size: var(--stroke);
		background: linear-gradient(
			to right,
			var(--row-ink, var(--ink)) var(--fill),
			var(--hairline) var(--fill)
		);
	}

	input::-webkit-slider-thumb {
		appearance: none;
		inline-size: 2px;
		block-size: 10px;
		margin-block-start: -5px;
		border-radius: 0;
		background: var(--row-ink, var(--ink));
	}

	input::-moz-range-thumb {
		inline-size: 2px;
		block-size: 10px;
		border: none;
		border-radius: 0;
		background: var(--row-ink, var(--ink));
	}
</style>
