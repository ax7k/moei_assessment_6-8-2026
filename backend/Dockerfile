# ── Backend Dockerfile ────────────────────────────────────────────────────
# Uses uv for fast, reproducible installs.
FROM python:3.11-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files first for better layer caching
COPY pyproject.toml uv.lock* ./
COPY .env.example .env.example

# Install dependencies (no project install, just deps)
RUN uv sync --no-install-project --frozen 2>/dev/null || uv sync --no-install-project

# Copy source code
COPY . .

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
