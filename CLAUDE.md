# Courier War project context

Read this file first when resuming work. It is the short project map; open the linked `docs/` files only when the task needs that detail. Treat current source and configuration as the implementation truth. Older plans often describe an earlier phase.

## Project summary

Courier War is a browser game for two players: the Courier navigates an isometric city and delivers a package; the Saboteur places obstacles and delays the delivery. The main application lives in `courier-war-game/`. Its frontend and PHP API are connected and include account/guest flows, profile and stats, role/difficulty matchmaking, generated maps, match polling and actions, draw/forfeit, and result screens. Gameplay state is intended to be backend authoritative; Phaser renders the map and submits player actions.

The repository also contains a separate Phaser prototype (`courier-war-poc/`) and a standalone PHP in-memory cache server (`SimpleCachingServer/`). They are not the main app. See [docs/prototypes-and-history.md](docs/prototypes-and-history.md) before changing either.

## Stack

- Frontend: TypeScript 6, Vite 8, Phaser 4, HTML templates imported as raw strings, and page-scoped CSS. No frontend framework or router package.
- Main backend: plain PHP 8+, custom HTTP request/router/controller/service layers, manual `require_once` loading, PDO/MySQL persistence, and the separate cache server for sessions and live match state.
- Database: MySQL 8+; schemas are SQL files under `courier-war-game/backend/schema/`.
- Local orchestration: Bash scripts under `courier-war-game/scripts/`; frontend `/api` requests are proxied to PHP at `127.0.0.1:8000` by Vite.
- The main frontend package defines `dev`, `build`, `test`, and `preview`; `npm test` uses Node's built-in test runner.

## Important boundaries

- Work in `courier-war-game/` for the product unless the task explicitly names the prototype or cache service.
- The backend generates and validates official maps and owns match state/rules. The frontend V7 map generation and gameplay rules are useful for prototype/debug and hover prediction; do not make them authoritative for a match.
- Keep API payloads aligned between PHP response builders and `frontend/src/common/apiType/`. Mutating authenticated requests use the shared API client for cookies, CSRF, and idempotency headers.
- Check `git status` before edits and preserve existing local changes. Do not assume an older plan is more current than code.
- The main app now has targeted polling/version and timeout regression tests, but broad auth, matchmaking, action-rule, and visual gameplay coverage remains incomplete. The cache service has its own PHPUnit suite. Record unverified behavior as unverified; do not imply it passed.

## Code style and naming

- Follow nearby code. TypeScript files/classes/types use `PascalCase`; functions, variables, and config objects use `camelCase`; folders are generally lowercase or `lowerCamelCase`. Use explicit types and type-only imports where appropriate. Existing TS uses double quotes and two-space indentation.
- PHP classes and filenames use `PascalCase`; methods and variables use `camelCase`; class constants use `UPPER_SNAKE_CASE`. Keep `declare(strict_types=1);`, typed parameters/returns, and four-space indentation in PHP files. Existing PHP uses single-quoted strings where practical.
- Keep responsibilities in their existing layers: API wrappers/controllers validate boundaries; services hold business rules; config/constants hold tunable values; map generation, runtime state, input, and rendering remain separate.
- There is no configured formatter or linter. Do not reformat large files without a task-specific reason.

## Current gaps to keep in view

- Main app behavior is not covered by a checked-in test suite. Core end-to-end and edge-case scenarios remain unverified; see [docs/known-issues-and-validation.md](docs/known-issues-and-validation.md).
- Some home/navigation sections still show a prototype-unavailable message. The repo has no production deployment guide or environment example; local startup defaults are for development only.
- The cache service stores values in process memory. Restarting it loses sessions, waiting queues, bootstrap maps, and active match state.
- `README.md` is only a short project label; `GameDesignDocument.md` is empty. Some implementation plans and prototype notes are historical and can conflict with the shipped code.

## Context index

- [docs/architecture.md](docs/architecture.md): app layout, request flow, API surface, persistence, and service boundaries.
- [docs/gameplay-and-map.md](docs/gameplay-and-map.md): current roles/rules, map pipeline, payload, and where tuning values live.
- [docs/development-and-testing.md](docs/development-and-testing.md): local prerequisites, start commands, config, and existing checks.
- [docs/known-issues-and-validation.md](docs/known-issues-and-validation.md): confirmed gaps, next TODOs, and unfinished scenarios.
- [docs/prototypes-and-history.md](docs/prototypes-and-history.md): V7/V8 POC, standalone cache service, and which old documents are historical.

When the implementation changes, update the relevant context file in the same task. Keep this file concise and link to details rather than copying them here.
