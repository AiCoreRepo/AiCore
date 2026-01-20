"""
Standalone Body Analyzer FastAPI Service
Run with: python body_analyzer_api.py
Runs on port 8898
"""
import base64
import time
from io import BytesIO
from typing import Dict, List, Optional, Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image
import uvicorn

from body_analyzer import analyze_user_image

app = FastAPI(
    title="Body Analyzer API",
    version="1.0.0",
    description="Analyze user images for skin tone, body shape, and other attributes.",
)


class BodyAnalyzeRequest(BaseModel):
    image_base64: Optional[str] = None


class BodyAnalyzeResponse(BaseModel):
    skin_tone_label: Optional[Literal["Light", "Medium", "Dusky", "Deep"]] = None
    skin_hexes: List[str]
    body_shape: Optional[Literal["Rectangle", "Pear Shape", "Apple Shape", "Hourglass", "Inverted Triangle"]] = None
    full_body: bool
    full_body_method: Optional[Literal["mediapipe", "heuristic"]] = None


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
    
    return BodyAnalyzeResponse(
        skin_tone_label=skin_map.get(raw_skin) if raw_skin else None,
        skin_hexes=result.get("skin_hexes", []),
        body_shape=shape_map.get(raw_shape) if raw_shape else None,
        full_body=result.get("full_body", False),
        full_body_method=result.get("full_body_method"),
    )


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
    - full_body_method: "mediapipe" or "heuristic"
    """
    start_time = time.time()
    print("🔍 Received body analysis request...")
    
    image_bytes = _decode_base64_image(payload.image_base64)
    image = _load_image_bytes(image_bytes)
    
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
