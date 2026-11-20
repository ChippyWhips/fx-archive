<script>
	import { resolve } from '$app/paths';
	import { personal } from '#lib/personal.svelte.js';
	import { parseDay, isServed, formatServedDate } from '#lib/schedule.js';

	/**
	 * One archive card. The poster is a static image, never a live canvas: the
	 * archive stays fast however many effects the library holds.
	 *
	 * @type {{ entry: any, start: Date, today?: boolean }}
	 */
	let { entry, start, today = false } = $props();

	const favourited = $derived(personal.favourites.includes(entry.slug));
	const served = $derived(isServed(start, entry.index));
	const date = $derived(served ? formatServedDate(parseDay(entry.servedOn)) : '');
</script>

<a class="card" href={resolve('/effects/[slug]', { slug: entry.slug })}>
	<img class="poster" src={entry.poster} alt="" width="1200" height="900" loading="lazy" />

	<div class="line">
		<span class="name">{entry.name}</span>
		{#if favourited}
			<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
				<path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" stroke-width="1" />
			</svg>
			<span class="visually-hidden">Favourited</span>
		{/if}
	</div>

	<div class="line">
		<span class="collection">{entry.collection}</span>
		<span class="date" class:today>{today ? 'Today' : date}</span>
	</div>
</a>

<style>
	.card {
		container-type: inline-size;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		color: var(--ink);
		font-family: var(--font-sans);
	}

	.poster {
		inline-size: 100%;
		block-size: auto;
		aspect-ratio: 4 / 3;
		object-fit: cover;
		background: var(--surface-panel);
		margin-block-end: var(--space-2);
	}

	.line {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.name {
		font-size: var(--step-2);
		font-weight: var(--weight-medium);
		line-height: var(--leading-tight);
		letter-spacing: var(--track-3);
	}

	.collection,
	.date {
		font-size: var(--text-ui);
		line-height: var(--leading-ui);
		color: var(--ink-mid);
	}

	.collection {
		text-wrap: pretty;
	}

	.date {
		font-family: var(--font-mono);
		white-space: nowrap;
	}

	/* Quietly marked: same size and position as a date, just not grey. */
	.date.today {
		color: var(--ink);
	}

	svg {
		flex: none;
		align-self: center;
		inline-size: var(--icon-size);
		block-size: var(--icon-size);
		color: var(--ink);
	}

	.card:hover .name {
		color: var(--ink-mid);
	}

	/* Below a comfortable card width the two metadata lines stop sharing a row. */
	@container (width < 180px) {
		.line {
			flex-direction: column;
			gap: var(--space-1);
		}

		svg {
			align-self: start;
		}
	}
</style>
