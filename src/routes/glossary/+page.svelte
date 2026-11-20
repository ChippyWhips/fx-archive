<script>
	import { resolve } from '$app/paths';
	import { effects } from '#lib/content/index.js';
	import ArchiveLink from '#lib/components/ArchiveLink.svelte';

	/** @type {Map<string, string>} slug to display name, for the related links. */
	const names = new Map(effects.map((effect) => [effect.slug, effect.name]));

	/**
	 * Alphabetical, not schedule order. The archive is the chronology; this page
	 * exists to be looked things up in, so it sorts the way a reference does.
	 */
	const sorted = [...effects].sort((a, b) => a.name.localeCompare(b.name, 'en'));

	/** @type {{ letter: string, terms: typeof sorted }[]} */
	const groups = [];
	for (const effect of sorted) {
		const letter = effect.name[0].toUpperCase();
		const last = groups.at(-1);
		if (last?.letter === letter) last.terms.push(effect);
		else groups.push({ letter, terms: [effect] });
	}
</script>

<svelte:head>
	<title>Glossary — FX Archive</title>
	<meta name="description" content="Every effect in the archive, defined and cross-referenced." />
</svelte:head>

<ArchiveLink />

<main class="page">
	<h1 class="title">Glossary</h1>

	<nav class="letters" aria-label="Jump to a letter">
		{#each groups as group (group.letter)}
			<a href="#letter-{group.letter}">{group.letter}</a>
		{/each}
	</nav>

	{#each groups as group (group.letter)}
		<section class="group" aria-labelledby="letter-{group.letter}">
			<h2 class="letter" id="letter-{group.letter}">{group.letter}</h2>

			<ul class="terms">
				{#each group.terms as effect (effect.slug)}
					<li class="grid term">
						<h3 class="name">
							<a href={resolve('/effects/[slug]', { slug: effect.slug })}>{effect.name}</a>
						</h3>

						<div class="definition">
							<p>{effect.oneLiner}</p>
						</div>

						<div class="meta">
							<div class="field">
								<span class="field-label">Also called</span>
								<ul class="field-value list">
									{#each effect.synonyms as synonym (synonym)}<li>{synonym}</li>{/each}
								</ul>
							</div>
							<div class="field">
								<span class="field-label">Collection</span>
								<p class="field-value">{effect.collection}</p>
							</div>
							<div class="field">
								<span class="field-label">Related</span>
								<ul class="field-value list">
									{#each effect.related as slug (slug)}
										<li>
											<a href={resolve('/effects/[slug]', { slug })}>{names.get(slug) ?? slug}</a>
										</li>
									{/each}
								</ul>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</main>

<style>
	.page {
		padding-block: var(--space-fluid-section);
	}

	/* Matches the effect page title, so the two read as the same kind of page. */
	.title {
		font-size: var(--display);
		font-weight: var(--weight-black);
		line-height: var(--leading-display);
		letter-spacing: var(--track-display);
		text-transform: uppercase;
		text-align: center;
		text-box: trim-both cap alphabetic;
		margin-block: var(--space-fluid-title);
	}

	.letters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-4);
		border-block: var(--stroke) solid var(--hairline);
		padding-block: var(--space-4);
		margin-block-end: var(--space-fluid-section);
	}

	.letters a {
		font-size: var(--text-ui);
		line-height: var(--leading-ui);
	}

	.group {
		margin-block-end: var(--space-fluid-section);
	}

	.letter {
		font-family: var(--font-mono);
		font-size: var(--text-ui);
		font-weight: var(--weight-regular);
		letter-spacing: var(--track-label);
		color: var(--ink-dim);
		margin-block-end: var(--space-4);
		scroll-margin-block-start: var(--space-fluid-section);
	}

	.terms {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.term {
		align-items: start;
		border-block-start: var(--stroke) solid var(--hairline);
		padding-block: var(--space-6);
	}

	.name {
		font-size: var(--step-2);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--track-4);
	}

	/* The term links to its own page, so it carries the heading's weight rather
	   than the quieter mono styling links take everywhere else. */
	.name a {
		font-family: inherit;
		font-weight: inherit;
		color: var(--ink);
	}

	.definition {
		grid-column: 2 / span 2;
		font-size: var(--step-2);
		font-weight: var(--weight-light);
		line-height: var(--leading-tight);
		max-inline-size: var(--measure-overview);
	}

	.definition p {
		margin-block: 0;
	}

	.meta {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
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

	@media (width < 768px) {
		.term {
			gap: var(--space-4);
		}

		.name,
		.definition,
		.meta {
			grid-column: 1 / -1;
		}
	}
</style>
