import base64
import os
from pathlib import Path
from typing import Dict, List, Optional

import requests
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from google.auth.transport.requests import Request
from google.oauth2 import service_account
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


def _clean_and_convert_to_jpeg(base64_string: str, field_name: str = "image") -> str:
    """
    Clean, validate, and convert base64 image to JPEG format.
    - Removes data URI prefixes
    - Removes whitespace and line breaks
    - Converts PNG/AVIF/WebP to JPEG (Vertex AI only accepts JPEG)
    - Returns clean base64 JPEG string
    """
    import re
    import io
    from PIL import Image
    
    if not base64_string:
        raise HTTPException(status_code=400, detail=f"Empty {field_name} data provided.")
    
    original_len = len(base64_string)
    print(f"   Processing {field_name}: {original_len} chars")
    
    # Remove data URI prefix if present
    if base64_string.startswith('data:'):
        match = re.match(r'^data:[^;]+;base64,(.+)$', base64_string, re.DOTALL)
        if match:
            base64_string = match.group(1)
            print(f"   Stripped data URI prefix (now {len(base64_string)} chars)")
    
    # Remove any whitespace, newlines, or carriage returns
    base64_string = re.sub(r'\s+', '', base64_string)
    
    # Fix padding if needed
    padding_needed = len(base64_string) % 4
    if padding_needed:
        base64_string += '=' * (4 - padding_needed)
    
    # Decode the base64
    try:
        image_bytes = base64.b64decode(base64_string, validate=True)
        print(f"   Decoded: {len(image_bytes)} bytes")
    except Exception as e:
        print(f"   ❌ Base64 decode failed: {e}")
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid base64 {field_name}: {str(e)[:100]}"
        )
    
    # Detect image format by magic bytes
    if image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
        format_detected = "PNG"
    elif image_bytes[:2] == b'\xff\xd8':
        format_detected = "JPEG"
    elif image_bytes[:4] == b'RIFF' and image_bytes[8:12] == b'WEBP':
        format_detected = "WebP"
    elif image_bytes[:4] in (b'\x00\x00\x00\x1c', b'\x00\x00\x00 '):
        format_detected = "AVIF/HEIC"
    else:
        format_detected = "Unknown"
    
    print(f"   Detected format: {format_detected}")
    
    # If not JPEG, convert to JPEG
    if format_detected != "JPEG":
        try:
            print(f"   Converting {format_detected} to JPEG...")
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary (for PNG with alpha channel)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if 'A' in img.mode else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Save as JPEG
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=90, optimize=True)
            jpeg_bytes = output.getvalue()
            
            # Re-encode to base64
            base64_string = base64.b64encode(jpeg_bytes).decode('utf-8')
            print(f"   ✅ Converted to JPEG: {len(jpeg_bytes)} bytes -> {len(base64_string)} chars")
            
        except Exception as e:
            print(f"   ❌ Image conversion failed: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Failed to convert {field_name} to JPEG: {str(e)[:100]}"
            )
    else:
        print(f"   ✅ Already JPEG, no conversion needed")
    
    return base64_string


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
