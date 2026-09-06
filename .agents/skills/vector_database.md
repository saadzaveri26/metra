# Skill: vector_database

## Purpose
Add semantic (meaning-based) matching to METRA in three specific places where exact string matching fails. This is an addition alongside the existing relational store (SQLite/Postgres) — NOT a replacement. Structured, transactional data (cases, businesses, violations, scan records) stays in the relational database. The vector database only handles similarity search.

## Setup
```bash
pip install chromadb sentence-transformers
```

```python
import chromadb
from chromadb.utils import embedding_functions

client = chromadb.PersistentClient(path="./vector_store")
embedder = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)
```

Store `vector_store/` inside `app_build/metra/backend/` and add it to `.gitignore` if it's large — it can be rebuilt from source data on setup.

## Use Case 1 — Rule Matching (Compliance Engine)
**Collection:** `rules_corpus`
**Purpose:** match extracted label text (e.g. "Origin: IN") to the correct rule requirement (e.g. "Country of Origin") despite phrasing variation.

Embed every rule's requirement text once at startup/seed time, with metadata: `rule_id`, `category`, `effective_from`. At runtime, embed each extracted field's text and query for the nearest rule. Set a similarity threshold (start ~0.75) — below it, treat as no match rather than forcing a low-confidence one.

## Use Case 2 — Ask METRA Retrieval
**Collection:** reuses `rules_corpus`.
**Purpose:** ground the assistant's answers in an actual rule clause instead of free-form generation.

Embed the user's typed question, query `rules_corpus` for the top 1-3 matches, and construct the answer from a template: retrieved rule text + a plain-language explanation + the clause citation. Never let the assistant answer without a retrieved match backing it — if nothing scores above threshold, respond that the question is outside the current rule corpus rather than guessing.

## Use Case 3 — Repeat-Offender / Cross-Listing Detection
**Collection:** `seller_registry`
**Purpose:** catch the same seller/business appearing under inconsistent name/address formatting across records — directly addresses the "repeat offenders are difficult to identify across products and locations" problem named in the project's own submission.

On every new case, embed a normalized string of `business_name + address + product_category` and query `seller_registry` for the nearest existing entry:
- Above threshold (~0.75-0.8 cosine similarity): treat as the same seller, link to the existing `business_id`, and feed this into the Risk Engine's seller-history factor even though the raw text didn't exact-match.
- Below threshold: treat as a genuinely new seller and add it as a new entry.

Log every match decision (matched business_id, similarity score) for auditability — an officer should be able to see why two records were linked, not just that they were.

## Rules
- Never use the vector database for data that needs exact, transactional integrity (case status, risk scores, timestamps) — that stays relational.
- Always tune and document the similarity threshold per collection rather than using a single global value — rule matching and seller matching have different tolerance for false positives.
- Log low-confidence matches (near the threshold) for officer review rather than silently deciding either way, consistent with the project's existing confidence-based review pattern.
- Rebuild the `rules_corpus` collection whenever the rules database is updated (new Gazette notification) — this is what keeps rule matching current without retraining any model.