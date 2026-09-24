# ADR 0003: LanguageProvider (Sunbird AI)

**Status:** Accepted. First added as scaffolding (#17). The Sunbird AI implementation and the
pipeline wiring landed once Noah had an API key (24 Sep 2026); see "Sunbird implementation"
and "Wired into the pipeline" below. The rest of this record is the original scaffolding
decision. **Amended the same day** by "Translation endpoint moved to `/tasks/translate`"
below: `nllb_translate`, as described in "Sunbird implementation", no longer exists.

## Context

FR-SUBMIT-03 says users can submit content in English, Luganda, Acholi, Runyankole and
Ateso. FR-EXPLAIN-05 says the explanation comes back in the same language as the submitted
content. The spec plans Sunbird AI for the four Ugandan languages, as part of P4.

The pipeline already has a `language` step (`app/worker/pipeline.py`'s `PIPELINES`,
transcribed from `apps/web/lib/analysis.ts`: "Identifying the language and any
code-switching") for text, URL and article submissions. Today that step only sleeps. Nothing
defined the interface Sunbird would sit behind. `AnalysisProvider` was stubbed in P2 for the
same reason (ADR 0001, "AnalysisProvider"): so the rest of the system has something real to
call now, and P4 swaps the implementation without changing callers.

## Decision

`app/providers/language.py` defines a `LanguageProvider` Protocol with two methods, a
deterministic `StubLanguageProvider`, and `get_language_provider()`, which picks an
implementation by `LANGUAGE_PROVIDER`.

- **`detect(text) -> DetectionResult`**: a language code (`en`, `lg`, `ach`, `nyn`, `teo`,
  matching `apps/web/lib/locales.ts`) or `other`, a confidence, and `also_contains` for
  code-switching.
- **`translate(text, source, target) -> TranslationResult`**: covers both directions the
  pipeline needs. Inbound, the submission into `PIVOT_LANGUAGE` (English) for the
  claims/sources/ai steps. Outbound, the finished explanation back into the submission's
  language. It raises `ValueError` for anything outside the five, `other` included.
- **`resolve_submission_language(requested, text, provider)`**: an explicit choice from
  `SubmissionInput.language` is trusted as-is. `auto` goes to `detect()`.

**Provider, not adapter.** ADR 0001 keeps the AI engine (`app/providers/`) apart from the
other external integrations (`app/adapters/`). Sunbird is part of P4's AI engine, so this
follows `AnalysisProvider`. Adapters were also each wired into a call site when they landed;
this one deliberately isn't yet.

**The stub.** `detect()` counts a few hand-picked function words per language. That's
enough to tell the test fixtures apart and to demo the flow. It isn't linguistically
validated, and Luganda and Runyankole share enough vocabulary that it will misfire on real
text. `translate()` returns the text with a visible `[stub-translation xx->yy]` prefix, so a
fake translation can't be mistaken for a real one in a demo or a stored report.

**Settings.** `LanguageSettings` has `LANGUAGE_PROVIDER` (default `stub`), `SUNBIRD_API_URL`
and `SUNBIRD_API_KEY`. Nothing reads the Sunbird fields yet, and there are no HTTP calls to
Sunbird. For now the class lives in `app/providers/language.py`, not `app/core/config.py`,
so this change adds files only while P3 PR 3 is changing files nearby. It should move next to
`AnalysisSettings` (and gain `.env.example` entries) once that PR lands.

## Sunbird implementation (24 Sep 2026)

`SunbirdLanguageProvider` calls Sunbird AI's hosted API (`SUNBIRD_API_URL`, default
`https://api.sunbird.ai`) with `Authorization: Bearer SUNBIRD_API_KEY`:

- **`detect()`**: `POST /tasks/language_id` with `{"text"}`. The answer carries a language
  code (`{"language": "lug"}`; also accepted nested under `output`).
- **`translate()`**: `POST /tasks/nllb_translate` with `{"source_language", "target_language",
  "text"}`. The answer is `output.translated_text`, with `output.Error` set on failure.
- **Codes:** Sunbird uses `eng`, `lug`, `ach`, `nyn`, `teo`; Zuula uses the frontend's `en`,
  `lg`, `ach`, `nyn`, `teo`. The provider maps between them. Sunbird also knows languages
  Zuula doesn't support (Lugbara, `lgg`); those are `other`.
- **Choosing it:** `LANGUAGE_PROVIDER` empty (the default) means Sunbird when
  `SUNBIRD_API_KEY` is set and the stub otherwise, the same real-when-configured rule as
  `app/adapters/`. `stub` or `sunbird` forces one; `sunbird` without a key is an error.
  `LanguageSettings` moved to `app/core/config.py` as planned.
- **Async:** the interface became async (`detect`, `translate`,
  `resolve_submission_language`), like the adapters in ADR 0002, since the pipeline is async
  and the real calls are network I/O.
- **Tests** mock Sunbird with `respx`; nothing calls the real API. The test session removes
  any `SUNBIRD_API_KEY` from its environment so the pipeline tests use the stub.

**Where Sunbird can't do what the stub assumed (flagged):**

- **No confidence.** `language_id` returns a language only, so `DetectionResult.confidence`
  became optional and is `None` from Sunbird.
- **No code-switching.** `language_id` names one language, so `also_contains` is always
  empty from Sunbird, and mixed Luganda-English text is translated as a whole.
- **Length.** The public docs don't state a text limit for `nllb_translate`, and the NLLB
  model behind it translates short passages. Text is sent in whole-sentence chunks of at most
  1,000 characters (an assumption). A 20,000-character article is about 20 requests, against
  a documented rate limit of 50 requests a minute on a standard account.
- **Not verified live.** This build environment can't reach `api.sunbird.ai` or Sunbird's
  docs, so the request and response shapes come from Sunbird's published examples, not from
  a real call. The first deploy with the key should confirm them: submit a Luganda text with
  language `auto` and check the report comes back in Luganda.

## Translation endpoint moved to `/tasks/translate` (24 Sep 2026)

Checked live with the key, `POST /tasks/nllb_translate` now answers HTTP 405, so every
translation through the provider failed (and the pipeline quietly fell back to untranslated
text and English explanations). Sunbird's OpenAPI spec (`/openapi.json`) lists
`POST /tasks/translate` in its place, backed by the sunflower-9b LLM instead of NLLB.
`/tasks/language_id` is unchanged. The "Sunbird implementation" section above records what
was built first and is left as it was; this is what changed:

- **Request:** same body and bearer auth. Codes stay ISO 639-3 (`lug`); `source_language` is
  optional there, but the provider always sends it.
- **Response:** the translation is still `output.translated_text`, with `output.Error` on
  failure. `output.text` echoes the *input*, although the schema calls it the translated
  output, so reading it would silently return the original text. A missing or non-string
  `translated_text` is treated as a failure.
- **Chunking kept.** The spec still gives no maximum length, and documents 503 for an
  inference timeout and 502 for empty model output. The 1,000-character whole-sentence chunks
  stay, still as an assumption rather than a verified limit.
- **LLM behaviour:** short inputs can gain a trailing period, and named `{placeholders}` can be
  translated (`{name}` became `{erinnya}`); numeric `{0}` survived. Submissions and
  explanations carry no placeholders, but templated text would need protecting.
- **Limits:** about 50 requests a minute and a daily quota of roughly 450-500 requests per
  key, both HTTP 429 (`RATE_LIMIT_ERROR`, with `details[].retry_after_seconds`).
  `SunbirdError` now carries `status_code`, and a 429 says it's a rate limit or quota and
  when to retry. The pipeline already treats any provider error as "don't translate", so a
  spent quota degrades to English rather than failing submissions. One submission's
  explanation is several requests (title, summary, each what's-false/true item, each claim
  reason), so the daily quota caps real use at a few dozen translated submissions a day.

## Wired into the pipeline

As planned below, in `app/worker/pipeline.py`:

1. **`language` step:** `resolve_submission_language(...)`. An explicit choice is trusted; `auto`
   is detected. The report stores the display name (`Luganda`), where before it stored the
   raw request value (often `auto`). A URL's content isn't fetched yet (P4), so `auto` on a
   URL is `Other`; media keeps an explicit choice or is `Other` until transcription (P4).
2. **Before `claims`:** text and article submissions in Luganda, Acholi, Runyankole or Ateso are
   translated into English, and the analysis provider is given that English text.
   `submitted_text` keeps what the person wrote.
3. **After analysis:** the title, summary, what's false, what's true and each claim's reason are
   translated into the submission's language (FR-EXPLAIN-05). Citation titles stay as their
   sources wrote them. Only the translated version is stored; there's no English copy.
4. **Failures don't fail the submission.** If detection fails the language is `Other`; if
   translation fails the original text is analysed, or the explanation stays in English. Each
   is logged.

**Left for P4:** claim `start`/`end` offsets index the text the analysis read. Once that is
the English translation, they no longer point into the original `submitted_text`, so P4's
analysis has to map them back (or highlight claims another way).

## Originally: not wired in yet

Connecting this is P3 PR 3's territory (`app/worker/pipeline.py`), so it's left for that
work. The expected shape:

1. In the `language` step, call `resolve_submission_language(language, text, provider)`.
   Today `run_submission_pipeline` passes the raw request value (often `auto`) straight into
   `AnalysisProvider.analyze()` and `FactCheckReport.language`. That's a mismatch this step
   should fix, storing `display_name(code)` on the report.
2. Before `claims`, if the code isn't `PIVOT_LANGUAGE` or `other`, translate the text into
   English for the claims/sources/ai steps.
3. After `analyze()`, translate the user-facing explanation fields back into the
   submission's language (FR-EXPLAIN-05).

`media` submissions have no `language` step. Their language would come from transcription,
which is also P4 (Whisper).

## Open questions

Where each stands after the Sunbird work:

- **Sunbird access.** *Answered:* Noah has a key (24 Sep 2026).
- **Which report fields get translated back.** *Built as:* title, summary, what's false,
  what's true and claim reasons; citation titles stay as written; only the translated
  version is stored. Keeping an English copy too would need a `fact_check_reports` schema
  change (ADR 0002). Still Noah's call whether that's wanted.
- **What happens with `other`.** *Built as:* analysed untranslated, explanation in English.
  Rejecting it or sending it to human review instead is still open; the spec doesn't say.
- **Code-switching.** *Answered by Sunbird's API:* it names one language, so mixed text is
  translated as a whole.
- **Data protection.** Still open. Sunbird is a Ugandan organisation, which may make §10.1
  easier than it is for a hosted LLM, but that needs confirming, like
  `ANALYSIS_PROVIDER_REGION`. Submissions in a Ugandan language, and every explanation
  going back to one, are now sent to Sunbird whenever the key is set.
