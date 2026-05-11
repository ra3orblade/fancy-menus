/**
 * Run all four playground test suites against a dedicated Vite instance
 * on port 4173 (separate from the user's dev server on 5173). Boots the
 * server, waits for it to come up, runs each suite, then tears down.
 */

import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

const PORT = 4173;
const URL = `http://127.0.0.1:${PORT}`;

const suites = ['smoke.mjs', 'interact.mjs', 'cascading.mjs', 'visual.mjs', 'drag.mjs'];

// biome-ignore lint/style/useConst: dev is assigned below by spawn(), not at declaration
let dev;
const cleanup = () => {
	if (dev && !dev.killed) dev.kill('SIGTERM');
};
process.on('exit', cleanup);
process.on('SIGINT', () => {
	cleanup();
	process.exit(130);
});
process.on('SIGTERM', () => {
	cleanup();
	process.exit(143);
});

console.log(`▸ booting Vite on ${URL}…`);
dev = spawn('bun', ['run', 'dev:test'], { stdio: ['ignore', 'pipe', 'pipe'] });
const log = [];
dev.stdout.on('data', (d) => log.push(String(d)));
dev.stderr.on('data', (d) => log.push(String(d)));

// Wait for "ready" line
const deadline = Date.now() + 15_000;
while (Date.now() < deadline) {
	if (log.join('').includes('ready in')) break;
	await wait(150);
}
if (Date.now() >= deadline) {
	console.error('Vite did not become ready in 15s. Log:');
	console.error(log.join(''));
	cleanup();
	process.exit(1);
}
await wait(400);

let failed = 0;
for (const suite of suites) {
	console.log(`\n▸ ${suite}`);
	const child = spawn('bun', [`scripts/${suite}`], {
		stdio: 'inherit',
		env: { ...process.env, URL },
	});
	const code = await new Promise((r) => child.on('exit', r));
	if (code !== 0) failed++;
}

cleanup();
console.log();
if (failed > 0) console.error(`${failed} suite(s) failed`);
else console.log('all suites passed');
process.exit(failed > 0 ? 1 : 0);
