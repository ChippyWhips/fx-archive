<script>
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { effects, schedule } from '#lib/content/index.js';
	import { parseDay, indexForDate } from '#lib/schedule.js';
	import { personal, hydrate } from '#lib/personal.svelte.js';
	import EffectCard from '#lib/components/EffectCard.svelte';
	import Settings from '#lib/components/Settings.svelte';

	const start = parseDay(schedule.startDate);

	/** Collections actually present in the library, in schedule order of first use. */
	const collections = [...new Set(effects.map((effect) => effect.collection))];

	let query = $state('');
	let collection = $state('All');
	let favouritesOnly = $state(false);
	/** Resolved in the browser: the build has no idea what day it is. */
	let todaySlug = $state(/** @type {string | null} */ (null));

	onMount(() => {
		hydrate();
		const index = indexForDate(start, new Date(), effects.length);
		todaySlug = index === null ? null : effects[index].slug;
	});

	const matches = $derived.by(() => {
		const needle = query.trim().toLowerCase();
		return effects.filter((effect) => {
			if (collection !== 'All' && effect.collection !== collection) return false;
			if (favouritesOnly && !personal.favourites.includes(effect.slug)) return false;
			if (!needle) return true;
			return [effect.name, ...effect.synonyms].some((term) => term.toLowerCase().includes(needle));
		});
	});

	/** Today's effect leads the archive; everything else keeps schedule order. */
	const ordered = $derived.by(() => {
		const today = matches.find((effect) => effect.slug === todaySlug);
		if (!today) return matches;
		return [today, ...matches.filter((effect) => effect !== today)];
	});
</script>

<svelte:head>
	<title>FX Archive</title>
	<meta name="description" content="One visual effect a day, named precisely." />
</svelte:head>

<main class="page">
	<h1>FX<br />Archive</h1>

	<p class="glossary-link field-value">
		<a href={resolve('/glossary')}>Glossary</a>
	</p>

	<div class="filters">
		<div class="search">
			<label class="field-label" for="search">Search</label>
			<input
				id="search"
				type="search"
				bind:value={query}
				placeholder="Name or synonym"
				autocomplete="off"
			/>
		</div>

		<div class="options">
			<span class="field-label" id="collection-label">Collection</span>
			<div class="choices" role="radiogroup" aria-labelledby="collection-label">
				{#each ['All', ...collections] as name (name)}
					<button
						type="button"
						role="radio"
						aria-checked={collection === name}
						class:active={collection === name}
						onclick={() => (collection = name)}
					>
						{name}
					</button>
				{/each}
			</div>
		</div>

		<div class="options">
			<span class="field-label" id="show-label">Show</span>
			<div class="choices" role="radiogroup" aria-labelledby="show-label">
				<button
					type="button"
					role="radio"
					aria-checked={!favouritesOnly}
					class:active={!favouritesOnly}
					onclick={() => (favouritesOnly = false)}>Everything</button
				>
				<button
					type="button"
					role="radio"
					aria-checked={favouritesOnly}
					class:active={favouritesOnly}
					onclick={() => (favouritesOnly = true)}>Favourites</button
				>
			</div>
		</div>
	</div>

	{#if ordered.length === 0}
		<p class="empty field-value">Nothing matches that.</p>
	{:else}
		<ul class="grid cards">
			{#each ordered as effect (effect.slug)}
				<li>
					<EffectCard entry={effect} {start} today={effect.slug === todaySlug} />
				</li>
			{/each}
		</ul>
	{/if}

	<Settings />
</main>

<style>
	.page {
		padding-block: var(--space-fluid-section);
	}

	.glossary-link {
		text-align: center;
		margin-block: calc(var(--space-fluid-title) * -1 + var(--space-4)) var(--space-fluid-title);
	}

	h1 {
		font-size: var(--step-5);
		font-weight: var(--weight-black);
		line-height: var(--leading-display);
		letter-spacing: var(--track-5);
		text-transform: uppercase;
		text-align: center;
		text-box: trim-both cap alphabetic;
		margin-block-end: var(--space-fluid-title);
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-6) var(--space-8);
		align-items: start;
		border-block-end: var(--stroke) solid var(--hairline);
		padding-block-end: var(--space-6);
		margin-block-end: var(--space-fluid-section);
	}

	.search,
	.options {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.options {
		max-inline-size: 52ch;
	}

	input {
		appearance: none;
		border: 0;
		font-family: var(--font-mono);
		font-size: var(--text-ui);
		color: var(--ink);
		background: none;
		border-block-end: var(--stroke) solid var(--hairline-strong);
		padding-block-end: var(--space-1);
		inline-size: 24ch;
	}

	input::placeholder {
		color: var(--ink-dim);
	}

	/* Text-based segmented options: the active one is marked by contrast. */
	.choices {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-4);
	}

	.choices button {
		font-family: var(--font-sans);
		font-size: var(--text-ui);
		line-height: var(--leading-ui);
		color: var(--ink-dim);
		transition: color var(--duration) var(--ease);
	}

	.choices button:hover {
		color: var(--ink-mid);
	}

	.choices button.active {
		color: var(--ink);
	}

	.cards {
		list-style: none;
		padding: 0;
		margin-block-end: var(--space-fluid-section);
		row-gap: var(--space-fluid-section);
	}

	.empty {
		margin-block-end: var(--space-fluid-section);
	}

	@media (width < 768px) {
		.cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (width < 480px) {
		.cards {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
