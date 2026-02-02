/* ============================================================================
   src/lib/intent/mapping.ts
   Intent Design System – Canonical mappings
============================================================================ */

import type { IntentName, ToneName, GlowKey, VariantName } from "./types";

export const DEFAULT_INTENT: IntentName = "informed";
export const DEFAULT_VARIANT: VariantName = "elevated";
export const DEFAULT_TONE: ToneName = "theme";

/**
 * Mapping intent -> glow key implicite (utilisé quand glow=true)
 * NOTE: meta-intents n'ont pas de glow implicite.
 */
export const DEFAULT_GLOW_BY_INTENT: Record<Exclude<IntentName, "toned" | "glowed">, GlowKey> = {
    informed: "info",
    empowered: "empower",
    warned: "warn",
    threatened: "threat",
    themed: "theme",
};

export const INTENT_TO_SEMANTIC_COLOR: Record<Exclude<IntentName, "toned" | "glowed">, string> = {
    informed: "informed",
    empowered: "empowered",
    warned: "warned",
    threatened: "threatened",
    themed: "themed",
};

/**
 * For `intent="toned"`, we interpret `tone` as the Tailwind color family:
 * e.g. "emerald" => bg-emerald/..., text-emerald, ring-emerald/...
 */
export const TONE_TO_COLOR_FAMILY: Record<ToneName, string> = {
    slate: "slate",
    gray: "gray",
    zinc: "zinc",
    neutral: "neutral",
    stone: "stone",
    red: "red",
    orange: "orange",
    amber: "amber",
    yellow: "yellow",
    lime: "lime",
    green: "green",
    emerald: "emerald",
    teal: "teal",
    cyan: "cyan",
    sky: "sky",
    blue: "blue",
    indigo: "indigo",
    violet: "violet",
    purple: "purple",
    fuchsia: "fuchsia",
    pink: "pink",
    rose: "rose",
    theme: "themed", // maps to your semantic token color
    black: "ink", // maps to your semantic token color
};

/* ----------------------------------------------------------------------------
   Tone → RGB (used only for intent="toned")
   Values are space-separated RGB for CSS vars.
---------------------------------------------------------------------------- */

export const TONE_TO_RGB: Record<ToneName, string> = {
    slate: "100 116 139",
    gray: "107 114 128",
    zinc: "113 113 122",
    neutral: "115 115 115",
    stone: "120 113 108",
    red: "239 68 68",
    orange: "249 115 22",
    amber: "245 158 11",
    yellow: "234 179 8",
    lime: "132 204 22",
    green: "34 197 94",
    emerald: "16 185 129",
    teal: "20 184 166",
    cyan: "6 182 212",
    sky: "14 165 233",
    blue: "59 130 246",
    indigo: "99 102 241",
    violet: "139 92 246",
    purple: "168 85 247",
    fuchsia: "217 70 239",
    pink: "236 72 153",
    rose: "244 63 94",
    theme: "168 85 247", // fallback = themed
    black: "0 0 0",
};

/* ----------------------------------------------------------------------------
   Ink for toned mode (can be themed later)
---------------------------------------------------------------------------- */

export const TONE_INK_RGB = "17 24 39"; // slate-900-ish

export const DEFAULT_THEME_COLOR = "167 103 162";

// export const DEFAULT_THEME_COLOR = "167 103 162";
