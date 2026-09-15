/*
 * METRA — Metrology Enforcement & Traceability Regulatory Assistant
 *
 * Design System: UX4G Design System 3.0 (Token Translation)
 * UX4G tokens (spacing, radius, elevation, typography) are translated into
 * Tailwind's configuration to maintain METRA's existing utility-class workflow.
 * METRA role-specific colors are preserved; UX4G color palette is not imported.
 *
 * UX4G Design System
 * Copyright © 2024-2026 Government of India
 * Licensed under the MIT License
 * https://ux4g.gov.in
 */

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ═══════════════════════════════════════════════
      // METRA Role-Specific Color Palette (preserved)
      // ═══════════════════════════════════════════════
      colors: {
        metra: {
          blue: "#0867c9",
          "blue-dark": "#063d78",
          "blue-light": "#eaf4ff",
          ink: "#10243e",
          muted: "#62738a",
          bg: "#f7faff",
          line: "#dce7f2",
          // Consumer
          green: "#159a68",
          "green-light": "#e5f8ef",
          "green-dark": "#0e6e4a",
          // Vendor
          amber: "#b9781a",
          "amber-light": "#fff3df",
          "amber-dark": "#c98a1f",
          // Inspector / Officer
          brass: "#9a6b12",
          "brass-light": "#faf3e4",
          "brass-dark": "#7a5a0f",
          "brass-border": "#e6d8b8",
          // HQ
          navy: "#0a2038",
          "navy-light": "#e9edf3",
        },
      },

      // ═══════════════════════════════════════════════
      // UX4G Foundation: Typography (Noto Sans)
      // Source: https://ux4g.gov.in/foundations/typography
      // ═══════════════════════════════════════════════
      fontFamily: {
        sans: ['"Noto Sans"', "system-ui", "sans-serif"],
        display: ['"Noto Sans Display"', '"Noto Sans"', "sans-serif"],
      },
      fontWeight: {
        regular: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },

      // ═══════════════════════════════════════════════
      // UX4G Foundation: Corner Radius
      // Source: https://ux4g.gov.in/foundations/spacing
      //
      // DESIGN RULE: radius-2xl (24px) and radius-full (9999px)
      // are available but RESTRICTED to badges, avatars, spinners,
      // and status pills ONLY. They must NOT be applied to primary
      // buttons, cards, or main containers — per design_frontend.md
      // anti-pill rule for METRA's restrained government aesthetic.
      // ═══════════════════════════════════════════════
      borderRadius: {
        none: "0px",
        xs: "2px",
        sm: "4px",
        DEFAULT: "8px",     // ux4g-radius-md — primary default
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",      // RESTRICTED: badges, avatars, spinners only
        full: "9999px",     // RESTRICTED: badges, avatars, spinners only
      },

      // ═══════════════════════════════════════════════
      // UX4G Foundation: Elevation / Shadows
      // Source: https://ux4g.gov.in/foundations/elevation
      // ═══════════════════════════════════════════════
      boxShadow: {
        // METRA originals (kept for backward compat)
        metra: "0 18px 50px rgba(21, 62, 105, 0.10)",
        "metra-hover": "0 22px 60px rgba(21, 62, 105, 0.15)",

        // UX4G elevation levels
        "ux4g-0": "none",
        "ux4g-1": "0px 1px 2px 0px rgba(0,0,0,0.06), 0px 1px 2px 0px rgba(0,0,0,0.06)",
        "ux4g-2": "0px 4px 8px 0px rgba(0,0,0,0.08), 0px 1px 2px 0px rgba(0,0,0,0.06)",
        "ux4g-3": "0px 8px 16px 0px rgba(0,0,0,0.12), 0px 4px 8px 0px rgba(0,0,0,0.08)",
        "ux4g-4": "0px 16px 32px 0px rgba(0,0,0,0.16), 0px 8px 16px 0px rgba(0,0,0,0.12)",
      },

      // ═══════════════════════════════════════════════
      // UX4G Foundation: Z-Index Scale
      // Source: https://ux4g.gov.in/foundations/elevation
      // ═══════════════════════════════════════════════
      zIndex: {
        "0": "0",
        "1": "1",
        "2": "2",
        "3": "3",
        "10": "10",
        "20": "20",
        "30": "30",
        "40": "40",
        "50": "50",
      },

      // ═══════════════════════════════════════════════
      // UX4G Foundation: Max Width (Typography)
      // Source: https://ux4g.gov.in/foundations/typography
      // GIGW 3.0: 720px / ~65-75 chars max line width
      // ═══════════════════════════════════════════════
      maxWidth: {
        prose: "720px",
      },
    },
  },
  plugins: [],
};

export default config;
