// src/lib/colors/themeHelpers.ts
// themeHelpers
// - Helpers for theme-driven color variables
// - Works with DEFAULT_THEME_COLOR from src/lib/intent/mapping.ts
// - Provides glow rgba pair (2 radials) like other intents

// import { DEFAULT_THEME_COLOR } from "../intent/mapping";
import { mixRgb, parseToRgb, rgba, rgbToCssRgb, rgbToString, type Rgb } from "./colors";
// import { Theme } from "./Theme";

/* ============================================================================
   TYPES
============================================================================ */

// export type Rgb = { r: number; g: number; b: number };

/* ============================================================================
   GLOW
============================================================================ */

export function getThemeGlowRgbaPair(opts: {
    themeColor: string;
    primaryAlpha?: number;
    secondaryAlpha?: number;
    secondaryMixTo?: "slate" | "white" | "black";
    secondaryMixAmount?: number;
}): [string, string] {
    const {
        themeColor,
        primaryAlpha = 0.28,
        secondaryAlpha = 0.22,
        secondaryMixTo = "slate",
        secondaryMixAmount = 0.38,
    } = opts ?? {};

    const fallbackBase: Rgb = { r: 168, g: 85, b: 247 };
    const base = parseToRgb(themeColor) ?? fallbackBase;

    const slateAnchor: Rgb = { r: 148, g: 163, b: 184 };
    const mixTarget: Rgb =
        secondaryMixTo === "white"
            ? { r: 255, g: 255, b: 255 }
            : secondaryMixTo === "black"
              ? { r: 0, g: 0, b: 0 }
              : slateAnchor;

    const secondary = mixRgb(base, mixTarget, secondaryMixAmount);

    return [rgba(base, primaryAlpha), rgba(secondary, secondaryAlpha)];
}

// export function getThemeGlowBackgroundCss(
//     radial: (size: string, at: string, color: string, stop: string) => string,
//     opts?: {
//         // themeColor?: string;
//         primaryRgba?: string;
//         secondaryRgba?: string;
//         stop1?: string;
//         stop2?: string;
//         size1?: string;
//         size2?: string;
//         at1?: string;
//         at2?: string;
//     }
// ): string {
//     const [defaultGlow1, defaultGlow2] = getThemeGlowRgbaPair();

//     console.log("d", defaultGlow1, defaultGlow2);

//     const {
//         primaryRgba = defaultGlow1,
//         secondaryRgba = defaultGlow2,
//         stop1 = "74%",
//         stop2 = "72%",
//         size1 = "190% 150%",
//         size2 = "165% 150%",
//         at1 = "15% 20%",
//         at2 = "85% 30%",
//     } = opts ?? {};

//     return [radial(size1, at1, primaryRgba, stop1), radial(size2, at2, secondaryRgba, stop2)].join(
//         ","
//     );
// }

/* ============================================================================
   CSS VAR HELPERS
============================================================================ */

export function getThemeCssVars(opts: { themeColor: string }): Record<string, string> {
    const themeRgb = parseToRgb(opts?.themeColor);

    if (!themeRgb) return {};

    const [glow1, glow2] = getThemeGlowRgbaPair({
        themeColor: rgbToString(themeRgb),
    });

    return {
        "--ids-theme": rgbToString(themeRgb),
        "--ids-theme-rgb": rgbToCssRgb(themeRgb),
        "--ids-theme-glow-1": glow1,
        "--ids-theme-glow-2": glow2,
    };
}
