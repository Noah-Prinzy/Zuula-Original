# Zuula API (P2 skeleton)

FastAPI implementation of `openapi.yaml` — the core web-app API (`/api/v1/*`) and the
public partner API (`/v1/*`, matching the `/developers` docs). Every operation in the
contract has a route here returning schema-shaped stub data; there is no database, no real
auth, and no fact-check pipeline yet (see [`docs/adr/0001-api-architecture.md`](../../docs/adr/0001-api-architecture.md)
for what's stubbed and why).

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
pytest tests/contract/ -q
```

`tests/contract/test_openapi_contract.py` is the important one: it wraps the whole app in
[`openapi-core`](https://github.com/python-openapi/openapi-core)'s `FastAPIOpenAPIMiddleware`
and exercises essentially every operation in `openapi.yaml`, asserting both the request and
the response validate against the spec. A failing test there means the code and the contract
have drifted — either fix the route or fix `openapi.yaml`, but don't skip the test.

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
    config.py          Settings (env var driven, ZUULA_ prefix)
    errors.py          ApiError -> ErrorEnvelope exception handling (matches openapi.yaml's ErrorEnvelope)
    pagination.py       Shared {page, perPage, total} pagination helper
    router.py           APIRouter subclass defaulting response_model_exclude_none=True
    security.py         P2 stub auth (see the ADR) — X-Zuula-Role header (core), Bearer zl_live_* (partner)
  schemas/               Pydantic v2 models mirroring openapi.yaml's schemas, camelCase on the wire
  stubs/                 In-memory sample data transliterated from apps/web/lib/mock/*.ts
  api/v1/                 Core API routers (auth, account, api-keys, submissions, fact-checks, ratings, review, notifications, admin)
  partner/v1/             Partner API routers (checks, fact-checks)
  worker/                 Celery app (P2: a `ping` task only; the real pipeline is Step 3)
tests/contract/           The openapi-core-backed contract test suite
```

### A note on `response_model_exclude_none`

`app.core.router.APIRouter` forces `response_model_exclude_none=True` on every route by
default, matching how `apps/web/lib/types/*.ts` models most optional fields (`field?: T`,
key absent when unset) and how `openapi.yaml` types them (plain, non-nullable). A handful of
fields are the opposite — required *and* nullable (`ApiKey.lastUsedAt`, `ReviewCase.assignee`,
`FactCheckPublic.humanReview` — modeled as `oneOf: [T, null]` and always present, matching the
frontend's `T | null` types and the partner docs' example payloads). Those bypass
`response_model` entirely and are serialized through small `dump_*()` helpers
(`app/schemas/fact_check.py`, `app/schemas/account.py`, `app/schemas/review.py`) that restore
the key as an explicit `null` after `exclude_none` would otherwise have dropped it.

## What's real vs. stubbed (P2)

Nothing here is real yet — this is all documented more fully in the ADR, but briefly:
- **Auth** is a stub: the core API reads an `X-Zuula-Role` header (mirrors the frontend's own
  `zuula.mock-session` demo-role system), and the partner API accepts any bearer token shaped
  like `zl_live_*`. No password hashing, no JWT signing, no persisted sessions or API keys.
- **Data** is in-memory sample data (`app/stubs/`), not a database. Writes (ratings, review
  decisions, admin edits, etc.) don't persist across requests.
- **The submission pipeline** is a fixed stub: every submission "resolves" to the same demo
  report. The real ClamAV/S3/Whisper/analysis/verdict pipeline is P2 Step 3.
- **Rate limiting** (partner API) is an in-memory per-process counter, not the real
  Redis-backed limiter.
