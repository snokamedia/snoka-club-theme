<?php
/**
 * Title: Portal Cards
 * Slug: snoka-club/portal-cards
 * Categories: snoka-cards
 * Description: Four club portal entry cards (notices, documents, requests, votes) with Tabler icons. Links target the snoka-access portal routes.
 * Keywords: club, portal, notices, documents, requests, votes
 *
 * @package Snoka_Club
 */

$cards = array(
	array(
		'icon'  => 'bell',
		'title' => __( 'Notices', 'snoka-club' ),
		'body'  => __( 'Formal board notices and announcements, with acknowledgement tracking. Linked documents and ballots included.', 'snoka-club' ),
		'url'   => '/portal/#/notices',
		'link'  => __( 'View notices →', 'snoka-club' ),
	),
	array(
		'icon'  => 'files',
		'title' => __( 'Documents', 'snoka-club' ),
		'body'  => __( 'Minutes, budgets, bylaws, and policies in a private document library. Every download is a fresh short-lived link.', 'snoka-club' ),
		'url'   => '/portal/#/library',
		'link'  => __( 'Open the library →', 'snoka-club' ),
	),
	array(
		'icon'  => 'clipboard-list',
		'title' => __( 'Requests', 'snoka-club' ),
		'body'  => __( 'General, records, alteration, and meeting-reply forms. Each submission becomes a trackable request with replies.', 'snoka-club' ),
		'url'   => '/portal/#/forms',
		'link'  => __( 'See forms →', 'snoka-club' ),
	),
	array(
		'icon'  => 'checkbox',
		'title' => __( 'Votes', 'snoka-club' ),
		'body'  => __( 'Unit-weighted ballots with quorum tracking, eligibility snapshots, and receipts. Open votes need no login to read about.', 'snoka-club' ),
		'url'   => '/portal/#/ballots',
		'link'  => __( 'See votes →', 'snoka-club' ),
	),
);
?>
<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"backgroundColor":"tertiary","className":"snoka-slab","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide snoka-slab has-tertiary-background-color has-background" style="padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--40)"><!-- wp:heading {"textAlign":"center"} -->
<h2 class="wp-block-heading has-text-align-center"><?php esc_html_e( 'What lives in the portal', 'snoka-club' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center"><?php esc_html_e( 'Same portal the board uses — residents only see what their unit is allowed to see.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide">
<?php foreach ( $cards as $card ) : ?>
<!-- wp:column {"style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"backgroundColor":"base","className":"snoka-card"} -->
<div class="wp-block-column snoka-card has-base-background-color has-background" style="padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)"><!-- wp:snoka-club/icon {"name":"<?php echo esc_attr( $card['icon'] ); ?>"} /-->

<!-- wp:heading {"level":3,"fontSize":"large"} -->
<h3 class="wp-block-heading has-large-font-size"><?php echo esc_html( $card['title'] ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><?php echo esc_html( $card['body'] ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><a href="<?php echo esc_url( $card['url'] ); ?>"><?php echo esc_html( $card['link'] ); ?></a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->
<?php endforeach; ?>
</div>
<!-- /wp:columns --></div>
<!-- /wp:group -->
