FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY api.py app.py color_helper.py color_config.py pyproject.toml ./

# DO NOT COPY secrets into image
# (no .env, no key.json copied into container image)

EXPOSE 8000

# Environment variables loaded at runtime
ENV PYTHONUNBUFFERED=1

# These will be populated from docker-compose env_file or environment section
# Declaring them here ensures they're available to the application
ENV VERTEX_TOKEN=""
ENV VERTEX_PROJECT_ID=""
ENV VERTEX_LOCATION="us-central1"
ENV VERTEX_MODEL_ID=""
ENV GEMINI_API_KEY=""
ENV GOOGLE_APPLICATION_CREDENTIALS=""

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
