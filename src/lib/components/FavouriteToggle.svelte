<script>
	import { onMount } from 'svelte';
	import { personal, hydrate, toggle } from '#lib/personal.svelte.js';

	/**
	 * A plus that becomes a tick once favourited. Never a heart, never a
	 * bookmark. Same 1px stroke on a 16px grid as the archive chevron.
	 *
	 * @type {{ slug: string }}
	 */
	let { slug } = $props();

	// onMount rather than $effect: storage is read once, on the client only.
	onMount(hydrate);

	const favourited = $derived(personal.favourites.includes(slug));
</script>

<button type="button" aria-pressed={favourited} onclick={() => toggle(slug)}>
	<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
		{#if favourited}
			<path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" stroke-width="1" />
		{:else}
			<path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" stroke-width="1" />
		{/if}
	</svg>
	<span class="visually-hidden">{favourited ? 'Remove from favourites' : 'Add to favourites'}</span>
</button>

<style>
	button {
		display: inline-flex;
		color: var(--ink);
	}

	svg {
		inline-size: var(--icon-size);
		block-size: var(--icon-size);
	}
</style>
