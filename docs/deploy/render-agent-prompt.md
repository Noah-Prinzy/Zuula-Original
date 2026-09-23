# Deploy the Zuula API to Render (agent prompt)

Paste everything below the line into a coding agent running on your own machine.

---

You're deploying the Zuula backend (`apps/api`, FastAPI) to Render so the Vercel-hosted web app (`apps/web`) can sign people in for real. Work carefully, confirm with me before anything that costs money or can't be undone, and tell me plainly what you verified and what you didn't.

## 0. Get the current code first

```bash
git clone https://github.com/Noah-Prinzy/zuula.git || true
cd zuula && git fetch origin && git checkout main && git pull --ff-only origin main
git log --oneline -5
```

If branch `integrate/real-auth` has unmerged commits (compare `git log main..origin/integrate/real-auth`), it holds the Vercel proxy described in step 4; tell me whether it's merged yet. Then read, before changing anything: `apps/api/README.md`, `apps/api/Dockerfile`, `apps/api/docker-compose.yml`, `apps/api/.env.example`, `apps/api/app/core/config.py`, `apps/web/.env.example`, `apps/web/next.config.ts`, `apps/web/lib/api.ts`. Trust the code over this prompt where they disagree, and tell me.

## 1. What has to run on Render

From `docker-compose.yml`:

| Piece | Render resource | Command |
|---|---|---|
| API | Web Service (Docker, root dir `apps/api`) | `uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips='*'` |
| Worker | Background Worker (same image) | `celery -A app.worker.celery_app worker --loglevel=INFO` |
| Migrations | Pre-deploy command on the API service | `alembic upgrade head` |
| PostgreSQL 16 + pgvector | Render Postgres | migration 0001 runs `CREATE EXTENSION vector` and `pg_trgm` |
| Redis | Render Key Value (Redis-compatible) | Celery broker/results + SSE + sign-in lockout |

Prefer a `render.yaml` Blueprint at the repo root so this is reproducible; show it to me before applying. Background workers and the pre-deploy command need paid instance types, so check current Render pricing and plan limits and tell me the monthly cost before creating anything.

## 2. Environment variables (API and worker)

Check each name against `app/core/config.py`; the `ZUULA_` prefix applies only to the `Settings` class.

- `DATABASE_URL`: from Render Postgres, **rewritten to the asyncpg driver**: `postgresql+asyncpg://…` (Render hands out `postgres://` or `postgresql://`). Check whether Render's internal URL needs SSL parameters for asyncpg.
- `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`: the Key Value internal URL with DB indices `/2`, `/0`, `/1` (see `.env.example`). Confirm Render Key Value supports multiple DB indices; if it doesn't, tell me and propose an alternative.
- `ZUULA_ENV=production`, `ZUULA_DEBUG=false`.
- `ZUULA_SECRET_KEY`: a new random value (`python -c "import secrets; print(secrets.token_urlsafe(48))"`). Never reuse the dev default, and never commit it.
- `ZUULA_SESSION_COOKIE_SECURE=true`. Leave `ZUULA_SESSION_COOKIE_DOMAIN` **empty** for the proxy setup in step 4.
- `ZUULA_CORS_ORIGINS`: the web app's exact origin(s), comma-separated, no trailing slash (e.g. `https://zuula.vercel.app`). The API's CSRF check refuses cookie-authenticated writes (sign-out, and later every write) from any origin not listed. Vercel preview URLs change per deploy, so ask me which ones to allow.
- `ZUULA_WEB_APP_URL`: the web app's URL (OAuth redirects back there).
- `ANALYSIS_PROVIDER=stub`, `PIPELINE_STEP_SCALE=1.0`. Leave the other adapter vars empty unless I give you values.

## 3. First deploy and checks

1. Deploy; confirm the pre-deploy migration succeeded (the `vector` extension is created).
2. `GET https://<api>/healthz` → `{"status":"ok"}`; `GET /api/v1/me` → 401 JSON error.
3. Ask me before seeding. `python -m app.db.seed` loads **sample** data and nine sample accounts that all share the password `zuula-sample-password`, which is fine for a demo and unacceptable for real users. Run it from a Render shell or one-off job only if I say yes.
4. Test sign-in directly with curl against the API (a seeded account if seeded, otherwise sign up): a 200 with `set-cookie: zuula_session=…; HttpOnly; Secure; SameSite=lax`.

## 4. Connect the Vercel web app (the proxy)

The session cookie is `SameSite=Lax`. A site on `*.vercel.app` calling an API on `*.onrender.com` is cross-site, so the browser would drop the cookie: sign-in would "succeed" and then immediately look signed out. `apps/web/next.config.ts` therefore proxies `/api/v1/*` from the web app to the API, so the browser only ever talks to the Vercel origin. In the Vercel project (Production, and Preview if wanted) set:

- `NEXT_PUBLIC_API_URL=/`
- `ZUULA_API_ORIGIN=https://<your-api>.onrender.com` (server-side only; read at **build** time, so redeploy after setting it)
- optional: `NEXT_PUBLIC_ROLE_SWITCHER=true` to keep the "Preview as" bar on a demo site

Redeploy, then in a real browser on the deployed site: sign in → reload (still signed in) → sign out → reload (still signed out). Also check that `https://<site>/api/v1/me` returns the API's JSON, not a Next.js 404.

With your own domain (`zuula.ug` + `api.zuula.ug`), the direct setup also works: `NEXT_PUBLIC_API_URL=https://api.zuula.ug`, `ZUULA_SESSION_COOKIE_DOMAIN=zuula.ug`, no `ZUULA_API_ORIGIN`. Either way, list the site in `ZUULA_CORS_ORIGINS`.

## 5. Known blockers and risks to report back on (don't paper over them)

- **Verification codes aren't delivered.** Email/SMS adapters are stubs that only log the code at INFO level (P3 PR 5 builds the real ones). Real users can't finish sign-up or 2FA until then. To demo it, the code has to be read from the API's logs, and plain uvicorn doesn't print INFO from app loggers. Propose the smallest safe way to make those logs visible, but don't expose codes publicly.
- **Client IP behind two proxies (Vercel → Render).** Per-IP sign-in lockout (50 failures) uses `request.client`, which depends on `X-Forwarded-For` being passed and trusted. Check what the API actually sees. If every user shows up as a Vercel IP, they'd share one lockout counter; report it. Trusting `*` also lets clients spoof the header, which weakens only the per-IP limit; the per-identifier limit still holds.
- **Local `next start` redirect loop.** On `main`, a local production server (`next start`) and `next dev` opened as `127.0.0.1` answer every page with a 307 to the same path. Vercel isn't affected. If you test locally, use `next dev` on `http://localhost:3000`, and don't try to fix this as part of the deploy.
- Free-tier Render services sleep and Render's free Postgres expires. Say which plan you picked and what that means.

When you're done, give me: the API URL, each resource and plan with its monthly cost, every env var you set (names only, never secret values), what you verified in a browser vs. with curl, and anything left open.
