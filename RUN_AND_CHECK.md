# Run and Check Courier War

Use this page when you want to start the game or quickly find which service is failing. Commands below assume Windows with Git Bash, as in the project terminal. Run them from the repository root unless a command says otherwise.

If the terminal is not already at the repository root, start here:

```bash
cd "/d/Neetika Folder/Neetika Folder/IGDTUW/Semester 8/SCOPELY/courier war/courier-wars"
```

## One-time setup

Install Git for Windows (Git Bash), PHP 8+ with `pdo_mysql`, Node.js/npm, and MySQL 8+ with its command-line client. MySQL must be installed as a Windows service. `start-all.sh` attempts to start a single matching MySQL/MariaDB service when the database is stopped; Windows may require you to start it yourself from **Services** (`Win+R`, enter `services.msc`).

The script uses the database defaults in `courier-war-game/backend/config/DatabaseConfig.php`. If your MySQL login differs, set its values in the Git Bash window before startup; the password is not saved to this guide or the repository:

```bash
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_NAME=courier_war
export DB_USERNAME=root
export DB_PASSWORD='YOUR_MYSQL_PASSWORD'
```

`DB_NAME` must be `courier_war`, because that is the database named by the included schema files. The startup script securely passes the password to the MySQL client using a temporary file and deletes that file when it exits.

## Start everything

From the repository root in Git Bash, run this one command:

```bash
bash courier-war-game/scripts/start-all.sh
```

Keep that Git Bash window open. It prints each step, checks/starts MySQL, safely creates any missing database/tables, starts/checks the cache on port `8080`, bootstraps a map, starts and health-checks the PHP API on `8000`, installs frontend packages if they are missing, then starts Vite on `5173` and opens the game in your browser. Existing tables and data are preserved; the SQL uses `CREATE ... IF NOT EXISTS`. If the browser does not open automatically, visit <http://127.0.0.1:5173/>.

Press **Ctrl+C** to stop the frontend and PHP API. The cache service stays running so another launch can reuse it. MySQL is not stopped by the script.

For a first full game check, use two separate browser sessions (for example, a regular window and an incognito window), sign in as two players, and start a match. The health endpoint alone confirms that PHP responds; it does not confirm MySQL or cache connectivity.

## Check each service

Open a second Git Bash window at the repository root and run:

```bash
# MySQL and required PHP extension (the CLI prompts for the password)
mysqladmin -h 127.0.0.1 -P 3306 -u root -p ping
php -m | grep -i pdo_mysql

# Listening ports: MySQL 3306, cache 8080, API 8000, Vite 5173
netstat -ano | grep -E ':(3306|8080|8000|5173).*LISTENING'

# PHP API responds
curl -fsS http://127.0.0.1:8000/api/v1/health

# Vite serves the app and proxies API requests to PHP
curl -fsS http://127.0.0.1:5173/ >/dev/null && echo "frontend OK"
curl -fsS http://127.0.0.1:5173/api/v1/health
curl -fsS 'http://127.0.0.1:5173/api/v1/maps/preview?seed=20260531' | \
  php -r '$p=json_decode(stream_get_contents(STDIN), true); $m=$p["data"]??[]; if (($p["success"]??false)!==true || ($m["widthTiles"]??0)!==96 || ($m["heightTiles"]??0)!==96) { fwrite(STDERR, "map preview failed\n"); exit(1); } echo "map preview OK: " . $m["widthTiles"] . "x" . $m["heightTiles"] . ", signals=" . count($m["trafficSignalList"]??[]) . PHP_EOL;'

# Cache API responds (HTTP 200 or 404 for a missing key both mean it is reachable)
CACHE_SERVER_API_KEY="${CACHE_SERVER_API_KEY:-NORMALAPIKEY12345678901234567890}"
curl -sS -i -H "X-API-Key: $CACHE_SERVER_API_KEY" \
  'http://127.0.0.1:8080/v1/cache/get?key=cw:health:backend-ping'

# Database and schema are present
mysql -h 127.0.0.1 -P 3306 -u root -p -e "SHOW TABLES FROM courier_war;"
```

Expected checks: PHP health returns JSON with `status: ok`; the proxied health request returns the same API response; Vite prints `frontend OK`; MySQL lists `cw_users`, `cw_user_stats`, and `cw_match_history`; the cache request returns HTTP `200` or `404`, not a connection error or `401`.

## Run tests and build

From the repository root:

```bash
(cd courier-war-game/frontend && npm test && npm run build)
(cd courier-war-game/backend && php tests/run.php)
```

To syntax-check every main-backend PHP file:

```bash
cd courier-war-game
find backend -name '*.php' -print0 | xargs -0 -n1 php -l
cd ..
```

To check deterministic backend map generation without starting the services:

```bash
cd courier-war-game
php -r 'require_once "backend/map/generation/CityMapGenerationBuilder.php"; $builder = new CityMapGenerationBuilder(); $map = $builder->cityMapGenerate(20260531); echo "map ok " . $map["widthTiles"] . "x" . $map["heightTiles"] . " signals=" . count($map["trafficSignalList"]) . PHP_EOL;'
cd ..
```

## If something fails

| Symptom | Check / action |
| --- | --- |
| MySQL cannot be reached or started | Start the MySQL service in Windows Services. Confirm port `3306`, then retry `mysqladmin` above. Starting a Windows service may require an Administrator terminal. |
| Login, registration, or profile fails while health works | Health does not check the database. Confirm all three schemas exist and that the `DB_*` environment values match your MySQL account in the shell that starts the backend. |
| `start-all.sh` says the cache is not ready | Check port `8080` and `SimpleCachingServer/Project/Backend/logs/cache-server.log`. Start it separately with `cd courier-war-game && bash scripts/start-cache-server.sh`, then retry the cache check. |
| Cache check returns `401` | The `X-API-Key` does not match the local cache server key. Use the same `CACHE_SERVER_API_KEY` value for both services. |
| API health fails / port `8000` is closed | In a separate Git Bash window, run `cd courier-war-game && bash scripts/start-backend.sh`; check the terminal for PHP errors. |
| Frontend opens but `/api/v1/health` fails | Confirm the API health check succeeds on port `8000`; Vite proxies `/api` to that address. |
| Port is already in use | Use the `netstat` output to identify the listener. Stop the old app instance before starting another. |
| Map bootstrap fails | Confirm the cache check succeeds, then from `courier-war-game` run `php backend/scripts/bootstrap-cache.php 1`. |

The cache is in memory. Restarting it clears sessions, queued matches, maps, and active matches; run `start-all.sh` again so it bootstraps a fresh map.
