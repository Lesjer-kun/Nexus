"""
NEXUS - Vector Embeddings Engine
Generates dense vector embeddings for semantic activity matching and institutional memory.
Supports Voyage AI, OpenAI, Google Gemini, and a Scikit-Learn TF-IDF semantic vector space model.
"""

import os
import math
import hashlib
import logging
from typing import List
from config import settings

logger = logging.getLogger("nexus.matching.embeddings")

# Domain training corpus for offline Scikit-Learn semantic vector space representation
CONSTRUCTION_DOMAIN_CORPUS = [
    "Line 24 pipe spool erection flange bolting structural steel pipe installation piping workfront corridor",
    "Compressor foundation concrete pouring batching plant slump cement aggregates excavation rebar Block C",
    "Crude booster pump P-14 dial alignment vibration laser shaft runout rotating mechanical equipment Pump Station 2",
    "Line 24 tie-in radiographic testing non-destructive testing NDT gamma inspection weld joint defects darkroom",
    "415V switchgear cable trenching tray installation electrical substation cabling transformer Substation 4",
    "SCADA RTU signal loop calibration termination instrumentation control room sensor transmitter PLC RTU-CR-01",
    "Hydrotest safety clearance exclusion zone setup HSE barrier pressurization pipeline testing",
    "Pipeline trenching backfilling stringing welding lowering tie-in crossing right of way",
    "Storage tank fabrication hydrotesting nozzle orientation visual inspection pneumatic test",
    "Cathodic protection sacrificial anode installation soil resistivity measurement",
    "Gas turbine generator alignment lube oil flushing coupling check",
    "Motor operated valve actuator calibration limit switch torque setting",
]

_sklearn_vectorizer = None

def _get_sklearn_semantic_vector(text: str, dim: int = 1024) -> List[float]:
    """
    Genuine Scikit-Learn semantic embedding using fitted TF-IDF n-gram vectorizer.
    Provides mathematical cosine similarity matching offline without external API calls.
    """
    global _sklearn_vectorizer
    if _sklearn_vectorizer is None:
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            vec = TfidfVectorizer(
                ngram_range=(1, 3),
                sublinear_tf=True,
                max_features=dim,
                token_pattern=r"(?u)\b\w+\b",
            )
            vec.fit(CONSTRUCTION_DOMAIN_CORPUS)
            _sklearn_vectorizer = vec
        except Exception as e:
            logger.warning(f"Could not initialize sklearn TfidfVectorizer: {e}")
            _sklearn_vectorizer = False

    if _sklearn_vectorizer:
        try:
            # Transform text into sparse TF-IDF matrix
            tfidf_matrix = _sklearn_vectorizer.transform([text])
            dense_arr = tfidf_matrix.toarray()[0].tolist()

            # Pad to target dimension if vocabulary has fewer features
            if len(dense_arr) < dim:
                # Add deterministic positional hash to prevent zero vectors on unseen terms
                dense_arr = dense_arr + [0.0] * (dim - len(dense_arr))
                words = text.lower().replace("/", " ").replace("-", " ").split()
                for i, w in enumerate(words):
                    h = (int(hashlib.md5(w.encode()).hexdigest(), 16) % (dim - len(_sklearn_vectorizer.vocabulary_))) + len(_sklearn_vectorizer.vocabulary_)
                    dense_arr[h] += 0.35

            # L2 normalize
            norm = math.sqrt(sum(v * v for v in dense_arr))
            if norm > 0:
                return [round(v / norm, 5) for v in dense_arr]
        except Exception as e:
            logger.warning(f"Sklearn vector generation note: {e}")

    # Fallback to normalized term-frequency vector
    words = text.lower().replace("/", " ").replace("-", " ").split()
    vector = [0.0] * dim
    for i, word in enumerate(words):
        h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16) % dim
        vector[h] += 1.0
        if i < len(words) - 1:
            bigram = f"{word}_{words[i+1]}"
            hb = int(hashlib.sha256(bigram.encode("utf-8")).hexdigest(), 16) % dim
            vector[hb] += 1.5

    norm = math.sqrt(sum(v * v for v in vector))
    if norm > 0:
        vector = [round(v / norm, 5) for v in vector]
    return vector


def embed_text(text: str) -> List[float]:
    """
    Embeds single document or activity text into vector.
    """
    if not text or not str(text).strip():
        return [0.0] * settings.EMBEDDING_DIM

    # 1. Voyage AI
    if settings.VOYAGE_API_KEY and settings.EMBEDDING_PROVIDER in ("voyage", "auto"):
        try:
            import voyageai
            client = voyageai.Client(api_key=settings.VOYAGE_API_KEY)
            res = client.embed([text], model="voyage-3", input_type="document")
            return res.embeddings[0]
        except Exception as e:
            logger.warning(f"Voyage AI embedding failed: {e}. Falling back.")

    # 2. Google Gemini Embeddings (text-embedding-004)
    if settings.GEMINI_API_KEY and settings.EMBEDDING_PROVIDER in ("gemini", "google", "auto"):
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            res = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            vec = res["embedding"]
            if len(vec) < settings.EMBEDDING_DIM:
                vec = vec + [0.0] * (settings.EMBEDDING_DIM - len(vec))
            return [round(v, 6) for v in vec[:settings.EMBEDDING_DIM]]
        except Exception as e:
            try:
                import requests
                url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={settings.GEMINI_API_KEY}"
                payload = {
                    "model": "models/text-embedding-004",
                    "content": {"parts": [{"text": text}]}
                }
                resp = requests.post(url, json=payload, timeout=15)
                if resp.status_code == 200:
                    vec = resp.json().get("embedding", {}).get("values", [])
                    if vec:
                        if len(vec) < settings.EMBEDDING_DIM:
                            vec = vec + [0.0] * (settings.EMBEDDING_DIM - len(vec))
                        return [round(v, 6) for v in vec[:settings.EMBEDDING_DIM]]
            except Exception as re_err:
                logger.warning(f"Gemini embedding fallback note: {re_err}")

    # 3. OpenAI Embeddings (text-embedding-3-small)
    if settings.OPENAI_API_KEY and settings.EMBEDDING_PROVIDER in ("openai", "auto"):
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            res = client.embeddings.create(input=[text], model="text-embedding-3-small")
            vec = res.data[0].embedding
            if len(vec) < settings.EMBEDDING_DIM:
                vec = vec + [0.0] * (settings.EMBEDDING_DIM - len(vec))
            return [round(v, 6) for v in vec[:settings.EMBEDDING_DIM]]
        except Exception as e:
            logger.warning(f"OpenAI embedding failed: {e}. Falling back.")

    # 4. Sentence-Transformers (if explicitly configured)
    if settings.EMBEDDING_PROVIDER == "sentence_transformers":
        try:
            from sentence_transformers import SentenceTransformer
            global _sentence_transformer_model
            if "_sentence_transformer_model" not in globals() or _sentence_transformer_model is None:
                _sentence_transformer_model = SentenceTransformer("all-MiniLM-L6-v2")
            vec = _sentence_transformer_model.encode(text).tolist()
            if len(vec) < settings.EMBEDDING_DIM:
                vec = vec + [0.0] * (settings.EMBEDDING_DIM - len(vec))
            return [round(v, 6) for v in vec[:settings.EMBEDDING_DIM]]
        except Exception as st_err:
            logger.warning(f"SentenceTransformers failed ({st_err}). Falling back to Scikit-Learn.")

    # 5. Scikit-Learn TF-IDF Semantic Vector Space Model (Zero-latency offline domain semantic model)
    return _get_sklearn_semantic_vector(text, settings.EMBEDDING_DIM)


def embed_query(text: str) -> List[float]:
    """
    Embeds search query text into vector.
    """
    return embed_text(text)


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Computes cosine similarity between two float vectors."""
    if not vec_a or not vec_b:
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return max(0.0, min(1.0, dot / (norm_a * norm_b)))
