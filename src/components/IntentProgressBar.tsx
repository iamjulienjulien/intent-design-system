"use client";

// src/components/intent/IntentProgressBar.tsx
// IntentProgressBar
// - Intent-first progress bar
// - Supports determinate / indeterminate states
// - Horizontal or vertical
// - Optional label / caption / value label / marker
// - Uses resolveIntent() to compute stable class hooks + CSS vars
// - Supports glow layers like IntentSurface / controls
// - No dynamic Tailwind classes: only stable hooks + CSS tokens

import * as React from "react";

import { resolveIntent, getIntentControlProps } from "CORE";
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

export type IntentProgressBarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type IntentProgressBarOrientation = "horizontal" | "vertical";
export type IntentProgressBarRadius = "sm" | "md" | "lg" | "full";
export type IntentProgressBarValuePosition = "inside" | "outside" | "none";

function sizeClass(size: IntentProgressBarSize) {
    switch (size) {
        case "xs":
            return "ids-progress-xs";
        case "sm":
            return "ids-progress-sm";
        case "lg":
            return "ids-progress-lg";
        case "xl":
            return "ids-progress-xl";
        default:
            return "ids-progress-md";
    }
}

function orientationClass(orientation: IntentProgressBarOrientation) {
    return orientation === "vertical" ? "ids-progress-vertical" : "ids-progress-horizontal";
}

function radiusClass(radius: IntentProgressBarRadius) {
    if (radius === "sm") return "ids-progress-radius-sm";
    if (radius === "md") return "ids-progress-radius-md";
    if (radius === "lg") return "ids-progress-radius-lg";
    return "ids-progress-radius-full";
}

function valuePositionClass(valuePosition: IntentProgressBarValuePosition) {
    if (valuePosition === "inside") return "ids-progress-value-inside";
    if (valuePosition === "outside") return "ids-progress-value-outside";
    return "ids-progress-value-none";
}

function clampProgress(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
}

function formatPercent(value: number, min: number, max: number, decimals: number) {
    if (max <= min) return `0%`;
    const ratio = ((value - min) / (max - min)) * 100;
    return `${ratio.toFixed(decimals)}%`;
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentProgressBarProps<T extends React.ElementType = "div"> = IntentInput & {
    as?: T;
    className?: string;

    /**
     * Current value for determinate mode.
     */
    value?: number;

    /**
     * Min / max range.
     */
    min?: number;
    max?: number;

    /**
     * If true, renders an indeterminate progress state.
     */
    indeterminate?: boolean;

    /**
     * If true, animates the fill even in determinate mode.
     */
    animated?: boolean;

    /**
     * If true, renders subtle stripes on the fill.
     */
    striped?: boolean;

    /**
     * If true, adds a subtle breathing pulse on the fill.
     */
    pulse?: boolean;

    /**
     * Optional marker position in range units.
     * Useful for target / milestone / checkpoint.
     */
    markerValue?: number | null;

    /**
     * Optional textual content around the bar.
     */
    label?: React.ReactNode;
    caption?: React.ReactNode;
    valueLabel?: React.ReactNode;

    /**
     * If true, shows an automatic percent label.
     */
    showValue?: boolean;

    /**
     * Decimals for the auto percent label.
     */
    valueDecimals?: number;

    /**
     * Label placement behavior.
     */
    valuePosition?: IntentProgressBarValuePosition;

    /**
     * Layout / visuals.
     */
    size?: IntentProgressBarSize;
    orientation?: IntentProgressBarOrientation;
    radius?: IntentProgressBarRadius;
    fullWidth?: boolean;
    inline?: boolean;

    /**
     * Optional fixed track length.
     * - horizontal => width
     * - vertical => height
     */
    length?: number | string;

    /**
     * Optional thicker frame / soft container styling.
     */
    framed?: boolean;

    /**
     * Optional icon near the label block.
     */
    icon?: React.ReactNode;

    /**
     * Accessibility
     */
    role?: React.AriaRole;
    ariaLabel?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children" | "color">;

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_PROGRESS_BAR_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "as",
        description: {
            fr: "Élément HTML rendu (polymorphique).",
            en: "Rendered HTML element (polymorphic).",
        },
        type: "T extends React.ElementType",
        required: false,
        default: "div",
        fromSystem: false,
    },
    {
        name: "value",
        description: {
            fr: "Valeur actuelle en mode déterminé.",
            en: "Current value in determinate mode.",
        },
        type: "number",
        required: false,
        default: "0",
        fromSystem: false,
    },
    {
        name: "min / max",
        description: {
            fr: "Bornes de la plage de progression.",
            en: "Progress range bounds.",
        },
        type: "number / number",
        required: false,
        default: "0 / 100",
        fromSystem: false,
    },
    {
        name: "indeterminate",
        description: {
            fr: "Affiche un état indéterminé animé.",
            en: "Displays an animated indeterminate state.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "animated",
        description: {
            fr: "Anime la barre même en mode déterminé.",
            en: "Animates the bar even in determinate mode.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "striped",
        description: {
            fr: "Ajoute un motif rayé subtil sur le fill.",
            en: "Adds a subtle striped pattern on the fill.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "pulse",
        description: {
            fr: "Ajoute une respiration lumineuse légère sur le fill.",
            en: "Adds a subtle luminous pulse on the fill.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "markerValue",
        description: {
            fr: "Position optionnelle d’un repère / jalon.",
            en: "Optional marker / milestone position.",
        },
        type: "number | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "label / caption / valueLabel",
        description: {
            fr: "Contenus textuels autour de la barre.",
            en: "Textual content around the bar.",
        },
        type: "React.ReactNode / React.ReactNode / React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "showValue",
        description: {
            fr: "Affiche automatiquement le pourcentage.",
            en: "Automatically displays percentage.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "valueDecimals",
        description: {
            fr: "Nombre de décimales du pourcentage auto.",
            en: "Number of decimals for auto percentage.",
        },
        type: "number",
        required: false,
        default: "0",
        fromSystem: false,
    },
    {
        name: "valuePosition",
        description: {
            fr: "Position du texte de valeur.",
            en: "Value text position.",
        },
        type: `"inside" | "outside" | "none"`,
        required: false,
        default: `"outside"`,
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille générale de la progress bar.",
            en: "Overall progress bar size.",
        },
        type: `"xs" | "sm" | "md" | "lg" | "xl"`,
        required: false,
        default: `"md"`,
        fromSystem: false,
    },
    {
        name: "orientation",
        description: {
            fr: "Orientation horizontale ou verticale.",
            en: "Horizontal or vertical orientation.",
        },
        type: `"horizontal" | "vertical"`,
        required: false,
        default: `"horizontal"`,
        fromSystem: false,
    },
    {
        name: "radius",
        description: {
            fr: "Rayon des coins.",
            en: "Corner radius preset.",
        },
        type: `"sm" | "md" | "lg" | "full"`,
        required: false,
        default: `"full"`,
        fromSystem: false,
    },
    {
        name: "fullWidth / inline",
        description: {
            fr: "Gestion de la largeur et du layout inline.",
            en: "Width and inline layout behavior.",
        },
        type: "boolean / boolean",
        required: false,
        default: "false / false",
        fromSystem: false,
    },
    {
        name: "length",
        description: {
            fr: "Longueur fixe de la track (width ou height selon orientation).",
            en: "Fixed track length (width or height depending on orientation).",
        },
        type: "number | string",
        required: false,
        fromSystem: false,
    },
    {
        name: "framed",
        description: {
            fr: "Ajoute un cadre / container visuel subtil.",
            en: "Adds a subtle visual frame / container.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "icon",
        description: {
            fr: "Icône optionnelle dans le header de contenu.",
            en: "Optional icon in the content header.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "role / ariaLabel",
        description: {
            fr: "Accessibilité ARIA du composant.",
            en: "ARIA accessibility props.",
        },
        type: "React.AriaRole / string",
        required: false,
        default: `"progressbar" / undefined`,
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Toutes les props natives du tag rendu.",
            en: "All native props of the rendered tag.",
        },
        type: "Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children' | 'color'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentProgressBarPropsTable: DocsPropRow[] = [
    ...INTENT_PROGRESS_BAR_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentProgressBarIdentity: ComponentIdentity = {
    name: "IntentProgressBar",
    kind: "feedback",
    description: {
        fr: "Progress bar intent-first avec mode déterminé/indéterminé, labels, marker, stripes, pulse et glow optionnel.",
        en: "Intent-first progress bar with determinate/indeterminate mode, labels, marker, stripes, pulse and optional glow.",
    },
    since: "0.3.0",
    docs: {
        route: "/playground/components/intent-progress-bar",
    },
    anatomy: {
        root: "Tag (as)",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        inner: ".intent-progress-inner",
        header: ".intent-progress-header",
        icon: ".intent-progress-icon",
        label: ".intent-progress-label",
        caption: ".intent-progress-caption",
        track: ".intent-progress-track",
        fill: ".intent-progress-fill",
        marker: ".intent-progress-marker",
        value: ".intent-progress-value",
    },
    classHooks: [
        "intent-control",
        "intent-progress",
        "intent-progress-inner",
        "intent-progress-header",
        "intent-progress-icon",
        "intent-progress-copy",
        "intent-progress-label",
        "intent-progress-caption",
        "intent-progress-main",
        "intent-progress-track",
        "intent-progress-fill",
        "intent-progress-marker",
        "intent-progress-value",
        "intent-progress-valueText",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
        "is-disabled",
        "is-indeterminate",
        "is-animated",
        "is-striped",
        "is-pulse",
        "is-framed",
        "ids-progress-xs",
        "ids-progress-sm",
        "ids-progress-md",
        "ids-progress-lg",
        "ids-progress-xl",
        "ids-progress-horizontal",
        "ids-progress-vertical",
        "ids-progress-radius-sm",
        "ids-progress-radius-md",
        "ids-progress-radius-lg",
        "ids-progress-radius-full",
        "ids-progress-value-inside",
        "ids-progress-value-outside",
        "ids-progress-value-none",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentProgressBar<T extends React.ElementType = "div">(
    props: IntentProgressBarProps<T>
) {
    const {
        as,
        className,

        value = 0,
        min = 0,
        max = 100,
        indeterminate = false,
        animated = true,
        striped = false,
        pulse = false,
        markerValue = null,

        label,
        caption,
        valueLabel,
        showValue = false,
        valueDecimals = 0,
        valuePosition = "outside",

        size = "md",
        orientation = "horizontal",
        radius = "full",
        fullWidth = false,
        inline = false,
        length,
        framed = false,
        icon,

        role = "progressbar",
        ariaLabel,

        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        toneStep,
        disabled: disabledProp,

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
        ...(toneStep !== undefined ? { toneStep } : {}),
        disabled,
    };

    const resolved = resolveIntent(intentInput);
    const controlProps = getIntentControlProps(resolved, className);

    const safeMax = max <= min ? min + 1 : max;
    const safeValue = clampProgress(value, min, safeMax);
    const ratio = indeterminate ? 0 : (safeValue - min) / (safeMax - min);
    const percent = clampProgress(ratio * 100, 0, 100);

    const markerPercent =
        markerValue === null || markerValue === undefined
            ? null
            : clampProgress(((markerValue - min) / (safeMax - min)) * 100, 0, 100);

    const computedValueLabel =
        valueLabel ?? (showValue ? formatPercent(safeValue, min, safeMax, valueDecimals) : null);

    /* ============================================================================
       ✨ Glow layers
    ============================================================================ */

    const hasGlow = Boolean(resolved.glowBackground);
    const v = resolved.variant;

    const glowAllowed = hasGlow && v !== "ghost";
    const isGlowed = resolved.intent === "glowed";

    const allowFillGlow = glowAllowed && (isGlowed || v === "flat" || v === "elevated");
    const allowBorderGlow = glowAllowed && (v === "outlined" || v === "elevated");

    const readOpacity = (key: "--intent-glow-fill-opacity" | "--intent-glow-border-opacity") => {
        const raw = resolved.style?.[key] ?? "0";
        const n = Number(raw.toString());
        return Number.isFinite(n) ? n : 0;
    };

    /* ============================================================================
       🧱 Classes + styles
    ============================================================================ */

    const Tag = (as ?? "div") as React.ElementType;

    const lengthStyle: React.CSSProperties | undefined =
        length === undefined
            ? undefined
            : orientation === "vertical"
              ? { height: typeof length === "number" ? `${length}px` : length }
              : { width: typeof length === "number" ? `${length}px` : length };

    const fillStyle: React.CSSProperties =
        orientation === "vertical"
            ? ({ ["--ids-progress-fill-size" as string]: `${percent}%` } as React.CSSProperties)
            : ({ ["--ids-progress-fill-size" as string]: `${percent}%` } as React.CSSProperties);

    const markerStyle: React.CSSProperties | undefined =
        markerPercent === null
            ? undefined
            : orientation === "vertical"
              ? ({
                    ["--ids-progress-marker-position" as string]: `${markerPercent}%`,
                } as React.CSSProperties)
              : ({
                    ["--ids-progress-marker-position" as string]: `${markerPercent}%`,
                } as React.CSSProperties);

    const rootCls = cn(
        "intent-control intent-progress",
        "relative min-w-0",
        sizeClass(size),
        orientationClass(orientation),
        radiusClass(radius),
        valuePositionClass(valuePosition),
        fullWidth && "w-full",
        inline && "inline-flex",
        indeterminate && "is-indeterminate",
        animated && "is-animated",
        striped && "is-striped",
        pulse && "is-pulse",
        framed && "is-framed",
        disabled && "is-disabled"
    );

    const hasHeader = Boolean(
        label || caption || icon || (computedValueLabel && valuePosition === "outside")
    );

    return (
        <Tag
            {...(restProps as Omit<React.ComponentPropsWithoutRef<T>, "className">)}
            {...controlProps}
            className={cn(controlProps.className, rootCls)}
            role={role}
            aria-label={ariaLabel}
            aria-disabled={disabled || undefined}
            aria-valuemin={indeterminate ? undefined : min}
            aria-valuemax={indeterminate ? undefined : safeMax}
            aria-valuenow={indeterminate ? undefined : safeValue}
            aria-valuetext={
                typeof computedValueLabel === "string"
                    ? computedValueLabel
                    : indeterminate
                      ? "Loading"
                      : undefined
            }
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
            data-tonestep={resolved.toneStep}
        >
            {glowAllowed ? (
                <>
                    {allowFillGlow ? (
                        <span
                            aria-hidden
                            className="intent-glow-layer intent-glow-fill"
                            style={{ opacity: readOpacity("--intent-glow-fill-opacity") }}
                        />
                    ) : null}

                    {allowBorderGlow ? (
                        <span
                            aria-hidden
                            className="intent-glow-layer intent-glow-border"
                            style={{
                                opacity: readOpacity("--intent-glow-border-opacity"),
                                borderRadius: "inherit",
                            }}
                        />
                    ) : null}
                </>
            ) : null}

            <div className="intent-progress-inner relative z-10">
                {hasHeader ? (
                    <div className="intent-progress-header">
                        <div className="intent-progress-copy">
                            {icon ? (
                                <div className="intent-progress-icon" aria-hidden>
                                    {icon}
                                </div>
                            ) : null}

                            <div className="intent-progress-copyText">
                                {label ? (
                                    <div className="intent-progress-label">{label}</div>
                                ) : null}
                                {caption ? (
                                    <div className="intent-progress-caption">{caption}</div>
                                ) : null}
                            </div>
                        </div>

                        {computedValueLabel && valuePosition === "outside" ? (
                            <div className="intent-progress-value intent-progress-valueText">
                                {computedValueLabel}
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <div className="intent-progress-main">
                    <div className="intent-progress-track" style={lengthStyle}>
                        <div className="intent-progress-fill" style={fillStyle}>
                            {computedValueLabel && valuePosition === "inside" && !indeterminate ? (
                                <span className="intent-progress-value intent-progress-valueText intent-progress-valueInside">
                                    {computedValueLabel}
                                </span>
                            ) : null}
                        </div>

                        {markerPercent !== null ? (
                            <span
                                aria-hidden
                                className="intent-progress-marker"
                                style={markerStyle}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        </Tag>
    );
}

export default IntentProgressBar;
