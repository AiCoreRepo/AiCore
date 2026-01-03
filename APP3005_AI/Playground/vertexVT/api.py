import base64
import os
import subprocess
from typing import Dict, List, Optional

import requests
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from google import genai
from google.genai import types
from dotenv import load_dotenv
from color_helper import generate_angle_prompt

# Load environment variables from a .env file for local runs.
load_dotenv()

app = FastAPI(
    title="Vertex AI Virtual Try-On API",
    version="1.0.0",
    description="Accepts two JPEGs (person + garment) and returns base64 outputs from Vertex AI.",
)


class TryOnResponse(BaseModel):
    images_base64: List[str]
    predictions: List[Dict]
    model_id: str
    mime_type: str


class GeminiResponse(BaseModel):
    images_base64: List[str]
    texts: List[str]
    model_id: str


# New models for NestJS integration
class TryOnJSONRequest(BaseModel):
    """Request model for JSON-based try-on endpoints"""
    avatar_image: str  # base64 without data URI prefix
    clothing_image: str  # base64 without data URI prefix
    additional_params: Optional[Dict] = None


class GenerateAnglesRequest(BaseModel):
    """
    Request model for angle generation endpoint.
    
    Gemini analyzes image colors automatically for complementary backgrounds.
    
    additional_params can include:
    - prompt: Custom prompt (overrides auto-generation)
    - angle: Specific angle (front/left/right/side left/side right/back)
           If not provided, auto-rotates through angles
    """
    previous_image: str  # base64 without data URI prefix
    additional_params: Optional[Dict] = None


class StandardTryOnResponse(BaseModel):
    """Standardized response format for NestJS integration"""
    success: bool
    result_image: str  # base64 encoded image
    processing_time: Optional[int] = None  # milliseconds
    message: Optional[str] = None
    metadata: Optional[Dict] = None


def _get_access_token(manual_token: Optional[str]) -> Optional[str]:
    """Use provided token, env var, or gcloud to obtain a bearer token."""
    if manual_token:
        return manual_token.strip()
    
    # Reload .env file to pick up fresh tokens without restarting service
    load_dotenv(override=True)
    
    env_token = os.environ.get("VERTEX_TOKEN")
    if env_token:
        return env_token.strip()
    
    # Hardcoded fallback token removed for security
    # Set VERTEX_TOKEN in your .env file or use gcloud CLI
    hardcoded_token = None
    if hardcoded_token:
        return hardcoded_token.strip()
    
    try:
        return (
            subprocess.check_output(
                ["gcloud", "auth", "print-access-token"], text=True
            ).strip()
        )
    except Exception:
        return None



def _resolve_param(
    value: Optional[str], env_var: str, label: str, default: Optional[str] = None
) -> str:
    """Return provided value, or env, or default; else error."""
    if value and value.strip():
        return value.strip()
    env_val = os.environ.get(env_var)
    if env_val and env_val.strip():
        return env_val.strip()
    if default is not None:
        return default
    raise HTTPException(
        status_code=400,
        detail=f"{label} is required. Provide it in the form field or set {env_var}.",
    )


def _encode_bytes(data: bytes) -> str:
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    return base64.b64encode(data).decode("utf-8")


def _require_api_key() -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="GEMINI_API_KEY is required in the environment for Gemini calls.",
        )
    return api_key.strip()


async def _read_jpeg(upload: UploadFile, field_name: str) -> bytes:
    if upload.content_type not in ("image/jpeg", "image/jpg"):
        raise HTTPException(
            status_code=415,
            detail=f"{field_name} must be image/jpeg; got {upload.content_type}.",
        )
    data = await upload.read()
    if not data:
        raise HTTPException(status_code=400, detail=f"{field_name} is empty.")
    return data


@app.post(
    "/gemini/try-on",
    response_model=GeminiResponse,
    summary="Run Gemini 2.5 Flash try-on",
    tags=["gemini"],
    description="Uploads two JPEGs (person_image + garment_image) to Gemini 2.5 Flash Image Preview and returns base64 images.",
    openapi_extra={
        "requestBody": {
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "person_image": {"type": "string", "format": "binary"},
                            "garment_image": {"type": "string", "format": "binary"},
                            "prompt": {
                                "type": "string",
                                "example": "Put the clothing from the second image onto the person in the first image.",
                            },
                        },
                        "required": ["person_image", "garment_image"],
                    }
                }
            }
        }
    },
)
async def gemini_try_on(
    person_image: UploadFile = File(..., description="JPEG person image"),
    garment_image: UploadFile = File(..., description="JPEG garment image"),
    prompt: str = Form(
        "Virtual try-on task: Replace ONLY the clothing on the person in image 1 with the garment from image 2. CRITICAL: Copy the entire background from image 1 pixel-by-pixel. Do NOT generate, modify, or replace any background elements. Background must be 100% identical to image 1.",
        description="Optional prompt; uses default if omitted.",
    ),
) -> GeminiResponse:
    api_key = _require_api_key()
    person_bytes = await _read_jpeg(person_image, "person_image")
    garment_bytes = await _read_jpeg(garment_image, "garment_image")

    client = genai.Client(api_key=api_key)
    model_id = "gemini-2.5-flash-image-preview"

    contents = [
        types.Part(inline_data=types.Blob(data=person_bytes, mime_type="image/jpeg")),
        types.Part(inline_data=types.Blob(data=garment_bytes, mime_type="image/jpeg")),
        types.Part.from_text(text=prompt),
    ]

    try:
        response = client.models.generate_content(
            model=model_id,
            contents=contents,
            config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {exc}") from exc

    images: List[str] = []
    texts: List[str] = []

    if response and response.candidates:
        for cand in response.candidates:
            if not cand.content or not cand.content.parts:
                continue
            for part in cand.content.parts:
                if part.inline_data and part.inline_data.data:
                    images.append(base64.b64encode(part.inline_data.data).decode("utf-8"))
                if part.text:
                    texts.append(part.text)

    if not images:
        raise HTTPException(
            status_code=502,
            detail="Gemini call succeeded but no image data was returned.",
        )

    return GeminiResponse(images_base64=images, texts=texts, model_id=model_id)


def _build_parameters(
    add_watermark: bool,
    base_steps: int,
    person_generation: Optional[str],
    safety_setting: Optional[str],
    sample_count: int,
    seed: Optional[int],
    storage_uri: Optional[str],
    mime_type: str,
    compression_quality: Optional[int],
) -> Dict:
    params: Dict = {
        "addWatermark": add_watermark,
        "baseSteps": base_steps,
        "sampleCount": sample_count,
    }

    output_options = {"mimeType": mime_type}
    if mime_type == "image/jpeg" and compression_quality is not None:
        output_options["compressionQuality"] = compression_quality
    params["outputOptions"] = output_options

    if person_generation:
        params["personGeneration"] = person_generation
    if safety_setting:
        params["safetySetting"] = safety_setting
    if seed is not None:
        params["seed"] = seed
    if storage_uri:
        params["storageUri"] = storage_uri

    return params


def _extract_base64_images(predictions: List[Dict]) -> List[str]:
    images: List[str] = []
    for pred in predictions:
        if not isinstance(pred, dict):
            continue
        if "bytesBase64Encoded" in pred:
            images.append(pred["bytesBase64Encoded"])
            continue
        image_dict = pred.get("image") or {}
        if isinstance(image_dict, dict) and "bytesBase64Encoded" in image_dict:
            images.append(image_dict["bytesBase64Encoded"])
            continue
        generated = pred.get("generatedImages") or []
        for item in generated:
            if isinstance(item, dict) and "bytesBase64Encoded" in item:
                images.append(item["bytesBase64Encoded"])
    return images


@app.post(
    "/vertex/try-on",
    response_model=TryOnResponse,
    summary="Run Vertex AI virtual try-on",
    tags=["vertex"],
    description=(
        "Uploads two JPEGs (person_image + garment_image) and forwards this payload to Vertex AI:\n\n"
        "```\n"
        "{\n"
        '  "instances": [\n'
        "    {\n"
        '      "personImage": { "image": { "bytesBase64Encoded": "<avatar-base64>" } },\n'
        '      "productImages": [ { "image": { "bytesBase64Encoded": "<garment-base64>" } } ]\n'
        "    }\n"
        "  ],\n"
        '  "parameters": {\n'
        '    "addWatermark": true,\n'
        '    "baseSteps": 30,\n'
        '    "sampleCount": 1,\n'
        '    "outputOptions": { "mimeType": "image/jpeg", "compressionQuality": 90 }\n'
        "  }\n"
        "}\n"
        "```"
    ),
    responses={
        200: {
            "description": "Base64 images plus the raw Vertex predictions.",
            "content": {
                "application/json": {
                    "example": {
                        "images_base64": ["<base64-output-image>"],
                        "predictions": [
                            {"image": {"bytesBase64Encoded": "<base64-output-image>"}}
                        ],
                        "model_id": "virtual-try-on-preview-08-04",
                        "mime_type": "image/jpeg",
                    }
                }
            },
        }
    },
    openapi_extra={
        "requestBody": {
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "person_image": {"type": "string", "format": "binary"},
                            "garment_image": {"type": "string", "format": "binary"},
                            "add_watermark": {"type": "boolean", "example": True},
                            "base_steps": {"type": "integer", "example": 30},
                            "sample_count": {"type": "integer", "example": 1},
                            "seed": {"type": "integer", "example": 123},
                            "person_generation": {"type": "string"},
                            "safety_setting": {
                                "type": "string",
                                "example": "BLOCK_MEDIUM_AND_ABOVE",
                            },
                            "storage_uri": {
                                "type": "string",
                                "example": "gs://bucket/output/",
                            },
                            "mime_type": {"type": "string", "example": "image/jpeg"},
                            "compression_quality": {"type": "integer", "example": 90},
                        },
                        "required": ["person_image", "garment_image"],
                    }
                }
            }
        }
    },
)
async def vertex_try_on(
    person_image: UploadFile = File(..., description="JPEG person image"),
    garment_image: UploadFile = File(..., description="JPEG garment image"),
    add_watermark: bool = Form(True),
    base_steps: int = Form(30),
    sample_count: int = Form(1),
    seed: Optional[int] = Form(None),
    person_generation: Optional[str] = Form(None),
    safety_setting: Optional[str] = Form(None),
    storage_uri: Optional[str] = Form(None),
    mime_type: str = Form("image/jpeg"),
    compression_quality: Optional[int] = Form(90),
) -> TryOnResponse:
    """
    project_id, model_id, location, and access_token are loaded from environment:
    VERTEX_PROJECT_ID, VERTEX_MODEL_ID, VERTEX_LOCATION (default us-central1), VERTEX_TOKEN.
    """
    for upload in (person_image, garment_image):
        if upload.content_type not in ("image/jpeg", "image/jpg"):
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported media type for {upload.filename}. Use image/jpeg.",
            )

    token = _get_access_token(None)
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Could not obtain an access token. Provide one or set VERTEX_TOKEN.",
        )

    person_bytes = await person_image.read()
    garment_bytes = await garment_image.read()

    project_val = _resolve_param(None, "VERTEX_PROJECT_ID", "VERTEX_PROJECT_ID")
    location_val = _resolve_param(
        None, "VERTEX_LOCATION", "VERTEX_LOCATION", default="us-central1"
    )
    model_val = _resolve_param(None, "VERTEX_MODEL_ID", "VERTEX_MODEL_ID")

    endpoint = (
        f"https://{location_val}-aiplatform.googleapis.com/v1/projects/"
        f"{project_val}/locations/{location_val}/publishers/google/models/"
        f"{model_val}:predict"
    )

    parameters = _build_parameters(
        add_watermark=add_watermark,
        base_steps=base_steps,
        person_generation=person_generation,
        safety_setting=safety_setting,
        sample_count=sample_count,
        seed=seed,
        storage_uri=storage_uri or "",
        mime_type=mime_type,
        compression_quality=compression_quality if mime_type == "image/jpeg" else None,
    )

    payload = {
        "instances": [
            {
                "personImage": {"image": {"bytesBase64Encoded": _encode_bytes(person_bytes)}},
                "productImages": [
                    {"image": {"bytesBase64Encoded": _encode_bytes(garment_bytes)}}
                ],
            }
        ],
        "parameters": parameters,
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(endpoint, headers=headers, json=payload, timeout=120)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Request to Vertex AI failed: {exc}") from exc

    try:
        body = response.json()
    except ValueError:
        body = {}

    if not response.ok:
        detail = body if body else response.text
        raise HTTPException(status_code=response.status_code, detail=detail)

    predictions: List[Dict] = body.get("predictions", [])
    images_b64 = _extract_base64_images(predictions)

    if not images_b64:
        raise HTTPException(
            status_code=502,
            detail="Call succeeded but no image data was found in the predictions.",
        )

    return TryOnResponse(
        images_base64=images_b64,
        predictions=predictions,
        model_id=model_val,
        mime_type=mime_type,
    )


#json end  points so nestjs does not need to process image in base64
@app.post(
    "/vertex/try-on-json",
    response_model=StandardTryOnResponse,
    summary="Vertex AI try-on (JSON)",
    tags=["nestjs-integration"],
    description="JSON-based Vertex AI try-on endpoint for NestJS backend integration.",
)
async def vertex_try_on_json(request: TryOnJSONRequest) -> StandardTryOnResponse:
    """
    Vertex AI try-on endpoint that accepts JSON request from NestJS.
    Expects base64 images without data URI prefix.
    """
    import time
    start_time = time.time()

    try:
        # Get access token
        token = _get_access_token(None)
        if not token:
            raise HTTPException(
                status_code=401,
                detail="Could not obtain an access token. Set VERTEX_TOKEN or configure gcloud.",
            )

        # Get Vertex AI configuration
        project_val = _resolve_param(None, "VERTEX_PROJECT_ID", "VERTEX_PROJECT_ID")
        location_val = _resolve_param(
            None, "VERTEX_LOCATION", "VERTEX_LOCATION", default="us-central1"
        )
        model_val = _resolve_param(None, "VERTEX_MODEL_ID", "VERTEX_MODEL_ID")

        endpoint = (
            f"https://{location_val}-aiplatform.googleapis.com/v1/projects/"
            f"{project_val}/locations/{location_val}/publishers/google/models/"
            f"{model_val}:predict"
        )

        # Build parameters from additional_params or use defaults
        params = request.additional_params or {}
        parameters = _build_parameters(
            add_watermark=params.get("add_watermark", True),
            base_steps=params.get("base_steps", 30),
            person_generation=params.get("person_generation"),
            safety_setting=params.get("safety_setting"),
            sample_count=params.get("sample_count", 1),
            seed=params.get("seed"),
            storage_uri=params.get("storage_uri", ""),
            mime_type=params.get("mime_type", "image/jpeg"),
            compression_quality=params.get("compression_quality", 90),
        )

        # Build payload
        payload = {
            "instances": [
                {
                    "personImage": {"image": {"bytesBase64Encoded": request.avatar_image}},
                    "productImages": [
                        {"image": {"bytesBase64Encoded": request.clothing_image}}
                    ],
                }
            ],
            "parameters": parameters,
        }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        # Call Vertex AI
        response = requests.post(endpoint, headers=headers, json=payload, timeout=120)

        try:
            body = response.json()
        except ValueError:
            body = {}

        if not response.ok:
            detail = body.get("error", {}).get("message", response.text)
            raise HTTPException(status_code=response.status_code, detail=detail)

        predictions: List[Dict] = body.get("predictions", [])
        images_b64 = _extract_base64_images(predictions)

        if not images_b64:
            raise HTTPException(
                status_code=502,
                detail="Call succeeded but no image data was found in the predictions.",
            )

        processing_time = int((time.time() - start_time) * 1000)

        return StandardTryOnResponse(
            success=True,
            result_image=images_b64[0],  # Return first image
            processing_time=processing_time,
            message="Virtual try-on completed successfully",
            metadata={
                "model_id": model_val,
                "provider": "vertex",
                "num_images": len(images_b64),
            },
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Vertex AI try-on failed: {str(exc)}"
        ) from exc


@app.post(
    "/gemini/try-on-json",
    response_model=StandardTryOnResponse,
    summary="Gemini AI try-on (JSON)",
    tags=["nestjs-integration"],
    description="JSON-based Gemini AI try-on endpoint for NestJS backend integration.",
)
async def gemini_try_on_json(request: TryOnJSONRequest) -> StandardTryOnResponse:
    """
    Gemini AI try-on endpoint that accepts JSON request from NestJS.
    Expects base64 images without data URI prefix.
    """
    import time
    start_time = time.time()

    try:
        api_key = _require_api_key()

        # Decode base64 images
        try:
            person_bytes = base64.b64decode(request.avatar_image)
            garment_bytes = base64.b64decode(request.clothing_image)
        except Exception as exc:
            raise HTTPException(
                status_code=400, detail=f"Invalid base64 image data: {exc}"
            ) from exc

        # Try-on: Last attempt with ultra-directive prompt
        params = request.additional_params or {}
        prompt = params.get(
            "prompt",
            "Virtual try-on task: Replace ONLY the clothing on the person in image 1 with the garment from image 2. CRITICAL: Copy the entire background from image 1 pixel-by-pixel. Do NOT generate, modify, or replace any background elements. Background must be 100% identical to image 1.",
        )

        client = genai.Client(api_key=api_key)
        model_id = "gemini-2.5-flash-image-preview"

        contents = [
            types.Part(inline_data=types.Blob(data=person_bytes, mime_type="image/jpeg")),
            types.Part(inline_data=types.Blob(data=garment_bytes, mime_type="image/jpeg")),
            types.Part.from_text(text=prompt),
        ]

        response = client.models.generate_content(
            model=model_id,
            contents=contents,
            config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]),
        )

        images: List[str] = []
        texts: List[str] = []

        if response and response.candidates:
            for cand in response.candidates:
                if not cand.content or not cand.content.parts:
                    continue
                for part in cand.content.parts:
                    if part.inline_data and part.inline_data.data:
                        images.append(base64.b64encode(part.inline_data.data).decode("utf-8"))
                    if part.text:
                        texts.append(part.text)

        if not images:
            raise HTTPException(
                status_code=502,
                detail="Gemini call succeeded but no image data was returned.",
            )

        processing_time = int((time.time() - start_time) * 1000)

        return StandardTryOnResponse(
            success=True,
            result_image=images[0],  # Return first image
            processing_time=processing_time,
            message="Virtual try-on completed successfully",
            metadata={
                "model_id": model_id,
                "provider": "gemini",
                "num_images": len(images),
                "texts": texts,
            },
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Gemini AI try-on failed: {str(exc)}"
        ) from exc


@app.post(
    "/gemini/generate-angles",
    response_model=StandardTryOnResponse,
    summary="Generate more angles (Gemini)",
    tags=["nestjs-integration"],
    description="Generate additional camera angles and backgrounds from an existing try-on image using Gemini AI.",
)
async def generate_angles(request: GenerateAnglesRequest) -> StandardTryOnResponse:
    """
    Generate more angles from an existing try-on image using Gemini AI.
    Expects base64 image without data URI prefix.
    """
    import time
    start_time = time.time()

    try:
        api_key = _require_api_key()

        # Decode base64 image
        try:
            image_bytes = base64.b64decode(request.previous_image)
        except Exception as exc:
            raise HTTPException(
                status_code=400, detail=f"Invalid base64 image data: {exc}"
            ) from exc

        # Minimal token usage: let Gemini analyze image colors
        params = request.additional_params or {}
        
        if "prompt" in params:
            prompt = params["prompt"]
        else:
            # Ultra-minimal: Gemini sees image, analyzes colors, generates background
            angle = params.get("angle")
            prompt = generate_angle_prompt(angle=angle)

        client = genai.Client(api_key=api_key)
        model_id = "gemini-2.5-flash-image-preview"

        contents = [
            types.Part(inline_data=types.Blob(data=image_bytes, mime_type="image/jpeg")),
            types.Part.from_text(text=prompt),
        ]

        response = client.models.generate_content(
            model=model_id,
            contents=contents,
            config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]),
        )

        images: List[str] = []
        texts: List[str] = []

        if response and response.candidates:
            for cand in response.candidates:
                if not cand.content or not cand.content.parts:
                    continue
                for part in cand.content.parts:
                    if part.inline_data and part.inline_data.data:
                        images.append(base64.b64encode(part.inline_data.data).decode("utf-8"))
                    if part.text:
                        texts.append(part.text)

        if not images:
            raise HTTPException(
                status_code=502,
                detail="Gemini call succeeded but no image data was returned.",
            )

        processing_time = int((time.time() - start_time) * 1000)

        return StandardTryOnResponse(
            success=True,
            result_image=images[0],  # Return first image
            processing_time=processing_time,
            message="New angle generated successfully",
            metadata={
                "model_id": model_id,
                "provider": "gemini",
                "num_images": len(images),
                "texts": texts,
            },
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Angle generation failed: {str(exc)}"
        ) from exc


@app.get(
    "/health",
    summary="Health check",
    tags=["health"],
    description="Check if the FastAPI service is running and configured properly.",
)
async def health_check():
    """
    Health check endpoint to verify service availability.
    """
    # Check if required environment variables are set
    gemini_configured = bool(os.environ.get("GEMINI_API_KEY"))
    vertex_configured = all([
        os.environ.get("VERTEX_PROJECT_ID"),
        os.environ.get("VERTEX_MODEL_ID"),
    ])

    return {
        "status": "healthy",
        "service": "FastAPI Virtual Try-On Service",
        "version": "1.0.0",
        "gemini_configured": gemini_configured,
        "vertex_configured": vertex_configured,
        "endpoints": {
            "vertex_tryon": "/vertex/try-on-json",
            "gemini_tryon": "/gemini/try-on-json",
            "generate_angles": "/gemini/generate-angles",
        },
    }

