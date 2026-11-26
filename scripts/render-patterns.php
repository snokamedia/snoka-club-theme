<?php
/**
 * Render every theme pattern to HTML for the validate-blocks harness.
 * Runs inside WordPress (wp eval-file), so translation and theme helpers
 * behave exactly as they do for the editor.
 */
$out = array();
foreach ( glob( get_template_directory() . '/patterns/*.php' ) ?: array() as $file ) {
	ob_start();
	include $file;
	$out[ basename( $file ) ] = (string) ob_get_clean();
}
echo wp_json_encode( $out );
