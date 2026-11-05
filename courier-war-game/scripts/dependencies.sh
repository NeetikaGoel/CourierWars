#!/bin/bash

# Checks the Courier War game's dependencies and offers to install missing ones.
#   ./scripts/dependencies.sh           interactive: check, prompt, install
#   ./scripts/dependencies.sh --check   silent check only (exit 0 = all required present)
# Exit codes: 0 = all required dependencies present, 1 = missing/aborted/failed
#
# The cache server's own dependencies are checked by
# ../SimpleCachingServer/Project/Backend/scripts/dependencies.sh (run by its start.sh).

# go to courier war game root
cd "$(dirname "$0")/.." || exit 1

PHP_MIN_MAJOR=8
NODE_MIN_VERSION="20.19.0" # Vite 7+/8 minimum
FRONTEND_DIR="frontend"

# ---------- checks ----------

version_ge() { # $1 >= $2
    [ "$(printf '%s\n%s\n' "$2" "$1" | sort -V | head -n1)" = "$2" ]
}

# required: php CLI >= 8
php_ok() {
    command -v php >/dev/null 2>&1 || return 1
    [ "$(php -r 'echo PHP_MAJOR_VERSION;' 2>/dev/null)" -ge "$PHP_MIN_MAJOR" ] 2>/dev/null
}

# required: mysqli extension (backend/database/dbConnect.php)
mysqli_ok() {
    php -m 2>/dev/null | grep -qix mysqli
}

# required: allow_url_fopen (backend/cache/CacheServerClient.php uses file_get_contents over http)
url_fopen_ok() {
    [ "$(php -r 'echo ini_get("allow_url_fopen") ? 1 : 0;' 2>/dev/null)" = "1" ]
}

# required: curl CLI (start-all.sh readiness checks)
curl_ok() {
    command -v curl >/dev/null 2>&1
}

# required: node >= NODE_MIN_VERSION and npm (frontend)
node_ok() {
    command -v node >/dev/null 2>&1 || return 1
    version_ge "$(node -v 2>/dev/null | sed 's/^v//')" "$NODE_MIN_VERSION"
}

npm_ok() {
    command -v npm >/dev/null 2>&1
}

# required: frontend packages installed
node_modules_ok() {
    [ -x "$FRONTEND_DIR/node_modules/.bin/vite" ]
}

# MySQL/MariaDB server installed locally (only needed when DB_HOST is this machine)
db_server_ok() {
    command -v mysqld >/dev/null 2>&1 || command -v mariadbd >/dev/null 2>&1
}

# required: database reachable with DatabaseConfig login and schema applied
# (every sign-in path, including guest, writes to cw_users/cw_user_stats)
database_ready_ok() {
    php_ok && mysqli_ok && bash scripts/setup-database.sh --check
}

required_ok() {
    php_ok && mysqli_ok && url_fopen_ok && curl_ok && node_ok && npm_ok && node_modules_ok && database_ready_ok
}

if [ "$1" = "--check" ]; then
    required_ok && exit 0
    exit 1
fi

# ---------- interactive mode ----------

# pick package manager and package names
if command -v dnf >/dev/null 2>&1; then
    INSTALL=(sudo dnf install -y)
    PKG_PHP=(php-cli); PKG_MYSQLI=(php-mysqlnd); PKG_CURL=(curl); PKG_NODE=(nodejs npm); PKG_DB=(mariadb-server)
elif command -v apt-get >/dev/null 2>&1; then
    INSTALL=(sudo apt-get install -y)
    PKG_PHP=(php-cli); PKG_MYSQLI=(php-mysql); PKG_CURL=(curl); PKG_NODE=(nodejs npm); PKG_DB=(mariadb-server)
elif command -v pacman >/dev/null 2>&1; then
    INSTALL=(sudo pacman -S --noconfirm)
    PKG_PHP=(php); PKG_MYSQLI=(); PKG_CURL=(curl); PKG_NODE=(nodejs npm); PKG_DB=(mariadb)
elif command -v brew >/dev/null 2>&1; then
    INSTALL=(brew install)
    PKG_PHP=(php); PKG_MYSQLI=(); PKG_CURL=(curl); PKG_NODE=(node); PKG_DB=(mariadb)
else
    INSTALL=()
fi

# ask yes/no question, default no
ask() {
    local answer
    read -r -p "$1 [y/N] " answer
    [[ "$answer" =~ ^[Yy]$ ]]
}

FAILED=0

# install_required <label> <check_fn> <hint if no package> <packages...>
install_required() {
    local label="$1" check="$2" hint="$3"
    shift 3
    if "$check"; then
        echo "OK: $label"
        return 0
    fi
    echo "MISSING: $label (required)"
    if [ ${#INSTALL[@]} -eq 0 ] || [ $# -eq 0 ]; then
        echo "  -> $hint"
        FAILED=1
        return 1
    fi
    if ! ask "Install with: ${INSTALL[*]} $* ?"; then
        echo "  -> skipped; $label is required."
        FAILED=1
        return 1
    fi
    if ! "${INSTALL[@]}" "$@"; then
        echo "ERROR: installing $label failed."
        FAILED=1
        return 1
    fi
    # verify rather than trust the installer's exit code
    if ! "$check"; then
        echo "ERROR: $label still not usable after installation. $hint"
        FAILED=1
        return 1
    fi
    echo "OK: $label installed"
}

# interactive prompts need a terminal
if ! required_ok && [ ! -t 0 ]; then
    echo "ERROR: dependencies missing and no interactive terminal available. Run ./scripts/dependencies.sh manually."
    exit 1
fi

[ ${#INSTALL[@]} -eq 0 ] && echo "WARNING: no supported package manager (dnf/apt-get/pacman/brew); missing system packages must be installed manually."

install_required "php CLI ${PHP_MIN_MAJOR}+" php_ok "Install PHP ${PHP_MIN_MAJOR}+ CLI manually." "${PKG_PHP[@]}"

if php_ok; then
    install_required "php mysqli extension" mysqli_ok \
        "Install/enable the mysqli extension (pacman/brew: uncomment 'extension=mysqli' in $(php --ini 2>/dev/null | awk -F': *' '/Loaded Configuration/{print $2}'))." \
        "${PKG_MYSQLI[@]}"
    if url_fopen_ok; then
        echo "OK: php allow_url_fopen enabled"
    else
        echo "MISSING: php allow_url_fopen (required) -> set 'allow_url_fopen = On' in your php.ini"
        FAILED=1
    fi
fi

install_required "curl" curl_ok "Install curl manually." "${PKG_CURL[@]}"

install_required "node ${NODE_MIN_VERSION}+" node_ok \
    "Install Node.js ${NODE_MIN_VERSION}+ manually (e.g. from nodejs.org or nvm); distro packages may be older." \
    "${PKG_NODE[@]}"
install_required "npm" npm_ok "Install npm manually (usually ships with Node.js)." "${PKG_NODE[@]}"

# frontend packages: installed with npm, not the system package manager
if node_modules_ok; then
    echo "OK: frontend packages installed"
else
    echo "MISSING: frontend packages in $FRONTEND_DIR/node_modules (required)"
    if ! node_ok || ! npm_ok; then
        echo "  -> needs node and npm first."
        FAILED=1
    elif ask "Install with: (cd $FRONTEND_DIR && npm ci) ?"; then
        if (cd "$FRONTEND_DIR" && npm ci) && node_modules_ok; then
            echo "OK: frontend packages installed"
        else
            echo "ERROR: npm ci failed."
            FAILED=1
        fi
    else
        echo "  -> skipped; frontend packages are required."
        FAILED=1
    fi
fi

# database: server installed (when local), running, login works, schema applied
if database_ready_ok; then
    echo "OK: database ready ($(php backend/scripts/database-setup.php check 2>/dev/null))"
elif ! php_ok || ! mysqli_ok; then
    echo "MISSING: database (required) -> needs php and the mysqli extension first."
    FAILED=1
else
    DB_HOST_CONFIGURED="$(php -r 'require "backend/config/DatabaseConfig.php"; echo DatabaseConfig::host();')"
    case "$DB_HOST_CONFIGURED" in
        127.0.0.1|localhost|::1)
            install_required "MySQL/MariaDB server" db_server_ok \
                "Install MariaDB or MySQL server manually." "${PKG_DB[@]}"
            ;;
    esac
    if [ "$FAILED" -eq 0 ] || db_server_ok; then
        echo "Database not ready, running ./scripts/setup-database.sh"
        bash scripts/setup-database.sh || FAILED=1
    fi
fi

if [ "$FAILED" -ne 0 ]; then
    echo "Required dependencies are still missing."
    exit 1
fi

echo "All required dependencies are present."
exit 0
