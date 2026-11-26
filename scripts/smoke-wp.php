<?php
/**
 * WordPress-side smoke assertions. Runs inside the sandbox via
 * wp eval-file (see pnpm smoke:wp). Fails loudly on the first problem —
 * this is the gate that catches silent registration skips (e.g. a wrong
 * manifest path that makes register_block_type bail before WordPress or
 * the editor ever sees the block).
 */
$fail = 0;
$note = static function ( string $label, bool $ok, string $detail = '' ) use ( &$fail ): void {
	if ( $ok ) {
		echo "ok  {$label}" . ( '' !== $detail ? " ({$detail})" : '' ) . "\n";
		return;
	}
	$fail = 1;
	fwrite( STDERR, "FAIL {$label}" . ( '' !== $detail ? " ({$detail})" : '' ) . "\n" );
};

$note( 'active theme is snoka-club', 'snoka-club' === get_option( 'stylesheet' ), (string) get_option( 'stylesheet' ) );

$reg        = WP_Block_Type_Registry::get_instance();
$registered = $reg->is_registered( 'snoka-club/icon' );
$note( 'snoka-club/icon registered', $registered );

$dynamic = false;
$render  = '';
if ( $registered ) {
	$type    = $reg->get_registered( 'snoka-club/icon' );
	$dynamic = $type && $type->is_dynamic();
	$render  = (string) render_block( parse_blocks( '<!-- wp:snoka-club/icon {"name":"bell"} /-->' )[0] );
}
$note( 'snoka-club/icon is dynamic', $dynamic );
$note( 'snoka-club/icon renders SVG', str_contains( $render, '<svg' ) && str_contains( $render, 'stroke="currentColor"' ), strlen( $render ) . ' bytes' );

$note( 'portal page exists', null !== get_page_by_path( 'portal' ) );

exit( $fail );
