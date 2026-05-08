"use client";

/* ============================================================================
   src/core/store.ts
   Intent Design System – ConfigStore
============================================================================ */

import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

import { DEFAULT_MODE } from "../system/constants";
import { getDefaultThemeColor, normalizeHexColor } from "../system/helpers";
import type { Mode } from "../system/types";

/* ============================================================================
   Types
============================================================================ */

export type ConfigStoreState = {
    currentDefaultMode: Mode;
    currentThemeColor: string;

    setCurrentDefaultMode: (mode: Mode) => void;
    setCurrentThemeColor: (hex: string) => void;

    resetConfig: () => void;
};

/* ============================================================================
   Defaults
============================================================================ */

const DEFAULT_STATE = {
    currentDefaultMode: DEFAULT_MODE,
    currentThemeColor: getDefaultThemeColor("hex"),
} satisfies Pick<ConfigStoreState, "currentDefaultMode" | "currentThemeColor">;

/* ============================================================================
   Helpers
============================================================================ */

const noopStorage: StateStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
};

function getSafeStorage(): StateStorage {
    if (typeof window === "undefined") return noopStorage;
    return window.localStorage;
}

/* ============================================================================
   Store
============================================================================ */

export const useConfigStore = create<ConfigStoreState>()(
    persist(
        (set) => ({
            ...DEFAULT_STATE,

            setCurrentDefaultMode: (mode) => {
                set({ currentDefaultMode: mode });
            },

            setCurrentThemeColor: (hex) => {
                set({
                    currentThemeColor: normalizeHexColor(hex, getDefaultThemeColor("hex")),
                });
            },

            resetConfig: () => {
                set(DEFAULT_STATE);
            },
        }),
        {
            name: "intent-design-system:config",
            storage: createJSONStorage(getSafeStorage),
            partialize: (state) => ({
                currentDefaultMode: state.currentDefaultMode,
                currentThemeColor: state.currentThemeColor,
            }),
        }
    )
);
