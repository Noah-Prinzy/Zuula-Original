# Zuula — Sitemap & Navigation

Status: **v0.2 (approved)** — 21 Sep 2026.

## 1. Pages

### Public (site layout)
| Name | Route | Access | Spec |
|---|---|---|---|
| Home | `/` | Everyone | FR-SEARCH-05, FR-RATE-10 |
| Verify | `/verify` | Everyone (CAPTCHA when signed out) | FR-SUBMIT, FR-AUTH-07 |
| Status | `/submissions/[trackingId]` | Anyone with the tracking ID | FR-SUBMIT-06, FR-DETECT-07 |
| Library | `/fact-checks` | Everyone | FR-SEARCH-01–04 |
| Report | `/fact-checks/[id]` | Everyone; rating requires sign-in | FR-DETECT, FR-EXPLAIN, FR-RATE, FR-REVIEW-04 |
| About | `/about` | Everyone (includes FAQ) | §10.3, §11 |
| API | `/developers` | Everyone | FR-API |
| Privacy · Terms | `/legal/privacy`, `/legal/terms` | Everyone | §10.1 |
| Offline | `/offline` | Everyone (PWA fallback) | §7.3 |

### Authentication (centered layout)
| Name | Route | Spec |
|---|---|---|
| Sign In | `/sign-in` | FR-AUTH-01 |
| Sign Up | `/sign-up` | FR-AUTH-01 |
| Verify Account | `/sign-up/verify` | FR-AUTH-03 |
| Two-Factor | `/sign-in/two-factor` | FR-AUTH-05 (Expert, Admin) |
| Forgot Password · Reset Password | `/forgot-password`, `/reset-password` | FR-AUTH-06 |

### Account (sidebar layout)
| Name | Route | Access | Spec |
|---|---|---|---|
| Profile | `/account` | All signed-in | FR-AUTH, §10.1 |
| Activity | `/account/activity` | All signed-in | FR-SUBMIT-07, FR-NOTIFY-03 |
| Notifications | `/account/notifications` | All signed-in | FR-NOTIFY |
| Alerts | `/account/alerts` | All signed-in | FR-NOTIFY-01, 04 |
| Accreditation | `/account/verification` | Public User, Journalist | FR-AUTH-02, FR-RATE-06 |
| API Keys | `/account/api-access` | Journalist, Admin | FR-API-02 |

### Review (sidebar layout, Expert + Admin)
| Name | Route | Spec |
|---|---|---|
| Overview | `/review` | FR-REVIEW |
| Queue | `/review/queue` | FR-REVIEW-01, 06 |
| Case | `/review/cases/[id]` | FR-REVIEW-02–05, FR-EXPLAIN-08 |
| History | `/review/history` | FR-REVIEW-03 |

### Admin (sidebar layout, Admin)
| Name | Route | Spec |
|---|---|---|
| Overview | `/admin` | FR-ADMIN-01, §13 |
| Users | `/admin/users` | FR-ADMIN-02 |
| Moderation | `/admin/moderation` | FR-RATE-07 |
| Sources | `/admin/sources` | FR-ADMIN-03 |
| Broadcasts | `/admin/broadcasts` | FR-ADMIN-05 |
| Reports | `/admin/reports` | FR-ADMIN-04 |
| Audit Log | `/admin/audit-log` | FR-ADMIN-07 |
| Settings | `/admin/configuration` | FR-ADMIN-06 |

## 2. Navigation
- **Header:** Verify · Library · About · Review (Expert, Admin) · Admin (Admin). Right: Search (Ctrl K) · Language · Theme · Notifications · Sign In / Sign Up or user menu.
- **User menu:** Review · Admin (by role) · Activity · Notifications · Profile · Sign Out.
- **Sidebar:** Review · Admin · Account (filtered by role), Back to site, user card.
- **Footer:** Product · Organisation · Legal.
- **Mobile:** header → slide-out menu; sidebar → drawer.

## 3. Main flows
1. **Verify:** Verify → Status (live progress) → Report → rate · share · report issue.
2. **Discover:** Home feed or Library → Report.
3. **Review:** Notification or Queue → Case → confirm/override → Report shows "Human Verified".
4. **Sign up:** Sign Up → Verify Account → (Two-Factor for Expert/Admin) → return to previous page.

## 4. Build status
Updated 21 Sep 2026. All pages run on mock data (`apps/web/lib/mock`); there is no backend yet.

| Area | Built | In progress | Placeholder |
|---|---|---|---|
| Public | Home, Verify, Status, Library, Report | — | About, API, Privacy, Terms, Offline |
| Authentication | All 6 | — | — |
| Account | All 6 | — | — |
| Review | Case | Overview, Queue, History | — |
| Admin | — | — | All 8 |

Not yet done across all pages: translations for the 5 languages (the switcher only stores the chosen locale), PWA manifest and service worker, accessibility and Lighthouse pass.
