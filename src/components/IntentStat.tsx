"use client";

// src/components/intent/IntentStat.tsx
// IntentStat
// - Metric/stat block for dashboards: value + label + optional delta/trend
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

type StatSize = "sm" | "md" | "lg";
type StatLayout = "vertical" | "horizontal";
type StatAlign = "left" | "center" | "right";
type StatTrend = "up" | "down" | "neutral";

function sizeClass(size: StatSize) {
    switch (size) {
        case "sm":
            return "ids-stat-sm";
        case "lg":
            return "ids-stat-lg";
        default:
            return "ids-stat-md";
    }
}

function layoutClass(layout: StatLayout) {
    return layout === "horizontal" ? "ids-stat-horizontal" : "ids-stat-vertical";
}

function alignClass(align: StatAlign) {
    if (align === "center") return "ids-stat-center";
    if (align === "right") return "ids-stat-right";
    return "ids-stat-left";
}

function trendClass(trend: StatTrend) {
    if (trend === "up") return "is-trend-up";
    if (trend === "down") return "is-trend-down";
    return "is-trend-neutral";
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentStatProps<T extends React.ElementType = "div"> = IntentInput & {
    as?: T;
    className?: string;

    /**
     * Main metric value.
     * Can be a string ("4 312") or a richer node (formatted with <strong>, etc.)
     */
    value?: React.ReactNode;

    /**
     * Metric label (caption).
     */
    label?: React.ReactNode;

    /**
     * Optional delta displayed next to the value (or under it depending on layout).
     * Example: "+12%" or "−3.2k"
     */
    delta?: React.ReactNode;

    /**
     * Optional delta label (small text, e.g. "vs last week").
     */
    deltaLabel?: React.ReactNode;

    /**
     * Trend direction used for delta styling (not a chart).
     */
    trend?: StatTrend; // default: "neutral"

    /**
     * Leading icon (left/top depending on layout).
     */
    icon?: React.ReactNode;

    /**
     * Optional slot on the right (actions, mini indicator, kebab menu, etc.)
     */
    rightSlot?: React.ReactNode;

    /**
     * Layout controls
     */
    size?: StatSize; // default: "md"
    layout?: StatLayout; // default: "vertical"
    align?: StatAlign; // default: "left"

    /**
     * Stretch to full width
     */
    fullWidth?: boolean;

    /**
     * Loading state (renders skeleton blocks)
     */
    loading?: boolean;

    /**
     * Accessibility: default role is "group".
     */
    role?: React.AriaRole;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "color">;

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_STAT_LOCAL_PROPS_TABLE: DocsPropRow[] = [
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
        name: "value",
        description: {
            fr: "Valeur principale affichée (métrique).",
            en: "Main value displayed (metric).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "label",
        description: { fr: "Label (caption) de la métrique.", en: "Metric label (caption)." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "delta",
        description: { fr: "Variation optionnelle (ex: +12%).", en: "Optional delta (e.g. +12%)." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "deltaLabel",
        description: {
            fr: "Texte optionnel lié au delta (ex: vs semaine dernière).",
            en: "Optional delta label (e.g. vs last week).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "trend",
        description: { fr: "Direction du delta (style).", en: "Delta direction (styling)." },
        type: `"up" | "down" | "neutral"`,
        required: false,
        default: "neutral",
        fromSystem: false,
    },
    {
        name: "icon",
        description: {
            fr: "Icône principale (avant la valeur/label).",
            en: "Leading icon (before value/label).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "rightSlot",
        description: {
            fr: "Slot à droite (actions, mini-indicator, etc.).",
            en: "Right slot (actions, mini-indicator, etc.).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille (padding, typo, gaps).",
            en: "Size (padding, typography, gaps).",
        },
        type: `"sm" | "md" | "lg"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "layout",
        description: {
            fr: "Disposition (verticale ou horizontale).",
            en: "Layout (vertical or horizontal).",
        },
        type: `"vertical" | "horizontal"`,
        required: false,
        default: "vertical",
        fromSystem: false,
    },
    {
        name: "align",
        description: { fr: "Alignement du contenu.", en: "Content alignment." },
        type: `"left" | "center" | "right"`,
        required: false,
        default: "left",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: {
            fr: "Étire la stat sur toute la largeur.",
            en: "Stretches the stat to full width.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "loading",
        description: { fr: "État loading avec skeleton.", en: "Loading state with skeleton." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "role",
        description: { fr: "Rôle ARIA (par défaut: group).", en: "ARIA role (default: group)." },
        type: "React.AriaRole",
        required: false,
        default: "group",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Toutes les props natives du tag rendu (id, style, onClick, aria-*, data-*…).",
            en: "All native props of the rendered tag (id, style, onClick, aria-*, data-*…).",
        },
        type: "Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'color'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentStatPropsTable: DocsPropRow[] = [
    ...INTENT_STAT_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentStatIdentity: ComponentIdentity = {
    name: "IntentStat",
    kind: "data",
    description: {
        fr: "Bloc métrique intent-first: valeur + label + delta, avec hooks CSS stables et glow optionnel.",
        en: "Intent-first stat block: value + label + delta, with stable CSS hooks and optional glow.",
    },
    since: "0.3.0",
    docs: { route: "/playground/components/IntentStat" },
    anatomy: {
        root: "Tag (as)",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        header: ".intent-stat-header",
        icon: ".intent-stat-icon",
        body: ".intent-stat-body",
        value: ".intent-stat-value",
        label: ".intent-stat-label",
        delta: ".intent-stat-delta",
        deltaLabel: ".intent-stat-delta-label",
        rightSlot: ".intent-stat-right",
        skeleton: ".intent-stat-skeleton",
    },
    classHooks: [
        "intent-control",
        "intent-stat",
        "intent-bg",
        "intent-ink",
        "intent-border",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
        "is-disabled",
        "is-loading",
        "ids-stat-sm",
        "ids-stat-md",
        "ids-stat-lg",
        "ids-stat-vertical",
        "ids-stat-horizontal",
        "ids-stat-left",
        "ids-stat-center",
        "ids-stat-right",
        "is-trend-up",
        "is-trend-down",
        "is-trend-neutral",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentStat<T extends React.ElementType = "div">(props: IntentStatProps<T>) {
    const {
        as,
        className,

        value,
        label,
        delta,
        deltaLabel,

        trend = "neutral",

        icon,
        rightSlot,

        size = "md",
        layout = "vertical",
        align = "left",
        fullWidth = false,

        loading = false,

        role = "group",

        // ✅ DS props pulled OUT
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        toneStep,
        disabled: disabledProp,

        // ✅ DOM props only
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

    /* ============================================================================
       ✨ Glow layers (same rules as IntentSurface / controls)
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
       🧱 Class hooks (stable)
    ============================================================================ */

    const Tag = (as ?? "div") as React.ElementType;

    const rootCls = cn(
        "intent-control intent-stat",
        "relative",
        "rounded-ids-2xl",
        "select-none",
        sizeClass(size),
        layoutClass(layout),
        alignClass(align),
        trendClass(trend),
        fullWidth && "w-full",
        disabled && "is-disabled",
        loading && "is-loading"
    );

    const showDelta = delta !== undefined && delta !== null;

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
            data-tonestep={resolved.toneStep}
        >
            {/* Glow layers */}
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
            <div className="relative z-10 intent-stat-inner">
                <div className="intent-stat-header">
                    {icon ? (
                        <div className="intent-stat-icon" aria-hidden>
                            {icon}
                        </div>
                    ) : null}

                    <div className="intent-stat-body">
                        {loading ? (
                            <div className="intent-stat-skeleton" aria-hidden>
                                <span className="intent-stat-skel intent-stat-skel-value" />
                                <span className="intent-stat-skel intent-stat-skel-label" />
                                {showDelta ? (
                                    <span className="intent-stat-skel intent-stat-skel-delta" />
                                ) : null}
                            </div>
                        ) : (
                            <>
                                <div className="intent-stat-main">
                                    <div className="intent-stat-value">{value}</div>

                                    {showDelta ? (
                                        <div className="intent-stat-delta" aria-label="Delta">
                                            {delta}
                                        </div>
                                    ) : null}
                                </div>

                                {label ? <div className="intent-stat-label">{label}</div> : null}

                                {deltaLabel ? (
                                    <div className="intent-stat-delta-label">{deltaLabel}</div>
                                ) : null}
                            </>
                        )}
                    </div>

                    {rightSlot ? <div className="intent-stat-right">{rightSlot}</div> : null}
                </div>
            </div>
        </Tag>
    );
}
