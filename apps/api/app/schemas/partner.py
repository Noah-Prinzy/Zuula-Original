from datetime import datetime

from app.schemas.common import CamelModel, ErrorEnvelope
from app.schemas.fact_check import FactCheckPublic, FactCheckSearchItem


class PartnerCheckStatus(CamelModel):
    tracking_id: str
    status: str  # queued | processing | completed | failed
    submitted_at: datetime
    completed_at: datetime | None = None
    result: FactCheckPublic | None = None
    error: ErrorEnvelope | None = None


class PartnerSearchResponse(CamelModel):
    data: list[FactCheckSearchItem]
    page: int
    per_page: int
    total: int
