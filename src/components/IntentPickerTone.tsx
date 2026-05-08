"use client";

// src/components/intent/IntentPickerTone.tsx
// IntentPickerTone
// - Intent-first tone picker (custom select + color swatches)
// - Uses IntentControlField for label/hint/error + intent vars
// - Uses IntentControlSelect for a richer combobox/listbox experience
// - Shows tone color like a color picker (swatch in trigger + each option)
// - Supports optional "themed" + "ink"

import * as React from "react";

import {
    SYSTEM_PROPS_TABLE,
    type Tone,
    type IntentInput,
    type DocsPropRow,
    type ComponentIdentity,
    TONE,
    type ToneMeta,
} from "SYSTEM";
import { cn } from "HELPERS";
import { IntentControlField } from "./IntentControlField";
import { IntentControlSelect, type IntentControlSelectOption } from "./IntentControlSelect";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

export type ToneValue = Tone | "themed" | "ink";

const DEFAULT_TONE_OPTIONS: ToneValue[] = [
    "slate",
    "gray",
    "zinc",
    "neutral",
    "stone",
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
];

function normalizeToneValue(v: string): ToneValue {
    // if (v === "themed" || v === "ink") return v;
    return v as Tone;
}

/**
 * Swatch color strategy:
 * - For regular tones: use Tailwind color-500 through CSS var fallback.
 * - For "themed": use intent/theme tokens when available.
 * - For "ink": use --intent-ink / near-ink.
 *
 * Notes:
 * - This is "best-effort": if your DS defines tone tokens as CSS vars, swap mapping here.
 */
function toneSwatchStyle(tone: ToneMeta): React.CSSProperties {
    return {
        background: tone.color.hex,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
    };
}

function Swatch({ tone }: { tone: ToneMeta }) {
    return <span aria-hidden className="intent-picker-tone-swatch" style={toneSwatchStyle(tone)} />;
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentPickerToneProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children" | "onChange"> & {
        className?: string;

        /** Controlled value */
        value: ToneValue;

        /** Change callback */
        onChange: (tone: ToneValue | null) => void;

        /** Options */
        options?: ToneValue[]; // default: DEFAULT_TONE_OPTIONS (+ extras depending on flags)

        /** Include special tones */
        includeThemed?: boolean; // default false
        includeInk?: boolean; // default false

        /** Label row */
        label?: React.ReactNode; // default "Tone"
        labelFor?: string;
        hint?: React.ReactNode;
        error?: React.ReactNode;

        /** State */
        disabled?: boolean;
        invalid?: boolean;

        /** Layout */
        compact?: boolean;
        padded?: boolean;

        /** Leading/trailing slots (optional) */
        leading?: React.ReactNode;
        trailing?: React.ReactNode;

        /** Select props */
        placeholder?: string; // default "Select…"
        size?: "xs" | "sm" | "md" | "lg" | "xl"; // forwarded to IntentControlSelect
        fullWidth?: boolean; // forwarded to IntentControlSelect
        clearable?: boolean; // default false

        /** A11y */
        ariaLabel?: string; // default "Tone"
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_PICKER_TONE_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "value",
        description: { fr: "Tone sélectionné.", en: "Selected tone." },
        type: "Tone | 'themed' | 'ink'",
        required: true,
        fromSystem: false,
    },
    {
        name: "onChange",
        description: { fr: "Callback de changement.", en: "Change callback." },
        type: "(tone: Tone | 'themed' | 'ink') => void",
        required: true,
        fromSystem: false,
    },
    {
        name: "options",
        description: { fr: "Liste d’options tonales.", en: "Tone options list." },
        type: "(Tone | 'themed' | 'ink')[]",
        required: false,
        default: "DEFAULT_TONE_OPTIONS",
        fromSystem: false,
    },
    {
        name: "includeThemed",
        description: { fr: "Ajoute l’option themed.", en: "Adds the themed option." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "includeInk",
        description: { fr: "Ajoute l’option ink.", en: "Adds the ink option." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "label",
        description: { fr: "Label du picker.", en: "Picker label." },
        type: "React.ReactNode",
        required: false,
        default: "Tone",
        fromSystem: false,
    },
    {
        name: "hint",
        description: { fr: "Texte d’aide.", en: "Help text." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "error",
        description: { fr: "Texte d’erreur.", en: "Error text." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "disabled",
        description: { fr: "Désactive le picker.", en: "Disables the picker." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "invalid",
        description: { fr: "Force l’état invalide.", en: "Forces invalid state." },
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
        description: { fr: "Padding interne du frame.", en: "Inner frame padding." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "placeholder",
        description: { fr: "Placeholder du select.", en: "Select placeholder." },
        type: "string",
        required: false,
        default: "Select…",
        fromSystem: false,
    },
    {
        name: "size",
        description: { fr: "Taille du select.", en: "Select size." },
        type: `"xs" | "sm" | "md" | "lg" | "xl"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: { fr: "Select pleine largeur.", en: "Full width select." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "clearable",
        description: { fr: "Option Clear (null).", en: "Clear option (null)." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
];

export const IntentPickerTonePropsTable: DocsPropRow[] = [
    ...INTENT_PICKER_TONE_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentPickerToneIdentity: ComponentIdentity = {
    name: "IntentPickerTone",
    kind: "control",
    description: {
        fr: "Sélecteur de tone riche: combobox + swatches (color picker), options themed/ink, intent-first.",
        en: "Rich tone picker: combobox + swatches (color picker), themed/ink options, intent-first.",
    },
    since: "0.2.0",
    docs: { route: "/playground/components/intent-picker-tone" },
    anatomy: {
        root: "<div>",
        field: "<IntentControlField>",
        select: "<IntentControlSelect>",
        option: "li[role='option']",
        swatch: ".intent-picker-tone-swatch",
    },
    classHooks: ["intent-picker-tone", "intent-picker-tone-swatch", "intent-picker-tone-option"],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentPickerTone(props: IntentPickerToneProps) {
    const {
        className,

        value,
        onChange,

        options,
        includeThemed = false,
        includeInk = false,

        label = "Tone",
        labelFor,
        hint,
        error,

        disabled = false,
        invalid = false,

        compact = false,
        padded = false,

        leading,
        trailing,

        placeholder = "Select…",
        size = "md",
        fullWidth = true,
        clearable = false,

        ariaLabel = "Tone",

        // DS props (⚠️ may be undefined)
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: dsDisabled,

        ...divProps
    } = props;

    const fieldId = labelFor ?? React.useId();

    const optionsResolved = React.useMemo(() => {
        const base = TONE;
        // const out: ToneValue[] = [...base];

        // if (includeThemed && !out.includes("themed")) out.push("themed");
        // if (includeInk && !out.includes("ink")) out.push("ink");

        return base;
    }, [options, includeThemed, includeInk]);

    // Build select options with swatches in label.
    // The IntentControlSelect Option label is a string, but we can encode the swatch via `description`
    // OR render swatch by CSS using data-value hooks.
    //
    // Since your IntentControlSelect currently renders label as text only, we do this:
    // - label: tone name
    // - description: " " (keeps room)
    // - and we style via data-value by wrapping option content in the select component (not available)
    //
    // So we instead leverage the trigger "leading" slot (swatch) + show swatches in field `trailing` as mini preview row
    // AND we add per-option swatches by extending IntentControlSelect minimal: allow ReactNode label.
    //
    // 👉 To avoid touching IntentControlSelect right now, we do a pragmatic approach:
    // - show swatch in trigger via `leading`
    // - show a grid of swatches under the select (optional, enabled by default)
    //
    // If you want swatches inside the dropdown list, tell me: I'll give you the small change to IntentControlSelect:
    // `label: React.ReactNode` instead of string.
    const selectOptions: IntentControlSelectOption[] = React.useMemo(
        () =>
            optionsResolved.map((t) => ({
                value: t.value,
                searchText: t.value,
                label: (
                    <span className="intent-picker-tone-option">
                        <Swatch tone={t} />
                        <span className="intent-picker-tone-optionText">{t.label}</span>
                    </span>
                ),
            })),
        [optionsResolved]
    );

    // const selectedTone = normalizeToneValue(String(value));

    // ✅ exactOptionalPropertyTypes: do NOT pass undefined as a value
    const dsInput: IntentInput = {
        ...(intent !== undefined ? { intent } : {}),
        ...(variant !== undefined ? { variant } : {}),
        ...(tone !== undefined ? { tone } : {}),
        ...(glow !== undefined ? { glow } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),
        ...(dsDisabled !== undefined ? { disabled: dsDisabled } : {}),
    };

    const dsInput2: IntentInput = {
        ...(intent !== undefined ? { intent } : {}),
        // ...(variant !== undefined ? { variant } : {}),
        // ...(tone !== undefined ? { tone } : {}),
        // ...(glow !== undefined ? { glow } : {}),
        // ...(intensity !== undefined ? { intensity } : {}),
        // ...(mode !== undefined ? { mode } : {}),
        // ...(dsDisabled !== undefined ? { disabled: dsDisabled } : {}),
    };

    return (
        <IntentControlField
            {...divProps}
            {...dsInput2}
            variant="ghost"
            className={cn("intent-picker-tone", className)}
            label={label}
            labelFor={fieldId}
            hint={hint}
            error={error}
            disabled={disabled}
            invalid={invalid}
            compact={compact}
            padded={false}
            leading={leading}
            trailing={trailing}
            optionalLabel=""
        >
            <div className="w-full min-w-0">
                <IntentControlSelect
                    // keep select accessible
                    aria-label={typeof label === "string" ? label : ariaLabel}
                    options={selectOptions}
                    value={String(value)}
                    onValueChange={(next) => {
                        if (disabled) return;

                        if (next === null) {
                            // clearable path: pick first available option
                            // (IntentPickerTone has no "null" in its value type)
                            // const fallback = optionsResolved[0] ?? "slate";
                            onChange(null);
                            return;
                        }

                        onChange(next as ToneValue);
                    }}
                    placeholder={placeholder}
                    size={size}
                    fullWidth={true}
                    clearable={clearable}
                    disabled={disabled}
                    {...dsInput}
                />

                {/* Mini palette preview (cheap + super useful) */}
                {/* <div className="intent-picker-tone-palette" aria-hidden="true">
                    {optionsResolved.map((t) => {
                        const isActive = String(t) === String(value);

                        return (
                            <button
                                key={String(t)}
                                type="button"
                                className={cn(
                                    "intent-picker-tone-swatchBtn",
                                    isActive && "is-active"
                                )}
                                onClick={() => !disabled && onChange(t)}
                                title={String(t)}
                                disabled={disabled}
                            >
                                <Swatch tone={t} />
                            </button>
                        );
                    })}
                </div> */}
            </div>
        </IntentControlField>
    );
}
