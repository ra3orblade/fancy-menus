/**
 * Drag-and-drop interaction test — opens columnVisibility, performs an
 * actual mouse drag from one row's handle to another, and verifies the
 * order has changed.
 */

import puppeteer from 'puppeteer';

const URL = process.env.URL ?? 'http://localhost:4173';
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });

const errors = [];
page.on('pageerror', (err) => errors.push(err.message.split('\n')[0]));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await wait(500);

await page.evaluate(() => {
	[...document.querySelectorAll('aside button')].find((b) => b.textContent?.trim() === 'columnVisibility')?.click();
});
await wait(80);

await page.evaluate(() => {
	[...document.querySelectorAll('main button')].find((b) => /Open menu/.test(b.textContent ?? ''))?.click();
});
await wait(350);

const before = await visibleNames();
if (before.length < 4) {
	console.log('✗  needed at least 4 rows, got', before.length);
	await browser.close();
	process.exit(1);
}

// Pick the second draggable row's handle and drag it down to where the
// fourth draggable row currently sits.
const handles = await page.$$('[role="dialog"] [data-fm-drag-handle]');
if (handles.length < 4) {
	console.log('✗  needed 4+ drag handles, got', handles.length);
	await browser.close();
	process.exit(1);
}
const fromBox = await handles[1].boundingBox();
const toBox = await handles[3].boundingBox();

await page.mouse.move(fromBox.x + 5, fromBox.y + fromBox.height / 2);
await page.mouse.down();
// Move in two steps — dnd-kit needs >4px of motion to commit the drag.
await page.mouse.move(fromBox.x + 5, fromBox.y + fromBox.height / 2 + 20, { steps: 6 });
await wait(60);
const dragStarted = await page.evaluate(() => document.body.dataset.fmDragging === 'true');
await page.mouse.move(toBox.x + 5, toBox.y + toBox.height / 2, { steps: 12 });
await wait(80);
await page.mouse.up();
await wait(250);

const after = await visibleNames();
const lastDrag = await page.evaluate(() => document.body.dataset.fmLastDrag);
console.log('drag-end payload:', lastDrag);

await browser.close();

const checks = {
	rendered: before.length >= 4,
	hasHandles: handles.length >= 4,
	dragStarted: dragStarted,
	orderChanged: JSON.stringify(before) !== JSON.stringify(after),
	noErrors: errors.length === 0,
};

let failed = 0;
for (const [k, v] of Object.entries(checks)) {
	console.log(`${v ? '✓' : '✗'}  ${k}`);
	if (!v) failed++;
}
console.log();
console.log('before:', before.join(' / '));
console.log('after: ', after.join(' / '));
if (errors.length) console.log('errors:', errors);
process.exit(failed ? 1 : 0);

async function visibleNames() {
	return page.evaluate(() => {
		const dialog = document.querySelector('[role="dialog"]');
		if (!dialog) return [];
		return [...dialog.querySelectorAll('.fm-row .fm-row__name')].map((n) => n.textContent?.trim() ?? '');
	});
}

function wait(ms) {
	return new Promise((r) => setTimeout(r, ms));
}
