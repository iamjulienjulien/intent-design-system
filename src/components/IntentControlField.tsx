// src/components/intent/IntentControlField.tsx
// IntentControlField
// - Wrapper intent-first for form controls (label + hint + error + slots)
// - Root = layout + CSS vars only
// - Visual frame = glow layers + field look + focus-within
// - Supports naked mode to disable IDS field visuals entirely

"use client";

import * as React from "react";

import { resolveIntent, getIntentLayoutProps, composeIntentControlClassName } from "CORE";
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

type CssVars = React.CSSProperties & Record<`--${string}`, string | number | undefined>;

function readOpacity(
    style: CssVars | undefined,
    key: "--intent-glow-fill-opacity" | "--intent-glow-border-opacity"
) {
    const raw = style?.[key] ?? "0";
    const n = Number(raw?.toString?.() ?? "0");
    return Number.isFinite(n) ? n : 0;
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentControlFieldProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
        className?: string;
        children?: React.ReactNode;

        label?: React.ReactNode;
        labelFor?: string;
        required?: boolean;
        optionalLabel?: string;
        showOptional?: boolean;

        hint?: React.ReactNode;
        error?: React.ReactNode;

        invalid?: boolean;
        disabled?: boolean;

        compact?: boolean;
        padded?: boolean;
        naked?: boolean;
        direction?: "vertical" | "horizontal";

        size?: "xs" | "sm" | "md" | "lg" | "xl";

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
        default: "Optionnel",
        fromSystem: false,
    },
    {
        name: "showOptional",
        description: {
            fr: "Affiche le label Optionnel quand required=false.",
            en: "Shows Optionnel label when required=false.",
        },
        type: "boolean",
        required: false,
        default: "false",
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
            fr: "Active le padding interne du frame. Permet un field dense/nu.",
            en: "Enables inner frame padding. Allows a dense/bare field.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "naked",
        description: {
            fr: "Désactive le styling IDS du field et garde seulement la structure.",
            en: "Disables IDS field styling and keeps only the structure.",
        },
        type: "boolean",
        required: false,
        default: "false",
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
        fr: "Wrapper de champ: label + hint/error + slots. Root = layout + vars. Frame interne = glow + look champ + focus-within.",
        en: "Field wrapper: label + hint/error + slots. Root = layout + vars. Inner frame = glow + field look + focus-within.",
    },
    since: "0.2.0",
    docs: { route: "/playground/components/intent-control-field" },
    anatomy: {
        root: "<div>",
        header: ".intent-control-field-header",
        label: ".intent-control-field-label",
        meta: ".intent-control-field-meta",
        frame: ".intent-control-field-frame",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        leading: ".intent-control-field-leading",
        control: ".intent-control-field-control",
        trailing: ".intent-control-field-trailing",
        hint: ".intent-control-field-hint",
        error: ".intent-control-field-error",
    },
    classHooks: [
        "intent-control-field",
        "intent-control-field-frame",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
        "is-disabled",
        "is-invalid",
        "is-compact",
        "is-padded",
        "is-horizontal",
        "is-naked",
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
        optionalLabel = "Optionnel",
        showOptional = false,

        hint,
        error,

        invalid = false,
        disabled: disabledProp,

        compact = false,
        padded = true,
        naked = false,
        direction = "vertical",

        size = "md",

        leading,
        trailing,

        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        toneStep,
        disabled: dsDisabled,

        ...divProps
    } = props;

    const disabled = Boolean(disabledProp ?? dsDisabled);
    const showError = Boolean(error) || invalid;
    const showMeta = required || showOptional;
    const showHeader = Boolean(label) || showMeta;

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
    const resolvedStyle = resolved.style as CssVars | undefined;

    const layoutProps = getIntentLayoutProps(resolved, className);
    const frameClassName = composeIntentControlClassName(resolved);

    const hasGlow = Boolean(resolved.glowBackground);
    const v = resolved.variant;
    const isGlowed = resolved.intent === "glowed";
    const glowAllowed = !naked && hasGlow && v !== "ghost";
    const allowFillGlow = glowAllowed && (isGlowed || v === "flat" || v === "elevated");
    const allowBorderGlow = glowAllowed && (v === "outlined" || v === "elevated");

    const glowFillOpacity = readOpacity(resolvedStyle, "--intent-glow-fill-opacity");
    const glowBorderOpacity = readOpacity(resolvedStyle, "--intent-glow-border-opacity");

    const describedById = React.useId();
    const errorId = React.useId();

    const rootCls = cn(
        "intent-control-field",
        `ids-control-${size}`,
        compact && "is-compact",
        padded && !naked && "is-padded",
        direction === "horizontal" && "is-horizontal",
        disabled && "is-disabled",
        showError && "is-invalid",
        naked && "is-naked",
        Boolean(leading) && "has-leading",
        Boolean(trailing) && "has-trailing"
    );

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
                            <div className="intent-control-field-labelSpacer" aria-hidden="true" />
                        )}

                        {showMeta ? (
                            <div className="intent-control-field-meta">
                                {required ? (
                                    <span className="intent-control-field-required">*</span>
                                ) : showOptional ? (
                                    <span className="intent-control-field-optional">
                                        {optionalLabel}
                                    </span>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}

            <div
                className={cn(
                    "intent-control intent-control-field-frame",
                    !naked && frameClassName
                )}
            >
                {glowAllowed ? (
                    <>
                        {allowFillGlow ? (
                            <div
                                className="intent-glow-layer intent-glow-fill"
                                style={{ opacity: glowFillOpacity }}
                                aria-hidden="true"
                            />
                        ) : null}

                        {allowBorderGlow ? (
                            <div
                                className="intent-glow-layer intent-glow-border"
                                style={{ opacity: glowBorderOpacity, borderRadius: "inherit" }}
                                aria-hidden="true"
                            />
                        ) : null}
                    </>
                ) : null}

                {leading ? <div className="intent-control-field-leading">{leading}</div> : null}

                <div className="intent-control-field-control">
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
