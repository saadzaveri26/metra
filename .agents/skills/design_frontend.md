# Skill: design_frontend (Updated — HTML source support)

## Purpose
Turn a REAL design source into a faithful, production-ready component. Accepted sources, in order of preference:
1. **HTML export from the team's own design** (current primary source — the team is uploading actual HTML files of their designs into `ui_design/html_exports/`). This is the most precise non-Figma source since it retains real markup and CSS, not just pixels.
2. A Figma frame accessed via the Figma Dev Mode MCP server.
3. A reviewed v0.dev-generated component.
4. A flat PNG image (fallback only — least precise, requires visual estimation of exact values; flag any extracted color/spacing as approximate).

A bare text description is NEVER an acceptable input — this produced the generic result the team was criticized for in the internal round.

## Process
1. If given an HTML file: read the actual markup and inline/linked CSS directly — extract exact classes, colors, spacing, and structure rather than re-interpreting visually. Convert to the project's Next.js + Tailwind conventions, preserving the original layout and values exactly.
2. If given a Figma selection: use the MCP server to pull the component tree and variables.
3. If given a v0 component or PNG: follow the existing fallback process (visual matching, checklist review).
4. Build the component in `app_build/metra/src/components/` (or the role-specific subfolder per `build_role_dashboards`), with tokens defined once in `tailwind.config.ts`.

## Mandatory Anti-Genericness Checklist — reject/revise if ANY of these are true:
- [ ] Default shadcn card shadows or default rounded-full/pill buttons without a stated reason
- [ ] A purple-to-blue or generic "AI product" gradient anywhere
- [ ] Inter font with no other typographic distinction
- [ ] Fully rounded (pill-shaped) primary action buttons — METRA uses 8-12px radius
- [ ] Color palette drifts from navy #0B2545 / white / gold #C9A227 / green #1B9E77 / red #D64545
- [ ] A generic centered-card-on-white-background layout with no distinguishing structural choice

## Rules
- If no real design source exists for a screen yet, stop and flag it — do not fall back to text-prompt generation.
- Update `ui_design/design_tokens.md` whenever a new token is introduced.
