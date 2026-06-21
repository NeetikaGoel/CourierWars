
# Full Terminal Testing Guide

Run everything from:

```bash
cd ~/Desktop/Version2/neetika-goel-intern-prepwork-v2/SimpleCachingServer/Project/Backend
```

---

# 1. Stop any old server

```bash
./scripts/stop.sh
```

Expected either:

```text
Cache server stopped
```

or:

```text
Cache server is not running
```

---

# 2. Check PHP syntax

```bash
find . -name "*.php" -not -path "./vendor/*" -exec php -l {} \;
```

Expected:

```text
No syntax errors detected
```

for every PHP file.

---

# 3. Give script permissions

```bash
chmod +x scripts/start.sh scripts/stop.sh scripts/restart.sh
```

No output expected.

---

# 4. Start server

```bash
./scripts/start.sh
```

Expected:

```text
Cache server started on http://127.0.0.1:8080 with PID <some_pid>
```

---

# 5. Check PID

```bash
cat run/cache-server.pid
```

Expected:

```text
some number
```

Example:

```text
56476
```

---

# 6. Check logs

```bash
tail -n 20 logs/cache-server.log
```

Expected to see server start logs.

---

# 7. Check duplicate start prevention

```bash
./scripts/start.sh
```

Expected:

```text
Cache server already running with PID <same_pid>
```

---

# 8. Bad Case: Missing auth

```bash
curl -i http://127.0.0.1:8080/v1/admin/cache/health
```

Expected:

```text
HTTP/1.1 401 Unauthorized
```

Expected body:

```json
{
  "success": false,
  "message": "Authentication failed"
}
```

---

# 9. Bad Case: Invalid auth

```bash
curl -i http://127.0.0.1:8080/v1/admin/cache/health \
-H "X-API-Key: WRONGKEY"
```

Expected:

```text
HTTP/1.1 401 Unauthorized
```

---

# 10. Good Case: Admin health

```bash
curl -i http://127.0.0.1:8080/v1/admin/cache/health \
-H "X-API-Key: ADMINAPIKEY123456789012345678901"
```

Expected:

```text
HTTP/1.1 200 OK
```

Expected body contains:

```json
"status": "ok"
```

---

# 11. Good Case: Uptime

```bash
curl -i http://127.0.0.1:8080/v1/admin/cache/uptime \
-H "X-API-Key: ADMINAPIKEY123456789012345678901"
```

Expected:

```text
HTTP/1.1 200 OK
```

Expected body contains:

```json
"uptimeSeconds"
```

Run again after a few seconds:

```bash
curl -s http://127.0.0.1:8080/v1/admin/cache/uptime \
-H "X-API-Key: ADMINAPIKEY123456789012345678901"
```

Expected:

```text
uptimeSeconds should increase
```

---

# 12. Good Case: Size

```bash
curl -i http://127.0.0.1:8080/v1/admin/cache/size \
-H "X-API-Key: ADMINAPIKEY123456789012345678901"
```

Expected:

```text
HTTP/1.1 200 OK
```

Expected body contains:

```json
"itemCount"
"processMemoryBytes"
```

---

# 13. Good Case: List

```bash
curl -i http://127.0.0.1:8080/v1/admin/cache/list \
-H "X-API-Key: ADMINAPIKEY123456789012345678901"
```

Expected:

```text
HTTP/1.1 200 OK
```

Expected body contains:

```json
"count"
"limit"
"items"
```

You should see bootstrap item also:

```json
"config.mode"
```

---

# 14. Good Case: List with limit

```bash
curl -i "http://127.0.0.1:8080/v1/admin/cache/list?limit=1" \
-H "X-API-Key: ADMINAPIKEY123456789012345678901"
```

Expected:

```text
HTTP/1.1 200 OK
```

Expected:

```json
"limit": 1
```

Only one item should return.

---

# 15. Bad Case: List invalid limit

```bash
curl -i "http://127.0.0.1:8080/v1/admin/cache/list?limit=abc" \
-H "X-API-Key: ADMINAPIKEY123456789012345678901"
```

Expected:

```text
HTTP/1.1 400 Bad Request
```

---

# 16. Bad Case: List limit too high

```bash
curl -i "http://127.0.0.1:8080/v1/admin/cache/list?limit=2000" \
-H "X-API-Key: ADMINAPIKEY123456789012345678901"
```

Expected:

```text
HTTP/1.1 400 Bad Request
```

---

# 17. Bad Case: Normal key cannot access admin

```bash
curl -i http://127.0.0.1:8080/v1/admin/cache/health \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

Expected:

```text
HTTP/1.1 403 Forbidden
```

---

# 18. Good Case: Set cache with normal key

```bash
curl -i -X POST http://127.0.0.1:8080/v1/cache/set \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"key":"test.name","value":"Neetika","ttl":300}'
```

Expected:

```text
HTTP/1.1 200 OK
```

Expected body contains:

```json
"key": "test.name"
"value": "Neetika"
```

---

# 19. Good Case: Get same cache value

```bash
curl -i "http://127.0.0.1:8080/v1/cache/get?key=test.name" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

Expected:

```text
HTTP/1.1 200 OK
```

Expected body contains:

```json
"value": "Neetika"
```

This confirms in-memory persistence works.

---

# 20. Good Case: Admin can also use normal endpoint

```bash
curl -i "http://127.0.0.1:8080/v1/cache/get?key=test.name" \
-H "X-API-Key: ADMINAPIKEY123456789012345678901"
```

Expected:

```text
HTTP/1.1 200 OK
```

Admin is allowed everywhere.

---

# 21. Good Case: Set object value

```bash
curl -i -X POST http://127.0.0.1:8080/v1/cache/set \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"key":"feature.banner","value":{"enabled":true,"title":"Hello"},"ttl":300}'
```

Expected:

```text
HTTP/1.1 200 OK
```

---

# 22. Good Case: Get object value

```bash
curl -i "http://127.0.0.1:8080/v1/cache/get?key=feature.banner" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

Expected body contains:

```json
"enabled": true
"title": "Hello"
```

---

# 23. Bad Case: Set missing key

```bash
curl -i -X POST http://127.0.0.1:8080/v1/cache/set \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"value":"No key","ttl":300}'
```

Expected:

```text
HTTP/1.1 400 Bad Request
```

---

# 24. Bad Case: Set missing value

```bash
curl -i -X POST http://127.0.0.1:8080/v1/cache/set \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"key":"missing.value","ttl":300}'
```

Expected:

```text
HTTP/1.1 400 Bad Request
```

---

# 25. Bad Case: Set invalid TTL string

```bash
curl -i -X POST http://127.0.0.1:8080/v1/cache/set \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"key":"bad.ttl","value":"hello","ttl":"60"}'
```

Expected:

```text
HTTP/1.1 400 Bad Request
```

---

# 26. Bad Case: Set TTL too high

```bash
curl -i -X POST http://127.0.0.1:8080/v1/cache/set \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"key":"bad.ttl.high","value":"hello","ttl":999999999}'
```

Expected:

```text
HTTP/1.1 400 Bad Request
```

---

# 27. Bad Case: Set invalid key characters

```bash
curl -i -X POST http://127.0.0.1:8080/v1/cache/set \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"key":"bad key with spaces","value":"hello","ttl":60}'
```

Expected:

```text
HTTP/1.1 400 Bad Request
```

---

# 28. Bad Case: Malformed JSON

```bash
curl -i -X POST http://127.0.0.1:8080/v1/cache/set \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"key":"broken.json","value":"hello",'
```

Expected:

```text
HTTP/1.1 400 Bad Request
```

---

# 29. Bad Case: Wrong method for set

```bash
curl -i -X GET http://127.0.0.1:8080/v1/cache/set \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

Expected:

```text
HTTP/1.1 405 Method Not Allowed
```

---

# 30. Bad Case: Get missing key query param

```bash
curl -i http://127.0.0.1:8080/v1/cache/get \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

Expected:

```text
HTTP/1.1 400 Bad Request
```

---

# 31. Bad Case: Get non-existing key

```bash
curl -i "http://127.0.0.1:8080/v1/cache/get?key=no.such.key" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

Expected:

```text
HTTP/1.1 404 Not Found
```

---

# 32. Good Case: Delete existing key

First set it:

```bash
curl -i -X POST http://127.0.0.1:8080/v1/cache/set \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"key":"delete.me","value":"temporary","ttl":300}'
```

Then delete:

```bash
curl -i -X DELETE http://127.0.0.1:8080/v1/cache/delete \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"key":"delete.me"}'
```

Expected:

```json
"deleted": true
```

---

# 33. Good Case: Delete missing key

```bash
curl -i -X DELETE http://127.0.0.1:8080/v1/cache/delete \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"key":"already.missing"}'
```

Expected:

```text
HTTP/1.1 200 OK
```

Expected:

```json
"deleted": false
```

This is correct based on your TAD.

---

# 34. Bad Case: Delete missing key field

```bash
curl -i -X DELETE http://127.0.0.1:8080/v1/cache/delete \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{}'
```

Expected:

```text
HTTP/1.1 400 Bad Request
```

---

# 35. Good Case: Bulk set admin

```bash
curl -i -X POST http://127.0.0.1:8080/v1/admin/cache/bulk-set \
-H "Content-Type: application/json" \
-H "X-API-Key: ADMINAPIKEY123456789012345678901" \
-d '{
  "items": [
    {
      "key": "bulk.one",
      "value": "one",
      "ttl": 300
    },
    {
      "key": "bulk.two",
      "value": {
        "enabled": true
      },
      "ttl": 300
    }
  ]
}'
```

Expected:

```text
HTTP/1.1 200 OK
```

Expected:

```json
"requested": 2
"stored": 2
"skipped": 0
```

---

# 36. Verify bulk item one

```bash
curl -i "http://127.0.0.1:8080/v1/cache/get?key=bulk.one" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

Expected:

```json
"value": "one"
```

---

# 37. Verify bulk item two

```bash
curl -i "http://127.0.0.1:8080/v1/cache/get?key=bulk.two" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

Expected:

```json
"enabled": true
```

---

# 38. Bad Case: Bulk set with normal key

```bash
curl -i -X POST http://127.0.0.1:8080/v1/admin/cache/bulk-set \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"items":[]}'
```

Expected:

```text
HTTP/1.1 403 Forbidden
```

---

# 39. Bad Case: Bulk set invalid items

```bash
curl -i -X POST http://127.0.0.1:8080/v1/admin/cache/bulk-set \
-H "Content-Type: application/json" \
-H "X-API-Key: ADMINAPIKEY123456789012345678901" \
-d '{"items":"not-array"}'
```

Expected:

```text
HTTP/1.1 400 Bad Request
```

---

# 40. Mixed Case: Bulk set partial valid partial invalid

```bash
curl -i -X POST http://127.0.0.1:8080/v1/admin/cache/bulk-set \
-H "Content-Type: application/json" \
-H "X-API-Key: ADMINAPIKEY123456789012345678901" \
-d '{
  "items": [
    {
      "key": "bulk.valid",
      "value": "valid",
      "ttl": 300
    },
    {
      "key": "",
      "value": "bad"
    },
    {
      "key": "bulk.bad.ttl",
      "value": "bad",
      "ttl": "wrong"
    }
  ]
}'
```

Expected:

```text
HTTP/1.1 200 OK
```

Expected:

```json
"requested": 3
"stored": 1
"skipped": 2
```

---

# 41. Good Case: Purge selected

```bash
curl -i -X POST http://127.0.0.1:8080/v1/admin/cache/purge-selected \
-H "Content-Type: application/json" \
-H "X-API-Key: ADMINAPIKEY123456789012345678901" \
-d '{
  "keys": [
    "bulk.one",
    "bulk.two",
    "does.not.exist"
  ]
}'
```

Expected:

```text
HTTP/1.1 200 OK
```

Expected:

```json
"requested": 3
"removed": 2
"notFound": 1
```

---

# 42. Bad Case: Purge selected invalid keys

```bash
curl -i -X POST http://127.0.0.1:8080/v1/admin/cache/purge-selected \
-H "Content-Type: application/json" \
-H "X-API-Key: ADMINAPIKEY123456789012345678901" \
-d '{"keys":"not-array"}'
```

Expected:

```text
HTTP/1.1 400 Bad Request
```

---

# 43. Good Case: Purge all

```bash
curl -i -X POST http://127.0.0.1:8080/v1/admin/cache/purge-all \
-H "X-API-Key: ADMINAPIKEY123456789012345678901"
```

Expected:

```text
HTTP/1.1 200 OK
```

Expected body contains:

```json
"removed"
```

---

# 44. Verify list after purge all

```bash
curl -i http://127.0.0.1:8080/v1/admin/cache/list \
-H "X-API-Key: ADMINAPIKEY123456789012345678901"
```

Expected:

```json
"count": 0
```

or no live cache items.

---

# 45. Bad Case: Normal key cannot purge all

```bash
curl -i -X POST http://127.0.0.1:8080/v1/admin/cache/purge-all \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

Expected:

```text
HTTP/1.1 403 Forbidden
```

---

# 46. TTL expiry test

Set short TTL:

```bash
curl -i -X POST http://127.0.0.1:8080/v1/cache/set \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"key":"ttl.short","value":"expires soon","ttl":2}'
```

Immediately get:

```bash
curl -i "http://127.0.0.1:8080/v1/cache/get?key=ttl.short" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

Expected:

```text
HTTP/1.1 200 OK
```

Wait 3 seconds:

```bash
sleep 3
```

Get again:

```bash
curl -i "http://127.0.0.1:8080/v1/cache/get?key=ttl.short" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

Expected:

```text
HTTP/1.1 404 Not Found
```

---

# 47. Unknown route

```bash
curl -i http://127.0.0.1:8080/v1/unknown \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

Expected:

```text
HTTP/1.1 404 Not Found
```

---

# 48. Restart server

```bash
./scripts/restart.sh
```

Expected:

```text
Cache server stopped
Cache server started on http://127.0.0.1:8080 with PID <new_pid>
```

---

# 49. Verify memory resets after restart

Try getting old key:

```bash
curl -i "http://127.0.0.1:8080/v1/cache/get?key=test.name" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

Expected:

```text
HTTP/1.1 404 Not Found
```

Because memory resets on restart.

Bootstrap item may still reload.

---

# 50. Stop server

```bash
./scripts/stop.sh
```

Expected:

```text
Cache server stopped
```

---

# 51. Verify server stopped

```bash
curl -i http://127.0.0.1:8080/v1/admin/cache/health \
-H "X-API-Key: ADMINAPIKEY123456789012345678901"
```

Expected:

```text
curl: (7) Failed to connect
```

---

# Best short test sequence

For quick confidence, run this:

```bash
./scripts/stop.sh
./scripts/start.sh

curl -i http://127.0.0.1:8080/v1/admin/cache/health \
-H "X-API-Key: ADMINAPIKEY123456789012345678901"

curl -i -X POST http://127.0.0.1:8080/v1/cache/set \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"key":"quick.test","value":"works","ttl":60}'

curl -i "http://127.0.0.1:8080/v1/cache/get?key=quick.test" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"

curl -i -X DELETE http://127.0.0.1:8080/v1/cache/delete \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"key":"quick.test"}'

curl -i "http://127.0.0.1:8080/v1/cache/get?key=quick.test" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"

./scripts/stop.sh
```

Expected flow:

```text
health 200
set 200
get 200
delete 200 deleted true
get 404
stop success
```
