"""Business rules as documented constants (P2 Step 5). Every value here is cited against the
CIT System Development Plan & Functional Requirements Specification v1.0. Two are explicitly
open questions the spec doesn't fully resolve — each is flagged where it's defined, and the
app's current behavior for it is documented rather than left implicit.

This module is P2's single source of truth for these numbers: nothing here does anything by
itself (no validation, no enforcement) — see the docstring on each constant for where it's
actually used today, and note that real enforcement of the ones not yet wired anywhere
(PASSWORD_MIN_LENGTH, MAX_MEDIA_BYTES) is P3's job, per the brief's own Step 5 framing
("implement them in P3").
"""

# ---------------------------------------------------------------------------------------
# Community Credibility Score (CCS) — §9.1 (weights), §9.2 (status thresholds)
# ---------------------------------------------------------------------------------------

# §9.1: how much one rating counts toward a report's CCS, by the rater's role. "Reviewer" in
# the spec's own language is the `expert` role here (FR-REVIEW's reviewers rate as experts).
# Used by app/stubs/scoring.py's community_score().
CCS_WEIGHTS: dict[str, int] = {
    "public": 1,
    "journalist": 2,
    "expert": 5,
}

# OPEN QUESTION (carried since the Step 1 contract PR, unresolved): §9.1 is silent on
# whether admins get their own weight. Current behavior (app/api/v1/ratings.py's
# add_comment): an admin's rating counts at the `public` weight above, not a bespoke admin
# weight — a disclosed choice, not an oversight. Change CCS_WEIGHTS and that call site
# together if Noah answers this differently.

# §9.2: the CCS-and-total-ratings bands that decide a report's community status. Used by
# app/stubs/scoring.py's status_for() and mirrored in app/stubs/admin.py's platform-settings
# stub (the admin-facing view of these same numbers).
CCS_STATUS_THRESHOLDS: dict[str, dict[str, int]] = {
    "verified": {"min_score": 90},
    "questioned": {"min_score": 40, "max_score": 69, "min_ratings": 50},
    "escalated": {"max_score": 39, "min_ratings": 100},
    "suspended": {"max_score": 19, "min_ratings": 200},
}

# OPEN QUESTION (carried since the Step 1 contract PR, unresolved): §9.2 escalates a report
# once its total rating count exceeds this figure; FR-RATE-05 instead talks about
# "dislikes," a different (and not currently modeled) count. This implementation follows
# §9.2's total-ratings reading — CCS_STATUS_THRESHOLDS["escalated"]["min_ratings"] above is
# the number in question, repeated here as its own name since it's the one Step 5's brief
# calls out by name.
ESCALATION_RATING_THRESHOLD = CCS_STATUS_THRESHOLDS["escalated"]["min_ratings"]

# ---------------------------------------------------------------------------------------
# Review SLA
# ---------------------------------------------------------------------------------------

# Hours a flagged report has before its review case is "overdue" (FR-REVIEW). Used by
# app/stubs/review.py's _sla() to compute each stub case's sla_due_at/sla_state, and
# mirrored in app/stubs/admin.py's platform-settings stub.
REVIEW_SLA_HOURS = 48

# ---------------------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------------------

# FR-AUTH: minimum password length. Declared today at the contract level (openapi.yaml's
# SignUp/ResetPassword/ChangePassword request schemas all set `minLength: 12`) but not
# enforced by app code — P2's routes accept an untyped dict body (see app/api/v1/auth.py)
# and don't validate it themselves. Real enforcement is P3's job, once real password
# storage exists to enforce it against.
PASSWORD_MIN_LENGTH = 12

# ---------------------------------------------------------------------------------------
# Submissions
# ---------------------------------------------------------------------------------------

# FR-SUBMIT-05: media upload size cap — openapi.yaml's SubmissionInput.file and
# apps/web/lib/submission.ts's MAX_FILE_BYTES. Enforced on multipart uploads (413).
MAX_MEDIA_BYTES = 50 * 1024 * 1024

# ---------------------------------------------------------------------------------------
# Partner API
# ---------------------------------------------------------------------------------------

# FR-API-01: requests per hour, per partner API key. Already enforced for real today (an
# in-memory per-process counter — see docs/adr/0001-api-architecture.md for why that's a
# P2-only simplification, not the real Redis-backed limiter) — this is the one rule in this
# module that isn't waiting on P3. app/core/config.py's Settings.partner_rate_limit_per_hour
# defaults to this value but stays independently overridable via
# ZUULA_PARTNER_RATE_LIMIT_PER_HOUR, since it's the kind of number an operator may
# legitimately want to tune per environment without a code change.
PARTNER_RATE_LIMIT_PER_HOUR = 100

# =======================================================================================
# P3 additions (docs/adr/0002-p3-backend-and-database.md). Values the spec or frontend sets
# cite them; values the spec leaves open are marked "ADR 0002" — P3's choice, approved by
# Noah on 23 Sep 2026. Admins can change weights, thresholds, SLA and rate limit at runtime
# (FR-ADMIN-06): the constants above are the defaults the `platform_settings` row is seeded
# from, not the live values.
# =======================================================================================

# §9.1 / the open question above: admins rate at the public weight. Ratings also store the
# role they were cast with and keep it — a later promotion doesn't re-weight old votes
# (ADR 0002 §4, decision 6a).
ADMIN_RATER_ROLE = "public"

# ---- Expert review (FR-REVIEW; apps/web/lib/mock/review.ts) ----

# A case is "due soon" within this many hours of its SLA deadline (review.ts's slaState()).
REVIEW_DUE_SOON_HOURS = 12
# Pipeline verdicts below this confidence open a `low-confidence` review case (review.ts
# REASON_META: "The AI was less than 60% confident").
LOW_CONFIDENCE_THRESHOLD = 60
# A review decision needs a justification at least this long (FR-REVIEW-03; openapi.yaml's
# decideCase body, minLength 10).
REVIEW_JUSTIFICATION_MIN = 10
# Open user reports on one verdict that open a `user-reports` case. ADR 0002.
USER_REPORTS_CASE_THRESHOLD = 5

# ---- Auth (FR-AUTH; apps/web/lib/auth.ts) ----

BCRYPT_ROUNDS = 12  # ADR 0002
TWO_FACTOR_ROLES = frozenset({"expert", "admin"})  # FR-AUTH-05: always on for these

OTP_LENGTH = 6  # openapi.yaml: codes match ^\d{6}$
OTP_TTL_SECONDS = 10 * 60  # ADR 0002
OTP_MAX_ATTEMPTS = 5  # ADR 0002
OTP_RESEND_COOLDOWN_SECONDS = 30  # openapi.yaml resendTwoFactor: "30 s cooldown"

# Failures per identifier before a 429 (ADR 0002, decision 2): wrong passwords, and wrong
# sign-up or password-reset codes, all count — so no flow allows unlimited code guessing.
SIGN_IN_MAX_FAILURES = 5
SIGN_IN_LOCKOUT_WINDOW_SECONDS = 15 * 60
# Per client IP the threshold is far higher: mobile carriers and schools put many people
# behind one address (carrier-grade NAT), and one person's typos mustn't lock them all out.
SIGN_IN_MAX_FAILURES_PER_IP = 50

SESSION_TTL_REMEMBER_SECONDS = 30 * 24 * 3600  # ADR 0002
SESSION_TTL_SECONDS = 12 * 3600  # ADR 0002, `remember: false`

# ---- Submissions (FR-SUBMIT; openapi.yaml SubmissionInput) ----

TEXT_MIN_CHARS = 20
TEXT_MAX_CHARS = 5_000
ARTICLE_MIN_CHARS = 50
ARTICLE_MAX_CHARS = 20_000
HEADLINE_MAX_CHARS = 200
# FR-SUBMIT-05: what a media submission may be (415 otherwise) — apps/web/lib/submission.ts's
# ACCEPTED_MEDIA, which the upload form offers.
ACCEPTED_MEDIA_TYPES = frozenset(
    {
        *("image/jpeg", "image/png", "image/webp", "image/gif"),
        *("audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/x-m4a", "audio/aac"),
        *("video/mp4", "video/quicktime", "video/webm", "video/3gpp"),
    }
)

# ---- Partner API (FR-API-02) ----

API_KEY_ROLES = frozenset({"journalist", "admin"})
