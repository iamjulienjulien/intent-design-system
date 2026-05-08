"use client";

// src/components/intent/IntentControlColor.tsx
// IntentControlColor
// - Intent-first color picker built from selectable swatches
// - Default layout: colored circular swatches
// - Optional layouts: grid, list
// - Optional custom color entry via native <input type="color">
// - Works standalone (frame) or inside IntentControlField (insideField=true => naked)
// - Uses resolveIntent() to compute stable hooks + CSS vars
// - No dynamic Tailwind classes: only stable hooks + CSS variables

import * as React from "react";

import { resolveIntent, getIntentLayoutProps, getIntentControlProps } from "CORE";
import {
    SYSTEM_PROPS_TABLE,
    type IntentInput,
    type DocsPropRow,
    type ComponentIdentity,
    type Tone,
} from "SYSTEM";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
    if (!ref) return;
    if (typeof ref === "function") ref(value);
    else (ref as any).current = value;
}

function normalizeHex(input?: string | null) {
    const raw = String(input ?? "")
        .trim()
        .toLowerCase();
    if (!raw) return "";

    if (/^#[0-9a-f]{3}$/i.test(raw)) {
        const r = raw[1];
        const g = raw[2];
        const b = raw[3];
        return `#${r}${r}${g}${g}${b}${b}`;
    }

    if (/^#[0-9a-f]{6}$/i.test(raw)) return raw;
    return "";
}

function isDarkHex(hex: string) {
    const v = normalizeHex(hex);
    if (!v) return false;

    const r = parseInt(v.slice(1, 3), 16);
    const g = parseInt(v.slice(3, 5), 16);
    const b = parseInt(v.slice(5, 7), 16);

    // relative luminance-ish shortcut
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.55;
}

function makeColorOption(
    value: string,
    label?: string,
    description?: string
): IntentControlColorOption {
    return {
        value: normalizeHex(value),
        label: label ?? value,
        description: String(description),
    };
}

function mergeUniqueOptions(options: IntentControlColorOption[]) {
    const seen = new Set<string>();
    const out: IntentControlColorOption[] = [];

    for (const option of options) {
        const hex = normalizeHex(option.value);
        if (!hex) continue;
        if (seen.has(hex)) continue;
        seen.add(hex);
        out.push({
            ...option,
            value: hex,
        });
    }

    return out;
}

function sizeClass(size: ColorSize) {
    return `ids-control-${size}`;
}

/* ============================================================================
   🎨 PRESETS
============================================================================ */

export type IntentControlColorSetName =
    | "core"
    | "pastel"
    | "earth"
    | "ocean"
    | "sunset"
    | "forest"
    | "royal"
    | "mono"
    | "neon";

export type IntentControlColorOption = {
    value: string;
    label?: string;
    description?: string;
};

export const INTENT_CONTROL_COLOR_SETS: Record<
    IntentControlColorSetName,
    IntentControlColorOption[]
> = {
    core: [
        makeColorOption("#ef4444", "Rouge"),
        makeColorOption("#f97316", "Orange"),
        makeColorOption("#f59e0b", "Ambre"),
        makeColorOption("#eab308", "Jaune"),
        makeColorOption("#22c55e", "Vert"),
        makeColorOption("#10b981", "Émeraude"),
        makeColorOption("#06b6d4", "Cyan"),
        makeColorOption("#3b82f6", "Bleu"),
        makeColorOption("#6366f1", "Indigo"),
        makeColorOption("#8b5cf6", "Violet"),
        makeColorOption("#ec4899", "Rose"),
        makeColorOption("#6b7280", "Gris"),
    ],
    pastel: [
        makeColorOption("#fecdd3", "Rose pastel"),
        makeColorOption("#fed7aa", "Pêche"),
        makeColorOption("#fde68a", "Beurre"),
        makeColorOption("#d9f99d", "Citron vert"),
        makeColorOption("#bbf7d0", "Menthe"),
        makeColorOption("#a7f3d0", "Lagune"),
        makeColorOption("#bae6fd", "Ciel"),
        makeColorOption("#c7d2fe", "Lavande"),
        makeColorOption("#ddd6fe", "Lilas"),
        makeColorOption("#fbcfe8", "Barbe à papa"),
    ],
    earth: [
        makeColorOption("#7c2d12", "Terre cuite"),
        makeColorOption("#9a3412", "Brique"),
        makeColorOption("#b45309", "Ocre"),
        makeColorOption("#92400e", "Miel brun"),
        makeColorOption("#365314", "Mousse"),
        makeColorOption("#3f6212", "Olive"),
        makeColorOption("#57534e", "Pierre"),
        makeColorOption("#78716c", "Argile"),
    ],
    ocean: [
        makeColorOption("#082f49", "Abysses"),
        makeColorOption("#0c4a6e", "Atlantique"),
        makeColorOption("#0369a1", "Océan"),
        makeColorOption("#0284c7", "Azur"),
        makeColorOption("#0891b2", "Lagon"),
        makeColorOption("#0f766e", "Sarcelle"),
        makeColorOption("#155e75", "Tempête"),
    ],
    sunset: [
        makeColorOption("#7f1d1d", "Braise"),
        makeColorOption("#b91c1c", "Rouge vif"),
        makeColorOption("#ea580c", "Mandarine"),
        makeColorOption("#f97316", "Coucher"),
        makeColorOption("#fb7185", "Rose chaud"),
        makeColorOption("#be185d", "Framboise"),
        makeColorOption("#7e22ce", "Prune"),
    ],
    forest: [
        makeColorOption("#14532d", "Forêt profonde"),
        makeColorOption("#166534", "Sapin"),
        makeColorOption("#15803d", "Canopée"),
        makeColorOption("#16a34a", "Feuille"),
        makeColorOption("#65a30d", "Mousse claire"),
        makeColorOption("#4d7c0f", "Sous-bois"),
    ],
    royal: [
        makeColorOption("#1e1b4b", "Minuit"),
        makeColorOption("#312e81", "Indigo royal"),
        makeColorOption("#4338ca", "Saphir"),
        makeColorOption("#6d28d9", "Améthyste"),
        makeColorOption("#7e22ce", "Pourpre"),
        makeColorOption("#a21caf", "Magenta royal"),
        makeColorOption("#be185d", "Velours"),
    ],
    mono: [
        makeColorOption("#111827", "Noir"),
        makeColorOption("#374151", "Anthracite"),
        makeColorOption("#6b7280", "Gris"),
        makeColorOption("#9ca3af", "Gris clair"),
        makeColorOption("#d1d5db", "Brume"),
        makeColorOption("#f3f4f6", "Perle"),
        makeColorOption("#ffffff", "Blanc"),
    ],
    neon: [
        makeColorOption("#ff005c", "Rose néon"),
        makeColorOption("#ff7a00", "Orange néon"),
        makeColorOption("#d4ff00", "Lime néon"),
        makeColorOption("#00f5a0", "Menthe néon"),
        makeColorOption("#00e5ff", "Cyan néon"),
        makeColorOption("#3b82f6", "Bleu électrique"),
        makeColorOption("#8b5cf6", "Violet néon"),
    ],
};

/* ============================================================================
   🧩 TYPES
============================================================================ */

type ColorSize = "xs" | "sm" | "md" | "lg" | "xl";
type ColorLayout = "swatches" | "grid" | "list";
type ColorShape = "circle" | "square" | "pill";

type ColorChangeMeta = {
    option: IntentControlColorOption | null;
    fromCustomInput: boolean;
    isCustom: boolean;
    setName?: IntentControlColorSetName;
};

type BaseProps = IntentInput & {
    className?: string;

    /** Visual / layout */
    size?: ColorSize; // default "md"
    fullWidth?: boolean; // default false
    layout?: ColorLayout; // default "swatches"
    shape?: ColorShape; // default "circle"
    columns?: 2 | 3 | 4 | 5 | 6 | 7 | 8; // grid only
    showLabels?: boolean; // default false
    showHex?: boolean; // default false

    /** Content */
    options?: IntentControlColorOption[];
    colorSet?: IntentControlColorSetName; // default "core"
    includeSetColorsFirst?: boolean; // default true

    /** Slots */
    leading?: React.ReactNode;
    trailing?: React.ReactNode;

    /** State */
    invalid?: boolean; // default false
    readOnly?: boolean; // default false
    insideField?: boolean; // default false

    /** Custom color */
    allowCustom?: boolean; // default false
    customLabel?: string; // default "Personnalisée"

    /** Value model */
    value?: string | null;
    defaultValue?: string | null;
    onValueChange?: (value: string | null, meta: ColorChangeMeta) => void;

    /** Behaviour */
    deselectable?: boolean; // default false

    /** Optional tone for auto “toned” fallback inside Intents usage */
    tonedFallbackTone?: Tone; // default "emerald"
};

export type IntentControlColorProps = BaseProps &
    Omit<
        React.HTMLAttributes<HTMLDivElement>,
        "className" | "children" | "onChange" | "defaultValue"
    >;

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_COLOR_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "layout",
        description: {
            fr: "Disposition visuelle des couleurs.",
            en: "Visual layout for colors.",
        },
        type: `"swatches" | "grid" | "list"`,
        required: false,
        default: "swatches",
        fromSystem: false,
    },
    {
        name: "shape",
        description: {
            fr: "Forme des items couleur.",
            en: "Shape of color items.",
        },
        type: `"circle" | "square" | "pill"`,
        required: false,
        default: "circle",
        fromSystem: false,
    },
    {
        name: "options",
        description: {
            fr: "Liste personnalisée d’options couleur.",
            en: "Custom color options list.",
        },
        type: `{ value: string; label?: string; description?: string }[]`,
        required: false,
        fromSystem: false,
    },
    {
        name: "colorSet",
        description: {
            fr: "Set de couleurs prédéfini.",
            en: "Predefined color set.",
        },
        type: `"core" | "pastel" | "earth" | "ocean" | "sunset" | "forest" | "royal" | "mono" | "neon"`,
        required: false,
        default: "core",
        fromSystem: false,
    },
    {
        name: "allowCustom",
        description: {
            fr: "Ajoute un picker natif pour choisir une couleur personnalisée.",
            en: "Adds a native color picker for custom color selection.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "showLabels / showHex",
        description: {
            fr: "Affiche le label et/ou la valeur hex.",
            en: "Displays label and/or hex value.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "value",
        description: {
            fr: "Couleur sélectionnée au format hex (#rrggbb).",
            en: "Selected color as hex (#rrggbb).",
        },
        type: "string | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultValue",
        description: {
            fr: "Valeur initiale si uncontrolled.",
            en: "Initial value if uncontrolled.",
        },
        type: "string | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "onValueChange",
        description: {
            fr: "Callback valeur + meta de sélection.",
            en: "Selection callback with value + meta.",
        },
        type: "(value: string | null, meta: ColorChangeMeta) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "insideField",
        description: {
            fr: "Mode naked pour usage dans IntentControlField.",
            en: "Naked mode for IntentControlField usage.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille globale du contrôle.",
            en: "Global control size.",
        },
        type: `"xs" | "sm" | "md" | "lg" | "xl"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
];

export const IntentControlColorPropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_COLOR_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlColorIdentity: ComponentIdentity = {
    name: "IntentControlColor",
    kind: "control",
    description: {
        fr: "Contrôle de couleur intent-first basé sur des pastilles sélectionnables, avec sets prédéfinis et couleur personnalisée optionnelle.",
        en: "Intent-first color control based on selectable swatches, with predefined sets and optional custom color.",
    },
    since: "0.3.2",
    docs: { route: "/playground/components/intent-control-color" },
    anatomy: {
        root: "<div>",
        rail: ".intent-control-color-rail",
        item: ".intent-control-color-item",
        swatch: ".intent-control-color-swatch",
        text: ".intent-control-color-text",
        custom: ".intent-control-color-custom",
    },
    classHooks: [
        "intent-control",
        "intent-control-color",
        "intent-control-color-standalone",
        "intent-control-color-naked",
        "intent-control-color-rail",
        "intent-control-color-item",
        "intent-control-color-swatch",
        "intent-control-color-label",
        "intent-control-color-hex",
        "intent-control-color-custom",
        "intent-control-color-custom-input",
        "is-invalid",
        "is-disabled",
        "is-readonly",
        "is-selected",
        "layout-swatches",
        "layout-grid",
        "layout-list",
        "shape-circle",
        "shape-square",
        "shape-pill",
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

export const IntentControlColor = React.forwardRef<HTMLDivElement, IntentControlColorProps>(
    function IntentControlColor(props, forwardedRef) {
        const {
            className,

            size = "md",
            fullWidth = false,
            layout = "swatches",
            shape = "circle",
            columns = 6,
            showLabels = false,
            showHex = false,

            options,
            colorSet = "core",
            includeSetColorsFirst = true,

            leading,
            trailing,

            invalid = false,
            readOnly = false,
            insideField = false,

            allowCustom = false,
            customLabel = "Personnalisée",

            value: valueProp,
            defaultValue,
            onValueChange,

            deselectable = false,
            tonedFallbackTone = "emerald",

            intent,
            variant,
            tone,
            glow,
            intensity,
            mode,
            toneStep,
            disabled: disabledProp,

            ...nativeDivProps
        } = props as any;

        const disabled = Boolean(disabledProp);

        const safeTone = intent === "toned" && tone == null ? tonedFallbackTone : tone;

        const intentInput: IntentInput = {
            ...(intent !== undefined ? { intent } : {}),
            ...(variant !== undefined ? { variant } : {}),
            ...(safeTone !== undefined ? { tone: safeTone } : {}),
            ...(glow !== undefined ? { glow } : {}),
            ...(intensity !== undefined ? { intensity } : {}),
            ...(mode !== undefined ? { mode } : {}),
            ...(toneStep !== undefined ? { toneStep } : {}),
            disabled,
        };

        const resolved = resolveIntent(intentInput);
        const layoutProps = getIntentLayoutProps(resolved);
        const controlProps = getIntentControlProps(resolved);

        const rootRef = React.useRef<HTMLDivElement | null>(null);

        React.useEffect(() => {
            setRef(forwardedRef, rootRef.current as any);
        }, [forwardedRef]);

        const setOptions =
            INTENT_CONTROL_COLOR_SETS[colorSet as IntentControlColorSetName] ??
            INTENT_CONTROL_COLOR_SETS.core;

        const mergedOptions = React.useMemo(() => {
            const extra = Array.isArray(options) ? options : [];
            const combined = includeSetColorsFirst
                ? [...setOptions, ...extra]
                : [...extra, ...setOptions];
            return mergeUniqueOptions(combined);
        }, [includeSetColorsFirst, options, setOptions]);

        const normalizedDefaultValue = normalizeHex(defaultValue ?? null);
        const isControlled = valueProp !== undefined;

        const [uncontrolledValue, setUncontrolledValue] = React.useState<string | null>(
            normalizedDefaultValue || null
        );

        const currentValue =
            normalizeHex(isControlled ? (valueProp ?? null) : (uncontrolledValue ?? null)) || null;

        const selectedOption =
            mergedOptions.find((option) => normalizeHex(option.value) === currentValue) ?? null;

        function emit(nextValue: string | null, meta: ColorChangeMeta) {
            if (!isControlled) setUncontrolledValue(nextValue);
            onValueChange?.(nextValue, meta);
        }

        function handleSelect(option: IntentControlColorOption) {
            if (disabled || readOnly) return;

            const hex = normalizeHex(option.value);
            const isSelected = currentValue === hex;

            if (isSelected && deselectable) {
                emit(null, {
                    option: null,
                    fromCustomInput: false,
                    isCustom: false,
                    setName: colorSet,
                });
                return;
            }

            emit(hex, {
                option,
                fromCustomInput: false,
                isCustom: false,
                setName: colorSet,
            });
        }

        function handleCustomChange(raw: string) {
            if (disabled || readOnly) return;

            const hex = normalizeHex(raw);
            if (!hex) return;

            emit(hex, {
                option: {
                    value: hex,
                    label: customLabel,
                },
                fromCustomInput: true,
                isCustom: !mergedOptions.some((o) => normalizeHex(o.value) === hex),
                setName: colorSet,
            });
        }

        function onKeyActivate(
            e: React.KeyboardEvent<HTMLButtonElement>,
            option: IntentControlColorOption
        ) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSelect(option);
            }
        }

        const railCls = cn(
            "intent-control-color-rail",
            `layout-${layout}`,
            `shape-${shape}`,
            sizeClass(size),
            fullWidth && "w-full"
        );

        const rootCls = cn(
            "intent-control intent-control-color",
            insideField ? "intent-control-color-naked" : "intent-control-color-standalone",
            sizeClass(size),
            invalid && "is-invalid",
            disabled && "is-disabled",
            readOnly && "is-readonly",
            fullWidth && "w-full",
            className
        );

        const customInputValue = currentValue ?? "#000000";

        const content = (
            <>
                {leading ? (
                    <span className="intent-control-color-leading" aria-hidden>
                        {leading}
                    </span>
                ) : null}

                <div
                    className={railCls}
                    style={
                        {
                            "--intent-control-color-columns": String(columns),
                        } as React.CSSProperties
                    }
                    role="listbox"
                    aria-disabled={disabled || undefined}
                    aria-readonly={readOnly || undefined}
                    aria-invalid={invalid || undefined}
                >
                    {mergedOptions.map((option) => {
                        const hex = normalizeHex(option.value);
                        const selected = currentValue === hex;
                        const label = option.label ?? hex;
                        const dark = isDarkHex(hex);

                        return (
                            <button
                                key={hex}
                                type="button"
                                className={cn(
                                    "intent-control-color-item",
                                    selected && "is-selected"
                                )}
                                role="option"
                                aria-selected={selected}
                                aria-label={label}
                                title={option.description || label}
                                disabled={disabled}
                                onClick={() => handleSelect(option)}
                                onKeyDown={(e) => onKeyActivate(e, option)}
                            >
                                <span
                                    className={cn("intent-control-color-swatch", dark && "is-dark")}
                                    style={
                                        {
                                            "--intent-control-color": hex,
                                        } as React.CSSProperties
                                    }
                                    aria-hidden
                                >
                                    <span className="intent-control-color-check" aria-hidden>
                                        ✓
                                    </span>
                                </span>

                                {(layout === "list" || showLabels || showHex) && (
                                    <span className="intent-control-color-text">
                                        {showLabels ? (
                                            <span className="intent-control-color-label">
                                                {label}
                                            </span>
                                        ) : null}
                                        {showHex ? (
                                            <span className="intent-control-color-hex">{hex}</span>
                                        ) : null}
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    {allowCustom ? (
                        <label className="intent-control-color-custom" title={customLabel}>
                            <span className="intent-control-color-custom-chip">
                                <span
                                    className="intent-control-color-swatch custom"
                                    style={
                                        {
                                            "--intent-control-color": customInputValue,
                                        } as React.CSSProperties
                                    }
                                    aria-hidden
                                />
                                {(layout === "list" || showLabels || showHex) && (
                                    <span className="intent-control-color-text">
                                        {showLabels ? (
                                            <span className="intent-control-color-label">
                                                {customLabel}
                                            </span>
                                        ) : null}
                                        {showHex ? (
                                            <span className="intent-control-color-hex">
                                                {currentValue ?? customInputValue}
                                            </span>
                                        ) : null}
                                    </span>
                                )}
                            </span>

                            <input
                                className="intent-control-color-custom-input"
                                type="color"
                                value={customInputValue}
                                onChange={(e) => handleCustomChange(e.target.value)}
                                disabled={disabled}
                                aria-label={customLabel}
                                tabIndex={disabled ? -1 : 0}
                            />
                        </label>
                    ) : null}
                </div>

                {trailing ? (
                    <span className="intent-control-color-trailing" aria-hidden>
                        {trailing}
                    </span>
                ) : null}
            </>
        );

        if (insideField) {
            return (
                <div
                    {...(nativeDivProps as React.HTMLAttributes<HTMLDivElement>)}
                    {...layoutProps}
                    ref={rootRef}
                    className={cn(layoutProps.className, rootCls)}
                >
                    {content}
                </div>
            );
        }

        const rootProps = {
            ...layoutProps,
            ...controlProps,
            ...(nativeDivProps as React.HTMLAttributes<HTMLDivElement>),
            className: cn(layoutProps.className, controlProps.className, rootCls),
            "data-intent": resolved.intent,
            "data-variant": resolved.variant,
            "data-intensity": resolved.intensity,
            "data-mode": resolved.mode,
            "data-tonestep": resolved.toneStep,
        } as const;

        return (
            <div {...(rootProps as any)} ref={rootRef}>
                {content}
            </div>
        );
    }
);
