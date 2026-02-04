"use client";

// src/components/intent/IntentControlInput.tsx
// IntentControlInput
// - Intent-first Input / Textarea control (single component)
// - Designed to be wrapped by IntentControlField (field owns the "frame" visuals)
// - This component is "naked": it renders only the editable element + optional autosize logic
// - Uses resolveIntent() to provide stable CSS vars + hooks when used standalone
// - No dynamic Tailwind classes: only stable hooks

import * as React from "react";

import type { IntentInput } from "../lib/intent/types";
import { resolveIntent, getIntentLayoutProps, getIntentControlProps } from "../lib/intent/resolve";

import type { DocsPropRow, ComponentIdentity } from "../lib/intent/types";
import { SYSTEM_PROPS_TABLE } from "../lib/intent/props";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

type InputSize = "xs" | "sm" | "md" | "lg" | "xl";

function sizeClass(size: InputSize) {
    switch (size) {
        case "xs":
            return "ids-input-xs";
        case "sm":
            return "ids-input-sm";
        case "lg":
            return "ids-input-lg";
        case "xl":
            return "ids-input-xl";
        default:
            return "ids-input-md";
    }
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
    if (!ref) return;
    if (typeof ref === "function") ref(value);
    else (ref as any).current = value;
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
        "is-invalid",
        "is-disabled",
        "ids-input-xs",
        "ids-input-sm",
        "ids-input-md",
        "ids-input-lg",
        "ids-input-xl",
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
        insideField = false,

        // DS props (removed from DOM)
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: disabledProp,

        as = "input",

        ...nativeProps
    } = props as any;

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

    // Standalone:
    // - root carries vars (layout) + visuals (control frame)
    // InsideField:
    // - element carries minimal hooks; field frame provides visuals via composeIntentControlClassName()
    const layoutProps = getIntentLayoutProps(resolved);
    const controlProps = getIntentControlProps(resolved);

    const elRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    React.useEffect(() => {
        setRef(forwardedRef as any, elRef.current as any);
    }, [forwardedRef]);

    /* ============================================================================
       🧾 Textarea autosize (optional)
    ============================================================================ */

    const autoSize =
        as === "textarea" ? Boolean((nativeProps as IntentControlTextareaProps).autoSize) : false;

    const minRows = as === "textarea" ? ((nativeProps as any).minRows ?? 2) : 2;
    const maxRows = as === "textarea" ? ((nativeProps as any).maxRows ?? 8) : 8;

    function syncTextareaHeight() {
        if (as !== "textarea" || !autoSize) return;
        const el = elRef.current as HTMLTextAreaElement | null;
        if (!el) return;

        // Reset to measure scrollHeight properly
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
    }, [autoSize, minRows, maxRows, (nativeProps as any).value]);

    /* ============================================================================
       🧱 Class hooks (stable)
    ============================================================================ */

    const elCls = cn(
        "intent-control-input-el",
        sizeClass(size),
        fullWidth && "w-full",
        invalid && "is-invalid",
        disabled && "is-disabled",
        insideField ? "intent-control-input-naked" : "intent-control-input-standalone",
        className
    );

    const standaloneRootCls = cn(
        "intent-control intent-control-input",
        "relative inline-flex items-stretch",
        sizeClass(size),
        fullWidth && "w-full",
        invalid && "is-invalid",
        disabled && "is-disabled"
    );

    // When insideField: do not add frame visuals (field frame already has them)
    // When standalone: use control visuals on root, and render slots there
    if (insideField) {
        const commonAria = {
            "aria-invalid": invalid || undefined,
            "aria-disabled": disabled || undefined,
        };

        if (as === "textarea") {
            const tp = nativeProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>;
            return (
                <textarea
                    {...tp}
                    {...layoutProps} // vars still useful (placeholder color etc.)
                    ref={(n) => {
                        elRef.current = n;
                        setRef(forwardedRef as any, n as any);
                    }}
                    className={cn(layoutProps.className, elCls)}
                    disabled={disabled}
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
                {...layoutProps} // vars still useful
                ref={(n) => {
                    elRef.current = n;
                    setRef(forwardedRef as any, n as any);
                }}
                className={cn(layoutProps.className, elCls)}
                disabled={disabled}
                {...commonAria}
            />
        );
    }

    // Standalone mode
    const rootProps = {
        ...layoutProps, // vars on root
        className: cn(layoutProps.className, controlProps.className, standaloneRootCls),
        "data-intent": resolved.intent,
        "data-variant": resolved.variant,
        "data-intensity": resolved.intensity,
        "data-mode": resolved.mode,
    } as const;

    const commonAria = {
        "aria-invalid": invalid || undefined,
        "aria-disabled": disabled || undefined,
    };

    return (
        <div {...(rootProps as any)}>
            {leading ? (
                <span className="intent-control-input-leading" aria-hidden>
                    {leading}
                </span>
            ) : null}

            {as === "textarea" ? (
                <textarea
                    {...(nativeProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                    ref={(n) => {
                        elRef.current = n;
                        setRef(forwardedRef as any, n as any);
                    }}
                    className={cn(elCls, "intent-control-input-el")}
                    disabled={disabled}
                    onInput={(e) => {
                        (nativeProps as any).onInput?.(e);
                        if (!e.defaultPrevented) syncTextareaHeight();
                    }}
                    {...commonAria}
                />
            ) : (
                <input
                    {...(nativeProps as React.InputHTMLAttributes<HTMLInputElement>)}
                    ref={(n) => {
                        elRef.current = n;
                        setRef(forwardedRef as any, n as any);
                    }}
                    className={cn(elCls, "intent-control-input-el")}
                    disabled={disabled}
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
