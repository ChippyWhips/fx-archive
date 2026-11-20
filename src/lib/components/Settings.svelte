<script>
	import { exportJson, importJson } from '#lib/storage.js';
	import { replace } from '#lib/personal.svelte.js';

	/**
	 * Export and import exist for one reason: a browser clearing site data is
	 * the only way favourites are ever lost, and it happens.
	 */
	let message = $state('');
	/** @type {HTMLInputElement | undefined} */
	let fileInput = $state();

	function download() {
		const blob = new Blob([exportJson()], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `fx-archive-${new Date().toISOString().slice(0, 10)}.json`;
		link.click();
		URL.revokeObjectURL(url);
		message = 'Exported.';
	}

	/** @param {Event} event */
	async function upload(event) {
		const input = /** @type {HTMLInputElement} */ (event.currentTarget);
		const file = input.files?.[0];
		if (!file) return;
		const result = importJson(await file.text());
		input.value = '';
		if (!result.ok) {
			message = result.error;
			return;
		}
		replace(result.store);
		message = `Imported ${result.store.favourites.length} favourites and ${result.store.viewed.length} viewed.`;
	}
</script>

<section class="settings">
	<h2 class="field-label">Backup</h2>
	<div class="actions">
		<button type="button" class="pill" onclick={download}>Export</button>
		<button type="button" class="pill" onclick={() => fileInput?.click()}>Import</button>
		<input
			bind:this={fileInput}
			type="file"
			accept="application/json"
			class="visually-hidden"
			onchange={upload}
		/>
	</div>
	<p class="field-value" aria-live="polite">
		{message || 'Favourites and viewed effects live in this browser only.'}
	</p>
</section>

<style>
	.settings {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		align-items: start;
		border-block-start: var(--stroke) solid var(--hairline);
		padding-block-start: var(--space-6);
	}

	.actions {
		display: flex;
		gap: var(--space-2);
	}

	.pill {
		font-family: var(--font-sans);
		font-size: var(--text-ui);
		line-height: var(--leading-ui);
		color: var(--ink);
		background: var(--surface-panel);
		border-radius: var(--radius-pill);
		padding: var(--space-2) var(--space-4);
		transition: background var(--duration) var(--ease);
	}

	.pill:hover {
		background: color-mix(in oklab, var(--surface-panel), var(--ink) 8%);
	}
</style>
