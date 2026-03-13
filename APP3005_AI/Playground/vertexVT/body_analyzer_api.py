"""
Standalone Body Analyzer FastAPI Service
Run with: python body_analyzer_api.py
Runs on port 8898
"""
import base64
import time
from io import BytesIO
from typing import Dict, List, Optional, Literal

from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel
from PIL import Image
import uvicorn
from fastapi.responses import HTMLResponse

from body_analyzer import analyze_user_image, assess_image_quality

app = FastAPI(
    title="Body Analyzer API",
    version="1.0.0",
    description="Analyze user images for skin tone, body shape, and other attributes.",
)

MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class BodyAnalyzeRequest(BaseModel):
    image_base64: Optional[str] = None


class BodyAnalyzeResponse(BaseModel):
    skin_tone_label: Optional[Literal["Light", "Medium", "Dusky", "Deep"]] = None
    skin_hexes: List[str]
    body_shape: Optional[Literal["Rectangle", "Pear Shape", "Apple Shape", "Hourglass", "Inverted Triangle"]] = None
    body_shape_reason: Optional[str] = None
    body_shape_measurements: Optional[Dict[str, float]] = None
    body_shape_confidence: Optional[float] = None
    full_body: bool
    full_body_method: Optional[Literal["mediapipe", "heuristic", "segmentation"]] = None
    mediapipe: Optional[str] = None


def _validate_upload_size(image_bytes: bytes, filename: str | None = None) -> None:
    """Reject uploads larger than the configured maximum size."""
    if len(image_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File '{filename or 'uploaded file'}' is too large. Max size: {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB.",
        )


def _decode_base64_image(data: Optional[str]) -> bytes:
    """Decode base64 image string to bytes."""
    if not data:
        raise HTTPException(status_code=400, detail="No image data provided")
    
    # Remove data URI prefix if present
    if data.startswith("data:"):
        try:
            data = data.split(",", 1)[1]
        except IndexError:
            pass
    
    try:
        return base64.b64decode(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 encoding: {str(e)}")


def _load_image_bytes(image_bytes: bytes) -> Image.Image:
    """Load PIL Image from bytes."""
    try:
        return Image.open(BytesIO(image_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")


def _validate_image_quality(image: Image.Image, image_bytes: bytes) -> None:
    """Assess image quality, but do not reject uploads for low quality alone."""
    quality = assess_image_quality(image, image_bytes=image_bytes)
    if not quality["ok"]:
        print(
            f"⚠️ Low-quality image accepted for analysis. reasons={quality.get('reasons')}, metrics={quality.get('metrics')}"
        )


def _build_response(result: Dict) -> BodyAnalyzeResponse:
    """Build response from analysis result with label mapping."""
    # Map skin tone labels
    skin_map = {
        "light": "Light",
        "medium": "Medium",
        "dusky": "Dusky",
        "deep": "Deep"
    }
    
    # Map body shape labels
    shape_map = {
        "rectangle": "Rectangle",
        "pear": "Pear Shape",
        "apple": "Apple Shape",
        "hourglass": "Hourglass",
        "inverted_triangle": "Inverted Triangle",
        "other": None
    }
    
    raw_skin = result.get("skin_tone_label")
    raw_shape = result.get("body_shape")
    reason = result.get("body_shape_reason")
    
    return BodyAnalyzeResponse(
        skin_tone_label=skin_map.get(raw_skin) if raw_skin else None,
        skin_hexes=result.get("skin_hexes", []),
        body_shape=shape_map.get(raw_shape) if raw_shape else None,
        body_shape_reason=reason,
        body_shape_measurements=result.get("body_shape_measurements"),
        body_shape_confidence=result.get("body_shape_confidence"),
        full_body=result.get("full_body", False),
        full_body_method=result.get("full_body_method"),
        mediapipe=result.get("mediapipe"),
    )


@app.get("/body_upload_form", response_class=HTMLResponse, summary="Open upload form")
async def body_upload_form():
    """Return a simple HTML form for uploading a body image."""
    return """
    <html>
      <body>
        <h3>Upload Image (max 10 MB)</h3>
        <form action="/body_analyze_upload" method="post" enctype="multipart/form-data">
          <input type="file" name="file" accept="image/*" required />
          <button type="submit">Analyze</button>
        </form>
      </body>
    </html>
    """


@app.post(
    "/body_analyze_upload",
    summary="Analyze body attributes via multipart file upload",
    response_model=BodyAnalyzeResponse,
)
async def body_analyze_upload(file: UploadFile = File(...)):
    """
    Analyze a user image uploaded via form/multipart.

    - Rejects files larger than 10MB.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload an image.",
        )

    image_bytes = await file.read()
    _validate_upload_size(image_bytes, file.filename)

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    image = _load_image_bytes(image_bytes)
    _validate_image_quality(image, image_bytes)
    result = analyze_user_image(image)

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    return _build_response(result)


@app.post(
    "/body_analyze_json",
    summary="Analyze body attributes via JSON base64",
    response_model=BodyAnalyzeResponse,
)
async def body_analyze_json(payload: BodyAnalyzeRequest):
    """
    Analyze a user image for body attributes.
    
    Returns:
    - skin_tone_label: Light, Medium, Dusky, or Deep
    - skin_hexes: List of 3 hex colors representing skin tones
    - body_shape: Rectangle, Pear Shape, Apple Shape, Hourglass, or Inverted Triangle
    - full_body: Whether a full body was detected
    - full_body_method: "mediapipe", "segmentation", or "heuristic"
    """
    start_time = time.time()
    print("🔍 Received body analysis request...")
    
    image_bytes = _decode_base64_image(payload.image_base64)
    image = _load_image_bytes(image_bytes)
    _validate_image_quality(image, image_bytes)
    
    print(f"📸 Image loaded in {time.time() - start_time:.2f}s, analyzing...")
    analysis_start = time.time()
    result = analyze_user_image(image)
    analysis_end = time.time()
    
    if "error" in result:
        print(f"❌ Analysis failed after {analysis_end - analysis_start:.2f}s: {result['error']}")
        raise HTTPException(status_code=500, detail=result["error"])
    
    print(f"✅ Analysis complete in {analysis_end - analysis_start:.2f}s: skin_tone={result.get('skin_tone_label')}, body_shape={result.get('body_shape')}")
    print(f"⏱️ Total processing time: {time.time() - start_time:.2f}s")
    return _build_response(result)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Body Analyzer API"}


if __name__ == "__main__":
    print("🚀 Starting Body Analyzer API on port 8898...")
    uvicorn.run(app, host="0.0.0.0", port=8898)
