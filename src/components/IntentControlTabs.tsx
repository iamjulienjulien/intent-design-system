"use client";

// src/components/intent/IntentControlTabs.tsx
// IntentControlTabs
// - Intent-first tabs (segmented control) for switching between views
// - Uses resolveIntent() to compute stable class hooks + CSS vars
// - Optional glow layers (like IntentSurface / IntentControlButton)
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

type TabsSize = "xs" | "sm" | "md" | "lg";

/** stable size hooks (CSS owns the actual px) */
function sizeClass(size: TabsSize) {
    switch (size) {
        case "xs":
            return "ids-tabs-xs";
        case "sm":
            return "ids-tabs-sm";
        case "lg":
            return "ids-tabs-lg";
        default:
            return "ids-tabs-md";
    }
}

type TabsOrientation = "horizontal" | "vertical";

export type IntentControlTabsItem = {
    value: string;
    label: React.ReactNode;
    disabled?: boolean;

    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;

    /** Optional aria-label override for icon-only tabs */
    ariaLabel?: string;
};

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentControlTabsProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children" | "onChange"> & {
        className?: string;

        items: IntentControlTabsItem[];

        /**
         * Controlled active value.
         * If omitted, component is uncontrolled via defaultValue.
         */
        value?: string;

        /**
         * Uncontrolled initial value.
         * Defaults to first item value if present.
         */
        defaultValue?: string;

        /**
         * Called when active tab changes.
         */
        onValueChange?: (value: string) => void;

        /**
         * Orientation (affects layout + keyboard nav).
         */
        orientation?: TabsOrientation; // default: "horizontal"

        /**
         * Size preset (padding/height/typography).
         */
        size?: TabsSize; // default: "md"

        /**
         * If true, stretches to full available width (each tab can flex).
         */
        fullWidth?: boolean; // default: false

        /**
         * If true, each tab trigger stretches equally (segmented).
         */
        equal?: boolean; // default: true

        /**
         * If true, tabs are read-only (no interaction).
         */
        readOnly?: boolean; // default: false
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_TABS_LOCAL_PROPS_TABLE: DocsPropRow[] = [
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
        name: "items",
        description: {
            fr: "Liste des onglets (value/label + options).",
            en: "Tabs items (value/label + options).",
        },
        type: "IntentControlTabsItem[]",
        required: true,
        fromSystem: false,
    },
    {
        name: "value",
        description: {
            fr: "Valeur active en mode contrôlé.",
            en: "Active value in controlled mode.",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultValue",
        description: {
            fr: "Valeur initiale en mode non contrôlé.",
            en: "Initial value in uncontrolled mode.",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "onValueChange",
        description: {
            fr: "Callback appelé quand l’onglet actif change.",
            en: "Callback fired when active tab changes.",
        },
        type: "(value: string) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "orientation",
        description: {
            fr: "Orientation (horizontal/vertical) + navigation clavier.",
            en: "Orientation (horizontal/vertical) + keyboard navigation.",
        },
        type: `"horizontal" | "vertical"`,
        required: false,
        default: "horizontal",
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille des tabs (hauteur/padding/typo).",
            en: "Tabs size (height/padding/typography).",
        },
        type: `"xs" | "sm" | "md" | "lg"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: {
            fr: "Étire le composant sur toute la largeur.",
            en: "Stretches the component to full width.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "equal",
        description: {
            fr: "Donne la même largeur à chaque onglet (segmented).",
            en: "Gives equal width to each tab (segmented).",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "readOnly",
        description: {
            fr: "Désactive l’interaction sans griser (lecture seule).",
            en: "Disables interaction without dimming (read-only).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Props natives du div (id, style, aria-*, data-*…).",
            en: "Native div props (id, style, aria-*, data-*…).",
        },
        type: "Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'onChange'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentControlTabsPropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_TABS_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlTabsIdentity: ComponentIdentity = {
    name: "IntentControlTabs",
    emoji: "🗂️",
    kind: "control",
    description: {
        fr: "Tabs intent-first : segmented control pour naviguer entre vues, stylé via resolveIntent().",
        en: "Intent-first tabs: segmented control to switch views, styled via resolveIntent().",
    },
    since: "0.2.0",
    docs: {
        route: "/playground/components/intent-control-tabs",
    },
    anatomy: {
        root: "<div role='tablist'>",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        list: ".intent-tabs-list",
        trigger: ".intent-tabs-trigger (role='tab')",
        triggerLabel: ".intent-tabs-label",
        triggerIconLeft: ".intent-tabs-icon-left",
        triggerIconRight: ".intent-tabs-icon-right",
    },
    classHooks: [
        "intent-control",
        "intent-control-tabs",
        "intent-bg",
        "intent-text",
        "intent-ring",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
        "intent-tabs-list",
        "intent-tabs-trigger",
        "intent-tabs-label",
        "intent-tabs-icon-left",
        "intent-tabs-icon-right",
        "is-active",
        "is-disabled",
        "is-readonly",
        "ids-tabs-xs",
        "ids-tabs-sm",
        "ids-tabs-md",
        "ids-tabs-lg",
        "is-vertical",
        "is-horizontal",
        "is-equal",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentControlTabs(props: IntentControlTabsProps) {
    const {
        className,

        items,

        value,
        defaultValue,
        onValueChange,

        orientation = "horizontal",
        size = "md",

        fullWidth = false,
        equal = true,
        readOnly = false,

        // ✅ Pull DS props OUT so they never reach the DOM
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: disabledProp,

        // ✅ Only real DOM props remain here
        ...divProps
    } = props;

    const isControlled = typeof value === "string";

    const initialUncontrolled =
        defaultValue ??
        (items && items.length > 0 && typeof items[0]?.value === "string" ? items[0].value : "");

    const [uncontrolled, setUncontrolled] = React.useState<string>(initialUncontrolled);

    const active = isControlled ? (value as string) : uncontrolled;

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
    const surfaceProps = getIntentControlProps(resolved, className);

    /* ============================================================================
       ✨ Glow layers (same rules as IntentControlButton)
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
       🧠 State + interactions
    ============================================================================ */

    function setActive(next: string) {
        if (disabled || readOnly) return;
        if (!isControlled) setUncontrolled(next);
        onValueChange?.(next);
    }

    const isHorizontal = orientation === "horizontal";

    // Roving focus: keep it simple and stable.
    const activeIndex = Math.max(
        0,
        items.findIndex((it) => it.value === active)
    );

    function findNextEnabled(start: number, dir: 1 | -1): number {
        if (items.length === 0) return 0;
        let i = start;
        for (let step = 0; step < items.length; step++) {
            i = (i + dir + items.length) % items.length;
            if (!items[i]?.disabled) return i;
        }
        return start;
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        divProps.onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (disabled || readOnly) return;

        const key = e.key;

        const prevKey = isHorizontal ? "ArrowLeft" : "ArrowUp";
        const nextKey = isHorizontal ? "ArrowRight" : "ArrowDown";

        if (key !== prevKey && key !== nextKey && key !== "Home" && key !== "End") return;

        e.preventDefault();

        let nextIndex = activeIndex;

        if (key === prevKey) nextIndex = findNextEnabled(activeIndex, -1);
        if (key === nextKey) nextIndex = findNextEnabled(activeIndex, 1);
        if (key === "Home") nextIndex = findNextEnabled(-1, 1);
        if (key === "End") nextIndex = findNextEnabled(0, -1);

        const next = items[nextIndex]?.value;
        if (typeof next === "string") setActive(next);
    }

    /* ============================================================================
       🧱 Class hooks (stable)
    ============================================================================ */

    const rootCls = cn(
        "intent-control intent-control-tabs",
        "relative",
        "rounded-ids-2xl",
        "transition",
        sizeClass(size),
        fullWidth && "w-full",
        equal && "is-equal",
        isHorizontal ? "is-horizontal" : "is-vertical",
        disabled && "is-disabled",
        readOnly && "is-readonly"
    );

    const listCls = cn(
        "intent-tabs-list",
        "relative z-10",
        isHorizontal ? "inline-flex items-center" : "flex flex-col",
        equal ? "w-full" : ""
    );

    return (
        <div
            {...divProps}
            {...surfaceProps}
            className={cn(surfaceProps.className, rootCls)}
            role="tablist"
            aria-orientation={orientation}
            aria-disabled={disabled || undefined}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
            onKeyDown={onKeyDown}
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

            <div className={listCls}>
                {items.map((it, i) => {
                    const isActive = it.value === active;
                    const isItemDisabled = Boolean(it.disabled) || disabled;

                    // Roving tabindex: focus active tab by default (unless disabled)
                    const tabIndex = isItemDisabled
                        ? -1
                        : isActive
                          ? 0
                          : equal
                            ? -1
                            : i === 0
                              ? 0
                              : -1;

                    return (
                        <button
                            key={it.value}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-disabled={isItemDisabled || undefined}
                            tabIndex={tabIndex}
                            className={cn(
                                "intent-tabs-trigger",
                                equal && "flex-1",
                                isActive && "is-active",
                                isItemDisabled && "is-disabled"
                            )}
                            onClick={(e) => {
                                e.preventDefault();
                                if (isItemDisabled || readOnly) return;
                                setActive(it.value);
                            }}
                            title={typeof it.label === "string" ? it.label : undefined}
                            aria-label={it.ariaLabel}
                            data-value={it.value}
                        >
                            {it.leftIcon ? (
                                <span className="intent-tabs-icon-left" aria-hidden>
                                    {it.leftIcon}
                                </span>
                            ) : null}

                            <span className="intent-tabs-label">{it.label}</span>

                            {it.rightIcon ? (
                                <span className="intent-tabs-icon-right" aria-hidden>
                                    {it.rightIcon}
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
