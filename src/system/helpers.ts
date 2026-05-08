/* ============================================================================
   src/system/helpers.ts
   Intent Design System – System helpers
   - Meta lookups
   - Intent / glow type guards
   - Canonical semantic/aesthetic mapping helpers
============================================================================ */

import {
    AESTHETIC_GLOW_VALUES,
    DEFAULT_GLOW,
    DEFAULT_MODE,
    DEFAULT_TONE,
    GLOW,
    INTENT,
    INTENT_GLOW_VALUES,
    MODE,
    MODE_VALUES,
    TONE,
    type MetaOption,
} from "./constants";

import type { Glow, Intent, IntentInput, Mode, Tone } from "./types";

/* ============================================================================
   Meta lookups
============================================================================ */

export function getIntentMeta(intent: Intent) {
    return INTENT.find((item) => item.value === intent) ?? null;
}

export function getToneMeta(tone: Tone) {
    return TONE.find((item) => item.value === tone) ?? null;
}

export function getGlowMeta(glow: Glow) {
    return GLOW.find((item) => item.value === glow) ?? null;
}

export function getModeMeta(mode: Mode) {
    return MODE.find((item) => item.value === mode) ?? null;
}

export type OptionRow<TValue extends string | number = string> = {
    value: TValue;
    label: string;
    emoji?: string;
};

export function getMetaOptions<const T extends ReadonlyArray<MetaOption<string | number>>>(
    meta: T
): Array<OptionRow<T[number]["value"]>> {
    return meta.map((x) => ({
        value: x.value as T[number]["value"],
        label: x.label,
        ...(x.emoji ? { emoji: x.emoji } : {}),
    }));
}

export function getMetaLabelByValue<const T extends ReadonlyArray<MetaOption<string>>>(
    meta: T,
    value: string | null | undefined,
    withEmoji: boolean
): string | null {
    if (!value) return null;
    const item = (meta as ReadonlyArray<MetaOption<string>>).find((x) => x.value === value) as any;
    if (!item) return null;
    if (withEmoji) return `${item.emoji} ${item.label}`;
    return item.label;
}

/* ============================================================================
   Default theme tone helpers
============================================================================ */

export function getDefaultThemeColor(type: "name"): string;
export function getDefaultThemeColor(type: "hex"): string;
export function getDefaultThemeColor(type: "rgb"): string;
export function getDefaultThemeColor(type: "name" | "hex" | "rgb") {
    const themeMeta = getToneMeta("theme");

    if (!themeMeta) {
        if (type === "name") return "themed";
        if (type === "hex") return "#a855f7";
        return "168 85 247";
    }

    return themeMeta.color[type];
}

/* ============================================================================
   Type guards
============================================================================ */

export function isMode(mode: string): mode is Mode {
    return (MODE_VALUES as readonly string[]).includes(mode);
}

export function isAestheticGlow(
    glow: string
): glow is Extract<Glow, (typeof AESTHETIC_GLOW_VALUES)[number]> {
    return (AESTHETIC_GLOW_VALUES as readonly string[]).includes(glow);
}

export function isIntentGlow(
    glow: string
): glow is Extract<Glow, (typeof INTENT_GLOW_VALUES)[number]> {
    return (INTENT_GLOW_VALUES as readonly string[]).includes(glow);
}

/* ============================================================================
   Canonical mappings from meta registry
============================================================================ */

export function aestheticGlowToTone(
    glow: Extract<Glow, (typeof AESTHETIC_GLOW_VALUES)[number]>
): Tone {
    const meta = getGlowMeta(glow);

    if (!meta || meta.category !== "aesthetic") {
        return DEFAULT_TONE;
    }

    return meta.tone;
}

export function semanticIntentToTone(
    intent: Extract<Intent, "informed" | "empowered" | "warned" | "threatened" | "themed">
): Tone {
    const meta = getIntentMeta(intent);

    if (!meta || meta.category !== "semantic") {
        return DEFAULT_TONE;
    }

    return meta.tone;
}

/* ============================================================================
   Glow resolution
============================================================================ */

export function resolveGlowKey(input: IntentInput, intent: Intent): Glow | null {
    if (intent === "glowed") {
        if (typeof input.glow === "string" && isAestheticGlow(input.glow)) {
            return input.glow;
        }

        return DEFAULT_GLOW;
    }

    if (input.glow === true && intent !== "toned") {
        const meta = getIntentMeta(intent);
        return meta?.category === "semantic" ? meta.glow : null;
    }

    return null;
}

/* ============================================================================
   Color helpers
============================================================================ */

export function normalizeMode(value?: string): Mode {
    return value && isMode(value) ? value : DEFAULT_MODE;
}

export function normalizeHexColor(input: string, fallback?: string) {
    const raw = String(input ?? "")
        .trim()
        .toLowerCase();

    if (/^#[0-9a-f]{3}$/i.test(raw)) {
        const r = raw[1];
        const g = raw[2];
        const b = raw[3];
        return `#${r}${r}${g}${g}${b}${b}`;
    }

    if (/^#[0-9a-f]{6}$/i.test(raw)) {
        return raw;
    }

    return fallback ?? getDefaultThemeColor("hex");
}
