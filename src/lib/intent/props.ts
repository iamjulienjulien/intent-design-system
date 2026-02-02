// src/lib/intent/props.ts
// Shared props table rows (IntentInput) used by all components

import type { DocsPropRow } from "./types";

export const SYSTEM_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "intent",
        description: {
            fr: "Intent sémantique (informed/empowered/warned/threatened/themed/toned/glowed).",
            en: "Semantic intent (informed/empowered/warned/threatened/themed/toned/glowed).",
        },
        type: "IntentName",
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
        type: "VariantName",
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
        type: "ToneName",
        required: false,
        default: "DEFAULT_TONE (si toned)",
        fromSystem: true,
    },
    {
        name: "glow",
        description: {
            fr: "Glow normal (true/false) ou glow esthétique (uniquement si intent='glowed').",
            en: "Standard glow (true/false) or aesthetic glow (only when intent='glowed').",
        },
        type: "boolean | GlowName",
        required: false,
        default: "false (ou DEFAULT_GLOW_BY_INTENT)",
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
        default: "medium",
        fromSystem: true,
    },
    {
        name: "mode",
        description: {
            fr: "Mode colorimétrique (dark/light).",
            en: "Color mode (dark/light).",
        },
        type: "ModeName",
        required: false,
        default: "dark",
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
