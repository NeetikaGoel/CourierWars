How to run

From Project/Backend:

./scripts/start.sh

Stop:

./scripts/stop.sh

Restart:

./scripts/restart.sh

Check log:

tail -f logs/cache-server.log

Check process:

cat run/cache-server.pid


```bash
./scripts/stop.sh
./scripts/start.sh
```



From `Project/Backend`, run these checks.

## 1. Check PHP syntax first

```bash
find . -name "*.php" -not -path "./vendor/*" -exec php -l {} \;
```

Every file should say:

```text
No syntax errors detected
```

---

## 2. Start server

```bash
chmod +x scripts/start.sh scripts/stop.sh scripts/restart.sh
./scripts/start.sh
```

Then check:

```bash
cat run/cache-server.pid
tail -f logs/cache-server.log
```

---

## 3. Test auth failure

```bash
curl -i http://127.0.0.1:8080/v1/admin/cache/health
```

Expected:

```text
401 Unauthorized
```

---

## 4. Test health with admin key

```bash
curl -i http://127.0.0.1:8080/v1/admin/cache/health \
-H "X-API-Key: ADMINAPIKEY123456789012345678901"
```

Expected JSON:

```json
{
  "success": true,
  "message": "Cache server health fetched",
  "data": {
    "status": "ok"
  }
}
```

---

## 5. Set cache value

```bash
curl -i -X POST http://127.0.0.1:8080/v1/cache/set \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"key":"test.name","value":"Neetika","ttl":60}'
```

Expected:

```json
"success": true
```

---

## 6. Get cache value

```bash
curl -i "http://127.0.0.1:8080/v1/cache/get?key=test.name" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

Expected value:

```json
"value": "Neetika"
```

---

## 7. Delete cache value

```bash
curl -i -X DELETE http://127.0.0.1:8080/v1/cache/delete \
-H "Content-Type: application/json" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890" \
-d '{"key":"test.name"}'
```

Expected:

```json
"deleted": true
```

---

## 8. Try getting deleted key

```bash
curl -i "http://127.0.0.1:8080/v1/cache/get?key=test.name" \
-H "X-API-Key: NORMALAPIKEY12345678901234567890"
```

Expected:

```text
404
```

---

## 9. Stop server

```bash
./scripts/stop.sh
```

One warning: if `set` works but `get` does not retain value, that means PHP built-in server is rebuilding memory per request. Then we’ll need to adjust runtime model.

