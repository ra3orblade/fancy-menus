/**
 * Visual snapshot — opens textFormatter and captures the toolbar so we can
 * verify the hover/pressed states render correctly.
 */

import puppeteer from 'puppeteer';

const URL = process.env.URL ?? 'http://localhost:5180';
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 500));

await page.evaluate(() => {
	[...document.querySelectorAll('aside button')].find((b) => b.textContent?.trim() === 'textFormatter')?.click();
});
await new Promise((r) => setTimeout(r, 100));

await page.evaluate(() => {
	[...document.querySelectorAll('main button')].find((b) => /Open menu/.test(b.textContent ?? ''))?.click();
});
await new Promise((r) => setTimeout(r, 350));

const checks = await page.evaluate(() => {
	const dialog = document.querySelector('[role="dialog"]');
	if (!dialog) return null;
	const rows = [...dialog.querySelectorAll('[role="option"]')];
	const bold = rows.find((r) => r.getAttribute('aria-pressed') === 'true');
	const anyActive = rows.find((r) => r.getAttribute('data-active') === 'true');
	return {
		count: rows.length,
		boldPressed: !!bold,
		boldText: bold?.textContent?.trim(),
		anyKeyboardActive: !!anyActive,
		isHorizontal: !!dialog.querySelector('.fm-list--horizontal'),
		bg: bold ? getComputedStyle(bold).backgroundColor : null,
	};
});

await browser.close();

const expectations = {
	mounted: checks != null,
	isHorizontalToolbar: checks?.isHorizontal,
	hasItems: (checks?.count ?? 0) > 0,
	boldShownAsPressed: checks?.boldPressed,
	noKeyboardActiveOnOpen: !checks?.anyKeyboardActive,
};

let failed = 0;
for (const [k, v] of Object.entries(expectations)) {
	console.log(`${v ? '✓' : '✗'}  ${k}`);
	if (!v) failed++;
}
console.log();
console.log('checks:', JSON.stringify(checks, null, 2));
process.exit(failed ? 1 : 0);
