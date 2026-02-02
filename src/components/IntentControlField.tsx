"use client";

// src/components/intent/IntentControlField.tsx
// IntentControlField
// - Wrapper intent-first for form controls (label + hint + error + slots)
// - Root = layout + CSS vars only (no surface fill)
// - Visual field = inner "frame" (bg/ring/focus-within), contains leading/control/trailing

import * as React from "react";

import type { IntentInput } from "../lib/intent/types";
import {
    resolveIntent,
    getIntentLayoutProps,
    composeIntentControlClassName,
} from "../lib/intent/resolve";

import type { DocsPropRow, ComponentIdentity } from "../lib/intent/types";
import { SYSTEM_PROPS_TABLE } from "../lib/intent/props";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentControlFieldProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
        className?: string;
        children?: React.ReactNode;

        /** Label row */
        label?: React.ReactNode;
        labelFor?: string;
        required?: boolean; // default false
        optionalLabel?: string; // default "Optional"
        showOptional?: boolean; // ✅ new: show "Optional" even when label exists (default true)

        /** Supporting text */
        hint?: React.ReactNode;
        error?: React.ReactNode;

        /** State */
        invalid?: boolean; // default false
        disabled?: boolean;

        /** Layout */
        compact?: boolean; // default false
        padded?: boolean; // ✅ new: controls frame padding (default true)
        direction?: "vertical" | "horizontal"; // default "vertical"

        /** Slots */
        leading?: React.ReactNode;
        trailing?: React.ReactNode;
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_FIELD_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "className",
        description: {
            fr: "Classes CSS additionnelles sur le root.",
            en: "Extra CSS classes on root.",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "children",
        description: {
            fr: "Le contrôle rendu dans le field (input/select/etc).",
            en: "The control rendered inside the field (input/select/etc).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "label",
        description: {
            fr: "Label au-dessus / à gauche du contrôle.",
            en: "Label above / left of the control.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "labelFor",
        description: {
            fr: "Id de l’élément contrôlé (pour htmlFor).",
            en: "Controlled element id (for htmlFor).",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "required",
        description: { fr: "Marque le champ comme requis.", en: "Marks the field as required." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "optionalLabel",
        description: {
            fr: "Texte affiché quand required=false.",
            en: "Text shown when required=false.",
        },
        type: "string",
        required: false,
        default: "Optional",
        fromSystem: false,
    },
    {
        name: "showOptional",
        description: {
            fr: "Affiche le label Optional quand required=false.",
            en: "Shows Optional label when required=false.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "hint",
        description: {
            fr: "Texte d’aide (sous le contrôle).",
            en: "Help text (under the control).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "error",
        description: {
            fr: "Texte d’erreur (prioritaire sur hint).",
            en: "Error text (overrides hint).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "invalid",
        description: {
            fr: "Force l’état invalide (hook + aria).",
            en: "Forces invalid state (hook + aria).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "compact",
        description: { fr: "Réduit les espacements.", en: "Reduces spacing." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "padded",
        description: {
            fr: "Active le padding interne du frame. Permet un field “dense/nu”.",
            en: "Enables inner frame padding. Allows a dense/bare field.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "direction",
        description: {
            fr: "Layout label/control: vertical ou horizontal.",
            en: "Label/control layout: vertical or horizontal.",
        },
        type: `"vertical" | "horizontal"`,
        required: false,
        default: "vertical",
        fromSystem: false,
    },
    {
        name: "leading",
        description: {
            fr: "Slot avant le contrôle (icône, badge).",
            en: "Slot before the control (icon, badge).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "trailing",
        description: {
            fr: "Slot après le contrôle (action, compteur).",
            en: "Slot after the control (action, counter).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Props natives du div root (data-*, onClick...).",
            en: "Native div props (data-*, onClick...).",
        },
        type: "Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'children'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentControlFieldPropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_FIELD_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlFieldIdentity: ComponentIdentity = {
    name: "IntentControlField",
    kind: "control",
    description: {
        fr: "Wrapper de champ: label + hint/error + slots. Root = layout + vars. Frame interne = look champ + focus-within.",
        en: "Field wrapper: label + hint/error + slots. Root = layout + vars. Inner frame = field look + focus-within.",
    },
    since: "0.2.0",
    docs: { route: "/playground/components/intent-control-field" },
    anatomy: {
        root: "<div>",
        header: ".intent-control-field-header",
        label: ".intent-control-field-label",
        meta: ".intent-control-field-meta",
        frame: ".intent-control-field-frame",
        leading: ".intent-control-field-leading",
        control: ".intent-control-field-control",
        trailing: ".intent-control-field-trailing",
        hint: ".intent-control-field-hint",
        error: ".intent-control-field-error",
    },
    classHooks: [
        "intent-control-field",
        "intent-control-field-frame",
        "is-disabled",
        "is-invalid",
        "is-compact",
        "is-padded",
        "is-horizontal",
        "has-leading",
        "has-trailing",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentControlField(props: IntentControlFieldProps) {
    const {
        className,
        children,

        label,
        labelFor,
        required = false,
        optionalLabel = "Optional",
        showOptional = true,

        hint,
        error,

        invalid = false,
        disabled: disabledProp,

        compact = false,
        padded = true,
        direction = "vertical",

        leading,
        trailing,

        // DS props (removed from DOM)
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: dsDisabled,

        ...divProps
    } = props;

    const disabled = Boolean(disabledProp ?? dsDisabled);
    const showError = Boolean(error) || invalid;

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

    // ✅ Root: vars only (no bg/ring fill on the whole block)
    const layoutProps = getIntentLayoutProps(resolved, className);

    // ✅ Frame: use the usual control recipe (bg/ring/shadow), vars come from root
    const frameClassName = composeIntentControlClassName(resolved);

    const describedById = React.useId();
    const errorId = React.useId();

    const rootCls = cn(
        "intent-control-field",
        compact && "is-compact",
        padded && "is-padded",
        direction === "horizontal" && "is-horizontal",
        disabled && "is-disabled",
        showError && "is-invalid",
        Boolean(leading) && "has-leading",
        Boolean(trailing) && "has-trailing"
    );

    const showHeader = Boolean(label) || (showOptional && !required);

    return (
        <div
            {...divProps}
            style={layoutProps.style}
            className={cn(layoutProps.className, rootCls)}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            {showHeader ? (
                <div className="intent-control-field-header">
                    <div className="intent-control-field-labelRow">
                        {label ? (
                            <label className="intent-control-field-label" htmlFor={labelFor}>
                                {label}
                            </label>
                        ) : (
                            <div />
                        )}

                        {showOptional ? (
                            <div className="intent-control-field-meta">
                                {required ? (
                                    <span className="intent-control-field-required">*</span>
                                ) : (
                                    <span className="intent-control-field-optional">
                                        {optionalLabel}
                                    </span>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {/* ✅ Visual field frame */}
            <div className={cn("intent-control intent-control-field-frame", frameClassName)}>
                {leading ? <div className="intent-control-field-leading">{leading}</div> : null}

                <div className="intent-control-field-control">
                    {/* Provide ids for consumers (they can read data-field-describedby / data-field-error) */}
                    <div data-field-describedby={describedById} data-field-error={errorId}>
                        {children}
                    </div>
                </div>

                {trailing ? <div className="intent-control-field-trailing">{trailing}</div> : null}
            </div>

            {showError ? (
                <div className="intent-control-field-error" id={errorId}>
                    {error ?? "Invalid value"}
                </div>
            ) : hint ? (
                <div className="intent-control-field-hint" id={describedById}>
                    {hint}
                </div>
            ) : null}
        </div>
    );
}
