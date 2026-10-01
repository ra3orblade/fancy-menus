import { readFileSync } from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const coreVersion: string = JSON.parse(
	readFileSync(path.resolve(__dirname, '../../packages/core/package.json'), 'utf8')
).version;

export default defineConfig({
	// GitHub Pages serves the demo under /fancy-menus/; local dev stays at /.
	base: process.env.BASE_PATH ?? '/',
	plugins: [react()],
	define: {
		__CORE_VERSION__: JSON.stringify(coreVersion),
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@react-fancy-menus/core': path.resolve(__dirname, '../../packages/core/src'),
		},
	},
	server: {
		// Fixed port + strictPort — Vite errors out instead of silently
		// drifting when the port is taken, so dev URLs stay stable across
		// reloads. 5180 is chosen to dodge the busy 5173/5174 range that
		// most other Vite / electron-vite projects occupy by default.
		port: 5180,
		strictPort: true,
		open: true,
	},
});
