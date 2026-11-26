/**
 * Minimal ambient types for the WordPress editor modules consumed by the
 * Snoka icon block. The blocks package ships its own types (used directly);
 * the rest are editor-provided externals (see vite.blocks.config.mjs) typed
 * here to avoid versioned type packages for globals WordPress guarantees.
 *
 * This file is intentionally a global script (no top-level imports), so
 * these are declarations, not augmentations.
 */

declare module '@wordpress/components' {
	export function SelectControl(props: {
		label: string;
		value: string;
		options: Array<{ label: string; value: string }>;
		onChange: (value: string) => void;
		__nextHasNoMarginBottom?: boolean;
	}): import('react').ReactElement;
	export function PanelBody(props: {
		title: string;
		children?: unknown;
	}): import('react').ReactElement;
}

declare module '@wordpress/block-editor' {
	export function InspectorControls(props: {
		children?: unknown;
	}): import('react').ReactElement;
}

declare module '@wordpress/server-side-render' {
	function ServerSideRender(props: {
		block: string;
		attributes?: Record<string, unknown>;
	}): import('react').ReactElement;
	export default ServerSideRender;
}

declare module '@wordpress/i18n' {
	export function __(text: string, domain?: string): string;
}

declare global {
	interface Window {
		snokaClubIcons?: {
			names: string[];
		};
	}
}
