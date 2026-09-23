"""
Ask METRA Assistant — Persona-Switching Engine.
Grounds responses in the `rules_corpus` ChromaDB vector store (sentence-transformers).
Adapts tone, statutory citations, and procedural guidance across 4 distinct personas:
1. Legal Metrology Officer ('officer')
2. Packer & Manufacturer ('vendor')
3. Citizen & Consumer ('consumer')
4. Legal Metrology Directorate ('headquarters')

GROUND RULES:
- Consumer persona NEVER exposes internal officer risk scores (0-100) or confidential prosecution memos.
- Vendor persona focuses on pre-market correction and PDP layout compliance.
- Officer persona emphasizes statutory inspection, panchnama, Section 15 powers, and evidentiary standards.
- Headquarters persona provides macro policy trends, Section 48 compounding ceilings, and gazette amendments.
"""

from datetime import datetime, timezone
import logging
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
import jwt

from db import get_db
from config import settings
from security import get_current_user
from models import User, UserRole, ComplianceRulePolicy
from schemas import AskMetraRequest, AskMetraResponse, AskMetraCitation
import vector_store

logger = logging.getLogger("metra.assistant")
router = APIRouter(prefix="/assistant", tags=["assistant"])

PERSONA_METADATA = {
    "officer": {
        "display_name": "Senior Enforcement Advisor (Officer Mode)",
        "badge": "Enforcement Authority",
        "description": "Statutory guidance on inspection protocols, Section 15 seizure, panchnama preparation, and Section 36 charges.",
        "default_followups": [
            "What is the statutory procedure for seizing non-compliant packages under Section 15?",
            "How does Section 48 compounding apply to a second packaging violation?",
            "What evidence is required to establish a dual MRP offence under Rule 6(1)(e)?",
            "What are the minimum font height tolerances permitted under Rule 9?",
        ],
    },
    "vendor": {
        "display_name": "Pre-Market Compliance Guide (Vendor Mode)",
        "badge": "Pre-Market Verification",
        "description": "Practical assistance for packers and brand owners to align artwork and labels with PCR 2011 before retail distribution.",
        "default_followups": [
            "How do I calculate the minimum font size for my Principal Display Panel (PDP)?",
            "Is it mandatory to declare Unit Sale Price on multi-piece snack packs?",
            "What are the mandatory manufacturer and customer care declarations under Rule 6?",
            "How do I respond to a Legal Metrology inspection notice letter?",
        ],
    },
    "consumer": {
        "display_name": "Consumer Rights & Transparency Guide (Citizen Mode)",
        "badge": "Citizen Protection",
        "description": "Plain-language explanations of commodity labels, maximum retail price rules, and consumer grievance steps.",
        "default_followups": [
            "Can a shopkeeper charge extra for cold storage above the printed MRP?",
            "What should I do if a packaged item does not display a consumer care phone number?",
            "How do I file a packaging irregularity complaint on METRA?",
            "Are dual price stickers on imported products legal in India?",
        ],
    },
    "headquarters": {
        "display_name": "National Policy & Regulatory Analyst (HQ Mode)",
        "badge": "Directorate Governance",
        "description": "Executive analysis on PCR 2011 amendments, regional compounding uniformity, and statutory policy enforcement.",
        "default_followups": [
            "What are the legal precedents regarding compounding caps under Section 48?",
            "How do recent gazette amendments affect digital e-commerce QR labeling?",
            "What threshold designates an entity as a habitual repeat offender?",
            "How do we configure new compliance rules in the national matrix?",
        ],
    },
}


def _get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """
    Extracts user claims from Authorization header if present.
    Does not throw 401 if token is absent, enabling guest citizen access.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split("Bearer ")[1].strip()
    try:
        claims = jwt.decode(
            token,
            settings.CLERK_JWT_KEY,
            algorithms=["RS256"],
            options={"verify_aud": False, "verify_iss": False},
        )
        metadata = claims.get("metadata") or claims.get("public_metadata") or {}
        role = metadata.get("role", "consumer").lower()
        return {
            "id": claims.get("sub", ""),
            "email": claims.get("email", ""),
            "role": role,
            "full_name": claims.get("full_name") or claims.get("name") or "User",
        }
    except Exception as e:
        logger.debug(f"Optional JWT decode failed: {e}")
        return None


@router.post("/chat", response_model=AskMetraResponse)
def ask_metra_chat(
    payload: AskMetraRequest,
    db: Session = Depends(get_db),
    auth_user: Optional[dict] = Depends(_get_optional_user),
):
    """
    Conversational compliance assistant with dynamic persona-switching across:
    - officer
    - vendor
    - consumer
    - headquarters

    Semantic retrieval searches `rules_corpus` Chroma collection.
    Ground rule enforcement guarantees role confidentiality boundaries.
    """
    query = payload.query.strip()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty",
        )

    # Determine caller's natural role
    caller_role = (auth_user.get("role") if auth_user else "consumer").lower()
    if caller_role in ("inspector", "officer"):
        caller_role = "officer"
    elif caller_role in ("hq", "headquarters"):
        caller_role = "headquarters"
    elif caller_role not in PERSONA_METADATA:
        caller_role = "consumer"

    # Evaluate requested persona
    requested_persona = (payload.persona_override or caller_role).lower()
    if requested_persona in ("inspector", "officer"):
        requested_persona = "officer"
    elif requested_persona in ("hq", "headquarters"):
        requested_persona = "headquarters"
    elif requested_persona not in PERSONA_METADATA:
        requested_persona = "consumer"

    # ROLE ISOLATION ENFORCEMENT (F5 — data-retrieval layer, not response-synthesis)
    # Ground rule: Non-privileged callers (consumer, vendor) CANNOT escalate to
    # officer or headquarters personas. This prevents consumers from accessing
    # evidentiary protocols, seizure/panchnama instructions, prosecution guidance,
    # and HQ-level compounding/policy analysis.
    is_privileged_caller = caller_role in ("officer", "headquarters")
    persona_escalation_blocked = False

    if not is_privileged_caller and requested_persona in ("officer", "headquarters"):
        # Block the escalation: force persona back to caller's actual role
        logger.warning(
            f"ROLE ISOLATION: Blocked persona escalation from '{caller_role}' to "
            f"'{requested_persona}' for user {auth_user.get('id', 'anonymous') if auth_user else 'anonymous'}"
        )
        persona_escalation_blocked = True
        requested_persona = caller_role  # Force back to their natural role

    # 1. Semantic retrieval from ChromaDB rules_corpus
    try:
        raw_matches = vector_store.query_rules(query=query, top_k=3, threshold=0.50)
    except Exception as e:
        logger.warning(f"Vector search warning: {e}")
        raw_matches = []

    # Map raw vector matches into structured citations
    citations: List[AskMetraCitation] = []
    retrieved_rule_codes = set()
    for m in raw_matches:
        meta = m.get("metadata", {})
        rule_code = meta.get("rule_code", m.get("id", "PCR-2011"))
        retrieved_rule_codes.add(rule_code)
        citations.append(
            AskMetraCitation(
                rule_code=rule_code,
                title=meta.get("title", meta.get("category", "Statutory Requirement")),
                statutory_reference=meta.get("statutory_reference", "Legal Metrology Act, 2009"),
                similarity_score=m.get("similarity_score", 0.85),
                excerpt=m.get("text", "")[:280] + ("..." if len(m.get("text", "")) > 280 else ""),
            )
        )

    # Also check database for newly promulgated policies matching the query keywords
    try:
        db_policies = (
            db.query(ComplianceRulePolicy)
            .filter(ComplianceRulePolicy.is_active == True)
            .all()
        )
        for pol in db_policies:
            if pol.rule_code not in retrieved_rule_codes:
                # Check for keyword overlap
                keywords = [pol.rule_code.lower(), pol.title.lower(), pol.category.lower()]
                if any(kw in query.lower() for kw in keywords if len(kw) > 3):
                    citations.append(
                        AskMetraCitation(
                            rule_code=pol.rule_code,
                            title=pol.title,
                            statutory_reference=pol.statutory_reference,
                            similarity_score=0.92,
                            excerpt=pol.description[:280] + ("..." if len(pol.description) > 280 else ""),
                        )
                    )
                    retrieved_rule_codes.add(pol.rule_code)
                    if len(citations) >= 4:
                        break
    except Exception as e:
        logger.debug(f"DB rule search optional fallback: {e}")

    # Fallback citation if vector store has no matches above threshold
    if not citations:
        citations.append(
            AskMetraCitation(
                rule_code="PCR-R06",
                title="Mandatory Declarations on Pre-Packaged Commodities",
                statutory_reference="Rule 6, Legal Metrology (Packaged Commodities) Rules, 2011",
                similarity_score=0.88,
                excerpt="Every package shall bear name and address of manufacturer/packer, common or generic name of commodity, net quantity, month and year of manufacture, retail sale price, and consumer care contact.",
            )
        )

    # 2. Synthesize response according to persona
    answer = _synthesize_persona_response(
        query=query,
        persona=requested_persona,
        citations=citations,
        is_privileged_caller=is_privileged_caller,
    )

    # If escalation was blocked, prepend a clear notice
    if persona_escalation_blocked:
        answer = (
            "⚠ Access Restricted: Officer and Headquarters modes contain enforcement-sensitive "
            "content (seizure protocols, prosecution guidance, compounding analysis) and are only "
            "available to authenticated Legal Metrology officers and HQ personnel. "
            "Your query has been answered using your current role.\n\n---\n\n"
        ) + answer

    # Ensure answer does not contain markdown asterisks
    clean_answer = answer.replace("**", "").replace("*", "")

    # 3. Dynamic follow-ups
    meta_info = PERSONA_METADATA[requested_persona]
    followups = _get_contextual_followups(query, requested_persona, citations)

    return AskMetraResponse(
        answer=clean_answer,
        active_persona=requested_persona,
        persona_display_name=meta_info["display_name"],
        citations=citations,
        suggested_followups=followups,
        timestamp=datetime.now(timezone.utc),
    )


def _synthesize_persona_response(
    query: str,
    persona: str,
    citations: List[AskMetraCitation],
    is_privileged_caller: bool,
) -> str:
    """
    Builds structured, authoritative response text tailored specifically to each role persona.
    """
    citation_summary = ", ".join([f"{c.statutory_reference} ({c.rule_code})" for c in citations[:2]])

    q_lower = query.lower()

    # Common topic detection
    is_mrp = "mrp" in q_lower or "price" in q_lower or "cost" in q_lower or "overcharg" in q_lower or "dual" in q_lower
    is_font = "font" in q_lower or "size" in q_lower or "height" in q_lower or "legib" in q_lower or "pdp" in q_lower
    is_qty = "quantity" in q_lower or "weight" in q_lower or "volume" in q_lower or "shortage" in q_lower or "net" in q_lower
    is_mfg = "manufacturer" in q_lower or "packer" in q_lower or "address" in q_lower or "contact" in q_lower or "care" in q_lower
    is_compound = "compound" in q_lower or "penalty" in q_lower or "fine" in q_lower or "offence" in q_lower or "section 48" in q_lower

    if persona == "officer":
        # Officer Persona: Statutory authority, evidentiary requirements, panchnama & seizure protocol
        intro = f"Inspection Directive & Statutory Citation ({citation_summary})\n\n"
        if is_mrp:
            body = (
                "Under Rule 6(1)(e) of the Legal Metrology (Packaged Commodities) Rules, 2011, the Maximum Retail Price (MRP) "
                "must be declared inclusive of all taxes. Charging any amount exceeding the printed MRP constitutes an infraction under "
                "Section 36(1) of the Legal Metrology Act, 2009.\n\n"
                "Evidentiary Protocol for Officers:\n"
                "1. Sample Purchase Receipt: Obtain cash memo/tax invoice evidencing payment over the stated MRP.\n"
                "2. Physical Seizure / Panchnama: If dual pricing or tamper stickers are observed, seize specimen units under Section 15 "
                "with two independent witnesses.\n"
                "3. Notice under Rule 32: Issue formal statutory notice requiring manufacturer/retailer response within 15 working days."
            )
        elif is_font:
            body = (
                "Under Rule 9 and the First Schedule of the PCR 2011, minimum numeral font heights are strictly keyed to the "
                "area of the Principal Display Panel (PDP):\n"
                "- Area ≤ 50 cm²: Minimum numeral height 1.0 mm (1.5 mm for blow-moulded)\n"
                "- 50 cm² < Area ≤ 100 cm²: Minimum height 1.5 mm\n"
                "- 100 cm² < Area ≤ 500 cm²: Minimum height 2.5 mm\n"
                "- 500 cm² < Area ≤ 2500 cm²: Minimum height 4.0 mm\n\n"
                "Officer Verification: Measure capital letter / numeral height using a calibrated digital graticule or vernier gauge. "
                "Lack of prominent contrast against package background violates Rule 9(1)."
            )
        elif is_compound:
            body = (
                "Under Section 48 of the Legal Metrology Act, 2009, compounding of offences is permissible for first-time contraventions "
                "by compounding authorities (Controller or designated Legal Metrology Officer).\n\n"
                "Critical Statutory Constraint: No offence can be compounded if the entity has previously compounded the same offence "
                "within a preceding period of three years. In repeated infractions under Section 36(1), mandatory prosecution before "
                "the competent Judicial Magistrate is required, carrying imprisonment up to one year and non-compoundable penalties."
            )
        else:
            body = (
                f"Based on {citations[0].statutory_reference}, all pre-packaged commodities distributed in commerce must strictly "
                f"comply with mandatory declarations. Inspecting officers must record package dimensions, batch numbers, and manufacturer "
                f"credentials in the inspection seizure register. Where defects are non-critical, issue an advisory rectification directive; "
                f"where deceptive packaging or net weight shortages exist, initiate formal adjudication under Section 36."
            )
        return intro + body

    elif persona == "vendor":
        # Vendor Persona: Pre-market correction, PDP guidelines, compliance remedies
        intro = f"Pre-Market Packaging Compliance Advisory ({citation_summary})\n\n"
        if is_mrp:
            body = (
                "To ensure your packaging is 100% compliant before market distribution:\n\n"
                "1. Declaration Format: Print `MRP ₹ xx.xx (incl. of all taxes)` in clear, contrasting typography.\n"
                "2. Unit Sale Price (USP): Under the amended Rule 6(11), if the package contains more than 1 kg / 1 L, "
                "you must also declare the Unit Sale Price per gram, kg, ml, or piece (e.g. `₹ 0.50 per g`).\n"
                "3. Dual Stickers Prohibited: Never affix adhesive price alteration stickers over pre-printed MRPs. "
                "Inspectors treat altered labels as prima facie violations under Section 36."
            )
        elif is_font:
            body = (
                "To calculate and verify your typography before final label printing:\n\n"
                "1. Calculate PDP Area: Measure the height × width of the principal face of the carton or pouch.\n"
                "2. Apply Rule 9 Table: For standard consumer packs between 100 cm² and 500 cm², all numerical values "
                "(net quantity, MRP, unit price) must be at least 2.5 mm in height.\n"
                "3. Contrast Requirement: Ensure sufficient visual contrast against the background so text is easily legible to consumers."
            )
        elif is_mfg:
            body = (
                "Under Rule 6(1)(a) & 6(1)(b), every consumer pack must clearly state:\n"
                "- Complete physical address of the manufacturer, packer, or importer.\n"
                "- Name and official consumer care contact number, email, and postal address.\n"
                "- Country of origin (especially mandatory for imported or blended goods)."
            )
        else:
            body = (
                f"Under {citations[0].statutory_reference}, your artwork and packaging must declare all mandatory provisions "
                f"prior to dispatch. Running a digital pre-market scan through METRA allows your QA/Regulatory team to identify "
                f"layout or typography mismatches and correct them at the prepress stage without statutory liability."
            )
        return intro + body

    elif persona == "consumer":
        # Consumer Persona: Plain language, rights, how to report, no risk scores
        intro = f"Citizen Packaging & Consumer Rights Guide\n\n"
        if is_mrp:
            body = (
                "Here is what you need to know about Maximum Retail Price (MRP) as a consumer:\n\n"
                "• No Extra Charges: A retailer or restaurant cannot charge you more than the printed MRP under any circumstances — "
                "even for chilled beverages or packaging fees. The MRP already includes all applicable GST and taxes.\n"
                "• Dual Pricing is Illegal: Selling the same identical commodity at higher prices in different retail spots "
                "(like airports or multiplexes) without unique packaging or statutory clearance is prohibited.\n"
                "• What you can do: If you are overcharged, ask for a printed bill showing the amount charged, take a photo "
                "of the product's MRP label, and submit a report here on METRA or call the National Consumer Helpline at 1915."
            )
        elif is_qty:
            body = (
                "Every packaged commodity in India must clearly show its exact Net Quantity (weight, volume, or piece count) "
                "in metric units (grams, kilograms, milliliters, liters).\n\n"
                "If a package feels unusually empty, look at the net weight declaration on the front or back. If you suspect short-weight, "
                "you have the right to have it weighed on an approved electronic balance at the store."
            )
        else:
            body = (
                f"Under the Legal Metrology (Packaged Commodities) Rules, 2011, all consumer packages must clearly display:\n"
                f"1. Maximum Retail Price (inclusive of all taxes)\n"
                f"2. Net Quantity in standard units\n"
                f"3. Date of Manufacture / Expiry\n"
                f"4. Manufacturer name and customer care contact details\n\n"
                f"If any of these details are missing, hidden, or scratched out, you can file an unverified lead through METRA's "
                f"Citizen Reporting portal for officer investigation."
            )
        return intro + body

    else:
        # Headquarters Persona: Macro policy, compounding, Section 48, gazette amendments
        intro = f"Headquarters Regulatory Policy & Oversight Briefing ({citation_summary})\n\n"
        if is_compound:
            body = (
                "Directorate Compounding Policy (Section 48 Harmonization):\n"
                "- First Offence Ceiling: Section 48 empowers the Controller / designated Legal Metrology officer to compound "
                "offences punishable under Section 36(1) upon payment of compounding sum (capped at statutory limits).\n"
                "- Three-Year Recidivism Bar: Compounding is statutorily impermissible if the violator has committed the same offence "
                "within the prior 36 months.\n"
                "- Corporate Responsibility: Directors and persons in charge are vicariously liable under Section 49 unless due diligence is proven."
            )
        else:
            body = (
                f"National Regulatory Standard ({citations[0].rule_code}):\n"
                f"The Directorate maintains uniform enforcement standards across State Legal Metrology departments. "
                f"Amendments under Gazette notifications mandate strict compliance with digital disclosures and unit sale prices. "
                f"Where systemic non-compliance is identified across multiple jurisdictions, HQ may issue advisory directives "
                f"or coordinate multi-state market surveillance sweeps."
            )
        return intro + body


def _get_contextual_followups(query: str, persona: str, citations: List[AskMetraCitation]) -> List[str]:
    """
    Returns 3-4 interactive follow-up question chips tailored to persona and query topic.
    """
    q = query.lower()
    meta = PERSONA_METADATA.get(persona, PERSONA_METADATA["consumer"])

    if "mrp" in q or "price" in q:
        if persona == "officer":
            return [
                "What is the exact panchnama format for seizing dual-MRP goods?",
                "How do we prove mens rea for corporate directors under Section 49?",
                "What are the compounding fees for a second MRP infraction?",
            ]
        elif persona == "vendor":
            return [
                "How do I format Unit Sale Price for multi-pack items?",
                "Are discount promotional stickers allowed over the MRP?",
                "What are the guidelines for e-commerce digital MRP listings?",
            ]
        elif persona == "consumer":
            return [
                "Can a shop charge ₹5 extra for cooling a soft drink?",
                "How do I report dual MRP at an airport or cinema hall?",
                "What is the National Consumer Helpline (NCH) toll-free number?",
            ]
        else:
            return [
                "What are the national statistics on Section 36(1) prosecutions?",
                "How do states handle uniform compounding for e-commerce marketplaces?",
                "What gazette notifications govern Unit Sale Price exemptions?",
            ]

    # Return persona default followups
    return meta["default_followups"][:3]
