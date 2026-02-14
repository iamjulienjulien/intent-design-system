"use client";

// src/components/intent/IntentControlButton.tsx
// IntentControlButton
// - First Intent Control component (button)
// - Uses resolveIntent() to compute stable class hooks + CSS vars
// - Supports glow layers like IntentSurface
// - No dynamic Tailwind classes: only stable hooks

import * as React from "react";

import type { IntentInput } from "../lib/intent/types";
import { resolveIntent, getIntentControlProps } from "../lib/intent/resolve";

import type { DocsPropRow, ComponentIdentity } from "../lib/intent/types";
import { SYSTEM_PROPS_TABLE } from "../lib/intent/props";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

function sizeClass(size: ButtonSize) {
    switch (size) {
        case "xs":
            return "ids-btn-xs";
        case "sm":
            return "ids-btn-sm";
        case "lg":
            return "ids-btn-lg";
        case "xl":
            return "ids-btn-xl";
        default:
            return "ids-btn-md";
    }
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentControlButtonProps = IntentInput &
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
        className?: string;
        children?: React.ReactNode;

        size?: ButtonSize; // default: "md"
        fullWidth?: boolean;

        loading?: boolean;
        pressed?: boolean;

        leftIcon?: React.ReactNode;
        rightIcon?: React.ReactNode;
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_BUTTON_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "className",
        description: {
            fr: "Classes CSS additionnelles appliquées au root.",
            en: "Additional CSS classes applied to the root element.",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "children",
        description: {
            fr: "Contenu du bouton (label).",
            en: "Button content (label).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille du bouton (affecte padding, hauteur, typo).",
            en: "Button size (affects padding, height, typography).",
        },
        type: `"xs" | "sm" | "md" | "lg" | "xl"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: {
            fr: "Étire le bouton sur toute la largeur disponible.",
            en: "Stretches the button to full available width.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "loading",
        description: {
            fr: "Affiche un spinner et force disabled (préserve l’état).",
            en: "Shows a spinner and forces disabled (preserves state).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "pressed",
        description: {
            fr: "État “pressed” (aria-pressed + hook visuel).",
            en: "Pressed state (aria-pressed + visual hook).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "leftIcon",
        description: {
            fr: "Icône à gauche du label (ignorée si loading=true).",
            en: "Left icon (ignored if loading=true).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "rightIcon",
        description: {
            fr: "Icône à droite du label.",
            en: "Right icon.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Toutes les props natives du button (type, onClick, aria-*, data-*…).",
            en: "All native button props (type, onClick, aria-*, data-*…).",
        },
        type: "Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentControlButtonPropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_BUTTON_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlButtonIdentity: ComponentIdentity = {
    name: "IntentControlButton",
    kind: "control",
    description: {
        fr: "Bouton intent-first (controls) : hooks CSS stables + variables résolues via resolveIntent().",
        en: "Intent-first control button: stable CSS hooks + resolved variables via resolveIntent().",
    },
    since: "0.1.0",
    docs: {
        route: "/playground/components/IntentControlButton",
    },
    anatomy: {
        root: "<button>",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        content: ".intent-control-label (wrapped in z-10)",
        spinner: ".intent-control-spinner",
        leftIcon: ".intent-control-icon-left",
        rightIcon: ".intent-control-icon-right",
    },
    classHooks: [
        "intent-control",
        "intent-control-button",
        "intent-bg",
        "intent-ink",
        "intent-border",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
        "is-pressed",
        "is-loading",
        "is-disabled",
        "ids-btn-xs",
        "ids-btn-sm",
        "ids-btn-md",
        "ids-btn-lg",
        "ids-btn-xl",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentControlButton(props: IntentControlButtonProps) {
    const {
        className,
        children,

        size = "md",
        fullWidth = false,

        loading = false,
        pressed = false,

        leftIcon,
        rightIcon,

        // ✅ Pull DS props OUT so they never reach the DOM via {...buttonProps}
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: disabledProp,

        // ✅ Only real DOM props remain here
        ...buttonProps
    } = props;

    const disabled = Boolean(disabledProp) || loading;

    const intentInput: IntentInput = {
        ...(intent !== undefined ? { intent } : {}),
        ...(variant !== undefined ? { variant } : {}), // ✅ IMPORTANT
        ...(tone !== undefined ? { tone } : {}),
        ...(glow !== undefined ? { glow } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),
        disabled,
    };

    const resolved = resolveIntent(intentInput);

    const surfaceProps = getIntentControlProps(resolved, className);

    /* ============================================================================
       ✨ Glow layers (same rules as IntentSurface)
    ============================================================================ */

    const hasGlow = Boolean(resolved.glowBackground);
    const v = resolved.variant;

    const glowAllowed = hasGlow && v !== "ghost";
    const isGlowed = resolved.intent === "glowed";

    // Variant rules:
    // - Normal intents: flat/elevated => fill, outlined/elevated => border
    // - glowed: aura exists even in outlined (fill allowed for all except ghost)
    const allowFillGlow = glowAllowed && (isGlowed || v === "flat" || v === "elevated");
    const allowBorderGlow = glowAllowed && (v === "outlined" || v === "elevated");

    const readOpacity = (key: "--intent-glow-fill-opacity" | "--intent-glow-border-opacity") => {
        const raw = resolved.style?.[key] ?? "0";
        const n = Number(raw.toString());
        return Number.isFinite(n) ? n : 0;
    };

    /* ============================================================================
       🧱 Control class hooks (stable)
    ============================================================================ */

    const rootCls = cn(
        "intent-control intent-control-button",
        "relative inline-flex items-center justify-center",
        "select-none whitespace-nowrap",
        // "rounded-ids-2xl",
        "transition",
        sizeClass(size),
        fullWidth && "w-full",
        pressed && "is-pressed",
        loading && "is-loading",
        disabled && "is-disabled"
    );

    return (
        <button
            {...buttonProps}
            {...surfaceProps}
            className={cn(surfaceProps.className, rootCls)}
            disabled={disabled}
            type={buttonProps.type ?? "button"}
            aria-pressed={pressed || undefined}
            aria-busy={loading || undefined}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            {/* Glow layers (under content) */}
            {glowAllowed ? (
                <>
                    {allowFillGlow ? (
                        <span
                            aria-hidden
                            className={cn("intent-glow-layer intent-glow-fill")}
                            style={{ opacity: readOpacity("--intent-glow-fill-opacity") }}
                        />
                    ) : null}

                    {allowBorderGlow ? (
                        <span
                            aria-hidden
                            className={cn("intent-glow-layer intent-glow-border")}
                            style={{
                                opacity: readOpacity("--intent-glow-border-opacity"),
                                borderRadius: "inherit",
                            }}
                        />
                    ) : null}
                </>
            ) : null}

            {/* Content */}
            <span className="relative z-10 inline-flex w-full justify-center items-center gap-2">
                {loading ? (
                    <span aria-hidden className="intent-control-spinner" />
                ) : leftIcon ? (
                    <span className="intent-control-icon intent-control-icon-left">{leftIcon}</span>
                ) : null}

                <span className="intent-control-label">{children}</span>

                {rightIcon ? (
                    <span className="intent-control-icon intent-control-icon-right">
                        {rightIcon}
                    </span>
                ) : null}
            </span>
        </button>
    );
}
