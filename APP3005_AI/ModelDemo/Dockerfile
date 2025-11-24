FROM python:3.11-slim

# Install system dependencies for OpenCV and clean up apt cache to keep image small
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libglib2.0-0 libgl1 libsm6 libxrender1 libxext6 && \
    rm -rf /var/lib/apt/lists/*

# Prevent Python from writing .pyc files and enable unbuffered logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install Python dependencies first to leverage Docker layer caching
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application code
COPY app.py .

# Streamlit listens on 8501 by default
EXPOSE 8501

CMD ["streamlit", "run", "app.py", "--server.address=0.0.0.0", "--server.port=8501"]