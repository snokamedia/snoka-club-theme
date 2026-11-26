import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Theme build. Entries:
 * - main: vanilla global behaviors (year, copy buttons).
 * - transitions: swup page transitions (frontend only, never editor).
 * - islands: single React entry (dialog + toasts share one runtime).
 */
export default defineConfig( {
	base: '/wp-content/themes/snoka-club/dist/',
	plugins: [ react() ],
	build: {
		manifest: true,
		outDir: 'dist',
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: 'src/main.ts',
				transitions: 'src/transitions.ts',
				islands: 'src/islands.tsx',
			},
		},
	},
} );
