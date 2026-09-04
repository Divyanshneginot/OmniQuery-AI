# Use official Python lightweight image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies (required for some Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from backend
COPY backend/requirements.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ /app/

# Expose port
EXPOSE 8080

# Run FastAPI with Uvicorn (adapts to cloud platforms like Cloud Run, Render, Railway)
CMD [ sh, -c, uvicorn app.main:app --host 0.0.0.0 --port ]
