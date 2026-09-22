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

uvicorn app.main:app --reload
```

Or via Docker Compose (`api` + `worker` + `redis` + a placeholder `postgres`):

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
pytest tests/ -q
```

`tests/contract/test_openapi_contract.py` is the important one: it wraps the whole app in
[`openapi-core`](https://github.com/python-openapi/openapi-core)'s `FastAPIOpenAPIMiddleware`
and exercises essentially every operation in `openapi.yaml`, asserting both the request and
the response validate against the spec — including a real `POST /api/v1/submissions` running
its pipeline task to completion and its SSE endpoint replaying the result. A failing test
there means the code and the contract have drifted — either fix the route or fix
`openapi.yaml`, but don't skip the test.

`tests/pipeline/` tests `app/worker/pipeline.py`, `app/providers/analysis.py` and
`app/realtime/` directly (step sequencing per submission type, the failure path, pub/sub).
`tests/adapters/` tests each `app/adapters/` module directly (OAuth URL/profile shape,
WhatsApp/Telegram payload parsing, Turnstile presence check, ...). All three suites run
against a fake Redis (`tests/conftest.py`, `fakeredis`) with Celery in eager mode and
pipeline step durations scaled to 0 — no live Redis server or worker process needed, and the
suite doesn't spend real seconds sleeping through a text submission's ~8-second simulated
pipeline.

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
  conftest.py                Shared fake-Redis + eager-Celery fixture all three suites use
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

## What's real vs. stubbed (P2)

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
