#!/bin/bash

cd "$(dirname "$0")/.." || exit 1

export CACHE_SERVER_URL="${CACHE_SERVER_URL:-http://127.0.0.1:8080}"
export CACHE_SERVER_API_KEY="${CACHE_SERVER_API_KEY:-NORMALAPIKEY12345678901234567890}"
export JWT_COOKIE_SECURE="${JWT_COOKIE_SECURE:-false}"
export CSRF_COOKIE_SECURE="${CSRF_COOKIE_SECURE:-false}"
export JWT_SECRET="${JWT_SECRET:-courier-war-local-dev-secret-32-chars-minimum}"

wait_for_url() {
    local url="$1"
    local api_key="$2"
    local name="$3"

    for attempt in {1..80}; do
        if [ -n "$api_key" ]; then
            code=$(curl -s -o /dev/null -w "%{http_code}" -H "X-API-Key: $api_key" "$url" || true)
        else
            code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)
        fi

        if [ "$code" = "200" ] || [ "$code" = "404" ]; then
            echo "$name is ready"
            return 0
        fi

        sleep 0.25
    done

    echo "$name did not become ready"
    exit 1
}

bash scripts/start-cache-server.sh

CACHE_PID_FILE="../SimpleCachingServer/Project/Backend/run/cache-server.pid"

if [ ! -f "$CACHE_PID_FILE" ]; then
    echo "cache server pid file missing"
    exit 1
fi

CACHE_PID=$(cat "$CACHE_PID_FILE")

if ! kill -0 "$CACHE_PID" 2>/dev/null; then
    echo "cache server process is not running"
    exit 1
fi

echo "cache server running with pid $CACHE_PID"

wait_for_url "$CACHE_SERVER_URL/v1/cache/get?key=cw:health:backend-ping" "$CACHE_SERVER_API_KEY" "cache server"

php backend/scripts/bootstrap-cache.php 1

bash scripts/start-backend.sh &
BACKEND_PID=$!

echo "courier war backend started with pid $BACKEND_PID"

if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "backend process is not running"
    exit 1
fi

wait_for_url "http://127.0.0.1:8000/api/v1/health" "" "backend"

bash scripts/start-frontend.sh