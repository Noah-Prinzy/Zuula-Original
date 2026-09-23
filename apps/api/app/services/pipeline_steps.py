"""The submission pipeline's step sequences and timings. They mirror apps/web/lib/analysis.ts's
PIPELINES and STEPS exactly, so the Status page renders the same steps it always has.

Kept apart from app/worker/pipeline.py (which re-exports them) so request-side code can use
them without importing the Celery worker package.
"""

# Mirrors apps/web/lib/analysis.ts's PIPELINES map exactly.
PIPELINES: dict[str, list[str]] = {
    "text": ["received", "language", "claims", "sources", "ai", "report"],
    "url": ["received", "fetch", "language", "claims", "sources", "ai", "report"],
    "article": ["received", "language", "claims", "sources", "ai", "report"],
    "media": ["received", "scan", "media", "transcribe", "claims", "sources", "report"],
}

# Mirrors apps/web/lib/analysis.ts's STEPS[*].seconds exactly.
STEP_SECONDS: dict[str, float] = {
    "received": 0.6,
    "scan": 1.5,
    "fetch": 1.8,
    "transcribe": 2.5,
    "media": 3.0,
    "language": 0.8,
    "claims": 1.5,
    "sources": 2.5,
    "ai": 1.2,
    "report": 1.2,
}
