/**
 * Renders one static poster per effect into static/posters/.
 *
 * Archive cards must not run live canvases, so each demo is played to a fixed
 * virtual time in headless Chromium and screenshotted. Deterministic: same
 * input, same PNG. Run on demand after adding or retuning an effect:
 *
 *   node scripts/posters.mjs [slug ...]
 */

import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { schedule } from '../src/content/schedule.js';

const WIDTH = 600;
const HEIGHT = 450;
const DPR = 2;

/** Seconds of virtual time before the shot. Per effect where the default is dull. */
const AT = {
	'particle-systems': 6,
	datamosh: 4.5,
	'dolly-zoom': 4.6,
	'reaction-diffusion': 4
};

const slugs = process.argv.slice(2).length > 0 ? process.argv.slice(2) : schedule.slugs;

await mkdir('static/posters', { recursive: true });

// configFile: false deliberately: this harness is plain ES modules, and the
// SvelteKit plugin would route /scripts/poster-harness.html to a 404.
const server = await createServer({
	configFile: false,
	root: process.cwd(),
	logLevel: 'warn',
	server: { port: 0 }
});
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, '');

const browser = await chromium.launch({
	args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader']
});
const page = await browser.newPage({
	viewport: { width: WIDTH, height: HEIGHT },
	deviceScaleFactor: DPR
});

page.on('pageerror', (error) => {
	console.error('page error:', error.message);
});

for (const slug of slugs) {
	const seconds = AT[slug] ?? 2.5;
	const url = `${base}/scripts/poster-harness.html?slug=${slug}&t=${seconds}&dpr=${DPR}`;
	await page.goto(url, { waitUntil: 'load' });
	await page.waitForFunction('window.__posterReady === true', null, { timeout: 60_000 });
	await page.screenshot({ path: `static/posters/${slug}.png` });
	console.log(`posters: ${slug}`);
}

await browser.close();
await server.close();
