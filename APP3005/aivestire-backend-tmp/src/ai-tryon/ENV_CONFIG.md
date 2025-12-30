# 3D Try-On Service - Environment Configuration

## Required Environment Variables

Add the following environment variables to your `.env` file:

```env
# FastAPI Vertex AI endpoint (for try-on without background)
FASTAPI_VERTEX_URL=http://localhost:8000/vertex/try-on

# FastAPI Gemini AI endpoint (for try-on with background)
FASTAPI_GEMINI_URL=http://localhost:8000/gemini/try-on

# FastAPI Gemini AI endpoint for angle generation
FASTAPI_GEMINI_ANGLES_URL=http://localhost:8000/gemini/generate-angles
```

## Service URLs

### Development (Local)
- **Vertex Try-On**: `http://localhost:8000/vertex/try-on`
- **Gemini Try-On**: `http://localhost:8000/gemini/try-on`
- **Gemini Angles**: `http://localhost:8000/gemini/generate-angles`

### Production
Replace `localhost:8000` with your deployed FastAPI service URL.

## Testing the Configuration

Use the health check endpoint to verify your configuration:

```bash
GET http://localhost:3000/api/v1/tryon/health
```

Expected response:
```json
{
  "healthy": true,
  "geminiAI": {
    "available": true,
    "configured": true,
    "message": "FastAPI service URL: http://localhost:8000/gemini/try-on"
  },
  "vertexAI": {
    "available": true,
    "configured": true,
    "message": "FastAPI service URL: http://localhost:8000/vertex/try-on"
  },
  "timestamp": "2025-12-29T18:00:00.000Z"
}
```

## Notes

- Ensure your FastAPI server is running before starting the NestJS backend
- The FastAPI server should be accessible from the NestJS backend
- Default timeout for try-on requests is 60 seconds
