"use client";

// src/components/intent/IntentControlToggle.tsx
// IntentControlToggle
// - Intent-first toggle (switch) control
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

type ToggleSize = "xs" | "sm" | "md" | "lg";

/** stable size hooks (CSS owns the actual px) */
function sizeClass(size: ToggleSize) {
    switch (size) {
        case "xs":
            return "ids-toggle-xs";
        case "sm":
            return "ids-toggle-sm";
        case "lg":
            return "ids-toggle-lg";
        default:
            return "ids-toggle-md";
    }
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentControlToggleProps = IntentInput &
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children" | "onChange"> & {
        className?: string;

        /**
         * Controlled checked state.
         * If omitted, component is uncontrolled via defaultChecked.
         */
        checked?: boolean;

        /**
         * Uncontrolled initial value.
         */
        defaultChecked?: boolean;

        /**
         * Change callback (fires for both controlled/uncontrolled).
         */
        onCheckedChange?: (checked: boolean) => void;

        /**
         * Optional label displayed on the right of the toggle.
         */
        label?: React.ReactNode;

        /**
         * Optional helper/description displayed under the label.
         */
        description?: React.ReactNode;

        /**
         * Size preset (affects track/thumb dimensions + typography).
         */
        size?: ToggleSize; // default: "md"

        /**
         * If true, stretches to full available width (label area expands).
         */
        fullWidth?: boolean; // default: false
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_TOGGLE_LOCAL_PROPS_TABLE: DocsPropRow[] = [
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
        name: "checked",
        description: {
            fr: "État contrôlé (on/off).",
            en: "Controlled state (on/off).",
        },
        type: "boolean",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultChecked",
        description: {
            fr: "État initial (mode non contrôlé).",
            en: "Initial state (uncontrolled mode).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "onCheckedChange",
        description: {
            fr: "Callback appelé quand l’état change.",
            en: "Callback fired when state changes.",
        },
        type: "(checked: boolean) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "label",
        description: {
            fr: "Label optionnel à droite.",
            en: "Optional label on the right.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "description",
        description: {
            fr: "Texte d’aide optionnel sous le label.",
            en: "Optional helper text under the label.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille du toggle.",
            en: "Toggle size.",
        },
        type: `"xs" | "sm" | "md" | "lg"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: {
            fr: "Étire le composant (utile avec label).",
            en: "Stretches the component (useful with label).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Toutes les props natives du button (onClick, aria-*, data-*…).",
            en: "All native button props (onClick, aria-*, data-*…).",
        },
        type: "Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'onChange'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentControlTogglePropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_TOGGLE_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlToggleIdentity: ComponentIdentity = {
    name: "IntentControlToggle",
    kind: "control",
    description: {
        fr: "Toggle intent-first : switch on/off avec track + thumb, stylé via resolveIntent().",
        en: "Intent-first toggle: on/off switch with track + thumb, styled via resolveIntent().",
    },
    since: "0.2.0",
    docs: {
        route: "/playground/components/intent-control-toggle",
    },
    anatomy: {
        root: "<button>",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        track: ".intent-toggle-track",
        thumb: ".intent-toggle-thumb",
        textWrap: ".intent-toggle-text",
        label: ".intent-toggle-label",
        description: ".intent-toggle-description",
    },
    classHooks: [
        "intent-control",
        "intent-control-toggle",
        "intent-bg",
        "intent-text",
        "intent-ring",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
        "intent-toggle-track",
        "intent-toggle-thumb",
        "intent-toggle-text",
        "intent-toggle-label",
        "intent-toggle-description",
        "is-checked",
        "is-disabled",
        "ids-toggle-xs",
        "ids-toggle-sm",
        "ids-toggle-md",
        "ids-toggle-lg",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentControlToggle(props: IntentControlToggleProps) {
    const {
        className,

        checked,
        defaultChecked = false,
        onCheckedChange,

        label,
        description,

        size = "md",
        fullWidth = false,

        // ✅ Pull DS props OUT so they never reach the DOM
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

    const isControlled = typeof checked === "boolean";

    const [uncontrolled, setUncontrolled] = React.useState<boolean>(defaultChecked);

    const isChecked = isControlled ? (checked as boolean) : uncontrolled;

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
       🧱 Control class hooks (stable)
    ============================================================================ */

    const rootCls = cn(
        "intent-control intent-control-toggle",
        "relative inline-flex items-center",
        "rounded-ids-2xl",
        "transition",
        sizeClass(size),
        fullWidth && "w-full",
        isChecked && "is-checked",
        disabled && "is-disabled"
    );

    const hasText = Boolean(label) || Boolean(description);

    function setChecked(next: boolean) {
        if (!isControlled) setUncontrolled(next);
        onCheckedChange?.(next);
    }

    function toggle() {
        if (disabled) return;
        setChecked(!isChecked);
    }

    return (
        <button
            {...buttonProps}
            {...surfaceProps}
            className={cn(surfaceProps.className, rootCls)}
            type={buttonProps.type ?? "button"}
            disabled={disabled}
            role="switch"
            aria-checked={isChecked}
            aria-disabled={disabled || undefined}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
            onClick={(e) => {
                buttonProps.onClick?.(e);
                if (e.defaultPrevented) return;
                toggle();
            }}
            onKeyDown={(e) => {
                buttonProps.onKeyDown?.(e);
                if (e.defaultPrevented) return;

                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle();
                }
            }}
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

            {/* Track + Thumb */}
            <span aria-hidden className="intent-toggle-track">
                <span aria-hidden className="intent-toggle-thumb" />
            </span>

            {/* Text */}
            {hasText ? (
                <span className="intent-toggle-text">
                    {label ? <span className="intent-toggle-label">{label}</span> : null}
                    {description ? (
                        <span className="intent-toggle-description">{description}</span>
                    ) : null}
                </span>
            ) : null}
        </button>
    );
}
