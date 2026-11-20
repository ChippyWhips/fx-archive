<script>
	/**
	 * A small rectangular toggle, not a round switch. The native checkbox stays
	 * underneath, restyled.
	 *
	 * @type {{ id: string, value: boolean, onchange: (v: boolean) => void }}
	 */
	let { id, value, onchange } = $props();
</script>

<input
	{id}
	type="checkbox"
	checked={value}
	onchange={(event) => onchange(event.currentTarget.checked)}
/>

<style>
	input {
		appearance: none;
		margin: 0 0 0 auto;
		inline-size: 26px;
		block-size: 14px;
		border: var(--stroke) solid var(--hairline-strong);
		background: transparent;
		cursor: pointer;
		position: relative;
	}

	input::after {
		content: '';
		position: absolute;
		inset-block: 2px;
		inset-inline-start: 2px;
		inline-size: 8px;
		background: var(--hairline-strong);
		transition: translate var(--duration) var(--ease);
	}

	input:checked::after {
		translate: 10px 0;
	}

	input:not(:checked) {
		border-color: var(--hairline);
	}

	input:not(:checked)::after {
		background: var(--ink-dim);
	}
</style>
