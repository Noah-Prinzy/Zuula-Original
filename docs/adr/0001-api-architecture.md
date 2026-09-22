# ADR 0001: API architecture (P2)

**Status:** Accepted (P2 Step 1 contract merged in [PR #1](../../apps/api/openapi.yaml);
Step 2 skeleton is this ADR's subject). Several decisions here are explicitly P2-only and
are expected to be superseded in P3 — each says so.

## Context

The P2 brief asked for a contract-first API design (`openapi.yaml`) followed by a FastAPI
skeleton that returns contract-valid stub data for every operation, ahead of the real
pipeline/persistence work in later steps. This ADR records the decisions made building that
skeleton: how auth, the job queue, realtime delivery, and external integrations are
represented now, and what each one is a stand-in for.

## Auth

**Decision:** Two separate, deliberately unauthenticated-in-practice stub mechanisms, one
per API surface, each matching what the OpenAPI contract documents as the real scheme:

- **Core API** (`/api/v1/*`): `openapi.yaml` declares `sessionAuth` (an `apiKey` cookie named
  `zuula_session`, or a bearer JWT for non-browser core clients) as the eventual mechanism.
  Today, `app.core.security.get_current_user`/`require_roles` instead read a plain
  `X-Zuula-Role` header (`public` / `journalist` / `expert` / `admin`), mirroring the
  frontend's own `zuula.mock-session` demo-role system so the two stacks can be driven the
  same way in local dev. There is no password hashing, no JWT signing, no session store.
- **Partner API** (`/v1/*`): `openapi.yaml` declares `partnerApiKey` (HTTP bearer,
  `Authorization: Bearer zl_live_...`) — this one **is** the real, documented mechanism (it's
  what `/developers` shows partners), just not yet backed by persisted, provisioned keys:
  `require_partner_key` accepts any token shaped like `zl_live_*`.

**Consequence:** any request can claim any role/identity. This is acceptable for P2 (no real
user data exists to protect) but must not ship — P3 replaces the internals of both
dependencies while keeping their names and signatures, so routers don't change.

**A contract-testing gotcha worth recording:** the P2 contract test suite
(`tests/contract/test_openapi_contract.py`) validates every request/response against
`openapi.yaml` via `openapi-core`, which *does* enforce the declared security schemes'
presence — independently of, and before, our own header-based checks run. A request with no
`zuula_session` cookie at all gets rejected by `openapi-core` itself (its own hardcoded
403), never reaching `app.core.security`'s logic, which would have correctly returned its
own 401. The fixtures send a dummy cookie/bearer value on every request so `openapi-core`'s
presence check passes and our app's own auth logic actually runs and is what gets tested.

## Queue

**Decision:** Celery (`app/worker/`), broker and result backend both Redis, run as a
separate Compose service (`worker`) from the API process. P2 scope is intentionally minimal —
a `zuula.ping` task, just enough to prove `docker compose up` runs a working worker process
end to end. The real submission pipeline (ClamAV scan → S3 upload → Whisper transcription →
analysis provider → verdict), and the `SubmissionStepEvent`-shaped progress it should emit,
is P2 Step 3.

**Why Celery/Redis and not something else:** it's the combination the brief's Step 3/4 scope
already names (`app/worker/**`, `app/providers/analysis*`), it's a well-understood default
for Python job queues, and Redis is already a dependency for the partner rate limiter's real
(non-stub) implementation, so it isn't an extra moving part.

## Realtime

**Decision:** Server-Sent Events (SSE), not WebSockets, for both places the contract needs a
live stream: `GET /api/v1/submissions/{trackingId}/events` (pipeline progress for one
submission) and `GET /api/v1/notifications/stream`. Both are implemented today as
`StreamingResponse(..., media_type="text/event-stream")` generators over the same fixed stub
data the non-streaming endpoints use.

**Why SSE:** both streams are strictly server-to-client (the client never needs to send
messages over the same connection — actions like "mark read" or "retry submission" are
separate, ordinary POST requests), SSE degrades gracefully over plain HTTP/1.1 and proxies
without extra infrastructure, and it maps directly onto Celery task progress (a worker
publishing progress is naturally a stream of discrete named events, which is exactly SSE's
`event: <name>\ndata: <payload>` shape). Nothing here rules out WebSockets later if a
bidirectional need shows up, but nothing in the current contract needs one.

## Adapters (external integrations)

**Decision:** every external integration the contract implies — ClamAV, S3-compatible
storage, Whisper (or equivalent) transcription, the pluggable "analysis provider" for
verdict generation, Africa's Talking (SMS/USSD), Cloudflare Turnstile, WhatsApp/Telegram
bot channels, outbound email — is P2-out-of-scope and represented only as placeholder
settings in `app/core/config.py`/`.env.example`. No adapter code exists yet; stub data in
`app/stubs/` stands in for all of their outputs.

**Why defer instead of stubbing each with a fake client now:** Step 2's job was proving the
contract is servable end-to-end with realistic shaped data, which the static stub data
already does without needing fake network clients for a dozen services. Building each
adapter behind a real interface belongs with the feature that first needs it (Step 3 for the
pipeline adapters — ClamAV/S3/Whisper/analysis; Step 4 for the messaging/notification
adapters), so the abstraction boundary is informed by an actual caller instead of guessed
in advance.

## Pagination

**Decision:** page-based (`{page, perPage, total}`), not the brief's suggested default of
cursor-based pagination. This is a deliberate, disclosed deviation from the brief, made in
Step 1: `apps/web/lib/library.ts`'s `LibraryQuery.page: number` and the partner docs'
`SEARCH_RESPONSE` shape are both already page-based, and matching them avoids a frontend
rewrite for no real benefit — nothing in the product needs cursor stability (no
infinite-scroll-under-concurrent-writes scenario) that page numbers can't handle at Zuula's
scale.

## Serialization: optional-absent vs. required-nullable

**Decision:** most optional fields in the contract follow apps/web/lib/types/*.ts's
`field?: T` convention — omitted from the JSON entirely when unset, enforced by default via
`app.core.router.APIRouter` (see `apps/api/README.md`). A small, explicit set of fields are
instead required-and-nullable (`ApiKey.lastUsedAt`, `ReviewCase.assignee`,
`FactCheckPublic.humanReview`), matching frontend types that are `T | null` rather than
`T | undefined`, and openapi.yaml schemas typed `oneOf: [T, null]` with the field in
`required`. Those go through small per-schema `dump_*()` helpers instead of automatic
`response_model` serialization. This split was found by, and is enforced by, the contract
test suite — a field modeled the wrong way fails a real response-schema validation, not a
guess.
