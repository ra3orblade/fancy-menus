/**
 * Cascading-menu interaction test — verifies sub-menu spawn paths:
 *   - hover-spawn after the configured 200ms delay
 *   - safe-polygon overlay is mounted between parent and child
 *   - ArrowRight opens, ArrowLeft closes (returns focus to parent)
 *   - 3-deep nesting works
 */

import puppeteer from 'puppeteer';

const URL = process.env.URL ?? 'http://localhost:5180';
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });

const errors = [];
page.on('pageerror', (err) => errors.push(err.message.split('\n')[0]));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 600));

// Switch to cascadingMenu
await page.evaluate(() => {
	[...document.querySelectorAll('aside button')].find((b) => b.textContent?.trim() === 'cascadingMenu')?.click();
});
await new Promise((r) => setTimeout(r, 100));

// Open the root menu
await page.evaluate(() => {
	const btn = [...document.querySelectorAll('main button')].find((b) => /Open menu/.test(b.textContent ?? ''));
	btn?.click();
});
await new Promise((r) => setTimeout(r, 350));

const rootCount = await page.evaluate(() => document.querySelectorAll('[role="dialog"]').length);

// Hover the "Format" row (5th row, index 3 if we skip cut/copy/star → format)
const formatRect = await page.evaluate(() => {
	const rows = [...document.querySelectorAll('[role="dialog"] [data-submenu-id]')];
	const formatRow = rows.find((r) => r.textContent?.includes('Format'));
	if (!formatRow) return null;
	const r = formatRow.getBoundingClientRect();
	return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});

if (!formatRect) {
	console.log('✗  could not find Format row');
	await browser.close();
	process.exit(1);
}

await page.mouse.move(formatRect.x, formatRect.y);
// Wait beyond the 200ms hover threshold
await new Promise((r) => setTimeout(r, 380));

const afterHover = await page.evaluate(() => ({
	dialogs: document.querySelectorAll('[role="dialog"]').length,
	hasPolygon: !!document.querySelector('[data-fm-safe-polygon]'),
	formatChildHasItems: !![...document.querySelectorAll('[role="dialog"]')].find(
		(d) => d.textContent?.includes('Bold') && d.textContent?.includes('Text style')
	),
}));

// Step keyboard nav slowly enough that React state updates have committed
// between presses (the keyboard handler closes over `index` from props).
const press = async (key) => {
	await page.keyboard.press(key);
	await new Promise((r) => setTimeout(r, 40));
};
await press('ArrowDown'); // bold → italic
await press('ArrowDown'); // italic → underline
await press('ArrowDown'); // underline → code
await press('ArrowDown'); // code → text style
await press('ArrowRight');
await new Promise((r) => setTimeout(r, 300));

const afterArrowRight = await page.evaluate(() => ({
	dialogs: document.querySelectorAll('[role="dialog"]').length,
	textStyleVisible: !![...document.querySelectorAll('[role="dialog"]')].find((d) =>
		d.textContent?.includes('Heading 1')
	),
}));

// ArrowLeft should close the deepest child
await page.keyboard.press('ArrowLeft');
await new Promise((r) => setTimeout(r, 200));

const afterArrowLeft = await page.evaluate(() => ({
	dialogs: document.querySelectorAll('[role="dialog"]').length,
}));

// Re-open the format sub-menu, then close the ROOT and confirm everything
// in the stack is gone (cascade-close).
await page.evaluate(() => {
	const formatRow = [...document.querySelectorAll('[role="dialog"] [data-submenu-id]')].find((r) =>
		r.textContent?.includes('Format')
	);
	formatRow?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 280));

const beforeRootClose = await page.evaluate(() => document.querySelectorAll('[role="dialog"]').length);
// Press Escape on the root by clicking its dialog first to focus it.
await page.evaluate(() => {
	const root = document.querySelector('[data-fm-menu-id="cascadingMenu"]');
	root?.focus();
});
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 150));
const afterRootClose = await page.evaluate(() => document.querySelectorAll('[role="dialog"]').length);

await browser.close();

const checks = {
	rootMounted: rootCount === 1,
	hoverOpensChild: afterHover.dialogs >= 2,
	safePolygonMounted: afterHover.hasPolygon,
	formatChildHasExpectedItems: afterHover.formatChildHasItems,
	arrowRightOpensThirdLevel: afterArrowRight.dialogs >= 3 && afterArrowRight.textStyleVisible,
	arrowLeftClosesDeepestChild: afterArrowLeft.dialogs === afterArrowRight.dialogs - 1,
	cascadeCloseClearsStack: beforeRootClose >= 2 && afterRootClose === 0,
	noErrors: errors.length === 0,
};

let failed = 0;
for (const [k, v] of Object.entries(checks)) {
	console.log(`${v ? '✓' : '✗'}  ${k}`);
	if (!v) failed++;
}
if (errors.length) {
	console.log('\npage errors:');
	for (const e of errors) console.log(`  ${e}`);
}
console.log();
console.log(
	`stack depth after hover: ${afterHover.dialogs}, after ArrowRight: ${afterArrowRight.dialogs}, after ArrowLeft: ${afterArrowLeft.dialogs}`
);
process.exit(failed ? 1 : 0);
