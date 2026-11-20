<script>
	/**
	 * A tiny text control fixed top-right: "Light  Dark" in Geist Mono with a
	 * small dot beside the active option. Follows the system preference until
	 * used, then remembers the choice.
	 */
	const KEY = 'vv:theme';

	/** @type {'light'|'dark'|null} */
	let choice = $state(null);

	$effect(() => {
		try {
			const stored = localStorage.getItem(KEY);
			if (stored === 'light' || stored === 'dark') choice = stored;
		} catch {
			// Storage can be unavailable (private window, blocked site data).
			// The toggle still works for this page view; it just won't persist.
		}
	});

	$effect(() => {
		if (choice) document.documentElement.dataset.theme = choice;
		else delete document.documentElement.dataset.theme;
	});

	/** @param {'light'|'dark'} next */
	function pick(next) {
		choice = next;
		try {
			localStorage.setItem(KEY, next);
		} catch {
			// Ignored, as above.
		}
	}

	// Before a choice is made neither option is marked, because the system
	// preference decides and we cannot read it during prerender.
	const active = $derived(choice);
</script>

<div class="theme">
	<button type="button" aria-pressed={active === 'light'} onclick={() => pick('light')}>
		<span class="dot" class:on={active === 'light'} aria-hidden="true"></span>Light
	</button>
	<button type="button" aria-pressed={active === 'dark'} onclick={() => pick('dark')}>
		<span class="dot" class:on={active === 'dark'} aria-hidden="true"></span>Dark
	</button>
</div>

<style>
	.theme {
		position: fixed;
		inset-block-start: var(--space-4);
		inset-inline-end: var(--space-4);
		z-index: 10;
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-6);
		border-radius: var(--radius-pill);
		/* Solid, never translucent, so it stays legible over any demo. */
		background: var(--surface-panel);
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-family: var(--font-mono);
		font-size: var(--text-ui);
		line-height: 1;
		color: var(--ink-dim);
		transition: color var(--duration) var(--ease);
	}

	button[aria-pressed='true'] {
		color: var(--ink);
	}

	button:hover {
		color: var(--ink);
	}

	.dot {
		inline-size: 4px;
		block-size: 4px;
		border-radius: var(--radius-pill);
		background: currentColor;
		opacity: 0;
		transition: opacity var(--duration) var(--ease);
	}

	.dot.on {
		opacity: 1;
	}
</style>
