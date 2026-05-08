/* ============================================================================
   src/helpers/colors.ts
   Intent Design System – Color helpers
   - Conversions: hex <-> rgb, hsl <-> rgb, css -> rgb
   - Utils: mix, withAlpha, luminance, contrast, readable text
   - Depends only on ./core
============================================================================ */

import {
    clamp,
    clamp01,
    parseNumberOrPercent,
    round,
    splitCssArgs,
    isFiniteNumber,
    clamp255,
} from "./core";

/* ============================================================================
   Types
============================================================================ */

export type Rgb = { r: number; g: number; b: number };
export type Rgba = { r: number; g: number; b: number; a: number };
export type Hsl = { h: number; s: number; l: number };
export type Hsla = { h: number; s: number; l: number; a: number };

export type ParsedColor =
    | { kind: "rgb"; value: Rgb }
    | { kind: "rgba"; value: Rgba }
    | { kind: "hsl"; value: Hsl }
    | { kind: "hsla"; value: Hsla }
    | { kind: "hex"; value: string };

/* ============================================================================
   HEX
============================================================================ */

/**
 * Normalize hex string to #rrggbb or #rrggbbaa
 * Accepts: "#RGB", "#RGBA", "#RRGGBB", "#RRGGBBAA", with or without "#"
 */
export function normalizeHex(hex: string): string | null {
    const raw = hex.trim().replace(/^#/, "");
    if (!/^[0-9a-fA-F]+$/.test(raw)) return null;

    if (raw.length === 3) {
        const r0 = raw.charAt(0);
        const g0 = raw.charAt(1);
        const b0 = raw.charAt(2);
        if (!r0 || !g0 || !b0) return null;

        return `#${r0}${r0}${g0}${g0}${b0}${b0}`.toLowerCase();
    }

    if (raw.length === 4) {
        const r0 = raw.charAt(0);
        const g0 = raw.charAt(1);
        const b0 = raw.charAt(2);
        const a0 = raw.charAt(3);
        if (!r0 || !g0 || !b0 || !a0) return null;

        return `#${r0}${r0}${g0}${g0}${b0}${b0}${a0}${a0}`.toLowerCase();
    }

    if (raw.length === 6) return `#${raw}`.toLowerCase();
    if (raw.length === 8) return `#${raw}`.toLowerCase();

    return null;
}

/** #rrggbb or #rrggbbaa -> rgba */
export function hexToRgba(hex: string): Rgba | null {
    const h = normalizeHex(hex);
    if (!h) return null;

    const raw = h.replace("#", "");
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);

    if (raw.length === 8) {
        const a = parseInt(raw.slice(6, 8), 16) / 255;
        return { r, g, b, a: round(clamp01(a), 4) };
    }

    return { r, g, b, a: 1 };
}

/** #rrggbb -> rgb */
export function hexToRgb(hex: string): Rgb | null {
    const rgba = hexToRgba(hex);
    return rgba ? { r: rgba.r, g: rgba.g, b: rgba.b } : null;
}

/** rgb/rgba -> #rrggbb or #rrggbbaa */
export function rgbaToHex(rgba: Rgba, opts?: { withAlpha?: boolean }) {
    const r = clamp(Math.round(rgba.r), 0, 255);
    const g = clamp(Math.round(rgba.g), 0, 255);
    const b = clamp(Math.round(rgba.b), 0, 255);
    const a = clamp01(rgba.a);

    const to2 = (n: number) => n.toString(16).padStart(2, "0");
    const base = `#${to2(r)}${to2(g)}${to2(b)}`.toLowerCase();

    if (opts?.withAlpha) {
        const aa = Math.round(a * 255);
        return `${base}${to2(aa)}`.toLowerCase();
    }

    return base;
}

export function rgbToHex(rgb: Rgb) {
    return rgbaToHex({ ...rgb, a: 1 });
}

export function rgbToString(rgb: Rgb): string {
    return `${clamp255(rgb.r)} ${clamp255(rgb.g)} ${clamp255(rgb.b)}`;
}

/* ============================================================================
   RGB(A) <-> HSL(A)
============================================================================ */

export function rgbToHsl(rgb: Rgb): Hsl {
    const r = clamp(rgb.r, 0, 255) / 255;
    const g = clamp(rgb.g, 0, 255) / 255;
    const b = clamp(rgb.b, 0, 255) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (d !== 0) {
        s = d / (1 - Math.abs(2 * l - 1));

        switch (max) {
            case r:
                h = ((g - b) / d) % 6;
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }

        h *= 60;
        if (h < 0) h += 360;
    }

    return {
        h: round(h, 2),
        s: round(s * 100, 2),
        l: round(l * 100, 2),
    };
}

export function hslToRgb(hsl: Hsl): Rgb {
    const h = ((hsl.h % 360) + 360) % 360;
    const s = clamp(hsl.s, 0, 100) / 100;
    const l = clamp(hsl.l, 0, 100) / 100;

    if (s === 0) {
        const v = Math.round(l * 255);
        return { r: v, g: v, b: v };
    }

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let rp = 0;
    let gp = 0;
    let bp = 0;

    if (h < 60) {
        rp = c;
        gp = x;
    } else if (h < 120) {
        rp = x;
        gp = c;
    } else if (h < 180) {
        gp = c;
        bp = x;
    } else if (h < 240) {
        gp = x;
        bp = c;
    } else if (h < 300) {
        rp = x;
        bp = c;
    } else {
        rp = c;
        bp = x;
    }

    return {
        r: Math.round((rp + m) * 255),
        g: Math.round((gp + m) * 255),
        b: Math.round((bp + m) * 255),
    };
}

export function hslaToRgba(hsla: Hsla): Rgba {
    const rgb = hslToRgb(hsla);
    return { ...rgb, a: clamp01(hsla.a) };
}

export function rgbaToHsla(rgba: Rgba): Hsla {
    const hsl = rgbToHsl(rgba);
    return { ...hsl, a: round(clamp01(rgba.a), 4) };
}

/* ============================================================================
   CSS string parsing
============================================================================ */

export function parseCssColor(input: string): ParsedColor | null {
    const s = input.trim();

    if (s.startsWith("#")) {
        const h = normalizeHex(s);
        return h ? { kind: "hex", value: h } : null;
    }

    const m = s.match(/^(rgb|rgba|hsl|hsla)\((.*)\)$/i);
    if (!m) return null;

    const fnRaw = m[1];
    const body = m[2];

    if (!fnRaw || body === undefined) return null;

    const fn = fnRaw.toLowerCase();
    const parts = splitCssArgs(body);
    const slashIdx = parts.indexOf("/");
    const hasSlash = slashIdx >= 0;

    const main = hasSlash ? parts.slice(0, slashIdx) : parts;
    const alphaPart = hasSlash ? parts[slashIdx + 1] : parts[3];

    if ((fn === "rgb" || fn === "rgba") && main.length >= 3) {
        const [rS, gS, bS] = main;
        if (!rS || !gS || !bS) return null;

        const r0 = parseNumberOrPercent(rS);
        const g0 = parseNumberOrPercent(gS);
        const b0 = parseNumberOrPercent(bS);
        if (!r0 || !g0 || !b0) return null;

        const to255 = (p: { value: number; isPercent: boolean }) =>
            p.isPercent
                ? clamp(Math.round((p.value / 100) * 255), 0, 255)
                : clamp(Math.round(p.value), 0, 255);

        const r = to255(r0);
        const g = to255(g0);
        const b = to255(b0);

        let a = 1;
        if (fn === "rgba" || alphaPart !== undefined) {
            const a0 = parseNumberOrPercent(alphaPart ?? "1");
            if (!a0) return null;
            a = a0.isPercent ? clamp01(a0.value / 100) : clamp01(a0.value);
        }

        return a === 1
            ? { kind: "rgb", value: { r, g, b } }
            : { kind: "rgba", value: { r, g, b, a } };
    }

    if ((fn === "hsl" || fn === "hsla") && main.length >= 3) {
        const [hS, sS, lS] = main;
        if (!hS || !sS || !lS) return null;

        const h = Number(hS);
        const s0 = parseNumberOrPercent(sS);
        const l0 = parseNumberOrPercent(lS);
        if (!Number.isFinite(h) || !s0 || !l0) return null;
        if (!s0.isPercent || !l0.isPercent) return null;

        let a = 1;
        if (fn === "hsla" || alphaPart !== undefined) {
            const a0 = parseNumberOrPercent(alphaPart ?? "1");
            if (!a0) return null;
            a = a0.isPercent ? clamp01(a0.value / 100) : clamp01(a0.value);
        }

        const base: Hsl = { h, s: s0.value, l: l0.value };
        return a === 1 ? { kind: "hsl", value: base } : { kind: "hsla", value: { ...base, a } };
    }

    return null;
}

export function cssColorToRgba(input: string): Rgba | null {
    const parsed = parseCssColor(input);
    if (!parsed) return null;

    if (parsed.kind === "hex") return hexToRgba(parsed.value);
    if (parsed.kind === "rgb") return { ...parsed.value, a: 1 };
    if (parsed.kind === "rgba") return parsed.value;
    if (parsed.kind === "hsl") return { ...hslToRgb(parsed.value), a: 1 };
    if (parsed.kind === "hsla") return hslaToRgba(parsed.value);

    return null;
}

/* ============================================================================
   Output helpers
============================================================================ */

export function toCssRgb(rgb: Rgb) {
    const r = clamp(Math.round(rgb.r), 0, 255);
    const g = clamp(Math.round(rgb.g), 0, 255);
    const b = clamp(Math.round(rgb.b), 0, 255);
    return `rgb(${r} ${g} ${b})`;
}

export function toCssRgba(rgba: Rgba) {
    const r = clamp(Math.round(rgba.r), 0, 255);
    const g = clamp(Math.round(rgba.g), 0, 255);
    const b = clamp(Math.round(rgba.b), 0, 255);
    const a = round(clamp01(rgba.a), 4);
    return `rgb(${r} ${g} ${b} / ${a})`;
}

export function toCssHsl(hsl: Hsl) {
    const h = round(((hsl.h % 360) + 360) % 360, 2);
    const s = round(clamp(hsl.s, 0, 100), 2);
    const l = round(clamp(hsl.l, 0, 100), 2);
    return `hsl(${h} ${s}% ${l}%)`;
}

export function toCssHsla(hsla: Hsla) {
    const h = round(((hsla.h % 360) + 360) % 360, 2);
    const s = round(clamp(hsla.s, 0, 100), 2);
    const l = round(clamp(hsla.l, 0, 100), 2);
    const a = round(clamp01(hsla.a), 4);
    return `hsl(${h} ${s}% ${l}% / ${a})`;
}

/* ============================================================================
   Color ops
============================================================================ */

export function withAlpha(rgb: Rgb, a: number): Rgba {
    return { ...rgb, a: clamp01(a) };
}

export function multiplyAlpha(rgba: Rgba, factor: number): Rgba {
    return { ...rgba, a: clamp01(rgba.a * factor) };
}

// export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
//     const k = clamp01(t);
//     return {
//         r: Math.round(a.r + (b.r - a.r) * k),
//         g: Math.round(a.g + (b.g - a.g) * k),
//         b: Math.round(a.b + (b.b - a.b) * k),
//     };
// }

export function relativeLuminance(rgb: Rgb): number {
    const srgb = [rgb.r, rgb.g, rgb.b].map((v) => clamp(v, 0, 255) / 255);
    const lin = srgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    const r = lin[0] ?? 0;
    const g = lin[1] ?? 0;
    const b = lin[2] ?? 0;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: Rgb, b: Rgb): number {
    const L1 = relativeLuminance(a);
    const L2 = relativeLuminance(b);
    const hi = Math.max(L1, L2);
    const lo = Math.min(L1, L2);
    return round((hi + 0.05) / (lo + 0.05), 3);
}

export function readableTextColor(bg: Rgb, opts?: { light?: Rgb; dark?: Rgb }) {
    const light = opts?.light ?? { r: 255, g: 255, b: 255 };
    const dark = opts?.dark ?? { r: 0, g: 0, b: 0 };

    const cLight = contrastRatio(bg, light);
    const cDark = contrastRatio(bg, dark);

    return cLight >= cDark ? light : dark;
}

/* ============================================================================
   Convenience wrappers
============================================================================ */

export function hexToHsl(hex: string): Hsl | null {
    const rgb = hexToRgb(hex);
    return rgb ? rgbToHsl(rgb) : null;
}

export function hslToHex(hsl: Hsl): string {
    return rgbToHex(hslToRgb(hsl));
}

export function cssColorToHex(input: string, opts?: { withAlpha?: boolean }): string | null {
    const rgba = cssColorToRgba(input);
    if (!rgba) return null;

    const hexOpts = opts?.withAlpha === undefined ? undefined : { withAlpha: opts.withAlpha };
    return rgbaToHex(rgba, hexOpts);
}

// export function rgbToCssRgb(rgb: Rgb) {
//     return `${rgb.r} ${rgb.g} ${rgb.b}`;
// }

/**
 * Parses a CSS-ish color string into RGB.
 * Accepts:
 * - "59 130 246"
 * - "59,130,246"
 * - "rgb(59, 130, 246)"
 * - "#3b82f6"
 */
export function parseToRgb(input: string): Rgb | null {
    const v = (input ?? "").trim();

    if (/^#?[0-9a-fA-F]{6}$/.test(v)) {
        const hex = v.startsWith("#") ? v.slice(1) : v;
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return { r, g, b };
    }

    const rgbFn = v.match(
        /rgb\s*\(\s*([0-9]{1,3})\s*[, ]\s*([0-9]{1,3})\s*[, ]\s*([0-9]{1,3})\s*\)/i
    );
    if (rgbFn) {
        const r = Number(rgbFn[1]);
        const g = Number(rgbFn[2]);
        const b = Number(rgbFn[3]);

        if ([r, g, b].every((n) => isFiniteNumber(n) && n >= 0 && n <= 255)) {
            return { r, g, b };
        }

        return null;
    }

    const parts = v.split(/[\s,]+/).filter(Boolean);
    if (parts.length >= 3) {
        const r = Number(parts[0]);
        const g = Number(parts[1]);
        const b = Number(parts[2]);

        if ([r, g, b].every((n) => isFiniteNumber(n) && n >= 0 && n <= 255)) {
            return { r, g, b };
        }
    }

    return null;
}

/* ============================================================================
   IDS color / gradient helpers
============================================================================ */

export function tailwindColorVar(family: string, step: number) {
    return `var(--ids-color-${family}-${step})`;
}

export function lighten(rgb: Rgb, amount: number): Rgb {
    const mix = (channel: number) => Math.round(channel + (255 - channel) * clamp01(amount));

    return {
        r: mix(rgb.r),
        g: mix(rgb.g),
        b: mix(rgb.b),
    };
}

export function darken(rgb: Rgb, amount: number): Rgb {
    const mix = (channel: number) => Math.round(channel * (1 - clamp01(amount)));

    return {
        r: mix(rgb.r),
        g: mix(rgb.g),
        b: mix(rgb.b),
    };
}

export function toTransparent(color: string, alpha = 0.1) {
    const c = color.trim();

    if (c.startsWith("rgba(")) {
        return c.replace(
            /rgba\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/,
            `rgba($1,$2,$3,${alpha})`
        );
    }

    if (c.startsWith("hsl(") && c.includes("/")) {
        return c.replace(/\/\s*([0-9.]+)\s*\)/, `/ ${alpha})`);
    }

    return `rgba(0,0,0,${alpha})`;
}

export function radial(size: string, at: string, color: string, fadeAt: string, tailAlpha = 0.1) {
    const transparentColor = toTransparent(color, tailAlpha);
    return `radial-gradient(${size} at ${at}, ${color} 0%, ${transparentColor} ${fadeAt})`;
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

    return {
        r: clamp255(r),
        g: clamp255(g),
        b: clamp255(bch),
    };
}

export function rgbToCssRgb(rgb: Rgb): string {
    return `rgb(${clamp255(rgb.r)}, ${clamp255(rgb.g)}, ${clamp255(rgb.b)})`;
}

export function rgba(rgb: Rgb, alpha: number): string {
    const a = clamp01(alpha);
    return `rgba(${clamp255(rgb.r)},${clamp255(rgb.g)},${clamp255(rgb.b)},${a})`;
}
