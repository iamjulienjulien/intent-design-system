"use client";

// src/components/intent/IntentDivider.tsx
// IntentDivider
// - Layout divider (horizontal / vertical)
// - Intent-first: uses resolveIntent() to compute stable hooks + CSS vars
// - No glow layers (divider should stay subtle)
// - No dynamic Tailwind classes: only stable hooks

import * as React from "react";

import type { IntentInput } from "../lib/intent/types";
import { resolveIntent, getIntentLayoutProps } from "../lib/intent/resolve";

import type { DocsPropRow, ComponentIdentity } from "../lib/intent/types";
import { SYSTEM_PROPS_TABLE } from "../lib/intent/props";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

type DividerOrientation = "horizontal" | "vertical";
type DividerThickness = "hairline" | "thin" | "medium";
type DividerAlign = "left" | "center" | "right";

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentDividerProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
        className?: string;

        orientation?: DividerOrientation; // default: "horizontal"
        thickness?: DividerThickness; // default: "hairline"
        fullWidth?: boolean; // default: true for horizontal, false for vertical (but we expose it)

        /**
         * Optional label displayed “inside” the divider.
         * For horizontal only. For vertical: ignored.
         */
        label?: React.ReactNode;

        /**
         * Label alignment for horizontal divider.
         */
        align?: DividerAlign; // default: "center"

        /**
         * Gap around the label (space between line segments and label).
         */
        gap?: "xs" | "sm" | "md"; // default: "sm"
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_DIVIDER_LOCAL_PROPS_TABLE: DocsPropRow[] = [
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
        name: "orientation",
        description: {
            fr: "Orientation du divider (horizontal/vertical).",
            en: "Divider orientation (horizontal/vertical).",
        },
        type: `"horizontal" | "vertical"`,
        required: false,
        default: "horizontal",
        fromSystem: false,
    },
    {
        name: "thickness",
        description: {
            fr: "Épaisseur de la ligne.",
            en: "Line thickness.",
        },
        type: `"hairline" | "thin" | "medium"`,
        required: false,
        default: "hairline",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: {
            fr: "Étire le divider sur toute la largeur/hauteur disponible.",
            en: "Stretches the divider to full available width/height.",
        },
        type: "boolean",
        required: false,
        default: "true (horizontal), false (vertical)",
        fromSystem: false,
    },
    {
        name: "label",
        description: {
            fr: "Label optionnel (uniquement en horizontal).",
            en: "Optional label (horizontal only).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "align",
        description: {
            fr: "Alignement du label (horizontal).",
            en: "Label alignment (horizontal).",
        },
        type: `"left" | "center" | "right"`,
        required: false,
        default: "center",
        fromSystem: false,
    },
    {
        name: "gap",
        description: {
            fr: "Espace autour du label (horizontal).",
            en: "Space around the label (horizontal).",
        },
        type: `"xs" | "sm" | "md"`,
        required: false,
        default: "sm",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Toutes les props natives du div (id, style, onClick, aria-*, data-*…).",
            en: "All native div props (id, style, onClick, aria-*, data-*…).",
        },
        type: "Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'children'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentDividerPropsTable: DocsPropRow[] = [
    ...INTENT_DIVIDER_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentDividerIdentity: ComponentIdentity = {
    name: "IntentDivider",
    kind: "layout",
    description: {
        fr: "Divider intent-first (layout) : ligne horizontale/verticale avec label optionnel, stylé via resolveIntent().",
        en: "Intent-first divider (layout): horizontal/vertical line with optional label, styled via resolveIntent().",
    },
    since: "0.2.0",
    docs: {
        route: "/playground/components/IntentDivider",
    },
    anatomy: {
        root: "<div>",
        line: ".intent-divider-line",
        label: ".intent-divider-label",
    },
    classHooks: [
        "intent-control",
        "intent-divider",
        "intent-divider-horizontal",
        "intent-divider-vertical",
        "intent-divider-line",
        "intent-divider-label",
        "ids-divider-hairline",
        "ids-divider-thin",
        "ids-divider-medium",
        "is-disabled",
        "has-label",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

function thicknessClass(t: DividerThickness) {
    switch (t) {
        case "thin":
            return "ids-divider-thin";
        case "medium":
            return "ids-divider-medium";
        default:
            return "ids-divider-hairline";
    }
}

function gapClass(g: "xs" | "sm" | "md") {
    switch (g) {
        case "xs":
            return "ids-divider-gap-xs";
        case "md":
            return "ids-divider-gap-md";
        default:
            return "ids-divider-gap-sm";
    }
}

export function IntentDivider(props: IntentDividerProps) {
    const {
        className,

        orientation = "horizontal",
        thickness = "hairline",
        fullWidth,

        label,
        align = "center",
        gap = "sm",

        // ✅ Pull DS props OUT so they never reach the DOM
        intent,
        tone,
        intensity,
        mode,
        disabled: disabledProp,

        // ✅ Only real DOM props remain here
        ...divProps
    } = props;

    const disabled = Boolean(disabledProp);

    const intentInput: IntentInput = {
        ...(intent !== undefined ? { intent } : {}),
        variant: "ghost", // ✅ force neutral
        ...(tone !== undefined ? { tone } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),
        disabled,
    };

    const resolved = resolveIntent(intentInput);

    // Reuse control props to get stable class hooks + CSS vars
    const layoutProps = getIntentLayoutProps(resolved, className);

    const isHorizontal = orientation === "horizontal";
    const stretch = fullWidth !== undefined ? fullWidth : isHorizontal ? true : false;

    const hasLabel = Boolean(label) && isHorizontal;

    const rootCls = cn(
        "intent-control intent-divider",
        isHorizontal ? "intent-divider-horizontal" : "intent-divider-vertical",
        "relative",
        thicknessClass(thickness),
        hasLabel && "has-label",
        disabled && "is-disabled",
        stretch && (isHorizontal ? "w-full" : "h-full")
    );

    const lineCls = cn(
        "intent-divider-line",
        "block",
        isHorizontal ? "h-px w-full" : "w-px h-full"
    );

    // Label only makes sense horizontally
    if (!isHorizontal || !label) {
        return (
            <div
                {...divProps}
                {...layoutProps}
                className={cn(layoutProps.className, rootCls)}
                aria-hidden={divProps["aria-hidden"] ?? true}
                data-intent={resolved.intent}
                data-variant={resolved.variant}
                data-intensity={resolved.intensity}
                data-mode={resolved.mode}
            >
                <span aria-hidden className={lineCls} />
            </div>
        );
    }

    // Horizontal + label: render as flex with two lines + label
    const justify =
        align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";

    return (
        <div
            {...divProps}
            {...layoutProps}
            className={cn(
                layoutProps.className,
                rootCls,
                "flex items-center",
                justify,
                gapClass(gap)
            )}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            {/* Left segment */}
            <span
                aria-hidden
                className={cn(lineCls, align === "left" ? "w-10 flex-none" : "flex-1")}
            />

            {/* Label */}
            <span className="intent-divider-label text-xs opacity-70 whitespace-nowrap">
                {label}
            </span>

            {/* Right segment */}
            <span
                aria-hidden
                className={cn(lineCls, align === "right" ? "w-10 flex-none" : "flex-1")}
            />
        </div>
    );
}
