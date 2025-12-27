import base64
import json
import os
import subprocess
from typing import Dict, List, Optional

import requests
import streamlit as st


def encode_uploaded_file(uploaded_file) -> str:
    """Return base64-encoded content of a Streamlit UploadedFile."""
    return base64.b64encode(uploaded_file.getvalue()).decode("utf-8")


def get_access_token(manual_token: str) -> Optional[str]:
    """Use a provided token, env var, or gcloud to get an access token."""
    if manual_token:
        return manual_token.strip()

    env_token = os.environ.get("VERTEX_TOKEN") or os.environ.get("ACCESS_TOKEN")
    if env_token:
        return env_token.strip()

    try:
        return (
            subprocess.check_output(
                ["gcloud", "auth", "print-access-token"], text=True
            )
            .strip()
        )
    except Exception:
        return None


def build_parameters(
    add_watermark: bool,
    base_steps: int,
    person_generation: str,
    safety_setting: str,
    sample_count: int,
    seed: Optional[int],
    storage_uri: str,
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


def extract_base64_images(predictions: List[Dict]) -> List[str]:
    """Attempt to pull base64 images from typical Vertex responses."""
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


st.set_page_config(page_title="Vertex AI Virtual Try-On", page_icon="🧥")
st.title("Vertex AI Virtual Try-On")
st.caption(
    "Upload a person image and a garment image, then call the Vertex AI virtual try-on model."
)

col1, col2 = st.columns(2)
person_file = col1.file_uploader(
    "Person image", type=["png", "jpg", "jpeg", "webp"], accept_multiple_files=False
)
garment_file = col2.file_uploader(
    "Garment image", type=["png", "jpg", "jpeg", "webp"], accept_multiple_files=False
)

st.divider()
st.subheader("Vertex AI settings")
project_id = st.text_input(
    "Project ID", value="project-e849184b-cc5d-4f74-93b", placeholder="my-gcp-project"
)
location = st.text_input("Location", value="us-central1")
model_options = ["virtual-try-on-preview-08-04", "virtual-try-on-exp-05-31", "Custom"]
model_choice = st.selectbox("Model ID", options=model_options, index=0)
custom_model_id = ""
if model_choice == "Custom":
    custom_model_id = st.text_input(
        "Custom model ID", placeholder="virtual-try-on-preview-08-04"
    )
model_id = custom_model_id.strip() if model_choice == "Custom" else model_choice
token_input = st.text_input(
    "Access token (optional, falls back to env or gcloud)", type="password"
)

st.subheader("Generation parameters")
add_watermark = st.checkbox("addWatermark", value=True)
base_steps = st.slider("baseSteps", 4, 50, 30)
sample_count = st.slider("sampleCount", 1, 4, 1)
seed_val = st.number_input("seed (optional)", min_value=0, step=1, value=0)
use_seed = st.checkbox("Use seed value", value=False)
person_generation = st.text_input(
    "personGeneration (optional)", placeholder="Leave blank for default"
)
safety_setting = st.text_input(
    "safetySetting (optional)", placeholder="e.g. BLOCK_MEDIUM_AND_ABOVE"
)
storage_uri = st.text_input(
    "storageUri (optional GCS path for outputs)", placeholder="gs://bucket/output/"
)
mime_type = st.selectbox("Output mimeType", ["image/png", "image/jpeg"], index=0)
compression_quality: Optional[int] = None
if mime_type == "image/jpeg":
    compression_quality = st.slider("compressionQuality (JPEG only)", 1, 100, 90)
else:
    st.caption("compressionQuality is ignored for PNG outputs.")

if st.button("Generate try-on image"):
    if not person_file or not garment_file:
        st.error("Please upload both a person image and a garment image.")
        st.stop()
    if not project_id.strip() or not location.strip() or not model_id:
        st.error("Project ID, location, and model ID are required.")
        st.stop()

    token = get_access_token(token_input)
    if not token:
        st.error(
            "Could not obtain an access token. Provide one or run `gcloud auth application-default login`."
        )
        st.stop()

    endpoint = (
        f"https://{location}-aiplatform.googleapis.com/v1/projects/"
        f"{project_id}/locations/{location}/publishers/google/models/"
        f"{model_id}:predict"
    )

    parameters = build_parameters(
        add_watermark=add_watermark,
        base_steps=base_steps,
        person_generation=person_generation,
        safety_setting=safety_setting,
        sample_count=sample_count,
        seed=seed_val if use_seed else None,
        storage_uri=storage_uri,
        mime_type=mime_type,
        compression_quality=compression_quality,
    )

    payload = {
        "instances": [
            {
                "personImage": {
                    "image": {"bytesBase64Encoded": encode_uploaded_file(person_file)}
                },
                "productImages": [
                    {
                        "image": {
                            "bytesBase64Encoded": encode_uploaded_file(garment_file)
                        }
                    }
                ],
            }
        ],
        "parameters": parameters,
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    with st.spinner("Calling Vertex AI..."):
        try:
            response = requests.post(
                endpoint, headers=headers, json=payload, timeout=120
            )
        except Exception as exc:
            st.error(f"Request failed: {exc}")
            st.stop()

    st.subheader("Raw response")
    try:
        st.code(json.dumps(response.json(), indent=2))
    except Exception:
        st.write(response.text)

    if not response.ok:
        st.error(f"Vertex AI returned HTTP {response.status_code}")
        st.stop()

    predictions = response.json().get("predictions", [])
    images_b64 = extract_base64_images(predictions)

    if images_b64:
        st.subheader("Generated try-on")
        for idx, b64_img in enumerate(images_b64, start=1):
            st.image(base64.b64decode(b64_img), caption=f"Prediction {idx}")
    else:
        st.warning("No image data found in the response predictions.")
