
# Simple Caching Server

A lightweight PHP-based in-memory caching server built for restricted local/internal usage

The server exposes HTTP JSON APIs for storing, retrieving, deleting, and managing cache entries with TTL support, authentication, admin controls, bootstrap preload configuration, lifecycle scripts, and structured logging

---

# Features

* In-memory key-value cache
* TTL based expiration
* Bootstrap JSON preload support
* Authentication using API keys
* Normal and admin role separation
* JSON REST APIs
* Lifecycle scripts for start/stop/restart
* Structured logging
* Config salvage and fallback handling
* Graceful validation and error responses
* Long-running PHP process so cache survives across requests

---

# Tech Stack

* PHP 8+
* Custom socket based PHP server
* JSON APIs
* Shell scripts for lifecycle management

---

# Project Structure

```text
Backend/
├── Auth/
├── config/
├── Controller/
├── Http/
├── Logging/
├── logs/
├── public/
├── run/
├── scripts/
├── src/
│   ├── App/
│   ├── Bootstrap/
│   └── Cache/
├── server.php
└── README.md
````

---

# Core Flow

```text
Client Request
    ↓
server.php
    ↓
Request::createRequestFromRawHttp()
    ↓
Application.php
    ↓
router.php
    ↓
AuthService
    ↓
Controller
    ↓
CacheService
    ↓
CacheItem
    ↓
JsonResponse data
    ↓
server.php builds raw HTTP response
    ↓
Client Response
```

---

# Runtime Model

This project uses a custom long-running PHP process

The server is started using:

```bash
php server.php
```

Inside `server.php`, a socket server keeps running and accepts many HTTP requests

This is important because the cache is stored in memory inside `CacheService`

Since `Application` and `CacheService` are created once during startup, cache values survive across requests while the server process is alive

---

# How Cache Works

Cache entries are stored only in memory while the PHP server process is alive

Each cache item contains:

```json
{
  "key": "feature.banner",
  "value": {
    "enabled": true
  },
  "ttl": 3600,
  "createdAt": "...",
  "updatedAt": "...",
  "expiresAt": "..."
}
```

Expired items are automatically removed during access and cleanup operations

---

# Authentication

All APIs require:

```text
X-API-Key
```

API keys are stored in:

```text
config/auth.php
```

Two roles exist:

```text
normal
admin
```

---

# API Endpoints

## Normal APIs

| Method | Endpoint                |
| ------ | ----------------------- |
| POST   | `/v1/cache/set`         |
| GET    | `/v1/cache/get?key=...` |
| POST   | `/v1/cache/delete`      |
| DELETE | `/v1/cache/delete`      |

---

## Admin APIs

| Method | Endpoint                         |
| ------ | -------------------------------- |
| POST   | `/v1/admin/cache/bulk-set`       |
| POST   | `/v1/admin/cache/purge-selected` |
| POST   | `/v1/admin/cache/purge-all`      |
| GET    | `/v1/admin/cache/list`           |
| GET    | `/v1/admin/cache/uptime`         |
| GET    | `/v1/admin/cache/size`           |
| GET    | `/v1/admin/cache/health`         |

---

# Bootstrap Configuration

Bootstrap file:

```text
config/bootstrap.json
```

Example:

```json
{
  "config": {
    "ttlDefault": 7200,
    "ttlMax": 604800,
    "host": "127.0.0.1",
    "port": 8080
  },
  "items": [
    {
      "key": "config.mode",
      "value": "classic",
      "ttl": 3600
    }
  ]
}
```

If the file is:

* missing
* unreadable
* malformed
* partially invalid

the server automatically falls back to safe default values

---

# Running The Server

## Give execution permission

```bash
chmod +x scripts/start.sh scripts/stop.sh scripts/restart.sh
```

## Start server

```bash
./scripts/start.sh
```

Server runs at:

```text
http://127.0.0.1:8080
```

## Stop server

```bash
./scripts/stop.sh
```

## Restart server

```bash
./scripts/restart.sh
```

---

# Logs

Log file:

```text
logs/cache-server.log
```

Logs include:

* startup
* auth failures
* validation failures
* cache operations
* bootstrap issues
* internal errors

---

# Example Requests

## Set Cache

```bash
curl -X POST http://127.0.0.1:8080/v1/cache/set \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{
  "key":"user.name",
  "value":"Neetika",
  "ttl":3600
}'
```

## Get Cache

```bash
curl "http://127.0.0.1:8080/v1/cache/get?key=user.name" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

## Delete Cache

```bash
curl -X DELETE http://127.0.0.1:8080/v1/cache/delete \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{
  "key":"user.name"
}'
```

---

# Quick Test

Start server:

```bash
./scripts/start.sh
```

Set value:

```bash
curl -X POST http://127.0.0.1:8080/v1/cache/set \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"key":"test.name","value":"Neetika","ttl":60}'
```

Get value:

```bash
curl "http://127.0.0.1:8080/v1/cache/get?key=test.name" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

Expected result contains:

```json
"value": "Neetika"
```

---

# Security Notes

* Server binds locally on `127.0.0.1`
* APIs protected using API keys
* Structured validation on all inputs
* Security headers added to all responses
* No dynamic code execution
* No database dependency

---

# Current Limitations

* Single process only
* Memory is lost when server stops
* No distributed cache support
* Rate limiting is placeholder only
* Idempotency checks are placeholder only

---

# Future Improvements

* PHPUnit tests
* Real rate limiting
* Real idempotency handling
* Pagination for list endpoint

---

