# ── Stage 1: Builder ──────────────────────────────────────────────────────────
# Separate build stage keeps the final image lean
FROM python:3.12-slim AS builder
WORKDIR /app
# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*
# Copy and install dependencies first (Docker layer cache)
# If requirements.txt doesn't change, this layer is reused on every build
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime
WORKDIR /app
# Runtime system deps only (no gcc needed at runtime)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*
# Copy installed packages from builder — not re-installing
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
# Copy application code
COPY . .
# Non-root user — never run web apps as root in production
RUN adduser --disabled-password --no-create-home appuser
USER appuser
# Expose the port uvicorn will bind to
EXPOSE 8000
# Health check — Docker/Render will restart the container if this fails
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
# Start command — single worker for Render free tier, increase for paid
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]