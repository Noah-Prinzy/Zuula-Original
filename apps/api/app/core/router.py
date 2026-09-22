from typing import Any

from fastapi import APIRouter as _FastAPIRouter


class APIRouter(_FastAPIRouter):
    """`fastapi.APIRouter`, but every route defaults `response_model_exclude_none=True`.

    Matches how apps/web/lib/types/*.ts treats optional fields (`field?: T`, key absent)
    rather than an explicit `null` — and how openapi.yaml declares them (plain, non-nullable
    types). Without this, FastAPI's automatic response_model serialization emits `null` for
    every unset Optional field, which the OpenAPI contract then rejects.
    """

    def add_api_route(self, path: str, endpoint: Any, **kwargs: Any) -> None:
        # FastAPI's own `@router.get(...)` etc. decorators always pass
        # response_model_exclude_none explicitly (default False), so a plain `setdefault`
        # here would never see a missing key — force it instead.
        kwargs["response_model_exclude_none"] = True
        super().add_api_route(path, endpoint, **kwargs)
