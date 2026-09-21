# Zuula — UI Component Inventory

Source library: [shadcn/ui](https://ui.shadcn.com) (Radix UI primitives, Tailwind CSS).
Status: **v0.2** — 21 Sep 2026. Theme: shadcn preset `b20twYRDfO`. Fonts: Raleway (headings), Geist (body), Lora (serif), Geist Mono. Icons: Remix Icon.

Built so far: all atoms and molecules listed below are installed in `apps/web/components/ui`, and all Zuula components for verdicts, community rating, submission and discovery are built. Review components are built; admin components (`UserManagementTable`, `SourceManager`, `ThresholdEditor`, `BroadcastComposer`, `AuditLogTable`, `MetricCard`, `TrendChart`) are in progress.

Tiers:
- **Atoms** — single-purpose shadcn primitives, used everywhere.
- **Molecules** — shadcn composites.
- **Zuula components** — our own, built from atoms/molecules for Zuula-specific features.
- **Blocks** — full page sections from shadcn blocks.

---

## 1. Atoms (shadcn)

| Component | Used for |
|---|---|
| Button | All actions (Check Now, Review, Override, Save) |
| Badge | Verdict labels, roles, statuses, SLA state |
| Input | Text/URL/email/phone fields |
| Textarea | Text submission, rating comments, reviewer notes, override justification |
| Label | Form labels |
| Checkbox | Terms/privacy consent, table row selection |
| Radio Group | Verdict choice in expert override, report reasons |
| Switch | Topic alert subscriptions, notification preferences, 2FA toggle |
| Slider | Admin rating-threshold configuration (CCS %, rating counts) |
| Select | Language, role, verdict filters |
| Native Select | Mobile-friendly filters on small screens |
| Separator | Section dividers |
| Skeleton | Loading states (feed, verdicts, tables) |
| Spinner | Inline loading (buttons, analysis steps) |
| Progress | File upload progress, analysis pipeline progress |
| Avatar | User menu, reviewer identity in audit logs |
| Kbd | Search shortcut hint (Ctrl K) |
| Tooltip | Icon buttons, score explanations |
| Typography | Headings, body text, explanation prose |
| Aspect Ratio | Image/video previews of submitted media |

## 2. Molecules (shadcn)

| Component | Used for |
|---|---|
| Card | Verdict summary, fact-check result cards, stat cards |
| Alert | Emergency broadcasts, "Community questions this verdict", suspended-verdict notice |
| Alert Dialog | Destructive confirmations (suspend user, remove content, delete data) |
| Dialog | Review detail, override verdict, share verdict, report issue |
| Sheet | Mobile nav, search filter panel, admin detail side panels |
| Drawer | Mobile bottom sheets (rating comment, filters) |
| Tabs | Submission type (Text / URL / Media / Article), admin sections, verdict detail sections |
| Accordion | FAQs, "How we reached this verdict" details, source list expanders |
| Collapsible | Expandable claim explanations, AI-signal details |
| Hover Card | Hover a highlighted claim to see why it was flagged; source previews |
| Popover | Notification tray, date-range picker, share menu |
| Dropdown Menu | User menu, table row actions, language switcher |
| Navigation Menu | Public top navigation |
| Breadcrumb | Dashboard/admin page hierarchy |
| Pagination | Search results, admin tables |
| Command | Global search with autocomplete of trending topics (FR-SEARCH-02) |
| Combobox | Filtering by category/source/topic |
| Calendar + Date Picker | Date-range search filter, report periods |
| Input OTP | SMS/email OTP verification, 2FA code |
| Input Group | Search bar with icon, URL input with "Fetch" button, API key with copy button |
| Field | Consistent form field layout + validation messages (with react-hook-form) |
| Button Group | Thumbs up / thumbs down rating pair, share options |
| Toggle Group | Verdict-type quick filters, list/grid view switch |
| Table | Simple tables (citations, API usage) |
| Data Table | Review queue, users, sources, audit log, moderation (sorting, filters, pagination) |
| Chart | Admin metrics, misinformation trends, verdict distribution |
| Sidebar | Reviewer dashboard and admin shell |
| Scroll Area | Live feed, notification list, long explanations |
| Empty | "No results", empty review queue, no notifications |
| Item | List rows: feed items, notifications, sources, sessions |
| Attachment | Uploaded media file display with upload state (FR-SUBMIT-01/05) |
| Toast (Sonner) | Success/error feedback ("Rating saved", "Copied tracking ID") |
| Carousel | Optional: trending / most-debated stories on the homepage |

### Not needed now
Bubble, Message, Message Scroller, Marker, Questionnaire (chat/agent UI), Context Menu, Menubar, Resizable, Direction (RTL). Revisit Message/Bubble if we add an in-app chat version of the WhatsApp bot.

---

## 3. Zuula components (custom, built on the above)

### Verdict & explanation (FR-DETECT, FR-EXPLAIN)
| Component | Built from | Purpose |
|---|---|---|
| `VerdictBadge` | Badge | 5 variants: Authentic, Likely False, False, AI-Generated, Unverifiable (colour + icon, not colour alone) |
| `ConfidenceMeter` | SVG ring / Progress | AI confidence 0–100% |
| `ClaimHighlighter` | Hover Card, Typography | Highlights flagged sentences with the reason on hover/tap |
| `CitationCard` | Card, Item | Source name, article title, date, direct URL |
| `WhatIsTrueCard` | Card, Alert | "What is True" vs "What is False" summary |
| `AISignalsList` | Collapsible, Progress | Which AI-detection signals fired (perplexity, metadata, etc.) |
| `HumanVerifiedBadge` | Badge, Tooltip | Shown when an expert overrode/confirmed the verdict |
| `ExpertAnnotation` | Card, Avatar | Manual notes added by Expert Reviewers |

### Community rating (FR-RATE)
| Component | Built from | Purpose |
|---|---|---|
| `RatingButtons` | Button Group, Tooltip | Accurate / Inaccurate, one vote per user, changeable |
| `RatingCommentForm` | Drawer/Dialog, Textarea | Optional reason for rating |
| `CCSMeter` | Progress, Badge | Community Confidence Score with like/dislike counts |
| `CommunityStatusBanner` | Alert, Badge | Community Verified / Community Questions This Verdict / Under Expert Review / Suspended |

### Submission (FR-SUBMIT)
| Component | Built from | Purpose |
|---|---|---|
| `SubmissionComposer` | Tabs, Textarea, Input Group, Attachment, Select | Text / URL / Media / Article input with language choice |
| `MediaDropzone` | Attachment, Progress | Drag & drop, type/size (50 MB) validation |
| `CaptchaField` | — (Cloudflare Turnstile) | Anonymous submissions |
| `AnalysisProgress` | Progress, Spinner, Item | Live pipeline steps (extract → claims → sources → verdict) |
| `TrackingIdChip` | Badge, Button, Toast | Copyable tracking ID |

### Discovery (FR-SEARCH)
| Component | Built from | Purpose |
|---|---|---|
| `GlobalSearch` | Command, Kbd | Search + autocomplete of trending topics |
| `SearchFilters` | Sheet, Select, Date Picker, Toggle Group | Keyword, date range, verdict, category |
| `FactCheckCard` | Card, VerdictBadge, CCSMeter | Result/feed item |
| `LiveFeed` | Scroll Area, FactCheckCard | Recently verified & most debated |
| `Leaderboard` | Card, Item | Most accurately rated stories |

### Review & admin (FR-REVIEW, FR-ADMIN)
| Component | Built from | Purpose |
|---|---|---|
| `ReviewQueueTable` | Data Table | Flagged items with verdict, CCS, SLA |
| `SLAIndicator` | Badge, Tooltip | Under 24h / 24–48h / Overdue |
| `OverrideDialog` | Dialog, Radio Group, Textarea | Override with mandatory justification |
| `UserManagementTable` | Data Table, Dropdown Menu | Activate, suspend, change role |
| `SourceManager` | Data Table, Dialog | Add/update/remove trusted sources |
| `ThresholdEditor` | Slider, Field | Configure escalation thresholds |
| `BroadcastComposer` | Dialog, Textarea, Alert | Emergency misinformation broadcast |
| `AuditLogTable` | Data Table, Avatar | Admin/expert action history |
| `MetricCard` | Card, Chart | KPIs (accuracy, MAU, delivery time) |
| `TrendChart` | Chart | Misinformation trends, monthly reports |

### App shell & account
| Component | Built from | Purpose |
|---|---|---|
| `SiteHeader` / `SiteFooter` | Navigation Menu, Sheet | Public pages |
| `AppSidebar` | Sidebar | Reviewer/admin shell |
| `RoleGate` | — | Show/hide by role (Public, Journalist, Expert, Admin) |
| `LanguageSwitcher` | Dropdown Menu | EN, Luganda, Acholi, Runyankole, Ateso |
| `ThemeToggle` | Dropdown Menu | Light / dark / system |
| `NotificationBell` | Popover, Scroll Area, Item | In-app notifications |
| `TopicSubscriptions` | Switch, Item | Alerts for Health, Politics, Elections, etc. |
| `ApiKeyCard` | Card, Input Group | Partner API key management |
| `OfflineBanner` | Alert | Low-connectivity / offline mode notice |
| `EmptyState` | Empty | Consistent empty screens |

---

## 4. Blocks (shadcn)

| Block | Zuula screen |
|---|---|
| `dashboard-01` | Admin dashboard (sidebar + charts + data table) |
| `sidebar-07` | Reviewer/admin shell (collapses to icons) |
| `login-04` / `login-03` | Login (form + image / muted background) |
| `signup-04` / `signup-03` | Registration (matching the chosen login) |

## 5. Outside shadcn (public marketing pages only)

PrebuiltUI / ReactJSTemplates offer Tailwind landing-page templates and sections (hero, features, FAQ, footer, testimonials). They do not cover app screens. Use: borrow individual sections for Home/About/FAQ if they speed things up, restyled to Zuula tokens. Check each template's licence before copying.
