<script>
	import ControlRow from './controls/ControlRow.svelte';
	import RangeControl from './controls/RangeControl.svelte';
	import SelectControl from './controls/SelectControl.svelte';
	import ToggleControl from './controls/ToggleControl.svelte';
	import ColourControl from './controls/ColourControl.svelte';
	import ActionControl from './controls/ActionControl.svelte';

	/**
	 * Builds the whole control panel from a demo's `params` schema. No demo ever
	 * hand-builds its UI, so every playground on the site reads the same way.
	 *
	 * @type {{
	 *   schema: Record<string, Record<string, any>>,
	 *   values: Record<string, any>,
	 *   idPrefix: string,
	 *   onchange: (key: string, value: any) => void
	 * }}
	 */
	let { schema, values, idPrefix, onchange } = $props();

	/** Group in declaration order, so the schema controls the reading order. */
	const groups = $derived.by(() => {
		/** @type {[string, [string, Record<string, any>][]][]} */
		const ordered = [];
		for (const [key, spec] of Object.entries(schema)) {
			const name = spec.group ?? 'Controls';
			let group = ordered.find(([candidate]) => candidate === name);
			if (!group) {
				group = [name, []];
				ordered.push(group);
			}
			group[1].push([key, spec]);
		}
		return ordered;
	});

	/**
	 * Format a value for the right-hand edge. Decimal places follow the step, so
	 * a 0.01 step always reads as 0.50 rather than jumping between 0.5 and 0.52.
	 * @param {Record<string, any>} spec
	 * @param {any} value
	 */
	function display(spec, value) {
		if (spec.type === 'range') {
			const step = String(spec.step ?? 0.01);
			const places = step.includes('.') ? step.split('.')[1].length : 0;
			return `${Number(value).toFixed(places)}${spec.unit ?? ''}`;
		}
		if (spec.type === 'toggle') return value ? 'On' : 'Off';
		return undefined;
	}
</script>

<div class="controls">
	{#each groups as [group, rows] (group)}
		<section class="group">
			<h3 class="group-title">{group}</h3>
			{#each rows as [key, spec] (key)}
				{@const id = `${idPrefix}-${key}`}
				<ControlRow
					{id}
					label={spec.label ?? key}
					value={display(spec, values[key])}
					atDefault={spec.type !== 'action' && values[key] === spec.default}
					stack={spec.type === 'select'}
				>
					{#if spec.type === 'range'}
						<RangeControl {id} {spec} value={values[key]} onchange={(v) => onchange(key, v)} />
					{:else if spec.type === 'select'}
						<SelectControl {id} {spec} value={values[key]} onchange={(v) => onchange(key, v)} />
					{:else if spec.type === 'toggle'}
						<ToggleControl {id} value={values[key]} onchange={(v) => onchange(key, v)} />
					{:else if spec.type === 'colour'}
						<ColourControl {id} value={values[key]} onchange={(v) => onchange(key, v)} />
					{:else if spec.type === 'action'}
						<ActionControl {id} value={values[key]} onchange={(v) => onchange(key, v)} />
					{/if}
				</ControlRow>
				{#if spec.help}
					<p class="help">{spec.help}</p>
				{/if}
			{/each}
		</section>
	{/each}
</div>

<style>
	.controls {
		display: flex;
		flex-direction: column;
	}

	/* Hairline dividers between groups only; never a box around a control. */
	.group + .group {
		border-block-start: var(--stroke) solid var(--hairline);
		margin-block-start: var(--space-4);
		padding-block-start: var(--space-4);
	}

	.group-title {
		font-family: var(--font-sans);
		font-size: var(--text-ui);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-ui);
		color: var(--ink);
		margin-block-end: var(--space-2);
	}

	.help {
		font-family: var(--font-sans);
		font-size: var(--text-ui-sm);
		line-height: var(--leading-tight);
		color: var(--ink-dim);
		margin-block-end: var(--space-2);
		max-inline-size: 32ch;
	}
</style>
