/* ============================================================================
   src/lib/intent/resolve.ts
   Intent Design System – Resolve logic (hybrid mode C)
   - Outputs stable class hooks + CSS variables (no dynamic Tailwind classes)
============================================================================ */

import type {
    IntentInput,
    IntentName,
    VariantName,
    ToneName,
    GlowName,
    GlowKey,
    Intensity,
    ResolvedIntent,
    ResolvedIntentWithWarnings,
    IntentSurfaceResolvedProps,
    IntentWarning,
} from "./types";

import {
    DEFAULT_INTENT,
    DEFAULT_VARIANT,
    DEFAULT_TONE,
    DEFAULT_THEME_COLOR,
    DEFAULT_GLOW_BY_INTENT,
    INTENT_TO_SEMANTIC_COLOR,
    TONE_TO_COLOR_FAMILY,
} from "./mapping";

import {
    getThemeGlowBackgroundCss,
    getDefaultThemeCssRgb,
    getDefaultThemeRgb,
    rgbToCssRgb,
    lighten,
    darken,
} from "../colors/themeHelpers";

/* ============================================================================
   🧭 Semantic → Tailwind family mapping (for text tint)
============================================================================ */

const SEMANTIC_TO_TW_FAMILY: Record<
    "informed" | "empowered" | "warned" | "threatened" | "themed",
    ToneName
> = {
    informed: "blue",
    empowered: "emerald",
    warned: "amber",
    threatened: "rose",
    themed: "violet",
};

/* ============================================================================
   🎆 Glow → Tone mapping (for glowed intent text tint)
============================================================================ */

function glowToTone(glow: GlowName): ToneName {
    switch (glow) {
        case "aurora":
            return "sky";
        case "ember":
            return "amber";
        case "cosmic":
            return "purple";
        case "mythic":
            return "emerald";
        case "royal":
            return "purple";
        case "mono":
            return "slate";
        default:
            return "emerald";
    }
}

/* ============================================================================
   🌫 Glow opacity curves (FINAL values, no further multiplication in CSS)
============================================================================ */

function glowFillOpacity(intensity: Intensity) {
    if (intensity === "soft") return 0.68;
    if (intensity === "strong") return 0.92;
    return 0.82;
}

function glowBorderOpacity(intensity: Intensity) {
    if (intensity === "soft") return 0.78;
    if (intensity === "strong") return 1.0;
    return 0.9;
}

/* ============================================================================
   🧰 Helpers
============================================================================ */

function clamp01(x: number) {
    return Math.max(0, Math.min(1, x));
}

function intensityToAlpha(intensity: Intensity, opts: { min: number; max: number }) {
    const map: Record<Intensity, number> = { soft: 0.0, medium: 0.5, strong: 1.0 };
    const t = clamp01(map[intensity]);
    const v = opts.min + (opts.max - opts.min) * t;
    return Number(v.toFixed(3));
}

/** Tailwind v4 exposes palette CSS vars: --color-emerald-500, etc. */
function tailwindColorVar(tone: string, step: number) {
    return `var(--ids-color-${tone}-${step})`;
}

/**
 * 🌓 Text step resolver
 * - dark: lighter text (200)
 * - light: darker text (800)
 * - glowed in light: slightly softer (700) to blend with aura
 */
function pickTextStep(mode: "light" | "dark", intent: IntentName): number {
    if (mode === "dark") return 200;
    return intent === "glowed" ? 700 : 800;
}

/**
 * Ring step: more dense than the fill.
 * - glowed: a bit softer to stay “aura”
 * - others: more contrast
 */
function pickRingStep(intent: IntentName): number {
    return intent === "glowed" ? 600 : 700;
}

/**
 * Ring opacity boost: stronger separation fill ↔ border.
 * (Clamped and stable across intensities.)
 */
function boostRingOpacity(ringOpacity: number, intent: IntentName): number {
    const factor = intent === "glowed" ? 1.55 : 1.45;
    const min = intent === "glowed" ? 0.22 : 0.2;
    return clamp01(Math.max(min, ringOpacity * factor));
}

/* ============================================================================
   🌈 Glow gradients
============================================================================ */

const GLOW_TAIL_ALPHA = 0.04;

function toTransparent(color: string) {
    const c = color.trim();

    if (c.startsWith("rgba(")) {
        return c.replace(
            /rgba\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/,
            `rgba($1,$2,$3,${GLOW_TAIL_ALPHA})`
        );
    }

    if (c.startsWith("hsl(") && c.includes("/")) {
        return c.replace(/\/\s*([0-9.]+)\s*\)/, `/ ${GLOW_TAIL_ALPHA})`);
    }

    return `rgba(0,0,0,${GLOW_TAIL_ALPHA})`;
}

function radial(size: string, at: string, color: string, fadeAt: string) {
    const transparentColor = toTransparent(color);
    return `radial-gradient(${size} at ${at}, ${color} 0%, ${transparentColor} ${fadeAt})`;
}

const GLOW_BACKGROUND: Record<GlowKey, string> = {
    info: [
        radial("180% 140%", "18% 18%", "rgba(255,255,255,0.14)", "72%"),
        radial("160% 140%", "82% 35%", "rgba(148,163,184,0.14)", "70%"),
    ].join(","),

    empower: [
        radial("190% 150%", "15% 20%", "rgba(52,211,153,0.28)", "74%"),
        radial("165% 150%", "85% 30%", "rgba(16,185,129,0.22)", "72%"),
    ].join(","),

    warn: [
        radial("190% 150%", "15% 20%", "rgba(251,191,36,0.28)", "74%"),
        radial("165% 150%", "85% 30%", "rgba(245,158,11,0.22)", "72%"),
    ].join(","),

    threat: [
        radial("190% 150%", "15% 20%", "rgba(244,63,94,0.28)", "74%"),
        radial("165% 150%", "85% 30%", "rgba(190,18,60,0.20)", "72%"),
    ].join(","),

    theme: getThemeGlowBackgroundCss(radial, {
        size1: "80% 200%",
        at1: "15%",
        stop1: "78%",
        size2: "60% 200%",
        at2: "85%",
        stop2: "76%",
    }),

    aurora: [
        radial("190% 150%", "15% 20%", "rgba(34,211,238,0.28)", "74%"),
        radial("165% 150%", "85% 30%", "rgba(217,70,239,0.26)", "72%"),
    ].join(","),

    ember: [
        radial("190% 150%", "15% 20%", "rgba(251,191,36,0.30)", "74%"),
        radial("165% 150%", "85% 30%", "rgba(244,63,94,0.28)", "72%"),
    ].join(","),

    cosmic: [
        radial("190% 150%", "20% 15%", "rgba(99,102,241,0.32)", "74%"),
        radial("165% 150%", "80% 35%", "rgba(217,70,239,0.28)", "72%"),
    ].join(","),

    mythic: [
        radial("190% 150%", "15% 20%", "rgba(52,211,153,0.32)", "74%"),
        radial("165% 150%", "85% 30%", "rgba(14,165,233,0.28)", "72%"),
    ].join(","),

    royal: [
        radial("190% 150%", "15% 20%", "rgba(139,92,246,0.32)", "74%"),
        radial("165% 150%", "85% 30%", "rgba(236,72,153,0.28)", "72%"),
    ].join(","),

    mono: [radial("170% 150%", "50% 20%", "rgba(255,255,255,0.16)", "72%")].join(","),
};

/* ============================================================================
   🧠 Resolver (no dynamic Tailwind classes)
============================================================================ */

export function resolveIntent(input: IntentInput = {}): ResolvedIntent {
    /* ============================================================================
       🧾 Input normalization
    ============================================================================ */

    const mode = input.mode ?? "dark"; // ✅ fallback: dark
    const intent = input.intent ?? DEFAULT_INTENT;
    const variant = input.variant ?? DEFAULT_VARIANT;
    const intensity: Intensity = input.intensity ?? "medium";
    const disabled = Boolean(input.disabled);

    const toneRequested: ToneName = input.tone ?? DEFAULT_TONE;

    /* ============================================================================
       🎨 Tone key resolution
    ============================================================================ */

    const toneKey =
        intent === "toned"
            ? TONE_TO_COLOR_FAMILY[toneRequested]
            : intent === "glowed"
              ? null
              : INTENT_TO_SEMANTIC_COLOR[intent as Exclude<IntentName, "toned" | "glowed">];

    /* ============================================================================
       ✨ Glow selection rules
    ============================================================================ */

    let glowKey: GlowKey | null = null;

    if (intent === "glowed") {
        if (typeof input.glow === "string") {
            const key = input.glow as GlowName;
            glowKey =
                key === "aurora" ||
                key === "ember" ||
                key === "cosmic" ||
                key === "mythic" ||
                key === "royal" ||
                key === "mono"
                    ? key
                    : "aurora";
        } else {
            glowKey = "aurora";
        }
    } else if (input.glow === true && intent !== "toned") {
        glowKey = DEFAULT_GLOW_BY_INTENT[intent as Exclude<IntentName, "toned" | "glowed">];
    }

    const glowBackground = glowKey ? (GLOW_BACKGROUND[glowKey] ?? null) : null;

    /* ============================================================================
       🧪 Base alpha curves (bg/ring)
    ============================================================================ */

    const bgOpacity = intensityToAlpha(intensity, { min: 0.1, max: 0.22 });
    const ringOpacity = intensityToAlpha(intensity, { min: 0.14, max: 0.28 });
    const ringOpacityBoosted = boostRingOpacity(ringOpacity, intent);

    /* ============================================================================
       🧱 CSS variables (hybrid C)
    ============================================================================ */

    const style: Record<string, string> = {};

    /* ============================================================================
       🎯 Color variables
    ============================================================================ */

    if (!toneKey) {
        // glowed: neutral surface, tinted text/ring by aesthetic glow
        const gTone = glowKey ? glowToTone(glowKey as GlowName) : "emerald";
        const gFamily = TONE_TO_COLOR_FAMILY[gTone];

        const textStep = pickTextStep(mode, intent);

        style["--intent-bg"] = "rgb(var(--ids-paper))";
        style["--intent-bg-opacity"] = "0"; // ✅ no fill for glowed

        style["--intent-text"] = tailwindColorVar(gFamily, textStep);

        style["--intent-ring"] = tailwindColorVar(gFamily, 600);
        style["--intent-ring-opacity"] = String(ringOpacityBoosted);
    } else if (toneKey === "themed") {
        // themed: keep bg as base theme, but brighten ring/text like other semantic intents
        const base = getDefaultThemeRgb();

        // “semantic-like” tinting:
        // - dark: text much lighter (like step 200), ring slightly lighter than base
        // - light: text darker (like step 800), ring slightly darker than base
        const textRgb = mode === "dark" ? lighten(base, 0.72) : darken(base, 0.62);
        const ringRgb = mode === "dark" ? lighten(base, 0.22) : darken(base, 0.18);

        style["--intent-bg"] = getDefaultThemeCssRgb(); // base theme rgb(...)
        style["--intent-text"] = rgbToCssRgb(textRgb);
        style["--intent-ring"] = rgbToCssRgb(ringRgb);

        style["--intent-bg-opacity"] = String(bgOpacity);
        style["--intent-ring-opacity"] = String(ringOpacityBoosted);
    } else if (toneKey === "ink") {
        style["--intent-bg"] = "0 0% 0%";
        style["--intent-text"] = "0 0% 100%";
        style["--intent-ring"] = "0 0% 100%";
        style["--intent-bg-opacity"] = String(1);
        style["--intent-ring-opacity"] = String(0.22);
    } else if (
        toneKey === "informed" ||
        toneKey === "empowered" ||
        toneKey === "warned" ||
        toneKey === "threatened" ||
        toneKey === "themed"
    ) {
        const twFamily = SEMANTIC_TO_TW_FAMILY[toneKey];
        const textStep = pickTextStep(mode, intent);

        style["--intent-bg"] = `rgb(var(--ids-${toneKey}))`;
        style["--intent-ring"] = `rgb(var(--ids-${toneKey}))`;

        // ✅ dark: 200, light: 800
        style["--intent-text"] = tailwindColorVar(twFamily, textStep);

        style["--intent-bg-opacity"] = String(bgOpacity);
        style["--intent-ring-opacity"] = String(ringOpacityBoosted);
    } else {
        // toned: palette-driven
        const textStep = pickTextStep(mode, intent);
        const ringStep = pickRingStep(intent);

        style["--intent-bg"] = tailwindColorVar(toneKey, 500);
        style["--intent-text"] = tailwindColorVar(toneKey, textStep);
        style["--intent-ring"] = tailwindColorVar(toneKey, ringStep);

        style["--intent-bg-opacity"] = String(bgOpacity);
        style["--intent-ring-opacity"] = String(ringOpacityBoosted);
    }

    // after you set --intent-ring (in any branch)
    if (style["--intent-ring"] && !style["--intent-border"]) {
        style["--intent-border"] = style["--intent-ring"];
    }

    /* ============================================================================
       🌟 Glow CSS vars (FINAL OPACITIES)
    ============================================================================ */

    if (glowBackground) {
        style["--intent-glow-bg"] = glowBackground;

        // Base opacities
        let fill = clamp01(glowFillOpacity(intensity));
        let border = clamp01(glowBorderOpacity(intensity));

        // ✅ Variant gating (single source of truth)
        // - fill glow: flat/elevated only
        // - border glow: outlined/elevated only
        const allowFill = variant === "flat" || variant === "elevated";
        const allowBorder = variant === "outlined" || variant === "elevated";

        if (!allowFill) fill = 0;
        if (!allowBorder) border = 0;

        // ✅ glowed rule (si tu veux que glowed n’ait jamais de fill, garde ça)
        // Si au contraire tu veux un fill glow en glowed flat/elevated, supprime cette ligne.
        // if (intent === "glowed") fill = 0;

        style["--intent-glow-fill-opacity"] = String(fill);
        style["--intent-glow-border-opacity"] = String(border);

        style["--intent-glow-filter"] =
            intensity === "soft"
                ? "saturate(1.14) brightness(1.08)"
                : intensity === "medium"
                  ? "saturate(1.20) brightness(1.12)"
                  : "saturate(1.26) brightness(1.16)";
    } else {
        style["--intent-glow-bg"] = "";
        style["--intent-glow-fill-opacity"] = "0";
        style["--intent-glow-border-opacity"] = "0";
        style["--intent-glow-filter"] = "none";
    }

    /* ============================================================================
       🧩 Stable class hooks (no dynamic classes)
    ============================================================================ */

    const base = "intent-surface inline-flex items-center gap-2";
    const disabledCls = disabled ? "opacity-50 pointer-events-none select-none" : "";

    /**
     * ✅ NO DOUBLE BORDER RULE
     * When a glow exists (intent="glowed" OR glow={true} on a semantic intent),
     * the glow border layer is the single source of truth for the border.
     */
    const hasGlowBorderLayer = Boolean(glowBackground);
    const suppressRing = hasGlowBorderLayer;

    /**
     * ✅ NO FILL RULE (glowed)
     * glowed must not paint the surface fill.
     */
    const suppressSurfaceFill = intent === "glowed";

    const surface = suppressSurfaceFill ? "" : buildSurface(variant);
    const border = suppressRing ? "" : buildBorder(variant);
    const text = "intent-text";
    const ring = buildRing(variant);
    const shadow = buildShadow(variant);

    const glow = glowBackground ? "has-intent-glow" : "";

    return {
        mode,
        intent,
        variant,
        intensity,

        toneEffective: toneKey,

        glowKey,
        glowBackground,

        style,

        classes: {
            base,
            surface,
            border,
            text,
            ring,
            shadow,
            glow,
            disabled: disabledCls,
        },
    };
}

/* ============================================================================
   🧱 Class recipes (stable hooks)
============================================================================ */

function buildSurface(variant: VariantName): string {
    if (variant === "outlined") return "";
    if (variant === "ghost") return "";
    return "intent-bg";
}

function buildBorder(variant: VariantName): string {
    if (variant === "outlined") return "intent-ring";
    if (variant === "elevated") return "intent-ring";
    return "";
}

function buildRing(_variant: VariantName): string {
    return "";
}

function buildShadow(variant: VariantName): string {
    return variant === "elevated" ? "intent-shadow-soft" : "";
}

/* ============================================================================
   🧷 Ergonomic helpers
============================================================================ */

export function composeIntentClassName(resolved: ResolvedIntent, extraClassName?: string): string {
    return [
        resolved.classes.base,
        resolved.classes.surface,
        resolved.classes.border,
        resolved.classes.text,
        resolved.classes.ring,
        resolved.classes.shadow,
        resolved.classes.glow,
        resolved.classes.disabled,
        extraClassName,
    ]
        .filter(Boolean)
        .join(" ");
}

export function getIntentSurfaceProps(
    resolved: ResolvedIntent,
    extraClassName?: string
): IntentSurfaceResolvedProps {
    const className = composeIntentClassName(resolved, extraClassName);

    // ✅ Single source of truth: resolver writes --intent-glow-bg already.
    const style = resolved.style ? ({ ...(resolved.style as any) } as any) : undefined;

    return style ? { className, style } : { className };
}

export function composeIntentControlClassName(resolved: ResolvedIntent, extraClassName?: string) {
    return [
        // ✅ no base here (no inline-flex / gap)
        resolved.classes.surface,
        resolved.classes.border,
        resolved.classes.text,
        resolved.classes.shadow,
        resolved.classes.glow,
        resolved.classes.disabled,
        extraClassName,
    ]
        .filter(Boolean)
        .join(" ");
}

export function getIntentControlProps(
    resolved: ResolvedIntent,
    extraClassName?: string
): IntentSurfaceResolvedProps {
    const className = composeIntentControlClassName(resolved, extraClassName);

    const style = resolved.style
        ? ({
              ...(resolved.style as any),
              ...(resolved.glowBackground ? { "--intent-glow": resolved.glowBackground } : {}),
          } as any)
        : resolved.glowBackground
          ? ({ "--intent-glow": resolved.glowBackground } as any)
          : undefined;

    return style ? { className, style } : { className };
}

// src/lib/intent/resolve.ts

export function getIntentLayoutProps(
    resolved: ResolvedIntent,
    extraClassName?: string
): IntentSurfaceResolvedProps {
    const className = extraClassName ?? "";

    // Layout: we want only CSS vars, no visual classes like intent-bg / intent-ring
    const style = resolved.style ? ({ ...(resolved.style as any) } as any) : undefined;

    return style ? { className, style } : { className };
}

/* ============================================================================
   ⚠️ Resolver + warnings (DX)
============================================================================ */

export function resolveIntentWithWarnings(input: IntentInput = {}): ResolvedIntentWithWarnings {
    const resolved = resolveIntent(input);

    const warnings: IntentWarning[] = [];

    if (input.tone && input.intent !== "toned") {
        warnings.push({
            code: "tone_ignored",
            message: `tone="${input.tone}" is ignored unless intent="toned".`,
        });
    }

    if (typeof input.glow === "string" && input.intent !== "glowed") {
        warnings.push({
            code: "glow_string_ignored",
            message: `glow="${input.glow}" is ignored unless intent="glowed". Use glow={true} for implicit intent glow.`,
        });
    }

    if (input.intent === "toned" && input.glow === true) {
        warnings.push({
            code: "glow_disabled_for_toned",
            message: `glow={true} is ignored for intent="toned" (canonical rule).`,
        });
    }

    if (input.intent === "glowed" && typeof input.glow === "string") {
        const key = input.glow;
        const isIntentGlow =
            key === "info" ||
            key === "empower" ||
            key === "warn" ||
            key === "threat" ||
            key === "theme";

        if (isIntentGlow) {
            warnings.push({
                code: "glow_intent_key_forbidden",
                message: `glow="${key}" is an intent glow key and is not allowed when intent="glowed". Use an aesthetic glow (aurora/ember/cosmic/mythic/royal/mono).`,
            });
        }
    }

    return {
        ...resolved,
        warnings,
    };
}
