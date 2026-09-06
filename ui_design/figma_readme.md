# Figma / v0 Source Workflow

1. Design each screen in Figma, checking the anti-genericness checklist in .agents/skills/design_frontend.md while designing.
2. Connect the Figma Dev Mode MCP server (check Antigravity's MCP/extension settings) — free plan allows 6 calls/month, Dev/Full seat removes the limit.
3. Select a complete frame, then prompt: "Implement this Figma design. Use the Figma MCP tools to read the current selection. Map components to app_build/metra/src/components. Output a Next.js page with Tailwind classes matching the design's variables exactly."
4. If not using Figma: generate in v0.dev with a specific, non-generic prompt, review against the checklist, then hand the approved output to the Frontend Design Agent.

Drop exported reference images/components in figma_or_v0_exports/.
