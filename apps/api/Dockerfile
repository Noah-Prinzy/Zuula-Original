FROM python:3.12-slim

WORKDIR /app

# asyncpg and pgvector ship manylinux wheels, so no compiler or libpq is needed.
COPY pyproject.toml alembic.ini ./
COPY app ./app
COPY migrations ./migrations

RUN pip install --no-cache-dir .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
