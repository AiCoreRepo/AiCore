"""
Recommendation Service Module

This module provides recommendation functionality using a Fusion MLP model
that combines image embeddings, text embeddings, and tabular features.
"""

import os
import json
import base64
from pathlib import Path
from typing import Dict, List, Optional
from functools import lru_cache

import numpy as np
import psycopg2
from psycopg2.extras import RealDictCursor
from PIL import Image
import io

# Import fusion MLP components from recommend_demo
import sys
recommend_demo_path = Path(__file__).parent.parent.parent / "recommend_demo"
sys.path.insert(0, str(recommend_demo_path))

from scripts import train_fusion_mlp as fusion_mlp


# Database connection
def get_db_connection():
    """Get PostgreSQL database connection"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    return psycopg2.connect(database_url)


# Load collection from database
def get_products_from_db() -> List[Dict]:
    """
    Fetch products from database with metadata for recommendations.
    Returns list of product dictionaries compatible with fusion MLP.
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            query = """
                SELECT 
                    p.product_id as cloth_id,
                    p.category as cloth_type,
                    p.description,
                    p.metadata,
                    pi.url as image
                FROM "Product" p
                LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
                WHERE p.is_deleted = false 
                AND p.status = 'APPROVED'
                AND p.metadata IS NOT NULL
                ORDER BY p.created_at DESC
            """
            cursor.execute(query)
            products = cursor.fetchall()
            
            # Convert to list of dicts and process metadata
            result = []
            for product in products:
                item = dict(product)
                
                # Extract metadata fields
                if item.get('metadata'):
                    metadata = item['metadata']
                    item['occasion'] = metadata.get('occasions', [])
                    item['body_shape'] = metadata.get('body_shapes', [])
                    item['skin_tone'] = metadata.get('skin_tones', [])
                    item['sizes'] = metadata.get('sizes', [])
                    item['fit'] = metadata.get('fit', [])
                    item['fabric'] = metadata.get('fabric', [])
                    item['color_family'] = metadata.get('color_family', [])
                    item['style'] = metadata.get('style', [])
                
                # Use description or create one
                if not item.get('description'):
                    item['description'] = f"{item.get('cloth_type', 'Item')} - {item.get('cloth_id', '')}"
                
                result.append(item)
            
            return result
    finally:
        conn.close()


# Load collection from JSON file (fallback)
def get_products_from_file(file_path: str) -> List[Dict]:
    """Load products from JSON file"""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Collection file not found: {file_path}")
    
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    return data


@lru_cache(maxsize=1)
def load_fusion_model(model_path: str, preprocess_path: str):
    """Load fusion MLP model and preprocessing spec (cached)"""
    model_path_obj = Path(model_path)
    preprocess_path_obj = Path(preprocess_path)
    
    if not model_path_obj.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")
    if not preprocess_path_obj.exists():
        raise FileNotFoundError(f"Preprocess spec not found: {preprocess_path}")
    
    # Load model
    device = "cuda" if fusion_mlp.torch.cuda.is_available() else "cpu"
    state = fusion_mlp.torch.load(str(model_path_obj), map_location=device)
    
    if "state_dict" not in state or "config" not in state:
        raise ValueError("Unsupported fusion model format")
    
    config = state["config"]
    hidden_layers = tuple(int(v) for v in config.get("hidden", [512, 128]))
    
    model = fusion_mlp.FusionMLP(
        input_dim=int(config.get("input_dim", 0)),
        hidden=hidden_layers,
        dropout=float(config.get("dropout", 0.0)),
    ).to(device)
    
    model.load_state_dict(state["state_dict"])
    model.eval()
    
    # Load preprocess spec
    spec = fusion_mlp.load_preprocess_spec(preprocess_path_obj)
    
    return model, config, spec, device


def get_recommendations(
    user_image_base64: str,
    age: float,
    size: str,
    body_shape: str,
    skin_tone: str,
    occasion: str,
    top_k: int = 10,
    use_database: bool = True,
    collection_file: Optional[str] = None,
) -> Dict:
    """
    Get personalized recommendations using Fusion MLP model.
    
    Args:
        user_image_base64: Base64 encoded user image
        age: User age
        size: User size (S, M, L, XL, etc.)
        body_shape: User body shape
        skin_tone: User skin tone
        occasion: Desired occasion
        top_k: Number of recommendations to return
        use_database: Whether to fetch products from database
        collection_file: Path to JSON collection file (if not using database)
    
    Returns:
        Dictionary with categorized recommendations
    """
    # Load model and config
    model_path = os.getenv("RECOMMENDATION_MODEL_PATH", "../../recommend_demo/artifacts/fusion_mlp.pt")
    preprocess_path = os.getenv("RECOMMENDATION_PREPROCESS_PATH", "../../recommend_demo/artifacts/fusion_preprocess.json")
    
    model, config, spec, device = load_fusion_model(model_path, preprocess_path)
    
    # Get collection
    if use_database:
        try:
            collection = get_products_from_db()
            if not collection:
                # Fallback to file if database is empty
                collection_file = collection_file or os.getenv("RECOMMENDATION_COLLECTION_PATH", "../../recommend_demo/collection2_test.json")
                collection = get_products_from_file(collection_file)
        except Exception as e:
            print(f"Database error, falling back to file: {e}")
            collection_file = collection_file or os.getenv("RECOMMENDATION_COLLECTION_PATH", "../../recommend_demo/collection2_test.json")
            collection = get_products_from_file(collection_file)
    else:
        collection_file = collection_file or os.getenv("RECOMMENDATION_COLLECTION_PATH", "../../recommend_demo/collection2_test.json")
        collection = get_products_from_file(collection_file)
    
    if not collection:
        raise ValueError("No products available for recommendations")
    
    # Decode user image
    try:
        image_data = base64.b64decode(user_image_base64)
        user_image = Image.open(io.BytesIO(image_data)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Invalid user image: {e}")
    
    # Use the fusion_api logic for recommendations
    # Import the recommendation function
    from app.fusion_api import _run_recommendation
    
    result = _run_recommendation(
        user_image=user_image,
        age=age,
        size=size,
        body_shape=body_shape,
        skin_tone=skin_tone,
        occasion=occasion,
        top_k=top_k,
        model_path=model_path,
        preprocess_path=preprocess_path,
        collection_path="",  # We're passing collection directly
        desc_field="description",
        id_field="cloth_id",
        apply_priority_filter=True,
        apply_priority_weight=True,
        use_precomputed_embeddings=False,
        precomputed_embeddings_path="",
    )
    
    return result
