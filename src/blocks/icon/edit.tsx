/**
 * Snoka icon block — editor UI.
 *
 * ServerSideRender guarantees the canvas preview is byte-identical to the
 * frontend (same PHP render path), so icon blocks cannot drift from the
 * site. The name list comes from wp_localize_script, single-sourced from
 * the PHP allowlist.
 */
import type { BlockEditProps } from '@wordpress/blocks';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';
import type { JSX } from 'react';

type Attributes = {
	name: string;
};

const FALLBACK_NAMES = ['bell', 'files', 'clipboard-list', 'checkbox'];

type WindowWithIcons = Window & {
	snokaClubIcons?: {
		names: string[];
	};
};

function iconNames(): string[] {
	const scoped = window as unknown as WindowWithIcons;
	if (
		scoped.snokaClubIcons &&
		Array.isArray(scoped.snokaClubIcons.names) &&
		scoped.snokaClubIcons.names.length > 0
	) {
		return scoped.snokaClubIcons.names;
	}
	return FALLBACK_NAMES;
}

export default function Edit({
	attributes,
	setAttributes,
}: BlockEditProps<Attributes>): JSX.Element {
	const names = iconNames();

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Icon', 'snoka-club')}>
					<SelectControl
						label={__('Glyph', 'snoka-club')}
						value={attributes.name}
						options={names.map((name) => ({
							label: name,
							value: name,
						}))}
						onChange={(name: string) => setAttributes({ name })}
						__nextHasNoMarginBottom
					/>
				</PanelBody>
			</InspectorControls>
			<ServerSideRender
				block="snoka-club/icon"
				attributes={attributes}
			/>
		</>
	);
}
