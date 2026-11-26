/**
 * snoka-club/icon — Tabler glyphs as a real block.
 *
 * Frontend output is server-rendered through the allowlisted PHP helper,
 * so the markup is always the helper's canonical SVG (currentColor stroke,
 * decorative aria-hidden). The editor previews the identical output via
 * ServerSideRender.
 */
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import Edit from './edit';
import save from './save';

registerBlockType('snoka-club/icon', {
	title: __('Snoka Icon', 'snoka-club'),
	description: __(
		'Tabler outline glyph, rendered server-side. Inherits text color.',
		'snoka-club'
	),
	icon: 'art',
	category: 'media',
	keywords: [__('icon', 'snoka-club'), 'tabler', 'svg'],
	attributes: {
		name: {
			type: 'string',
			default: 'bell',
		},
	},
	supports: {
		html: false,
	},
	edit: Edit,
	save,
});
