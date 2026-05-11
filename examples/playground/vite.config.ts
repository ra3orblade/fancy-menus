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
		// drifting to 5174/5175 when 5173 is already taken, so dev URLs
		// stay stable across reloads.
		port: 5173,
		strictPort: true,
		open: true,
	},
});
