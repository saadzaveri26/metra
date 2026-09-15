"""
Vector Database API Endpoints for METRA:
1. Semantic search across statutory PCR 2011 rules corpus.
2. Fuzzy entity resolution across seller registry with mandatory audit logging.
3. Seller match audit log inspection (restricted to officers and headquarters).
4. Vector corpus administration and re-seeding (restricted to headquarters).
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from security import get_current_user, require_roles
from vector_store import query_rules, match_seller, seed_vector_database, get_match_audit_logs

router = APIRouter(prefix="", tags=["vector"])


@router.get("/rules/search")
def search_rules(
    q: str = Query(..., min_length=2, description="Statutory query text"),
    top_k: int = Query(5, ge=1, le=20),
    threshold: float = Query(0.40, ge=0.0, le=1.0),
    user: dict = Depends(get_current_user),
):
    """
    Semantic search across the Legal Metrology rules corpus.
    Accessible to all authenticated users (officer, vendor, consumer, headquarters).
    """
    try:
        matches = query_rules(query=q, top_k=top_k, threshold=threshold)
        return {
            "query": q,
            "threshold": threshold,
            "total_matches": len(matches),
            "results": matches,
        }
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sellers/match")
def resolve_seller(
    name: str = Query(..., min_length=2, description="Manufacturer or packer name to match"),
    threshold: float = Query(0.80, ge=0.0, le=1.0),
    user: dict = Depends(get_current_user),
):
    """
    Fuzzy semantic entity resolution against the seller registry.
    Audited: Every query decision is logged with officer identifier and similarity score.
    """
    try:
        officer_id = user.get("sub")
        match = match_seller(query=name, threshold=threshold, officer_user_id=officer_id)
        return {
            "query": name,
            "threshold": threshold,
            "matched": match is not None,
            "result": match,
        }
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sellers/audit-log")
def view_seller_match_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(require_roles("officer", "inspector", "headquarters")),
):
    """
    Statutory audit log retrieval for seller matching decisions.
    Restricted strictly to officers, inspectors, and headquarters.
    """
    logs = get_match_audit_logs(limit=limit)
    return {
        "total_records": len(logs),
        "audit_trail": logs,
    }


@router.post("/admin/vector/seed")
def admin_seed_vector_database(
    force: bool = Query(False, description="Whether to re-seed from scratch"),
    user: dict = Depends(require_roles("headquarters")),
):
    """
    Administrative endpoint to seed/re-seed rules_corpus and seller_registry.
    Restricted strictly to headquarters role.
    """
    try:
        counts = seed_vector_database(force_reseed=force)
        return {
            "status": "success",
            "message": "Vector database seeded successfully",
            "details": counts,
        }
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
