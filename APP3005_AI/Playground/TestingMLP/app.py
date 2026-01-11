from __future__ import annotations

from typing import Optional

import streamlit as st

from data_samples import CLOTHING_CATALOG
from matching import PERSON_CATEGORIES, PersonAttributes, load_artifacts, load_embedder, rank_clothing_for_person
from train import train

st.set_page_config(page_title="Fashion Match MLP", page_icon="🧥", layout="wide")


@st.cache_resource(show_spinner=False)
def get_embedder():
    return load_embedder()


@st.cache_resource(show_spinner=False)
def get_artifacts_cached():
    return load_artifacts()


def ensure_artifacts() -> Optional[tuple]:
    try:
        return get_artifacts_cached()
    except FileNotFoundError:
        return None


def _rerun():
    try:
        st.rerun()
    except AttributeError:
        # Backward compatibility for older Streamlit releases
        st.experimental_rerun()


def render_sidebar() -> tuple[PersonAttributes, int]:
    st.sidebar.header("Person profile")
    height = st.sidebar.selectbox("Height bucket", PERSON_CATEGORIES["height_bucket"])
    body_shape = st.sidebar.selectbox("Body shape", PERSON_CATEGORIES["body_shape"])
    skin_tone = st.sidebar.selectbox("Skin tone", PERSON_CATEGORIES["skin_tone"])
    event = st.sidebar.selectbox("Event", PERSON_CATEGORIES["event"])
    top_n = st.sidebar.slider("Top N outfits", min_value=1, max_value=len(CLOTHING_CATALOG), value=3)
    person = PersonAttributes(
        height_bucket=height,
        body_shape=body_shape,
        skin_tone=skin_tone,
        event=event,
    )
    return person, top_n


def render_catalog():
    st.subheader("Clothing catalog used for scoring")
    for item in CLOTHING_CATALOG.values():
        st.markdown(f"**{item.title}**  \n{item.description_lines[0]}  \n{item.description_lines[1]}")


def main():
    st.title("Fashion Matching MLP (CPU demo)")
    st.caption("Sentence-transformer clothing embeddings + one-hot person attributes -> MLP looks_good score.")

    person, top_n = render_sidebar()
    artifacts = ensure_artifacts()
    if artifacts is None:
        st.error("Saved artifacts not found. Run `python train.py` or click train to build them on the bundled demo data.")
        if st.button("Train artifacts now"):
            with st.spinner("Training on demo pairs (downloads sentence transformer if missing)..."):
                metrics = train()
            st.success(f"Training complete. Val accuracy: {metrics['val_accuracy']:.2f}, ROC-AUC: {metrics['val_roc_auc']:.2f}")
            _rerun()
        render_catalog()
        return

    model, encoder = artifacts
    embedder = get_embedder()

    if st.button("Rank outfits"):
        with st.spinner("Scoring outfits..."):
            ranked = rank_clothing_for_person(
                person=person,
                clothing_items=CLOTHING_CATALOG.values(),
                model=model,
                encoder=encoder,
                embedder=embedder,
                top_n=top_n,
            )

        st.subheader(f"Top {top_n} matches")
        for idx, (item, score) in enumerate(ranked, start=1):
            st.markdown(
                f"**{idx}. {item.title}** — score {score:.3f}  \n{item.description_lines[0]}  \n{item.description_lines[1]}"
            )
    render_catalog()


if __name__ == "__main__":
    main()
