# ADR 0003: LanguageProvider (P3 scaffolding, Sunbird deferred to P4)

**Status:** Scaffolding only. The interface and a stub exist; the real Sunbird AI
integration is P4 (the AI engine), same as the real `AnalysisProvider`. Nothing in the
running app calls this yet. See "Not wired in yet" below.

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

## Not wired in yet

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

## Open questions (flagged, not decided)

- **Sunbird access.** Whether Zuula has Sunbird API access, and on what terms, is a question
  for Noah. The settings are placeholders until that's known.
- **Which report fields get translated back.** Probably `summary`, `whatIsFalse`,
  `whatIsTrue` and the claim text. Maybe not citation titles, which are the sources' own
  words. There's also whether the original-language and English versions are both stored.
  That touches the `fact_check_reports` schema (ADR 0002), so it isn't decided here.
- **What happens with `other`.** Reject the submission, analyse it untranslated, or send it
  to human review? The spec doesn't say.
- **Code-switching.** `also_contains` reports it. Whether a Luganda-English message is
  translated as a whole or segment by segment depends on what Sunbird supports.
- **Data protection.** Sunbird is a Ugandan organisation, which may make §10.1 easier than
  it is for a hosted LLM. That still needs confirming, like `ANALYSIS_PROVIDER_REGION`.
