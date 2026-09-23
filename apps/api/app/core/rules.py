"""Business-rule constants, in one place, each citing where it comes from.

Two kinds of values live here:

- **Spec values** cite the CIT System Development Plan & Functional Requirements
  Specification v1.0 (FR-* / §* ids, the same ids used across apps/web and openapi.yaml).
  Where the frontend already encodes the rule, the file is named too — those two must agree.
- **Design values** are marked "ADR 0002" — the spec doesn't set them, so P3 chose them
  (docs/adr/0002-p3-backend-and-database.md). Change them there first, then here.

Everything else imports from this module; nothing redefines these numbers. Values admins can
change at runtime (weights, thresholds, SLA, rate limit — FR-ADMIN-06) are only the *defaults*
here: the live values are the `platform_settings` row, seeded from these.
"""

from typing import Final

# ---- Community rating (§9.1, FR-RATE-03; apps/web/lib/community.ts) ----

# Weighted CCS = weighted "accurate" / (weighted "accurate" + weighted "inaccurate") × 100.
RATING_WEIGHTS: Final = {"public": 1, "journalist": 2, "expert": 5}

# §9.1 gives admins no weight: they rate as standard users (community.ts's raterRole()).
ADMIN_RATER_ROLE: Final = "public"

# A rating is weighted by the rater's role *when they voted*, stored on the rating row, not
# re-derived from their current role (ADR 0002 §4, approved by Noah 23 Sep 2026).

# ---- Escalation (§9.2; apps/web/lib/community.ts CCS_THRESHOLDS) ----
# `min_ratings` comparisons are strict (`total > min_ratings`), matching community.ts.

CCS_THRESHOLDS: Final = {
    "verified": {"min_score": 90},
    "questioned": {"min_score": 40, "max_score": 69, "min_ratings": 50},
    "escalated": {"max_score": 39, "min_ratings": 100},
    "suspended": {"max_score": 19, "min_ratings": 200},
}

# ---- Expert review (FR-REVIEW; apps/web/lib/mock/review.ts) ----

REVIEW_SLA_HOURS: Final = 48
# A case is "due soon" inside this many hours of its SLA deadline (review.ts's slaState()).
REVIEW_DUE_SOON_HOURS: Final = 12
# Pipeline verdicts below this confidence open a `low-confidence` review case
# (review.ts REASON_META: "The AI was less than 60% confident").
LOW_CONFIDENCE_THRESHOLD: Final = 60
# A review decision needs a written justification of at least this length (FR-REVIEW-03;
# openapi.yaml's decideCase body, minLength 10).
REVIEW_JUSTIFICATION_MIN: Final = 10
# User reports ("report an issue") on one verdict that open a `user-reports` case. ADR 0002.
USER_REPORTS_CASE_THRESHOLD: Final = 5

# ---- Auth (FR-AUTH; apps/web/lib/auth.ts) ----

PASSWORD_MIN_LENGTH: Final = 12  # FR-AUTH-04
BCRYPT_ROUNDS: Final = 12  # ADR 0002
TWO_FACTOR_ROLES: Final = frozenset({"expert", "admin"})  # FR-AUTH-05: always on for these

OTP_LENGTH: Final = 6  # openapi.yaml: codes match ^\d{6}$
OTP_TTL_SECONDS: Final = 10 * 60  # ADR 0002
OTP_MAX_ATTEMPTS: Final = 5  # ADR 0002
OTP_RESEND_COOLDOWN_SECONDS: Final = 30  # openapi.yaml resendTwoFactor: "30 s cooldown"

# Failed sign-ins per identifier (and per IP) before a 429 (ADR 0002, approved 23 Sep 2026).
SIGN_IN_MAX_FAILURES: Final = 5
SIGN_IN_LOCKOUT_WINDOW_SECONDS: Final = 15 * 60

SESSION_TTL_REMEMBER_SECONDS: Final = 30 * 24 * 3600  # ADR 0002
SESSION_TTL_SECONDS: Final = 12 * 3600  # ADR 0002, `remember: false`

# ---- Submissions (FR-SUBMIT; openapi.yaml SubmissionInput) ----

MAX_MEDIA_BYTES: Final = 50 * 1024 * 1024  # "Up to 50 MB; image/audio/video."
TEXT_MIN_CHARS: Final = 20
TEXT_MAX_CHARS: Final = 5_000
ARTICLE_MIN_CHARS: Final = 50
ARTICLE_MAX_CHARS: Final = 20_000
HEADLINE_MAX_CHARS: Final = 200

# ---- Partner API (FR-API-01/02; /developers) ----

PARTNER_RATE_LIMIT_PER_HOUR: Final = 100
API_KEY_ROLES: Final = frozenset({"journalist", "admin"})  # FR-API-02

# ---- AI retraining (FR-ADMIN-06; apps/web/lib/mock/admin.ts DEFAULT_SETTINGS) ----

RETRAINING_CADENCE: Final = "weekly"
RETRAINING_MIN_CCS: Final = 85
