# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FastSkeleton — a full-stack FastAPI + React template (forked from fastapi/full-stack-fastapi-template), streamlined for solo projects and hackathons.

| Layer | Tech |
|-------|------|
| Backend | FastAPI, SQLModel, Alembic, PostgreSQL |
| Frontend | React 19, TanStack Router/Query/Table, shadcn/ui, Tailwind v4 |
| Auth | JWT (PyJWT + pwdlib argon2) |
| Dev | Docker Compose, uv, bun |
| CI | GitHub Actions (ci, deploy, pre-commit) |

## Common Commands

### Development

```bash
make dev              # Start full stack via docker compose watch
make dev-backend      # Run backend locally: cd backend && uv run fastapi run --reload app/main.py
make dev-frontend     # Run frontend locally: cd frontend && bun run dev
```

Services available after `make dev`:
- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs
- Adminer (DB UI): http://localhost:8080
- Mailcatcher: http://localhost:1080

### Testing

```bash
make test             # Run backend pytest (via Docker)
make test-backend     # Same — spins up DB + mailcatcher, runs pytest, tears down
make test-frontend    # Build images and run Playwright E2E tests
```

Run a single backend test: `cd backend && uv run pytest tests/api/routes/test_login.py -k test_access_token -v`

Run backend tests against running stack: `docker compose exec backend bash scripts/tests-start.sh -x`

### Linting & Formatting

```bash
make lint             # Run all linters
make lint-backend     # ruff check + ruff format --check
make lint-fix-backend # ruff check --fix + ruff format
make lint-frontend    # biome check --write
```

Root `package.json` also exposes: `bun run lint`, `bun run test`, `bun run test:ui`

### Database

```bash
make migrate          # alembic upgrade head (run from backend/)
make migration        # Prompt for name, then alembic revision --autogenerate
make reset-db         # Drop volumes, recreate, run migrations
make seed             # Run initial_data.py
```

### Utilities

```bash
make generate-client  # Regenerate frontend API client from backend OpenAPI schema
make clean            # Stop containers + remove volumes
make logs             # Tail docker compose logs
make env              # Copy .env.example → .env (first-time setup)
```

## Backend Architecture

### Entry Point

`backend/app/main.py` creates the FastAPI app, wires CORS, and mounts `api_router` at `/api/v1`.

### Layer Structure

| File/Dir | Role |
|----------|------|
| `app/api/main.py` | Aggregates all route routers into `api_router` |
| `app/api/routes/` | Individual route modules (login, users, utils, private) |
| `app/api/deps.py` | FastAPI dependencies: `SessionDep`, `CurrentUser`, `TokenDep`, `get_current_active_superuser` |
| `app/models.py` | SQLModel models. Pattern: `UserBase` → `UserCreate` / `UserUpdate` / `UserPublic` + `User` (table=True) |
| `app/crud.py` | Data access functions (create_user, update_user, get_user_by_email, authenticate) |
| `app/core/config.py` | Pydantic-settings `Settings` class; reads from root `.env` |
| `app/core/db.py` | SQLAlchemy engine + `init_db()` (creates first superuser if missing) |
| `app/core/security.py` | JWT token creation, password hashing/verification (Argon2 + bcrypt via pwdlib) |
| `app/utils.py` | Email helpers, password reset tokens |

### Auth Flow

Login uses OAuth2 password form → `crud.authenticate()` → JWT signed with `SECRET_KEY`. The token is passed as a Bearer header. `deps.py` decodes it via `get_current_user`.

`crud.authenticate()` includes timing-attack protection: even when the user is not found, it still runs `verify_password()` against a `DUMMY_HASH` so response times are comparable.

### Testing

Tests live in `backend/tests/`. `conftest.py` provides session-scoped fixtures:
- `db` — SQLModel Session, cleans `User` table after session
- `client` — FastAPI TestClient
- `superuser_token_headers` / `normal_user_token_headers` — auth headers for API tests

When the Docker stack is already running, use `docker compose exec backend bash scripts/tests-start.sh [pytest-args]`.

## Frontend Architecture

### Entry Point

`frontend/src/main.tsx` bootstraps the React app with:
- TanStack Query (React Query) with global error handling (401/403 → redirect to `/login`)
- TanStack Router with file-based routing
- Theme provider (dark mode default)
- OpenAPI client configured with `VITE_API_URL`

### Key Directories

| Directory | Role |
|-----------|------|
| `src/routes/` | TanStack Router file-based routes. `__root.tsx` = root layout, `_layout.tsx` = nested layout, `_layout/` = child pages. `routeTree.gen.ts` is auto-generated — never edit manually. |
| `src/client/` | Auto-generated OpenAPI client via `@hey-api/openapi-ts`. `sdk.gen.ts` has service classes (`LoginService`, `UsersService`), `types.gen.ts` has schemas. |
| `src/hooks/` | Custom hooks; `useAuth.ts` is the main auth hook (TanStack Query + mutations for login/signup/logout) |
| `src/components/ui/` | shadcn/ui components (generated, excluded from biome linting) |
| `src/components/` | App-specific components (Admin, Common, Sidebar, UserSettings, theme-provider) |

### API Client Generation

The frontend client is generated from the backend OpenAPI schema:

1. Backend exports its OpenAPI JSON: `python -c "import app.main; print(json.dumps(app.main.app.openapi()))"`
2. `@hey-api/openapi-ts` consumes `frontend/openapi.json` and outputs to `frontend/src/client/`
3. Config in `frontend/openapi-ts.config.ts` — uses `legacy/axios` plugin, services as classes (`{{name}}Service`)

Regenerate via `make generate-client`. The pre-commit hook also regenerates it automatically when backend files change.

### Auth on Frontend

JWT token stored in `localStorage` as `access_token`. `OpenAPI.TOKEN` reads it for every request. `useAuth` provides `loginMutation`, `signUpMutation`, `logout`, and `user` query. On 401/403, the global query/mutation error handler clears the token and redirects to `/login`.

## Environment & Configuration

Configuration lives in a single root `.env` file (copied from `.env.example` via `make env`). Key variables:

- `PROJECT_NAME`, `STACK_NAME` — app identity
- `DOMAIN`, `FRONTEND_HOST` — routing
- `SECRET_KEY` — JWT signing (generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- `FIRST_SUPERUSER`, `FIRST_SUPERUSER_PASSWORD` — auto-created admin
- `POSTGRES_*` — database connection
- `SMTP_*` — email (optional; leave blank to disable)
- `DOCKER_IMAGE_BACKEND`, `DOCKER_IMAGE_FRONTEND` — Docker image names

Backend `Settings` (pydantic-settings) reads `.env` from the repo root (`../.env` relative to `backend/`).

## Pre-commit Hooks

The project uses `prek` (not `pre-commit`) as the hook runner. Install hooks:

```bash
cd backend && uv run prek install -f
```

Hooks run: large-file check, toml/yaml checks, trailing whitespace, ruff check + format, biome check, mypy, ty, frontend SDK regeneration, and zizmor (GitHub workflow security).

Run manually: `uv run prek run --all-files`

## Docker Compose

- `compose.yml` — base production-like stack (DB, backend, frontend, Adminer, prestart)
- `compose.override.yml` — dev overrides (volume mounts, watch mode, local Traefik, mailcatcher, playwright)
- `compose.traefik.yml` — standalone Traefik for production-like local testing with subdomains

The external `traefik-public` network is expected. Create it with `docker network create traefik-public` if missing.

## Important Patterns

### Backend Model Pattern
Every entity follows this SQLModel pattern (see `app/models.py`):
- `UserBase` — shared fields
- `UserCreate` / `UserUpdate` / `UserUpdateMe` — API input schemas
- `UserPublic` — API output schema
- `User(UserBase, table=True)` — database table

### Adding a New API Endpoint
1. Add route in `app/api/routes/<new>.py`
2. Register router in `app/api/main.py`
3. Run `make generate-client` to update frontend types
4. Frontend can import the new service from `src/client`

### Database Migrations
Alembic is configured with `backend/alembic.ini`. Models in `app/models.py` are auto-imported for `alembic revision --autogenerate`. The `prestart` service runs `alembic upgrade head` before the backend starts.

### CI/CD

Three workflows in `.github/workflows/`:
- `ci.yml` — lint + test on push/PR to `main`
- `pre-commit.yml` — runs pre-commit hooks on PRs

Deploy recipes are in `.github/deploy-recipes/` (AWS ECS, Fly, Railway, Render, VPS+SSH). The `deploy.yml` workflow was removed in this fork; deployment is manual or via chosen recipe.

## Linting Rules

- **Backend**: ruff with `target-version = "py310"`. Selected rules: E, W, F, I, B, C4, UP, ARG001, T201. Ignored: E501, B008, W191, B904. Strict mypy enabled.
- **Frontend**: biome with 2-space indentation, double quotes, semicolons as needed. Tailwind CSS directives parsed. Generated files (`src/client/`, `src/routeTree.gen.ts`, `src/components/ui/`) are excluded.
