# WordPress Plugin Agent Instructions

You are working in a WordPress plugin in the Snoka workspace. This project targets **PHP 8.1+** and **WordPress 6.x latest** with no backward compatibility concern.

## First-Time Setup

Read these two foundational docs when you first enter a plugin repo:

1. **`../../wp-agent/docs/reference/wordpress/architecture.md`** — plugin file tree, namespace conventions, coding standards (PHP/JS/CSS)
2. **`../../wp-agent/docs/reference/wordpress/bootstrap-modes.md`** — autoloading modes (A/B/C), which determines packaging and the release checklist

## Decision Router

| If your task involves | Read |
|---|---|
| Plugin file tree, namespaces, service pattern, code style | `../../wp-agent/docs/reference/wordpress/architecture.md` |
| Autoloading, Composer modes (A/B/C) | `../../wp-agent/docs/reference/wordpress/bootstrap-modes.md` |
| Capabilities, nonces, escaping, SQL, REST auth | `../../wp-agent/docs/reference/wordpress/security.md` |
| Block registration, block.json, editor/frontend separation | `../../wp-agent/docs/reference/wordpress/blocks.md` |
| REST route design, controllers, schema | `../../wp-agent/docs/reference/wordpress/rest-api.md` |
| PHPUnit, PHPCS, PHPStan, dev commands, PHPCBF safety | `../../wp-agent/docs/reference/wordpress/testing-build.md` |
| Zip packaging, release checklist, commit conventions | `../../wp-agent/docs/reference/wordpress/release.md` |
| CPTs vs custom tables, meta, migrations | `../../wp-agent/docs/reference/wordpress/database.md` |
| Internationalization, translations, .po/.mo workflow | `../../wp-agent/docs/reference/wordpress/i18n.md` |
| Workflow rules, when to consult Perplexity | `../../wp-agent/docs/reference/wordpress/workflow.md` |

## Runtime Constraint Verification

Before applying any pattern from these modules:

1. **Check the project** — open `composer.json`. Does `require` have entries, or only `require-dev`?
2. **Identify the mode** — which Bootstrap Mode (A/B/C)?
3. **Trust the user over the doc** — if the user states a constraint that contradicts a documented default, the user is right.

## Tech Stack

- **PHP**: 8.1+ (typed properties, readonly classes, enums, named arguments, match, constructor promotion)
- **WordPress**: 6.x, latest supported release APIs — no polyfills or compat shims
- **JS Build**: `@wordpress/scripts` with ESNext modules and `block.json` metadata
- **Blocks**: `register_block_type_from_metadata()`, dynamic server-rendered blocks where appropriate
- **REST**: Controller classes per resource on `rest_api_init`
- **DB**: Custom tables with `$wpdb::prepare()` only when CPTs + meta are insufficient
- **Testing**: PHPUnit 10+ via `yoast/phpunit-polyfills` + `wp-phpunit/wp-phpunit`

> Detailed guidance for each area is in the matching reference module above.
