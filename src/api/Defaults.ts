"use client";

/* ============================================================================
   src/api/Default.ts
   Intent Design System – Default API
   - Runtime helpers to read / set / reset IDS defaults
   - Backed by the internal ConfigStore
============================================================================ */

import { DEFAULT_MODE } from "../system/constants";
import type { Mode } from "../system/types";
import { isMode, normalizeMode } from "../system/helpers";
import { useConfigStore } from "../core/store";

/* ============================================================================
   Types
============================================================================ */

export type DefaultInput = {
    mode?: Mode;
};

/* ============================================================================
   Helpers
============================================================================ */

function getCurrentMode(): Mode {
    return useConfigStore.getState().currentDefaultMode;
}

/* ============================================================================
   API
============================================================================ */

export const Defaults = {
    /**
     * Returns the current fallback mode from the config store.
     */
    getMode(): Mode {
        return getCurrentMode();
    },

    /**
     * Normalizes a mode using the current configured default.
     * If mode is missing/invalid, returns the current default mode.
     */
    mode(value?: string | null): Mode {
        return value && isMode(value) ? value : getCurrentMode();
    },

    /**
     * Returns the current defaults object.
     */
    get(): { mode: Mode } {
        return {
            mode: getCurrentMode(),
        };
    },

    /**
     * Applies defaults to a partial object that may contain mode.
     */
    apply<T extends { mode?: Mode | null | undefined }>(input?: T): T & { mode: Mode } {
        return {
            ...(input ?? ({} as T)),
            mode: this.mode(input?.mode),
        };
    },

    /**
     * Sets defaults in the config store.
     */
    set(input?: DefaultInput): void {
        const mode = normalizeMode(input?.mode);
        useConfigStore.getState().setCurrentDefaultMode(mode);
    },

    /**
     * Resets defaults to canonical values.
     */
    reset(): void {
        useConfigStore.getState().setCurrentDefaultMode(DEFAULT_MODE);
    },
};
