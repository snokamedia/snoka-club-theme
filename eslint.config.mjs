/**
 * Flat config (ESLint 10 + @wordpress/eslint-plugin 28).
 *
 * Deviation from AGENTS.md rule 15 recorded: that rule prescribes an
 * `.eslintrc.js` extending `plugin:@wordpress/eslint-plugin/recommended`,
 * which ESLint 10 no longer loads. Same preset, flat-config spelling, plus
 * the mandated `@typescript-eslint/no-use-before-define` (variables: true).
 */
import wordpress from '@wordpress/eslint-plugin';

export default [
	...wordpress.configs.recommended,
	{
		files: [ '**/*.ts', '**/*.tsx' ],
		rules: {
			'@typescript-eslint/no-use-before-define': [
				'error',
				{ variables: true },
			],
		},
	},
	{
		// Block editor entries externalize every WordPress module to the
		// editor's wp.* globals (see vite.blocks.config.mjs). They are
		// provided by core at runtime and intentionally never bundled,
		// so the extraneous-dependencies rule does not apply here.
		files: [ 'src/blocks/**/*.{ts,tsx}' ],
		rules: {
			'import/no-extraneous-dependencies': 'off',
		},
	},
	{
		ignores: [ 'dist/**', 'node_modules/**' ],
	},
];
