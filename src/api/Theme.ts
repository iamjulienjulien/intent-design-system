"use client";

/* ============================================================================
   src/api/Theme.ts
   Intent Design System – Theme API
   - Runtime helpers to read / set / reset IDS theme
   - Backed by the internal ConfigStore
   - Also mirrors theme CSS vars on <html>
============================================================================ */

import { useConfigStore } from "../core/store";
import { getDefaultThemeColor, normalizeHexColor } from "../system/helpers";
import { parseToRgb, rgbToString, type Rgb } from "../helpers/colors";
import { getThemeCssVars } from "../helpers/theme";

/* ============================================================================
   Types
============================================================================ */

export type ThemeSetInput =
    | string
    | {
          themeColor?: string;
      };

export type ThemeCssVars = Record<string, string>;

/* ============================================================================
   Helpers
============================================================================ */

const FALLBACK_THEME_RGB: Rgb = { r: 168, g: 85, b: 247 };

function normalizeThemeInput(input?: ThemeSetInput): { themeColor?: string } {
    if (typeof input === "string") {
        return { themeColor: input };
    }

    return input ?? {};
}

function getCurrentThemeColor() {
    return useConfigStore.getState().currentThemeColor;
}

function getDefaultThemeRgbSafe(): Rgb {
    return (
        parseToRgb(getDefaultThemeColor("hex")) ??
        parseToRgb(getDefaultThemeColor("rgb")) ??
        FALLBACK_THEME_RGB
    );
}

function getResolvedThemeRgb(): Rgb {
    const current = getCurrentThemeColor();
    return parseToRgb(current) ?? getDefaultThemeRgbSafe();
}

function applyThemeVarsToHtml(vars: ThemeCssVars) {
    if (typeof document === "undefined") return;

    const html = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => {
        html.style.setProperty(key, value);
    });
}

/* ============================================================================
   API
============================================================================ */

export const Theme = {
    /**
     * Returns the CSS variables record for a given theme input.
     */
    vars(input?: ThemeSetInput): ThemeCssVars {
        const { themeColor } = normalizeThemeInput(input);

        return getThemeCssVars({
            themeColor: normalizeHexColor(
                themeColor ?? getCurrentThemeColor(),
                getDefaultThemeColor("hex")
            ),
        });
    },

    /**
     * Returns the current theme color as hex.
     */
    get(): string {
        return normalizeHexColor(getCurrentThemeColor(), getDefaultThemeColor("hex"));
    },

    /**
     * Returns the current theme color as RGB object.
     */
    getRgb(): Rgb {
        return getResolvedThemeRgb();
    },

    /**
     * Returns true if the current theme differs from the canonical default.
     */
    hasCustomTheme(): boolean {
        const current = rgbToString(getResolvedThemeRgb());
        const fallback = rgbToString(getDefaultThemeRgbSafe());

        return current !== fallback;
    },

    /**
     * Sets the current runtime theme color in the config store
     * and mirrors its CSS vars on <html>.
     */
    set(input?: ThemeSetInput): void {
        const { themeColor } = normalizeThemeInput(input);

        const next = normalizeHexColor(
            themeColor ?? getDefaultThemeColor("hex"),
            getDefaultThemeColor("hex")
        );

        useConfigStore.getState().setCurrentThemeColor(next);
        applyThemeVarsToHtml(getThemeCssVars({ themeColor: next }));
    },

    /**
     * Resets the theme color to the canonical default
     * and mirrors default CSS vars on <html>.
     */
    reset(): void {
        const next = getDefaultThemeColor("hex");

        useConfigStore.getState().setCurrentThemeColor(next);
        applyThemeVarsToHtml(getThemeCssVars({ themeColor: next }));
    },
};
