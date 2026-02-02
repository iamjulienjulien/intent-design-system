// src/lib/colors/themeHelpers.ts
// themeHelpers
// - Helpers for theme-driven color variables
// - Works with DEFAULT_THEME_COLOR from src/lib/intent/mapping.ts
// - Provides glow rgba pair (2 radials) like other intents

import { DEFAULT_THEME_COLOR } from "../intent/mapping";

/* ============================================================================
   🧰 TYPES
============================================================================ */

export type Rgb = { r: number; g: number; b: number };

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function clamp01(n: number) {
    return Math.max(0, Math.min(1, n));
}

function clamp255(n: number) {
    return Math.max(0, Math.min(255, Math.round(n)));
}

function isFiniteNumber(n: unknown): n is number {
    return typeof n === "number" && Number.isFinite(n);
}

/**
 * Parses a CSS-ish color string into RGB.
 * Accepts:
 * - "59 130 246"  (Tailwind token style)
 * - "59,130,246"
 * - "rgb(59, 130, 246)"
 * - "#3b82f6" (6 hex)
 */
export function parseToRgb(input: string): Rgb | null {
    const v = (input ?? "").trim();

    // hex #rrggbb
    if (/^#?[0-9a-fA-F]{6}$/.test(v)) {
        const hex = v.startsWith("#") ? v.slice(1) : v;
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return { r, g, b };
    }

    // rgb(...)
    const rgbFn = v.match(
        /rgb\s*\(\s*([0-9]{1,3})\s*[, ]\s*([0-9]{1,3})\s*[, ]\s*([0-9]{1,3})\s*\)/i
    );
    if (rgbFn) {
        const r = Number(rgbFn[1]);
        const g = Number(rgbFn[2]);
        const b = Number(rgbFn[3]);
        if ([r, g, b].every((n) => isFiniteNumber(n) && n >= 0 && n <= 255)) return { r, g, b };
        return null;
    }

    // "r g b" or "r, g, b"
    const parts = v.split(/[\s,]+/).filter(Boolean);
    if (parts.length >= 3) {
        const r = Number(parts[0]);
        const g = Number(parts[1]);
        const b = Number(parts[2]);
        if ([r, g, b].every((n) => isFiniteNumber(n) && n >= 0 && n <= 255)) return { r, g, b };
    }

    return null;
}

export function rgbToString(rgb: Rgb): string {
    return `${clamp255(rgb.r)} ${clamp255(rgb.g)} ${clamp255(rgb.b)}`;
}

export function rgbToCssRgb(rgb: Rgb): string {
    return `rgb(${clamp255(rgb.r)}, ${clamp255(rgb.g)}, ${clamp255(rgb.b)})`;
}

export function rgba(rgb: Rgb, alpha: number): string {
    const a = clamp01(alpha);
    return `rgba(${clamp255(rgb.r)},${clamp255(rgb.g)},${clamp255(rgb.b)},${a})`;
}

/**
 * Mixes two RGB colors in sRGB (simple linear mix).
 * amount=0 -> a, amount=1 -> b
 */
export function mixRgb(a: Rgb, b: Rgb, amount: number): Rgb {
    const t = clamp01(amount);
    const r = a.r + (b.r - a.r) * t;
    const g = a.g + (b.g - a.g) * t;
    const bch = a.b + (b.b - a.b) * t;
    return { r: clamp255(r), g: clamp255(g), b: clamp255(bch) };
}

export function lighten(rgb: Rgb, amount: number): Rgb {
    return mixRgb(rgb, { r: 255, g: 255, b: 255 }, amount);
}

export function darken(rgb: Rgb, amount: number): Rgb {
    return mixRgb(rgb, { r: 0, g: 0, b: 0 }, amount);
}

/* ============================================================================
   🎨 THEME BASE
============================================================================ */

/**
 * Returns the base theme rgb from DEFAULT_THEME_COLOR.
 * Fallback: ids-informed (blue-500) if parsing fails.
 */
export function getDefaultThemeRgb(): Rgb {
    const parsed = parseToRgb(DEFAULT_THEME_COLOR);
    if (parsed) return parsed;

    // fallback to --ids-informed: 59 130 246 (blue-500)
    return { r: 59, g: 130, b: 246 };
}

/**
 * Convenience: base theme token string "R G B"
 */
export function getDefaultThemeToken(): string {
    return rgbToString(getDefaultThemeRgb());
}

/* ============================================================================
   ✨ GLOW (2 RGBA COLORS)
============================================================================ */

/**
 * Matches the “two radials” pattern used by other intents.
 * You asked specifically for two RGBA colors for glow background.
 *
 * Default intent-like recipe:
 * - primary: theme color, stronger alpha
 * - secondary: slightly cooled/desaturated variant, slightly lower alpha
 *
 * You can tune the alphas and mix amounts if needed.
 */
export function getThemeGlowRgbaPair(opts?: {
    primaryAlpha?: number; // default 0.28 (like empower/warn/threat first layer)
    secondaryAlpha?: number; // default 0.22 (like second layer)
    secondaryMixTo?: "slate" | "white" | "black"; // default "slate"
    secondaryMixAmount?: number; // default 0.38
}): [string, string] {
    const {
        primaryAlpha = 0.28,
        secondaryAlpha = 0.22,
        secondaryMixTo = "slate",
        secondaryMixAmount = 0.38,
    } = opts ?? {};

    const base = getDefaultThemeRgb();

    // "slate" anchor approximates Tailwind slate-400-ish used by informed's second layer vibe
    const slateAnchor: Rgb = { r: 148, g: 163, b: 184 };
    const mixTarget =
        secondaryMixTo === "white"
            ? ({ r: 255, g: 255, b: 255 } as Rgb)
            : secondaryMixTo === "black"
              ? ({ r: 0, g: 0, b: 0 } as Rgb)
              : slateAnchor;

    const secondary = mixRgb(base, mixTarget, secondaryMixAmount);

    return [rgba(base, primaryAlpha), rgba(secondary, secondaryAlpha)];
}

/**
 * If you want the final CSS background string like your mapping does (two radials joined),
 * you can use this helper.
 *
 * It assumes you already have a `radial()` util elsewhere, so we just generate stops.
 */
export function getThemeGlowBackgroundCss(
    radial: (size: string, at: string, color: string, stop: string) => string,
    opts?: {
        primaryRgba?: string;
        secondaryRgba?: string;
        stop1?: string; // default "74%"
        stop2?: string; // default "72%"
        size1?: string; // default "190% 150%"
        size2?: string; // default "165% 150%"
        at1?: string; // default "15% 20%"
        at2?: string; // default "85% 30%"
    }
): string {
    const [c1, c2] = getThemeGlowRgbaPair();
    const {
        primaryRgba = c1,
        secondaryRgba = c2,
        stop1 = "74%",
        stop2 = "72%",
        size1 = "190% 150%",
        size2 = "165% 150%",
        at1 = "15% 20%",
        at2 = "85% 30%",
    } = opts ?? {};

    return [radial(size1, at1, primaryRgba, stop1), radial(size2, at2, secondaryRgba, stop2)].join(
        ","
    );
}

/* ============================================================================
   🧩 CSS VAR HELPERS (OPTIONAL)
============================================================================ */

/**
 * Returns a record of CSS variables you can spread on a style object.
 * Useful if you want to set theme tokens at runtime.
 */
export function getThemeCssVars(opts?: {
    themeColor?: string; // accept same formats as parseToRgb
}): Record<string, string> {
    const themeRgb = parseToRgb(opts?.themeColor ?? DEFAULT_THEME_COLOR) ?? getDefaultThemeRgb();

    const [glow1, glow2] = getThemeGlowRgbaPair();

    return {
        "--ids-theme": rgbToString(themeRgb),
        "--ids-theme-rgb": rgbToCssRgb(themeRgb),
        "--ids-theme-glow-1": glow1,
        "--ids-theme-glow-2": glow2,
    };
}

/** Convenience: returns "rgb(r,g,b)" for DEFAULT_THEME_COLOR */
export function getDefaultThemeCssRgb(): string {
    return rgbToCssRgb(getDefaultThemeRgb());
}
