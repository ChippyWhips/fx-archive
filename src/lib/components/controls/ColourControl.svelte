<script>
	/**
	 * A swatch plus the hex value in mono. The swatch is the native colour
	 * input, stripped of its OS chrome.
	 *
	 * @type {{ id: string, value: string, onchange: (v: string) => void }}
	 */
	let { id, value, onchange } = $props();
</script>

<div class="colour">
	<span class="hex">{value.toUpperCase()}</span>
	<input {id} type="color" {value} oninput={(event) => onchange(event.currentTarget.value)} />
</div>

<style>
	.colour {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		inline-size: 100%;
		justify-content: flex-end;
	}

	.hex {
		font-family: var(--font-mono);
		font-size: var(--text-ui);
		color: var(--row-ink, var(--ink-mid));
	}

	input {
		appearance: none;
		inline-size: 26px;
		block-size: 14px;
		padding: 0;
		border: var(--stroke) solid var(--hairline);
		background: none;
		cursor: pointer;
	}

	input::-webkit-color-swatch-wrapper {
		padding: 0;
	}

	input::-webkit-color-swatch {
		border: none;
	}

	input::-moz-color-swatch {
		border: none;
	}
</style>
