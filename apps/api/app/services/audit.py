"""The audit log writer (FR-ADMIN-07, FR-REVIEW-03). ADR 0002 §2.

Call `record()` inside the same transaction as the action it describes, before committing,
so an action and its audit entry are written together or not at all. The table itself is
append-only (a database trigger rejects UPDATE/DELETE).
"""

import ipaddress

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AuditLogEntry
from app.schemas.account import UserProfile
from app.services.auth import client_ip


def truncate_ip(ip: str | None) -> str:
    """`196.43.12.7` -> `196.43.x.x`, `2001:db8:1::5` -> `2001:db8:x:x`. §10.1 data
    minimisation: enough to spot a pattern (same network), not enough to identify a person.
    The full address is never stored."""
    if not ip:
        return ""
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return ""
    if addr.version == 4:
        a, b, *_ = str(addr).split(".")
        return f"{a}.{b}.x.x"
    first, second = addr.exploded.split(":")[:2]
    return f"{first.lstrip('0') or '0'}:{second.lstrip('0') or '0'}:x:x"


def record(
    db: AsyncSession,
    *,
    actor: UserProfile,
    action: str,
    target: str,
    detail: str = "",
    request: Request | None = None,
) -> AuditLogEntry:
    entry = AuditLogEntry(
        actor_id=actor.id,
        actor_name=actor.name,
        actor_role=actor.role,
        action=action,
        target=target,
        detail=detail,
        ip=truncate_ip(client_ip(request)) if request else "",
    )
    db.add(entry)
    return entry
