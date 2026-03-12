import base64
from io import BytesIO
from typing import List, Optional
from fastapi import HTTPException
from pydantic import BaseModel
from PIL import Image


# Helper functions for body analyzer endpoint
def _decode_base64_image(image_base64: str) -> bytes:
    """Decode base64 image string to bytes."""
    try:
        return base64.b64decode(image_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")


def _load_image_bytes(image_bytes: bytes) -> Image.Image:
    """Load PIL Image from bytes."""
    try:
        return Image.open(BytesIO(image_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")


class BodyAnalyzeResponse(BaseModel):
    """Response model for body analysis."""
    success: bool
    skin_tone_label: Optional[str] = None
    skin_hexes: List[str] = []
    body_shape: Optional[str] = None
    body_shape_measurements: Optional[dict] = None
    body_shape_reason: Optional[str] = None
    body_shape_confidence: Optional[float] = None
    full_body: bool = False
    full_body_method: Optional[str] = None
    mediapipe: Optional[str] = None
    error: Optional[str] = None


def _build_body_analyze_response(result: dict) -> BodyAnalyzeResponse:
    """Build response from body analyzer result."""
    return BodyAnalyzeResponse(
        success=True,
        skin_tone_label=result.get("skin_tone_label"),
        skin_hexes=result.get("skin_hexes", []),
        body_shape=result.get("body_shape"),
        body_shape_measurements=result.get("body_shape_measurements"),
        body_shape_reason=result.get("body_shape_reason"),
        body_shape_confidence=result.get("body_shape_confidence"),
        full_body=result.get("full_body", False),
        full_body_method=result.get("full_body_method"),
        mediapipe=result.get("mediapipe"),
    )
