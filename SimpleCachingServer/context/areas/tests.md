# Tests
Paths relative to `Project/Backend/`.

- Run: `vendor/bin/phpunit` (PHPUnit 13.1 via `composer.json`; config `phpunit.xml`, suite `Unit` = `tests/Unit`). Prereqs: `scripts/dependencies.sh --check-dev` exits 0; if not, run `scripts/dependencies.sh` (php-xml + php-mbstring, composer, `composer install`). `vendor/` is committed, but `vendor/bin/` used to be gitignored, so a fresh clone may need `composer install` once.
- `tests/LoadFiles.php` — bootstrap; manually `require_once`s classes (no autoloader for app code). New class under test ⇒ add its require here.
- Covered: `AuthService`, `CacheController`, `AdminCacheController`, `AdminCacheMetricsController`, `CacheService`, `CacheItem`, `BootstrapLoader`, `Request`, `ResponseFactory` (one `*Test.php` each).
- Not covered: `public/router.php`, `Logger`, `Utility/*`, `JsonResponse`, `server.php`, scripts.
- Manual/curl testing: `TerminalRunGuide.md` (see `docs-index.md`); `test.md` is the author's test-writing notes.
- `coverage-report/` and `.phpunit.cache/` are generated output — don't read or edit.
