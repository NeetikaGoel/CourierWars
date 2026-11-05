# Tests
Paths relative to `Project/Backend/`.

- Run: `vendor/bin/phpunit` (PHPUnit 13.1.x via `composer.json` constraint `13.1.*`, locked at 13.1.13 in `composer.lock`; config `phpunit.xml`, suite `Unit` = `tests/Unit`; 101 tests). Prereqs: `scripts/dependencies.sh --check-dev` exits 0; if not, run `scripts/dependencies.sh` (php-xml + php-mbstring, composer, `composer install`). `vendor/` and `.phpunit.cache/` are not committed: `composer install` builds `vendor/` from `composer.lock`. If `vendor/` is incomplete, `composer install` still says "Nothing to install"; delete `vendor/` and reinstall, which `dependencies.sh` offers.
- `tests/LoadFiles.php` — bootstrap; manually `require_once`s classes (no autoloader for app code). New class under test ⇒ add its require here.
- Covered: `AuthService`, `CacheController`, `AdminCacheController`, `AdminCacheMetricsController`, `CacheService`, `CacheItem`, `BootstrapLoader`, `Request`, `ResponseFactory` (one `*Test.php` each).
- Not covered: `public/router.php`, `Logger`, `Utility/*`, `JsonResponse`, `server.php`, scripts.
- Manual/curl testing: `TerminalRunGuide.md` (see `docs-index.md`); `test.md` is the author's test-writing notes.
- `coverage-report/` and `.phpunit.cache/` are generated output — don't read or edit.
