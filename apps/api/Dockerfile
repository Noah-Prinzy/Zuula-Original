FROM python:3.12-slim

WORKDIR /app

# No compiled dependencies yet (P3 adds psycopg/asyncpg, which may need build-essential/libpq-dev).
COPY pyproject.toml ./
COPY app ./app

RUN pip install --no-cache-dir .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
