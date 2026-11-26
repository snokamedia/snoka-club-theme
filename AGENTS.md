# snoka-block-theme

> **Plugin-specific instructions:** Create `AGENTS.local.md` in this
> directory with custom agent rules. The shared rules below always apply.

---
## Shared Agent Rules

<!--
  shared-rules.md — Convenience assembly for quick reference.
  SOURCE OF TRUTH: templates/partials/*.md
  To regenerate: bash wp-agent/scripts/assemble-templates.sh
-->

## Command Routing — Read Before Running Anything

### Context

The bash tool runs **WSL Linux natively** (Ubuntu). Git, pnpm, composer, PHP, Node.js, DDEV, and Docker CE are all installed natively inside WSL and directly available on PATH.

### Step 1: Classify the command

| If your command is... | Then execute via... |
|---|---|
| **Read-only** — `ls`, `read`, `grep`, `glob`, file reads | bash tool directly |
| **WSL-native** — `git`, `composer`, `node`, `npm`, `npx`, `pnpm`, `rm`, `mv`, `php`, `wp` (if installed), `bash`, `python3` | bash tool directly |
| **DDEV** — `ddev`, `ddev exec`, `ddev list`, `ddev start` | bash tool directly (native WSL binary, Docker CE engine) |
| **PHP inside container** — `phpcs` (check-only), `phpstan` analysis, `phpunit` tests | `ddev exec` from site directory — paths reference container filesystem |
| **PHP file operations** — `phpcbf` (auto-fix), any write-back | WSL PHP directly (bash tool) — files owned by WSL user, not container `www-data` |

### Danger Signs — write a script file instead of inline

Even though quoting no longer crosses a PowerShell boundary, complex commands still break across the WSL→Docker boundary:

- `cd <dir> &&` inside `ddev exec "..."` — use `--working-dir` flag instead
- `$(...)` inside `ddev exec` — write a script file
- Nested quotes (4+ quote chars) inside `ddev exec` — write a script file
- PHP/Zsh code with `$var` inside `ddev exec` — write to a temp file, then `ddev exec php <file>`
- Redirection or pipeline filtering — not available from WSL bash; write a script file
- `python3 -c`, `node -e`, `php -r` with inline code evaluation — quoting across WSL→Docker may still break. Write a script file.
- `curl ... | python3 ...` — separate fetch from processing in a script file
- Running a command to "see if it works" without reading the relevant doc or `--help` first

### Danger Signs — DDEV with fragile quoting

When DDEV quoting gets complex (even though the binary is native WSL now), write a script file instead:

| Banned in DDEV inline | Instead |
|---|---|
| `;` to chain commands | Write a script file with separate lines |
| `&&` or `\|\|` to chain | Write a script file |
| `$(...)` subexpressions | Write a script file |
| Nested quotes (4+ quote chars) | Write a script file |
| PHP code with `$var` inside `ddev exec` | Write `.php` to bind-mounted path, then `ddev exec php <path>` |
| `cd <dir> &&` inside `ddev exec "..."` | Use `--working-dir` flag — never `cd` inside exec strings |

### Default Fallback

| If uncertain about... | Then |
|---|---|
| Any DDEV command from bash | Use `ddev <args>` directly (native WSL binary) |
| DDEV from bash (fragile quoting) | Write a script file → run it from bash tool |
| Anything else | bash tool directly |

## Workspace Context

You are inside a plugin repo at `/home/snoka/Projects/WordPress/plugins/<slug>`.

> The `bash` tool runs **WSL Linux natively** — git, pnpm, composer, PHP, Node.js, DDEV, and Docker CE are all directly available on PATH. See `../../docs/tooling/shell-environment.md`.

- **Sandboxes** — `../../sites/` (DDEV-managed WordPress instances)
- **Central rules** — `../../wp-agent/` canonical rule hub
- **Shared assets** — `../../shared/blueprints/assets/` pre-downloaded theme/plugin zips
- **DDEV mandatory** — never `wp-env`. DDEV runs natively in WSL on Docker CE.
- **pnpm only** — never `npm install`. Run `pnpm approve-builds --all` after every install.
- **First time** — read `WORDPRESS.md` for architecture, security, and coding conventions.

## Core Rules

1. **Consult before guessing** — before any decision about APIs, patterns, or architecture, use `proxima_ask_perplexity`. Do not guess when you can look it up.
2. **Runtime Reality First** — before proposing any architecture or workflow, verify the project's actual runtime constraints. If the user states a constraint that contradicts the convention doc, trust the user.
3. **Security-first** — every state-changing path needs capability check + nonce + validation + sanitization + escaping. See `../../wp-agent/docs/reference/wordpress/security.md` for exact code patterns.
4. **No backward compat** — target PHP 8.1+ and WordPress 6.x latest. Use modern APIs, no polyfills.
5. **License — NEVER change from Proprietary** — these plugins are proprietary, not distributed on WordPress.org. Plugin Check will flag `License: Proprietary` with `plugin_header_invalid_license` — this is expected and must be ignored with a ponytail comment. Never change a plugin's license to GPL or any open-source license.

6. **Translations — lazy until requested** — only add translation scaffolding when the user explicitly requests it. When translating:
   - Wrap all user-facing strings with `__()`, `_e()`, etc. using the plugin's text domain
   - Add `/* translators: ... */` comments above any string with placeholders
   - Use `wp i18n make-pot` to generate `.pot`, `wp i18n make-mo` to compile
   - Load textdomain on `init` — never at file level (WP 6.7+ notice)
   - Never leave `.gitkeep` in `/languages/` — triggers `_load_textdomain_just_in_time`
   - Validate `.mo` files with `php ../../tools/qa/check-translations.php <slug>`
   - See `../../wp-agent/docs/reference/wordpress/i18n.md` for full reference

7. **Quality gate (mandatory after writing code)** — run the full pipeline **before declaring the task done**:
   - **Find PHP files to check**: `git diff --name-only --diff-filter=ACMR -- '*.php'` (tracked: staged + unstaged) + `git ls-files --others --exclude-standard -- '*.php'` (new untracked). If both empty, list files you created/modified directly.
   - **PHPCBF** — auto-fix changed PHP files. Run directly via bash tool (WSL PHP — never inside DDEV):
      ```bash
      cd /home/snoka/Projects/WordPress/plugins/<slug>
      files=$(git diff --name-only --diff-filter=ACMR -- '*.php'; git ls-files --others --exclude-standard -- '*.php')
      for f in $files; do [ -f "$f" ] && phpcbf --standard=phpcs.xml.dist "$f"; done
      ```
      If `phpcs.xml.dist` missing, use `--standard=phpcs.xml` or `--standard=WordPress`.
   - **Plugin Check — primary code quality (DDEV)** — from the sandbox where the plugin is mounted:
      ```bash
      ddev exec wp plugin check <slug>
      ```
      Add `--format=json` for parseable output. Add `--require=./wp-content/plugins/plugin-check/cli.php` for runtime checks (slower). Install Plugin Check: `ddev exec wp plugin install plugin-check --activate`.
   - **Workspace QA supplemental (run from project root)**:
      ```bash
      cd /home/snoka/Projects/WordPress
      php scripts/qa/syntax-check.php <slug>    # Fast PHP syntax lint
      php tools/qa/custom-check.php <slug>      # suppress_filters, date vs gmdate
      php tools/qa/check-translations.php <slug> # .mo file validation + textdomain paths
      php scripts/qa/run-phpstan.php <slug>     # Type analysis (if config exists)
      php scripts/qa/release-check.php <slug>   # Release packaging
      ```
   - **Per-plugin composer fallback** — if the plugin has its own `composer.json`, you may use its scripts via:
     `ddev exec composer --working-dir=/var/www/html/wp-content/plugins/<slug> <command>`
     If it has a `ci` script, run that. Otherwise run `lint-php` → `analyse-php` → `test` in order.
   - **pnpm build** (if JS changed) — run directly via bash tool
   - **JS lint** (if you created/modified JS files): `pnpm wp-scripts lint-js ./src/`
   - **CSS lint** (if you created/modified CSS files): `pnpm wp-scripts lint-style ./src/`
   - **JS/CSS lint scope**: Only lint your project's source files. Third-party bundled code (e.g. `bitform plugins/`, `vendor/`, `mpdf/`) must be excluded via `.eslintignore` / `.stylelintignore`. Creating or updating these ignore files is part of scoping the lint — do it upfront.
   - **JS source maps** — extend `webpack.config.js` with `devtool: 'source-map'` (or set `--webpack--devtool=source-map` in the build script) so production runtime errors (`admin.js?ver=...`) map back to readable source lines instead of minified variable names like `fp`, `ie`, `NC`.
   - **TS type check** (if `tsconfig.json` exists): `pnpm tsc --noEmit` — catches type mismatches that linters can't see.
   - **TS-aware ESLint rules**: If the project uses TypeScript, enable `@typescript-eslint` strict rules:
     - `@typescript-eslint/no-unsafe-member-access`
     - `@typescript-eslint/no-unsafe-call`
     - `@typescript-eslint/strict-boolean-expressions`
     - `react-hooks/exhaustive-deps`
     - `@typescript-eslint/no-use-before-define` — set `variables: true` to catch TDZ ordering bugs
   - If any step fails → fix and re-run from PHPCBF. Do **not** run `pnpm plugin-zip` during development (only before release).
   - **Never run PHPCBF on the full project** — use explicit paths.
   - **Backup after committing**:
     ```bash
     bash ../../scripts/backup/backup.sh --plugin <slug>
     ```
     See `../../docs/safety/backups.md`.
7. **Modern PHP** — typed everything, readonly classes, enums, named arguments, constructor promotion, match expressions.
8. **Block metadata** — every block uses `block.json`; register single blocks with `register_block_type_from_metadata()`, for multi-block plugins prefer metadata collection registration on WordPress 6.8+.
9. **Write in plain language** — for any content longer than a few sentences, consult `WRITING.md` and follow its rules.
10. **Commit after important phases** — feature complete, bug fix, refactor, security patch, test suite.
11. **SVG icons** — WordPress admin CSS forces `fill: currentColor` on all SVGs inside `.components-button`. Always use Lucide-style stroke icons (`fill="none"` + `stroke="currentColor"`). Never put multi-color SVGs inside buttons. See `SVG_ICONS.md`.
12. **DDEV + Docker run natively in WSL** — git, pnpm, composer, PHP, Node.js, and all Linux tools run directly in the bash tool (WSL native). DDEV (`~/.local/bin/ddev`) and Docker CE (systemd dockerd on `/var/run/docker.sock`) are installed inside WSL. Never assume a tool is missing just because it's not available on Windows PATH.
13. **Signal vs Noise** — When debugging, isolate the answer from unrelated errors. If output contains both a clear result (e.g., "Count: 3") and an error in auxiliary code (e.g., wrong key name in an output loop), accept the result. The error is a separate bug to fix, not evidence the result is wrong. Don't re-verify through increasingly complex means — fix the noise and move on.
14. **One test proves it** — When the question is "does X work?", one successful test is proof. Don't build additional verification harnesses to re-prove the same thing. Document the result and move to the next task. Re-testing the same thing with different approaches is work-not-work.
15. **Default `.eslintrc.js` for TypeScript projects** — if a plugin uses `@wordpress/scripts` and TypeScript and has no ESLint config file, create one that extends `plugin:@wordpress/eslint-plugin/recommended` and enables `@typescript-eslint/no-use-before-define` with `variables: true`. Without this, TDZ ordering bugs are invisible at lint time and only surface at runtime as minified `ReferenceError`s.
16. **DDEV two-stage startup — NEVER override CMD, NEVER expect `docker restart` to work.** The DDEV web container uses `pre-start.sh` (a pipe waiter) as PID 1. DDEV's CLI calls `start.sh` externally to launch nginx, php-fpm, and mailpit via supervisord. This is by design. If the container restarts outside DDEV (engine restart, host reboot, `docker restart`), only `pre-start.sh` runs and the site returns 502. **You cannot make `docker restart` or any GUI "Restart containers" control restore services.** The only fixes:
    - Quick: `docker exec ddev-<project>-web /start.sh`
    - Full: `ddev start` from the site directory (also runs post-start hooks)
    See `../../docs/tooling/ddev.md` for details.

## Workspace QA System

The primary code quality tool is **Plugin Check** via WP-CLI, run inside DDEV. Supplemental checks run from the workspace root.

### Plugin Check — full CLI reference

Basic usage:
```bash
ddev exec wp plugin check <plugin>
```

**Targeting:**
- `--checks=<checks>` — comma-separated check slugs only
- `--exclude-checks=<checks>` — exclude check slugs
- `--ignore-codes=<codes>` — ignore error codes
- `--mode=new|update` — validation mode (default: new)
- `--slug=<slug>` — override plugin slug
- `--categories` — limit to specific categories
- `--include-experimental` — include experimental checks

**Exclusions:**
- `--exclude-directories=<dirs>` — extra directories to skip
- `--exclude-files=<files>` — extra files to skip

**Output formats:**
- `--format=table|csv|json|ctrf` — default table
- `--fields=<fields>` — subset of fields
- `--ignore-warnings` — hide warnings
- `--ignore-errors` — hide errors

**Severity:**
- `--severity=<level>` — global threshold
- `--error-severity=<level>` — error threshold
- `--warning-severity=<level>` — warning threshold
- `--include-low-severity-errors` — sub-threshold as "other"
- `--include-low-severity-warnings` — sub-threshold as "other"

**Runtime (with --require):**
```bash
ddev exec wp plugin check <slug> --require=./wp-content/plugins/plugin-check/cli.php
```

**AI false-positive detection (WP 7.0+):**
```bash
ddev exec wp plugin check <slug> --ai --ai-model=openai::gpt-4o
```

**Related commands:**
```bash
wp plugin list-checks
wp plugin list-checks --format=json
wp plugin list-check-categories
```

### Supplemental workspace checks (from ../../)

```bash
php scripts/qa/syntax-check.php <slug>      # PHP syntax lint
php tools/qa/custom-check.php <slug>        # Project rules (suppress_filters, date vs gmdate)
php tools/qa/check-translations.php <slug>  # .mo file integrity + textdomain path validation
php scripts/qa/run-phpstan.php <slug>       # PHPStan type analysis
php scripts/qa/release-check.php <slug>     # Release packaging validation
```

### What is checked

| Layer | Tool | Catches |
|---|---|---|
| Coding standards | Plugin Check (DDEV) | WordPress-Core/Docs/Extra, security, i18n, PHP compat, submission rules |
| Runtime | Plugin Check (DDEV) | WordPress hooks, plugin activation behavior |
| PHP syntax | `php -l` | Parse errors, fatal syntax |
| Type analysis | PHPStan (level 2) | Type errors, undefined symbols, WP API misuse |
| Project policy | Custom PHP scanner | suppress_filters => true, date() vs gmdate() |
| Translation files | .mo validator | Corrupted .mo files (magic number, header bounds) |
| Textdomain paths | Path scanner | `load_plugin_textdomain()` dirs with only .gitkeep |
| Release packaging | Rsync + manifest + .mo | Forbidden files, nested zips, staged artifact integrity |

### Reference

See `../../docs/qa/README.md` for full documentation.

## Workspace Policy

1. **DDEV only** — all WordPress local dev. Never `wp-env`, `npx wp-env`, raw Docker Compose. DDEV runs natively in WSL on Docker CE. See `../../docs/tooling/ddev.md`.
2. **pnpm only** — never `npm install`. Run `pnpm approve-builds --all` after every install. Check CRLF in `.npmrc` if store dir is wrong. See `../../docs/tooling/pnpm.md`.
3. **Backup after commit** — run backup script after every meaningful commit:
   ```bash
   bash ../../scripts/backup/backup.sh --plugin <slug>
   bash ../../scripts/backup/backup.sh --all    # full workspace
   ```
   See `../../docs/safety/backups.md` for details.
4. **Safety pre-flight** — before destructive ops (rm, docker exec writes, tar xf, git reset/clean, bulk write) read `../../docs/safety/safety-rules.md`. Never `rm -rf` through a bind mount.
5. **Git identity** — pass via env vars on every commit:
   ```
   GIT_AUTHOR_NAME="Snoka Media" GIT_AUTHOR_EMAIL="info@snoka.ca" \
   GIT_COMMITTER_NAME="Snoka Media" GIT_COMMITTER_EMAIL="info@snoka.ca" \
   git commit -m "..."
   ```

## Key Commands

| Command | Purpose |
|---|---|---|
| `ddev exec wp plugin check <slug>` | **Primary** — Plugin Check: coding standards, security, i18n, compat (DDEV) |
| `ddev exec wp plugin check <slug> --require=./wp-content/plugins/plugin-check/cli.php` | Plugin Check with runtime checks (DDEV, slower) |
| `php ../../scripts/qa/syntax-check.php <slug>` | PHP syntax lint (workspace root) |
| `php ../../scripts/qa/run-phpstan.php <slug>` | PHPStan type analysis (workspace root) |
| `php ../../tools/qa/custom-check.php <slug>` | Project rules: suppress_filters, date vs gmdate |
| `php ../../tools/qa/check-translations.php <slug>` | .mo file integrity + textdomain path validation |
| `php ../../scripts/qa/release-check.php <slug>` | Release packaging validation (includes .mo check) |
| `php ../../scripts/qa/run-phpcs.php <slug>` | PHPCS fallback (optional — Plugin Check is primary) |
| `composer qa:syntax -- <slug>` | Composer: syntax check |
| `composer qa:stan -- <slug>` | Composer: PHPStan |
| `composer qa:release -- <slug>` | Composer: release check |
| `composer qa:full` | Composer: syntax + PHPStan + release on ALL |
| `pnpm start` | Watch mode — JS/CSS rebuild on save |
| `pnpm build` | Production build |
| `composer lint-php` | PHPCS per-plugin (if plugin has its own composer.json) |
| `composer analyse-php` | PHPStan per-plugin |
| `composer ci` | Full quality gate per-plugin |
| `pnpm approve-builds --all` | Approve pnpm build scripts |
| `ddev wp-plugin-build <slug>` | Build plugin on host, verify in container, activate |
| `pnpm plugin-zip` | Package zip via `wp-scripts plugin-zip` — includes build output + tracked files |

### Zip Build

```bash
pnpm build
pnpm plugin-zip
# Output: <plugin-slug>.zip or <plugin-name>.zip in project root
```

**Critical** (Mode C plugins): If the project uses `vendor/` at runtime, run `composer install --no-dev --optimize-autoloader` before `pnpm plugin-zip` to avoid including dev-only packages.

## When to Read WORDPRESS.md

The `WORDPRESS.md` file is a router to focused reference modules under `docs/reference/wordpress/`. It should be read during initial project setup. For day-to-day work, these AGENTS.md rules are sufficient. Reach back into the reference when dealing with:

- Security-sensitive code paths (capabilities, nonces, escaping, SQL)
- Block registration and metadata patterns
- REST API controller structure
- Database decisions (CPTs vs custom tables)
- Commit message format (see also `../../docs/workflow/git.md`)
- Runtime mode selection (autoloading, packaging, Composer patterns)
- Any uncertainty about WordPress conventions
