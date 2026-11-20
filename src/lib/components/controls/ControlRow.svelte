<script>
	/**
	 * The one row primitive every control is built on. It gives the panel its
	 * two alignment edges: the label's left edge and the value's right edge.
	 * Every row is the same height, whatever sits between them.
	 *
	 * `stack` puts the control on its own line beneath the label, for controls
	 * that need the full width (segmented options, mainly). The two edges are
	 * unchanged: the label still starts at the left edge and the control still
	 * ends at the right one.
	 *
	 * @type {{
	 *   id: string,
	 *   label: string,
	 *   value?: string,
	 *   atDefault?: boolean,
	 *   stack?: boolean,
	 *   children?: import('svelte').Snippet
	 * }}
	 */
	let { id, label, value, atDefault = false, stack = false, children } = $props();
</script>

<div class="row" class:dimmed={atDefault} class:stack>
	<label class="label" id="{id}-label" for={id}>{label}</label>
	<div class="control">
		{@render children?.()}
	</div>
	{#if value !== undefined}
		<output class="value" for={id}>{value}</output>
	{/if}
</div>

<style>
	.row {
		display: grid;
		grid-template-columns: minmax(0, auto) minmax(var(--space-8), 1fr) minmax(0, auto);
		align-items: center;
		gap: var(--space-3);
		min-block-size: 32px;
	}

	.row.stack {
		grid-template-columns: minmax(0, 1fr);
		align-content: center;
		gap: var(--space-2);
		padding-block: var(--space-2);
	}

	/* State is shown by contrast, never by colour: a row still at its default
	   sits back, and comes forward once it has been changed. */
	.dimmed {
		--row-ink: var(--ink-dim);
	}

	.label {
		font-family: var(--font-sans);
		font-size: var(--text-ui);
		font-weight: var(--weight-regular);
		line-height: var(--leading-ui);
		color: var(--row-ink, var(--ink));
		white-space: nowrap;
	}

	.control {
		display: flex;
		align-items: center;
		min-inline-size: 0;
	}

	.value {
		font-family: var(--font-mono);
		font-size: var(--text-ui);
		font-variant-numeric: tabular-nums;
		line-height: var(--leading-ui);
		color: var(--row-ink, var(--ink));
		text-align: end;
		white-space: nowrap;
	}
</style>
