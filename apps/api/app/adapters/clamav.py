"""ClamAV malware scanning — the pipeline's "scan" step (app/worker/pipeline.py) for media
submissions. Interface + a stub that always reports clean — no socket to CLAMAV_HOST opens
in P2.
"""

from dataclasses import dataclass
from typing import Protocol


@dataclass
class ScanResult:
    clean: bool
    signature: str | None = None


class ClamAvScanner(Protocol):
    def scan(self, data: bytes) -> ScanResult: ...


class StubClamAvScanner:
    def scan(self, data: bytes) -> ScanResult:
        return ScanResult(clean=True)


def get_clamav_scanner() -> ClamAvScanner:
    return StubClamAvScanner()
