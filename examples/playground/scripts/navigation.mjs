/**
 * Replace-paged navigation test:
 *   - root list mounts
 *   - clicking a category swaps the menu in-place (still 1 dialog, new title)
 *   - back arrow appears (history exists)
 *   - clicking back restores the root with its previous data intact
 */

import puppeteer from 'puppeteer';

const URL = process.env.URL ?? 'http://localhost:4173';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
const errors = [];
page.on('pageerror', (err) => errors.push(err.message.split('\n')[0]));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await wait(500);

await page.evaluate(() => {
	[...document.querySelectorAll('aside button')].find((b) => b.textContent?.trim() === 'replacePagedNav')?.click();
});
await wait(80);

await page.evaluate(() => {
	[...document.querySelectorAll('main button')].find((b) => /Open menu/.test(b.textContent ?? ''))?.click();
});
await wait(350);

const root = await snapshot();

// Click "Theme" — should swap the menu in-place
await page.evaluate(() => {
	const themeRow = [...document.querySelectorAll('.fm-row')].find((r) => r.textContent?.includes('Theme'));
	themeRow?.click();
});
await wait(250);

const detail = await snapshot();

// Back arrow should be present + functional now
await page.evaluate(() => {
	const back = document.querySelector('button[aria-label="Back"]');
	back?.click();
});
await wait(250);

const backToRoot = await snapshot();

await browser.close();

const checks = {
	rootMounted: root.dialogs === 1 && root.title === 'Settings',
	swapKeepsSingleDialog: detail.dialogs === 1,
	detailTitleIsCategoryName: detail.title === 'Theme',
	backArrowShown: detail.hasBack,
	backRestoresRoot: backToRoot.dialogs === 1 && backToRoot.title === 'Settings',
	noErrors: errors.length === 0,
};

let failed = 0;
for (const [k, v] of Object.entries(checks)) {
	console.log(`${v ? '✓' : '✗'}  ${k}`);
	if (!v) failed++;
}
console.log();
console.log('root:', root, '\ndetail:', detail, '\nbackToRoot:', backToRoot);
if (errors.length) console.log('errors:', errors);
process.exit(failed ? 1 : 0);

async function snapshot() {
	return page.evaluate(() => {
		const dialogs = document.querySelectorAll('[role="dialog"]').length;
		const dialog = document.querySelector('[role="dialog"]');
		const titleEl = dialog?.querySelector('header h3');
		return {
			dialogs,
			title: titleEl?.textContent?.trim() ?? null,
			hasBack: !!dialog?.querySelector('button[aria-label="Back"]'),
		};
	});
}
