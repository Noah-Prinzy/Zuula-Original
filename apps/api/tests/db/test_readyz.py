"""/readyz answers 200 only while PostgreSQL and Redis both do."""

import json

from app.main import readyz


async def test_ready_when_database_and_redis_answer(db):
    response = await readyz(db)
    assert response.status_code == 200
    assert json.loads(response.body)["checks"] == {"app": "ok", "database": "ok", "redis": "ok"}


async def test_503_names_what_is_down(db, monkeypatch):
    class Down:
        async def ping(self):
            raise ConnectionError("redis is down")

    monkeypatch.setattr("app.main.redis_client.get_async_redis", lambda: Down())
    response = await readyz(db)
    assert response.status_code == 503
    body = json.loads(response.body)
    assert body["status"] == "unavailable" and body["checks"]["redis"] == "unavailable"
