/* ============================================================================
   src/system/docProps.ts
   Intent Design System – Shared system props documentation registry
============================================================================ */

import type { DocsPropRow, DocsSystemApiRow } from "./types";

export const SYSTEM_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "intent",
        description: {
            fr: "Intent sémantique (informed/empowered/warned/threatened/themed/toned/glowed).",
            en: "Semantic intent (informed/empowered/warned/threatened/themed/toned/glowed).",
        },
        type: "Intent",
        required: false,
        default: "DEFAULT_INTENT",
        fromSystem: true,
    },

    {
        name: "variant",
        description: {
            fr: "Variant visuel (flat/outlined/elevated/ghost).",
            en: "Visual variant (flat/outlined/elevated/ghost).",
        },
        type: "Variant",
        required: false,
        default: "DEFAULT_VARIANT",
        fromSystem: true,
    },

    {
        name: "tone",
        description: {
            fr: "Override de tone (n’a d’effet que si intent='toned').",
            en: "Tone override (only effective when intent='toned').",
        },
        type: "Tone",
        required: false,
        default: "DEFAULT_TONE (si toned)",
        fromSystem: true,
    },

    {
        name: "toneStep",
        description: {
            fr: "Step Tailwind (50..950) pour éclaircir/assombrir les teintes (autour du step canonique 500).",
            en: "Tailwind step (50..950) to lighten/darken tone-based colors (around the canonical 500 step).",
        },
        type: "ToneStep",
        required: false,
        default: "DEFAULT_TONE_STEP",
        fromSystem: true,
    },

    {
        name: "glow",
        description: {
            fr: "Glow normal (true/false) ou glow esthétique (uniquement si intent='glowed').",
            en: "Standard glow (true/false) or aesthetic glow (only when intent='glowed').",
        },
        type: "boolean | Glow",
        required: false,
        default: "false (ou glow par intent)",
        fromSystem: true,
    },

    {
        name: "intensity",
        description: {
            fr: "Intensité (soft/medium/strong).",
            en: "Intensity (soft/medium/strong).",
        },
        type: "Intensity",
        required: false,
        default: "DEFAULT_INTENSITY",
        fromSystem: true,
    },

    {
        name: "mode",
        description: {
            fr: "Mode colorimétrique (dark/light).",
            en: "Color mode (dark/light).",
        },
        type: "Mode",
        required: false,
        default: "DEFAULT_MODE",
        fromSystem: true,
    },

    {
        name: "disabled",
        description: {
            fr: "Désactive l’état visuel (hooks + styles).",
            en: "Disables the visual state (hooks + styles).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: true,
    },
];

export const SYSTEM_API_TABLE: DocsSystemApiRow[] = [
    {
        name: "IntentName",
        kind: "type",
        description: {
            fr: "Type union des intents sémantiques.",
            en: "Union type for semantic intents.",
        },
        valueOrRef: `"informed" | "empowered" | "warned" | "threatened" | "themed" | "toned" | "glowed"`,
    },
    {
        name: "VariantName",
        kind: "type",
        description: {
            fr: "Type union des variants visuels.",
            en: "Union type for visual variants.",
        },
        valueOrRef: `"flat" | "outlined" | "elevated" | "ghost"`,
    },
    {
        name: "ToneName",
        kind: "type",
        description: {
            fr: "Type union des tones (familles Tailwind + theme + black).",
            en: "Union type for tones (Tailwind families + theme + black).",
        },
        valueOrRef: `("slate" | "gray" | ... | "theme" | "black")`,
    },
    {
        name: "GlowName",
        kind: "type",
        description: {
            fr: "Type union des aesthetic glows (utilisable quand intent='glowed').",
            en: "Union type for aesthetic glows (usable when intent='glowed').",
        },
        valueOrRef: `"aurora" | "ember" | "cosmic" | "mythic" | "royal" | "mono"`,
    },
    {
        name: "Intensity",
        kind: "type",
        description: {
            fr: "Intensité des effets (glow/contraste).",
            en: "Intensity for effects (glow/contrast).",
        },
        valueOrRef: `"soft" | "medium" | "strong"`,
    },
    {
        name: "ModeName",
        kind: "type",
        description: {
            fr: "Mode colorimétrique.",
            en: "Color mode.",
        },
        valueOrRef: `"dark" | "light"`,
    },
    {
        name: "DEFAULT_INTENT",
        kind: "constant",
        description: {
            fr: "Intent par défaut si aucun intent n’est fourni.",
            en: "Default intent when none is provided.",
        },
        valueOrRef: `informed`,
    },
    {
        name: "DEFAULT_VARIANT",
        kind: "constant",
        description: {
            fr: "Variant par défaut si aucun variant n’est fourni.",
            en: "Default variant when none is provided.",
        },
        valueOrRef: `elevated`,
    },
    {
        name: "DEFAULT_GLOW_BY_INTENT",
        kind: "constant",
        description: {
            fr: "Mapping intent → glow par défaut (quand glow est implicite).",
            en: "Mapping intent → default glow (when glow is implicit).",
        },
        valueOrRef: `DEFAULT_GLOW_BY_INTENT`,
    },
];
