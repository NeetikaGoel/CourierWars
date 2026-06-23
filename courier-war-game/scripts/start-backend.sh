#!/bin/bash

# go to courier war game root
cd "$(dirname "$0")/.." || exit 1

# local dev cache server settings
export CACHE_SERVER_URL="${CACHE_SERVER_URL:-http://127.0.0.1:8080}"
export CACHE_SERVER_API_KEY="${CACHE_SERVER_API_KEY:-NORMALAPIKEY12345678901234567890}"

# local dev auth cookie settings
export JWT_COOKIE_SECURE="${JWT_COOKIE_SECURE:-false}"
export CSRF_COOKIE_SECURE="${CSRF_COOKIE_SECURE:-false}"

# local jwt secret must be at least 32 chars
export JWT_SECRET="${JWT_SECRET:-courier-war-local-dev-secret-32-chars-minimum}"

# start php backend
php -S 127.0.0.1:8000 -t backend/public backend/public/index.php