/* ============================================================================
   src/core/resolver.ts
   Intent Design System – Resolve logic
   - Outputs stable class hooks + CSS variables
   - Uses public system constants/types and internal engine config
============================================================================ */

import type {
    Glow,
    Intent,
    IntentInput,
    IntentSurfaceResolvedProps,
    IntentWarning,
    Mode,
    ResolvedIntent,
    ResolvedIntentWithWarnings,
    Tone,
    ToneStep,
    Variant,
    Intensity,
} from "../system/types";

import {
    DEFAULT_INTENSITY,
    DEFAULT_INTENT,
    DEFAULT_MODE,
    DEFAULT_TONE,
    DEFAULT_TONE_STEP,
    DEFAULT_VARIANT,
    GLOW,
    TONE,
    TONE_STEP_VALUES,
    INTENT,
    AESTHETIC_GLOW_VALUES,
    INTENT_GLOW_VALUES,
} from "../system/constants";

import { Theme } from "../api/Theme";
import {
    BG_ALPHA_RANGE_BY_MODE,
    FALLBACK_TONE_STEP,
    GLOW_BORDER_OPACITY_BY_MODE,
    GLOW_FILL_OPACITY_BY_MODE,
    GLOW_FILTER_BY_MODE,
    GLOW_TAIL_ALPHA,
    GLOWED_LIGHT_GLOW_BORDER_FACTOR,
    GLOWED_LIGHT_GLOW_FILL_FACTOR,
    GLOWED_RING_BASE_STEP,
    GLOWED_TEXT_STEP_BASE_BY_MODE,
    INTENSITY_POSITION,
    RING_ALPHA_RANGE_BY_MODE,
    RING_BOOST_BY_MODE,
    RING_STEP_BASE_DEFAULT,
    RING_STEP_BASE_GLOWED,
    TEXT_STEP_BASE_BY_MODE,
} from "./config";

import {
    getGlowMeta,
    getToneMeta,
    resolveGlowKey,
    isIntentGlow,
    isAestheticGlow,
    aestheticGlowToTone,
    semanticIntentToTone,
} from "../system/helpers";
import { clamp01, onlyDefinedRecord, roundAlpha } from "../helpers/core";
import { tailwindColorVar, radial, rgbToCssRgb } from "../helpers/colors";
import { Defaults } from "@/api";

/* ============================================================================
   Low-level helpers
============================================================================ */

function intensityToAlpha(intensity: Intensity, range: { min: number; max: number }) {
    const t = clamp01(INTENSITY_POSITION[intensity]);
    return roundAlpha(range.min + (range.max - range.min) * t);
}

/* ============================================================================
   Tone step helpers
============================================================================ */

function nearestToneStep(step: number): number {
    const scale = TONE_STEP_VALUES;
    const min = scale[0] ?? FALLBACK_TONE_STEP;
    const max = scale[scale.length - 1] ?? FALLBACK_TONE_STEP;
    const clamped = Math.max(min, Math.min(max, step));

    let best = min as ToneStep;
    let bestDist = Math.abs(clamped - best);

    for (const s of scale) {
        const distance = Math.abs(clamped - s);
        if (distance < bestDist) {
            best = s;
            bestDist = distance;
        }
    }

    return best;
}

function applyToneStepDelta(baseStep: number, delta: number): number {
    return nearestToneStep(baseStep + delta);
}

function pickTextStep(mode: Mode, intent: Intent, delta: number): number {
    const base =
        intent === "glowed" ? GLOWED_TEXT_STEP_BASE_BY_MODE[mode] : TEXT_STEP_BASE_BY_MODE[mode];
    return applyToneStepDelta(base, delta);
}

function pickRingStep(intent: Intent, delta: number): number {
    const base = intent === "glowed" ? RING_STEP_BASE_GLOWED : RING_STEP_BASE_DEFAULT;
    return applyToneStepDelta(base, delta);
}

function boostRingOpacity(ringOpacity: number, intent: Intent, mode: Mode): number {
    const preset =
        intent === "glowed" ? RING_BOOST_BY_MODE[mode].glowed : RING_BOOST_BY_MODE[mode].default;
    const boosted = Math.max(preset.min, ringOpacity * preset.factor);
    const clamped = typeof preset.max === "number" ? Math.min(preset.max, boosted) : boosted;
    return clamp01(roundAlpha(clamped));
}

/* ============================================================================
   Glow gradient helpers
============================================================================ */

function buildGlowBackground(mode: Mode, glowKey: Glow): string | null {
    const meta = getGlowMeta(glowKey);
    if (!meta) return null;

    const stops = mode === "light" ? meta.gradient.light : meta.gradient.dark;

    return stops
        .map((stop) => radial(stop.size, stop.at, stop.color, stop.stop, GLOW_TAIL_ALPHA))
        .join(",");
}

/* ============================================================================
   Themed color helpers
============================================================================ */

// function rgbToCssRgb(rgb: { r: number; g: number; b: number }) {
//     return `${rgb.r} ${rgb.g} ${rgb.b}`;
// }

function lighten(rgb: { r: number; g: number; b: number }, amount: number) {
    const mix = (channel: number) => Math.round(channel + (255 - channel) * clamp01(amount));
    return {
        r: mix(rgb.r),
        g: mix(rgb.g),
        b: mix(rgb.b),
    };
}

function darken(rgb: { r: number; g: number; b: number }, amount: number) {
    const mix = (channel: number) => Math.round(channel * (1 - clamp01(amount)));
    return {
        r: mix(rgb.r),
        g: mix(rgb.g),
        b: mix(rgb.b),
    };
}

function resolveThemedColors(
    base: { r: number; g: number; b: number },
    mode: Mode,
    toneStepDelta: number
) {
    const t = clamp01(Math.abs(toneStepDelta) / 500);
    const direction = toneStepDelta >= 0 ? 1 : -1;

    const textAdjustment = -direction * t * 0.14;
    const ringAdjustment = -direction * t * 0.08;

    const textLiftDark = clamp01(0.72 + textAdjustment);
    const textLiftLight = clamp01(0.62 + textAdjustment);

    const ringLiftDark = clamp01(0.22 + ringAdjustment);
    const ringLiftLight = clamp01(0.18 + ringAdjustment);

    const textRgb = mode === "dark" ? lighten(base, textLiftDark) : darken(base, textLiftLight);
    const ringRgb = mode === "dark" ? lighten(base, ringLiftDark) : darken(base, ringLiftLight);

    return {
        bg: rgbToCssRgb(base),
        text: rgbToCssRgb(textRgb),
        ring: rgbToCssRgb(ringRgb),
    };
}

/* ============================================================================
   Class recipes
============================================================================ */

function buildSurface(variant: Variant): string {
    if (variant === "outlined") return "";
    if (variant === "ghost") return "";
    return "intent-bg";
}

function buildBorder(variant: Variant): string {
    if (variant === "outlined") return "intent-ring";
    if (variant === "elevated") return "intent-ring";
    return "";
}

function buildRing(_variant: Variant): string {
    return "";
}

function buildShadow(variant: Variant, intent: Intent): string {
    return variant === "elevated" && intent !== "glowed" ? "intent-shadow-soft" : "";
}

/* ============================================================================
   Resolver
============================================================================ */

export function resolveIntent(input: IntentInput = {}): ResolvedIntent {
    const mode: Mode = input.mode ?? Defaults.getMode();
    const intent: Intent = input.intent ?? DEFAULT_INTENT;
    const variant: Variant = input.variant ?? DEFAULT_VARIANT;
    const intensity: Intensity = input.intensity ?? DEFAULT_INTENSITY;
    const disabled = Boolean(input.disabled);

    const toneRequested: Tone = input.tone ?? DEFAULT_TONE;
    const toneStep: ToneStep = input.toneStep ?? DEFAULT_TONE_STEP;
    const toneStepDelta = Number(toneStep) - 500;

    const glowKey = resolveGlowKey(input, intent);
    const glowBackground = glowKey ? buildGlowBackground(mode, glowKey) : null;

    const bgOpacity = intensityToAlpha(intensity, BG_ALPHA_RANGE_BY_MODE[mode]);
    const ringOpacity = intensityToAlpha(intensity, RING_ALPHA_RANGE_BY_MODE[mode]);
    const ringOpacityBoosted = boostRingOpacity(ringOpacity, intent, mode);

    const style: Record<string, string> = {};

    if (intent === "glowed") {
        const glowTone =
            glowKey && isAestheticGlow(glowKey) ? aestheticGlowToTone(glowKey) : DEFAULT_TONE;
        const glowToneMeta = getToneMeta(glowTone);
        const glowFamily = glowToneMeta?.color.name ?? DEFAULT_TONE;
        const textStep = pickTextStep(mode, intent, toneStepDelta);

        style["--intent-bg"] = "rgb(var(--ids-paper))";
        style["--intent-bg-opacity"] = "0";
        style["--intent-text"] = tailwindColorVar(glowFamily, textStep);
        style["--intent-ring"] = tailwindColorVar(
            glowFamily,
            applyToneStepDelta(GLOWED_RING_BASE_STEP, toneStepDelta)
        );
        style["--intent-ring-opacity"] = String(ringOpacityBoosted);
    } else if (intent === "themed") {
        const toneMeta = getToneMeta(toneRequested);
        const themedColors = resolveThemedColors(Theme.getRgb(), mode, toneStepDelta);
        // console.log("themedcolors", themedColors);
        style["--intent-bg"] = themedColors.bg;
        style["--intent-text"] = themedColors.text;
        style["--intent-ring"] = themedColors.ring;
        style["--intent-bg-opacity"] = String(bgOpacity);
        style["--intent-ring-opacity"] = String(ringOpacityBoosted);
    } else if (intent === "toned") {
        const toneMeta = getToneMeta(toneRequested);

        if (toneRequested === "theme") {
            const themedColors = resolveThemedColors(Theme.getRgb(), mode, toneStepDelta);
            // console.log("themedcolors", themedColors);
            style["--intent-bg"] = themedColors.bg;
            style["--intent-text"] = themedColors.text;
            style["--intent-ring"] = themedColors.ring;
            style["--intent-bg-opacity"] = String(bgOpacity);
            style["--intent-ring-opacity"] = String(ringOpacityBoosted);
        } else if (toneRequested === "black") {
            style["--intent-bg"] = "0 0 0";
            style["--intent-text"] = "255 255 255";
            style["--intent-ring"] = "255 255 255";
            style["--intent-bg-opacity"] = "1";
            style["--intent-ring-opacity"] = "0.22";
        } else {
            const family = toneMeta?.color.name ?? toneRequested;
            const bgStep = applyToneStepDelta(500, toneStepDelta);
            const ringStep = pickRingStep(intent, toneStepDelta);
            const textStep = pickTextStep(mode, intent, toneStepDelta);

            style["--intent-bg"] = tailwindColorVar(family, bgStep);
            style["--intent-text"] = tailwindColorVar(family, textStep);
            style["--intent-ring"] = tailwindColorVar(family, ringStep);
            style["--intent-bg-opacity"] = String(bgOpacity);
            style["--intent-ring-opacity"] = String(ringOpacityBoosted);
        }
    } else {
        const semanticTone = semanticIntentToTone(intent);
        const toneMeta = getToneMeta(semanticTone);
        const family = toneMeta?.color.name ?? semanticTone;

        const bgStep = applyToneStepDelta(500, toneStepDelta);
        const ringStep = pickRingStep(intent, toneStepDelta);
        const textStep = pickTextStep(mode, intent, toneStepDelta);

        style["--intent-bg"] = tailwindColorVar(family, bgStep);
        style["--intent-ring"] = tailwindColorVar(family, ringStep);
        style["--intent-text"] = tailwindColorVar(family, textStep);
        style["--intent-bg-opacity"] = String(bgOpacity);
        style["--intent-ring-opacity"] = String(ringOpacityBoosted);
    }

    if (style["--intent-ring"] && !style["--intent-border"]) {
        style["--intent-border"] = style["--intent-ring"];
    }

    if (glowBackground) {
        let glowFillOpacityValue = clamp01(GLOW_FILL_OPACITY_BY_MODE[mode][intensity]);
        let glowBorderOpacityValue = clamp01(GLOW_BORDER_OPACITY_BY_MODE[mode][intensity]);

        const allowGlowFill = variant === "flat" || variant === "elevated";
        const allowGlowBorder = variant === "outlined" || variant === "elevated";

        if (!allowGlowFill) glowFillOpacityValue = 0;
        if (!allowGlowBorder) glowBorderOpacityValue = 0;

        if (mode === "light" && intent === "glowed") {
            glowFillOpacityValue = clamp01(glowFillOpacityValue * GLOWED_LIGHT_GLOW_FILL_FACTOR);
            glowBorderOpacityValue = clamp01(
                glowBorderOpacityValue * GLOWED_LIGHT_GLOW_BORDER_FACTOR
            );
        }

        style["--intent-glow-bg"] = glowBackground;
        style["--intent-glow-fill-opacity"] = String(roundAlpha(glowFillOpacityValue));
        style["--intent-glow-border-opacity"] = String(roundAlpha(glowBorderOpacityValue));
        style["--intent-glow-filter"] = GLOW_FILTER_BY_MODE[mode][intensity];
    } else {
        style["--intent-glow-bg"] = "";
        style["--intent-glow-fill-opacity"] = "0";
        style["--intent-glow-border-opacity"] = "0";
        style["--intent-glow-filter"] = "none";
    }

    const base = "intent-surface inline-flex items-center gap-2";
    const disabledClassName = disabled ? "opacity-50 pointer-events-none select-none" : "";

    const hasGlowBorderLayer = Boolean(glowBackground);
    const suppressRing = hasGlowBorderLayer;
    const suppressSurfaceFill = intent === "glowed";

    const surface = suppressSurfaceFill ? "" : buildSurface(variant);
    const border = suppressRing ? "" : buildBorder(variant);
    const text = "intent-text";
    const ring = buildRing(variant);
    const shadow = buildShadow(variant, intent);
    const glow = glowBackground ? "has-intent-glow" : "";

    return {
        mode,
        intent,
        variant,
        intensity,
        toneStep,
        toneEffective:
            intent === "toned"
                ? toneRequested
                : intent === "glowed"
                  ? glowKey
                  : semanticIntentToTone(intent),
        glowKey,
        glowBackground,
        style: onlyDefinedRecord(style),
        classes: {
            base,
            surface,
            border,
            text,
            ring,
            shadow,
            glow,
            disabled: disabledClassName,
        },
    };
}

/* ============================================================================
   Ergonomic helpers
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
    const style = resolved.style ? ({ ...(resolved.style as any) } as any) : undefined;
    return style ? { className, style } : { className };
}

export function composeIntentControlClassName(resolved: ResolvedIntent, extraClassName?: string) {
    return [
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

    const style = resolved.style ? ({ ...(resolved.style as any) } as any) : undefined;

    return style ? { className, style } : { className };
}

export function getIntentLayoutProps(
    resolved: ResolvedIntent,
    extraClassName?: string
): IntentSurfaceResolvedProps {
    const className = extraClassName ?? "";
    const style = resolved.style ? ({ ...(resolved.style as any) } as any) : undefined;
    return style ? { className, style } : { className };
}

/* ============================================================================
   Warnings (DX)
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
            message: `glow={true} is ignored for intent="toned".`,
        });
    }

    if (input.intent === "glowed" && typeof input.glow === "string" && isIntentGlow(input.glow)) {
        warnings.push({
            code: "glow_intent_key_forbidden",
            message: `glow="${input.glow}" is an intent glow key and is not allowed when intent="glowed". Use an aesthetic glow.`,
        });
    }

    return {
        ...resolved,
        warnings,
    };
}
