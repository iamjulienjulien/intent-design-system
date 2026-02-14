"use client";

// src/components/intent/IntentControlSelect.tsx
// IntentControlSelect
// - Intent-first Select (custom, not native <select>)
// - Trigger is a button with role="combobox"
// - Popover contains a listbox (ul/li) with keyboard navigation
// - Uses resolveIntent() to compute stable class hooks + CSS vars
// - Supports glow layers like IntentSurface / IntentControlButton
// - No dynamic Tailwind classes: only stable hooks
//
// ✅ Updated (0.2.2):
// - Adds IntentControlField-related props: insideField, invalid, leading, trailing
// - insideField=true => root is "naked" (no frame visuals); intended to be wrapped by IntentControlField
// - Standalone => renders frame visuals on trigger + slots
//
// ✅ Updated (0.2.4):
// - Adds readOnly mode (prevents opening/changing; still focusable for UX)
// - readOnly implies aria-readonly + hook; does NOT set disabled
// - When readOnly: click/keys won't open, options won't commit, clear won't work

import * as React from "react";

import type { IntentInput } from "../lib/intent/types";
import { resolveIntent, getIntentControlProps, getIntentLayoutProps } from "../lib/intent/resolve";

import type { DocsPropRow, ComponentIdentity } from "../lib/intent/types";
import { SYSTEM_PROPS_TABLE } from "../lib/intent/props";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

type SelectSize = "xs" | "sm" | "md" | "lg" | "xl";

function sizeClass(size: SelectSize) {
    return `ids-control-${size}`;
}

function isPrintableChar(e: React.KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    return e.key.length === 1;
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentControlSelectOption = {
    value: string;

    /** Display label (can be rich: icon, swatch, etc.) */
    label: React.ReactNode;

    /** Optional plain text used for typeahead (recommended when label is not a string) */
    searchText?: string;

    description?: string;
    disabled?: boolean;
};

export type IntentControlSelectProps = IntentInput &
    Omit<
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        "className" | "children" | "value" | "defaultValue" | "onChange"
    > & {
        className?: string;

        /** Options rendered in the listbox */
        options: IntentControlSelectOption[];

        /** Controlled value */
        value?: string | null;

        /** Uncontrolled initial value */
        defaultValue?: string | null;

        /** Called when an option is selected */
        onValueChange?: (value: string | null, option?: IntentControlSelectOption) => void;

        /** UI */
        placeholder?: string; // default: "Select…"
        size?: SelectSize; // default: "md"
        fullWidth?: boolean;

        /** Slots (standalone only, like Input/Tags) */
        leading?: React.ReactNode;
        trailing?: React.ReactNode;

        /**
         * When used inside IntentControlField, you generally want the field to own padding.
         * - insideField=true => no frame visuals on trigger/popover; minimal "naked" hooks
         * - standalone => frame visuals + padding
         */
        insideField?: boolean; // default: false

        /** State */
        invalid?: boolean; // default false

        /** ✅ ReadOnly: focusable but not interactive */
        readOnly?: boolean; // default false

        /** Behavior */
        clearable?: boolean; // default: false (allows selecting "null" via a clear row)
        closeOnSelect?: boolean; // default: true
        align?: "start" | "end"; // default: "start" (popover alignment)
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_SELECT_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "className",
        description: {
            fr: "Classes CSS additionnelles appliquées au trigger (standalone ou insideField).",
            en: "Additional CSS classes applied to the trigger (standalone or insideField).",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "options",
        description: {
            fr: "Liste des options (value/label, description optionnelle, disabled).",
            en: "Options list (value/label, optional description, disabled).",
        },
        type: "IntentControlSelectOption[]",
        required: true,
        fromSystem: false,
    },
    {
        name: "value",
        description: {
            fr: "Valeur contrôlée (null = aucune sélection).",
            en: "Controlled value (null = no selection).",
        },
        type: "string | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultValue",
        description: {
            fr: "Valeur initiale non contrôlée.",
            en: "Initial uncontrolled value.",
        },
        type: "string | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "onValueChange",
        description: {
            fr: "Callback quand l’utilisateur sélectionne une option (ou clear).",
            en: "Callback when user selects an option (or clears).",
        },
        type: "(value: string | null, option?: IntentControlSelectOption) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "placeholder",
        description: {
            fr: "Texte affiché quand aucune option n’est sélectionnée.",
            en: "Displayed when no option is selected.",
        },
        type: "string",
        required: false,
        default: "Select…",
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille (hauteur, padding, typo).",
            en: "Size (height, padding, typography).",
        },
        type: `"xs" | "sm" | "md" | "lg" | "xl"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: {
            fr: "Étire le select sur toute la largeur disponible.",
            en: "Stretches the select to full available width.",
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
            fr: "Mode “naked” pour être wrappé par IntentControlField (le frame appartient au Field).",
            en: "“Naked” mode intended to be wrapped by IntentControlField (frame owned by Field).",
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
            fr: "Empêche l’ouverture et la sélection tout en restant focusable (aria-readonly + hook).",
            en: "Prevents opening/selection while remaining focusable (aria-readonly + hook).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "clearable",
        description: {
            fr: "Affiche une ligne “Clear” (valeur null).",
            en: "Shows a “Clear” row (null value).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "closeOnSelect",
        description: {
            fr: "Ferme le popover après sélection.",
            en: "Closes the popover after selecting an option.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "align",
        description: {
            fr: "Alignement horizontal du popover par rapport au trigger.",
            en: "Popover horizontal alignment relative to the trigger.",
        },
        type: `"start" | "end"`,
        required: false,
        default: "start",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Props natives du button trigger (aria-*, data-*, onKeyDown...).",
            en: "Native trigger button props (aria-*, data-*, onKeyDown...).",
        },
        type: "Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'value' | 'defaultValue' | 'onChange'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentControlSelectPropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_SELECT_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlSelectIdentity: ComponentIdentity = {
    name: "IntentControlSelect",
    kind: "control",
    description: {
        fr: "Select intent-first (custom) : combobox + listbox, hooks CSS stables + variables via resolveIntent().",
        en: "Intent-first custom select: combobox + listbox, stable CSS hooks + resolved vars via resolveIntent().",
    },
    since: "0.2.0",
    docs: { route: "/playground/components/intent-control-select" },
    anatomy: {
        root: "<div>",
        trigger: "<button role='combobox'>",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        leading: ".intent-control-select-leading (standalone only)",
        trailing: ".intent-control-select-trailing (standalone only)",
        value: ".intent-control-value",
        chevron: ".intent-control-chevron",
        popover: ".intent-control-popover",
        listbox: "<ul role='listbox'>",
        option: "<li role='option'>",
    },
    classHooks: [
        "intent-control",
        "intent-control-select",
        "intent-control-select-standalone",
        "intent-control-select-naked",
        "intent-control-select-trigger",
        "intent-control-select-leading",
        "intent-control-select-trailing",
        "intent-bg",
        "intent-ink",
        "intent-border",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
        "is-open",
        "is-disabled",
        "is-readonly",
        "is-empty",
        "is-invalid",
        "ids-select-xs",
        "ids-select-sm",
        "ids-select-md",
        "ids-select-lg",
        "ids-select-xl",
        "intent-control-popover",
        "intent-control-option",
        "is-selected",
        "is-highlighted",
        "is-option-disabled",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentControlSelect(props: IntentControlSelectProps) {
    const {
        className,
        options,
        value: valueProp,
        defaultValue = null,
        onValueChange,

        placeholder = "Select…",
        size = "md",
        fullWidth = false,

        leading,
        trailing,
        insideField = false,
        invalid = false,
        readOnly = false,

        clearable = false,
        closeOnSelect = true,
        align = "start",

        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: disabledProp,

        ...triggerProps
    } = props;

    const isControlled = valueProp !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = React.useState<string | null>(defaultValue);
    const value = (isControlled ? valueProp : uncontrolledValue) ?? null;

    const [open, setOpen] = React.useState(false);
    const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);

    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const listRef = React.useRef<HTMLUListElement | null>(null);

    const listboxId = React.useId();
    const disabled = Boolean(disabledProp);

    // ✅ if readOnly flips true while open, close it
    React.useEffect(() => {
        if (readOnly && open) setOpen(false);
    }, [readOnly, open]);

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

    // Vars cascade to popover -> apply vars on ROOT
    // Standalone: trigger/popover get visual variant classes (controlProps)
    // InsideField: field provides visuals; we keep hooks + vars only
    const layoutProps = getIntentLayoutProps(resolved);
    const controlProps = getIntentControlProps(resolved);

    const selectedOption = React.useMemo(
        () => options.find((o) => o.value === value) ?? undefined,
        [options, value]
    );

    const isEmpty = !selectedOption;

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

    // ✅ size hook ON ROOT (matches CSS selectors)
    const rootCls = cn(
        "intent-control intent-control-select",
        sizeClass(size),
        fullWidth && "w-full",
        open && "is-open",
        disabled && "is-disabled",
        readOnly && "is-readonly",
        isEmpty && "is-empty",
        invalid && "is-invalid",
        insideField ? "intent-control-select-naked" : "intent-control-select-standalone",
        align === "end" ? "ids-popover-align-end" : "ids-popover-align-start",
        "relative inline-flex"
    );

    const triggerCls = cn(
        "intent-control-select-trigger",
        "relative inline-flex items-center justify-between",
        "select-none",
        "rounded-ids-2xl",
        "transition",
        "min-w-0",
        fullWidth && "w-full"
    );

    /* ---------------------------
       Outside click + open focus
    --------------------------- */

    React.useEffect(() => {
        if (!open) return;

        function onDocDown(e: MouseEvent | TouchEvent) {
            const t = e.target as Node | null;
            if (!t) return;
            if (rootRef.current?.contains(t)) return;
            setOpen(false);
        }

        document.addEventListener("mousedown", onDocDown);
        document.addEventListener("touchstart", onDocDown, { passive: true });

        return () => {
            document.removeEventListener("mousedown", onDocDown);
            document.removeEventListener("touchstart", onDocDown);
        };
    }, [open]);

    React.useEffect(() => {
        if (!open) return;
        const idx = value ? options.findIndex((o) => o.value === value) : -1;
        setHighlightedIndex(idx);
        window.setTimeout(() => listRef.current?.focus(), 0);
    }, [open, options, value]);

    function commitValue(next: string | null) {
        if (disabled || readOnly) return;

        if (!isControlled) setUncontrolledValue(next);
        const opt = next ? options.find((o) => o.value === next) : undefined;
        onValueChange?.(next, opt);

        if (closeOnSelect) {
            setOpen(false);
            window.setTimeout(() => triggerRef.current?.focus(), 0);
        }
    }

    /* ============================================================================
       ⌨️ Keyboard
    ============================================================================ */

    function moveHighlight(nextIndex: number) {
        const clamped = Math.max(-1, Math.min(nextIndex, options.length - 1));
        setHighlightedIndex(clamped);

        const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${clamped}"]`);
        el?.scrollIntoView({ block: "nearest" });
    }

    function nextEnabledIndex(from: number, dir: 1 | -1) {
        const len = options.length;
        if (len === 0) return -1;

        let i = from;

        for (let step = 0; step < len; step++) {
            i += dir;

            if (i < 0) i = len - 1;
            if (i >= len) i = 0;

            const opt = options[i];
            if (opt && !opt.disabled) return i;
        }

        return -1;
    }

    const typeaheadRef = React.useRef<{ buf: string; t: number }>({ buf: "", t: 0 });

    function handleListKeyDown(e: React.KeyboardEvent) {
        if (readOnly || disabled) {
            if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
                window.setTimeout(() => triggerRef.current?.focus(), 0);
            }
            return;
        }

        if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            window.setTimeout(() => triggerRef.current?.focus(), 0);
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            const start = highlightedIndex >= 0 ? highlightedIndex : -1;
            const idx = nextEnabledIndex(start, 1);
            moveHighlight(idx);
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            const start = highlightedIndex >= 0 ? highlightedIndex : 0;
            const idx = nextEnabledIndex(start, -1);
            moveHighlight(idx);
            return;
        }

        if (e.key === "Home") {
            e.preventDefault();
            const idx = nextEnabledIndex(-1, 1);
            moveHighlight(idx);
            return;
        }

        if (e.key === "End") {
            e.preventDefault();
            const idx = nextEnabledIndex(0, -1);
            moveHighlight(idx);
            return;
        }

        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const opt = options[highlightedIndex];
            if (opt && !opt.disabled) commitValue(opt.value);
            return;
        }

        // typeahead
        if (isPrintableChar(e)) {
            const now = Date.now();
            const ref = typeaheadRef.current;
            ref.buf = now - ref.t > 650 ? e.key : ref.buf + e.key;
            ref.t = now;

            const q = ref.buf.toLowerCase();
            const start = highlightedIndex >= 0 ? highlightedIndex : -1;

            const optionText = (opt: IntentControlSelectOption) => {
                if (opt.searchText) return opt.searchText;
                if (typeof opt.label === "string") return opt.label;
                return opt.value;
            };

            for (let step = 0; step < options.length; step++) {
                const idx = (start + 1 + step) % options.length;
                const opt = options[idx];
                if (!opt || opt.disabled) continue;

                const text = optionText(opt).toLowerCase();
                if (text.startsWith(q)) {
                    moveHighlight(idx);
                    break;
                }
            }
        }
    }

    function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
        triggerProps.onKeyDown?.(e);
        if (e.defaultPrevented) return;

        if (disabled || readOnly) return;

        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
        }
    }

    const rootClassName = cn(layoutProps.className, rootCls);

    const triggerClassName = cn(
        insideField ? "" : controlProps.className, // ✅ only standalone gets visuals
        triggerCls,
        className // ✅ user className on trigger (as documented)
    );

    return (
        <div
            ref={rootRef}
            {...layoutProps}
            className={rootClassName}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            {leading && !insideField ? (
                <span className="intent-control-select-leading" aria-hidden>
                    {leading}
                </span>
            ) : null}

            <button
                {...triggerProps}
                ref={triggerRef}
                type={triggerProps.type ?? "button"}
                className={triggerClassName}
                disabled={disabled}
                role="combobox"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-haspopup="listbox"
                aria-disabled={disabled || undefined}
                aria-invalid={invalid || undefined}
                aria-readonly={readOnly || undefined}
                onClick={(e) => {
                    triggerProps.onClick?.(e);
                    if (e.defaultPrevented) return;
                    if (disabled || readOnly) return;
                    setOpen((v2) => !v2);
                }}
                onKeyDown={handleTriggerKeyDown}
            >
                {/* Glow layers (under content) - standalone only */}
                {!insideField && glowAllowed ? (
                    <>
                        {allowFillGlow ? (
                            <span
                                aria-hidden
                                className="intent-glow-layer intent-glow-fill"
                                style={{ opacity: readOpacity("--intent-glow-fill-opacity") }}
                            />
                        ) : null}

                        {allowBorderGlow ? (
                            <span
                                aria-hidden
                                className="intent-glow-layer intent-glow-border"
                                style={{
                                    opacity: readOpacity("--intent-glow-border-opacity"),
                                    borderRadius: "inherit",
                                }}
                            />
                        ) : null}
                    </>
                ) : null}

                <span className="relative z-10 min-w-0 flex-1 flex items-center gap-2">
                    <span className={cn("intent-control-value", "truncate")}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <span aria-hidden className={cn("intent-control-chevron", "shrink-0")}>
                        ▾
                    </span>
                </span>
            </button>

            {trailing && !insideField ? (
                <span className="intent-control-select-trailing" aria-hidden>
                    {trailing}
                </span>
            ) : null}

            {open ? (
                <div
                    className={cn(
                        "intent-control-popover",
                        insideField ? "" : controlProps.className // ✅ visuals only standalone
                    )}
                >
                    {/* Glow layers (under content) - standalone only */}
                    {!insideField && glowAllowed ? (
                        <>
                            {allowFillGlow ? (
                                <span
                                    aria-hidden
                                    className="intent-glow-layer intent-glow-fill"
                                    style={{ opacity: readOpacity("--intent-glow-fill-opacity") }}
                                />
                            ) : null}

                            {allowBorderGlow ? (
                                <span
                                    aria-hidden
                                    className="intent-glow-layer intent-glow-border"
                                    style={{
                                        opacity: readOpacity("--intent-glow-border-opacity"),
                                        borderRadius: "inherit",
                                    }}
                                />
                            ) : null}
                        </>
                    ) : null}

                    <ul
                        id={listboxId}
                        ref={listRef}
                        tabIndex={0}
                        role="listbox"
                        aria-label="Select options"
                        className="intent-control-listbox"
                        onKeyDown={handleListKeyDown}
                    >
                        {clearable ? (
                            <li
                                role="option"
                                aria-selected={value === null}
                                className={cn(
                                    "intent-control-option",
                                    value === null && "is-selected"
                                )}
                                onMouseEnter={() => setHighlightedIndex(-1)}
                                onClick={() => commitValue(null)}
                            >
                                <span className="intent-control-option-label">Clear</span>
                            </li>
                        ) : null}

                        {options.map((opt, idx) => {
                            const selected = value === opt.value;
                            const highlighted = idx === highlightedIndex;

                            return (
                                <li
                                    key={opt.value}
                                    data-idx={idx}
                                    role="option"
                                    aria-selected={selected}
                                    aria-disabled={opt.disabled || undefined}
                                    className={cn(
                                        "intent-control-option",
                                        selected && "is-selected",
                                        highlighted && "is-highlighted",
                                        opt.disabled && "is-option-disabled"
                                    )}
                                    onMouseEnter={() => setHighlightedIndex(idx)}
                                    onClick={() => {
                                        if (opt.disabled) return;
                                        commitValue(opt.value);
                                    }}
                                >
                                    <span className="intent-control-option-label">{opt.label}</span>
                                    {opt.description ? (
                                        <span className="intent-control-option-description">
                                            {opt.description}
                                        </span>
                                    ) : null}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
