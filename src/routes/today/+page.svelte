<script>
	import { resolve } from '$app/paths';
	import { effects, schedule } from '#lib/content/index.js';
	import { parseDay, indexForDate } from '#lib/schedule.js';

	/**
	 * A bookmarkable shortcut, not a page. Today's effect is resolved from the
	 * date in the browser so the page itself stays static, then we replace this
	 * entry in the history, so Back goes where the visitor came from.
	 */
	$effect(() => {
		const index = indexForDate(parseDay(schedule.startDate), new Date(), effects.length);
		const slug = index === null ? null : effects[index].slug;
		location.replace(slug ? resolve('/effects/[slug]', { slug }) : resolve('/'));
	});
</script>

<svelte:head><title>Today — FX Archive</title></svelte:head>

<main class="page">
	<p class="field-value">Opening today’s effect…</p>
	<p class="field-value"><a href={resolve('/')}>Archive</a></p>
</main>

<style>
	.page {
		padding-block: var(--space-fluid-section);
	}
</style>
