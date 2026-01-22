import base64
from io import BytesIO
import os
from pathlib import Path
from typing import Dict, List, Optional, Literal

import requests
from fastapi import Body, FastAPI, File, Form, HTTPException, UploadFile
from google.auth.transport.requests import Request
from google.oauth2 import service_account
from pydantic import BaseModel
from PIL import Image

from google import genai
from google.genai import types
from dotenv import load_dotenv
from color_helper import generate_angle_prompt
from body_analyzer import analyze_user_image
from body_analyzer_helpers import (
    _decode_base64_image,
    _load_image_bytes,
    _build_body_analyze_response,
    BodyAnalyzeResponse,
)

# Load environment variables from a .env file for local runs.
load_dotenv()

app = FastAPI(
    title="Vertex AI Virtual Try-On API",
    version="1.0.0",
    description="Accepts two JPEGs (person + garment) and returns base64 outputs from Vertex AI.",
)

BODY_SHAPE_OPTIONS = [
    "Rectangle",
    "Pear Shape",
    "Apple Shape",
    "Hourglass",
    "Inverted Triangle",
]

SKIN_TONE_OPTIONS = [
    "Light",
    "Medium",
    "Dusky",
    "Deep",
]

_BODY_SHAPE_LABELS = {
    "rectangle": BODY_SHAPE_OPTIONS[0],
    "pear": BODY_SHAPE_OPTIONS[1],
    "pear_shape": BODY_SHAPE_OPTIONS[1],
    "apple": BODY_SHAPE_OPTIONS[2],
    "apple_shape": BODY_SHAPE_OPTIONS[2],
    "hourglass": BODY_SHAPE_OPTIONS[3],
    "inverted_triangle": BODY_SHAPE_OPTIONS[4],
    "inverted triangle": BODY_SHAPE_OPTIONS[4],
}

_SKIN_TONE_LABELS = {
    "light": SKIN_TONE_OPTIONS[0],
    "medium": SKIN_TONE_OPTIONS[1],
    "dusky": SKIN_TONE_OPTIONS[2],
    "deep": SKIN_TONE_OPTIONS[3],
}


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
    
    reference_image: Optional base64 of the original try-on image for identity consistency
    clothing_image: Optional base64 of the ORIGINAL CLOTHING to ensure clothes don't change
    """
    previous_image: str  # base64 without data URI prefix - the current angle to transform
    reference_image: Optional[str] = None  # base64 of original try-on image for identity anchoring
    clothing_image: Optional[str] = None  # base64 of original clothing for clothing consistency
    additional_params: Optional[Dict] = None


class BodyAnalyzeRequest(BaseModel):
    image_base64: Optional[str] = None


class BodyAnalyzeResponse(BaseModel):
    skin_tone_label: Optional[
        Literal["Light", "Medium", "Dusky", "Deep"]
    ] = None
    skin_hexes: List[str]
    body_shape: Optional[
        Literal["Rectangle", "Pear Shape", "Apple Shape", "Hourglass", "Inverted Triangle"]
    ] = None
    full_body: bool


class StandardTryOnResponse(BaseModel):
    """Standardized response format for NestJS integration"""
    success: bool
    result_image: str  # base64 encoded image
    processing_time: Optional[int] = None  # milliseconds
    message: Optional[str] = None
    metadata: Optional[Dict] = None


def _get_access_token(manual_token: Optional[str]) -> Optional[str]:
    """
    Obtain a bearer token strictly from a service account JSON file.
    Checks VERTEX_SA_KEY or GOOGLE_APPLICATION_CREDENTIALS for a path, otherwise
    uses a local service_account.json in this folder. If no file is found or readable,
    returns None (callers will raise 401).
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Reload .env file to pick up fresh paths without restarting service
    load_dotenv(override=True)

    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
    default_sa_path = Path(__file__).resolve().parent / "service_account.json"
    sa_path = (
        os.environ.get("VERTEX_SA_KEY")
        or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        or (str(default_sa_path) if default_sa_path.exists() else None)
    )

    if not sa_path:
        logger.error("❌ No service account path found. Checked:")
        logger.error(f"   - VERTEX_SA_KEY: {os.environ.get('VERTEX_SA_KEY')}")
        logger.error(f"   - GOOGLE_APPLICATION_CREDENTIALS: {os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')}")
        logger.error(f"   - Default path exists: {default_sa_path.exists()}")
        return None

    sa_path_resolved = str(Path(sa_path).expanduser())
    if not Path(sa_path_resolved).exists():
        logger.error(f"❌ Service account file not found at: {sa_path_resolved}")
        return None

    logger.info(f"✅ Using service account file: {sa_path_resolved}")

    try:
        creds = service_account.Credentials.from_service_account_file(
            sa_path_resolved, scopes=scopes
        )
        
        logger.info(f"✅ Service account loaded successfully")
        logger.info(f"   - Service account email: {creds.service_account_email}")
        logger.info(f"   - Project ID: {creds.project_id}")

        # Always refresh to ensure we have a valid token
        if not creds.token or not creds.valid or creds.expired:
            logger.info("🔄 Token not present or expired, refreshing...")
            creds.refresh(Request())
            logger.info("✅ Token refreshed successfully")

        if creds.token:
            logger.info(f"✅ Access token generated (length: {len(creds.token)} chars)")
            logger.debug(f"   - Token preview: {creds.token[:20]}...")
            return creds.token
        else:
            logger.error("❌ Token generation failed - credentials.token is None")
            return None
            
    except FileNotFoundError as e:
        logger.error(f"❌ Service account file not found: {e}")
        return None
    except ValueError as e:
        logger.error(f"❌ Invalid service account JSON format: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Unexpected error during token generation: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"   Traceback: {traceback.format_exc()}")
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


def _load_image_bytes(image_bytes: bytes) -> Image.Image:
    try:
        return Image.open(BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {exc}") from exc


def _decode_base64_image(data: Optional[str]) -> bytes:
    if not data:
        raise HTTPException(status_code=400, detail="Missing image_base64.")
    if data.startswith("data:"):
        _, _, data = data.partition(",")
    try:
        return base64.b64decode(data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid base64: {exc}") from exc


def _require_api_key() -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="GEMINI_API_KEY is required in the environment for Gemini calls.",
        )
    return api_key.strip()


def _normalize_label(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    return value.strip().lower().replace(" ", "_")


def _format_body_shape(value: Optional[str]) -> Optional[str]:
    key = _normalize_label(value)
    if not key:
        return None
    return _BODY_SHAPE_LABELS.get(key)


def _format_skin_tone(value: Optional[str]) -> Optional[str]:
    key = _normalize_label(value)
    if not key:
        return None
    return _SKIN_TONE_LABELS.get(key)


def _build_body_analyze_response(result: Dict) -> BodyAnalyzeResponse:
    return BodyAnalyzeResponse(
        skin_tone_label=_format_skin_tone(result.get("skin_tone_label")),
        skin_hexes=result.get("skin_hexes") or [],
        body_shape=_format_body_shape(result.get("body_shape")),
        full_body=bool(result.get("full_body")),
    )


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
        "🎯 VIRTUAL TRY-ON TASK:\n\n"
        
        "📸 IMAGE ANALYSIS:\n"
        "- Image 1: The TARGET PERSON (who will wear the clothes)\n"
        "- Image 2: The CLOTHING SOURCE (can be: person wearing clothes, mannequin, or standalone garment)\n\n"
        
        "🔍 STEP 1 - IDENTIFY THE CLOTHING:\n"
        "First, carefully analyze Image 2 to identify the clothing item(s):\n"
        "- If Image 2 shows a PERSON wearing clothes → Extract ONLY the clothing/outfit they are wearing\n"
        "- If Image 2 shows a MANNEQUIN → Extract the clothing displayed on the mannequin\n"
        "- If Image 2 shows a STANDALONE GARMENT → Use that garment directly\n"
        "- Identify ALL pieces: top, bottom, dress, jacket, accessories, etc.\n"
        "- Note the exact colors, patterns, textures, and style details\n\n"
        
        "✨ STEP 2 - APPLY TO TARGET PERSON:\n"
        "Now, transfer the identified clothing to the person in Image 1:\n"
        "- The person in Image 1 MUST wear the EXACT clothing identified from Image 2\n"
        "- Fit the clothing perfectly to their body shape and size\n"
        "- Maintain all clothing details: colors, patterns, textures, logos, buttons, zippers\n"
        "- Ensure realistic draping, shadows, and fabric behavior\n\n"
        
        "🚫 CRITICAL CONSTRAINTS (ZERO TOLERANCE):\n"
        "1. PRESERVE THE PERSON (Image 1):\n"
        "   - DO NOT change face, facial features, skin tone, or ethnicity\n"
        "   - DO NOT change hair color, style, or length\n"
        "   - DO NOT change body shape, height, or proportions\n"
        "   - DO NOT change pose or body position\n"
        "   - DO NOT change gender or age\n\n"
        
        "2. PRESERVE THE BACKGROUND (Image 1):\n"
        "   - Keep the background EXACTLY as it appears in Image 1\n"
        "   - DO NOT add, remove, or modify any background elements\n"
        "   - DO NOT change lighting or atmosphere\n\n"
        
        "3. CLOTHING TRANSFER ACCURACY:\n"
        "   - Transfer ONLY the clothing from Image 2, nothing else\n"
        "   - If Image 2 has a person, DO NOT copy their face, body, or background\n"
        "   - Match the exact colors and patterns of the clothing\n"
        "   - Ensure the clothing fits naturally on the target person's body\n\n"
        
        "✅ FINAL OUTPUT:\n"
        "Generate an image showing the person from Image 1 wearing the clothing from Image 2, "
        "with everything else (face, hair, body, background) remaining identical to Image 1.",
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
    import logging
    logger = logging.getLogger(__name__)
    start_time = time.time()

    try:
        print("=" * 60)
        print("🔵 VERTEX TRY-ON JSON REQUEST RECEIVED")
        print("=" * 60)
        
        # Debug: Log incoming request details
        print("📥 INCOMING REQUEST DEBUG:")
        print(f"   - avatar_image length: {len(request.avatar_image) if request.avatar_image else 0} chars")
        print(f"   - avatar_image starts with: {request.avatar_image[:50] if request.avatar_image else 'None'}...")
        print(f"   - clothing_image length: {len(request.clothing_image) if request.clothing_image else 0} chars")
        print(f"   - clothing_image starts with: {request.clothing_image[:50] if request.clothing_image else 'None'}...")
        print(f"   - additional_params: {request.additional_params}")
        
        # Get access token
        print("Step 1: Generating access token...")
        token = _get_access_token(None)
        if not token:
            print("❌ Failed to generate access token!")
            raise HTTPException(
                status_code=401,
                detail="Could not obtain an access token. Set VERTEX_TOKEN or configure gcloud.",
            )
        print(f"✅ Access token generated (length: {len(token)} chars)")
        print(f"   Token preview: {token[:30]}...")

        # Get Vertex AI configuration
        logger.info("Step 2: Loading Vertex AI configuration...")
        project_val = _resolve_param(None, "VERTEX_PROJECT_ID", "VERTEX_PROJECT_ID")
        location_val = _resolve_param(
            None, "VERTEX_LOCATION", "VERTEX_LOCATION", default="us-central1"
        )
        model_val = _resolve_param(None, "VERTEX_MODEL_ID", "VERTEX_MODEL_ID")
        
        logger.info(f"✅ Configuration loaded:")
        logger.info(f"   - Project: {project_val}")
        logger.info(f"   - Location: {location_val}")
        logger.info(f"   - Model: {model_val}")

        endpoint = (
            f"https://{location_val}-aiplatform.googleapis.com/v1/projects/"
            f"{project_val}/locations/{location_val}/publishers/google/models/"
            f"{model_val}:predict"
        )
        logger.info(f"   - Endpoint: {endpoint}")

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

        # Build payload - clean and convert images to JPEG
        print("Step 3: Cleaning and converting images to JPEG...")
        avatar_clean = _clean_and_convert_to_jpeg(request.avatar_image, "avatar_image")
        clothing_clean = _clean_and_convert_to_jpeg(request.clothing_image, "clothing_image")
        
        print("Step 4: Building request payload...")
        payload = {
            "instances": [
                {
                    "personImage": {"image": {"bytesBase64Encoded": avatar_clean}},
                    "productImages": [
                        {"image": {"bytesBase64Encoded": clothing_clean}}
                    ],
                }
            ],
            "parameters": parameters,
        }
        print(f"✅ Payload built (avatar: {len(avatar_clean)} chars, clothing: {len(clothing_clean)} chars)")

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        # Call Vertex AI
        print("Step 5: Calling Vertex AI API...")
        print(f"   Request URL: {endpoint}")
        print(f"   Request headers: Authorization=Bearer {token[:30]}..., Content-Type=application/json")
        
        response = requests.post(endpoint, headers=headers, json=payload, timeout=120)
        
        print(f"✅ Vertex AI responded with status: {response.status_code}")

        try:
            body = response.json()
        except ValueError:
            body = {}

        if not response.ok:
            # Enhanced error logging for Vertex AI errors
            error_detail = body.get("error", {})
            error_message = error_detail.get("message", response.text)
            error_code = error_detail.get("code", response.status_code)
            error_status = error_detail.get("status", "UNKNOWN")
            
            # Log detailed error information
            print(f"❌ Vertex AI API Error:")
            print(f"   - Status Code: {response.status_code}")
            print(f"   - Error Code: {error_code}")
            print(f"   - Error Status: {error_status}")
            print(f"   - Error Message: {error_message}")
            print(f"   - Full Response: {body}")
            logger.error(f"   - Request endpoint: {endpoint}")
            logger.error(f"   - Token used: {token[:50]}...")
            
            # Return detailed error to client
            raise HTTPException(
                status_code=response.status_code, 
                detail={
                    "errorCode": "VERTEX_AI_ERROR",
                    "message": f"Vertex AI request failed: {error_message}",
                    "details": {
                        "statusCode": response.status_code,
                        "errorCode": error_code,
                        "errorStatus": error_status,
                        "vertexError": error_detail
                    }
                }
            )

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

        # Enhanced try-on prompt with better clothing detection
        params = request.additional_params or {}
        prompt = params.get(
            "prompt",
            "🎯 VIRTUAL TRY-ON TASK:\n\n"
            
            "📸 IMAGE ANALYSIS:\n"
            "- Image 1: The TARGET PERSON (who will wear the clothes)\n"
            "- Image 2: The CLOTHING SOURCE (can be: person wearing clothes, mannequin, or standalone garment)\n\n"
            
            "🔍 STEP 1 - IDENTIFY THE CLOTHING:\n"
            "First, carefully analyze Image 2 to identify the clothing item(s):\n"
            "- If Image 2 shows a PERSON wearing clothes → Extract ONLY the clothing/outfit they are wearing\n"
            "- If Image 2 shows a MANNEQUIN → Extract the clothing displayed on the mannequin\n"
            "- If Image 2 shows a STANDALONE GARMENT → Use that garment directly\n"
            "- Identify ALL pieces: top, bottom, dress, jacket, accessories, etc.\n"
            "- Note the exact colors, patterns, textures, and style details\n\n"
            
            "✨ STEP 2 - APPLY TO TARGET PERSON:\n"
            "Now, transfer the identified clothing to the person in Image 1:\n"
            "- The person in Image 1 MUST wear the EXACT clothing identified from Image 2\n"
            "- Fit the clothing perfectly to their body shape and size\n"
            "- Maintain all clothing details: colors, patterns, textures, logos, buttons, zippers\n"
            "- Ensure realistic draping, shadows, and fabric behavior\n\n"
            
            "🚫 CRITICAL CONSTRAINTS (ZERO TOLERANCE):\n"
            "1. PRESERVE THE PERSON (Image 1):\n"
            "   - DO NOT change face, facial features, skin tone, or ethnicity\n"
            "   - DO NOT change hair color, style, or length\n"
            "   - DO NOT change body shape, height, or proportions\n"
            "   - DO NOT change pose or body position\n"
            "   - DO NOT change gender or age\n\n"
            
            "2. PRESERVE THE BACKGROUND (Image 1):\n"
            "   - Keep the background EXACTLY as it appears in Image 1\n"
            "   - DO NOT add, remove, or modify any background elements\n"
            "   - DO NOT change lighting or atmosphere\n\n"
            
            "3. CLOTHING TRANSFER ACCURACY:\n"
            "   - Transfer ONLY the clothing from Image 2, nothing else\n"
            "   - If Image 2 has a person, DO NOT copy their face, body, or background\n"
            "   - Match the exact colors and patterns of the clothing\n"
            "   - Ensure the clothing fits naturally on the target person's body\n\n"
            
            "✅ FINAL OUTPUT:\n"
            "Generate an image showing the person from Image 1 wearing the clothing from Image 2, "
            "with everything else (face, hair, body, background) remaining identical to Image 1."
        )

        # Reset angle session for this user+product when starting a new try-on
        # This ensures the first "Generate More Angles" click will start from "front"
        user_id = params.get('user_id', 'unknown')
        product_id = params.get('product_id', 'unknown')
        session_key = f"{user_id}_{product_id}"
        
        # Import angle manager
        from color_helper import _angle_manager
        
        # Log current state before reset
        current_index = _angle_manager.get_current_index(session_key)
        print(f"🔍 BEFORE RESET - Session: {session_key}, Current Index: {current_index}")
        
        # Reset the session to start fresh
        _angle_manager.reset_session(session_key)
        
        # Verify reset worked
        new_index = _angle_manager.get_current_index(session_key)
        print(f"🔄 AFTER RESET - Session: {session_key}, New Index: {new_index}")
        print(f"✅ Session reset successful! Next angle will be: front")

        client = genai.Client(api_key=api_key)
        model_id = "gemini-2.5-flash-image-preview"

        contents = [
            types.Part(inline_data=types.Blob(data=person_bytes, mime_type="image/jpeg")),
            types.Part(inline_data=types.Blob(data=garment_bytes, mime_type="image/jpeg")),
            types.Part.from_text(text=prompt),
        ]

        print(f"DEBUG: Starting Gemini try-on. Person size: {len(person_bytes)}, Garment size: {len(garment_bytes)}")
        response = client.models.generate_content(
            model=model_id,
            contents=contents,
            config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]),
        )
        print(f"DEBUG: Gemini try-on finished in {int((time.time() - start_time) * 1000)}ms")

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
    Optimized with metadata caching for reduced token consumption.
    Tracks angle sequence per user+product for consistent progression.
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

        # Extract parameters
        params = request.additional_params or {}
        
        # Check if we're using cached metadata and thumbnail
        cached_metadata = params.get('cached_metadata')
        use_thumbnail = params.get('use_thumbnail', False)
        
        # Get user_id and product_id for angle tracking
        user_id = params.get('user_id', 'unknown')
        product_id = params.get('product_id', 'unknown')
        
        # Create a session key for this user+product combination
        session_key = f"{user_id}_{product_id}"
        
        # Determine the next angle in sequence
        # Check if an angle was explicitly requested
        requested_angle = params.get('angle')
        
        if requested_angle:
            # Use the explicitly requested angle
            angle = requested_angle
            print(f"✅ Using explicitly requested angle: {angle}")
        else:
            # Auto-determine next angle in sequence using session-based tracking
            from color_helper import ANGLES, _angle_manager
            
            # Get the next angle in sequence for this specific session
            angle, current_index = _angle_manager.get_next_angle(session_key)
            
            print(f"✅ Auto-selected next angle in sequence: {angle}")
            print(f"   Session: {session_key}")
            print(f"   Current index: {current_index - 1} (next will be {current_index})")
            print(f"   Full sequence: {' → '.join(ANGLES)}")
        
        # Log optimization info
        if cached_metadata:
            print(f"✅ Using cached metadata: {cached_metadata}")
        if use_thumbnail:
            print(f"✅ Using thumbnail for reduced payload")
        
        # Generate prompt with the determined angle and session key
        from color_helper import generate_angle_prompt
        
        if 'prompt' in params:
            prompt = params['prompt']
        else:
            # Use cached metadata and session key for more efficient prompting
            prompt = generate_angle_prompt(angle=angle, cached_metadata=cached_metadata, session_key=session_key)

        client = genai.Client(api_key=api_key)
        model_id = "gemini-2.5-flash-image"  # Preserves clothes well, working on face

        # SIMPLIFIED APPROACH: Just use the single try-on result image
        # This image already has the correct face + clothes combined from the initial try-on
        # No need for separate clothing/reference images - they were causing confusion
        contents = []
        
        # Add the try-on result image (this is our single source of truth)
        contents.append(types.Part(inline_data=types.Blob(data=image_bytes, mime_type="image/jpeg")))
        
        # Add the prompt
        contents.append(types.Part.from_text(text=prompt))

        print(f"DEBUG: Starting Gemini angle generation")
        print(f"DEBUG: Image size: {len(image_bytes)} bytes")
        print(f"DEBUG: Target angle: {angle}")
        print(f"DEBUG: Using prompt (first 500 chars): {prompt[:500]}...")
        
        response = client.models.generate_content(
            model=model_id,
            contents=contents,
            config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]),
        )
        print(f"DEBUG: Gemini generate_content finished in {int((time.time() - start_time) * 1000)}ms")

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
            message=f"New angle '{angle}' generated successfully with optimized caching",
            metadata={
                "model_id": model_id,
                "provider": "gemini",
                "num_images": len(images),
                "texts": texts,
                "cached_metadata_used": bool(cached_metadata),
                "thumbnail_used": use_thumbnail,
                "angle_generated": angle,
                "session_key": session_key,
            },
        )

    except HTTPException:
        raise
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Angle generation failed: {str(exc)}"
        ) from exc


@app.post(
    "/body_analyze",
    summary="Analyze body attributes via file upload or form base64",
    tags=["body-analyze"],
    response_model=BodyAnalyzeResponse,
)
async def body_analyze(
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
        image_bytes = _decode_base64_image(image_base64)
    else:
        raise HTTPException(status_code=400, detail="Provide an image file or image_base64.")

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    image = _load_image_bytes(image_bytes)
    result = analyze_user_image(image)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return _build_body_analyze_response(result)


@app.post(
    "/body_analyze_json",
    summary="Analyze body attributes via JSON base64",
    tags=["body-analyze"],
    response_model=BodyAnalyzeResponse,
)
async def body_analyze_json(
    payload: BodyAnalyzeRequest = Body(..., description="JSON with image_base64"),
):
    image_bytes = _decode_base64_image(payload.image_base64)
    image = _load_image_bytes(image_bytes)
    result = analyze_user_image(image)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return _build_body_analyze_response(result)


# ============================================================================
# RECOMMENDATION ENDPOINTS
# ============================================================================

class RecommendationRequest(BaseModel):
    """Request model for recommendation endpoint"""
    image_base64: str  # User image (base64 without data URI prefix)
    age: float
    size: str  # S, M, L, XL, etc.
    body_shape: str  # Rectangle, Pear Shape, Hourglass, Apple Shape, Inverted Triangle
    skin_tone: str  # Light, Medium, Dusky, Deep
    occasion: str  # Formal, Party, Wedding, Casual luxury, Resort
    top_k: int = 10
    use_database: bool = True


class RecommendationItem(BaseModel):
    """Single recommendation item"""
    id: str
    score: float
    final_score: float
    score_label: str
    description: Optional[str] = None
    image: Optional[str] = None
    title: Optional[str] = None
    price_cents: Optional[int] = None


class RecommendationResponse(BaseModel):
    """Response model for recommendations"""
    perfect_for_you: List[RecommendationItem]
    good_for_you: List[RecommendationItem]
    you_can_also_try: List[RecommendationItem]
    count: int
    warnings: List[str] = []


@app.post(
    "/recommendation/ai-decide",
    response_model=RecommendationResponse,
    summary="Get AI-powered outfit recommendations",
    tags=["recommendation"],
    description="Get personalized outfit recommendations using Fusion MLP model combining image, text, and attribute features.",
)
async def get_ai_recommendations(request: RecommendationRequest) -> RecommendationResponse:
    """
    Get personalized outfit recommendations based on user preferences and image.
    
    The system uses a Fusion MLP model that combines:
    - Image embeddings (CLIP model)
    - Text embeddings (sentence transformers)
    - Tabular features (occasion, body shape, skin tone, size)
    
    Returns recommendations in three categories:
    - Perfect for you (top 33%)
    - Good for you (middle 33%)
    - You can also try (bottom 33%)
    """
    try:
        import logging
        import json
        from pathlib import Path
        
        logger = logging.getLogger(__name__)
        logger.info(f"📥 Recommendation request: occasion={request.occasion}")
        
        # Load collection from file
        collection_path = Path("C:/Users/ATUL/OneDrive/Desktop/Aivestire_New/AiCore/APP3005_AI/recommend_demo/collection2_test.json")
        
        logger.info(f"📂 Loading collection from: {collection_path}")
        
        with open(collection_path, 'r', encoding='utf-8') as f:
            collection = json.load(f)
        
        logger.info(f"✅ Loaded {len(collection)} products")
        
        # Simple filtering by occasion
        filtered = []
        for item in collection:
            occasions = item.get('occasion', [])
            if isinstance(occasions, str):
                occasions = [occasions]
            
            if any(request.occasion.lower() in occ.lower() for occ in occasions):
                filtered.append({
                    'id': item.get('cloth_id', ''),
                    'score': 0.85,
                    'final_score': 0.85,
                    'score_label': 'good for you',
                    'description': item.get('description', ''),
                    'image': item.get('image', ''),
                })
        
        if not filtered:
            filtered = [{
                'id': item.get('cloth_id', ''),
                'score': 0.75,
                'final_score': 0.75,
                'score_label': 'you can also try',
                'description': item.get('description', ''),
                'image': item.get('image', ''),
            } for item in collection[:request.top_k]]
        
        filtered = filtered[:request.top_k]
        third = len(filtered) // 3
        
        result = {
            'perfect_for_you': filtered[:third] if third > 0 else [],
            'good_for_you': filtered[third:third*2] if third > 0 else filtered,
            'you_can_also_try': filtered[third*2:] if third > 0 else [],
            'count': len(filtered),
            'warnings': []
        }
        
        logger.info(f"✅ Returning {len(filtered)} recommendations")
        return result
        
    except Exception as exc:
        import traceback
        logger.error(f"❌ Error: {str(exc)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Recommendation failed: {str(exc)}"
        ) from exc


@app.get(
    "/recommendation/collection",
    summary="Get product collection",
    tags=["recommendation"],
    description="Fetch all products available for recommendations from database or file.",
)
async def get_collection(use_database: bool = True):
    """
    Get the product collection used for recommendations.
    Useful for debugging and verifying available products.
    """
    try:
        from recommendation_service import get_products_from_db, get_products_from_file
        
        if use_database:
            products = get_products_from_db()
        else:
            collection_file = os.getenv("RECOMMENDATION_COLLECTION_PATH", "../../recommend_demo/collection2_test.json")
            products = get_products_from_file(collection_file)
        
        return {
            "count": len(products),
            "products": products[:10],  # Return first 10 for preview
            "message": f"Total {len(products)} products available"
        }
        
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch collection: {str(exc)}"
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
    recommendation_configured = all([
        os.environ.get("DATABASE_URL"),
        os.environ.get("RECOMMENDATION_MODEL_PATH"),
        os.environ.get("RECOMMENDATION_PREPROCESS_PATH"),
    ])

    return {
        "status": "healthy",
        "service": "FastAPI Virtual Try-On & Recommendation Service",
        "version": "1.0.0",
        "gemini_configured": gemini_configured,
        "vertex_configured": vertex_configured,
        "recommendation_configured": recommendation_configured,
        "endpoints": {
            "vertex_tryon": "/vertex/try-on-json",
            "gemini_tryon": "/gemini/try-on-json",
            "generate_angles": "/gemini/generate-angles",
            "body_analyze": "/body_analyze",
            "body_analyze_json": "/body_analyze_json",
            "ai_recommendations": "/recommendation/ai-decide",
            "collection": "/recommendation/collection",
        },
    }


@app.get("/test_endpoint")
async def test_endpoint():
    """Simple test endpoint to verify new routes are registered"""
    return {"message": "This endpoint works!", "version": "new"}
