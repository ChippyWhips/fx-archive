<script>
	import EffectPage from '#lib/components/EffectPage.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.effect.name} — FX Archive</title>
	<meta name="description" content={data.effect.oneLiner} />
</svelte:head>

<EffectPage entry={data.effect} Body={data.Body} />
