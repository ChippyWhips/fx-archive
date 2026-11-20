<script>
	import { resolve } from '$app/paths';
	import ArchiveLink from './ArchiveLink.svelte';
	import FavouriteToggle from './FavouriteToggle.svelte';
	import Playground from './Playground.svelte';
	import CodePanel from './CodePanel.svelte';
	import { loadDemo } from '#lib/demos.js';
	import { view } from '#lib/personal.svelte.js';
	import { parseDay, formatServedDate, isServed } from '#lib/schedule.js';
	import { schedule } from '#lib/content/index.js';

	/** @type {{ entry: any, Body: any }} */
	let { entry, Body } = $props();

	const start = parseDay(schedule.startDate);
	const served = $derived(isServed(start, entry.index));
	const servedLabel = $derived(
		served ? formatServedDate(parseDay(entry.servedOn)) : 'Not yet served'
	);

	$effect(() => {
		view(entry.slug);
	});

	const demo = $derived(loadDemo(entry.slug));
</script>

<ArchiveLink />

<article class="page">
	<h1 class="title">{entry.name}</h1>

	<div class="grid info">
		<div class="block">
			<div class="field">
				<span class="field-label" id="fav-label">Favourite</span>
				<div class="field-value" aria-labelledby="fav-label">
					<FavouriteToggle slug={entry.slug} />
				</div>
			</div>
			<div class="field">
				<span class="field-label">Served</span>
				<p class="field-value">{servedLabel}</p>
			</div>
			<div class="field">
				<span class="field-label">Collection</span>
				<p class="field-value">{entry.collection}</p>
			</div>
			<div class="field">
				<span class="field-label">Tags</span>
				<ul class="field-value list">
					{#each entry.tags as tag (tag)}<li>{tag}</li>{/each}
				</ul>
			</div>
		</div>

		<div class="block">
			<div class="field">
				<span class="field-label">Synonyms</span>
				<ul class="field-value list">
					{#each entry.synonyms as synonym (synonym)}<li>{synonym}</li>{/each}
				</ul>
			</div>
			<div class="field">
				<span class="field-label">Renderer</span>
				<p class="field-value">{entry.renderer}</p>
			</div>
			<div class="field">
				<span class="field-label">Related</span>
				<ul class="field-value list">
					{#each entry.related as slug (slug)}
						<li><a href={resolve('/effects/[slug]', { slug })}>{slug.replace(/-/g, ' ')}</a></li>
					{/each}
				</ul>
			</div>
		</div>

		<div class="overview">
			<p>{entry.oneLiner}</p>
			{#each entry.whatItIs.trim().split(/\n\s*\n/) as paragraph (paragraph)}
				<p>{paragraph}</p>
			{/each}
		</div>
	</div>

	<div class="playground-slot">
		{#await demo then module}
			{#key entry.slug}
				<Playground {module} slug={entry.slug} layout={entry.controlsLayout} />
			{/key}
		{:catch error}
			<p class="field-value">This demo could not start: {error.message}</p>
		{/await}
	</div>

	<div class="grid">
		<div class="body">
			<Body />
		</div>
	</div>

	<div class="code">
		<h2 class="code-title">Copy this effect</h2>
		<CodePanel slug={entry.slug} />
	</div>

	<div class="grid">
		<div class="body">
			<h2>Sources</h2>
			<ul class="sources">
				{#each entry.sources as source (source.url)}
					<li>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external source link -->
						<a href={source.url} rel="noreferrer">{source.title}</a>
						<span class="kind">{source.kind}</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</article>

<style>
	.page {
		padding-block: var(--space-fluid-section) var(--space-fluid-section);
	}

	/* Fluid top and bottom margin, so the title clears the fixed Archive link at
	   every viewport size and holds the page's vertical rhythm. */
	.title {
		font-size: var(--display);
		font-weight: var(--weight-black);
		line-height: var(--leading-display);
		letter-spacing: var(--track-display);
		text-transform: uppercase;
		text-align: center;
		text-wrap: balance;
		text-box: trim-both cap alphabetic;
		margin-block: var(--space-fluid-title);
		max-inline-size: 22ch;
		margin-inline: auto;
	}

	.info {
		align-items: start;
		margin-block-end: var(--space-fluid-section);
	}

	.block {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.list {
		list-style: none;
		padding: 0;
	}

	.overview {
		grid-column: span 2;
		font-size: var(--step-3);
		font-weight: var(--weight-light);
		line-height: var(--leading-tight);
		max-inline-size: var(--measure-overview);
	}

	.overview p {
		margin-block: 0;
	}

	.overview p + p {
		text-indent: 3ch;
	}

	.playground-slot {
		margin-block-end: var(--space-fluid-section);
	}

	.body {
		grid-column: 3 / span 2;
		max-inline-size: var(--measure-body);
	}

	.body :global(h2) {
		font-size: var(--step-4);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--track-4);
		margin-block: var(--space-fluid-section) var(--space-4);
	}

	.body :global(h2:first-child) {
		margin-block-start: 0;
	}

	.body :global(p + p) {
		/* First-line indent rather than extra space between paragraphs. */
		text-indent: 3ch;
	}

	.body :global(p) {
		margin-block-end: 0;
	}

	.code {
		margin-block: var(--space-fluid-section);
	}

	.code-title {
		font-size: var(--step-4);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--track-4);
		margin-block-end: var(--space-4);
	}

	.sources {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.sources li {
		display: flex;
		justify-content: space-between;
		gap: var(--space-4);
		border-block-end: var(--stroke) solid var(--hairline);
		padding-block-end: var(--space-3);
	}

	.kind {
		font-family: var(--font-mono);
		font-size: var(--text-ui);
		color: var(--ink-dim);
	}

	@media (width < 768px) {
		.overview,
		.body {
			grid-column: 1 / -1;
		}

		.info {
			gap: var(--space-8);
		}

		.block {
			grid-column: 1 / -1;
		}
	}
</style>
