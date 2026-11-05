# SimpleCachingServer

## Mandatory: verify and validate every change
Every change here is followed by a verification and validation step **before you report the task as done**. The rule is the same as in the root `CLAUDE.md`:
1. Re-check each requirement in the prompt and confirm it is met.
2. Run the checks below and fix anything you broke.
3. Report which checks ran, their results, and anything you skipped and why.

Checks (run from `Project/Backend/`):
- **Syntax:** `php -l` on each changed PHP file.
- **Unit tests:** `vendor/bin/phpunit`. First confirm `scripts/dependencies.sh --check-dev` exits 0. If it doesn't, the test tooling is missing: run `scripts/dependencies.sh` (it needs sudo and a TTY, so ask the user to run it with `!`), and report the tests as not run rather than passed. A new class under test needs a `require_once` in `tests/LoadFiles.php`.
- **Runtime:** for anything touching the server, routing, controllers, auth or cache behaviour, restart with `scripts/restart.sh`. Then:
  - `GET /v1/admin/cache/health` with the admin `X-API-Key` (keys are in `config/auth.php`) returns 200 `status: ok`.
  - Exercise the changed endpoint(s) with `curl`, including at least one error case. Clean up any test keys afterwards.
- **Scripts:** `bash -n` on each changed script, then run it.
- **Logs:** check `logs/cache-server.log` for new ERROR entries after the run.

## Repo map
Start every task here from the repo map below. It routes each kind of task to an area doc in `context/areas/`. Open that doc before reading code.

@context/REPO_MAP.md
