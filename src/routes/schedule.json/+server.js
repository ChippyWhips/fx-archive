import { json } from '@sveltejs/kit';
import { effects, schedule } from '#lib/content/index.js';

/** Prerendered so the notification script can name today's effect. */
export const prerender = true;

export function GET() {
	return json({
		startDate: schedule.startDate,
		effects: effects.map(({ slug, name, servedOn }) => ({ slug, name, servedOn }))
	});
}
