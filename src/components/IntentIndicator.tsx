"use client";

// src/components/IntentIndicator.tsx
// IntentIndicator
// - Small semantic badge / lozenge indicator
// - Uses resolveIntent() to compute stable class hooks + CSS vars
// - Supports glow layers like IntentSurface / controls
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

type IndicatorSize = "xs" | "sm" | "md" | "lg";

function sizeClass(size: IndicatorSize) {
    switch (size) {
        case "xs":
            return "ids-indicator-xs";
        case "sm":
            return "ids-indicator-sm";
        case "lg":
            return "ids-indicator-lg";
        default:
            return "ids-indicator-md";
    }
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentIndicatorProps<T extends React.ElementType = "span"> = IntentInput & {
    as?: T;
    className?: string;
    children?: React.ReactNode;

    size?: IndicatorSize; // default: "md"
    fullWidth?: boolean;

    /**
     * If true, renders a small dot using intent color.
     * Useful for "status" chips (online/offline, etc.)
     */
    dot?: boolean;

    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;

    /**
     * Accessibility: default role is "status" (good for small state indicators).
     * You can override if needed ("note", "img", etc.)
     */
    role?: React.AriaRole;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children" | "color">;

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_INDICATOR_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "as",
        description: {
            fr: "Élément HTML rendu (polymorphique).",
            en: "Rendered HTML element (polymorphic).",
        },
        type: "T extends React.ElementType",
        required: false,
        default: "span",
        fromSystem: false,
    },
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
            fr: "Contenu du badge (label).",
            en: "Indicator content (label).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille de l’indicateur (padding, hauteur, typo).",
            en: "Indicator size (padding, height, typography).",
        },
        type: `"xs" | "sm" | "md" | "lg"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: {
            fr: "Étire l’indicateur sur toute la largeur disponible.",
            en: "Stretches the indicator to full available width.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "dot",
        description: {
            fr: "Affiche un petit point coloré (utile pour statuts).",
            en: "Renders a small colored dot (useful for status chips).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "leftIcon",
        description: {
            fr: "Icône à gauche du label.",
            en: "Left icon.",
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
        name: "role",
        description: {
            fr: "Rôle ARIA (par défaut: status).",
            en: "ARIA role (default: status).",
        },
        type: "React.AriaRole",
        required: false,
        default: "status",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Toutes les props natives du tag rendu (id, style, onClick, aria-*, data-*…).",
            en: "All native props of the rendered tag (id, style, onClick, aria-*, data-*…).",
        },
        type: "Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children' | 'color'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentIndicatorPropsTable: DocsPropRow[] = [
    ...INTENT_INDICATOR_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentIndicatorIdentity: ComponentIdentity = {
    name: "IntentIndicator",
    kind: "indicator",
    description: {
        fr: "Indicateur/badge intent-first: hooks CSS stables + variables résolues via resolveIntent().",
        en: "Intent-first indicator/badge: stable CSS hooks + resolved variables via resolveIntent().",
    },
    since: "0.2.0",
    docs: {
        route: "/playground/components/IntentIndicator",
    },
    anatomy: {
        root: "Tag (as)",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        content: ".intent-control-label (wrapped in z-10)",
        dot: ".intent-indicator-dot",
        leftIcon: ".intent-control-icon-left",
        rightIcon: ".intent-control-icon-right",
    },
    classHooks: [
        "intent-control",
        "intent-indicator",
        "intent-bg",
        "intent-ink",
        "intent-border",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
        "is-disabled",
        "ids-indicator-xs",
        "ids-indicator-sm",
        "ids-indicator-md",
        "ids-indicator-lg",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentIndicator<T extends React.ElementType = "span">(
    props: IntentIndicatorProps<T>
) {
    const {
        as,
        className,
        children,

        size = "md",
        fullWidth = false,

        dot = false,
        leftIcon,
        rightIcon,

        role = "status",

        // ✅ Pull DS props OUT so they never reach the DOM via {...restProps}
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: disabledProp,

        // ✅ Only real DOM props remain here
        ...restProps
    } = props;

    const disabled = Boolean(disabledProp);

    const intentInput: IntentInput = {
        ...(intent !== undefined ? { intent } : {}),
        ...(variant !== undefined ? { variant } : {}),
        ...(tone !== undefined ? { tone } : {}),
        ...(glow !== undefined ? { glow } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),
        disabled,
    };

    const resolved = resolveIntent(intentInput);

    const controlProps = getIntentControlProps(resolved, className);

    /* ============================================================================
       ✨ Glow layers (same rules as IntentSurface / controls)
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
       🧱 Indicator class hooks (stable)
    ============================================================================ */

    const Tag = (as ?? "span") as React.ElementType;

    const rootCls = cn(
        "intent-control intent-indicator", // stable base hooks
        "relative inline-flex items-center",
        "select-none whitespace-nowrap",
        "rounded-ids-2xl",
        sizeClass(size),
        fullWidth && "w-full",
        disabled && "is-disabled"
    );

    return (
        <Tag
            {...(restProps as Omit<React.ComponentPropsWithoutRef<T>, "className">)}
            {...controlProps}
            className={cn(controlProps.className, rootCls)}
            role={role}
            aria-disabled={disabled || undefined}
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
            <span className="relative z-10 inline-flex items-center gap-2">
                {dot ? <span aria-hidden className="intent-indicator-dot" /> : null}

                {leftIcon ? (
                    <span className="intent-control-icon intent-control-icon-left">{leftIcon}</span>
                ) : null}

                <span className="intent-control-label">{children}</span>

                {rightIcon ? (
                    <span className="intent-control-icon intent-control-icon-right">
                        {rightIcon}
                    </span>
                ) : null}
            </span>
        </Tag>
    );
}
