"""AnalysisProvider: the interface between the submission pipeline (app/worker/pipeline.py)
and whatever actually produces a verdict. P2 ships only a stub — the real hosted-LLM /
Sunbird AI (Ugandan languages) / Whisper / RoBERTa AI-text detector / deepfake-detection
engine is P4 (see the P2 brief's phase table). Kept behind this interface, with the provider
and its region switchable via ANALYSIS_PROVIDER / ANALYSIS_PROVIDER_REGION, because sending
submissions to a hosted LLM outside Uganda is an open §10.1 data-protection question (see
docs/adr/0001-api-architecture.md).
"""

import zlib
from dataclasses import dataclass, field
from typing import Protocol

from app.core.config import get_analysis_settings
from app.db.sample_data.fact_checks import SAMPLE_REPORTS
from app.schemas.fact_check import AISignal, Citation, Claim


@dataclass
class AnalysisResult:
    title: str
    verdict: str
    confidence: int
    summary: str
    category: str
    what_is_false: list[str] = field(default_factory=list)
    what_is_true: list[str] = field(default_factory=list)
    claims: list[Claim] = field(default_factory=list)
    citations: list[Citation] = field(default_factory=list)
    ai_signals: list[AISignal] = field(default_factory=list)


class AnalysisProvider(Protocol):
    def analyze(self, *, content_type: str, text: str, language: str) -> AnalysisResult:
        """Given the submission's content, produce the analysis half of a FactCheckReport
        (everything but the identity/timing/community fields the pipeline fills in itself)."""
        ...


class StubAnalysisProvider:
    """P2 stand-in: deterministically maps an input to one of the existing sample reports'
    analysis (verdict, claims, citations, ...) — the shape a real provider's output would
    have, without doing any real analysis. The same (content_type, text) always maps to the
    same sample (crc32, not Python's randomized str hash, so it's stable across processes —
    the pipeline runs in a separate worker process from whatever calls it), so demoing the
    same input twice gives a stable result."""

    def analyze(self, *, content_type: str, text: str, language: str) -> AnalysisResult:
        digest = zlib.crc32(f"{content_type}:{text}".encode())
        sample = SAMPLE_REPORTS[digest % len(SAMPLE_REPORTS)]
        return AnalysisResult(
            title=sample.title,
            verdict=sample.verdict,
            confidence=sample.confidence,
            summary=sample.summary,
            category=sample.category,
            what_is_false=sample.what_is_false,
            what_is_true=sample.what_is_true,
            claims=sample.claims,
            citations=sample.citations,
            ai_signals=sample.ai_signals,
        )


_PROVIDERS: dict[str, type[AnalysisProvider]] = {"stub": StubAnalysisProvider}


def get_analysis_provider() -> AnalysisProvider:
    settings = get_analysis_settings()
    provider_cls = _PROVIDERS.get(settings.analysis_provider)
    if provider_cls is None:
        raise NotImplementedError(
            f"Unknown ANALYSIS_PROVIDER '{settings.analysis_provider}' — P2 only ships "
            "'stub'; P4 adds real providers behind this same interface."
        )
    return provider_cls()
