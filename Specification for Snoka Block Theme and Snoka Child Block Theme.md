# Specification for Snoka Block Theme and Snoka Child Block Theme

## Overview

Snoka Block Theme is a forward‑only WordPress block theme that serves as the base framework for all Snoka Media sites. It embraces the modern Site Editor, `theme.json`, and block patterns, and explicitly ignores backward compatibility concerns with classic themes.[^1][^2][^3][^4]

Snoka Child Block Theme is a thin child theme used per site to override branding, layout variants, and content defaults without duplicating framework logic. It inherits all templates, patterns, and global styles from the parent and adds per‑project customizations only.[^3][^5]

Goals:

- Provide a comprehensive block theme that can cover common verticals such as business, ecommerce, clubs, tourism, and non‑profits.
- Offer a rich library of templates, template parts, and patterns so that AI builders and agents can assemble complete designs from structured building blocks.[^6][^7]
- Integrate cleanly with Snoka plugins, custom blocks, and future abilities APIs, with all CPTs and blocks exposed to the REST API by default.[^8]


## Core Architecture

Snoka Block Theme follows the standard block theme structure, using `/templates`, `/parts`, `/patterns`, and a `theme.json` file as the central configuration.[^9][^3]

Directory layout:

```text
snoka-block-theme/
  style.css
  theme.json
  functions.php
  /templates
  /parts
  /patterns
  /assets
    /css
    /js
    /fonts
    /images
  /inc
    cpt-register.php
    block-support.php
    rest-extras.php
    template-tags.php
```

Snoka Child Block Theme keeps a minimal structure, overriding only what a site needs.[^3]

```text
snoka-child-theme/
  style.css
  theme.json (optional overrides)
  /templates (only if overriding parent templates)
  /parts (only if overriding parent parts)
  /patterns (site‑specific patterns)
  /assets (branding assets)
```


## theme.json Strategy

The `theme.json` file is the engine of the Snoka Block Theme. It configures editor settings, global design tokens, block‑level defaults, and metadata for custom templates, template parts, and bundled patterns.[^10][^2][^5][^1][^3]

### Top‑level schema and structure

Snoka Block Theme uses the latest `theme.json` schema and version supported by current WordPress (for 6.6+ this is version 3).[^2][^3]

Top‑level keys:

- `$schema`: `https://schemas.wp.org/trunk/theme.json` for editor validation.
- `version`: `3`.
- `settings`: editor controls, palettes, typography, spacing scales, enabled tools.[^3]
- `styles`: base styles, root variables, per‑block overrides.[^11][^1]
- `templateParts`: metadata for header/footer/other parts stored in `/parts`.[^12][^13]
- `customTemplates`: metadata for custom templates stored in `/templates`.[^2]
- `patterns`: list of pattern slugs bundled from `/patterns` or the pattern directory.[^14][^10]

Snoka Child theme can provide its own `theme.json` that uses the same shape and overrides only the necessary portions such as color tokens, typography, or pattern registrations.[^3]

### Design tokens and editor controls

The `settings` section defines a constrained yet flexible design system for AI agents and editors.[^1][^3]

- Color presets
  - Global palette for brand, neutrals, semantic colors.
  - Gradients and duotones for hero sections and image treatments.[^11]
  - Opt‑in for custom colors configurable per site if required.
- Typography
  - Font families defined with fallbacks and usage (body, headings, UI).[^11]
  - Font size scale (e.g., xs, sm, md, lg, xl, 2xl).
  - Controls for font weight, letter spacing, text transform, default line height.[^11]
- Spacing
  - Spacing scale for padding, margins, gaps.
  - Layout content width and wide width presets.
- Layout
  - Content width, wide width, and full width options.
  - Support for block alignments and layout settings.
- Block support flags
  - Enabled tools for core blocks (colors, borders, spacing, typography, dimensions, shadow, etc.).[^1]

AI builders can rely on consistent token names and scales to generate layouts that remain visually coherent and within design constraints.[^4][^15]

### Global and per‑block styles

The `styles` section applies base styles and per‑block overrides.[^1][^11]

- Root styles
  - Background, text color, link colors, default typography.
  - Base spacing between blocks and default layout behavior.
- Element styles
  - HTML element styling (body, headings, links, buttons, captions, inputs).[^14]
- Block styles
  - Per‑block defaults for Group, Columns, Buttons, Navigation, Query Loop, Post Template, Site Title, Site Tagline, etc.[^5][^1]
  - Variant styles for frequently used patterns (e.g., "card" style for Group blocks).

Snoka Child theme may add style variations (global styles) by providing additional style variation files or by extending `theme.json` with style presets.[^16][^3]


## Template and Template Part Architecture

The theme ships with a full set of block templates in `/templates` that follow the modern block template hierarchy.[^17][^18][^9]

### Core templates

Required and common templates:

- `index.html` (required fallback) for all uncaught routes.[^9][^17]
- `front-page.html` for the site landing page, static or latest posts.[^18]
- `home.html` for the posts index (blog listing).[^18][^9]
- `single.html` for generic single posts.
- `single-post.html` for blog post specific layout.
- `page.html` for pages.
- `archive.html` for generic archives.
- `search.html` for search results.[^9][^18]
- `404.html` for not found pages.[^18][^9]
- `singular.html` as generic fallback for single content types.[^18]

Where helpful, more specific templates are provided to allow vertical‑specific layouts through the template hierarchy.[^18]

### Archive templates

Archive templates use Query Loop blocks configured for different contexts.[^8][^6]

- `category.html` for category archives.
- `tag.html` for tag archives.
- `author.html` for author archives.
- `date.html` for date archives.
- `archive-{cpt}.html` for key custom post types (e.g., `archive-event.html`, `archive-product.html`, `archive-tour.html`, `archive-project.html`).[^19][^18]

Each archive template exposes a layout and style suited to its content type, for example cards with metadata for events, or product grids for ecommerce CPTs.

### Search template

`search.html` provides a query layout optimized for relevance and clarity.[^20][^17]

- Uses a header area with the search query.
- Includes Search block to refine queries.
- Uses Query Loop restricted to supported post types, with toggles for AI agents to extend or narrow types via settings.
- Displays highlighted search terms in excerpts where supported.

### 404 template

`404.html` includes blocks that encourage recovery.

- Hero message and explanation.
- Search block.
- List of popular or recent content.
- Optional call‑to‑action for key conversions.

### Template parts

Template parts are stored in `/parts` and registered in `theme.json` with `templateParts` metadata.[^13][^12]

Standard parts:

- Headers:
  - `header-default.html` with site title, navigation, and optional search.
  - `header-centered.html` for centered branding.
  - `header-slim.html` for compact header.
  - `header-stacked.html` for sites with secondary navigation or information.
- Footers:
  - `footer-simple.html` with copyright and minimal links.
  - `footer-columns.html` with 3–4 widget areas.
  - `footer-cta.html` with newsletter or contact call‑to‑action.
- Sidebars / utility parts:
  - `sidebar-blog.html` with category list, recent posts, search.
  - `sidebar-ecommerce.html` with filters (for when integrated with ecommerce blocks).
  - `pre-header-bar.html` for announcement bars or alerts.

Snoka Child themes can override specific template parts simply by providing a file with the same name in `/parts`.[^12][^1]


## Block Pattern Library

The Snoka Block Theme ships with a large library of block patterns that cover common layout and content needs across verticals.[^7][^21][^6]

Patterns are implemented as block markup files under `/patterns` and registered automatically by WordPress or via `register_block_pattern()`.[^21][^22]

### Pattern organization

Patterns are grouped into categories that make sense for AI builders and human editors.[^15][^7]

- Layout primitives: Grids, full‑width sections, content + sidebar, multi‑column sections.
- Hero sections: Variants for business, non‑profit, tourism, product focus, event focus.
- Calls to action: Simple CTA, split CTA, donation CTA, booking CTA.
- Lists and cards: Services list, features grid, team members, testimonials, pricing cards.[^15]
- Content blocks: Rich text sections, images with captions, media + text, galleries.
- Navigation blocks: Mega menu panel layouts (implemented as patterns combined with Navigation block).
- Footers: Multiple footer layouts matching the template parts.
- Forms: Layout shells for contact, newsletter, lead capture (with placeholder form blocks from plugins).

### Pattern usage

Patterns integrate with the Site Editor and post editor so they can be inserted into templates, template parts, posts, pages, and CPTs.[^23][^15]

- Synced patterns used for reusable elements across multiple places (e.g., a recurring CTA strip).[^24][^23]
- Non‑synced patterns used as starting layouts for pages, which can be customized per instance.
- Pattern metadata in `theme.json` and pattern files specify `blockTypes`, `postTypes`, and `templateTypes` for contextual suggestions (e.g., hero patterns suggested when editing `front-page.html`).[^6]

AI builders can choose patterns based on semantic category, supported post types, and design tokens to assemble full pages rapidly.[^25][^24]


## Vertical‑Specific Design Elements

The theme provides opinionated layouts and patterns targeted at business, ecommerce, clubs, tourism, and non‑profits.

### Business sites

- Home and landing page patterns: hero, services overview, portfolio teaser, testimonials, contact CTA.
- About page templates with team, history, and values sections.
- Services CPT templates (optional) if a site wants structured services pages.
- Case study layouts using CPT or regular pages with patterns.

### Ecommerce sites

Although core WooCommerce or alternative ecommerce plugins provide blocks, Snoka Block Theme provides templates and patterns that wrap those blocks.

- Product grid sections for use on home and landing pages.
- Pricing tables for subscription offerings.
- `archive-product.html` and `single-product.html` templates when WooCommerce is active, with minimal layout scaffolding that defers to WooCommerce blocks for product content.[^26]
- Cart and checkout templates based on WooCommerce block templates (`cart.html`, `checkout.html`) when installed.[^26]

### Clubs and member organizations

- Event calendar sections that integrate with an events CPT and blocks.
- Membership benefits and tiered pricing patterns.
- Committee or leadership layouts using team patterns.
- Event archive and single templates adapted to event CPT.

### Tourism and destination sites

- Destination highlight hero sections with background images.
- Itinerary and trip summary patterns.
- Tour CPT templates for archive and single pages.
- Map and points‑of‑interest sections that can host custom blocks for geospatial data.

### Non‑profit and NGOs

- Donation CTAs and progress indicators (ready for plugin integration).
- Impact stories and projects layout patterns.
- Volunteer signup and newsletter signup sections.
- Campaign CPT templates with archives and single layouts.

Each vertical is served primarily by patterns and CPT template design rather than diverging base code, which allows AI builders to switch vertical context without changing theme internals.


## Custom Post Types and Taxonomies

Snoka Block Theme is forward‑looking, so CPTs should be registered in plugins rather than the theme itself, but the theme provides full template and pattern support for specific CPTs.[^27][^8]


## Search, Archives, and Query Experiences

Snoka Block Theme treats search and archives as first‑class experiences, not afterthoughts.

### Search results

`search.html` uses a Query Loop tailored to search.

- Displays post title, type label, excerpt, featured image, and meta.
- Allows narrowing by content type using toggles or tabs when combined with custom blocks.
- Uses patterns for alternative search result layouts (list view, card view).
- Offers suggestions when no results are found, including a search form and links to key pages.[^20]

### Archives

Each archive template is configured for clarity and readability.[^9][^18]

- Category and tag templates highlight term name and description.
- CPT archives display custom fields or taxonomies relevant to that type via blocks.
- Pagination is consistent and uses wrapped patterns.
- Query Loop settings are chosen for performance and user experience appropriate to each vertical.


## Integration with Snoka Plugins and Future Abilities API

Snoka Block Theme is designed to integrate seamlessly with Snoka plugins, custom blocks, and future abilities APIs.

### Block compatibility

- The theme does not hard‑code dependencies on specific blocks in templates where possible; instead, templates and patterns reserve areas for pluggable blocks (e.g., "Donation form here", "Map here").
- Where Snoka plugins register blocks, the theme provides companion patterns that include those blocks in practical layouts.

### REST API and AI builder support

With all CPTs and key meta fields registered with `show_in_rest`, AI builders and agents can read the content model and create or update content via the REST API.[^8]

Patterns, templates, and template parts are discoverable through the Site Editor and can be mapped by agents to tasks like "create a tourism home page" or "build a non‑profit donation landing page".

### Migration of existing sites

Snoka Block Theme is not constrained by backward compatibility; instead, migration strategies focus on mapping old content into modern content types and patterns.

- Use AI or scripted tools to convert legacy page templates into page content built from Snoka patterns.
- Map classic CPT templates to block templates and Query Loop layouts.[^8]
- Replace widget areas with patterns and template parts, preserving semantics rather than markup.


## Child Theme Role and Overrides

Snoka Child Block Theme is responsible for project‑specific overrides and branding.

### Branding and design overrides

- Override color palette and typography through `theme.json` while leaving layout tokens intact.
- Override or extend patterns for custom brand layouts.
- Add or adjust template parts such as unique headers or footers.

### Template overrides

- Only create template files in the child theme when the project truly needs a divergent layout.
- Prefer patterns and global styles for variation to keep the framework consistent.

### Project‑specific CPTs

- Child theme should not register CPTs; instead, Snoka plugins handle CPT registration.[^8]
- Child theme may add patterns and templates specifically tuned to a client’s custom CPTs.


## Editor Experience and Curation

The theme curates the editor experience so that users and AI builders see a manageable and meaningful set of choices.[^6][^15]

- `theme.json` disables editor controls that conflict with the design system (for example arbitrary font choices) and enables those that are safe, as recommended in global styles documentation.[^10][^1]
- Patterns are tagged with clear categories and names, making discovery intuitive.[^7][^15]
- Synced patterns are used for elements that must stay consistent across the site, while non‑synced ones are treated as layout starters.[^23][^24]

This curated environment gives AI and human editors guardrails that lead to consistent, high‑quality output without sacrificing flexibility.


## Performance and Forward Compatibility

Since Snoka Block Theme ignores legacy constraints, it focuses on lean, modern WordPress implementations.

- Relies on `theme.json` for styles instead of large CSS files, reducing duplication.[^1][^3]
- Uses Query Loop blocks instead of custom PHP queries for archives where possible.[^28][^8]
- Avoids deprecated features and focuses on current block and Site Editor capabilities.

Future WordPress releases that extend `theme.json` or the Site Editor can be adopted rapidly because of the clean, centralized configuration.


## Summary

Snoka Block Theme provides a comprehensive, block‑first framework that covers the full range of typical client verticals through templates, template parts, and patterns. Snoka Child Block Theme adds project‑specific overrides without fragmenting the core architecture.[^4][^9]

Together they create a strong foundation for AI builders and agents to compose unique, content‑rich WordPress sites while keeping implementation modern and maintainable.[^6][^3]

For a non‑headless, custom block theme, the biggest wins come from combining WordPress’s newer APIs with islands‑style thinking: keep most of the page as static HTML, hydrate only small interactive regions, and use the browser’s latest loading features. Below are concrete, bleeding‑edge techniques you can build directly into your theme.

## 1. Islands‑aware blocks with the Interactivity API

WordPress now ships the **Interactivity API** (IAPI) as the standard way to add client behavior to blocks without full SPA hydration. You can use it to implement an islands pattern: [make.wordpress](https://make.wordpress.org/core/2024/03/04/interactivity-api-dev-note/)

- **Server‑render everything**  
  Your PHP templates output complete HTML for posts, archives, headers, footers, etc. No JS required for basic content. This keeps FCP fast and SEO solid. [dev](https://dev.to/paulocarvajal/the-wordpress-interactivity-api-building-dynamic-blocks-without-custom-javascript-1ppb)

- **Mark only interactive regions as “islands”**  
  For things like:
  - Search/autocomplete
  - Filters and faceted navigation
  - Carousels, tabs, accordions
  - Comment forms, reaction buttons  
  Wrap these in blocks that use `data-wp-interactive` and a small store (state + actions) via IAPI. [make.wordpress](https://make.wordpress.org/core/2024/03/04/interactivity-api-dev-note/)

- **Scope interactivity tightly**  
  IAPI lets you define small interactive roots instead of hydrating the whole page. Keep each island’s state local and avoid large global stores. This reduces JS work and avoids long hydration tasks. [apis](https://apis.io/agent-skills/wordpress/wp-interactivity-api/)

- **Use `viewScriptModule` in `block.json`**  
  Declare your block’s frontend script with `viewScriptModule` so it’s only loaded when the block is rendered. This is the modern, module‑based path for block scripts. [make.wordpress](https://make.wordpress.org/core/2024/03/04/block-metadata-viewscriptmodule-field-in-6-5/)

Example `block.json` sketch:

```json
{
  "name": "mytheme/search-island",
  "title": "Search Island",
  "category": "theme",
  "supports": {
    "interactivity": true
  },
  "viewScriptModule": "file:./view.js"
}
```

In your PHP render callback, output HTML with `data-wp-interactive` directives and minimal state. The JS in `view.js` only handles that island’s behavior. [make.wordpress](https://make.wordpress.org/core/2024/03/04/interactivity-api-dev-note/)

## 2. Progressive / lazy hydration for heavy blocks

Core is actively working on **lazy hydration strategies** (idle, view, interaction) for interactive blocks, and you can adopt similar patterns now. [github](https://github.com/WordPress/gutenberg/issues/58225)

- **Hydrate on idle or visibility**  
  For blocks that are:
  - Below the fold
  - Not needed immediately  
  Delay their script execution until:
  - `requestIdleCallback` fires, or
  - The element enters the viewport (IntersectionObserver). [github](https://github.com/WordPress/gutenberg/discussions/52723)

- **Interaction‑based hydration**  
  For things like modals, dropdowns, or “load more” buttons:
  - Render the markup server‑side
  - Attach a minimal listener that loads the full island code on first interaction  
  This avoids paying hydration cost unless the user actually uses the feature. [patterns](https://www.patterns.dev/react/progressive-hydration/)

- **Break up long hydration tasks**  
  If a page has many interactive blocks, avoid one big `init()` that blocks the main thread. Split work per island and yield between them so the browser can paint and respond to input. [github](https://github.com/WordPress/gutenberg/issues/58225)

You don’t need to wait for core to expose all of this as configuration; you can implement these strategies in your theme’s JS layer and apply them to your islands.

## 3. Speculative loading (prefetch/prerender) for navigation

WordPress 6.8+ includes **Speculative Loading** in core, using the Speculation Rules API to prefetch or prerender pages before the user clicks. [make.wordpress](https://make.wordpress.org/core/2025/03/06/speculative-loading-in-6-8/)

- **Enable speculative loading in your theme**  
  By default, WordPress uses conservative prefetch for non‑logged‑in users. You can tune this via `wp_speculation_rules_configuration` to:
  - Use `prerender` for key flows (e.g. from home → popular posts)
  - Adjust eagerness (`conservative`, `moderate`, `eager`). [make.wordpress](https://make.wordpress.org/core/2025/03/06/speculative-loading-in-6-8/)

- **Opt out where it’s harmful**  
  Add `no-prefetch` or `no-prerender` classes to blocks/links that should not be speculated (cart, checkout, dynamic forms). [make.wordpress](https://make.wordpress.org/core/2025/03/06/speculative-loading-in-6-8/)

- **Prerender critical paths**  
  For high‑traffic entry points (e.g. homepage → top category or first post), configure eager prerender so the next page is already rendered in a hidden tab when the user clicks, giving near‑instant navigation. [themeisle](https://themeisle.com/blog/wordpress-speculative-loading/)

This works with any theme and requires no headless setup; it just makes normal WordPress navigation feel app‑like.

## 4. View Transitions for smooth page changes

The **View Transitions API** is already usable in WordPress via a core performance plugin and upcoming core support. [developer.wordpress](https://developer.wordpress.org/news/2026/02/whats-new-for-developers-february-2026/)

- **Enable view transitions in your theme**  

```php
function mytheme_setup() {
    add_theme_support( 'view-transitions' );
}
add_action( 'after_setup_theme', 'mytheme_setup' );
```

This allows smooth cross‑document transitions between pages without converting your site into a SPA. [wp-content](https://wp-content.co/view-transitions-plugin-wordpress/)

- **Customize transitions per template**  
  Use CSS `::view-transition` pseudo‑elements to define animations for:
  - Post list → single post
  - Archive → post
  - Any key navigation pattern  
  Respect `prefers-reduced-motion` for accessibility. [wphelp](https://wphelp.blog/view-transitions-in-wordpress-what-are-they-are-they-useful-how-do-you-use-them-can-i-see-what-they-do/)

Combined with speculative loading, this can make multi‑page WordPress feel like a single‑page app without the JS cost.

## 5. Critical CSS + deferred non‑critical styles

For block themes, CSS delivery is a major FCP factor. Inlining **critical CSS** and deferring the rest can cut FCP by 300–800 ms. [brndle](https://brndle.com/critical-css-block-themes-first-contentful-paint/)

- **Extract critical CSS per template**  
  For templates like:
  - `front-page`
  - `single`
  - `archive`  
  Generate a small CSS bundle containing only above‑the‑fold rules (header, hero, first post cards, etc.). [brndle](https://brndle.com/critical-css-block-themes-first-contentful-paint/)

- **Inline critical CSS in `<head>`**  
  Output this CSS directly in the HTML head so the browser can paint without waiting for external stylesheets.

- **Load full theme CSS asynchronously**  
  Load the rest of your CSS with `rel="preload"` + `onload` or `media` trick so it doesn’t block rendering. [brndle](https://brndle.com/critical-css-block-themes-first-contentful-paint/)

You can automate this in your build pipeline (e.g. with Vite/PostCSS) and hook it into WordPress’s template system.

## 6. Font and image loading tuned for LCP

WordPress already does some of this, but you can go further in a custom theme.

- **Self‑host fonts and limit variants**  
  - Host WOFF2 files locally
  - Load only weights you actually use (often 400 and 700)
  - Use `font-display: swap` so text paints immediately. [themenectar](https://themenectar.com/docs/salient/performance-optimization-guide/)

- **Preload critical fonts**  
  Add `<link rel="preload" as="font" ...>` for the main text font used above the fold to reduce layout shift and improve LCP. [fastpixel](https://fastpixel.io/blog/optimize-wordpress-fonts/)

- **Use `fetchpriority="high"` on LCP images**  
  WordPress 6.3+ adds this automatically in many cases, but you can:
  - Ensure your hero/featured image isn’t lazy‑loaded
  - Explicitly set `fetchpriority="high"` on known LCP candidates (hero images, first post image). [make.wordpress](https://make.wordpress.org/core/2023/05/02/proposal-for-enhancing-lcp-image-performance-with-fetchpriority/)

- **Preload hero background images**  
  If your LCP is a CSS background (hero section), preload it in `<head>` and avoid lazy‑loading it. [onlinemediamasters](https://onlinemediamasters.com/largest-contentful-paint-wordpress/)

These tweaks are small but consistently move LCP by 5–15% in real sites. [make.wordpress](https://make.wordpress.org/core/2023/05/02/proposal-for-enhancing-lcp-image-performance-with-fetchpriority/)

## 7. Modern build tooling for your theme assets

You don’t have to use WordPress’s default build setup. A modern pipeline gives you better code splitting and tree‑shaking for your islands.

- **Use Vite or esbuild for theme JS/CSS**  
  - One entry per island (search, filters, carousel, etc.)
  - Shared utilities in a separate chunk
  - Automatic code splitting and minification. [wisdmlabs](https://wisdmlabs.com/blog/optimizing-javascript-in-wordpress-async-defer-and-module-loading-strategies/)

- **Output ES modules and use `type="module"`**  
  Module scripts defer by default and integrate well with `viewScriptModule` and dynamic imports. [make.wordpress](https://make.wordpress.org/core/2024/03/04/block-metadata-viewscriptmodule-field-in-6-5/)

- **Generate per‑template critical CSS**  
  Use your build tool plus a critical CSS plugin to produce:
  - `critical-front-page.css`
  - `critical-single.css`
  - `critical-archive.css`  
  Then inline the right one per template. [brndle](https://brndle.com/critical-css-block-themes-first-contentful-paint/)

This setup keeps your theme lean and makes islands cheap to add.

## 8. Resource hints and careful script strategy

Treat JS and third‑party resources as first‑class performance citizens.

- **Defer or async non‑critical scripts**  
  - `defer` for scripts that need DOM but not immediately (sliders, forms)
  - `async` for analytics, ads, widgets that are independent. [wisdmlabs](https://wisdmlabs.com/blog/optimizing-javascript-in-wordpress-async-defer-and-module-loading-strategies/)

- **Use `preconnect` and `preload` strategically**  
  - `preconnect` to font hosts, CDN origins, analytics endpoints
  - `preload` for critical fonts, LCP images, and key CSS. [fastpixel](https://fastpixel.io/blog/optimize-wordpress-fonts/)

- **Avoid unnecessary block editor CSS on frontend**  
  If you’re not using certain Gutenberg styles on the front end, dequeue them to reduce CSS size. [themenectar](https://themenectar.com/docs/salient/performance-optimization-guide/)

## Putting it together: an islands‑aware block theme blueprint

A concrete architecture for your custom theme could look like this:

- **PHP templates**:  
  - Render full HTML for all content areas.  
  - Use block templates and `theme.json` sparingly to keep generated CSS small. [nexterwp](https://nexterwp.com/blog/gutenberg-core-web-vitals-block-theme/)

- **Islands**:  
  - Search bar, filters, carousels, comment forms implemented as blocks using the Interactivity API. [make.wordpress](https://make.wordpress.org/core/2024/03/04/interactivity-api-dev-note/)
  - Each island has its own `viewScriptModule` entry and small store.

- **Hydration strategy**:  
  - Above‑the‑fold islands hydrate immediately.  
  - Below‑the‑fold islands hydrate on idle or visibility.  
  - Rarely used interactions hydrate on first use. [github](https://github.com/WordPress/gutenberg/discussions/52723)

- **Navigation**:  
  - Speculative loading enabled with prerender for key paths. [make.wordpress](https://make.wordpress.org/core/2025/03/06/speculative-loading-in-6-8/)
  - View transitions enabled via `add_theme_support( 'view-transitions' )` for smooth page changes. [wp-content](https://wp-content.co/view-transitions-plugin-wordpress/)

- **CSS**:  
  - Critical CSS inlined per template; full CSS loaded async. [brndle](https://brndle.com/critical-css-block-themes-first-contentful-paint/)
  - `theme.json` kept minimal; unused block styles not enqueued. [nexterwp](https://nexterwp.com/blog/gutenberg-core-web-vitals-block-theme/)

- **Fonts & images**:  
  - Self‑hosted WOFF2 fonts, limited weights, `font-display: swap`, preload critical fonts. [themenectar](https://themenectar.com/docs/salient/performance-optimization-guide/)
  - LCP images marked with `fetchpriority="high"`, hero backgrounds preloaded and not lazy‑loaded. [make.wordpress](https://make.wordpress.org/core/2023/05/02/proposal-for-enhancing-lcp-image-performance-with-fetchpriority/)

