import mimetypes
import os
import time
from typing import List, Tuple

import streamlit as st
from google import genai
from google.genai import types

MODEL_NAME = "gemini-2.5-flash-image-preview"
DEFAULT_AVATAR_PROMPT = (
    "Transform this person into a polished 3D MetaHuman-style avatar. Clean the "
    "background, beautify the face while keeping identity, enhance lighting and skin, "
    "and render with a realistic high-detail studio look."
)
DEFAULT_TRYON_PROMPT = (
    "Put the clothing/garment from the second image onto the person in the first "
    "image. Match pose, lighting, and proportions, and keep the person's face and "
    "body consistent."
)


def _determine_prompt(user_prompt: str, fallback: str) -> str:
    """Use the user's prompt when provided, otherwise fall back to the default."""
    cleaned = (user_prompt or "").strip()
    return cleaned if cleaned else fallback


def _prepare_image_parts(
    uploaded_files: list,
) -> Tuple[List[types.Part], List[Tuple[str, bytes]]]:
    """Convert uploaded images into GenAI Parts and keep bytes for preview."""
    parts: List[types.Part] = []
    previews: List[Tuple[str, bytes]] = []

    for idx, uploaded in enumerate(uploaded_files):
        data = uploaded.getvalue()
        name = uploaded.name or f"upload-{idx + 1}"
        mime_type = uploaded.type or mimetypes.guess_type(name)[0]
        if not mime_type:
            raise ValueError(f"Could not determine MIME type for {name}")

        parts.append(types.Part(inline_data=types.Blob(data=data, mime_type=mime_type)))
        previews.append((name, data))

    return parts, previews


def _part_from_bytes(name: str, data: bytes, mime_type: str) -> Tuple[types.Part, Tuple[str, bytes]]:
    """Create a GenAI Part from raw bytes and return the preview tuple."""
    mime = mime_type or mimetypes.guess_type(name)[0] or "application/octet-stream"
    return types.Part(inline_data=types.Blob(data=data, mime_type=mime)), (name, data)


def _remix_images(
    api_key: str, contents: List[types.Part], prompt: str
) -> Tuple[List[Tuple[str, bytes]], List[str]]:
    """Call the GenAI API and return generated images (name, bytes) and any text."""
    client = genai.Client(api_key=api_key)
    contents_with_prompt = list(contents)
    contents_with_prompt.append(types.Part.from_text(text=prompt))

    config = types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"])

    images: List[Tuple[str, bytes]] = []
    texts: List[str] = []

    stream = client.models.generate_content_stream(
        model=MODEL_NAME, contents=contents_with_prompt, config=config
    )

    for chunk in stream:
        if (
            chunk.candidates is None
            or chunk.candidates[0].content is None
            or chunk.candidates[0].content.parts is None
        ):
            continue

        for part in chunk.candidates[0].content.parts:
            if part.inline_data and part.inline_data.data:
                file_extension = (
                    mimetypes.guess_extension(part.inline_data.mime_type) or ".bin"
                )
                file_name = (
                    f"remixed_image_{int(time.time())}_{len(images)}{file_extension}"
                )
                images.append((file_name, part.inline_data.data))
            elif part.text:
                texts.append(part.text)

    return images, texts


def _save_images_to_disk(images: List[Tuple[str, bytes]], output_dir: str) -> list[str]:
    """Persist generated images to disk to mirror CLI behavior."""
    saved_paths: list[str] = []
    if not images:
        return saved_paths

    os.makedirs(output_dir, exist_ok=True)
    for file_name, data in images:
        file_path = os.path.join(output_dir, file_name)
        with open(file_path, "wb") as f:
            f.write(data)
        saved_paths.append(file_path)
    return saved_paths


def _remember_latest_avatar(images: List[Tuple[str, bytes]]):
    """Keep the first avatar handy for the try-on step."""
    if not images:
        return
    file_name, data = images[0]
    st.session_state["latest_avatar"] = {
        "name": file_name,
        "data": data,
        "mime_type": mimetypes.guess_type(file_name)[0] or "application/octet-stream",
    }


def main():
    st.set_page_config(
        page_title="Avatar + Virtual Try-On",
        page_icon="🧬",
        layout="wide",
    )

    if "avatar_results" not in st.session_state:
        st.session_state["avatar_results"] = []
    if "tryon_results" not in st.session_state:
        st.session_state["tryon_results"] = []
    if "latest_avatar" not in st.session_state:
        st.session_state["latest_avatar"] = None

    st.title("Avatar Creation + Virtual Try-On")
    st.write(
        "Step 1 generates a polished MetaHuman-style avatar from your photo. "
        "Step 2 takes that avatar (or another model image) plus a garment/reference "
        "image and runs a virtual try-on."
    )

    api_key = st.text_input(
        "GEMINI_API_KEY",
        value=os.environ.get("GEMINI_API_KEY", "AIzaSyD8LhrD6gVt9v3CoH2gbrOXwWV3EpkQ4GM"),
        type="password",
        help="Stored in memory for this session only.",
    )

    save_to_disk = st.checkbox(
        "Save generated images to disk (mirrors CLI behavior)",
        value=True,
    )
    output_dir = st.text_input(
        "Output directory",
        value="output",
        disabled=not save_to_disk,
        help="Files are saved with time-based names, just like the CLI script.",
    )

    st.markdown("---")
    st.header("Step 1: Create a MetaHuman-style avatar")
    st.write(
        "Upload a single photo. The model will clean the background, beautify the face, "
        "and render a realistic 3D-like avatar."
    )
    st.caption(
        "The first generated avatar is saved and automatically used as the model image in Step 2."
    )

    avatar_file = st.file_uploader(
        "Person image (Step 1)",
        type=["png", "jpg", "jpeg", "webp"],
        accept_multiple_files=False,
        key="avatar_uploader",
    )

    avatar_prompt_input = st.text_area(
        "Avatar prompt (optional)",
        value=DEFAULT_AVATAR_PROMPT,
        height=120,
    )

    col_avatar_actions = st.columns([1, 1])
    with col_avatar_actions[0]:
        avatar_clicked = st.button("Generate Avatar", type="primary")
    with col_avatar_actions[1]:
        avatar_clear = st.button("Clear Avatar Runs")

    if avatar_clear:
        st.session_state["avatar_results"] = []
        st.session_state["latest_avatar"] = None
        st.rerun()

    if avatar_file:
        st.subheader("Preview")
        st.image(
            avatar_file.getvalue(),
            caption=avatar_file.name or "avatar source",
            use_column_width=True,
        )

    if avatar_clicked:
        if not api_key:
            st.error("Please provide a GEMINI_API_KEY.")
            st.stop()

        if not avatar_file:
            st.error("Upload one person image to create an avatar.")
            st.stop()

        try:
            parts, previews = _prepare_image_parts([avatar_file])
        except ValueError as e:
            st.error(str(e))
            st.stop()

        prompt = _determine_prompt(avatar_prompt_input, DEFAULT_AVATAR_PROMPT)

        with st.spinner("Generating avatar..."):
            try:
                images, texts = _remix_images(api_key, parts, prompt)
            except Exception as e:
                st.error(f"Generation failed: {e}")
                st.stop()

        saved_paths: list[str] = []
        if save_to_disk:
            try:
                saved_paths = _save_images_to_disk(images, output_dir)
            except Exception as e:
                st.error(f"Failed to save images: {e}")

        if not images and not texts:
            st.warning("No output returned by the model.")
        else:
            _remember_latest_avatar(images)
            st.session_state["avatar_results"].insert(
                0,
                {
                    "prompt": prompt,
                    "images": images,
                    "texts": texts,
                    "inputs": previews,
                    "saved_paths": saved_paths,
                },
            )

    if st.session_state["avatar_results"]:
        st.subheader("Avatar outputs")
        for idx, result in enumerate(st.session_state["avatar_results"]):
            with st.expander(f"Avatar run #{idx + 1} — Prompt: {result['prompt']}", expanded=(idx == 0)):
                if result["images"]:
                    st.write("Generated avatars")
                    for file_name, data in result["images"]:
                        st.image(data, caption=file_name, use_column_width=True)
                        st.download_button(
                            label=f"Download {file_name}",
                            data=data,
                            file_name=file_name,
                            mime=mimetypes.guess_type(file_name)[0] or "application/octet-stream",
                        )
                if result["texts"]:
                    st.write("Model messages")
                    for text in result["texts"]:
                        st.write(text)
                if result.get("saved_paths"):
                    st.write("Saved to disk")
                    for path in result["saved_paths"]:
                        st.code(path)

    st.markdown("---")
    st.header("Step 2: Virtual try-on")
    st.write(
        "Step 1's avatar is auto-selected as the model image. You can still upload a "
        "different model if you want to override it. Add a garment/reference image "
        "(flat lay or someone wearing it) to transfer onto the model."
    )

    latest_avatar = st.session_state.get("latest_avatar")
    avatar_ready = latest_avatar is not None

    model_source_options: list[str] = []
    if avatar_ready:
        model_source_options.append("Use latest avatar from Step 1")
    model_source_options.append("Upload a different model image")

    model_source = st.radio(
        "Model image source",
        options=model_source_options,
        index=0,
        help="Defaults to the avatar you just generated.",
    )

    model_override = None
    if avatar_ready and model_source == "Use latest avatar from Step 1":
        st.success(
            f"Using latest avatar '{latest_avatar['name']}' as the model image for try-on."
        )
        st.image(latest_avatar["data"], caption="Latest avatar (model)", use_column_width=True)
    else:
        if not avatar_ready:
            st.warning("Generate an avatar in Step 1 or upload a model image override.")
        model_override = st.file_uploader(
            "Model image override",
            type=["png", "jpg", "jpeg", "webp"],
            accept_multiple_files=False,
            key="model_override_uploader",
            help="Optional: replace the Step 1 avatar with a different model image.",
        )

    garment_file = st.file_uploader(
        "Garment / reference image (required)",
        type=["png", "jpg", "jpeg", "webp"],
        accept_multiple_files=False,
        key="garment_uploader_step2",
    )

    tryon_prompt_input = st.text_area(
        "Virtual try-on prompt (optional)",
        value=DEFAULT_TRYON_PROMPT,
        height=120,
    )

    col_tryon_actions = st.columns([1, 1])
    with col_tryon_actions[0]:
        tryon_clicked = st.button("Run Virtual Try-On", type="primary")
    with col_tryon_actions[1]:
        tryon_clear = st.button("Clear Try-On Runs")

    if tryon_clear:
        st.session_state["tryon_results"] = []
        st.rerun()

    if tryon_clicked:
        if not api_key:
            st.error("Please provide a GEMINI_API_KEY.")
            st.stop()

        parts: List[types.Part] = []
        previews: List[Tuple[str, bytes]] = []

        # Determine the model image to use based on the selection above.
        use_latest_avatar = avatar_ready and model_source == "Use latest avatar from Step 1"
        if use_latest_avatar and latest_avatar:
            part, preview = _part_from_bytes(
                latest_avatar["name"], latest_avatar["data"], latest_avatar["mime_type"]
            )
            parts.append(part)
            previews.append(preview)
        elif model_override:
            try:
                override_parts, override_previews = _prepare_image_parts(
                    [model_override]
                )
                parts.extend(override_parts)
                previews.extend(override_previews)
            except ValueError as e:
                st.error(str(e))
                st.stop()
        else:
            st.error("Generate an avatar in Step 1 or upload a model image override.")
            st.stop()

        if not garment_file:
            st.error("Upload a garment/reference image.")
            st.stop()

        try:
            garment_parts, garment_previews = _prepare_image_parts([garment_file])
            parts.extend(garment_parts)
            previews.extend(garment_previews)
        except ValueError as e:
            st.error(str(e))
            st.stop()

        prompt = _determine_prompt(tryon_prompt_input, DEFAULT_TRYON_PROMPT)

        with st.spinner("Running virtual try-on..."):
            try:
                images, texts = _remix_images(api_key, parts, prompt)
            except Exception as e:
                st.error(f"Generation failed: {e}")
                st.stop()

        saved_paths: list[str] = []
        if save_to_disk:
            try:
                saved_paths = _save_images_to_disk(images, output_dir)
            except Exception as e:
                st.error(f"Failed to save images: {e}")

        if not images and not texts:
            st.warning("No output returned by the model.")
        else:
            st.session_state["tryon_results"].insert(
                0,
                {
                    "prompt": prompt,
                    "images": images,
                    "texts": texts,
                    "inputs": previews,
                    "saved_paths": saved_paths,
                },
            )

    if st.session_state["tryon_results"]:
        st.subheader("Virtual try-on results")
        for idx, result in enumerate(st.session_state["tryon_results"]):
            with st.expander(f"Try-on run #{idx + 1} — Prompt: {result['prompt']}", expanded=(idx == 0)):
                if result["images"]:
                    st.write("Generated images")
                    for file_name, data in result["images"]:
                        st.image(data, caption=file_name, use_column_width=True)
                        st.download_button(
                            label=f"Download {file_name}",
                            data=data,
                            file_name=file_name,
                            mime=mimetypes.guess_type(file_name)[0] or "application/octet-stream",
                        )
                if result["texts"]:
                    st.write("Model messages")
                    for text in result["texts"]:
                        st.write(text)
                if result.get("saved_paths"):
                    st.write("Saved to disk")
                    for path in result["saved_paths"]:
                        st.code(path)


if __name__ == "__main__":
    main()
