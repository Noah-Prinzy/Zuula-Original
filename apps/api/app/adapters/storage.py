"""S3-compatible object storage — where a media submission's uploaded file would live.
Interface + a stub that stores nothing and returns a deterministic fake URL; no request to
S3_ENDPOINT_URL happens in P2.
"""

from typing import Protocol


class ObjectStorage(Protocol):
    def put(self, *, key: str, data: bytes, content_type: str) -> str:
        """Store `data` under `key`; returns the stored object's URL."""
        ...


class StubObjectStorage:
    def put(self, *, key: str, data: bytes, content_type: str) -> str:
        return f"https://stub-storage.zuula.ug/{key}"


def get_object_storage() -> ObjectStorage:
    return StubObjectStorage()
