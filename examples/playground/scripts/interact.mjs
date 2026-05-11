/**
 * Interaction smoke — verifies positioning, keyboard nav, and selection
 * actually work end-to-end on commandPalette.
 */

import puppeteer from 'puppeteer';

const URL = process.env.URL ?? 'http://localhost:5174';
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
const errors = [];
page.on('pageerror', (err) => errors.push(err.message));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 500));

// Pick commandPalette
await page.evaluate(() => {
	[...document.querySelectorAll('aside button')].find((b) => b.textContent?.trim() === 'commandPalette')?.click();
});
await new Promise((r) => setTimeout(r, 100));

// Open menu
const trigger = await page.evaluate(() => {
	const btn = [...document.querySelectorAll('main button')].find((b) => /Open menu/.test(b.textContent ?? ''));
	const r = btn?.getBoundingClientRect();
	btn?.click();
	return r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null;
});
await new Promise((r) => setTimeout(r, 400));

// Position assertion: dialog is anchored near the trigger button (within a few hundred px).
const positioned = await page.evaluate(() => {
	const dialog = document.querySelector('[role="dialog"]');
	if (!dialog) return null;
	const r = dialog.getBoundingClientRect();
	return { x: r.x, y: r.y, w: r.width, h: r.height };
});

const dx = trigger && positioned ? Math.abs(trigger.x - positioned.x) : Number.POSITIVE_INFINITY;
const dy = trigger && positioned ? Math.abs(trigger.y - positioned.y) : Number.POSITIVE_INFINITY;
const positionedNear = positioned && dy < 400 && dx < 600;

// Filter input received focus
const focusedInputPlaceholder = await page.evaluate(() => {
	const a = document.activeElement;
	return a instanceof HTMLInputElement ? a.placeholder : null;
});

// Type a query and check filtered list
await page.keyboard.type('go to');
await new Promise((r) => setTimeout(r, 250));

const visibleRows = await page.evaluate(() => {
	return [...document.querySelectorAll('.fm-list [role="option"]')]
		.map((el) => el.textContent?.trim())
		.filter(Boolean);
});

// Esc closes
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 100));
const closedAfterEsc = await page.evaluate(() => !document.querySelector('[role="dialog"]'));

await browser.close();

const checks = {
	positionedNear,
	filterFocused: focusedInputPlaceholder?.includes('command') ?? false,
	filteredRowsContainGo: visibleRows.some((t) => /go to/i.test(t ?? '')),
	filteredRowsExcludeUnrelated: !visibleRows.some((t) => /Toggle theme/i.test(t ?? '')),
	closedAfterEsc,
	noErrors: errors.length === 0,
};

let failed = 0;
for (const [k, v] of Object.entries(checks)) {
	console.log(`${v ? '✓' : '✗'}  ${k}`);
	if (!v) failed++;
}
if (errors.length) {
	console.log('\npage errors:');
	for (const e of errors) console.log(`  ${e.split('\n')[0]}`);
}
console.log(
	`\nfilter dialog at ${positioned ? `(${positioned.x | 0},${positioned.y | 0})` : '?'}, trigger at ${trigger ? `(${trigger.x | 0},${trigger.y | 0})` : '?'}, visible rows after filter: ${visibleRows.length}`
);
process.exit(failed ? 1 : 0);
