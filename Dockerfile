# ======== Builder Stage ========
# This stage installs dependencies, including build-time tools.
FROM python:3.11-slim AS builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install OS-level dependencies needed for building python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# Install python dependencies
RUN pip install --upgrade pip
COPY backend/requirements.txt .
# ---- The Fix is here: Removed '--no-deps' ----
RUN pip install -r requirements.txt


# ======== Final Stage ========
# This stage creates the final, lean production image.
FROM python:3.11-slim AS final

WORKDIR /app

# Copy only the runtime OS dependencies from the builder stage
# For psycopg2, we need the PostgreSQL client library (libpq.so.5)
COPY --from=builder /usr/lib/x86_64-linux-gnu/libpq.so.5 /usr/lib/x86_64-linux-gnu/

# Copy the installed python packages from the builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy your application code
# Note: We copy the contents of 'backend' into the container's '/app' directory
COPY backend/ .

# Expose the port the app runs on
ENV PORT=8080
EXPOSE 8080

# Healthcheck to ensure the API is responsive
# Important: Make sure you have a '/healthz' endpoint in your FastAPI app!
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD [ "curl", "-f", "http://localhost:8080/healthz" ] || exit 1

# Run the application
# We no longer need '--chdir backend' because we copied the code into /app
CMD ["gunicorn", "api:app", "-k", "uvicorn.workers.UvicornWorker", "-w", "2", "-b", "0.0.0.0:8080"]