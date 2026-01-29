// styles/tailwind-preset.ts
// Tailwind preset for Intent Design System (hybrid mode).
// - Provides tokens via CSS variables (optional via styles/tokens.css)
// - Extends theme with semantic colors mapped to CSS vars
// - Designed to avoid safelist by relying on CSS variables

import type { Config } from "tailwindcss";

export const intentPreset = {
    theme: {
        extend: {
            /* -----------------------------------------------------------------
               Semantic colors (CSS variables)
            ----------------------------------------------------------------- */

            colors: {
                /* Base surfaces & ink */
                paper: "rgb(var(--ids-paper) / <alpha-value>)",
                ink: "rgb(var(--ids-ink) / <alpha-value>)",

                /* Intent semantic palette */
                informed: "rgb(var(--ids-informed) / <alpha-value>)",
                empowered: "rgb(var(--ids-empowered) / <alpha-value>)",
                warned: "rgb(var(--ids-warned) / <alpha-value>)",
                threatened: "rgb(var(--ids-threatened) / <alpha-value>)",
                themed: "rgb(var(--ids-themed) / <alpha-value>)",

                /* Toned mode (intent=\"toned\") */
                // --ids-tone       : RGB (space separated) injected inline
                // --ids-tone-ink   : ink color for contrast
                tone: "rgb(var(--ids-tone) / <alpha-value>)",
                "tone-ink": "rgb(var(--ids-tone-ink) / <alpha-value>)",
            },

            /* -----------------------------------------------------------------
               Radii (surface language)
            ----------------------------------------------------------------- */

            borderRadius: {
                "ids-lg": "1rem",
                "ids-xl": "1.25rem",
                "ids-2xl": "1.5rem",
            },

            /* -----------------------------------------------------------------
               Shadows
            ----------------------------------------------------------------- */

            boxShadow: {
                "ids-soft": "0 10px 30px rgb(0 0 0 / 0.08)",
            },
        },
    },
} satisfies Config;
