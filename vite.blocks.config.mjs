import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Block editor bundle (separate config: WordPress-provided modules must be
 * external here but stay bundled in the frontend entries).
 *
 * @wordpress/* maps to the wp.* editor globals, react/jsx-runtime to the
 * core runtime. The theme never ships its own React into the editor.
 */
const wpGlobals = {
	'@wordpress/blocks': 'wp.blocks',
	'@wordpress/element': 'wp.element',
	'@wordpress/components': 'wp.components',
	'@wordpress/block-editor': 'wp.blockEditor',
	'@wordpress/server-side-render': 'wp.serverSideRender',
	'@wordpress/i18n': 'wp.i18n',
	'react/jsx-runtime': 'ReactJSXRuntime',
};

export default defineConfig( {
	base: '/wp-content/themes/snoka-club/dist/',
	plugins: [ react() ],
	build: {
		manifest: 'manifest-blocks.json',
		outDir: 'dist',
		emptyOutDir: false,
		rollupOptions: {
			input: {
				'blocks/icon': 'src/blocks/icon/index.ts',
			},
			external: ( id ) =>
				Object.prototype.hasOwnProperty.call( wpGlobals, id ) ||
				id === 'react/jsx-runtime' ||
				id.startsWith( '@wordpress/' ),
			output: {
				format: 'iife',
				name: 'SnokaClubIconBlock',
				globals: ( id ) => {
					if (
						Object.prototype.hasOwnProperty.call( wpGlobals, id )
					) {
						return wpGlobals[ id ];
					}
					if ( id === 'react/jsx-runtime' ) {
						return 'ReactJSXRuntime';
					}
					const parts = id.replace( '@wordpress/', '' ).split( '/' );
					return (
						'wp.' +
						parts
							.map( ( part, index ) =>
								index === 0
									? part
									: part[ 0 ].toUpperCase() + part.slice( 1 )
							)
							.join( '' )
					);
				},
			},
		},
	},
} );
