<script>
	import { loadSnippet } from '#lib/snippets.js';

	/**
	 * The copyable snippet. Pasted into an empty HTML file it runs as is: no
	 * build step and no site code. The second view is the demo module alone,
	 * for dropping into an existing project.
	 *
	 * @type {{ slug: string }}
	 */
	let { slug } = $props();

	let view = $state(/** @type {'snippet' | 'demo'} */ ('snippet'));
	let copied = $state(false);

	const source = $derived(loadSnippet(slug));

	/** @param {string} text */
	async function copy(text) {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 1600);
		} catch {
			copied = false;
		}
	}
</script>

{#await source then code}
	<section class="panel">
		<div class="bar">
			<div class="views" role="radiogroup" aria-label="Code view">
				<button
					type="button"
					role="radio"
					aria-checked={view === 'snippet'}
					class:active={view === 'snippet'}
					onclick={() => (view = 'snippet')}>Standalone page</button
				>
				<button
					type="button"
					role="radio"
					aria-checked={view === 'demo'}
					class:active={view === 'demo'}
					onclick={() => (view = 'demo')}>demo.js</button
				>
			</div>

			<button
				type="button"
				class="pill"
				onclick={() => copy(view === 'snippet' ? code.snippet : code.demo)}
			>
				{copied ? 'Copied' : 'Copy'}
			</button>
		</div>

		<pre><code>{view === 'snippet' ? code.snippet : code.demo}</code></pre>
	</section>
{/await}

<style>
	.panel {
		background: var(--surface-panel);
		border-radius: var(--radius-panel);
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
	}

	.views {
		display: flex;
		gap: var(--space-4);
	}

	.views button {
		font-family: var(--font-sans);
		font-size: var(--text-ui);
		line-height: var(--leading-ui);
		color: var(--ink-dim);
		transition: color var(--duration) var(--ease);
	}

	.views button:hover {
		color: var(--ink-mid);
	}

	.views button.active {
		color: var(--ink);
	}

	.pill {
		font-family: var(--font-sans);
		font-size: var(--text-ui);
		line-height: var(--leading-ui);
		color: var(--surface);
		background: var(--ink);
		border-radius: var(--radius-pill);
		padding: var(--space-2) var(--space-4);
	}

	pre {
		margin: 0;
		max-block-size: 32rem;
		overflow: auto;
		overscroll-behavior: contain;
	}

	code {
		font-family: var(--font-mono);
		font-size: var(--text-ui-sm);
		line-height: var(--leading-body);
		color: var(--ink-mid);
		white-space: pre;
		tab-size: 2;
	}
</style>
