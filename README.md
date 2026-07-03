# FastSkeleton

Personal fork of [fastapi/full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template), cleaned up for solo projects and hackathons.

## Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI, SQLModel, Alembic, PostgreSQL |
| Frontend | React 19, TanStack Router/Query/Table, shadcn/ui, Tailwind v4 |
| Auth | JWT (PyJWT + pwdlib argon2) |
| Dev | Docker Compose, uv, bun |
| CI | GitHub Actions (ci, deploy, pre-commit) |

## Quickstart

```bash
# 1. Clone and set up env
git clone <your-repo>
make env          # copies .env.example → .env, then fill in your values

# 2. Start the full stack
make dev

# 3. Open
#   API docs:  http://localhost:8000/docs
#   Frontend:  http://localhost:5173
#   Adminer:   http://localhost:8080
```

## Common commands

```bash
make test           # run backend tests
make lint           # ruff + biome
make migrate        # alembic upgrade head
make migration      # create a new migration (prompts for name)
make reset-db       # wipe and re-migrate (local only)
make generate-client  # regenerate frontend API client from OpenAPI schema
make clean          # stop containers + remove volumes
```

## GitHub Actions

Three workflows — nothing more:

| Workflow | Trigger | Does |
|----------|---------|------|
| `ci.yml` | push/PR to `main` | lint backend+frontend, run tests, smoke test |
| `deploy.yml` | manual or on release | build + push to ECR, deploy to ECS |
| `pre-commit.yml` | PR | runs pre-commit hooks |

### Secrets needed for deploy

| Secret | Description |
|--------|-------------|
| `AWS_ACCOUNT_ID` | Your AWS account ID |
| `AWS_ROLE_ARN` | IAM role ARN for OIDC (no long-lived keys) |
| `ECR_REPO_BACKEND` | ECR repo name for backend image |
| `ECR_REPO_FRONTEND` | ECR repo name for frontend image |
| `VITE_API_URL` | Production API URL passed to frontend build |
| `ECS_CLUSTER` | ECS cluster name (if using Fargate) |
| `ECS_SERVICE_BACKEND` | ECS service name for backend |
| `ECS_SERVICE_FRONTEND` | ECS service name for frontend |

> **OIDC setup:** Add a GitHub OIDC identity provider to your AWS account and attach a role — no `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` needed in secrets.

## What changed from upstream

- **GitHub Actions:** removed 8 org-specific workflows (`add-to-project`, `issue-manager`, `latest-changes`, `smokeshow`, `labeler`, `guard-dependencies`, `detect-conflicts`, `zizmor`). Deploy workflows replaced with ECR+ECS flow on GitHub-hosted runners. Pre-commit simplified (no auto-push, no `PRE_COMMIT` token secret needed).
- **Branch:** all `master` references changed to `main`.
- **Makefile:** added top-level task runner.
- **`.env.example`:** replaces the committed `.env` with a proper example file. No `changethis` defaults.
- **Copier scaffolding:** `.copier/` and `copier.yml` deleted (template generation tooling, not needed in a fork).
- **Coverage gate:** removed `--fail-under=90` from CI (add it back once you have meaningful coverage).

## Customising for a new project

1. Rename `Item`/`items` throughout `backend/app/` to your domain model
2. Update `PROJECT_NAME` in `.env`
3. Update `AWS_REGION` and repo names in `deploy.yml`
4. Delete `backend/app/alembic/versions/` migrations and start fresh with `make migration`
