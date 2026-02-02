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

// src/lib/intent/types.ts
// src/lib/intent/types.ts

export type LocalizedText = {
    fr: string;
    en: string;
};

export type DocsPropRow = {
    name: string;
    description: LocalizedText;
    type: string;
    required: boolean;
    default?: string;

    fromSystem: boolean;
};

export type ComponentKind =
    | "surface"
    | "control"
    | "indicator"
    | "layout"
    | "feedback"
    | "data"
    | "design";

export type ComponentIdentity = {
    /** Public component name (exported symbol). */
    name: string;

    emoji?: string;

    /** Component category (surface/control/indicator/...). */
    kind: ComponentKind;

    /** Short description (FR/EN). */
    description: LocalizedText;

    /** First version where the component exists. */
    since?: string;

    /** Documentation pointers (landing routes, story ids...). */
    docs?: {
        route?: string;
        story?: string;
    };

    /**
     * Component anatomy (what renders where).
     * Keep these strings stable so docs/tests can rely on them.
     */
    anatomy: {
        /** Root element or host tag. */
        root: string;

        /** Main content wrapper (if any). */
        content?: string;

        /** Optional glow layers (IntentSurface-like). */
        glowFillLayer?: string;
        glowBorderLayer?: string;

        /** Controls-only: label wrapper (children), when it exists. */
        label?: string;

        /** Controls-only: optional spinner node (loading states). */
        spinner?: string;

        /** Controls-only: optional icon wrappers. */
        leftIcon?: string;
        rightIcon?: string;

        dot?: string;

        line?: string;

        track?: string;
        thumb?: string;
        textWrap?: string;
        description?: string;
        list?: string;
        trigger?: string;
        triggerLabel?: string;
        triggerIconLeft?: string;
        triggerIconRight?: string;

        value?: string;
        chevron?: string;
        popover?: string;
        listbox?: string;
        option?: string;
        header?: string;
        meta?: string;
        body?: string;
        leading?: string;
        control?: string;
        trailing?: string;
        hint?: string;
        error?: string;
        frame?: string;
        overlay?: string;
        panel?: string;
        input?: string;
        group?: string;
        groupLabel?: string;
        item?: string;
        itemIcon?: string;
        itemMain?: string;
        itemLabel?: string;
        itemDescription?: string;
        itemHint?: string;
        empty?: string;
        footer?: string;
        rail?: string;
        step?: string;
        stepIcon?: string;
        stepMain?: string;
        stepLabel?: string;
        stepDescription?: string;
        stepMeta?: string;
        icon?: string;
        title?: string;
        action?: string;
        close?: string;
        actions?: string;
        copy?: string;
        gutter?: string;
        pre?: string;
        code?: string;
        scroller?: string;
        table?: string;
        caption?: string;
        thead?: string;
        th?: string;
        tbody?: string;
        tr?: string;
        td?: string;
        loading?: string;
        field?: string;
        select?: string;
        swatch?: string;
        viewport?: string;
        stage?: string;
        links?: string;
        nodes?: string;
        node?: string;
        nodeHit?: string;
        link?: string;
        grid?: string;
        toolbar?: string;
        search?: string;
        minimap?: string;
        toggle?: string;
        segment?: string;
        segmentLabel?: string;
    };

    /**
     * Stable class hooks used by the component (no dynamic Tailwind here).
     * Include base hooks + variant/size hooks + state hooks when applicable.
     */
    classHooks: string[];

    /**
     * Optional stable data-* attributes emitted by the component.
     * Useful for testing + docs.
     */
    dataAttributes?: string[];

    /**
     * Optional stable state hooks (when you want them separated from classHooks).
     * If you prefer, you can keep them inside classHooks only.
     */
    stateHooks?: string[];

    /**
     * Optional related exports (helps docs cross-link quickly).
     */
    exports?: {
        component?: string; // e.g. "IntentSurface"
        propsTable?: string; // e.g. "IntentSurfacePropsTable"
        identity?: string; // e.g. "IntentSurfaceIdentity"
    };

    /**
     * Optional notes for docs (FR/EN).
     * Example: "Glow not rendered in ghost variant."
     */
    notes?: LocalizedText;
};
