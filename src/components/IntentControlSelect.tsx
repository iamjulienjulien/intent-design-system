"use client";

// src/components/intent/IntentControlSelect.tsx
// IntentControlSelect
// - Intent-first Select (custom, not native <select>)
// - Trigger is a button with role="combobox"
// - Popover contains a listbox (ul/li) with keyboard navigation
// - Uses resolveIntent() to compute stable class hooks + CSS vars
// - Supports glow layers like IntentSurface / IntentControlButton
// - No dynamic Tailwind classes: only stable hooks

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
    switch (size) {
        case "xs":
            return "ids-select-xs";
        case "sm":
            return "ids-select-sm";
        case "lg":
            return "ids-select-lg";
        case "xl":
            return "ids-select-xl";
        default:
            return "ids-select-md";
    }
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
            fr: "Classes CSS additionnelles appliquées au trigger.",
            en: "Additional CSS classes applied to the trigger.",
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
    docs: { route: "/playground/components/IntentControlSelect" },
    anatomy: {
        root: "<div>",
        trigger: "<button role='combobox'>",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        value: ".intent-control-value",
        chevron: ".intent-control-chevron",
        popover: ".intent-control-popover",
        listbox: "<ul role='listbox'>",
        option: "<li role='option'>",
    },
    classHooks: [
        "intent-control",
        "intent-control-select",
        "intent-bg",
        "intent-ink",
        "intent-border",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
        "is-open",
        "is-disabled",
        "is-empty",
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

    // ✅ IMPORTANT: we want vars to cascade to popover -> apply style on ROOT
    // ✅ ROOT: vars only (popover inherits)
    // ✅ TRIGGER: visual classes (variant)
    const layoutProps = getIntentLayoutProps(resolved, className);
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

    // ✅ Put size hook ON ROOT (matches CSS selectors)
    const rootCls = cn(
        "intent-control intent-control-select",
        sizeClass(size),
        "relative inline-flex",
        fullWidth && "w-full",
        open && "is-open",
        disabled && "is-disabled",
        isEmpty && "is-empty",
        align === "end" ? "ids-popover-align-end" : "ids-popover-align-start"
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

        // best-effort scroll into view
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
                return opt.value; // safe fallback
            };

            // search forward (wrap)
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

        if (disabled) return;

        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
        }
    }

    return (
        <div
            ref={rootRef}
            // ✅ vars only
            {...layoutProps}
            className={cn(layoutProps.className, rootCls)}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            <button
                {...triggerProps}
                ref={triggerRef}
                type={triggerProps.type ?? "button"}
                className={cn(
                    controlProps.className, // ✅ variant-driven visuals here
                    triggerCls,
                    className // ✅ user className applied to trigger (as documented)
                )}
                disabled={disabled}
                role="combobox"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-haspopup="listbox"
                aria-disabled={disabled || undefined}
                onClick={(e) => {
                    triggerProps.onClick?.(e);
                    if (e.defaultPrevented) return;
                    if (disabled) return;
                    setOpen((v) => !v);
                }}
                onKeyDown={handleTriggerKeyDown}
            >
                {/* Glow layers (under content) */}
                {glowAllowed ? (
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

            {open ? (
                <div className={cn("intent-control-popover", controlProps.className)}>
                    {/* Glow layers (under content) */}
                    {glowAllowed ? (
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
