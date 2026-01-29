/* ============================================================================
   src/lib/intent/types.ts
   Intent Design System – Types (single source of truth)
============================================================================ */

/* ============================================================================
   🧠 Core intent grammar
============================================================================ */

export type IntentName =
    | "informed"
    | "empowered"
    | "warned"
    | "threatened"
    | "themed"
    | "toned"
    | "glowed";

export type VariantName = "flat" | "outlined" | "elevated" | "ghost";

export type Intensity = "soft" | "medium" | "strong";

/* ============================================================================
   🌓 Mode (light/dark)
   - Explicit mode passed from host app
   - Default will be handled by resolver/components (fallback: "dark")
============================================================================ */

export type ModeName = "light" | "dark";

/* ============================================================================
   🎚 Tone system (only for intent="toned")
============================================================================ */

export type ToneName =
    | "slate"
    | "gray"
    | "zinc"
    | "neutral"
    | "stone"
    | "red"
    | "orange"
    | "amber"
    | "yellow"
    | "lime"
    | "green"
    | "emerald"
    | "teal"
    | "cyan"
    | "sky"
    | "blue"
    | "indigo"
    | "violet"
    | "purple"
    | "fuchsia"
    | "pink"
    | "rose"
    | "theme"
    | "black";

/* ============================================================================
   ✨ Glow system
   - intent glows    : reinforce an intent
   - aesthetic glows : ambiance / mood
============================================================================ */

export type IntentGlowName = "info" | "empower" | "warn" | "threat" | "theme";
export type AestheticGlowName = "aurora" | "ember" | "cosmic" | "mythic" | "royal" | "mono";

export type GlowKey = IntentGlowName | AestheticGlowName;
export type GlowName = GlowKey;

/* ============================================================================
   🧩 Public input API
============================================================================ */

export type IntentInput = {
    mode?: ModeName; // default (resolved): "dark"

    intent?: IntentName; // default: "informed"
    variant?: VariantName; // default: "elevated"

    tone?: ToneName; // only if intent="toned"
    glow?: boolean | GlowName; // true => implicit intent glow

    intensity?: Intensity; // default: "medium"
    disabled?: boolean;
};

/* ============================================================================
   🧪 Resolved intent (output of the brain)
============================================================================ */

export type ResolvedIntent = {
    mode: ModeName;

    intent: IntentName;
    variant: VariantName;
    intensity: Intensity;

    toneEffective: string | null; // e.g. "emerald" | "informed" | null

    glowKey: GlowKey | null; // resolved glow key
    glowBackground: string | null; // CSS background-image (radial gradients)

    style?: Record<string, string>;

    classes: {
        base: string;
        surface: string;
        border: string;
        text: string;
        ring: string;
        shadow: string;
        glow: string; // hook class (ids-glow …)
        disabled: string;
    };
};

/* ============================================================================
   🧷 Helper output types (ergonomics)
============================================================================ */

/**
 * Props produced by the resolver helpers (getIntentSurfaceProps).
 * This is NOT the public component props.
 */
export type IntentSurfaceResolvedProps = {
    className: string;
    style?: import("react").CSSProperties;
};

/* ============================================================================
   ⚠️ Warnings (DX)
============================================================================ */

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
