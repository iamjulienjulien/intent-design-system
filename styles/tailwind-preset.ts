// styles/tailwind-preset.ts
// Tailwind preset for Intent Design System (hybrid mode).
// - Provides tokens via CSS variables (optional via styles/tokens.css)
// - Extends theme with semantic colors mapped to CSS vars

import type { Config } from "tailwindcss";

export const intentPreset = {
    theme: {
        extend: {
            colors: {
                // Base surfaces/ink using CSS variables (defined in tokens.css)
                paper: "rgb(var(--ids-paper) / <alpha-value>)",
                ink: "rgb(var(--ids-ink) / <alpha-value>)",

                // Intent palette (start minimal; we’ll expand later)
                informed: "rgb(var(--ids-informed) / <alpha-value>)",
                empowered: "rgb(var(--ids-empowered) / <alpha-value>)",
                warned: "rgb(var(--ids-warned) / <alpha-value>)",
                threatened: "rgb(var(--ids-threatened) / <alpha-value>)",
                themed: "rgb(var(--ids-themed) / <alpha-value>)",
            },
            borderRadius: {
                // Your design language likes rounded surfaces
                "ids-lg": "1rem",
                "ids-xl": "1.25rem",
                "ids-2xl": "1.5rem",
            },
            boxShadow: {
                "ids-soft": "0 10px 30px rgb(0 0 0 / 0.08)",
            },
        },
    },
} satisfies Config;
