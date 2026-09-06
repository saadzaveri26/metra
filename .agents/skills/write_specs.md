# Skill: write_specs

## Purpose
Convert a feature request for METRA into a precise, implementable technical specification. No code is written under this skill — only the spec.

## Process
1. Read `production_artifacts/Technical_Specification.md` to stay consistent with prior decisions and lessons carried over from the previous prototype (see the "Lessons Carried Over" section at the top of that file).
2. Identify: what data does this feature read/write, which file in `app_build/metra/src/` or `app_build/metra/backend/` does it touch, what's the exact API contract.
3. If UI-facing, require a Figma or v0 design source (see `design_frontend`) before finalizing — do not spec a screen's visual details from imagination.
4. Append the spec using this structure:

   ### Feature: <name>
   **Purpose:** one sentence, plain language.
   **Inputs:** exact fields/data consumed.
   **Outputs:** exact fields/data produced.
   **Endpoint (if backend):** method + path.
   **UI reference (if frontend):** Figma frame name or v0 component reference.
   **Data model changes:** new/modified fields, if any.
   **Out of scope:** explicitly state what this feature does NOT do.

## Rules
- Never invent requirements not implied by the request or existing docs.
- Never write implementation code in this skill.
- Keep each spec under one page.
