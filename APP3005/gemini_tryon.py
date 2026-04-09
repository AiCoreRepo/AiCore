"""
Gemini Virtual Try-On — Single File Python Service
====================================================
Upload an avatar image and a clothing image, then click "Try On" to
generate a photorealistic try-on result using Google Gemini's
image-generation model (gemini-2.0-flash-preview-image-generation).

Requirements:
    pip install google-generativeai gradio pillow python-dotenv

Usage:
    python gemini_tryon.py
    # or set GEMINI_API_KEY env var / create a .env file in the same folder
"""

import os
import base64
import io
import sys

# ── Load .env if present ────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    # Look for .env in same dir as this script, then cwd
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
    load_dotenv()  # also try cwd
except ImportError:
    pass  # python-dotenv not installed; rely on shell env

# ── Third-party imports ──────────────────────────────────────────────────────
try:
    import google.generativeai as genai
except ImportError:
    sys.exit(
        "❌  google-generativeai not installed.\n"
        "    Run:  pip install google-generativeai gradio pillow python-dotenv"
    )

try:
    import gradio as gr
except ImportError:
    sys.exit(
        "❌  gradio not installed.\n"
        "    Run:  pip install google-generativeai gradio pillow python-dotenv"
    )

from PIL import Image

# ── Constants ────────────────────────────────────────────────────────────────
# Use the image-generation capable model
MODEL_ID = os.environ.get(
    "GEMINI_MODEL", "gemini-3.1-flash-image-preview"
)

TRYON_PROMPT = """You are a professional virtual try-on AI system.

Task: Generate a photorealistic image of the person in Image 1 wearing the clothing item shown in Image 2.

Rules:
- Preserve the exact person identity, face, skin tone, body shape, pose, and background from Image 1
- Replace only the clothing/outfit with the garment from Image 2
- Maintain natural lighting, shadows, and fabric texture
- The result should look like a real photograph, not an illustration
- Do NOT add any text, watermarks, or artifacts

Output: A single photorealistic image of the person wearing the new clothing."""


# ── Core try-on logic ────────────────────────────────────────────────────────
def pil_to_base64(image: Image.Image, fmt: str = "JPEG") -> tuple[str, str]:
    """Convert a PIL Image to base64 string + mime type."""
    buffer = io.BytesIO()
    rgb = image.convert("RGB")
    rgb.save(buffer, format=fmt)
    data = base64.b64encode(buffer.getvalue()).decode("utf-8")
    mime = f"image/{fmt.lower()}"
    return data, mime


def run_tryon(
    avatar_img: Image.Image | None,
    clothing_img: Image.Image | None,
    api_key: str,
    custom_prompt: str,
) -> tuple[Image.Image | None, str]:
    """
    Call Gemini to perform virtual try-on.
    Returns (result_image, status_message).
    """
    # ── Validation ──────────────────────────────────────────────────────────
    if not api_key or not api_key.strip():
        return None, "❌ Please enter your Gemini API key."

    if avatar_img is None:
        return None, "❌ Please upload an avatar / model image."

    if clothing_img is None:
        return None, "❌ Please upload a clothing image."

    # ── Configure Gemini ────────────────────────────────────────────────────
    genai.configure(api_key=api_key.strip())

    model = genai.GenerativeModel(
        model_name=MODEL_ID,
        generation_config=genai.GenerationConfig(
            temperature=0.2,
        ),
    )

    # ── Prepare images as inline data ───────────────────────────────────────
    avatar_b64, avatar_mime = pil_to_base64(avatar_img)
    clothing_b64, clothing_mime = pil_to_base64(clothing_img)

    prompt_text = (custom_prompt.strip() if custom_prompt.strip() else TRYON_PROMPT)

    contents = [
        {
            "role": "user",
            "parts": [
                {
                    "inline_data": {
                        "mime_type": avatar_mime,
                        "data": avatar_b64,
                    }
                },
                {
                    "inline_data": {
                        "mime_type": clothing_mime,
                        "data": clothing_b64,
                    }
                },
                {"text": prompt_text},
            ],
        }
    ]

    try:
        response = model.generate_content(contents)

        # ── Extract the generated image from response ────────────────────
        result_img = None

        if hasattr(response, "candidates") and response.candidates:
            for candidate in response.candidates:
                if hasattr(candidate, "content") and candidate.content:
                    for part in candidate.content.parts:
                        # Image part
                        if hasattr(part, "inline_data") and part.inline_data:
                            raw_data = part.inline_data.data
                            
                            # Handle both raw bytes and base64 strings/bytes
                            if isinstance(raw_data, str):
                                img_bytes = base64.b64decode(raw_data)
                            elif isinstance(raw_data, bytes):
                                # check for standard image signatures
                                if raw_data.startswith(b'\xff\xd8\xff') or raw_data.startswith(b'\x89PNG') or raw_data.startswith(b'GIF8') or raw_data.startswith(b'RIFF'):
                                    img_bytes = raw_data
                                else:
                                    # Fallback: maybe it's base64 in bytes?
                                    try:
                                        img_bytes = base64.b64decode(raw_data)
                                    except Exception:
                                        img_bytes = raw_data
                            else:
                                continue

                            try:
                                result_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                            except Exception as e:
                                print(f"Error opening image from inline_data: {e}")
                                continue
                            break
                if result_img:
                    break

        # Fallback: check response.parts directly
        if result_img is None and hasattr(response, "parts"):
            for part in response.parts:
                if hasattr(part, "inline_data") and part.inline_data:
                    raw_data = part.inline_data.data
                    if isinstance(raw_data, str):
                        img_bytes = base64.b64decode(raw_data)
                    elif isinstance(raw_data, bytes):
                        if raw_data.startswith(b'\xff\xd8\xff') or raw_data.startswith(b'\x89PNG') or raw_data.startswith(b'GIF8') or raw_data.startswith(b'RIFF'):
                            img_bytes = raw_data
                        else:
                            try:
                                img_bytes = base64.b64decode(raw_data)
                            except Exception:
                                img_bytes = raw_data
                    else:
                        continue

                    try:
                        result_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                    except Exception as e:
                        print(f"Error opening image from fallback parts: {e}")
                        continue
                    break

        if result_img is None:
            # Log any text response for debugging
            text_parts = []
            if hasattr(response, "text"):
                text_parts.append(response.text or "")
            debug_text = " | ".join(text_parts) or "No text in response."
            return None, (
                f"⚠️ Gemini did not return an image.\n\n"
                f"Model response text: {debug_text}\n\n"
                f"Tip: Make sure you are using a model that supports image output "
                f"(e.g., gemini-2.0-flash-preview-image-generation). "
                f"Current model: {MODEL_ID}"
            )

        return result_img, "✅ Try-on completed successfully!"

    except Exception as exc:
        return None, f"❌ Gemini API error:\n{type(exc).__name__}: {exc}"


# ── Gradio UI ────────────────────────────────────────────────────────────────
def build_ui() -> gr.Blocks:
    env_api_key = os.environ.get("GEMINI_API_KEY", "")

    with gr.Blocks(
        title="👗 Gemini Virtual Try-On",
    ) as demo:
        # ── Header ──────────────────────────────────────────────────────────
        gr.HTML(
            """
            <div class="title-row">
              <h1 style="font-size:2.4rem; font-weight:700; margin:0;">
                👗 Gemini Virtual Try-On
              </h1>
            </div>
            <p class="subtitle">
              Powered by <strong>Google Gemini</strong> image generation &nbsp;·&nbsp;
              Upload an avatar &amp; a clothing item, then hit <em>Try On</em>
            </p>
            """
        )

        # ── API Key ──────────────────────────────────────────────────────────
        with gr.Row():
            api_key_box = gr.Textbox(
                label="🔑 Gemini API Key",
                placeholder="AIza…  (or set GEMINI_API_KEY env variable)",
                value=env_api_key,
                type="password",
                scale=4,
            )
            model_label = gr.HTML(
                f'<div style="padding:12px;font-size:12px;color:#888;">'
                f'Model: <code>{MODEL_ID}</code></div>',
                label="",
            )

        # ── Image inputs ─────────────────────────────────────────────────────
        with gr.Row(equal_height=True):
            with gr.Column():
                avatar_input = gr.Image(
                    label="🧍 Avatar / Model Image",
                    type="pil",
                    sources=["upload", "clipboard"],
                    height=360,
                )
                gr.HTML('<p style="text-align:center;color:#888;margin-top:4px;font-size:13px;">Full-body or upper-body photo</p>')

            with gr.Column():
                clothing_input = gr.Image(
                    label="👔 Clothing / Garment Image",
                    type="pil",
                    sources=["upload", "clipboard"],
                    height=360,
                )
                gr.HTML('<p style="text-align:center;color:#888;margin-top:4px;font-size:13px;">Product image or flat-lay photo</p>')

            with gr.Column():
                result_output = gr.Image(
                    label="✨ Try-On Result",
                    type="pil",
                    height=360,
                    elem_classes=["result-img"],
                    interactive=False,
                )
                gr.HTML('<p style="text-align:center;color:#888;margin-top:4px;font-size:13px;">Generated output</p>')

        # ── Optional prompt override ─────────────────────────────────────────
        with gr.Accordion("⚙️ Advanced: Custom Prompt (optional)", open=False):
            custom_prompt = gr.Textbox(
                label="Custom Prompt",
                placeholder="Leave blank to use the default try-on prompt…",
                lines=5,
                value="",
            )

        # ── Action buttons ───────────────────────────────────────────────────
        with gr.Row():
            clear_btn = gr.Button("🗑️ Clear", variant="secondary", scale=1)
            tryon_btn = gr.Button("✨ Try On", variant="primary", scale=3)

        # ── Status message ───────────────────────────────────────────────────
        status_box = gr.Textbox(
            label="Status",
            interactive=False,
            lines=3,
            placeholder="Status will appear here…",
        )

        # ── Wire up events ───────────────────────────────────────────────────
        tryon_btn.click(
            fn=run_tryon,
            inputs=[avatar_input, clothing_input, api_key_box, custom_prompt],
            outputs=[result_output, status_box],
            show_progress="full",
        )

        clear_btn.click(
            fn=lambda: (None, None, None, "Cleared."),
            outputs=[avatar_input, clothing_input, result_output, status_box],
        )

        # ── Footer ───────────────────────────────────────────────────────────
        gr.HTML(
            """
            <hr style="margin:24px 0;border-color:#eee;"/>
            <p style="text-align:center;font-size:12px;color:#aaa;">
              Get your free API key at
              <a href="https://aistudio.google.com/app/apikey" target="_blank">
                Google AI Studio
              </a>
              &nbsp;·&nbsp; Uses model <code>{model}</code>
            </p>
            """.format(model=MODEL_ID)
        )

    return demo


# ── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    demo = build_ui()
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,        # set True for a public Gradio link
        inbrowser=True,     # auto-open browser tab
        show_error=True,
        theme=gr.themes.Soft(
            primary_hue="violet",
            secondary_hue="purple",
            neutral_hue="slate",
        ),
        css="""
        .gradio-container { max-width: 1100px !important; margin: auto; }
        .title-row { text-align: center; padding: 16px 0 8px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 24px; font-size: 15px; }
        .result-img img { border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,.15); }
        """
    )
