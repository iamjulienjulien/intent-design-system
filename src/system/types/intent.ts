/* ============================================================================
   src/system/types/intent.ts
   Intent Design System – Core grammar types
============================================================================ */

import {
    GLOW_VALUES,
    INTENSITY_VALUES,
    INTENT_VALUES,
    MODE_VALUES,
    TONE_STEP_VALUES,
    TONE_VALUES,
    VARIANT_VALUES,
} from "../constants";

export type Intent = (typeof INTENT_VALUES)[number];
export type Variant = (typeof VARIANT_VALUES)[number];
export type Intensity = (typeof INTENSITY_VALUES)[number];
export type ToneStep = (typeof TONE_STEP_VALUES)[number];
export type Mode = (typeof MODE_VALUES)[number];
export type Tone = (typeof TONE_VALUES)[number];
export type Glow = (typeof GLOW_VALUES)[number];

export type IntentGlow = Extract<Glow, "info" | "empower" | "warn" | "threat" | "theme">;

export type AestheticGlow = Exclude<Glow, IntentGlow>;

export type GlowGradientStop = {
    size: string;
    at: string;
    color: string;
    stop: string;
};

export type GlowGradient = {
    dark: GlowGradientStop[];
    light: GlowGradientStop[];
};

export type IntentInput = {
    mode?: Mode;
    intent?: Intent;
    variant?: Variant;
    tone?: Tone;
    glow?: boolean | Glow;
    intensity?: Intensity;
    toneStep?: ToneStep;
    disabled?: boolean;
};

export type ResolvedIntent = {
    mode: Mode;
    intent: Intent;
    variant: Variant;
    intensity: Intensity;

    toneStep?: ToneStep;
    toneEffective: string | null;

    glowKey: Glow | null;
    glowBackground: string | null;

    style?: Record<string, string>;

    classes: {
        base: string;
        surface: string;
        border: string;
        text: string;
        ring: string;
        shadow: string;
        glow: string;
        disabled: string;
    };
};

export type IntentSurfaceResolvedProps = {
    className: string;
    style?: import("react").CSSProperties;
};

export type IntentWarningCode =
    | "tone_ignored"
    | "glow_string_ignored"
    | "glow_intent_key_forbidden"
    | "glow_disabled_for_toned";

export type IntentWarning = {
    code: IntentWarningCode;
    message: string;
};

export type ResolvedIntentWithWarnings = ResolvedIntent & {
    warnings: IntentWarning[];
};
