# FastAPI Integration Configuration Guide

## Architecture Overview

```
Frontend (React)  →  NestJS Backend  →  FastAPI Services  →  AI APIs
                                        (APP3005_AI)
```

## Flow

1. **Frontend** uploads avatar + clothing images
2. **NestJS** receives request, validates, and forwards to FastAPI
3. **FastAPI** calls Gemini AI or Vertex AI
4. **Result** flows back through the chain

---

## Environment Variables

Add these to your NestJS `.env` file:

```env
# FastAPI Service URLs
FASTAPI_GEMINI_URL=http://localhost:8000/api/tryon/gemini
FASTAPI_VERTEX_URL=http://localhost:8000/api/tryon/vertex

# Optional: If FastAPI is on a different host/port
# FASTAPI_GEMINI_URL=http://192.168.1.100:8000/api/tryon/gemini
# FASTAPI_VERTEX_URL=http://192.168.1.100:8000/api/tryon/vertex
```

---

## FastAPI Expected Request Format

Your FastAPI services should expect this JSON format:

```json
{
  "avatar_image": "base64_string_without_data_uri_prefix",
  "clothing_image": "base64_string_without_data_uri_prefix",
  "additional_params": {
    "quality": "high",
    "style": "realistic"
  }
}
```

## FastAPI Expected Response Format

### Success Response

```json
{
  "success": true,
  "result_image": "base64_string_or_data_uri",
  "processing_time_ms": 3500,
  "metadata": {
    "model": "gemini-1.5-pro",
    "provider": "gemini"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error_code": "RATE_LIMIT_EXCEEDED",
  "message": "API rate limit exceeded",
  "details": {
    "retry_after": 60
  }
}
```

---

## FastAPI Endpoints Required

Your FastAPI server (APP3005_AI) should implement:

### 1. Gemini Try-On
```
POST /api/tryon/gemini
```

### 2. Vertex Try-On
```
POST /api/tryon/vertex
```

### 3. Health Check (Optional but recommended)
```
GET /health
```

Returns:
```json
{
  "status": "healthy",
  "services": {
    "gemini": "available",
    "vertex": "available"
  }
}
```

---

## Testing the Integration

### Step 1: Start FastAPI Server

```bash
cd APP3005_AI
python -m uvicorn main:app --reload --port 8000
```

### Step 2: Start NestJS Backend

```bash
cd aivestire-backend-tmp
npm run start:dev
```

### Step 3: Test Health Check

```bash
curl http://localhost:3000/api/v1/tryon/health
```

Expected response:
```json
{
  "healthy": true,
  "geminiAI": {
    "available": true,
    "configured": true,
    "message": "FastAPI service URL: http://localhost:8000/api/tryon/gemini"
  },
  "vertexAI": {
    "available": true,
    "configured": true,
    "message": "FastAPI service URL: http://localhost:8000/api/tryon/vertex"
  }
}
```

### Step 4: Test Try-On

```bash
curl -X POST http://localhost:3000/api/v1/tryon/gemini \
  -H "Content-Type: application/json" \
  -d '{
    "avatarImage": "data:image/jpeg;base64,/9j/4AAQ...",
    "clothingImage": "data:image/png;base64,iVBORw0KGgo..."
  }'
```

---

## Error Handling

The NestJS backend will automatically:

- ✅ Extract base64 data (removes `data:image/...;base64,` prefix)
- ✅ Forward to FastAPI with clean base64
- ✅ Handle timeouts (60-90 seconds)
- ✅ Retry on transient failures (3 attempts with exponential backoff)
- ✅ Map FastAPI errors to proper HTTP status codes
- ✅ Return user-friendly error messages

---

## Status Code Mapping

| FastAPI Status | NestJS Status | Exception Type |
|----------------|---------------|----------------|
| 200 | 200 | Success |
| 400 | 400 | ImageValidationException |
| 401 | 401 | AIAuthenticationException |
| 429 | 429 | RateLimitException |
| 500 | 500 | AIServiceException |
| 503 | 503 | ServiceUnavailableException |
| 504 | 504 | TimeoutException |

---

## Troubleshooting

### Issue: "FastAPI service is not configured"

**Solution:** Add `FASTAPI_GEMINI_URL` or `FASTAPI_VERTEX_URL` to `.env`

### Issue: "Connection refused"

**Solution:** Make sure FastAPI server is running on the correct port

```bash
# Check if FastAPI is running
curl http://localhost:8000/health
```

### Issue: "Request timeout"

**Solution:** 
- Check FastAPI server logs
- Increase timeout in constants (default: 60-90s)
- Optimize AI processing in FastAPI

### Issue: "CORS errors"

**Solution:** Add CORS middleware to FastAPI:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Production Deployment

### Option 1: Same Server

```env
FASTAPI_GEMINI_URL=http://localhost:8000/api/tryon/gemini
FASTAPI_VERTEX_URL=http://localhost:8000/api/tryon/vertex
```

### Option 2: Different Servers

```env
FASTAPI_GEMINI_URL=https://ai-services.yourdomain.com/api/tryon/gemini
FASTAPI_VERTEX_URL=https://ai-services.yourdomain.com/api/tryon/vertex
```

### Option 3: Load Balanced

```env
FASTAPI_GEMINI_URL=https://gemini-lb.yourdomain.com/api/tryon
FASTAPI_VERTEX_URL=https://vertex-lb.yourdomain.com/api/tryon
```

---

## Security Considerations

1. **API Keys:** Keep AI API keys in FastAPI server only
2. **Authentication:** Add authentication between NestJS and FastAPI
3. **Rate Limiting:** Implement rate limiting on both layers
4. **HTTPS:** Use HTTPS in production
5. **Firewall:** Restrict FastAPI to only accept requests from NestJS

---

## Performance Tips

1. **Connection Pooling:** FastAPI should reuse AI client connections
2. **Caching:** Cache repeated requests (same avatar + clothing)
3. **Async Processing:** Use async/await in FastAPI
4. **Image Optimization:** Resize images before sending to AI
5. **CDN:** Store result images in CDN for faster retrieval

---

## Summary

✅ NestJS acts as a **proxy** to FastAPI services  
✅ FastAPI handles all **AI API calls**  
✅ Frontend only talks to **NestJS**  
✅ Clean separation of concerns  
✅ Easy to scale FastAPI independently  

Your FastAPI services in `APP3005_AI` should now receive requests from NestJS and return try-on results!
