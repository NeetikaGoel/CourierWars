#!/usr/bin/env bash

# Start the complete local Courier War stack from Git Bash:
#   bash courier-war-game/scripts/start-all.sh
#
# This script creates missing MySQL tables with the project's idempotent
# CREATE TABLE IF NOT EXISTS schema files. It does not drop tables or rows.
set -Eeuo pipefail

GAME_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$GAME_ROOT/.." && pwd)"
cd "$GAME_ROOT"

BACKEND_PID=""
CACHE_LOG_TAIL_PID=""
MYSQL_OPTION_FILE=""
MYSQL_OPTION_FILE_UNIX=""

info() { printf '\n[Courier War] %s\n' "$*"; }
fail() { printf '\n[Courier War] ERROR: %s\n' "$*" >&2; exit 1; }

cleanup() {
    local status=$?
    trap - EXIT INT TERM
    if [[ -n "$CACHE_LOG_TAIL_PID" ]] && kill -0 "$CACHE_LOG_TAIL_PID" 2>/dev/null; then
        kill "$CACHE_LOG_TAIL_PID" 2>/dev/null || true
        wait "$CACHE_LOG_TAIL_PID" 2>/dev/null || true
    fi
    if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        info "Stopping the PHP API (PID $BACKEND_PID). The cache server stays running."
        kill "$BACKEND_PID" 2>/dev/null || true
        wait "$BACKEND_PID" 2>/dev/null || true
    fi
    if [[ -n "$MYSQL_OPTION_FILE_UNIX" && -f "$MYSQL_OPTION_FILE_UNIX" ]]; then
        rm -f "$MYSQL_OPTION_FILE_UNIX"
    fi
    exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

require_command() {
    command -v "$1" >/dev/null 2>&1 || fail "Required command '$1' was not found. Install it and reopen Git Bash."
}

port_is_open() {
    php -r '$socket = @fsockopen($argv[1], (int)$argv[2], $errno, $error, 1); if ($socket) { fclose($socket); exit(0); } exit(1);' "$1" "$2" >/dev/null 2>&1
}

cache_http_code() {
    curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
        --max-time 2 -H "X-API-Key: $CACHE_SERVER_API_KEY" \
        "$CACHE_SERVER_URL/v1/cache/get?key=cw:health:backend-ping" 2>/dev/null || true
}

wait_for_cache() {
    local code
    for attempt in {1..40}; do
        code="$(cache_http_code)"
        if [[ "$code" == "200" || "$code" == "404" ]]; then
            info "Cache API is responding (HTTP $code)."
            return 0
        fi
        sleep 0.5
    done
    return 1
}

wait_for_backend() {
    local code
    for attempt in {1..60}; do
        if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
            fail "The PHP API exited during startup. Read the PHP error above and check backend logs/configuration."
        fi
        code="$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 2 \
            http://127.0.0.1:8000/api/v1/health 2>/dev/null || true)"
        if [[ "$code" == "200" ]]; then
            info "PHP API health check passed at http://127.0.0.1:8000/api/v1/health."
            return 0
        fi
        sleep 0.5
    done
    fail "The PHP API did not become healthy on port 8000. Check the PHP startup output above."
}

write_mysql_option_file() {
    if [[ -n "$MYSQL_OPTION_FILE_UNIX" && -f "$MYSQL_OPTION_FILE_UNIX" ]]; then
        rm -f "$MYSQL_OPTION_FILE_UNIX"
    fi
    MYSQL_OPTION_FILE_UNIX="$(mktemp "${TMPDIR:-/tmp}/courier-war-mysql.XXXXXX")" \
        || fail "Could not create a temporary MySQL credentials file. Check write access to your temp folder."
    MYSQL_OPTION_FILE="$MYSQL_OPTION_FILE_UNIX" \
    DB_HOST="$DB_HOST" DB_PORT="$DB_PORT" DB_USERNAME="$DB_USERNAME" DB_PASSWORD="$DB_PASSWORD" \
        php -r '
            $escape = static fn(string $value): string => str_replace(["\\", "\""], ["\\\\", "\\\""], $value);
            $path = getenv("MYSQL_OPTION_FILE");
            $contents = "[client]\nprotocol=tcp\nhost=\"" . $escape(getenv("DB_HOST")) . "\"\n";
            $contents .= "port=" . getenv("DB_PORT") . "\nuser=\"" . $escape(getenv("DB_USERNAME")) . "\"\n";
            $contents .= "password=\"" . $escape(getenv("DB_PASSWORD")) . "\"\n";
            if (file_put_contents($path, $contents, LOCK_EX) === false || !chmod($path, 0600)) {
                fwrite(STDERR, "Unable to write secure temporary MySQL credentials.\n");
                exit(1);
            }
        ' || fail "Could not write temporary MySQL credentials."
    MYSQL_OPTION_FILE="$(cygpath -w "$MYSQL_OPTION_FILE_UNIX")"
}

mysql_run() {
    mysql --defaults-extra-file="$MYSQL_OPTION_FILE" --batch --skip-column-names "$@"
}

ensure_local_mysql_service() {
    if ! command -v powershell.exe >/dev/null 2>&1; then
        printf '[Courier War] PowerShell is unavailable; start MySQL in Windows Services (services.msc).\n' >&2
        return 1
    fi

    info "MySQL is not reachable. Checking for one local MySQL/MariaDB Windows service to start."
    powershell.exe -NoProfile -Command '$ErrorActionPreference = "Stop"; $services = @(Get-Service | Where-Object { $_.Name -match "^(MySQL|MariaDB)" -or $_.DisplayName -match "MySQL|MariaDB" }); if ($services.Count -eq 0) { Write-Output "No MySQL/MariaDB Windows service was found."; exit 2 }; if ($services.Count -gt 1) { Write-Output "Multiple MySQL/MariaDB services found; start the intended service manually."; exit 3 }; $service = $services[0]; if ($service.Status -ne "Running") { Write-Output ("Starting service " + $service.Name); Start-Service -Name $service.Name }; (Get-Service -Name $service.Name).WaitForStatus("Running", [TimeSpan]::FromSeconds(30)); Write-Output ("MySQL service is " + $service.Name + " and running.")' \
        || return 1

    for attempt in {1..40}; do
        if port_is_open "$DB_HOST" "$DB_PORT"; then
            info "MySQL is accepting connections on $DB_HOST:$DB_PORT."
            return 0
        fi
        sleep 0.5
    done
    return 1
}

info "Step 1/7: Checking the local tools and configuration."
for tool in bash php mysql curl node npm cygpath mktemp; do require_command "$tool"; done
php -r 'if (!extension_loaded("pdo_mysql")) { fwrite(STDERR, "PHP extension pdo_mysql is not enabled.\n"); exit(1); }' \
    || fail "Enable pdo_mysql in the PHP installation used by Git Bash, then retry."
node --version
npm --version

export CACHE_SERVER_URL="${CACHE_SERVER_URL:-http://127.0.0.1:8080}"
export CACHE_SERVER_API_KEY="${CACHE_SERVER_API_KEY:-NORMALAPIKEY12345678901234567890}"
export JWT_COOKIE_SECURE="${JWT_COOKIE_SECURE:-false}"
export CSRF_COOKIE_SECURE="${CSRF_COOKIE_SECURE:-false}"
export JWT_SECRET="${JWT_SECRET:-courier-war-local-dev-secret-32-chars-minimum}"
export DB_HOST="${DB_HOST:-127.0.0.1}"
export DB_PORT="${DB_PORT:-3306}"
export DB_NAME="${DB_NAME:-courier_war}"
export DB_USERNAME="${DB_USERNAME:-root}"

[[ "$DB_NAME" == "courier_war" ]] || fail "The included schema files create 'courier_war'. Set DB_NAME=courier_war before starting."
[[ "$DB_PORT" =~ ^[0-9]+$ ]] && (( DB_PORT > 0 && DB_PORT < 65536 )) || fail "DB_PORT must be a valid TCP port number."
for value in "$DB_HOST" "$DB_USERNAME" "${DB_PASSWORD:-}"; do
    [[ "$value" != *$'\n'* && "$value" != *$'\r'* ]] || fail "Database settings cannot contain line breaks."
done
if [[ ! ${DB_PASSWORD+x} ]]; then
    DB_PASSWORD="$(php -r 'require "backend/config/DatabaseConfig.php"; echo DatabaseConfig::password();')" \
        || fail "Could not read the local database password default from DatabaseConfig.php."
fi
export DB_PASSWORD

info "Step 2/7: Connecting to MySQL and preparing the database."
if ! port_is_open "$DB_HOST" "$DB_PORT"; then
    if [[ "$DB_HOST" == "127.0.0.1" || "$DB_HOST" == "localhost" ]]; then
        ensure_local_mysql_service || fail "MySQL is still unavailable. Start your MySQL service in Windows Services (Win+R, services.msc), then rerun this script."
    else
        fail "Cannot reach MySQL at $DB_HOST:$DB_PORT. Start/check the database host and port, then retry."
    fi
fi

write_mysql_option_file
if ! mysql_run --execute='SELECT 1' >/dev/null 2>&1; then
    if [[ -t 0 ]]; then
        printf '[Courier War] MySQL rejected the configured password. Enter the password for user %s (input hidden): ' "$DB_USERNAME" >&2
        IFS= read -r -s DB_PASSWORD || fail "Could not read the MySQL password."
        printf '\n' >&2
        export DB_PASSWORD
        write_mysql_option_file
        mysql_run --execute='SELECT 1' >/dev/null 2>&1 \
            || fail "MySQL login still failed. Check DB_HOST, DB_PORT, DB_USERNAME, and your password."
    else
        fail "MySQL login failed. Set DB_PASSWORD in this Git Bash window and retry."
    fi
fi

for schema in \
    backend/schema/create_cw_users.sql \
    backend/schema/create_cw_user_stats.sql \
    backend/schema/create_cw_match_history.sql; do
    [[ -f "$schema" ]] || fail "Required schema file is missing: $schema"
    info "Applying $schema (safe to rerun; existing rows/tables are preserved)."
    mysql_run < "$schema" || fail "Schema application failed at $schema. Check the MySQL error above."
done

tables="$(mysql_run --database="$DB_NAME" --execute='SHOW TABLES' 2>/dev/null)" \
    || fail "Could not list tables in database $DB_NAME."
for table in cw_users cw_user_stats cw_match_history; do
    printf '%s\n' "$tables" | grep -Fxq "$table" || fail "Required table '$table' is missing from $DB_NAME."
    info "Database table is ready: $table"
done

info "Step 3/7: Starting/checking the cache service."
if [[ "$(cache_http_code)" != "200" && "$(cache_http_code)" != "404" ]]; then
    if [[ "$CACHE_SERVER_URL" != "http://127.0.0.1:8080" ]]; then
        fail "Configured cache at $CACHE_SERVER_URL is not responding. For the bundled cache, use CACHE_SERVER_URL=http://127.0.0.1:8080."
    fi
    if port_is_open 127.0.0.1 8080; then
        fail "Port 8080 is occupied, but the cache API did not respond with the configured key. Check the process and CACHE_SERVER_API_KEY."
    fi
    bash scripts/start-cache-server.sh || fail "Could not start the bundled cache service."
    CACHE_LOG="$REPO_ROOT/SimpleCachingServer/Project/Backend/logs/cache-server.log"
    if command -v tail >/dev/null 2>&1; then
        tail -n 0 -f "$CACHE_LOG" &
        CACHE_LOG_TAIL_PID=$!
    fi
fi
wait_for_cache || fail "The cache service did not become ready. Check SimpleCachingServer/Project/Backend/logs/cache-server.log and confirm the API key matches."

info "Step 4/7: Creating the initial map in cache."
php backend/scripts/bootstrap-cache.php 1 || fail "Map bootstrap failed. Check the cache URL/key and PHP output above."

info "Step 5/7: Installing frontend packages if needed."
if [[ ! -f frontend/node_modules/vite/bin/vite.js ]]; then
    info "Frontend dependencies are missing; running npm ci."
    (cd frontend && npm ci --no-audit --no-fund) || fail "npm ci failed. Check the npm output and network access, then retry."
else
    info "Frontend dependencies are already installed."
fi

info "Step 6/7: Starting and checking the PHP API."
if port_is_open 127.0.0.1 8000; then
    fail "Port 8000 is already occupied. Stop the old API process before running start-all.sh again."
fi
php -S 127.0.0.1:8000 -t backend/public backend/public/index.php &
BACKEND_PID=$!
info "PHP API process started with PID $BACKEND_PID. Its startup output is shown below."
wait_for_backend

info "Step 7/7: Starting Vite and opening the game in your browser."
if port_is_open 127.0.0.1 5173; then
    fail "Port 5173 is already occupied. Stop the old frontend process before running start-all.sh again."
fi
info "Open http://127.0.0.1:5173/ if the browser does not open automatically. Keep this terminal open while playing."
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort --open
