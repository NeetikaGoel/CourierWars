# CourierWars

## Mandatory: verify and validate every change
Every change to this repo (code, config, scripts, docs, Claude config) is followed by a verification and validation step **before you report the task as done**. This applies whatever size the change is.

1. **Validate against the prompt.** Go back to the request and check each requirement. Confirm it's satisfied, or say plainly that it isn't and why.
2. **Verify the project still works.** Run the checks that fit what you changed (see the table below) and fix anything you broke. Work isn't done while a check you could run still fails.
3. **Report the evidence.** Say which checks you ran and what they returned (pass/fail and the key output). Also say which checks you skipped or couldn't run, and why. Never claim something was verified when it wasn't.

| Changed | Minimum checks |
|---|---|
| Game backend PHP (`courier-war-game/backend/`) | `php -l` on each changed file, and confirm every `require_once` path resolves with exact case (Linux is case-sensitive). If the backend is running, `curl -s 127.0.0.1:8000/api/v1/health` and the affected endpoints. Auth/DB changes also need `bash courier-war-game/scripts/setup-database.sh --check` (exit 0) and a guest sign-in (`POST /api/v1/auth/guest`). Map-generation changes: the `cityMapGenerate` one-liner in `courier-war-game/planv1.md`. |
| Game frontend (`courier-war-game/frontend/`) | `cd courier-war-game/frontend && npx tsc --noEmit` and `npm run build`. For UI or gameplay changes, also run the app and exercise the change. |
| Run scripts (`*.sh`) | `bash -n <script>`, then run it or the flow it belongs to and confirm processes and ports come up. Interactive scripts: test `--check`, the no-TTY path and a declined-prompt run. |
| New or moved files | `git status` shows them. The `.gitignore` is the Visual Studio template and can silently hide files (`git check-ignore -v <path>`). |
| SimpleCachingServer | See `SimpleCachingServer/CLAUDE.md`. |
| Docs / repo maps / `context/` | Every path and command mentioned exists or works as written. Statements match the current code. |
| Claude config (`CLAUDE.md`, `.claude/settings.json`, hooks) | JSON parses (`jq .`). Hook scripts run against sample input and give the expected output. |

## Repo map
Before any task in this repo, use the repo map below to find the right area doc in `context/areas/`, and open that doc before reading code.

For anything about SimpleCachingServer, such as the cache server itself, its endpoints, TTLs, API keys or start and stop scripts, use `SimpleCachingServer/context/REPO_MAP.md` and its `SimpleCachingServer/context/areas/` docs instead. The root map only covers how the game talks to the cache server.

@context/REPO_MAP.md
