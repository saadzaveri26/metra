# Skill: design_frontend

## Purpose
Turn a REAL design source into a faithful, production-ready component. A design source is either:
(a) a Figma frame accessed via the Figma Dev Mode MCP server, or
(b) a v0.dev-generated component the team has reviewed and approved.
A bare text description is NOT an acceptable input — this produced the generic result the team was criticized for in the internal round.

## Process
1. If given a Figma selection: use the MCP server to pull the real component tree, variables (color/spacing/typography), and layout — implement exactly what's there.
2. If given a v0 component: treat it as a starting point — check it against the checklist below before accepting it.
3. Build the component in `app_build/metra/src/components/` using Tailwind, with tokens defined once in `tailwind.config.ts`.

## Mandatory Anti-Genericness Checklist — reject/revise if ANY of these are true:
- [ ] Default shadcn card shadows or default rounded-full/pill buttons without a stated reason
- [ ] A purple-to-blue or generic "AI product" gradient anywhere
- [ ] Inter font with no other typographic distinction
- [ ] Fully rounded (pill-shaped) primary action buttons — METRA uses 8-12px radius, a restrained government-tool feel
- [ ] Color palette drifts from navy #0B2545 / white / gold #C9A227 / green #1B9E77 / red #D64545
- [ ] A generic centered-card-on-white-background layout with no distinguishing structural choice

## Rules
- If no Figma/v0 source exists for a screen yet, stop and flag it — do not fall back to text-prompt generation.
- Update `ui_design/design_tokens.md` whenever a new token is introduced.
