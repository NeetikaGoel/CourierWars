#!/bin/bash

# Gets the Courier War MySQL/MariaDB database ready for the backend.
#   ./scripts/setup-database.sh           interactive: start server, fix login, apply schema
#   ./scripts/setup-database.sh --check   silent check only (exit 0 = database ready)
# Connection settings come from backend/config/DatabaseConfig.php (DB_HOST, DB_PORT,
# DB_NAME, DB_USERNAME, DB_PASSWORD env overrides), the same values the backend uses.
# Exit codes: 0 = ready, 1 = not ready/aborted/failed

# go to courier war game root
cd "$(dirname "$0")/.." || exit 1

CHECKER="backend/scripts/database-setup.php"

# exit codes of the php checker
DB_READY=0
DB_UNREACHABLE=2
DB_ACCESS_DENIED=3
DB_SCHEMA_MISSING=4

db_status() {
    DB_STATUS_TEXT="$(php "$CHECKER" check 2>&1)"
    return $?
}

if ! command -v php >/dev/null 2>&1; then
    [ "$1" = "--check" ] || echo "ERROR: php is required (run ./scripts/dependencies.sh first)."
    exit 1
fi

if [ "$1" = "--check" ]; then
    php "$CHECKER" check >/dev/null 2>&1 && exit 0
    exit 1
fi

# ask yes/no question, default no
ask() {
    local answer
    read -r -p "$1 [y/N] " answer
    [[ "$answer" =~ ^[Yy]$ ]]
}

db_config_get() { # $1 = DatabaseConfig method name
    php -r 'require "backend/config/DatabaseConfig.php"; echo DatabaseConfig::'"$1"'();'
}

DB_HOST="$(db_config_get host)"
DB_USER="$(db_config_get username)"
DB_PASSWORD="$(db_config_get password)"
DB_NAME="$(db_config_get databaseName)"

db_host_local() {
    [ "$DB_HOST" = "127.0.0.1" ] || [ "$DB_HOST" = "localhost" ] || [ "$DB_HOST" = "::1" ]
}

db_status
status=$?
if [ "$status" -eq "$DB_READY" ]; then
    echo "OK: database ready - $DB_STATUS_TEXT"
    exit 0
fi

if [ ! -t 0 ]; then
    echo "ERROR: database not ready ($DB_STATUS_TEXT) and no interactive terminal available. Run ./scripts/setup-database.sh manually."
    exit 1
fi

# ---------- step 1: server not reachable -> start the local service ----------
if [ "$status" -eq "$DB_UNREACHABLE" ]; then
    echo "NOT RUNNING: $DB_STATUS_TEXT"
    if ! db_host_local; then
        echo "  -> DB_HOST=$DB_HOST is remote; start that server yourself."
        exit 1
    fi

    START_CMD=()
    if command -v systemctl >/dev/null 2>&1; then
        for unit in mariadb mysqld mysql; do
            if systemctl list-unit-files "$unit.service" --no-legend 2>/dev/null | grep -q "^$unit.service"; then
                START_CMD=(sudo systemctl enable --now "$unit")
                break
            fi
        done
    fi
    if [ ${#START_CMD[@]} -eq 0 ] && command -v brew >/dev/null 2>&1; then
        START_CMD=(brew services start mariadb)
    fi
    if [ ${#START_CMD[@]} -eq 0 ]; then
        echo "  -> no MySQL/MariaDB service found. Run ./scripts/dependencies.sh to install one, or start it manually."
        exit 1
    fi

    if ! ask "Start the database server with: ${START_CMD[*]} ?"; then
        echo "Aborted: the backend needs a running database."
        exit 1
    fi
    "${START_CMD[@]}" || { echo "ERROR: could not start the database server."; exit 1; }

    # give the server a moment to accept connections
    for _ in $(seq 1 20); do
        db_status
        status=$?
        [ "$status" -ne "$DB_UNREACHABLE" ] && break
        sleep 0.5
    done
    if [ "$status" -eq "$DB_UNREACHABLE" ]; then
        echo "ERROR: server started but still unreachable: $DB_STATUS_TEXT"
        exit 1
    fi
    echo "OK: database server is running"
fi

# ---------- step 2: login rejected -> set up the configured account ----------
if [ "$status" -eq "$DB_ACCESS_DENIED" ]; then
    echo "LOGIN FAILED: $DB_STATUS_TEXT"
    if ! db_host_local; then
        echo "  -> DB_HOST=$DB_HOST is remote; fix DB_USERNAME/DB_PASSWORD or the account on that server."
        exit 1
    fi

    # admin access through the local socket as OS root (default for MariaDB/MySQL packages)
    ADMIN_CLIENT=()
    for client in mariadb mysql; do
        if command -v "$client" >/dev/null 2>&1; then
            ADMIN_CLIENT=(sudo "$client" -u root)
            break
        fi
    done
    if [ ${#ADMIN_CLIENT[@]} -eq 0 ]; then
        echo "  -> no mariadb/mysql client found to fix the account."
        exit 1
    fi

    sql_escape() { printf '%s' "${1//\'/\'\'}"; }
    user_sql="$(sql_escape "$DB_USER")"
    password_sql="$(sql_escape "$DB_PASSWORD")"
    database_sql="${DB_NAME//\`/}"

    if [ "$DB_USER" = "root" ]; then
        # keep socket login for OS root and add the configured password for TCP logins
        ACCOUNT_SQL="ALTER USER 'root'@'localhost' IDENTIFIED VIA unix_socket OR mysql_native_password USING PASSWORD('$password_sql');"
        DESCRIPTION="give MySQL/MariaDB root@localhost the password from DatabaseConfig (socket login for OS root is kept)"
    else
        ACCOUNT_SQL="CREATE USER IF NOT EXISTS '$user_sql'@'localhost' IDENTIFIED BY '$password_sql';
CREATE USER IF NOT EXISTS '$user_sql'@'127.0.0.1' IDENTIFIED BY '$password_sql';
GRANT ALL PRIVILEGES ON \`$database_sql\`.* TO '$user_sql'@'localhost';
GRANT ALL PRIVILEGES ON \`$database_sql\`.* TO '$user_sql'@'127.0.0.1';
FLUSH PRIVILEGES;"
        DESCRIPTION="create user '$DB_USER' with the password from DatabaseConfig and grant it all privileges on '$DB_NAME'"
    fi

    echo "  This will $DESCRIPTION,"
    echo "  using: ${ADMIN_CLIENT[*]}"
    if ! ask "Set up the database account?"; then
        echo "Aborted: the backend cannot log in to the database."
        exit 1
    fi
    if ! printf '%s\n' "$ACCOUNT_SQL" | "${ADMIN_CLIENT[@]}"; then
        echo "ERROR: account setup failed. Set DB_USERNAME/DB_PASSWORD to an account that works, or fix it manually."
        exit 1
    fi

    db_status
    status=$?
    if [ "$status" -eq "$DB_ACCESS_DENIED" ]; then
        echo "ERROR: login still rejected after account setup: $DB_STATUS_TEXT"
        exit 1
    fi
    echo "OK: database login works"
fi

# ---------- step 3: database/tables missing -> apply backend/schema/*.sql ----------
if [ "$status" -eq "$DB_SCHEMA_MISSING" ]; then
    echo "SCHEMA MISSING: $DB_STATUS_TEXT"
    if ! ask "Create the database and missing tables from backend/schema/*.sql? (existing tables are left untouched)"; then
        echo "Aborted: the backend needs the schema."
        exit 1
    fi
    php "$CHECKER" apply-schema
    db_status
    status=$?
fi

if [ "$status" -ne "$DB_READY" ]; then
    echo "ERROR: database not ready: $DB_STATUS_TEXT"
    exit 1
fi

echo "OK: database ready - $DB_STATUS_TEXT"
exit 0
