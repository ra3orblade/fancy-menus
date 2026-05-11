import puppeteer from 'puppeteer';

const URL = process.env.URL ?? 'http://localhost:5174';
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
const errors = [];
page.on('console', (msg) => console.log(`[console.${msg.type()}]`, msg.text()));
page.on('pageerror', (err) => errors.push(`${err.message}\n${err.stack}`));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 800));

console.log('--- buttons in sidebar ---');
const sidebarButtons = await page.evaluate(() => {
	return [...document.querySelectorAll('aside button')].map((b) => ({
		text: b.textContent?.trim(),
		cls: b.className.slice(0, 60),
	}));
});
console.log(JSON.stringify(sidebarButtons, null, 2));

console.log('--- main header buttons ---');
const headerButtons = await page.evaluate(() => {
	return [...document.querySelectorAll('main header button')].map((b) => ({
		text: b.textContent?.trim(),
		type: b.getAttribute('type'),
	}));
});
console.log(JSON.stringify(headerButtons, null, 2));

console.log('--- click open ---');
const clicked = await page.evaluate(() => {
	const btn = [...document.querySelectorAll('button')].find((b) => /Open menu/i.test(b.textContent ?? ''));
	if (btn) {
		btn.click();
		return true;
	}
	return false;
});
console.log('clicked=', clicked);
await new Promise((r) => setTimeout(r, 600));

console.log('--- DOM after click ---');
const dom = await page.evaluate(() => {
	return {
		bodyChildren: [...document.body.children].map((c) => ({
			tag: c.tagName,
			cls: (c.className || '').slice(0, 80),
			role: c.getAttribute('role'),
			preview: c.outerHTML.slice(0, 160),
		})),
		fmMenu: !!document.querySelector('.fm-menu'),
		fixed: [...document.querySelectorAll('div')]
			.filter((d) => getComputedStyle(d).position === 'fixed')
			.slice(0, 5)
			.map((d) => ({ cls: d.className.slice(0, 80), role: d.getAttribute('role') })),
	};
});
console.log(JSON.stringify(dom, null, 2));

console.log('--- pageerrors ---');
console.log(errors.join('\n---\n') || '(none)');

await browser.close();
