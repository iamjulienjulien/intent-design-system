// src/components/intent/IntentControlInput.tsx
// IntentControlInput
// - Intent-first Input / Textarea control (single component)
// - Designed to be wrapped by IntentControlField (field owns the "frame" visuals)
// - Supports standalone mode with control frame + glow layers
// - Supports insideField mode (naked element, field owns the frame visuals)
// - Uses resolveIntent() to provide stable CSS vars + hooks
// - No dynamic Tailwind classes: only stable hooks
//
// ✅ Updated:
// - Restores full input/textarea implementation
// - Keeps readOnly mode
// - Keeps textarea autosize
// - Adds glow layers in standalone mode
// - Adds toneStep support
// - Fixes CSS custom property typing for TS

"use client";

import * as React from "react";

import { resolveIntent, getIntentLayoutProps, getIntentControlProps } from "CORE";
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

type InputSize = "xs" | "sm" | "md" | "lg" | "xl";

function sizeClass(size: InputSize) {
    return `ids-control-${size}`;
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
    if (!ref) return;
    if (typeof ref === "function") ref(value);
    else (ref as React.MutableRefObject<T>).current = value;
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

type BaseProps = IntentInput & {
    className?: string;

    /** Visual / layout */
    size?: InputSize; // default: "md"
    fullWidth?: boolean; // default false

    /** Slots (works both standalone or inside IntentControlField) */
    leading?: React.ReactNode;
    trailing?: React.ReactNode;

    /** State */
    invalid?: boolean; // default false
    readOnly?: boolean; // default false

    /**
     * When used inside IntentControlField, you generally want the field to own padding.
     * - insideField=true => no internal padding, no bg/ring, inherits frame spacing
     * - standalone => provides the usual control "frame" look + padding
     */
    insideField?: boolean; // default false
};

export type IntentControlInputProps = BaseProps &
    Omit<
        React.InputHTMLAttributes<HTMLInputElement>,
        "className" | "size" | "disabled" | "children"
    > & {
        as?: "input"; // default
    };

export type IntentControlTextareaProps = BaseProps &
    Omit<
        React.TextareaHTMLAttributes<HTMLTextAreaElement>,
        "className" | "disabled" | "children"
    > & {
        as: "textarea";

        /** Autosize textarea height to content */
        autoSize?: boolean; // default false
        minRows?: number; // default 2
        maxRows?: number; // default 8
    };

export type IntentControlInputUnionProps = IntentControlInputProps | IntentControlTextareaProps;

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_INPUT_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "as",
        description: {
            fr: "Type de contrôle: input (défaut) ou textarea.",
            en: "Control type: input (default) or textarea.",
        },
        type: `"input" | "textarea"`,
        required: false,
        default: "input",
        fromSystem: false,
    },
    {
        name: "className",
        description: {
            fr: "Classes CSS additionnelles sur l’élément editable.",
            en: "Additional CSS classes on the editable element.",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille (hauteur/typo/padding si standalone).",
            en: "Size (height/typography/padding when standalone).",
        },
        type: `"xs" | "sm" | "md" | "lg" | "xl"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: {
            fr: "Étire le contrôle sur toute la largeur disponible.",
            en: "Stretches the control to full width.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "leading",
        description: {
            fr: "Slot à gauche (icône, badge). En mode insideField, préfère plutôt utiliser le leading du Field.",
            en: "Leading slot (icon, badge). In insideField mode, prefer Field leading slot.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "trailing",
        description: {
            fr: "Slot à droite (action, compteur). En mode insideField, préfère plutôt utiliser le trailing du Field.",
            en: "Trailing slot (action, counter). In insideField mode, prefer Field trailing slot.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "insideField",
        description: {
            fr: "Active le mode “naked” pour être wrappé par IntentControlField (le frame visuel appartient au Field).",
            en: "Enables “naked” mode intended to be wrapped by IntentControlField (visual frame is owned by Field).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "invalid",
        description: {
            fr: "Force l’état invalide (aria-invalid + hook).",
            en: "Forces invalid state (aria-invalid + hook).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "readOnly",
        description: {
            fr: "Lecture seule: focusable mais non éditable (readOnly + aria-readonly + hook).",
            en: "Read-only: focusable but not editable (readOnly + aria-readonly + hook).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "autoSize",
        description: {
            fr: "Textarea uniquement: ajuste la hauteur automatiquement au contenu.",
            en: "Textarea only: automatically adjusts height to content.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "minRows",
        description: {
            fr: "Textarea + autoSize: nombre de lignes minimum.",
            en: "Textarea + autoSize: minimum rows.",
        },
        type: "number",
        required: false,
        default: "2",
        fromSystem: false,
    },
    {
        name: "maxRows",
        description: {
            fr: "Textarea + autoSize: nombre de lignes maximum.",
            en: "Textarea + autoSize: maximum rows.",
        },
        type: "number",
        required: false,
        default: "8",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Props natives input/textarea (value, onChange, placeholder, name, autoComplete…).",
            en: "Native input/textarea props (value, onChange, placeholder, name, autoComplete…).",
        },
        type: "InputHTMLAttributes | TextareaHTMLAttributes (w/ DS omissions)",
        required: false,
        fromSystem: false,
    },
];

export const IntentControlInputPropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_INPUT_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlInputIdentity: ComponentIdentity = {
    name: "IntentControlInput",
    kind: "control",
    description: {
        fr: "Input/textarea intent-first. Standalone: frame visuel. Dans IntentControlField: mode naked (insideField=true).",
        en: "Intent-first input/textarea. Standalone: visual frame. Inside IntentControlField: naked mode (insideField=true).",
    },
    since: "0.2.2",
    docs: { route: "/playground/components/intent-control-input" },
    anatomy: {
        root: "<div> (standalone only)",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        input: "<input> | <textarea>",
        leading: ".intent-control-input-leading (standalone only)",
        trailing: ".intent-control-input-trailing (standalone only)",
    },
    classHooks: [
        "intent-control",
        "intent-control-input",
        "intent-control-input-standalone",
        "intent-control-input-naked",
        "intent-control-input-el",
        "intent-control-input-leading",
        "intent-control-input-trailing",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
        "is-invalid",
        "is-disabled",
        "is-readonly",
        "ids-control-xs",
        "ids-control-sm",
        "ids-control-md",
        "ids-control-lg",
        "ids-control-xl",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export const IntentControlInput = React.forwardRef<
    HTMLInputElement | HTMLTextAreaElement,
    IntentControlInputUnionProps
>(function IntentControlInput(props, forwardedRef) {
    const {
        className,

        size = "md",
        fullWidth = false,

        leading,
        trailing,

        invalid = false,
        readOnly = false,
        insideField = false,

        // DS props (removed from DOM)
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        toneStep,
        disabled: disabledProp,

        as = "input",

        ...nativeProps
    } = props as IntentControlInputUnionProps & {
        as?: "input" | "textarea";
    };

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
    const resolvedStyle = resolved.style as CssVars | undefined;

    const layoutProps = getIntentLayoutProps(resolved);
    const controlProps = getIntentControlProps(resolved);

    const hasGlow = Boolean(resolved.glowBackground);
    const v = resolved.variant;
    const isGlowed = resolved.intent === "glowed";
    const glowAllowed = !insideField && hasGlow && v !== "ghost";
    const allowFillGlow = glowAllowed && (isGlowed || v === "flat" || v === "elevated");
    const allowBorderGlow = glowAllowed && (v === "outlined" || v === "elevated");

    const glowFillOpacity = readOpacity(resolvedStyle, "--intent-glow-fill-opacity");
    const glowBorderOpacity = readOpacity(resolvedStyle, "--intent-glow-border-opacity");

    const elRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    React.useEffect(() => {
        setRef(forwardedRef, elRef.current as HTMLInputElement & HTMLTextAreaElement);
    }, [forwardedRef]);

    /* ============================================================================
       🧾 Textarea autosize (optional)
    ============================================================================ */

    const textareaExtras =
        as === "textarea"
            ? (nativeProps as IntentControlTextareaProps)
            : ({} as IntentControlTextareaProps);

    const autoSize = as === "textarea" ? Boolean(textareaExtras.autoSize) : false;
    const minRows = as === "textarea" ? (textareaExtras.minRows ?? 2) : 2;
    const maxRows = as === "textarea" ? (textareaExtras.maxRows ?? 8) : 8;

    const {
        autoSize: _autoSize,
        minRows: _minRows,
        maxRows: _maxRows,
        ...textareaNativeProps
    } = textareaExtras;

    function syncTextareaHeight() {
        if (as !== "textarea" || !autoSize) return;

        const el = elRef.current as HTMLTextAreaElement | null;
        if (!el) return;

        el.style.height = "auto";

        const style = window.getComputedStyle(el);
        const lineHeight = Number.parseFloat(style.lineHeight || "0") || 20;
        const paddingTop = Number.parseFloat(style.paddingTop || "0") || 0;
        const paddingBottom = Number.parseFloat(style.paddingBottom || "0") || 0;

        const minH = minRows * lineHeight + paddingTop + paddingBottom;
        const maxH = maxRows * lineHeight + paddingTop + paddingBottom;

        const next = Math.max(minH, Math.min(el.scrollHeight, maxH));
        el.style.height = `${next}px`;
    }

    React.useEffect(() => {
        if (!autoSize) return;
        syncTextareaHeight();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoSize, minRows, maxRows, (textareaNativeProps as { value?: unknown }).value]);

    /* ============================================================================
       🧱 Class hooks (stable)
    ============================================================================ */

    const elCls = cn(
        "intent-control-input-el",
        sizeClass(size),
        fullWidth && "w-full",
        invalid && "is-invalid",
        disabled && "is-disabled",
        readOnly && "is-readonly",
        insideField ? "intent-control-input-naked" : "intent-control-input-standalone",
        className
    );

    const standaloneRootCls = cn(
        "intent-control",
        "intent-control-input",
        "relative inline-flex items-stretch",
        "intent-control-input-standalone",
        sizeClass(size),
        fullWidth && "w-full",
        invalid && "is-invalid",
        disabled && "is-disabled",
        readOnly && "is-readonly"
    );

    const commonAria = {
        "aria-invalid": invalid || undefined,
        "aria-disabled": disabled || undefined,
        "aria-readonly": readOnly || undefined,
    };

    /* ============================================================================
       InsideField mode
    ============================================================================ */

    if (insideField) {
        if (as === "textarea") {
            const tp = textareaNativeProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>;

            return (
                <textarea
                    {...tp}
                    {...layoutProps}
                    ref={(node) => {
                        elRef.current = node;
                        setRef(forwardedRef, node as HTMLInputElement & HTMLTextAreaElement);
                    }}
                    className={cn(layoutProps.className, elCls)}
                    style={layoutProps.style}
                    disabled={disabled}
                    readOnly={readOnly}
                    onInput={(e) => {
                        tp.onInput?.(e);
                        if (!e.defaultPrevented) syncTextareaHeight();
                    }}
                    {...commonAria}
                />
            );
        }

        const ip = nativeProps as React.InputHTMLAttributes<HTMLInputElement>;

        return (
            <input
                {...ip}
                {...layoutProps}
                ref={(node) => {
                    elRef.current = node;
                    setRef(forwardedRef, node as HTMLInputElement & HTMLTextAreaElement);
                }}
                className={cn(layoutProps.className, elCls)}
                style={layoutProps.style}
                disabled={disabled}
                readOnly={readOnly}
                {...commonAria}
            />
        );
    }

    /* ============================================================================
       Standalone mode
    ============================================================================ */

    const rootProps = {
        ...layoutProps,
        className: cn(layoutProps.className, controlProps.className, standaloneRootCls),
        style: layoutProps.style,
        "data-intent": resolved.intent,
        "data-variant": resolved.variant,
        "data-intensity": resolved.intensity,
        "data-mode": resolved.mode,
        "data-tone-step": resolved.toneStep,
    } as const;

    return (
        <div {...rootProps}>
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

            {leading ? (
                <span className="intent-control-input-leading" aria-hidden>
                    {leading}
                </span>
            ) : null}

            {as === "textarea" ? (
                <textarea
                    {...(textareaNativeProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                    ref={(node) => {
                        elRef.current = node;
                        setRef(forwardedRef, node as HTMLInputElement & HTMLTextAreaElement);
                    }}
                    className={elCls}
                    disabled={disabled}
                    readOnly={readOnly}
                    onInput={(e) => {
                        (
                            textareaNativeProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>
                        ).onInput?.(e);
                        if (!e.defaultPrevented) syncTextareaHeight();
                    }}
                    {...commonAria}
                />
            ) : (
                <input
                    {...(nativeProps as React.InputHTMLAttributes<HTMLInputElement>)}
                    ref={(node) => {
                        elRef.current = node;
                        setRef(forwardedRef, node as HTMLInputElement & HTMLTextAreaElement);
                    }}
                    className={elCls}
                    disabled={disabled}
                    readOnly={readOnly}
                    {...commonAria}
                />
            )}

            {trailing ? (
                <span className="intent-control-input-trailing" aria-hidden>
                    {trailing}
                </span>
            ) : null}
        </div>
    );
});
