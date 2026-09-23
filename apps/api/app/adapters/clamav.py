"""ClamAV malware scanning: the pipeline's "scan" step for media submissions.

`ClamdScanner` streams the file to clamd over TCP with the INSTREAM command. It's a small
in-house client because the `clamd` package is unmaintained. Scanning fails closed: if
clamd can't be reached or refuses the stream, `ScanError` is raised and the submission
fails instead of skipping the scan. clamd's StreamMaxLength (25 MB by default) must be at
least MAX_MEDIA_BYTES (50 MB), or large files fail the scan. Without CLAMAV_HOST, the stub
reports every file clean.
"""

import asyncio
import struct
from dataclasses import dataclass
from typing import Protocol

from app.adapters.readiness import configured
from app.core.config import get_adapters_settings

_CHUNK = 64 * 1024


class ScanError(Exception):
    pass


@dataclass
class ScanResult:
    clean: bool
    signature: str | None = None


class ClamAvScanner(Protocol):
    async def scan(self, data: bytes) -> ScanResult: ...


class StubClamAvScanner:
    async def scan(self, data: bytes) -> ScanResult:
        return ScanResult(clean=True)


class ClamdScanner:
    def __init__(self, *, host: str, port: int, timeout: float = 60.0):
        self._host = host
        self._port = port
        self._timeout = timeout

    async def scan(self, data: bytes) -> ScanResult:
        try:
            reply = await asyncio.wait_for(self._instream(data), self._timeout)
        except (OSError, TimeoutError) as exc:
            raise ScanError(f"Couldn't reach clamd at {self._host}:{self._port}.") from exc
        return parse_reply(reply)

    async def _instream(self, data: bytes) -> bytes:
        reader, writer = await asyncio.open_connection(self._host, self._port)
        try:
            # "z" prefix: null-terminated command and reply. Each chunk is length-prefixed
            # (4 bytes, big-endian), and a zero length ends the stream.
            writer.write(b"zINSTREAM\0")
            for start in range(0, len(data), _CHUNK):
                chunk = data[start : start + _CHUNK]
                writer.write(struct.pack("!L", len(chunk)) + chunk)
                await writer.drain()
            writer.write(struct.pack("!L", 0))
            await writer.drain()
            return await reader.readuntil(b"\0")
        finally:
            writer.close()
            await writer.wait_closed()


def parse_reply(reply: bytes) -> ScanResult:
    """clamd's answer: `stream: OK`, `stream: <signature> FOUND`, or `... ERROR`."""
    text = reply.rstrip(b"\0").decode(errors="replace").strip()
    _, _, verdict = text.partition(": ")
    if verdict == "OK":
        return ScanResult(clean=True)
    if verdict.endswith(" FOUND"):
        return ScanResult(clean=False, signature=verdict.removesuffix(" FOUND"))
    raise ScanError(f"clamd couldn't scan the file: {text}")


def get_clamav_scanner() -> ClamAvScanner:
    if configured("clamav"):
        settings = get_adapters_settings()
        return ClamdScanner(host=settings.clamav_host, port=settings.clamav_port)
    return StubClamAvScanner()
