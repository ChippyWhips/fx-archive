<script>
	/**
	 * A one-shot trigger. The value is a click counter, so a demo sees a change
	 * through the same `update` path as every other control.
	 *
	 * @type {{ id: string, value: number, onchange: (v: number) => void }}
	 */
	let { id, value, onchange } = $props();
</script>

<button {id} type="button" aria-labelledby="{id}-label" onclick={() => onchange((value ?? 0) + 1)}>
	Play
</button>

<style>
	button {
		margin-inline-start: auto;
		font-family: var(--font-mono);
		font-size: var(--text-ui);
		line-height: var(--leading-ui);
		color: var(--ink-dim);
		transition: color var(--duration) var(--ease);
	}

	button:hover {
		color: var(--ink);
	}
</style>
