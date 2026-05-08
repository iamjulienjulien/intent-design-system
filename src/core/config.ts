/* ============================================================================
   src/core/config.ts
   Intent Design System – Resolver engine config
   - Internal calculation constants for resolve logic
   - Not part of the public system registry
============================================================================ */

import type { Glow, Intensity, Mode, Tone } from "../system/types";

/* ============================================================================
   Tone / glow engine constants
============================================================================ */

export const FALLBACK_TONE_STEP = 500 as const;
export const GLOW_TAIL_ALPHA = 0.1 as const;

/* ============================================================================
   Intensity interpolation
============================================================================ */

export const INTENSITY_POSITION: Record<Intensity, number> = {
    soft: 0.0,
    medium: 0.5,
    strong: 1.0,
};

/* ============================================================================
   Text / ring step bases
============================================================================ */

export const TEXT_STEP_BASE_BY_MODE: Record<Mode, number> = {
    dark: 200,
    light: 800,
};

export const GLOWED_TEXT_STEP_BASE_BY_MODE: Record<Mode, number> = {
    dark: 200,
    light: 700,
};

export const RING_STEP_BASE_DEFAULT = 700 as const;
export const RING_STEP_BASE_GLOWED = 600 as const;
export const GLOWED_RING_BASE_STEP = 600 as const;

/* ============================================================================
   Alpha curves
============================================================================ */

export const BG_ALPHA_RANGE_BY_MODE: Record<Mode, { min: number; max: number }> = {
    dark: { min: 0.1, max: 0.22 },
    light: { min: 0.09, max: 0.18 },
};

export const RING_ALPHA_RANGE_BY_MODE: Record<Mode, { min: number; max: number }> = {
    dark: { min: 0.14, max: 0.28 },
    light: { min: 0.14, max: 0.24 },
};

export const RING_BOOST_BY_MODE: Record<
    Mode,
    {
        default: { factor: number; min: number; max?: number };
        glowed: { factor: number; min: number; max?: number };
    }
> = {
    dark: {
        default: { factor: 1.45, min: 0.2 },
        glowed: { factor: 1.55, min: 0.22 },
    },
    light: {
        default: { factor: 1.2, min: 0.16, max: 0.28 },
        glowed: { factor: 1.24, min: 0.18, max: 0.32 },
    },
};

/* ============================================================================
   Glow curves / filters
============================================================================ */

export const GLOW_FILL_OPACITY_BY_MODE: Record<Mode, Record<Intensity, number>> = {
    dark: {
        soft: 0.68,
        medium: 0.82,
        strong: 0.92,
    },
    light: {
        soft: 0.7,
        medium: 0.85,
        strong: 1,
    },
};

export const GLOW_BORDER_OPACITY_BY_MODE: Record<Mode, Record<Intensity, number>> = {
    dark: {
        soft: 0.78,
        medium: 0.9,
        strong: 1.0,
    },
    light: {
        soft: 0.24,
        medium: 0.34,
        strong: 0.46,
    },
};

export const GLOW_FILTER_BY_MODE: Record<Mode, Record<Intensity, string>> = {
    dark: {
        soft: "saturate(1.14) brightness(1.08)",
        medium: "saturate(1.20) brightness(1.12)",
        strong: "saturate(1.26) brightness(1.16)",
    },
    light: {
        soft: "saturate(1.02) brightness(1.01)",
        medium: "saturate(1.05) brightness(1.02)",
        strong: "saturate(1.08) brightness(1.03)",
    },
};

export const GLOWED_LIGHT_GLOW_FILL_FACTOR = 0.9 as const;
export const GLOWED_LIGHT_GLOW_BORDER_FACTOR = 0.92 as const;
