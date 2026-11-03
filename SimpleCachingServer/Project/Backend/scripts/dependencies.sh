#!/bin/bash

# Checks runtime dependencies of the cache server and offers to install missing ones.
#   ./scripts/dependencies.sh           interactive: check, prompt, install
#   ./scripts/dependencies.sh --check   silent check only (exit 0 = all present)
# Exit codes: 0 = all required dependencies present, 1 = missing/aborted/failed

PHP_MIN_MAJOR=8

# required: php CLI >= 8
php_ok() {
    command -v php >/dev/null 2>&1 || return 1
    [ "$(php -r 'echo PHP_MAJOR_VERSION;' 2>/dev/null)" -ge "$PHP_MIN_MAJOR" ] 2>/dev/null
}

# optional: pcntl extension (graceful SIGTERM/SIGINT shutdown in server.php)
pcntl_ok() {
    php -m 2>/dev/null | grep -qix pcntl
}

if [ "$1" = "--check" ]; then
    php_ok
    exit $?
fi

# pick package manager and package names
if command -v dnf >/dev/null 2>&1; then
    INSTALL=(sudo dnf install -y); PKG_PHP=(php-cli); PKG_PCNTL=(php-process)
elif command -v apt-get >/dev/null 2>&1; then
    INSTALL=(sudo apt-get install -y); PKG_PHP=(php-cli); PKG_PCNTL=(php-cli)
elif command -v pacman >/dev/null 2>&1; then
    INSTALL=(sudo pacman -S --noconfirm); PKG_PHP=(php); PKG_PCNTL=()
elif command -v brew >/dev/null 2>&1; then
    INSTALL=(brew install); PKG_PHP=(php); PKG_PCNTL=()
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

exit 0
