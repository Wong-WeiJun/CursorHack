# Duely — never miss a deadline

A deadline and task tracker built for the reality of student life. Duely pulls
every assignment, club task, campus event, and reminder into one place and
sorts it by **what needs you first** — not just alphabetically or by a date
buried in a table.

Built for the Cursor Hackathon.

---

## The problem

Students don't miss deadlines because they don't care — they miss them because
their deadlines are scattered across the syllabus, group chats, club emails, and
sticky notes. Generic to-do apps make it worse: a flat, alphabetized list treats
"lab report due in 2 hours" the same as "reading due next month." Duely answers
the only question that matters at 11pm: *what needs me right now?*

## Features

- **Urgency-first design** — every task is color-coded by time remaining
  (overdue → due soon → today → this week → later), with a banner that surfaces
  what's due today.
- **Organized by student life** — group tasks into **Class, Club, Campus,
  Friends, Personal**, each with a free-text label (e.g. `CS101`, `Chess Club`).
- **Week view** — tasks auto-group into Today / Tomorrow / This Week / Later.
- **The essentials, done well** — create, edit, complete, delete, notes, search,
  filter (area/label), and sort (due date / priority). Loading, empty, and error
  states everywhere.
- **Share your list** — generate a read-only public link for a study partner or
  group. No account needed to view.
- **Email reminders** — one click emails you everything due in the next 24 hours
  (via Resend).
- **A dashboard that motivates** — friendly greeting, live stats (overdue / due
  today / this week / completed), progress bars per subject, and a by-area
  breakdown.

## Who it's for

Every student — high-schoolers, university students, bootcampers, and online
learners — juggling coursework alongside clubs, campus life, work, and friends.

---

## Tech stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI, SQLModel, Alembic, PostgreSQL (Neon) |
| Frontend | React 19, TanStack Router/Query, shadcn/ui, Tailwind v4 |
| Auth | JWT (PyJWT + pwdlib argon2) |
| Email | Resend (HTTP API) |
| Tooling | uv, bun, Docker Compose |
| Deploy | Vercel (frontend) · Render (backend) · Neon (database) |

The frontend talks to the backend through a **type-safe, auto-generated API
client** — change a SQLModel model, run `make generate-client`, and the
TypeScript types update everywhere.

## Architecture

```
┌──────────────┐     ┌─────────────────────┐     ┌─────────────┐
│   Vercel     │────▶│   Render            │────▶│   Neon      │
│  (React SPA) │     │  (FastAPI + Alembic)│     │  (Postgres) │
└──────────────┘     └─────────────────────┘     └─────────────┘
```

## Quickstart (local)

```bash
# 1. Set up env
make env            # copies .env.example → .env, then fill in your values

# 2. Start the full stack (Docker)
make dev

# Or run each side locally:
make dev-backend    # FastAPI on http://localhost:8000  (docs at /docs)
make dev-frontend   # Vite on   http://localhost:5173
```

## Common commands

```bash
make test              # run backend tests (pytest)
make lint              # ruff + biome
make migrate           # alembic upgrade head
make migration         # create a new migration (prompts for name)
make generate-client   # regenerate the frontend API client from OpenAPI
```

## Data model

A single `Task` owned by a user:

| Field | Notes |
|-------|-------|
| `title` | required |
| `category` | `class` · `club` · `campus` · `social` · `personal` |
| `subject` | free-text label within an area |
| `notes` | optional details |
| `due_date` | timezone-aware |
| `priority` | `high` · `medium` · `low` |
| `is_done` | complete / undo |

Sharing is a rotating `share_token` on the user; a public
`GET /tasks/share/{token}` returns that user's tasks read-only.

## Deployment

Deploy free on Vercel + Render + Neon — see [DEPLOY.md](DEPLOY.md) for the full
step-by-step (env vars, Neon SSL/driver notes, and the CORS wiring).

## Built with Cursor

The whole loop for each feature — SQLModel model → Alembic migration → FastAPI
route *with pytest tests* → client regen → React page with every state handled —
was built agentically in Cursor. The result isn't just generated code, but a
coherent, deployable product assembled at hackathon speed.
