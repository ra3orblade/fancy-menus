import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@fancy-menus/core': path.resolve(__dirname, '../../packages/core/src'),
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
