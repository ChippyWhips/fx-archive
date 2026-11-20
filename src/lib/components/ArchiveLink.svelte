<script>
	import { resolve } from '$app/paths';

	/**
	 * Fixed top-centre on effect pages only, offset slightly from the top edge.
	 * A small left-facing chevron before the text, in the same thin stroke as
	 * the favourite tick, inside the same rounded container as the theme toggle.
	 */
</script>

<a class="archive" href={resolve('/')}>
	<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
		<path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1" />
	</svg>
	Archive
</a>

<style>
	.archive {
		position: fixed;
		inset-block-start: var(--space-4);
		inset-inline-start: 50%;
		translate: -50% 0;
		z-index: 10;
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-6);
		border-radius: var(--radius-pill);
		background: var(--surface-panel);
		font-family: var(--font-mono);
		font-size: var(--text-ui);
		line-height: 1;
		color: var(--ink-mid);
	}

	.archive:hover {
		color: var(--ink);
	}

	svg {
		inline-size: var(--icon-size);
		block-size: var(--icon-size);
	}
</style>
