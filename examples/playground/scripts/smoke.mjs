/**
 * Smoke test — boots the playground, opens each example menu, asserts:
 *   - the menu mounts (`[role=dialog]`)
 *   - the body has rendered content (no "not yet rendered" placeholder text,
 *     and at least one body element is present)
 *   - no console errors and no page errors
 */

import puppeteer from 'puppeteer';

const URL = process.env.URL ?? 'http://localhost:5174';
// id → expected selector(s) inside the dialog. At least one must be present.
const EXAMPLES = [
	{ id: 'commandPalette', expect: '.fm-list [role="option"]' },
	{ id: 'themeColorPicker', expect: '.fm-list [role="option"]' },
	{ id: 'colorPickerShadcn', expect: 'input[type="text"], [role="slider"]' },
	{ id: 'columnVisibility', expect: '.fm-list [role="option"]' },
	{ id: 'datePicker', expect: 'button[aria-label="Pick month"]' },
	{ id: 'findInPage', expect: 'input[placeholder="Find"]' },
	{ id: 'mediaPicker', expect: '[role="tab"]' },
	{ id: 'queryBuilder', expect: 'select' },
	{ id: 'assigneePicker', expect: '.fm-list [role="option"], .fm-list [role="listbox"]' },
	{ id: 'layoutPicker', expect: '[role="grid"], .fm-form' },
	{ id: 'textFormatter', expect: '.fm-list--horizontal [role="option"]' },
	{ id: 'settingsWizard', expect: '.fm-list [role="option"]' },
	{ id: 'shareMenu', expect: 'input[readonly]' },
	{ id: 'cascadingMenu', expect: '.fm-list [role="option"]' },
	{ id: 'replacePagedNav', expect: '.fm-list [role="option"]' },
];

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
const errors = [];
page.on('console', (msg) => {
	if (msg.type() === 'error') errors.push({ scope: 'console', text: msg.text() });
});
page.on('pageerror', (err) => errors.push({ scope: 'pageerror', text: err.message.split('\n')[0] }));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 500));

const results = [];

for (const { id, expect } of EXAMPLES) {
	errors.length = 0;
	await page.evaluate((target) => {
		const btn = [...document.querySelectorAll('aside button')].find((b) => b.textContent?.trim() === target);
		btn?.click();
	}, id);
	await new Promise((r) => setTimeout(r, 80));

	await page.evaluate(() => {
		const btn = [...document.querySelectorAll('main button')].find((b) => /Open menu/.test(b.textContent ?? ''));
		btn?.click();
	});
	await new Promise((r) => setTimeout(r, 300));

	const checks = await page.evaluate((sel) => {
		const dialog = document.querySelector('[role="dialog"]');
		if (!dialog) return { mounted: false };
		const body = dialog.querySelector('.fm-body');
		const html = body?.innerHTML ?? '';
		const placeholder = /not yet rendered/i.test(html);
		const hasContent = sel.split(',').some((s) => dialog.querySelector(s.trim()));
		return {
			mounted: true,
			label: dialog.getAttribute('aria-label'),
			hasContent,
			placeholder,
			bodyEmpty: html.trim().length === 0,
		};
	}, expect);

	await page.keyboard.press('Escape');
	await new Promise((r) => setTimeout(r, 100));

	// Body-empty is allowed when content lives in the chrome (header / footer);
	// the `expect` selector is what determines "rendered".
	const ok = checks.mounted && checks.hasContent && !checks.placeholder && errors.length === 0;
	results.push({ id, ok, checks, errors: errors.slice(0, 3) });
}

await browser.close();

let failed = 0;
for (const r of results) {
	if (!r.ok) failed++;
	const status = r.ok ? '✓' : '✗';
	const flags = [
		r.checks.mounted ? 'mounted' : 'NOT-MOUNTED',
		r.checks.hasContent ? 'rendered' : 'NO-CONTENT',
		r.checks.placeholder ? 'PLACEHOLDER' : '',
		r.checks.bodyEmpty ? 'EMPTY-BODY' : '',
		r.errors.length ? `${r.errors.length} ERRORS` : '',
	]
		.filter(Boolean)
		.join(' · ');
	console.log(`${status}  ${r.id.padEnd(22)}  ${flags}`);
	if (r.errors.length) {
		for (const e of r.errors) console.log(`     [${e.scope}] ${e.text.split('\n')[0].slice(0, 200)}`);
	}
}

console.log();
console.log(`${EXAMPLES.length - failed}/${EXAMPLES.length} examples passing`);
process.exit(failed ? 1 : 0);
