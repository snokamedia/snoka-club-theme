<?php
/**
 * Mobile overlay menu as a rounded tree (link + toggle button).
 *
 * WordPress renders the navigation overlay as an always-expanded list with
 * hidden toggle buttons — there is no core setting for a collapsed,
 * tappable tree. Rather than fighting that markup with CSS and JS, this
 * filter swaps only the dialog copy's list for custom rounded-tree markup
 * built from the same parsed inner blocks:
 *
 * - Every parent item renders its own link (so the page stays reachable)
 *   next to a dedicated 48px toggle button (so expand/collapse never
 *   hijacks the navigation tap). Distinct touch areas, either one tappable.
 * - Toggle buttons carry aria-expanded/aria-controls; collapsed branches
 *   render hidden server-side, current branches render open.
 * - Single-open-per-group is enforced by initTreeToggle (main.ts); the
 *   dialog shell, open/close, and focus handling stay core's.
 * - The details open on the current page and its ancestors, rendered
 *   server-side from the request path.
 *
 * Untouched: the desktop menu (core markup, hover dropdowns), the dialog
 * shell itself, and core's open/close/focus handling. Blocks without any
 * submenu keep core's flat overlay list.
 *
 * @package Snoka_Club
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

add_filter( 'render_block_core/navigation', 'snoka_club_navigation_overlay_tree', 10, 2 );

/**
 * Replace the responsive dialog's list with the rounded tree.
 *
 * @param string              $html  Rendered navigation markup.
 * @param array<string,mixed> $block Parsed block.
 */
function snoka_club_navigation_overlay_tree( string $html, array $block ): string {
	$inner = ( isset( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) ? $block['innerBlocks'] : array();

	if ( array() === $inner ) {
		// Ref-based and fallback navigations store their items outside the
		// parsed block: resolve the same Navigation post core itself renders.
		$inner = snoka_club_nav_resolve_fallback_items( $block );
	}

	if ( array() === $inner || ! snoka_club_nav_has_submenu( $inner ) ) {
		return $html;
	}

	$current = snoka_club_nav_current_path();

	$dom = new DOMDocument( '1.0', 'UTF-8' );
	libxml_use_internal_errors( true );
	$loaded = $dom->loadHTML( '<?xml encoding="utf-8" ?>' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD );
	libxml_clear_errors();

	if ( ! $loaded ) {
		return $html;
	}

	$tree = snoka_club_nav_tree_list( $dom, $inner, '', $current );

	if ( null === $tree ) {
		return $html;
	}

	$xpath = new DOMXPath( $dom );
	$uls   = $xpath->query(
		".//div[contains(concat(' ', normalize-space(@class), ' '), ' wp-block-navigation__responsive-dialog ')]"
		. "//div[contains(concat(' ', normalize-space(@class), ' '), ' wp-block-navigation__responsive-container-content ')]/ul[1]"
	);

	if ( ! $uls instanceof DOMNodeList || 0 === $uls->length ) {
		return $html;
	}

	foreach ( $uls as $old_list ) {
		$nav = $dom->createElement( 'nav' );
		$nav->setAttribute( 'class', 'rounded-tree' );
		// No aria-hidden here: the tree hides with the closed dialog via
		// display:none (removing it from the accessibility tree), and the
		// open dialog exposes it. A hardcoded true would fight the open
		// state with nothing left to remove it.
		$nav->setAttribute( 'aria-label', __( 'Menu', 'snoka-club' ) );
		$nav->appendChild( $tree->cloneNode( true ) );

		if ( $old_list->parentNode ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName -- DOMDocument API properties are camelCase.
			$old_list->parentNode->appendChild( $nav ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName -- DOMDocument API properties are camelCase.
		}
	}

	$out = $dom->saveHTML();

	return is_string( $out ) && '' !== $out ? $out : $html;
}

/**
 * Resolve a navigation block's items when they are not inline.
 *
 * A `ref` attribute points at a Navigation post; a ref-less block falls back
 * to the same Navigation post core itself renders
 * (WP_Navigation_Fallback::get_fallback). Either way the parsed blocks match
 * what the builder consumes.
 *
 * @param array<string,mixed> $block Parsed block.
 * @return array<int,mixed> Parsed inner blocks, possibly empty.
 */
function snoka_club_nav_resolve_fallback_items( array $block ): array {
	$attrs = ( isset( $block['attrs'] ) && is_array( $block['attrs'] ) ) ? $block['attrs'] : array();
	$post  = null;

	if ( ! empty( $attrs['ref'] ) ) {
		$post = get_post( absint( $attrs['ref'] ) );
	}

	if ( ! $post instanceof WP_Post && class_exists( 'WP_Navigation_Fallback' ) ) {
		$post = WP_Navigation_Fallback::get_fallback();
	}

	if ( ! $post instanceof WP_Post || 'wp_navigation' !== $post->post_type ) {
		return array();
	}

	$parsed = parse_blocks( $post->post_content );

	return is_array( $parsed ) ? $parsed : array();
}

/**
 * Whether any item in the tree is (or contains) a submenu.
 *
 * @param array<int,mixed> $items Parsed inner blocks.
 */
function snoka_club_nav_has_submenu( array $items ): bool {
	foreach ( $items as $item ) {
		if ( ! is_array( $item ) ) {
			continue;
		}

		if ( 'core/navigation-submenu' === ( $item['blockName'] ?? null ) ) {
			return true;
		}

		$children = ( isset( $item['innerBlocks'] ) && is_array( $item['innerBlocks'] ) ) ? $item['innerBlocks'] : array();

		if ( array() !== $children && snoka_club_nav_has_submenu( $children ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Request path for current-page matching ('/' for home, otherwise trimmed).
 */
function snoka_club_nav_current_path(): string {
	$request_uri = filter_input( INPUT_SERVER, 'REQUEST_URI', FILTER_UNSAFE_RAW );

	if ( ! is_string( $request_uri ) || '' === $request_uri ) {
		return '/';
	}

	$path = wp_parse_url( $request_uri, PHP_URL_PATH );

	if ( ! is_string( $path ) || '' === $path ) {
		return '/';
	}

	$trimmed = untrailingslashit( $path );

	return '' === $trimmed ? '/' : $trimmed;
}

/**
 * Normalize an item URL to a comparable path.
 *
 * @param mixed $url Raw URL attribute.
 */
function snoka_club_nav_item_path( $url ): string {
	if ( ! is_string( $url ) || '' === trim( $url ) ) {
		return '';
	}

	$path = wp_parse_url( trim( $url ), PHP_URL_PATH );

	if ( ! is_string( $path ) || '' === $path ) {
		return '';
	}

	$trimmed = untrailingslashit( $path );

	return '' === $trimmed ? '/' : $trimmed;
}

/**
 * Whether the item or any descendant matches the current page.
 *
 * @param array<string,mixed> $item    Parsed block.
 * @param string              $current Current request path.
 */
function snoka_club_nav_is_current_branch( array $item, string $current ): bool {
	$attrs = ( isset( $item['attrs'] ) && is_array( $item['attrs'] ) ) ? $item['attrs'] : array();
	$path  = snoka_club_nav_item_path( $attrs['url'] ?? '' );

	if ( '' !== $path && $path === $current ) {
		return true;
	}

	$children = ( isset( $item['innerBlocks'] ) && is_array( $item['innerBlocks'] ) ) ? $item['innerBlocks'] : array();

	foreach ( $children as $child ) {
		if ( is_array( $child ) && snoka_club_nav_is_current_branch( $child, $current ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Build a rounded-tree <ul> from parsed navigation inner blocks.
 *
 * Branch rows render the parent link (or a span when the branch has no URL)
 * followed by a dedicated toggle button, so navigating and expanding are
 * separate taps. Toggle state starts from the current branch server-side;
 * initTreeToggle (main.ts) owns runtime toggling and single-open groups.
 *
 * @param DOMDocument      $dom     Owner document (nodes are created on it).
 * @param array<int,mixed> $items   Parsed inner blocks.
 * @param string           $path    Index path of the parent ('' at root).
 * @param string           $current Current request path.
 */
function snoka_club_nav_tree_list( DOMDocument $dom, array $items, string $path, string $current ): ?DOMElement {
	$list  = $dom->createElement( 'ul' );
	$index = 0;
	$kept  = 0;

	foreach ( $items as $item ) {
		if ( ! is_array( $item ) ) {
			++$index;
			continue;
		}

		$name  = $item['blockName'] ?? null;
		$attrs = ( isset( $item['attrs'] ) && is_array( $item['attrs'] ) ) ? $item['attrs'] : array();

		if ( 'core/navigation-link' === $name ) {
			$label = is_string( $attrs['label'] ?? null ) ? trim( (string) $attrs['label'] ) : '';

			if ( '' === $label ) {
				++$index;
				continue;
			}

			$url = snoka_club_nav_item_path( $attrs['url'] ?? '' );
			$li  = $dom->createElement( 'li' );
			$li->appendChild( snoka_club_nav_tree_link( $dom, $label, $url, '' !== $url && $url === $current ) );
			$list->appendChild( $li );
			++$kept;
		} elseif ( 'core/navigation-submenu' === $name ) {
			$label = is_string( $attrs['label'] ?? null ) ? trim( (string) $attrs['label'] ) : '';

			if ( '' === $label ) {
				++$index;
				continue;
			}

			$url       = snoka_club_nav_item_path( $attrs['url'] ?? '' );
			$own_path  = '' === $path ? (string) $index : $path . '-' . $index;
			$child_set = snoka_club_nav_tree_list( $dom, ( isset( $item['innerBlocks'] ) && is_array( $item['innerBlocks'] ) ) ? $item['innerBlocks'] : array(), $own_path, $current );
			$kids      = $child_set instanceof DOMElement ? iterator_to_array( $child_set->childNodes ) : array(); // phpcs:ignore WordPress.NamingConventions.ValidVariableName -- DOMDocument API properties are camelCase.

			if ( array() === $kids ) {
				if ( '' === $url ) {
					++$index;
					continue;
				}

				// Childless branch degrades to a plain link.
				$li = $dom->createElement( 'li' );
				$li->appendChild( snoka_club_nav_tree_link( $dom, $label, $url, $url === $current ) );
				$list->appendChild( $li );
				++$kept;
			} else {
				$is_open = snoka_club_nav_is_current_branch( $item, $current );
				$li      = $dom->createElement( 'li' );
				$row     = $dom->createElement( 'div' );
				$row->setAttribute( 'class', 'tree-row' );
				$row->appendChild( snoka_club_nav_tree_link( $dom, $label, $url, '' !== $url && $url === $current ) );

				$toggle = $dom->createElement( 'button' );
				$toggle->setAttribute( 'type', 'button' );
				$toggle->setAttribute( 'class', 'tree-toggle' );
				$toggle->setAttribute( 'aria-expanded', $is_open ? 'true' : 'false' );
				$toggle->setAttribute( 'aria-controls', 'snoka-tree-' . $own_path );
				/* translators: %s: branch label for its submenu toggle. */
				$toggle->setAttribute( 'aria-label', sprintf( __( '%s submenu', 'snoka-club' ), $label ) );
				$row->appendChild( $toggle );
				$li->appendChild( $row );

				$sub = $dom->createElement( 'ul' );
				$sub->setAttribute( 'id', 'snoka-tree-' . $own_path );

				if ( ! $is_open ) {
					$sub->setAttribute( 'hidden', 'hidden' );
				}

				foreach ( $kids as $kid ) {
					$sub->appendChild( $kid );
				}

				$li->appendChild( $sub );
				$list->appendChild( $li );
				++$kept;
			}
		}

		++$index;
	}

	return $kept > 0 ? $list : null;
}

/**
 * Build a tree link (label text is added as a text node: always escaped).
 *
 * @param DOMDocument $dom     Owner document.
 * @param string      $label   Visible label.
 * @param string      $url     Normalised path ('' renders a span, never #).
 * @param bool        $current Whether this is the current page.
 */
function snoka_club_nav_tree_link( DOMDocument $dom, string $label, string $url, bool $current ): DOMElement {
	if ( '' === $url ) {
		$span = $dom->createElement( 'span' );
		$span->appendChild( $dom->createTextNode( $label ) );

		return $span;
	}

	$link = $dom->createElement( 'a' );
	$link->setAttribute( 'href', esc_url( $url ) );
	$link->appendChild( $dom->createTextNode( $label ) );

	if ( $current ) {
		$link->setAttribute( 'aria-current', 'page' );
	}

	return $link;
}
