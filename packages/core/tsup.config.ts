import { copyFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

// Three entry points mirror the package "exports" map:
//   .          -> dist/index.js
//   ./types    -> dist/types/index.js
//   ./runtime  -> dist/runtime/index.js
// Runtime deps + peerDeps are externalized by tsup automatically (read from
// package.json), so we only ship our own code. ESM output with valid,
// extensioned import specifiers — works in bundlers and raw Node ESM alike.
export default defineConfig({
	entry: {
		index: 'src/index.ts',
		'types/index': 'src/types/index.ts',
		'runtime/index': 'src/runtime/index.ts',
	},
	format: ['esm'],
	dts: true,
	sourcemap: false,
	clean: true,
	treeshake: true,
	// runtime.css is shipped verbatim, not bundled — copy it next to the runtime
	// entry so `@react-fancy-menus/core/runtime.css` resolves.
	onSuccess: async () => {
		copyFileSync('src/runtime/runtime.css', 'dist/runtime/runtime.css');
	},
});
