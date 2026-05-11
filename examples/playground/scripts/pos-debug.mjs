import puppeteer from 'puppeteer';

const URL = process.env.URL ?? 'http://localhost:5174';
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
page.on('console', (msg) => console.log(`[${msg.type()}]`, msg.text()));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 500));

await page.evaluate(() => {
	[...document.querySelectorAll('aside button')].find((b) => b.textContent?.trim() === 'commandPalette')?.click();
});
await new Promise((r) => setTimeout(r, 100));

const triggerInfo = await page.evaluate(() => {
	const btn = [...document.querySelectorAll('main header button')].find((b) => /Open menu/.test(b.textContent ?? ''));
	if (!btn) return null;
	const r = btn.getBoundingClientRect();
	btn.click();
	return { x: r.x, y: r.y, w: r.width, h: r.height, bottom: r.bottom };
});
console.log('trigger:', triggerInfo);

await new Promise((r) => setTimeout(r, 800));

const dialogInfo = await page.evaluate(() => {
	const d = document.querySelector('[role="dialog"]');
	if (!d) return null;
	const r = d.getBoundingClientRect();
	const cs = getComputedStyle(d);
	return {
		inline: {
			left: d.style.left,
			top: d.style.top,
			width: d.style.width,
			opacity: d.style.opacity,
		},
		computed: {
			position: cs.position,
			transform: cs.transform,
			top: cs.top,
			left: cs.left,
			animation: cs.animationName,
		},
		classes: d.className,
		rect: { x: r.x, y: r.y, w: r.width, h: r.height },
		parent: d.parentElement?.tagName,
		bodyHeight: document.body.scrollHeight,
		viewport: { w: window.innerWidth, h: window.innerHeight },
	};
});
console.log('dialog:', dialogInfo);

await browser.close();
