"use client";

// src/components/intent/IntentDivider.tsx
// IntentDivider
// - Layout divider (horizontal / vertical)
// - Intent-first: uses resolveIntent() to compute stable hooks + CSS vars
// - Styles: line | dots | space | dashed | fade | double | hatch
// - No glow layers (divider should stay subtle)
// - No dynamic Tailwind classes: only stable hooks

import * as React from "react";

import { resolveIntent, getIntentLayoutProps } from "CORE";
import {
    SYSTEM_PROPS_TABLE,
    type IntentInput,
    type DocsPropRow,
    type ComponentIdentity,
} from "SYSTEM";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

type DividerOrientation = "horizontal" | "vertical";
type DividerThickness = "hairline" | "thin" | "medium";
type DividerAlign = "left" | "center" | "right";

export type IntentDividerStyle = "line" | "dots" | "space" | "dashed" | "fade" | "double" | "hatch";
type DividerSpaceSize = "xs" | "sm" | "md" | "lg";

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentDividerProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children" | "style"> & {
        className?: string;

        orientation?: DividerOrientation; // default: "horizontal"
        thickness?: DividerThickness; // default: "hairline"
        fullWidth?: boolean; // default: true for horizontal, false for vertical

        /**
         * Visual style of the divider.
         */
        lineStyle?: IntentDividerStyle; // default: "line"

        /**
         * Only used when style="space".
         * Controls the spacer size.
         */
        spaceSize?: DividerSpaceSize; // default: "sm"

        /**
         * Optional label displayed “inside” the divider.
         * Horizontal only. Vertical: ignored.
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
        name: "lineStyle",
        description: {
            fr: "Style visuel du divider.",
            en: "Divider visual style.",
        },
        type: `"line" | "dots" | "space" | "dashed" | "fade" | "double" | "hatch"`,
        required: false,
        default: "line",
        fromSystem: false,
    },
    {
        name: "spaceSize",
        description: {
            fr: "Taille de l’espace (uniquement si style='space').",
            en: "Spacer size (only when style='space').",
        },
        type: `"xs" | "sm" | "md" | "lg"`,
        required: false,
        default: "sm",
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
        fr: "Divider intent-first (layout) : horizontal/vertical, label optionnel, styles multiples via hooks stables.",
        en: "Intent-first divider (layout): horizontal/vertical, optional label, multiple styles via stable hooks.",
    },
    since: "0.2.0",
    docs: {
        route: "/playground/components/intent-divider",
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
        "ids-divider-gap-xs",
        "ids-divider-gap-sm",
        "ids-divider-gap-md",
        "ids-divider-style-line",
        "ids-divider-style-dots",
        "ids-divider-style-space",
        "ids-divider-style-dashed",
        "ids-divider-style-fade",
        "ids-divider-style-double",
        "ids-divider-style-hatch",
        "ids-divider-space-xs",
        "ids-divider-space-sm",
        "ids-divider-space-md",
        "ids-divider-space-lg",
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

function styleClass(s: IntentDividerStyle) {
    if (s === "dots") return "ids-divider-style-dots";
    if (s === "space") return "ids-divider-style-space";
    if (s === "dashed") return "ids-divider-style-dashed";
    if (s === "fade") return "ids-divider-style-fade";
    if (s === "double") return "ids-divider-style-double";
    if (s === "hatch") return "ids-divider-style-hatch";
    return "ids-divider-style-line";
}

function spaceSizeClass(s: DividerSpaceSize) {
    if (s === "xs") return "ids-divider-space-xs";
    if (s === "md") return "ids-divider-space-md";
    if (s === "lg") return "ids-divider-space-lg";
    return "ids-divider-space-sm";
}

export function IntentDivider(props: IntentDividerProps) {
    const {
        className,

        orientation = "horizontal",
        thickness = "hairline",
        fullWidth,

        lineStyle = "line",
        spaceSize = "sm",

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
        variant: "ghost",
        ...(tone !== undefined ? { tone } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),
        disabled,
    };

    const resolved = resolveIntent(intentInput);
    const layoutProps = getIntentLayoutProps(resolved, className);

    const isHorizontal = orientation === "horizontal";
    const stretch = fullWidth !== undefined ? fullWidth : isHorizontal ? true : false;

    const hasLabel = Boolean(label) && isHorizontal;
    const isSpaceOnly = lineStyle === "space";

    const rootCls = cn(
        "intent-control intent-divider",
        isHorizontal ? "intent-divider-horizontal" : "intent-divider-vertical",
        thicknessClass(thickness),
        styleClass(lineStyle),
        isSpaceOnly && spaceSizeClass(spaceSize),
        hasLabel && "has-label",
        disabled && "is-disabled",
        stretch && (isHorizontal ? "ids-divider-fullw" : "ids-divider-fullh")
    );

    const lineCls = cn("intent-divider-line");

    // Vertical or no-label render: single line element
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
        align === "left"
            ? "ids-divider-justify-left"
            : align === "right"
              ? "ids-divider-justify-right"
              : "ids-divider-justify-center";

    return (
        <div
            {...divProps}
            {...layoutProps}
            className={cn(
                layoutProps.className,
                rootCls,
                "ids-divider-row",
                justify,
                gapClass(gap)
            )}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            <span
                aria-hidden
                className={cn(
                    lineCls,
                    align === "left" ? "ids-divider-seg-fixed" : "ids-divider-seg-flex"
                )}
            />
            <span className="intent-divider-label">{label}</span>
            <span
                aria-hidden
                className={cn(
                    lineCls,
                    align === "right" ? "ids-divider-seg-fixed" : "ids-divider-seg-flex"
                )}
            />
        </div>
    );
}
