<script>
	import '#lib/styles/app.css';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link
		rel="preload"
		href="/fonts/Geist-Variable.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
	<link
		rel="preload"
		href="/fonts/GeistMono-Variable.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
</svelte:head>

<ThemeToggle />

{@render children()}
