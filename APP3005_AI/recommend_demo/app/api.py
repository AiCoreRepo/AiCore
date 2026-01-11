import base64
from io import BytesIO
from typing import Optional

from fastapi import Body, FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from PIL import Image

from app.main import analyze_user_image


class AnalyzeRequest(BaseModel):
    image_base64: Optional[str] = None


app = FastAPI(title="Skin and Body Analysis API")


def _load_image_bytes(image_bytes: bytes) -> Image.Image:
    try:
        return Image.open(BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {exc}") from exc


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/analyze", summary="Analyze via file upload or form base64 (multipart/form-data)")
async def analyze(
    file: UploadFile | None = File(
        None, description="Image file upload (png/jpg). Leave empty if using base64."
    ),
    image_base64: str | None = Form(
        None, description="Base64 image string (use when not uploading a file)."
    ),
):
    image_bytes = None
    if file is not None:
        image_bytes = await file.read()
    elif image_base64:
        try:
            image_bytes = base64.b64decode(image_base64)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid base64: {exc}") from exc
    else:
        raise HTTPException(status_code=400, detail="Provide an image file or image_base64.")

    image = _load_image_bytes(image_bytes)
    result = analyze_user_image(image)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@app.post("/analyze_json", summary="Analyze via JSON base64 (application/json)")
async def analyze_json(payload: AnalyzeRequest = Body(..., description="JSON with image_base64")):
    if not payload.image_base64:
        raise HTTPException(status_code=400, detail="Missing image_base64.")
    try:
        image_bytes = base64.b64decode(payload.image_base64)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid base64: {exc}") from exc

    image = _load_image_bytes(image_bytes)
    result = analyze_user_image(image)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result
