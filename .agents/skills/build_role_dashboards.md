# Skill: build_role_dashboards

## Purpose
Scaffold and implement the four role-specific dashboards on a shared visual foundation with different functionality per role.

## Folder Convention
```
src/app/
  officer/        <- existing core pipeline: scan, compliance result, risk queue, history
  vendor/         <- self-check, compliance history, violation response, guidance checklist
  consumer/       <- product lookup (compliance + health report), report a product, scan history
  headquarters/   <- analytics, officer workload view, seller leaderboard, rule/policy management
  sign-in/
  sign-up/
src/components/
  shared/         <- header, nav shell, cards, charts used across multiple dashboards
  officer/
  vendor/
  consumer/
  headquarters/
```

## Feature Scope Per Role (confirmed)

**Officer** (already built): scan pipeline, compliance result with bounding boxes, risk queue, case creation, inspection history.

**Vendor:**
- Pre-launch label self-check: reuses the existing scan → OCR → compliance-matrix pipeline, but the result is advisory only (no case is created, no risk score affects the seller_registry) — clearly label this as "self-check, not an official inspection."
- View own compliance history & open cases: query cases where `business_id` matches the logged-in vendor's linked business record.
- Respond to a violation: a form attached to an open case allowing the vendor to submit clarification text and/or supporting evidence images. Store as a new `case_response` record, linked to the case — never overwrites the original violation record.
- Compliance guidance checklist by category: reuses the compliance matrix (read-only) filtered by the vendor's selected product category, presented as a plain checklist rather than a pass/fail result.

**Consumer:**
- Combined compliance + health report lookup: calls both the existing rule-check summary (public, simplified — compliant/non-compliant only, no internal risk score) and `consumer_health_report`'s Open Food Facts data for the same barcode.
- Report a suspicious product: a simple form (barcode/photo + description) creating a `consumer_report` record, routed into the officer's risk queue as a lower-priority, unverified lead — never auto-created as a confirmed case.
- General safety/recall alerts: a simple list view of officer-published alerts (new small `alerts` table, populated manually or by HQ/officer action — not automated).
- Personal scan history: requires the lightweight optional consumer account (Clerk); anonymous consumers can still use lookup/report without history.

**Headquarters:**
- Aggregated analytics: violation counts and compliance rate by region/category over time, queried from existing case data — no new data model needed, just aggregation queries.
- Officer workload/performance view: case counts per officer/district, pending queue sizes — aggregation over existing case + officer records.
- Repeat-offender/seller leaderboard: surfaces the `seller_registry` vector-DB matches (see `vector_database` skill, Use Case 3) ranked by violation frequency — this is the dashboard where that feature actually gets shown to a user.
- Rule/policy management: a form to add/edit compliance matrix entries (rule text, category, severity, effective dates) — writes directly to the same rules data every dashboard's compliance engine reads from, so a change here takes effect everywhere immediately. Requires headquarters role; log every edit with who made it and when.

## Ask METRA Per Role
Same underlying retrieval pipeline (see `ask_metra_persona` skill) — only the system prompt, tone, and data scope change per dashboard.

## Rules
- Never let a vendor's self-check pipeline write to the same case/risk tables the officer pipeline uses — self-check results are advisory and isolated.
- Consumer reports are leads, not verified violations — never merge them into the officer risk queue with full confidence weight.
- Only headquarters-role requests may write to the rules/compliance matrix table.
