# AI Virtual Try-On Service

## Overview

This module provides virtual try-on functionality using two AI providers:
- **Gemini AI**: Google's multimodal AI for image generation
- **Vertex AI**: Google Cloud's enterprise AI platform with Imagen

## Features

- ✅ Dual AI provider support (Gemini & Vertex AI)
- ✅ Automatic provider selection
- ✅ Comprehensive image validation
- ✅ Base64 and URL image support
- ✅ File upload support
- ✅ Retry logic with exponential backoff
- ✅ Detailed error handling
- ✅ Health check endpoint
- ✅ Swagger API documentation

## API Endpoints

### 1. Try-On with Vertex AI
```
POST /api/v1/tryon/vertex
```

### 2. Try-On with Gemini AI
```
POST /api/v1/tryon/gemini
```

### 3. Auto Provider Selection
```
POST /api/v1/tryon/auto
```

### 4. File Upload
```
POST /api/v1/tryon/upload
```

### 5. Health Check
```
GET /api/v1/tryon/health
```

## Configuration

Add the following environment variables to your `.env` file:

```env
# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-1.5-pro

# Vertex AI Configuration (optional)
VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_MODEL=imagegeneration@006
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## Usage Examples

### Example 1: Try-On with Base64 Images

```typescript
const response = await fetch('http://localhost:3000/api/v1/tryon/gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    avatarImage: 'data:image/jpeg;base64,...',
    clothingImage: 'data:image/png;base64,...',
    additionalParams: {
      quality: 'high',
      style: 'casual'
    }
  })
});

const result = await response.json();
console.log(result.resultImage); // Base64 result image
```

### Example 2: Try-On with URLs

```typescript
const response = await fetch('http://localhost:3000/api/v1/tryon/auto', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    avatarImage: 'https://example.com/avatar.jpg',
    clothingImage: 'https://example.com/clothing.png'
  })
});
```

### Example 3: File Upload

```typescript
const formData = new FormData();
formData.append('avatarImage', avatarFile);
formData.append('clothingImage', clothingFile);
formData.append('provider', 'GEMINI_AI');

const response = await fetch('http://localhost:3000/api/v1/tryon/upload', {
  method: 'POST',
  body: formData
});
```

### Example 4: Health Check

```typescript
const response = await fetch('http://localhost:3000/api/v1/tryon/health');
const health = await response.json();

console.log(health.geminiAI.available); // true/false
console.log(health.vertexAI.available); // true/false
```

## Response Format

### Success Response

```json
{
  "success": true,
  "resultImage": "data:image/jpeg;base64,...",
  "provider": "GEMINI_AI",
  "status": "SUCCESS",
  "processingTimeMs": 3542,
  "metadata": {
    "model": "gemini-1.5-pro",
    "timestamp": "2025-12-29T16:10:00.000Z"
  },
  "timestamp": "2025-12-29T16:10:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "errorCode": "IMAGE_TOO_LARGE",
  "message": "Image size exceeds maximum limit of 10MB",
  "details": {
    "sizeBytes": 15728640,
    "maxSizeBytes": 10485760
  },
  "timestamp": "2025-12-29T16:10:00.000Z"
}
```

## Image Requirements

- **Formats**: JPEG, PNG, WebP
- **Max Size**: 10MB
- **Min Dimensions**: 256x256
- **Max Dimensions**: 4096x4096
- **Optimal**: 1024x1024

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_IMAGE_FORMAT` | Unsupported image format |
| `IMAGE_TOO_LARGE` | Image exceeds 10MB |
| `IMAGE_TOO_SMALL` | Image too small |
| `INVALID_DIMENSIONS` | Invalid image dimensions |
| `CORRUPTED_IMAGE` | Image file is corrupted |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded |
| `SERVICE_UNAVAILABLE` | AI service temporarily unavailable |
| `TIMEOUT_ERROR` | Request timeout |
| `PROCESSING_FAILED` | Try-on processing failed |
| `MISSING_CONFIGURATION` | API keys not configured |

## Architecture

```
ai-tryon/
├── controllers/
│   └── tryon.controller.ts       # REST API endpoints
├── services/
│   ├── base-tryon.service.ts     # Abstract base class
│   ├── gemini-tryon.service.ts   # Gemini AI implementation
│   ├── vertex-tryon.service.ts   # Vertex AI implementation
│   └── image-validator.service.ts # Image validation
├── dto/
│   ├── tryon-request.dto.ts      # Request DTOs
│   └── tryon-response.dto.ts     # Response DTOs
├── enums/
│   └── ai-provider.enum.ts       # Enums
├── constants/
│   └── tryon.constants.ts        # Constants
├── exceptions/
│   └── tryon.exceptions.ts       # Custom exceptions
└── ai-tryon.module.ts            # Module definition
```

## Testing

Access the Swagger documentation at:
```
http://localhost:3000/api
```

Test the health endpoint:
```bash
curl http://localhost:3000/api/v1/tryon/health
```

## Notes

- **Gemini AI**: Currently may not support image generation. The service will return an error with suggestions.
- **Vertex AI**: Requires `@google-cloud/aiplatform` package installation and proper GCP credentials.
- **Auto Selection**: Prefers Gemini AI if both providers are available (faster and cheaper).

## Future Enhancements

- [ ] Add caching for repeated requests
- [ ] Implement rate limiting middleware
- [ ] Add batch processing support
- [ ] Support for more AI providers
- [ ] Image preprocessing (resize, crop, enhance)
- [ ] Result image postprocessing
- [ ] Webhook support for async processing
- [ ] Analytics and usage tracking
