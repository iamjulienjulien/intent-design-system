"use client";

// src/components/intent/IntentPickerGlow.tsx
// IntentPickerGlow
// - Glow picker with 2 modes:
//   1) toggle (IntentControlToggle): on/off (true/false)
//   2) select (IntentControlSelect): aesthetic glow list ("aurora" | "ember" | ...)
// - Uses IntentControlField for label/hint/error + intent vars
// - Intent-first, stable class hooks

import * as React from "react";
import {
    SYSTEM_PROPS_TABLE,
    type ComponentIdentity,
    type DocsPropRow,
    type IntentInput,
    type Glow,
    GLOW,
    type GlowMeta,
    type GlowMeta2,
    isAestheticGlow,
} from "SYSTEM";

import { IntentControlField } from "./IntentControlField";
import { IntentControlToggle } from "./IntentControlToggle";
import { IntentControlSelect, type IntentControlSelectOption } from "./IntentControlSelect";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export type GlowPickerMode = "toggle" | "select";

export type GlowValue = boolean | Glow | "true" | "false";

function normalizeGlowValue(v: unknown): GlowValue {
    if (typeof v === "boolean") return v;
    if (typeof v === "string" && isAestheticGlow(v)) return v;
    return false;
}

function GlowSwatch({ glow }: { glow: GlowMeta2 }) {
    const style: React.CSSProperties | undefined = glow.gradient.swatch
        ? {
              backgroundImage: glow.gradient.swatch,
          }
        : undefined;

    return <span aria-hidden className="intent-picker-glow-swatch" style={style} />;
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentPickerGlowProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children" | "onChange"> & {
        className?: string;

        /**
         * Mode
         * - "toggle": true/false via IntentControlToggle
         * - "select": Glow via IntentControlSelect
         */
        pickerMode?: GlowPickerMode; // default: "toggle"

        /** Controlled value */
        value: GlowValue;

        /** Change callback */
        onChange: (value: GlowValue) => void;

        /** Aesthetic glow options (select mode) */
        options?: GlowMeta2[]; // default: DEFAULT_AESTHETIC_GLOWS

        /** Label row */
        label?: React.ReactNode; // default: "Glow"
        labelFor?: string;
        hint?: React.ReactNode;
        error?: React.ReactNode;

        /** State */
        disabled?: boolean;
        invalid?: boolean;

        /** Layout */
        compact?: boolean;
        padded?: boolean;

        /** Slots */
        leading?: React.ReactNode;
        trailing?: React.ReactNode;

        /** Toggle copy (toggle mode) */
        toggleLabel?: React.ReactNode; // default: "Glow enabled"
        toggleDescription?: React.ReactNode; // optional

        /** Select props (select mode) */
        placeholder?: string; // default: "Select…"
        size?: "xs" | "sm" | "md" | "lg" | "xl"; // forwarded to IntentControlSelect
        fullWidth?: boolean; // forwarded to IntentControlSelect
        clearable?: boolean; // default: false

        /** A11y */
        ariaLabel?: string; // default: "Glow"
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_PICKER_GLOW_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "pickerMode",
        description: {
            fr: "Mode du picker: toggle ou select.",
            en: "Picker mode: toggle or select.",
        },
        type: `"toggle" | "select"`,
        required: false,
        default: "toggle",
        fromSystem: false,
    },
    {
        name: "value",
        description: {
            fr: "Valeur: boolean (toggle) ou Glow (select).",
            en: "Value: boolean (toggle) or Glow (select).",
        },
        type: "boolean | Glow",
        required: true,
        fromSystem: false,
    },
    {
        name: "onChange",
        description: { fr: "Callback de changement.", en: "Change callback." },
        type: "(value: boolean | Glow) => void",
        required: true,
        fromSystem: false,
    },
    {
        name: "options",
        description: {
            fr: "Liste des glows esthétiques (mode select).",
            en: "Aesthetic glow options (select mode).",
        },
        type: "Glow[]",
        required: false,
        default: "DEFAULT_AESTHETIC_GLOWS",
        fromSystem: false,
    },
    {
        name: "toggleLabel",
        description: { fr: "Label du toggle (mode toggle).", en: "Toggle label (toggle mode)." },
        type: "React.ReactNode",
        required: false,
        default: "Glow enabled",
        fromSystem: false,
    },
    {
        name: "toggleDescription",
        description: {
            fr: "Description du toggle (mode toggle).",
            en: "Toggle description (toggle mode).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "placeholder",
        description: {
            fr: "Placeholder du select (mode select).",
            en: "Select placeholder (select mode).",
        },
        type: "string",
        required: false,
        default: "Select…",
        fromSystem: false,
    },
    {
        name: "size",
        description: { fr: "Taille du select (mode select).", en: "Select size (select mode)." },
        type: `"xs" | "sm" | "md" | "lg" | "xl"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: {
            fr: "Select pleine largeur (mode select).",
            en: "Full width select (select mode).",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "clearable",
        description: { fr: "Affiche 'Clear' (mode select).", en: "Shows 'Clear' (select mode)." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
];

export const IntentPickerGlowPropsTable: DocsPropRow[] = [
    ...INTENT_PICKER_GLOW_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentPickerGlowIdentity: ComponentIdentity = {
    name: "IntentPickerGlow",
    kind: "control",
    description: {
        fr: "Sélecteur de glow (toggle on/off ou select des aesthetic glows), intent-first.",
        en: "Glow picker (on/off toggle or aesthetic glow select), intent-first.",
    },
    since: "0.2.0",
    docs: { route: "/playground/components/intent-picker-glow" },
    anatomy: {
        root: "<div>",
        field: "<IntentControlField>",
        toggle: "<IntentControlToggle>",
        select: "<IntentControlSelect>",
        swatch: ".intent-picker-glow-swatch",
        option: ".intent-picker-glow-option",
    },
    classHooks: [
        "intent-picker-glow",
        "intent-picker-glow-swatch",
        "intent-picker-glow-option",
        "intent-picker-glow-optionText",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentPickerGlow(props: IntentPickerGlowProps) {
    const {
        className,

        pickerMode = "toggle",
        value,
        onChange,

        options,

        label = "Glow",
        labelFor,
        hint,
        error,

        disabled = false,
        invalid = false,

        compact = false,
        padded = false,

        leading,
        trailing,

        toggleLabel = "Glow enabled",
        toggleDescription,

        placeholder = "Select…",
        size = "md",
        fullWidth = true,
        clearable = false,

        ariaLabel = "Glow",

        // DS props
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
        const base = options ?? GLOW.filter((g) => g.category === "aesthetic");
        // unique + stable order
        return base;
    }, [options]);

    // Select options with a swatch + label
    const selectOptions: IntentControlSelectOption[] = React.useMemo(
        () =>
            optionsResolved.map((g) => ({
                value: g.value,
                searchText: g.value,
                label: (
                    <span className="intent-picker-glow-option">
                        <GlowSwatch glow={g} />
                        <span className="intent-picker-glow-optionText">{g.label}</span>
                    </span>
                ),
            })),
        [optionsResolved]
    );

    // ✅ exactOptionalPropertyTypes: only spread defined
    const dsInput: IntentInput = {
        ...(intent !== undefined ? { intent } : {}),
        ...(variant !== undefined ? { variant } : {}),
        ...(tone !== undefined ? { tone } : {}),
        ...(glow !== undefined ? { glow } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),
        ...(dsDisabled !== undefined ? { disabled: dsDisabled } : {}),
    };

    // Often we keep the Field chrome neutral-ish
    const fieldDsInput: IntentInput = {
        ...(intent !== undefined ? { intent } : {}),
    };

    const normalized = normalizeGlowValue(value);

    const isToggleOn = typeof normalized === "boolean" ? normalized : true;
    const selectedGlow = typeof normalized === "string" ? normalized : null;

    return (
        <IntentControlField
            {...divProps}
            {...fieldDsInput}
            variant="ghost"
            className={cn("intent-picker-glow", className)}
            label={label}
            labelFor={fieldId}
            hint={hint}
            error={error}
            disabled={disabled}
            invalid={invalid}
            compact={compact}
            padded={padded}
            leading={leading}
            trailing={trailing}
            optionalLabel=""
        >
            <div className="w-full min-w-0">
                {pickerMode === "toggle" ? (
                    <IntentControlToggle
                        aria-label={typeof label === "string" ? label : ariaLabel}
                        checked={isToggleOn}
                        onCheckedChange={(checked) => {
                            if (disabled) return;
                            onChange(checked);
                        }}
                        label={toggleLabel}
                        description={toggleDescription}
                        fullWidth={true}
                        {...dsInput}
                    />
                ) : (
                    <IntentControlSelect
                        aria-label={typeof label === "string" ? label : ariaLabel}
                        options={selectOptions}
                        value={selectedGlow}
                        onValueChange={(next) => {
                            if (disabled) return;

                            if (next === null) {
                                // Clear -> false (no glow)
                                onChange(false);
                                return;
                            }

                            onChange(normalizeGlowValue(next));
                        }}
                        placeholder={placeholder}
                        size={size}
                        fullWidth={fullWidth}
                        clearable={clearable}
                        disabled={disabled}
                        portal
                        // insideField
                        {...dsInput}
                    />
                )}
            </div>
        </IntentControlField>
    );
}
