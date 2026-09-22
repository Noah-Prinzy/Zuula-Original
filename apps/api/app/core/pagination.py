"""Page-based pagination, matching openapi.yaml's PageMeta and the documented partner
SEARCH_RESPONSE shape ({data, page, perPage, total}) — see the P2 contract summary for why
this is page-based rather than the brief's cursor-pagination default.
"""

from typing import TypeVar

from fastapi import Query
from pydantic import BaseModel

T = TypeVar("T")


class PageParams(BaseModel):
    page: int = 1
    per_page: int = 20


def page_params(page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100)) -> PageParams:
    return PageParams(page=page, per_page=per_page)


def paginate(items: list[T], params: PageParams) -> tuple[list[T], dict]:
    total = len(items)
    start = (params.page - 1) * params.per_page
    page_items = items[start : start + params.per_page]
    meta = {"page": params.page, "perPage": params.per_page, "total": total}
    return page_items, meta
