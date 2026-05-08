// src/components/intent/IntentControlRange.tsx
// IntentControlRange
// - Intent-first range slider control
// - V2.1: richer visual track/fill/thumb styling with local glow layers
// - Supports standalone styled mode or naked mode
// - Uses visual layers under the native range input for a more intense DS look
// - Keeps the native input for semantics + accessibility
// - Adds trackFill glow layers + thumbVisual glow layers
// - No dynamic Tailwind classes: only stable hooks

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

export type IntentControlRangeSize = "xs" | "sm" | "md" | "lg" | "xl";

function sizeClass(size: IntentControlRangeSize) {
    return `ids-control-${size}`;
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

function clamp(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
}

function getSafeMax(min: number, max: number) {
    return max <= min ? min + 1 : max;
}

function toPercent(value: number, min: number, max: number) {
    const safeMax = getSafeMax(min, max);
    return ((clamp(value, min, safeMax) - min) / (safeMax - min)) * 100;
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentControlRangeProps = IntentInput &
    Omit<
        React.InputHTMLAttributes<HTMLInputElement>,
        "type" | "size" | "className" | "children" | "disabled"
    > & {
        className?: string;

        /** Visual / layout */
        size?: IntentControlRangeSize; // default: "md"
        fullWidth?: boolean; // default false
        naked?: boolean; // default false

        /** Optional copy */
        label?: React.ReactNode;
        caption?: React.ReactNode;
        valueLabel?: React.ReactNode;
        showValue?: boolean; // default false
        formatValue?: (value: number) => React.ReactNode;

        /** Slots */
        leading?: React.ReactNode;
        trailing?: React.ReactNode;

        /** State */
        invalid?: boolean; // default false
        readOnly?: boolean; // default false

        /** Native range values */
        min?: number; // default 0
        max?: number; // default 100
        step?: number; // default 1
        value?: number;
        defaultValue?: number;
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_RANGE_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "className",
        description: {
            fr: "Classes CSS additionnelles sur la racine ou le slider nu selon le mode.",
            en: "Additional CSS classes on the root or naked slider depending on mode.",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille générale du contrôle.",
            en: "Overall control size.",
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
            en: "Stretches the control to full available width.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "naked",
        description: {
            fr: "Retire le frame visuel standalone et ne garde que le slider nu.",
            en: "Removes the standalone visual frame and keeps only the naked slider.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "label",
        description: {
            fr: "Label principal optionnel au-dessus du slider.",
            en: "Optional main label above the slider.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "caption",
        description: {
            fr: "Texte secondaire optionnel.",
            en: "Optional secondary text.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "valueLabel",
        description: {
            fr: "Valeur affichée manuellement à droite du header.",
            en: "Manually provided value displayed on the right side of the header.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "showValue",
        description: {
            fr: "Affiche automatiquement la valeur numérique courante.",
            en: "Automatically displays the current numeric value.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "formatValue",
        description: {
            fr: "Fonction de formatage de la valeur affichée.",
            en: "Formatting function for the displayed value.",
        },
        type: "(value: number) => React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "leading / trailing",
        description: {
            fr: "Slots visuels optionnels à gauche et à droite de la piste.",
            en: "Optional visual slots at the left and right of the track.",
        },
        type: "React.ReactNode / React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "invalid",
        description: {
            fr: "Force l’état invalide.",
            en: "Forces invalid state.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "readOnly",
        description: {
            fr: "Lecture seule. Le slider reste visible mais non interactif.",
            en: "Read-only. The slider remains visible but non-interactive.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "min / max / step",
        description: {
            fr: "Bornes et pas natifs du range input.",
            en: "Native range input bounds and step.",
        },
        type: "number / number / number",
        required: false,
        default: "0 / 100 / 1",
        fromSystem: false,
    },
    {
        name: "value / defaultValue",
        description: {
            fr: "Valeur contrôlée ou initiale du slider.",
            en: "Controlled or initial slider value.",
        },
        type: "number / number",
        required: false,
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Props natives de input[type=range] compatibles (name, onChange, aria-*, etc.).",
            en: "Compatible native input[type=range] props (name, onChange, aria-*, etc.).",
        },
        type: "InputHTMLAttributes<HTMLInputElement> (DS omissions)",
        required: false,
        fromSystem: false,
    },
];

export const IntentControlRangePropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_RANGE_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlRangeIdentity: ComponentIdentity = {
    name: "IntentControlRange",
    kind: "control",
    description: {
        fr: "Range slider intent-first avec mode standalone stylisé ou naked, glow optionnel et affichage de valeur.",
        en: "Intent-first range slider with styled standalone or naked mode, optional glow and value display.",
    },
    since: "0.3.0",
    docs: { route: "/playground/components/intent-control-range" },
    anatomy: {
        root: "<div> (standalone only)",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        header: ".intent-control-range-header",
        copy: ".intent-control-range-copy",
        label: ".intent-control-range-label",
        caption: ".intent-control-range-caption",
        value: ".intent-control-range-value",
        main: ".intent-control-range-main",
        leading: ".intent-control-range-leading",
        trailing: ".intent-control-range-trailing",
        track: ".intent-control-range-track",
        trackBase: ".intent-control-range-trackBase",
        trackFill: ".intent-control-range-trackFill",
        thumbVisual: ".intent-control-range-thumbVisual",
        input: "input[type='range'].intent-control-range-input",
    },
    classHooks: [
        "intent-control",
        "intent-control-range",
        "intent-control-range-standalone",
        "intent-control-range-naked",
        "intent-control-range-header",
        "intent-control-range-copy",
        "intent-control-range-label",
        "intent-control-range-caption",
        "intent-control-range-value",
        "intent-control-range-main",
        "intent-control-range-leading",
        "intent-control-range-trailing",
        "intent-control-range-track",
        "intent-control-range-trackBase",
        "intent-control-range-trackFill",
        "intent-control-range-thumbVisual",
        "intent-control-range-input",
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

export const IntentControlRange = React.forwardRef<HTMLInputElement, IntentControlRangeProps>(
    function IntentControlRange(props, forwardedRef) {
        const {
            className,

            size = "md",
            fullWidth = false,
            naked = false,

            label,
            caption,
            valueLabel,
            showValue = false,
            formatValue,

            leading,
            trailing,

            invalid = false,
            readOnly = false,

            min = 0,
            max = 100,
            step = 1,
            value,
            defaultValue,

            intent,
            variant,
            tone,
            glow,
            intensity,
            mode,
            toneStep,
            disabled: disabledProp,

            onChange,
            ...nativeProps
        } = props;

        const disabled = Boolean(disabledProp);
        const safeMax = getSafeMax(min, max);
        const isControlled = value !== undefined;

        const initialValue =
            typeof defaultValue === "number"
                ? clamp(defaultValue, min, safeMax)
                : clamp(min, min, safeMax);

        const [internalValue, setInternalValue] = React.useState<number>(initialValue);

        const currentValue = clamp(isControlled ? Number(value) : internalValue, min, safeMax);
        const percent = toPercent(currentValue, min, safeMax);

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
        const glowAllowed = hasGlow && v !== "ghost";
        const allowFillGlow = glowAllowed && (isGlowed || v === "flat" || v === "elevated");
        const allowBorderGlow = glowAllowed && (v === "outlined" || v === "elevated");

        const glowFillOpacity = readOpacity(resolvedStyle, "--intent-glow-fill-opacity");
        const glowBorderOpacity = readOpacity(resolvedStyle, "--intent-glow-border-opacity");

        const computedValueLabel =
            valueLabel ??
            (showValue ? (formatValue ? formatValue(currentValue) : currentValue) : null);

        const hasHeader = Boolean(label || caption || computedValueLabel);

        const rangeStyle = {
            ["--intent-range-percent" as string]: `${percent}%`,
            ["--intent-range-ratio" as string]: percent / 100,
        } as React.CSSProperties;

        const inputCls = cn(
            "intent-control-range-input",
            sizeClass(size),
            fullWidth && "w-full",
            invalid && "is-invalid",
            disabled && "is-disabled",
            readOnly && "is-readonly",
            naked ? "intent-control-range-naked" : "intent-control-range-standalone",
            className
        );

        const renderTrackDecor = () => (
            <>
                <span className="intent-control-range-trackBase" aria-hidden="true" />

                <span className="intent-control-range-trackFill" aria-hidden="true">
                    {allowFillGlow ? (
                        <span
                            className="intent-glow-layer intent-glow-fill"
                            style={{ opacity: glowFillOpacity }}
                        />
                    ) : null}

                    {allowBorderGlow ? (
                        <span
                            className="intent-glow-layer intent-glow-border"
                            style={{ opacity: glowBorderOpacity }}
                        />
                    ) : null}
                </span>

                <span className="intent-control-range-thumbVisual" aria-hidden="true">
                    {allowFillGlow ? (
                        <span
                            className="intent-glow-layer intent-glow-fill"
                            style={{ opacity: Math.min(glowFillOpacity * 1.15, 1) }}
                        />
                    ) : null}

                    {allowBorderGlow ? (
                        <span
                            className="intent-glow-layer intent-glow-border"
                            style={{ opacity: Math.min(glowBorderOpacity * 1.15, 1) }}
                        />
                    ) : null}
                </span>
            </>
        );

        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            if (readOnly) return;

            const next = Number(event.target.value);
            if (!isControlled) {
                setInternalValue(next);
            }
            onChange?.(event);
        };

        if (naked) {
            return (
                <div
                    {...layoutProps}
                    className={cn(
                        layoutProps.className,
                        "intent-control-range-track",
                        "intent-control-range-nakedTrack",
                        sizeClass(size),
                        fullWidth && "w-full",
                        invalid && "is-invalid",
                        disabled && "is-disabled",
                        readOnly && "is-readonly"
                    )}
                    style={{ ...(layoutProps.style ?? {}), ...rangeStyle }}
                >
                    {renderTrackDecor()}

                    <input
                        {...nativeProps}
                        ref={forwardedRef}
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={isControlled ? value : internalValue}
                        defaultValue={isControlled ? undefined : defaultValue}
                        className={inputCls}
                        disabled={disabled || readOnly}
                        aria-invalid={invalid || undefined}
                        aria-disabled={disabled || readOnly || undefined}
                        aria-readonly={readOnly || undefined}
                        onChange={handleChange}
                    />
                </div>
            );
        }

        const rootProps = {
            ...layoutProps,
            className: cn(
                layoutProps.className,
                controlProps.className,
                "intent-control intent-control-range relative min-w-0",
                "intent-control-range-standalone",
                sizeClass(size),
                fullWidth && "w-full",
                invalid && "is-invalid",
                disabled && "is-disabled",
                readOnly && "is-readonly"
            ),
            style: layoutProps.style,
            "data-intent": resolved.intent,
            "data-variant": resolved.variant,
            "data-intensity": resolved.intensity,
            "data-mode": resolved.mode,
            "data-tone-step": resolved.toneStep,
        } as const;

        return (
            <div {...rootProps}>
                {glowAllowed && !naked ? (
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

                <div className="intent-control-range-inner">
                    {hasHeader ? (
                        <div className="intent-control-range-header">
                            <div className="intent-control-range-copy">
                                {label ? (
                                    <div className="intent-control-range-label">{label}</div>
                                ) : null}
                                {caption ? (
                                    <div className="intent-control-range-caption">{caption}</div>
                                ) : null}
                            </div>

                            {computedValueLabel ? (
                                <div className="intent-control-range-value">
                                    {computedValueLabel}
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    <div className="intent-control-range-main">
                        {leading ? (
                            <span className="intent-control-range-leading" aria-hidden="true">
                                {leading}
                            </span>
                        ) : null}

                        <div className="intent-control-range-track" style={rangeStyle}>
                            {renderTrackDecor()}

                            <input
                                {...nativeProps}
                                ref={forwardedRef}
                                type="range"
                                min={min}
                                max={max}
                                step={step}
                                value={isControlled ? value : internalValue}
                                defaultValue={isControlled ? undefined : defaultValue}
                                className={inputCls}
                                disabled={disabled || readOnly}
                                aria-invalid={invalid || undefined}
                                aria-disabled={disabled || readOnly || undefined}
                                aria-readonly={readOnly || undefined}
                                onChange={handleChange}
                            />
                        </div>

                        {trailing ? (
                            <span className="intent-control-range-trailing" aria-hidden="true">
                                {trailing}
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }
);

export default IntentControlRange;
