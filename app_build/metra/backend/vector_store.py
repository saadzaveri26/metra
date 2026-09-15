"""
Persistent Vector Database Layer for METRA.
Directly implements ChromaDB with sentence-transformers ('all-MiniLM-L6-v2').

Per project specifications:
1. No silent fallback: If ChromaDB or sentence-transformers is missing or misconfigured,
   it fails loudly at startup with a descriptive setup error.
2. Confirmed embedding function: sentence-transformers model 'all-MiniLM-L6-v2'.
3. Match-decision logging: match_seller() logs every fuzzy match decision (query, matched business_id,
   similarity score, timestamp, officer_id) for statutory officer auditability.
"""
import os
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional

from config import settings

logger = logging.getLogger("metra.vector_store")
logger.setLevel(logging.INFO)

# Path to persistent vector database directory
VECTOR_DB_DIR = Path(__file__).parent / "vector_store"
VECTOR_DB_DIR.mkdir(parents=True, exist_ok=True)

# Path to seller match audit log file
SELLER_MATCH_AUDIT_LOG_FILE = VECTOR_DB_DIR / "seller_match_audit.jsonl"

# Similarity thresholds confirmed per Technical_Specification.md
RULES_SIMILARITY_THRESHOLD = 0.75
SELLER_SIMILARITY_THRESHOLD = 0.80

_client = None
_embedding_fn = None
_rules_collection = None
_seller_collection = None


def _init_chroma_and_embeddings():
    """
    Initializes ChromaDB with sentence-transformers ('all-MiniLM-L6-v2').
    Fails loudly at startup if ChromaDB or sentence-transformers is unavailable.
    Silent fallback to TF-IDF or random vectors is strictly prohibited.
    """
    global _client, _embedding_fn, _rules_collection, _seller_collection

    if _client is not None:
        return _client, _rules_collection, _seller_collection

    try:
        import chromadb
        from chromadb.utils import embedding_functions
    except ImportError as e:
        raise RuntimeError(
            "CRITICAL SETUP ERROR: 'chromadb' is required for METRA vector database operations, "
            "but could not be imported. Please verify chromadb installation. "
            "Silent fallback is prohibited per project specifications."
        ) from e

    try:
        # Explicit confirmation: embedding function is sentence-transformers 'all-MiniLM-L6-v2'
        logger.info("Initializing ChromaDB SentenceTransformerEmbeddingFunction with 'all-MiniLM-L6-v2'...")
        _embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
    except Exception as e:
        raise RuntimeError(
            "CRITICAL SETUP ERROR: 'sentence-transformers' model 'all-MiniLM-L6-v2' could not be initialized "
            f"for ChromaDB embedding function: {e}. "
            "Silent fallback to TF-IDF is prohibited per project specifications."
        ) from e

    try:
        # Initialize persistent Chroma client
        _client = chromadb.PersistentClient(path=str(VECTOR_DB_DIR))

        # Get or create 'rules_corpus' collection
        _rules_collection = _client.get_or_create_collection(
            name="rules_corpus",
            embedding_function=_embedding_fn,
            metadata={"hnsw:space": "cosine", "description": "Legal Metrology Act 2009 and PCR 2011 statutory rules"},
        )

        # Get or create 'seller_registry' collection
        _seller_collection = _client.get_or_create_collection(
            name="seller_registry",
            embedding_function=_embedding_fn,
            metadata={"hnsw:space": "cosine", "description": "Fictional seller/manufacturer registry for entity resolution"},
        )

        logger.info(
            "METRA ChromaDB Vector Store successfully initialized with 'all-MiniLM-L6-v2'. "
            f"rules_corpus count: {_rules_collection.count()}, seller_registry count: {_seller_collection.count()}"
        )
        return _client, _rules_collection, _seller_collection

    except Exception as e:
        raise RuntimeError(
            f"CRITICAL SETUP ERROR: Failed to initialize persistent ChromaDB collections in '{VECTOR_DB_DIR}': {e}"
        ) from e


def get_vector_collections():
    """Returns (rules_collection, seller_collection), failing loudly if uninitialized."""
    _, rules_coll, seller_coll = _init_chroma_and_embeddings()
    return rules_coll, seller_coll


def seed_vector_database(force_reseed: bool = False) -> Dict[str, int]:
    """
    Seeds `rules_corpus` and `seller_registry` from `seed_vector_data.py`.
    Idempotent: skips if already populated unless force_reseed=True.
    """
    from seed_vector_data import RULES_CORPUS_DATA, SELLER_REGISTRY_DATA

    rules_coll, seller_coll = get_vector_collections()

    # 1. Seed rules_corpus
    rules_seeded = 0
    if force_reseed or rules_coll.count() == 0:
        if force_reseed and rules_coll.count() > 0:
            existing_ids = rules_coll.get()["ids"]
            if existing_ids:
                rules_coll.delete(ids=existing_ids)

        rule_ids = [r["id"] for r in RULES_CORPUS_DATA]
        rule_docs = [r["text"] for r in RULES_CORPUS_DATA]
        rule_metas = [
            {k: v for k, v in r["metadata"].items() if v is not None}
            for r in RULES_CORPUS_DATA
        ]

        rules_coll.add(ids=rule_ids, documents=rule_docs, metadatas=rule_metas)
        rules_seeded = len(rule_ids)
        logger.info(f"Seeded {rules_seeded} rules into 'rules_corpus'.")
    else:
        rules_seeded = rules_coll.count()

    # 2. Seed seller_registry (strictly fictional entities)
    sellers_seeded = 0
    if force_reseed or seller_coll.count() == 0:
        if force_reseed and seller_coll.count() > 0:
            existing_ids = seller_coll.get()["ids"]
            if existing_ids:
                seller_coll.delete(ids=existing_ids)

        seller_ids = []
        seller_docs = []
        seller_metas = []

        for s in SELLER_REGISTRY_DATA:
            meta = s["metadata"].copy()
            aliases = meta.get("aliases", [])
            meta["aliases"] = json.dumps(aliases)
            clean_meta = {k: (v if v is not None else "") for k, v in meta.items()}

            # Primary profile document
            seller_ids.append(s["id"])
            seller_docs.append(s["text"])
            seller_metas.append(clean_meta)

            # High-precision alias documents for fuzzy resolution
            for a_idx, alias in enumerate(aliases):
                alias_id = f"{s['id']}#alias_{a_idx}"
                alias_doc = f"{alias} - {s['canonical_name']}"
                alias_meta = clean_meta.copy()
                alias_meta["matched_via_alias"] = alias
                seller_ids.append(alias_id)
                seller_docs.append(alias_doc)
                seller_metas.append(alias_meta)

        seller_coll.add(ids=seller_ids, documents=seller_docs, metadatas=seller_metas)
        sellers_seeded = len(seller_ids)
        logger.info(f"Seeded {sellers_seeded} entity & alias vectors into 'seller_registry'.")
    else:
        sellers_seeded = seller_coll.count()

    return {"rules_count": rules_seeded, "sellers_count": sellers_seeded}


def query_rules(query: str, top_k: int = 5, threshold: float = RULES_SIMILARITY_THRESHOLD) -> List[Dict[str, Any]]:
    """
    Semantically searches `rules_corpus` using sentence-transformers embeddings.
    Converts cosine distance to similarity (1.0 - distance).
    Returns results meeting or exceeding threshold.
    """
    rules_coll, _ = get_vector_collections()
    if not query.strip():
        return []

    results = rules_coll.query(
        query_texts=[query],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    matches = []
    if results and results["ids"] and results["ids"][0]:
        for idx in range(len(results["ids"][0])):
            distance = results["distances"][0][idx]
            similarity = max(0.0, min(1.0, 1.0 - distance))

            if similarity >= threshold:
                matches.append({
                    "id": results["ids"][0][idx],
                    "text": results["documents"][0][idx],
                    "metadata": results["metadatas"][0][idx],
                    "similarity_score": round(similarity, 4),
                    "distance": round(distance, 4),
                })

    return matches


def match_seller(
    query: str,
    threshold: float = SELLER_SIMILARITY_THRESHOLD,
    officer_user_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Fuzzy semantic entity resolution against `seller_registry`.
    
    AUDITABILITY REQUIREMENT:
    Every match decision (query, matched business_id, similarity score, timestamp, officer_id)
    is logged to `vector_store/seller_match_audit.jsonl` and logger for statutory compliance auditability.
    """
    _, seller_coll = get_vector_collections()
    if not query or not query.strip():
        return None

    results = seller_coll.query(
        query_texts=[query],
        n_results=1,
        include=["documents", "metadatas", "distances"],
    )

    matched_result = None
    best_similarity = 0.0
    matched_id = None
    matched_name = None

    if results and results["ids"] and results["ids"][0]:
        distance = results["distances"][0][0]
        best_similarity = max(0.0, min(1.0, 1.0 - distance))
        raw_id = results["ids"][0][0]
        matched_id = raw_id.split("#")[0]
        meta = results["metadatas"][0][0].copy()
        if "aliases" in meta and isinstance(meta["aliases"], str):
            try:
                meta["aliases"] = json.loads(meta["aliases"])
            except Exception:
                pass

        matched_name = meta.get("canonical_name")

        if best_similarity >= threshold:
            matched_result = {
                "id": matched_id,
                "document": results["documents"][0][0],
                "metadata": meta,
                "similarity_score": round(best_similarity, 4),
                "distance": round(distance, 4),
            }

    # Statutory Audit Decision Logging
    timestamp = datetime.now(timezone.utc).isoformat()
    audit_record = {
        "timestamp": timestamp,
        "query": query,
        "matched_business_id": matched_id if matched_result else None,
        "matched_canonical_name": matched_name if matched_result else None,
        "similarity_score": round(best_similarity, 4),
        "threshold": threshold,
        "is_match": matched_result is not None,
        "officer_user_id": officer_user_id or "system_inspector",
    }

    try:
        with open(SELLER_MATCH_AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(audit_record) + "\n")
    except Exception as e:
        logger.warning(f"Could not append to seller match audit log: {e}")

    logger.info(
        f"[SELLER_MATCH_AUDIT] query='{query}' -> matched={audit_record['matched_business_id']} "
        f"(score={audit_record['similarity_score']:.4f}, threshold={threshold}, match={audit_record['is_match']}) "
        f"by={audit_record['officer_user_id']}"
    )

    return matched_result


def get_match_audit_logs(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves recent match audit decisions for officer review."""
    if not SELLER_MATCH_AUDIT_LOG_FILE.exists():
        return []

    logs = []
    try:
        with open(SELLER_MATCH_AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    logs.append(json.loads(line))
        return logs[-limit:]
    except Exception as e:
        logger.error(f"Error reading match audit log: {e}")
        return []
