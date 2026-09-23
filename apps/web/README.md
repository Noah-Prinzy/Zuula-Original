# Zuula web app

Zuula is the web front end of **Uganda Fact-Guard**, an AI fake-news detection platform specified by Victoria University's Centre for Intelligent Technologies (*System Development Plan & Functional Requirements Specification v1.0*, April 2026). Requirement IDs in the code and docs (FR-AUTH-01, §9.2, …) refer to that specification.

- Pages and routes: [docs/ui/sitemap.md](../../docs/ui/sitemap.md)
- Components: [docs/ui/component-inventory.md](../../docs/ui/component-inventory.md)

## Implementation plan

Deadline **30 Nov 2026**, one developer.

| Phase | Dates | Scope | Status |
|---|---|---|---|
| P1 Frontend | 21 Sep – 9 Oct | Next.js 16 + shadcn/ui, every page on mock data | In progress |
| P2 API design | 12 – 20 Oct | FastAPI core REST API; separate partner API (API keys, 100 requests/hour); SSE/WebSockets; WhatsApp and Telegram webhooks; AI job queue (Celery + Redis); OAuth, Africa's Talking SMS, Turnstile, ClamAV, S3 | Nearly done — Steps 1–5 landed, Step 6 (docs + completion report) in progress |
| P3 Backend + database | 21 Oct – 6 Nov | PostgreSQL + pgvector, Redis, auth (bcrypt, 2FA), weighted CCS and escalation, audit log | Not started |
| P4 AI engine | 9 – 24 Nov | Hosted LLM (Claude) with evidence retrieval; Sunbird AI for Ugandan languages; Whisper; RoBERTa AI-text detector and a deepfake API; evaluation on about 500 labelled items | Not started |
| Hardening + launch | 25 – 30 Nov | Security, performance, deployment | Not started |

Repo layout: `apps/web` (this app), `apps/api` (P2–P3), `services/ai` (P4), `packages/shared`. Only `apps/web` has code so far.

Pages live in `app/[locale]/(public|auth|app)/`. The URL never carries the language: `proxy.ts` (next-intl, `localePrefix: "never"`) maps the `NEXT_LOCALE` cookie to the `[locale]` segment, so each language is prerendered. English strings live in `messages/en.json`.

### Changes from the specification

These were agreed during planning and still need the supervisor's sign-off.

| Spec | Plan | Why |
|---|---|---|
| Fine-tuned LLaMA 3 / Mistral trained on Ugandan corpora (§5) | Hosted LLM with evidence retrieval, Sunbird AI for local languages | 10-week timeline; no training data or GPU budget yet |
| Accuracy targets of at least 90% text and 85% deepfake (FR-DETECT-03, 04) | Measured on about 500 labelled items | Estimates only, not proof |
| Native Android and iOS apps (Phase 5) | PWA at launch, React Native after | Timeline |
| Kubernetes (§7.4) | Docker Compose | Single-server deployment is enough at launch |
| Browser extension (FR-API-04), coordinated behaviour detection (FR-DETECT-09) | After launch | Low priority in the spec |
| 14-month roadmap, AI before platform (§8) | 10 weeks, frontend first | Deadline |
| Product name "Uganda Fact-Guard" | Branded "Zuula" | — |

Open questions for the supervisor:
- FR-RATE-05 escalates at more than 100 *dislikes*; §9.2 says more than 100 *ratings*. The code follows §9.2.
- The spec gives admins no rating weight. The code uses 1×.
- FR-API-01 targets media organisations, but FR-AUTH-02 has no organisation role. API keys are currently limited to Verified Journalists and Admins.
- Sending submissions to a hosted LLM outside Uganda must be checked against the Data Protection and Privacy Act 2019 (§10.1).
- FR-RATE-10 asks for a homepage leaderboard of the most accurately rated stories. Nothing in the plan or the frontend builds this yet — it needs a phase and an owner.

### Known gaps

- Everything uses mock data from `lib/mock`.
- Role checks run only in the browser.
- CAPTCHA is off in development.
- Python must be upgraded to 3.12 before P3.

## Development

```bash
npm install
npm run dev
```

Checks: `npm run lint`, `npm run typecheck`. Add shadcn components with `npx shadcn@latest add <name>`; they go in `components/ui`.
