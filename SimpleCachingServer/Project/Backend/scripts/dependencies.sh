#!/bin/bash

# Checks runtime dependencies of the cache server and offers to install missing ones.
#   ./scripts/dependencies.sh               interactive: check, prompt, install (runtime + test tooling)
#   ./scripts/dependencies.sh --check       silent check only (exit 0 = runtime deps present)
#   ./scripts/dependencies.sh --check-dev   silent check only (exit 0 = test tooling present)
# Exit codes: 0 = all required runtime dependencies present, 1 = missing/aborted/failed
# Test tooling (PHPUnit) is optional: it never makes the interactive run or start.sh fail.

# go to project root from scripts folder
cd "$(dirname "$0")/.." || exit 1

PHP_MIN_MAJOR=8

# php extensions PHPUnit 13 needs (hard "ext-*" requirements in composer.lock)
PHPUNIT_EXTENSION_LIST=(dom libxml mbstring xml xmlwriter tokenizer phar ctype json)

# required: php CLI >= 8
php_ok() {
    command -v php >/dev/null 2>&1 || return 1
    [ "$(php -r 'echo PHP_MAJOR_VERSION;' 2>/dev/null)" -ge "$PHP_MIN_MAJOR" ] 2>/dev/null
}

# optional: pcntl extension (graceful SIGTERM/SIGINT shutdown in server.php)
pcntl_ok() {
    php -m 2>/dev/null | grep -qix pcntl
}

# test tooling: php extensions needed by PHPUnit
phpunit_extensions_missing() {
    local loaded extension missing=()
    loaded="$(php -m 2>/dev/null | tr '[:upper:]' '[:lower:]')"
    for extension in "${PHPUNIT_EXTENSION_LIST[@]}"; do
        grep -qx "$extension" <<<"$loaded" || missing+=("$extension")
    done
    echo "${missing[*]}"
}

phpunit_extensions_ok() {
    php_ok && [ -z "$(phpunit_extensions_missing)" ]
}

# test tooling: composer CLI and installed vendor packages with bin proxies
composer_ok() {
    command -v composer >/dev/null 2>&1
}

vendor_ok() {
    [ -f vendor/bin/phpunit ] && [ -f vendor/autoload.php ]
}

dev_ok() {
    phpunit_extensions_ok && vendor_ok
}

if [ "$1" = "--check" ]; then
    php_ok
    exit $?
fi

if [ "$1" = "--check-dev" ]; then
    dev_ok
    exit $?
fi

# pick package manager and package names
if command -v dnf >/dev/null 2>&1; then
    INSTALL=(sudo dnf install -y); PKG_PHP=(php-cli); PKG_PCNTL=(php-process)
    PKG_PHPUNIT_EXT=(php-xml php-mbstring); PKG_COMPOSER=(composer)
elif command -v apt-get >/dev/null 2>&1; then
    INSTALL=(sudo apt-get install -y); PKG_PHP=(php-cli); PKG_PCNTL=(php-cli)
    PKG_PHPUNIT_EXT=(php-xml php-mbstring); PKG_COMPOSER=(composer)
elif command -v pacman >/dev/null 2>&1; then
    INSTALL=(sudo pacman -S --noconfirm); PKG_PHP=(php); PKG_PCNTL=()
    PKG_PHPUNIT_EXT=(); PKG_COMPOSER=(composer)
elif command -v brew >/dev/null 2>&1; then
    INSTALL=(brew install); PKG_PHP=(php); PKG_PCNTL=()
    PKG_PHPUNIT_EXT=(); PKG_COMPOSER=(composer)
else
    echo "ERROR: no supported package manager (dnf/apt-get/pacman/brew). Install PHP ${PHP_MIN_MAJOR}+ CLI manually."
    exit 1
fi

# ask yes/no question, default no
ask() {
    local answer
    read -r -p "$1 [y/N] " answer
    [[ "$answer" =~ ^[Yy]$ ]]
}

# interactive prompts need a terminal
if [ ! -t 0 ]; then
    echo "ERROR: dependencies missing and no interactive terminal available. Run ./scripts/dependencies.sh manually."
    exit 1
fi

if php_ok; then
    echo "OK: php $(php -r 'echo PHP_VERSION;') found"
else
    echo "MISSING: php CLI ${PHP_MIN_MAJOR}+ (required)"
    if ! ask "Install with: ${INSTALL[*]} ${PKG_PHP[*]} ?"; then
        echo "Aborted: php is required."
        exit 1
    fi
    if ! "${INSTALL[@]}" "${PKG_PHP[@]}"; then
        echo "ERROR: installation failed."
        exit 1
    fi
    # verify rather than trust the installer's exit code
    if ! php_ok; then
        echo "ERROR: php still not usable after installation."
        exit 1
    fi
    echo "OK: php $(php -r 'echo PHP_VERSION;') installed"
fi

# optional dependency: never blocks startup
if pcntl_ok; then
    echo "OK: pcntl extension found"
else
    echo "MISSING (optional): pcntl extension - without it SIGTERM/SIGINT kill the server instead of graceful shutdown"
    if [ ${#PKG_PCNTL[@]} -gt 0 ] && ask "Install with: ${INSTALL[*]} ${PKG_PCNTL[*]} ?"; then
        "${INSTALL[@]}" "${PKG_PCNTL[@]}" || echo "WARNING: optional install failed, continuing."
    fi
fi

# optional test tooling (vendor/bin/phpunit): never blocks startup
if dev_ok; then
    echo "OK: test tooling (PHPUnit extensions + vendor/bin/phpunit) found"
else
    echo "MISSING (optional, needed for tests): test tooling for vendor/bin/phpunit"

    missing_extensions="$(phpunit_extensions_missing)"
    if [ -n "$missing_extensions" ]; then
        echo "  php extensions missing: $missing_extensions"
        if [ ${#PKG_PHPUNIT_EXT[@]} -gt 0 ] && ask "Install with: ${INSTALL[*]} ${PKG_PHPUNIT_EXT[*]} ?"; then
            "${INSTALL[@]}" "${PKG_PHPUNIT_EXT[@]}" || echo "WARNING: optional install failed, continuing."
        elif [ ${#PKG_PHPUNIT_EXT[@]} -eq 0 ]; then
            echo "  -> enable them in php.ini ($(php --ini 2>/dev/null | awk -F': *' '/Loaded Configuration/{print $2}'))"
        fi
    fi

    if ! vendor_ok; then
        if ! composer_ok && ask "vendor/bin/phpunit is missing. Install composer with: ${INSTALL[*]} ${PKG_COMPOSER[*]} ?"; then
            "${INSTALL[@]}" "${PKG_COMPOSER[@]}" || echo "WARNING: optional install failed, continuing."
        fi
        if composer_ok && ask "Install PHP packages from composer.lock with: composer install ?"; then
            composer install --no-interaction || echo "WARNING: composer install failed, continuing."
        fi
    fi

    if dev_ok; then
        echo "OK: test tooling installed"
    else
        echo "WARNING: test tooling still incomplete; vendor/bin/phpunit will not run."
    fi
fi

exit 0
