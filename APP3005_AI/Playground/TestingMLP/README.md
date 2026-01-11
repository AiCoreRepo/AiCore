# Fashion Matching MLP (POC)

CPU-only proof of concept that scores how well a clothing item visually suits a person for a given event. Person attributes are one-hot encoded; clothing descriptions are embedded with a pre-trained sentence transformer, concatenated, and scored with a small MLP classifier. Includes a Streamlit demo and Docker image.

## Quickstart (local)
```
cd AiCore/APP3005_AI/Playground/TestingMLP
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python train.py  # downloads sentence-transformer on first run, then saves artifacts/
streamlit run app.py
```

## Docker
```
cd AiCore/APP3005_AI/Playground/TestingMLP
docker build -t fashion-mlp .
docker run -p 8501:8501 fashion-mlp
```

## How it works
- Person attributes: `height_bucket`, `body_shape`, `skin_tone`, `event` are one-hot encoded with a fixed category grid.
- Clothing text: 2-line descriptions embedded via `all-MiniLM-L6-v2` (CPU).
- Match vector: concatenated person one-hot + clothing embedding.
- Classifier: `StandardScaler` + `MLPClassifier` trained on the demo labeled pairs in `data_samples.py`.

## Demo usage
The Streamlit app lets you:
- Pick person attributes and Top-N, then rank all catalog items with the trained classifier.
- Retrain on the bundled demo data if artifacts are missing (first run downloads the embedding model).

## Programmatic inference
```python
from data_samples import CLOTHING_CATALOG
from matching import PersonAttributes, load_artifacts, load_embedder, rank_clothing_for_person

person = PersonAttributes(height_bucket="average", body_shape="athletic", skin_tone="medium", event="party")
model, encoder = load_artifacts()
embedder = load_embedder()
top_matches = rank_clothing_for_person(person, CLOTHING_CATALOG.values(), model, encoder, embedder, top_n=3)
for item, score in top_matches:
    print(item.id, score)
```
