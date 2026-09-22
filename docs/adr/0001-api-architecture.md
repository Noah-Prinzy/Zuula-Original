# ADR 0001: API architecture (P2)

**Status:** Accepted. Step 1 (the contract, [PR #1](../../apps/api/openapi.yaml)) and Step 2
(the FastAPI skeleton, [PR #2](https://github.com/Noah-Prinzy/zuula/pull/2)) are merged;
Step 3 (the real submission pipeline and realtime delivery) is this revision's addition —
see the Queue and Realtime sections below, both rewritten from Step 2's forward-looking
placeholders to describe what's actually built. Several decisions here are explicitly
P2-only and are expected to be superseded in P3 — each says so.

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
separate Compose service (`worker`) from the API process. `POST /api/v1/submissions`
(`app/api/v1/submissions.py`) writes an initial state record then calls
`run_submission_pipeline.delay(...)` (`app/worker/pipeline.py`), which runs the submission
through ClamAV scan → storage → transcription → analysis → verdict as a sequence of named
steps, sleeping for each step's documented duration and publishing progress as it goes.
ClamAV scanning, storage and transcription are still stand-ins (the real integrations are
Step 4's adapters — this task's job is the pipeline's *shape*, not real external calls); the
one real interface boundary is the AI step, which goes through
`app.providers.analysis.AnalysisProvider` (see below).

Step sequencing and per-step timing are not invented — `PIPELINES`/`STEP_SECONDS` in
`app/worker/pipeline.py` are transcribed field-for-field from
`apps/web/lib/analysis.ts`'s `PIPELINES`/`STEPS`, including that the step sequence differs
by submission type (a `media` submission scans and transcribes; a `text` submission doesn't;
only `url` fetches). This is deliberate: P3's frontend integration should be able to point
the existing Status page at this API with no change to what it renders, only where its data
comes from.

**Why Celery/Redis and not something else:** it's the combination the brief's Step 3/4 scope
already names (`app/worker/**`, `app/providers/analysis*`), it's a well-understood default
for Python job queues, and Redis is already a dependency for the partner rate limiter's real
(non-stub) implementation, so it isn't an extra moving part.

**State lives in Redis, not Postgres — even though Postgres is already in Compose.** The API
process and the worker process are separate OS processes (`docker-compose.yml`'s `api` and
`worker` services) with no shared memory, so submission progress has to live somewhere both
can reach. Postgres is P2's explicit placeholder-only service (nothing reads `DATABASE_URL`
yet); building real persistence for one table ahead of P3's actual schema work would be
throwaway effort. `app/realtime/submissions.py` stores each submission's state as a JSON
blob under a TTL'd Redis key (`STATE_TTL_SECONDS`, one hour) — enough to demo the full flow,
not a durable record. P3's job is to replace this with a real `submissions` table; the
functions' signatures (`load_state`/`save_state`, taking a redis client and a tracking id)
are intentionally the whole interface, so that swap doesn't ripple into the pipeline task or
the API routes.

## Realtime

**Decision:** Server-Sent Events (SSE), not WebSockets, for both places the contract needs a
live stream: `GET /api/v1/submissions/{trackingId}/events` (pipeline progress for one
submission) and `GET /api/v1/notifications/stream`. The submissions stream is real, backed
by Redis pub/sub (`app/realtime/submissions.py`'s `publish_step`/`publish_done`/
`publish_failed`/`subscribe`): the worker publishes as each step transitions, and
`app/api/v1/submissions.py`'s SSE endpoint replays whatever's already recorded in the
submission's state (so a client that connects mid-pipeline, or after it's finished, still
gets the full picture) and then forwards live pub/sub messages until a `done` or `failed`
event closes the stream. The notifications stream is still a fixed-data stub (nothing in P2
yet produces notification events to publish — that arrives with the features that create
them: review decisions, admin broadcasts) but goes through the same
`StreamingResponse(..., media_type="text/event-stream")` shape.

**Why SSE:** both streams are strictly server-to-client (the client never needs to send
messages over the same connection — actions like "mark read" or "retry submission" are
separate, ordinary POST requests), SSE degrades gracefully over plain HTTP/1.1 and proxies
without extra infrastructure, and it maps directly onto Celery task progress (a worker
publishing progress is naturally a stream of discrete named events, which is exactly SSE's
`event: <name>\ndata: <payload>` shape). Nothing here rules out WebSockets later if a
bidirectional need shows up, but nothing in the current contract needs one.

**A known, accepted gap:** there's a small race window in the submissions SSE endpoint
between reading a submission's already-recorded steps (for replay) and subscribing to its
pub/sub channel (for what's still to come) — a step that completes in exactly that window
could be missed by that one connection. The final `done`/`failed` event and a plain
`GET /api/v1/submissions/{trackingId}` poll both always reflect the true end state
regardless, so the visible effect is at most one skipped intermediate progress tick, not
stale or wrong data. Closing this fully would mean Redis Streams (replay-from-offset)
instead of pub/sub (fire-and-forget) — reasonable if it ever proves to matter in practice,
disproportionate for a P2 stub demo today.

## AnalysisProvider

**Decision:** the AI/verdict step of the pipeline goes through one interface,
`app.providers.analysis.AnalysisProvider` (a `Protocol`: one `analyze(content_type, text,
language) -> AnalysisResult` method), selected at runtime by `ANALYSIS_PROVIDER` via
`get_analysis_provider()`. P2 ships exactly one implementation, `StubAnalysisProvider`,
which deterministically maps its input to one of the existing sample reports' analysis (by
a stable hash, not Python's randomized string hash, since the mapping has to agree across
the worker process and anything else that might call it) — shaped like a real provider's
output, without doing any real analysis.

**Why this needs to be swappable at all:** sending submissions to a hosted LLM outside
Uganda is an open §10.1 data-protection question the spec doesn't resolve. `ANALYSIS_PROVIDER`
and `ANALYSIS_PROVIDER_REGION` (`app/core/config.py`'s `AnalysisSettings`,
`.env.example`) exist so that whichever answer P4 lands on — a regional deployment, an
on-Uganda-soil model, a provider allow-list — is a config change behind this interface, not
a rewrite of the pipeline that calls it.

## Adapters (external integrations)

**Decision:** every external integration the contract implies other than the analysis
provider (which has its own section above, added in Step 3) — ClamAV, S3-compatible
storage, Whisper (or equivalent) transcription, Africa's Talking (SMS/USSD), Cloudflare
Turnstile, WhatsApp/Telegram bot channels, OAuth, outbound email — is still out of scope and
represented only as placeholder settings in `app/core/config.py`/`.env.example`. No adapter
code exists yet; the pipeline's ClamAV/storage/transcription steps (`app/worker/pipeline.py`)
are named stages with a simulated duration, not calls to anything.

**Why defer instead of stubbing each with a fake client now:** these adapters' job is purely
external I/O (call a real service, get a real result) with no meaningful shape decision left
to make ahead of time the way the analysis provider had (P2's central design question there
was the swappable-interface/§10.1 one, not the stub's content). Building each adapter behind
a real interface belongs with the feature that first needs it — Step 4 — so the abstraction
boundary is informed by an actual caller instead of guessed in advance.

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
`FactCheckPublic.humanReview`, `CommunityScore.ccs`), matching frontend types that are
`T | null` rather than `T | undefined`, and openapi.yaml schemas typed `oneOf: [T, null]`
with the field in `required`. Those go through small per-schema `dump_*()` helpers instead
of automatic `response_model` serialization. This split was found by, and is enforced by,
the contract test suite — a field modeled the wrong way fails a real response-schema
validation, not a guess. `ccs` (null until a report has its first rating —
`community_score()` in `app/stubs/scoring.py`) is a good example of why this matters beyond
Step 2's original three: every pre-seeded sample report already has ratings, so the bug was
invisible until Step 3's pipeline created the first-ever zero-rating report and the contract
test suite caught it immediately.
