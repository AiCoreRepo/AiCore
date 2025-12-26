import io
from typing import Dict, Any

import streamlit as st
from PIL import Image


def _format_bytes(num: int) -> str:
    """Readable file sizes for the JSON view."""
    for unit in ["B", "KB", "MB", "GB"]:
        if num < 1024:
            return f"{num:.1f} {unit}"
        num /= 1024
    return f"{num:.1f} TB"


def render_image_card(label: str, image_obj: Image.Image) -> None:
    """Render a labeled image inside a styled card."""
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.markdown(f'<div class="badge">{label}</div>', unsafe_allow_html=True)
    st.image(image_obj, use_column_width=True)
    st.markdown("</div>", unsafe_allow_html=True)


st.set_page_config(page_title="Image Echo", layout="wide", page_icon="🖼️")

st.markdown(
    """
    <style>
        body { background: #0f172a; color: #e5e7eb; }
        .hero {
            padding: 16px 18px;
            border-radius: 14px;
            background: linear-gradient(135deg, #1f2a44 0%, #0f172a 100%);
            border: 1px solid #1f2937;
            box-shadow: 0 14px 38px rgba(0, 0, 0, 0.35);
        }
        .card {
            background: #0b1220;
            padding: 12px;
            border-radius: 14px;
            border: 1px solid #1f2937;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
            transition: transform 160ms ease, box-shadow 160ms ease;
            position: relative;
            overflow: hidden;
        }
        .card h4 { margin: 2px 0 6px 0; font-weight: 700; }
        .pill {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            background: #1e3a8a;
            color: #c7d2fe;
            font-weight: 600;
            font-size: 12px;
            margin-bottom: 6px;
        }
        .badge {
            position: absolute;
            top: 10px;
            left: 10px;
            padding: 6px 10px;
            border-radius: 12px;
            background: rgba(59, 130, 246, 0.9);
            color: #e5e7eb;
            font-weight: 700;
            font-size: 12px;
            box-shadow: 0 6px 18px rgba(59, 130, 246, 0.35);
        }
        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 18px 40px rgba(0, 0, 0, 0.5);
        }
        .json-box {
            border-radius: 12px;
            border: 1px solid #1f2937;
            background: #0b1220;
            box-shadow: 0 10px 24px rgba(0,0,0,0.35);
            padding: 12px;
        }
        h1, h2, h3, h4, h5, h6, label, .stMarkdown { color: #e5e7eb !important; }
    </style>
    """,
    unsafe_allow_html=True,
)

st.markdown(
    '<div class="hero">'
    '<h1 style="margin:0;">🖼️ Streamlit Image Echo</h1>'
    '<p style="margin:6px 0 0 0; color:#cbd5e1;">Upload a photo, see it mirrored, and inspect its metadata.</p>'
    '</div>',
    unsafe_allow_html=True,
)

st.markdown("**Upload an image**")
uploaded_file = st.file_uploader(
    "Drag & drop or browse", type=["png", "jpg", "jpeg", "webp"], label_visibility="collapsed"
)
st.caption("Supported formats: PNG, JPG, JPEG, WEBP")

if uploaded_file:
    img_bytes = uploaded_file.getvalue()
    image = Image.open(io.BytesIO(img_bytes))

    meta: Dict[str, Any] = {
        "filename": uploaded_file.name,
        "format": image.format,
        "mode": image.mode,
        "width": image.width,
        "height": image.height,
        "size_readable": _format_bytes(len(img_bytes)),
    }

    st.markdown("### Preview")
    with st.container():
        title_col1, title_col2 = st.columns(2, gap="medium")
        with title_col1:
            st.markdown("#### Uploaded Image")
        with title_col2:
            st.markdown("#### 3D Model")

        img_col1, img_col2 = st.columns(2, gap="medium")
        with img_col1:
            render_image_card("Uploaded Image", image)
        with img_col2:
            render_image_card("3D Model", image)

    st.markdown('<div style="height:18px;"></div>', unsafe_allow_html=True)

    st.markdown("### JSON Payload")
    st.markdown('<div class="json-box">', unsafe_allow_html=True)
    st.json(meta)
    st.markdown("</div>", unsafe_allow_html=True)
else:
    st.info("No image yet. Upload a file to see the preview, avatar, and metadata below.")
