/**
 * README screenshots — opens a curated set of examples and captures each
 * open menu (cropped, @2x) into docs/screenshots/<id>.png.
 *
 *   bun scripts/screenshots.mjs            # dev server must be running
 */

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const URL = process.env.URL ?? 'http://localhost:5180';
const OUT = path.resolve(import.meta.dirname, '../../../docs/screenshots');
const PAD = 24;

const SHOTS = [
	'commandPalette',
	'datePicker',
	'mediaPicker',
	'colorPickerShadcn',
	'queryBuilder',
	'textFormatter',
	'settingsWizard',
];

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

for (const id of SHOTS) {
	// Hash-only navigation is same-document; hop through about:blank so each
	// shot starts from a fresh mount with no menus left open.
	await page.goto('about:blank');
	await page.goto(`${URL}/#${id}`, { waitUntil: 'networkidle0' });
	await page.evaluate(() => {
		[...document.querySelectorAll('main button')].find((b) => /Open menu/.test(b.textContent ?? ''))?.click();
	});
	await page.waitForSelector('[role="dialog"]');
	// Let open animations + async sources settle; drop the focus ring the
	// filter input grabs on mount so shots look like an idle menu.
	await new Promise((r) => setTimeout(r, 600));
	await page.mouse.move(0, 0);
	// Hide the playground UI; menus portal to document.body so they stay visible.
	await page.addStyleTag({ content: '#root { visibility: hidden; }' });

	const box = await page.evaluate(() => {
		const rects = [...document.querySelectorAll('.fm-menu')].map((el) => el.getBoundingClientRect());
		if (!rects.length) return null;
		const x = Math.min(...rects.map((r) => r.left));
		const y = Math.min(...rects.map((r) => r.top));
		const right = Math.max(...rects.map((r) => r.right));
		const bottom = Math.max(...rects.map((r) => r.bottom));
		return { x, y, width: right - x, height: bottom - y };
	});
	if (!box) {
		console.error(`✗ ${id}: no .fm-menu rendered`);
		process.exitCode = 1;
		continue;
	}

	const clip = {
		x: Math.max(0, box.x - PAD),
		y: Math.max(0, box.y - PAD),
		width: box.width + PAD * 2,
		height: box.height + PAD * 2,
	};
	const file = path.join(OUT, `${id}.png`);
	await page.screenshot({ path: file, clip });
	console.log(`✓ ${id} → ${path.relative(process.cwd(), file)}`);
}

await browser.close();
