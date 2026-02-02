// src/lib/colors/__tests__/colorHelpers.test.ts
// Vitest tests for colorHelpers
// - Focus on correctness + stable tolerances (rounding-safe)

import { describe, expect, it } from "vitest";

import {
    normalizeHex,
    hexToRgb,
    hexToRgba,
    rgbToHex,
    rgbaToHex,
    rgbToHsl,
    hslToRgb,
    hexToHsl,
    hslToHex,
    parseCssColor,
    cssColorToRgba,
    cssColorToHex,
    mixRgb,
    withAlpha,
    multiplyAlpha,
    relativeLuminance,
    contrastRatio,
    readableTextColor,
    toCssRgb,
    toCssRgba,
    toCssHsl,
    toCssHsla,
} from "../colorHelpers";

/* ============================================================================
   HELPERS
============================================================================ */

function expectRgbClose(
    actual: { r: number; g: number; b: number },
    expected: { r: number; g: number; b: number },
    tol = 1
) {
    expect(Math.abs(actual.r - expected.r)).toBeLessThanOrEqual(tol);
    expect(Math.abs(actual.g - expected.g)).toBeLessThanOrEqual(tol);
    expect(Math.abs(actual.b - expected.b)).toBeLessThanOrEqual(tol);
}

function expectNumberClose(actual: number, expected: number, tol = 1e-3) {
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
}

/* ============================================================================
   HEX
============================================================================ */

describe("colorHelpers: hex", () => {
    it("normalizeHex: expands #rgb -> #rrggbb", () => {
        expect(normalizeHex("#0f8")).toBe("#00ff88");
        expect(normalizeHex("0f8")).toBe("#00ff88");
    });

    it("normalizeHex: expands #rgba -> #rrggbbaa", () => {
        expect(normalizeHex("#0f8c")).toBe("#00ff88cc");
    });

    it("normalizeHex: accepts #rrggbb and #rrggbbaa, lowercases", () => {
        expect(normalizeHex("#AABBCC")).toBe("#aabbcc");
        expect(normalizeHex("#AABBCCDD")).toBe("#aabbccdd");
    });

    it("normalizeHex: rejects invalid", () => {
        expect(normalizeHex("#xyz")).toBe(null);
        expect(normalizeHex("#12345")).toBe(null);
        expect(normalizeHex("")).toBe(null);
    });

    it("hexToRgb: parses #rrggbb", () => {
        expect(hexToRgb("#ffcc00")).toEqual({ r: 255, g: 204, b: 0 });
    });

    it("hexToRgba: parses alpha (#rrggbbaa)", () => {
        const rgba = hexToRgba("#ffcc0080");
        expect(rgba).not.toBe(null);
        expect(rgba!.r).toBe(255);
        expect(rgba!.g).toBe(204);
        expect(rgba!.b).toBe(0);
        expectNumberClose(rgba!.a, 0.502, 0.01);
    });

    it("rgbToHex / rgbaToHex: round and clamp channels", () => {
        expect(rgbToHex({ r: 255, g: 204, b: 0 })).toBe("#ffcc00");
        expect(rgbaToHex({ r: 255, g: 204, b: 0, a: 1 }, { withAlpha: true })).toBe("#ffcc00ff");
        expect(rgbaToHex({ r: 300, g: -10, b: 1, a: 0.5 }, { withAlpha: true })).toBe("#ff000180");
    });
});

/* ============================================================================
   RGB <-> HSL
============================================================================ */

describe("colorHelpers: rgb <-> hsl", () => {
    it("rgbToHsl: basic primaries", () => {
        const red = rgbToHsl({ r: 255, g: 0, b: 0 });
        expectNumberClose(red.h, 0, 0.2);
        expectNumberClose(red.s, 100, 0.2);
        expectNumberClose(red.l, 50, 0.2);

        const green = rgbToHsl({ r: 0, g: 255, b: 0 });
        expectNumberClose(green.h, 120, 0.2);

        const blue = rgbToHsl({ r: 0, g: 0, b: 255 });
        expectNumberClose(blue.h, 240, 0.2);
    });

    it("hslToRgb: round trip for a known color", () => {
        const hsl = { h: 48, s: 100, l: 50 }; // close to #ffcc00
        const rgb = hslToRgb(hsl);
        expectRgbClose(rgb, { r: 255, g: 204, b: 0 }, 2);

        const back = rgbToHsl(rgb);
        expectNumberClose(back.h, 48, 1.0);
        expectNumberClose(back.s, 100, 1.0);
        expectNumberClose(back.l, 50, 1.0);
    });

    it("hexToHsl / hslToHex convenience", () => {
        const hsl = hexToHsl("#ffcc00");
        expect(hsl).not.toBe(null);

        const hex = hslToHex(hsl!);
        // small rounding differences possible, but should remain identical here
        expect(hex).toBe("#ffcc00");
    });

    it("hslToRgb: grayscale when s=0", () => {
        expect(hslToRgb({ h: 200, s: 0, l: 0 })).toEqual({ r: 0, g: 0, b: 0 });
        expect(hslToRgb({ h: 200, s: 0, l: 100 })).toEqual({ r: 255, g: 255, b: 255 });
        expect(hslToRgb({ h: 200, s: 0, l: 50 })).toEqual({ r: 128, g: 128, b: 128 });
    });
});

/* ============================================================================
   CSS parsing
============================================================================ */

describe("colorHelpers: css parsing", () => {
    it("parseCssColor: hex", () => {
        expect(parseCssColor("#0f8")?.kind).toBe("hex");
        expect(parseCssColor("#00ff88")?.kind).toBe("hex");
    });

    it("cssColorToRgba: rgb() modern syntax", () => {
        const rgba = cssColorToRgba("rgb(255 0 0 / 0.4)");
        expect(rgba).not.toBe(null);
        expect(rgba!).toMatchObject({ r: 255, g: 0, b: 0 });
        expectNumberClose(rgba!.a, 0.4, 1e-6);
    });

    it("cssColorToRgba: rgb() comma syntax", () => {
        const rgba = cssColorToRgba("rgb(255, 204, 0)");
        expect(rgba).toEqual({ r: 255, g: 204, b: 0, a: 1 });
    });

    it("cssColorToRgba: rgba() comma syntax", () => {
        const rgba = cssColorToRgba("rgba(255, 204, 0, 0.5)");
        expect(rgba).not.toBe(null);
        expect(rgba!).toMatchObject({ r: 255, g: 204, b: 0 });
        expectNumberClose(rgba!.a, 0.5, 1e-6);
    });

    it("cssColorToRgba: percent rgb channels", () => {
        const rgba = cssColorToRgba("rgb(100% 0% 0%)");
        expect(rgba).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    it("cssColorToRgba: hsl() modern syntax", () => {
        const rgba = cssColorToRgba("hsl(48 100% 50% / 1)");
        expect(rgba).not.toBe(null);
        expectRgbClose(rgba!, { r: 255, g: 204, b: 0 }, 2);
        expectNumberClose(rgba!.a, 1, 1e-6);
    });

    it("cssColorToHex: converts rgb/hsl to hex", () => {
        expect(cssColorToHex("rgb(255 204 0)")).toBe("#ffcc00");
        expect(cssColorToHex("hsl(48 100% 50%)")).toBe("#ffcc00");
    });

    it("cssColorToHex: supports withAlpha", () => {
        const h = cssColorToHex("rgb(255 204 0 / 0.5)", { withAlpha: true });
        expect(h).not.toBe(null);
        expect(h!.startsWith("#ffcc00")).toBe(true);
    });

    it("cssColorToRgba: invalid returns null", () => {
        expect(cssColorToRgba("wat")).toBe(null);
        expect(cssColorToRgba("rgb(hello)")).toBe(null);
        expect(cssColorToRgba("#12")).toBe(null);
    });
});

/* ============================================================================
   OPERATIONS
============================================================================ */

describe("colorHelpers: operations", () => {
    it("mixRgb: midpoint", () => {
        const mid = mixRgb({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, 0.5);
        expect(mid).toEqual({ r: 128, g: 128, b: 128 });
    });

    it("withAlpha / multiplyAlpha", () => {
        expect(withAlpha({ r: 10, g: 20, b: 30 }, 0.3)).toEqual({ r: 10, g: 20, b: 30, a: 0.3 });
        expect(multiplyAlpha({ r: 10, g: 20, b: 30, a: 0.5 }, 0.5).a).toBe(0.25);
        expect(multiplyAlpha({ r: 10, g: 20, b: 30, a: 0.9 }, 2).a).toBe(1);
    });
});

/* ============================================================================
   ACCESSIBILITY
============================================================================ */

describe("colorHelpers: luminance & contrast", () => {
    it("relativeLuminance: black ~0, white ~1", () => {
        expectNumberClose(relativeLuminance({ r: 0, g: 0, b: 0 }), 0, 1e-6);
        expectNumberClose(relativeLuminance({ r: 255, g: 255, b: 255 }), 1, 1e-6);
    });

    it("contrastRatio: black/white ~21", () => {
        const c = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
        expectNumberClose(c, 21, 0.05);
    });

    it("readableTextColor: chooses best of black/white", () => {
        const onDark = readableTextColor({ r: 10, g: 10, b: 20 });
        expect(onDark).toEqual({ r: 255, g: 255, b: 255 });

        const onLight = readableTextColor({ r: 240, g: 240, b: 240 });
        expect(onLight).toEqual({ r: 0, g: 0, b: 0 });
    });
});

/* ============================================================================
   CSS OUTPUT
============================================================================ */

describe("colorHelpers: css output formatting", () => {
    it("toCssRgb / toCssRgba", () => {
        expect(toCssRgb({ r: 1, g: 2, b: 3 })).toBe("rgb(1 2 3)");
        expect(toCssRgba({ r: 1, g: 2, b: 3, a: 0.5 })).toBe("rgb(1 2 3 / 0.5)");
    });

    it("toCssHsl / toCssHsla", () => {
        expect(toCssHsl({ h: 48, s: 100, l: 50 })).toBe("hsl(48 100% 50%)");
        expect(toCssHsla({ h: 48, s: 100, l: 50, a: 0.5 })).toBe("hsl(48 100% 50% / 0.5)");
    });
});
