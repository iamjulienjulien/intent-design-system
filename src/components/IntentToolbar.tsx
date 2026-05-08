"use client";

// src/components/intent/IntentToolbar.tsx
// IntentToolbar
// - Intent-first toolbar (layout surface): left/center/right slots, wrap, align, density
// - Uses resolveIntent() + getIntentSurfaceProps() for stable hooks + CSS vars
// - Supports glow layers like IntentSurface / controls
// - No dynamic Tailwind classes: only stable hooks + CSS tokens
// - Designed for app headers, filters bars, action rows, cockpit toolbars

import * as React from "react";
import { resolveIntent, getIntentSurfaceProps } from "CORE";
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

type ToolbarSize = "xs" | "sm" | "md" | "lg";
type ToolbarAlign = "start" | "center" | "end";
type ToolbarJustify = "between" | "start" | "center" | "end";
type ToolbarWrap = "wrap" | "nowrap";

function sizeClass(size: ToolbarSize) {
    switch (size) {
        case "xs":
            return "ids-toolbar-xs";
        case "sm":
            return "ids-toolbar-sm";
        case "lg":
            return "ids-toolbar-lg";
        default:
            return "ids-toolbar-md";
    }
}

function alignClass(align: ToolbarAlign) {
    if (align === "center") return "ids-toolbar-align-center";
    if (align === "end") return "ids-toolbar-align-end";
    return "ids-toolbar-align-start";
}

function justifyClass(justify: ToolbarJustify) {
    if (justify === "start") return "ids-toolbar-justify-start";
    if (justify === "center") return "ids-toolbar-justify-center";
    if (justify === "end") return "ids-toolbar-justify-end";
    return "ids-toolbar-justify-between";
}

function wrapClass(wrap: ToolbarWrap) {
    return wrap === "nowrap" ? "ids-toolbar-nowrap" : "ids-toolbar-wrap";
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentToolbarProps<T extends React.ElementType = "div"> = IntentInput & {
    as?: T;
    className?: string;

    /**
     * Left, center and right zones.
     * - left: usually title, breadcrumbs, tabs, filters
     * - center: optional (search, segmented, contextual info)
     * - right: actions (buttons, toggles, indicators)
     */
    leftSlot?: React.ReactNode;
    centerSlot?: React.ReactNode;
    rightSlot?: React.ReactNode;

    /**
     * Layout controls
     */
    size?: ToolbarSize; // default: "md"
    align?: ToolbarAlign; // default: "center"
    justify?: ToolbarJustify; // default: "between"
    wrap?: ToolbarWrap; // default: "wrap"

    /**
     * Visual options
     */
    fullWidth?: boolean;
    sticky?: boolean;
    stickyOffset?: number; // default: 0 (px)
    showDivider?: boolean; // default: false (bottom hairline)

    /**
     * Accessibility: default role is "toolbar"
     */
    role?: React.AriaRole;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "color">;

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_TOOLBAR_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "as",
        description: { fr: "Élément HTML rendu (polymorphique).", en: "Rendered HTML element." },
        type: "T extends React.ElementType",
        required: false,
        default: "div",
        fromSystem: false,
    },
    {
        name: "className",
        description: { fr: "Classes CSS additionnelles au root.", en: "Additional root classes." },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "leftSlot",
        description: { fr: "Zone gauche (titre, filtres, tabs).", en: "Left zone." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "centerSlot",
        description: {
            fr: "Zone centrale (search, segmented, infos contextuelles).",
            en: "Center zone.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "rightSlot",
        description: { fr: "Zone droite (actions).", en: "Right zone (actions)." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "size",
        description: { fr: "Taille (padding, gap, typo).", en: "Size (padding, gap, type)." },
        type: `"xs" | "sm" | "md" | "lg"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "align",
        description: {
            fr: "Alignement vertical des items.",
            en: "Vertical alignment of items.",
        },
        type: `"start" | "center" | "end"`,
        required: false,
        default: "center",
        fromSystem: false,
    },
    {
        name: "justify",
        description: {
            fr: "Répartition horizontale des zones.",
            en: "Horizontal distribution of zones.",
        },
        type: `"between" | "start" | "center" | "end"`,
        required: false,
        default: "between",
        fromSystem: false,
    },
    {
        name: "wrap",
        description: { fr: "Retour à la ligne ou non.", en: "Wrap or not." },
        type: `"wrap" | "nowrap"`,
        required: false,
        default: "wrap",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: { fr: "Étire la toolbar en largeur.", en: "Stretches to full width." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "sticky",
        description: { fr: "Toolbar sticky en haut.", en: "Sticky toolbar at top." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "stickyOffset",
        description: { fr: "Offset sticky en px.", en: "Sticky offset in px." },
        type: "number",
        required: false,
        default: "0",
        fromSystem: false,
    },
    {
        name: "showDivider",
        description: { fr: "Hairline divider en bas.", en: "Bottom hairline divider." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "role",
        description: {
            fr: "Rôle ARIA (par défaut: toolbar).",
            en: "ARIA role (default: toolbar).",
        },
        type: "React.AriaRole",
        required: false,
        default: "toolbar",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Props natives du tag rendu (id, style, onClick, aria-*, data-*…).",
            en: "Native props of the rendered tag (id, style, onClick, aria-*, data-*…).",
        },
        type: "Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'color'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentToolbarPropsTable: DocsPropRow[] = [
    ...INTENT_TOOLBAR_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentToolbarIdentity: ComponentIdentity = {
    name: "IntentToolbar",
    kind: "layout",
    description: {
        fr: "Toolbar intent-first: zones left/center/right, wrap, densité, sticky optionnel, glow-ready.",
        en: "Intent-first toolbar: left/center/right zones, wrap, density, optional sticky, glow-ready.",
    },
    since: "0.3.2",
    docs: { route: "/playground/components/IntentToolbar" },
    anatomy: {
        root: "Tag (as)",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        row: ".intent-toolbar-row",
        left: ".intent-toolbar-left",
        center: ".intent-toolbar-center",
        right: ".intent-toolbar-right",
        divider: ".intent-toolbar-divider",
    },
    classHooks: [
        "intent-toolbar",
        "intent-toolbar-row",
        "intent-toolbar-left",
        "intent-toolbar-center",
        "intent-toolbar-right",
        "intent-toolbar-divider",
        "ids-toolbar-xs",
        "ids-toolbar-sm",
        "ids-toolbar-md",
        "ids-toolbar-lg",
        "ids-toolbar-wrap",
        "ids-toolbar-nowrap",
        "ids-toolbar-align-start",
        "ids-toolbar-align-center",
        "ids-toolbar-align-end",
        "ids-toolbar-justify-between",
        "ids-toolbar-justify-start",
        "ids-toolbar-justify-center",
        "ids-toolbar-justify-end",
        "is-sticky",
        "is-disabled",
        "has-divider",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentToolbar<T extends React.ElementType = "div">(props: IntentToolbarProps<T>) {
    const {
        as,
        className,

        leftSlot,
        centerSlot,
        rightSlot,

        size = "md",
        align = "center",
        justify = "between",
        wrap = "wrap",

        fullWidth = false,
        sticky = false,
        stickyOffset = 0,
        showDivider = false,

        role = "toolbar",

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
    const surfaceProps = getIntentSurfaceProps(resolved, className);

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
        "intent-toolbar",
        "relative",
        "rounded-ids-2xl",
        sizeClass(size),
        alignClass(align),
        justifyClass(justify),
        wrapClass(wrap),
        fullWidth && "w-full",
        sticky && "is-sticky",
        showDivider && "has-divider",
        disabled && "is-disabled"
    );

    const stickyStyle: React.CSSProperties | undefined = sticky
        ? ({ ["--ids-toolbar-sticky-offset" as any]: `${stickyOffset}px` } as any)
        : undefined;

    const hasAny = Boolean(leftSlot || centerSlot || rightSlot);

    return (
        <Tag
            {...(restProps as Omit<React.ComponentPropsWithoutRef<T>, "className">)}
            {...surfaceProps}
            className={cn(surfaceProps.className, rootCls)}
            style={{ ...(surfaceProps.style ?? {}), ...(stickyStyle ?? {}) }}
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
            <div className="relative z-10 intent-toolbar-row">
                <div className="intent-toolbar-left">{leftSlot}</div>
                <div className="intent-toolbar-center">{centerSlot}</div>
                <div className="intent-toolbar-right">{rightSlot}</div>
            </div>

            {showDivider && hasAny ? <div className="intent-toolbar-divider" aria-hidden /> : null}
        </Tag>
    );
}
