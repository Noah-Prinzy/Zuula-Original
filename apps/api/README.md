# Zuula API (P2 skeleton)

FastAPI implementation of `openapi.yaml` — the core web-app API (`/api/v1/*`) and the
public partner API (`/v1/*`, matching the `/developers` docs). Every operation in the
contract has a route here returning schema-shaped stub data. There is still no database and
no real auth, but submissions now run through a real Celery pipeline with live SSE progress
(see [`docs/adr/0001-api-architecture.md`](../../docs/adr/0001-api-architecture.md) for
what's stubbed and why, and what "real" means here).

## Run it

```bash
cd apps/api
python3.12 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env

# PostgreSQL 16 with pgvector (P3). `docker compose up -d postgres` gives you one.
alembic upgrade head          # create/upgrade the schema
python -m app.db.seed         # load the sample data (empty database only)

uvicorn app.main:app --reload
```

Or via Docker Compose (`api` + `worker` + `redis` + `postgres` with pgvector, and a one-shot
`migrate` service that runs `alembic upgrade head` before the other two start):

```bash
docker compose up --build
```

> Registry access to pull `python:3.12-slim` / `redis:7-alpine` / `postgres:16-alpine` was
> blocked by this sandbox's network egress policy, so `docker compose up` is validated here
> only via `docker compose config -q` (structural) — please confirm a real `up` on a machine
> or CI runner with normal registry access.

Once running: `GET /healthz` and `GET /readyz` are liveness/readiness probes (deliberately
outside the OpenAPI contract). Interactive docs are at `/docs` (FastAPI's default Swagger UI,
generated from the route signatures — **not** the same document as `openapi.yaml`; see
"Two OpenAPI documents" below).

## Test

```bash
ruff check .
pytest tests/ -q        # tests/db/ needs PostgreSQL + pgvector: see "Database" below
```

`tests/contract/test_openapi_contract.py` is the important one: it wraps the whole app in
[`openapi-core`](https://github.com/python-openapi/openapi-core)'s `FastAPIOpenAPIMiddleware`
and exercises essentially every operation in `openapi.yaml`, asserting both the request and
the response validate against the spec — including a real `POST /api/v1/submissions` running
its pipeline task to completion and its SSE endpoint replaying the result. A failing test
there means the code and the contract have drifted — either fix the route or fix
`openapi.yaml`, but don't skip the test.

The contract tests run against the real test database (see "Database" below). Each test
signs in for real: `tests/contract/conftest.py` gives every test a session per role and a
partner key inside its own rolled-back transaction. `tests/contract/test_auth_flows.py`
covers the security behaviour itself (sessions, 2FA, lockout, roles, keys, CSRF).

`tests/pipeline/` tests `app/worker/pipeline.py`, `app/providers/analysis.py` and
`app/realtime/` directly (step sequencing per submission type, the failure path, pub/sub).
`tests/adapters/` tests each `app/adapters/` module directly (OAuth URL/profile shape,
WhatsApp/Telegram payload parsing, Turnstile presence check, ...). All three suites run
against a fake Redis (`tests/conftest.py`, `fakeredis`) with Celery in eager mode and
pipeline step durations scaled to 0 — no live Redis server or worker process needed, and the
suite doesn't spend real seconds sleeping through a text submission's ~8-second simulated
pipeline.

## Database (P3)

PostgreSQL 16 + pgvector, through async SQLAlchemy 2.0 on asyncpg, with Alembic migrations
(`migrations/`). The design — every table, why, and what's still to come — is
[`docs/adr/0002-p3-backend-and-database.md`](../../docs/adr/0002-p3-backend-and-database.md).

- **Models** live in `app/db/models/` (identity, content, review, platform). A model change
  needs a migration: `alembic revision --autogenerate -m "..."`, then review the generated file
  by hand. CI runs `alembic check`, which fails when the models and migrations disagree.
- **Business-rule constants** (CCS weights and thresholds, review SLA, password minimum, OTP
  and session lifetimes, media cap, partner rate limit) are in `app/core/rules.py`, each with
  its spec citation. Import them; don't redefine them.
- **Sample data**: `python -m app.db.seed` loads `app/stubs/*` into an empty database. The
  sample reports only have aggregate rating counts, so the seed creates labelled sample
  raters (`seed-p001`, `…@seed.zuula.invalid`) and casts individual votes that add up to
  exactly those counts — scores are always derived from real vote rows.
- **Tests**: `tests/db/conftest.py` recreates the database named by `TEST_DATABASE_URL`
  (default `postgresql+asyncpg://zuula:zuula@localhost:5432/zuula_test`; the user needs
  permission to create databases), migrates it with `alembic upgrade head` and seeds it once
  per run. Each test's `db` session runs inside a transaction that's rolled back afterwards.

## Two OpenAPI documents

This repo has two things that could be called "the OpenAPI spec," and they're deliberately
not the same:

- **`openapi.yaml`** (repo root of `apps/api`) is the hand-authored source of truth — what
  Step 1 designed, what the partner docs (`/developers`) and `packages/shared`'s generated
  TypeScript types are built from, and what the contract tests validate against.
- **FastAPI's own auto-generated schema** (visible at `/openapi.json`, rendered at `/docs`)
  is derived from the Python route signatures and is *not* used for anything — it's just
  FastAPI's built-in dev convenience. Don't treat `/docs` as the contract.

## Architecture

```
app/
  main.py              FastAPI app assembly: CORS, error handlers, both routers, health checks
  core/
    config.py          Settings (env var driven, ZUULA_ prefix; also Celery/analysis settings, no prefix — see the ADR)
    errors.py          ApiError -> ErrorEnvelope exception handling (matches openapi.yaml's ErrorEnvelope)
    pagination.py       Shared {page, perPage, total} pagination helper
    router.py           APIRouter subclass defaulting response_model_exclude_none=True
    security.py         P2 stub auth (see the ADR) — X-Zuula-Role header (core), Bearer zl_live_* (partner)
    rules.py             Business rules as documented constants (CCS weights/thresholds, review SLA, password/media limits, partner rate limit) — single source of truth for app/stubs/* and app/core/config.py; P3 adds its own section at the end
  db/                    P3 persistence: models/, async session (session.py), report ids, sample-data seed
  services/              Domain logic shared by routers, worker and seed (community.py: weighted CCS)
  schemas/               Pydantic v2 models mirroring openapi.yaml's schemas, camelCase on the wire
  stubs/                 In-memory sample data transliterated from apps/web/lib/mock/*.ts
  providers/
    analysis.py          AnalysisProvider interface + StubAnalysisProvider (the pipeline's AI step)
  adapters/               One interface + stub per Step 4 integration (oauth, sms, turnstile, clamav, storage, email, whatsapp, telegram) — see the ADR for what each is wired into
  realtime/
    redis_client.py       Production get_redis()/get_async_redis() wiring
    submissions.py         Shared submission state + pub/sub (worker <-> API process), redis-client-agnostic for tests
  api/v1/                 Core API routers (auth, account, api-keys, submissions, fact-checks, ratings, review, notifications, admin)
  partner/v1/             Partner API routers (checks, fact-checks)
  webhooks/                Inbound WhatsApp/Telegram webhooks (FR-SUBMIT-04) — a message becomes a submission the same way a website POST does
  worker/
    __init__.py            Celery app + a `ping` task
    pipeline.py             The real submission pipeline (PIPELINES/STEP_SECONDS mirror apps/web/lib/analysis.ts)
tests/
  contract/                 The openapi-core-backed contract test suite
  pipeline/                 Direct tests of the pipeline task, AnalysisProvider, and realtime pub/sub
  adapters/                 Direct tests of each app/adapters/ module
  core/                     Direct tests of app/core/rules.py and its consumers
  db/                       Migrations, seed and database-enforced rules, against a real PostgreSQL
  dbutil.py                  Test-database helpers (recreate, migrate, seed)
  conftest.py                Shared fake-Redis + eager-Celery fixture all suites use
migrations/                  Alembic (async env); versions/0001 is the initial P3 schema
```

### A note on `response_model_exclude_none`

`app.core.router.APIRouter` forces `response_model_exclude_none=True` on every route by
default, matching how `apps/web/lib/types/*.ts` models most optional fields (`field?: T`,
key absent when unset) and how `openapi.yaml` types them (plain, non-nullable). A handful of
fields are the opposite — required *and* nullable (`ApiKey.lastUsedAt`, `ReviewCase.assignee`,
`FactCheckPublic.humanReview`, `CommunityScore.ccs` — modeled as `oneOf: [T, null]` and
always present, matching the frontend's `T | null` types and the partner docs' example
payloads). Those bypass `response_model` entirely and are serialized through small
`dump_*()` helpers (`app/schemas/fact_check.py`, `app/schemas/account.py`,
`app/schemas/review.py`) that restore the key as an explicit `null` after `exclude_none`
would otherwise have dropped it.

## Auth (P3)

Real since P3 PR 2 ([ADR 0002 §5](../../docs/adr/0002-p3-backend-and-database.md)):

- **Core API**: an opaque session token in the `zuula_session` cookie (HttpOnly, Secure,
  SameSite=Lax), or the same token as `Authorization: Bearer …` for non-browser clients.
  Stored only as a SHA-256 in `sessions`, so signing out or "sign out other devices" takes
  effect on the next request. Roles are read from the database on every request.
- **Passwords**: bcrypt (cost 12) over a SHA-256 pre-hash. **2FA**: 6-digit codes by SMS (or
  email when there's no phone), always on for Expert Reviewers and Admins (FR-AUTH-05).
- **Lockout**: 5 failures per account in 15 minutes → `429` on sign-in; wrong sign-up and
  reset codes count too. The per-IP limit is 50, since many users share an IP.
- **Partner API**: `zl_live_…` keys, stored as SHA-256, scoped (`POST` needs `submit`, `GET`
  needs `read`), and only usable while the owner is a journalist or admin. Redis sliding
  window at the admin-configured limit (default 100/hour).
- **Audit log**: `app/services/audit.py`'s `record()`, written in the same transaction as the
  action. IPs are stored truncated (`196.43.x.x`).

**Local dev sign-in**: after `python -m app.db.seed`, the sample accounts
(`mary@example.com` admin, `david@example.com` expert, `sarah@example.com` journalist,
`amina@example.com` public, …) all use the password `zuula-sample-password`. SMS and email
are still stubs (P3 PR 5), so codes are logged by the `zuula.adapters.sms` /
`zuula.adapters.email` loggers.

## What's real vs. stubbed (P2)

**P3 in progress:** the database, migrations and seed exist, and auth, content and admin are
all real (ADR 0002 §4–§6, §11). The external adapters are still stubs until P3 PR 5, and the
AI verdicts until P4. The bullets below describe P2 and are out of date where they conflict.

This is all documented more fully in the ADR, but briefly:
- **Auth** is a stub: the core API reads an `X-Zuula-Role` header (mirrors the frontend's own
  `zuula.mock-session` demo-role system), and the partner API accepts any bearer token shaped
  like `zl_live_*`. No password hashing, no JWT signing, no persisted sessions or API keys.
- **Data** is in-memory sample data (`app/stubs/`) for everything except live submissions.
  Writes (ratings, review decisions, admin edits, etc.) don't persist across requests.
- **The submission pipeline is real** (Celery, `app/worker/pipeline.py`): a submission
  actually runs through named steps with real timing and live SSE progress, matching
  `apps/web/lib/analysis.ts` exactly. The AI/verdict step (`app.providers.analysis`)
  deterministically returns one of the existing sample reports' analysis rather than a
  freshly generated one. Submission state lives in Redis with a 1-hour TTL, not a database —
  there's no persisted submission history yet.
- **Every integration adapter is a stub** (`app/adapters/`): OAuth, SMS, email, Turnstile,
  ClamAV, S3 storage, WhatsApp and Telegram all have a real interface wired into a real call
  site (see the ADR's table), but none of them call the actual service — no request to
  Google/Meta, no SMS or email actually sent, no file actually scanned or stored. Submitting
  by WhatsApp/Telegram works end to end (parses the real payload shape, creates a real
  submission through the same pipeline a website POST uses) except that no reply is actually
  sent back.
- **Rate limiting** (partner API) is an in-memory per-process counter, not the real
  Redis-backed limiter.
- **Business rules are centralized but only partly enforced** (`app/core/rules.py`): CCS
  weights/thresholds and the review SLA are real (used by the stub data's computed scores);
  the password minimum and media upload cap are documented (and declared in the contract)
  but not checked anywhere yet — real enforcement needs real password storage and real file
  uploads, both P3's job.
