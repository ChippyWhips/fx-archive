<script>
	/**
	 * Text-based segmented options. No native select, no chevron: the active
	 * option is marked by contrast alone.
	 *
	 * @type {{ id: string, spec: Record<string, any>, value: string, onchange: (v: string) => void }}
	 */
	let { id, spec, value, onchange } = $props();

	/** @type {string[]} */
	const options = $derived(spec.options ?? []);
</script>

<div class="segments" role="radiogroup" aria-labelledby="{id}-label">
	{#each options as option (option)}
		<button
			type="button"
			role="radio"
			aria-checked={option === value}
			class:active={option === value}
			onclick={() => onchange(option)}
		>
			{option}
		</button>
	{/each}
</div>

<style>
	.segments {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-4);
		inline-size: 100%;
		justify-content: space-between;
	}

	button {
		font-family: var(--font-sans);
		font-size: var(--text-ui);
		line-height: var(--leading-ui);
		color: var(--ink-dim);
		white-space: nowrap;
		transition: color var(--duration) var(--ease);
	}

	button:hover {
		color: var(--ink-mid);
	}

	.active {
		color: var(--ink);
	}
</style>
