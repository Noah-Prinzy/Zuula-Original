"""The one error envelope used everywhere, matching openapi.yaml's ErrorEnvelope schema and
the /developers docs (`{"error": {"code", "message", "retryAfter?"}}`).
"""

from typing import Literal

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel

ErrorCode = Literal[
    "bad_request",
    "unauthorized",
    "forbidden",
    "not_found",
    "file_too_large",
    "unsupported_media",
    "invalid_content",
    "rate_limited",
    "server_error",
]

_STATUS_FOR_CODE: dict[ErrorCode, int] = {
    "bad_request": 400,
    "unauthorized": 401,
    "forbidden": 403,
    "not_found": 404,
    "file_too_large": 413,
    "unsupported_media": 415,
    "invalid_content": 422,
    "rate_limited": 429,
    "server_error": 500,
}


class ApiError(Exception):
    """Raise this from any route/dependency; the handler below turns it into an ErrorEnvelope."""

    def __init__(self, code: ErrorCode, message: str, *, retry_after: int | None = None):
        self.code = code
        self.message = message
        self.retry_after = retry_after
        self.status_code = _STATUS_FOR_CODE[code]
        super().__init__(message)


class _ErrorBody(BaseModel):
    code: ErrorCode
    message: str
    retry_after: int | None = None

    model_config = {"populate_by_name": True}


def _envelope(err: ApiError) -> dict:
    body: dict = {"code": err.code, "message": err.message}
    if err.retry_after is not None:
        body["retryAfter"] = err.retry_after
    return {"error": body}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def _handle_api_error(_: Request, exc: ApiError) -> JSONResponse:
        headers = {"Retry-After": str(exc.retry_after)} if exc.retry_after is not None else None
        return JSONResponse(status_code=exc.status_code, content=_envelope(exc), headers=headers)

    @app.exception_handler(RequestValidationError)
    async def _handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "invalid_content",
                    "message": "; ".join(str(e["msg"]) for e in exc.errors()) or "Invalid request.",
                }
            },
        )
