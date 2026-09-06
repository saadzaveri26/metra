---
description: 
---

# Workflow: startcycle

## Purpose
Standard cycle for building or modifying one feature of METRA, in this fresh repository.

## Steps
1. Spec Agent runs `write_specs`.
2. If UI-facing: Frontend Design Agent runs `design_frontend`, sourced from Figma (Dev Mode MCP) or a reviewed v0.dev component — never a bare text prompt.
3. Relevant implementation agent runs `generate_code`.
4. Code Auditor Agent runs `audit_code`.
5. DEPLOYMENT IS DEFERRED — do not run any deployment skill this cycle; none are included in this repo yet.

## Current state
Fresh repository — nothing built yet. Architecture and lessons from the previous prototype are preserved in `production_artifacts/Technical_Specification.md` and should inform every spec, but no code carries over automatically.

## Build order recommendation
1. Core pipeline: scan capture → OCR → field structuring → compliance matrix → 
   rule check → risk scoring → mismatch check → case creation.
2. Vector database setup: rules_corpus + seller_registry collections, wired into 
   the rule check step and case creation.
3. UI foundation from Figma/v0 sources for all core screens.
4. Avatar integration.
5. Email notifications.
6. Consumer health report.
7. Ask METRA (now trivial to wire up since rules_corpus already exists from step 2).

## Ground rules
- Never build UI from a bare text-to-UI prompt — Figma or v0 source required.
- METRA remains a decision-support tool — no automated penalties, officer always makes the final call.
- Barcode/LMPC lookup and online-listing comparison use local/mock data.
- Avatar lip sync never uses a paid/live cloud TTS API.
- All notification emails route to DEMO_MODE test inbox until explicitly enabled.
- Vector DB (Chroma) is for semantic matching only — never for transactional data 
  (case status, timestamps, risk scores), which stays in the relational store.
