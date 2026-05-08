"use client";

// src/components/intent/IntentControlSelect.tsx
// IntentControlSelect
// - Intent-first Select (custom, not native <select>)
// - Trigger is a button with role="combobox"
// - Dropdown uses IntentSurface for visual styling
// - Supports optional portal rendering
// - Supports single + multiple selection
// - Supports search input, grouped options, custom option rendering
// - Uses resolveIntent() to compute stable class hooks + CSS vars
// - No dynamic Tailwind classes: only stable hooks

import * as React from "react";
import { createPortal } from "react-dom";

import { resolveIntent, getIntentControlProps, getIntentLayoutProps } from "CORE";
import { IntentSurface } from "./IntentSurface";
import {
    SYSTEM_PROPS_TABLE,
    type IntentInput,
    type DocsPropRow,
    type ComponentIdentity,
    type Variant,
} from "SYSTEM";

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

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function safeString(v: unknown): string {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    return "";
}

function optionSearchText(opt: IntentControlSelectOption): string {
    if (opt.searchText) return opt.searchText;
    if (typeof opt.label === "string") return opt.label;
    return String(opt.value);
}

function useComposedRef<T>(...refs: Array<React.Ref<T> | undefined>) {
    return React.useCallback(
        (node: T) => {
            refs.forEach((ref) => {
                if (!ref) return;
                if (typeof ref === "function") ref(node);
                else {
                    try {
                        (ref as React.MutableRefObject<T>).current = node;
                    } catch {
                        // noop
                    }
                }
            });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        refs
    );
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

export type IntentControlSelectOptionValue = string | number;

export type IntentControlSelectOption = {
    value: IntentControlSelectOptionValue;
    label: React.ReactNode;
    searchText?: string;
    description?: string;
    emoji?: string;
    tone?: string;
    disabled?: boolean;
    group?: string | null;
};

export type IntentControlSelectRenderState = {
    selected: boolean;
    highlighted: boolean;
    disabled: boolean;
    multiple: boolean;
};

export type IntentControlSelectGroup = {
    key: string;
    label: string | null;
    options: IntentControlSelectOption[];
};

export type IntentControlSelectValue = any | any[] | null;

export type IntentControlSelectProps = IntentInput &
    Omit<
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        "className" | "children" | "value" | "defaultValue" | "onChange"
    > & {
        className?: string;
        options: IntentControlSelectOption[];
        value?: IntentControlSelectValue;
        defaultValue?: IntentControlSelectValue;
        onValueChange?: (
            value: IntentControlSelectValue,
            option?: IntentControlSelectOption
        ) => void;

        placeholder?: string;
        size?: SelectSize;
        fullWidth?: boolean;

        leading?: React.ReactNode;
        trailing?: React.ReactNode;

        insideField?: boolean;

        invalid?: boolean;
        readOnly?: boolean;

        clearable?: boolean;
        closeOnSelect?: boolean;
        align?: "start" | "end";
        forceOpen?: boolean;

        portal?: boolean;
        portalAllowContentWidth?: boolean;

        multiple?: boolean;

        searchable?: boolean;
        searchPlaceholder?: string;

        groupBy?: (option: IntentControlSelectOption) => string | null | undefined;

        renderOption?: (
            option: IntentControlSelectOption,
            state: IntentControlSelectRenderState
        ) => React.ReactNode;

        /** Optional override for the dropdown menu variant */
        menuVariant?: Variant;
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
            fr: "Liste des options.",
            en: "Options list.",
        },
        type: "IntentControlSelectOption[]",
        required: true,
        fromSystem: false,
    },
    {
        name: "value",
        description: {
            fr: "Valeur contrôlée (string | string[] | null).",
            en: "Controlled value (string | string[] | null).",
        },
        type: "string | string[] | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultValue",
        description: {
            fr: "Valeur initiale non contrôlée.",
            en: "Initial uncontrolled value.",
        },
        type: "string | string[] | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "onValueChange",
        description: {
            fr: "Callback quand la sélection change.",
            en: "Callback when selection changes.",
        },
        type: "(value, option?) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "multiple",
        description: {
            fr: "Active le mode multi-sélection.",
            en: "Enables multi-select mode.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "portal",
        description: {
            fr: "Rend le menu dans un portal pour éviter les soucis de z-index / overflow.",
            en: "Renders the menu in a portal to avoid z-index / overflow issues.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "portalAllowContentWidth",
        description: {
            fr: "En mode portal, permet au menu de dépasser la largeur du trigger.",
            en: "In portal mode, allows the menu to grow wider than the trigger.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "forceOpen",
        description: {
            fr: "Force l’ouverture du popover quelle que soit la logique interne.",
            en: "Forces the popover to stay open regardless of internal logic.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "menuVariant",
        description: {
            fr: "Override optionnel du variant du menu popover.",
            en: "Optional override for the popover menu variant.",
        },
        type: `"flat" | "outlined" | "elevated" | "ghost"`,
        required: false,
        fromSystem: false,
    },
    {
        name: "searchable",
        description: {
            fr: "Ajoute un input de recherche en haut du menu.",
            en: "Adds a search input at the top of the menu.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "groupBy",
        description: {
            fr: "Fonction optionnelle pour grouper les options.",
            en: "Optional function used to group options.",
        },
        type: "(option) => string | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "renderOption",
        description: {
            fr: "Rendu personnalisé d’une option.",
            en: "Custom option rendering.",
        },
        type: "(option, state) => React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "clearable",
        description: {
            fr: "Affiche une croix de clear dans le trigger.",
            en: "Shows a clear button inside the trigger.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "insideField",
        description: {
            fr: "Mode naked pour wrapper dans IntentControlField.",
            en: "Naked mode for IntentControlField wrapper.",
        },
        type: "boolean",
        required: false,
        default: "false",
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
        fr: "Select intent-first avec recherche, multi-sélection, groupes, rendu custom et menu stylisé par IntentSurface.",
        en: "Intent-first select with search, multi-select, grouping, custom rendering, and an IntentSurface menu.",
    },
    since: "0.2.12",
    docs: { route: "/playground/components/intent-control-select" },
    anatomy: {
        root: "<div>",
        trigger: "<button role='combobox'>",
        leading: ".intent-control-select-leading",
        trailing: ".intent-control-select-trailing",
        clear: ".intent-control-select-clear",
        value: ".intent-control-value",
        chevron: ".intent-control-chevron",
        popover: ".intent-control-popover",
        panel: ".intent-control-select-panel",
        search: ".intent-control-select-search",
        listbox: "<ul role='listbox'>",
        groupLabel: ".intent-control-select-group-label",
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
        "intent-control-select-clear",
        "intent-control-select-valueWrap",
        "intent-control-select-tags",
        "intent-control-select-tag",
        "intent-control-popover",
        "intent-control-select-panel",
        "intent-control-select-search",
        "intent-control-select-group-label",
        "intent-control-option",
        "intent-control-option-main",
        "intent-control-option-meta",
        "intent-control-option-check",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
        "is-open",
        "is-disabled",
        "is-readonly",
        "is-empty",
        "is-invalid",
        "is-multiple",
        "is-searchable",
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
        forceOpen = false,

        portal = false,
        portalAllowContentWidth = false,
        multiple = false,
        searchable = false,
        searchPlaceholder = "Search…",
        groupBy,
        renderOption,
        menuVariant,

        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        toneStep,
        disabled: disabledProp,

        ...triggerProps
    } = props;

    const disabled = Boolean(disabledProp);
    const isControlled = valueProp !== undefined;

    const normalizedDefaultValue = React.useMemo<IntentControlSelectValue>(() => {
        if (multiple) return Array.isArray(defaultValue) ? defaultValue : [];
        return Array.isArray(defaultValue) ? (defaultValue[0] ?? null) : defaultValue;
    }, [defaultValue, multiple]);

    const [uncontrolledValue, setUncontrolledValue] =
        React.useState<IntentControlSelectValue>(normalizedDefaultValue);

    const rawValue = isControlled ? valueProp : uncontrolledValue;

    const valueArray = React.useMemo<Array<string | number>>(() => {
        if (!multiple) return [];
        return Array.isArray(rawValue) ? rawValue.filter(Boolean) : [];
    }, [rawValue, multiple]);

    const singleValue = React.useMemo<string | number | null>(() => {
        if (multiple) return null;
        if (Array.isArray(rawValue)) return rawValue[0] ?? null;
        return rawValue ?? null;
    }, [rawValue, multiple]);

    const [open, setOpen] = React.useState(false);
    const isOpen = forceOpen || open;

    const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);
    const [query, setQuery] = React.useState("");

    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const popoverRef = React.useRef<HTMLDivElement | null>(null);
    const listRef = React.useRef<HTMLUListElement | null>(null);
    const searchInputRef = React.useRef<HTMLInputElement | null>(null);

    const listboxId = React.useId();

    React.useEffect(() => {
        if (forceOpen) return;
        if (readOnly && open) setOpen(false);
    }, [readOnly, open, forceOpen]);

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
    const resolvedVariant = resolved.variant;
    const isGlowed = resolved.intent === "glowed";
    const glowAllowed = !insideField && hasGlow && resolvedVariant !== "ghost";
    const allowFillGlow =
        glowAllowed && (isGlowed || resolvedVariant === "flat" || resolvedVariant === "elevated");
    const allowBorderGlow =
        glowAllowed && (resolvedVariant === "outlined" || resolvedVariant === "elevated");

    const glowFillOpacity = readOpacity(resolvedStyle, "--intent-glow-fill-opacity");
    const glowBorderOpacity = readOpacity(resolvedStyle, "--intent-glow-border-opacity");

    const selectedOptions = React.useMemo(() => {
        if (multiple) {
            const set = new Set(valueArray);
            return options.filter((o) => set.has(o.value));
        }
        return singleValue !== null ? options.filter((o) => o.value === singleValue) : [];
    }, [multiple, valueArray, singleValue, options]);

    const selectedOption = multiple ? undefined : selectedOptions[0];
    const isEmpty = multiple ? selectedOptions.length === 0 : !selectedOption;

    const filteredOptions = React.useMemo(() => {
        if (!searchable || !query.trim()) return options;
        const q = query.trim().toLowerCase();

        return options.filter((opt) => {
            const text = optionSearchText(opt).toLowerCase();
            const description = safeString(opt.description).toLowerCase();
            const group = safeString(groupBy?.(opt) ?? opt.group).toLowerCase();
            return text.includes(q) || description.includes(q) || group.includes(q);
        });
    }, [options, searchable, query, groupBy]);

    const optionRecords = React.useMemo(() => {
        return filteredOptions.map((opt) => ({
            option: opt,
            group: groupBy?.(opt) ?? opt.group ?? null,
        }));
    }, [filteredOptions, groupBy]);

    const groups = React.useMemo<IntentControlSelectGroup[]>(() => {
        const map = new Map<string, IntentControlSelectGroup>();

        for (const rec of optionRecords) {
            const key = rec.group ?? "";
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    label: rec.group ?? null,
                    options: [],
                });
            }
            map.get(key)!.options.push(rec.option);
        }

        return Array.from(map.values());
    }, [optionRecords]);

    const flatVisibleOptions = React.useMemo(() => {
        return groups.flatMap((g) => g.options);
    }, [groups]);

    const optionIndexByValue = React.useMemo(() => {
        const map = new Map<string | number, number>();
        flatVisibleOptions.forEach((opt, idx) => {
            map.set(opt.value, idx);
        });
        return map;
    }, [flatVisibleOptions]);

    const selectedSet = React.useMemo(() => new Set(valueArray), [valueArray]);

    const rootCls = cn(
        "intent-control intent-control-select",
        sizeClass(size),
        fullWidth && "w-full",
        isOpen && "is-open",
        disabled && "is-disabled",
        readOnly && "is-readonly",
        isEmpty && "is-empty",
        invalid && "is-invalid",
        multiple && "is-multiple",
        searchable && "is-searchable",
        insideField ? "intent-control-select-naked" : "intent-control-select-standalone",
        align === "end" ? "ids-popover-align-end" : "ids-popover-align-start",
        "relative inline-flex"
    );

    const triggerCls = cn(
        "intent-control-select-trigger",
        "relative inline-flex items-center justify-between",
        "select-none rounded-ids-2xl transition min-w-0",
        fullWidth && "w-full"
    );

    const rootClassName = cn(layoutProps.className, rootCls);
    const triggerClassName = cn(insideField ? "" : controlProps.className, triggerCls, className);

    const syncUncontrolledValue = React.useCallback(
        (next: IntentControlSelectValue) => {
            if (!isControlled) setUncontrolledValue(next);
        },
        [isControlled]
    );

    const closeAndRestoreFocus = React.useCallback(() => {
        if (forceOpen) return;
        setOpen(false);
        window.setTimeout(() => triggerRef.current?.focus(), 0);
    }, [forceOpen]);

    const commitSingleValue = React.useCallback(
        (next: string | number | null) => {
            if (disabled || readOnly) return;

            syncUncontrolledValue(next);
            const opt = next !== null ? options.find((o) => o.value === next) : undefined;
            onValueChange?.(next, opt);

            if (closeOnSelect) closeAndRestoreFocus();
        },
        [
            disabled,
            readOnly,
            syncUncontrolledValue,
            options,
            onValueChange,
            closeOnSelect,
            closeAndRestoreFocus,
        ]
    );

    const commitMultiValue = React.useCallback(
        (next: string | number) => {
            if (disabled || readOnly) return;

            const current = Array.isArray(rawValue)
                ? rawValue.filter(Boolean)
                : Array.isArray(uncontrolledValue)
                  ? uncontrolledValue.filter(Boolean)
                  : valueArray;

            const set = new Set(current);

            if (set.has(next)) set.delete(next);
            else set.add(next);

            const result = Array.from(set);

            syncUncontrolledValue(result);
            const opt = options.find((o) => o.value === next);
            onValueChange?.(result, opt);

            if (closeOnSelect) closeAndRestoreFocus();
        },
        [
            disabled,
            readOnly,
            rawValue,
            uncontrolledValue,
            valueArray,
            syncUncontrolledValue,
            options,
            onValueChange,
            closeOnSelect,
            closeAndRestoreFocus,
        ]
    );

    const clearValue = React.useCallback(() => {
        if (disabled || readOnly || !clearable) return;

        if (multiple) {
            syncUncontrolledValue([]);
            onValueChange?.([], undefined);
            return;
        }

        commitSingleValue(null);
    }, [
        disabled,
        readOnly,
        clearable,
        multiple,
        syncUncontrolledValue,
        onValueChange,
        commitSingleValue,
    ]);

    const hasClearValue = multiple ? valueArray.length > 0 : singleValue !== null;

    const [portalStyle, setPortalStyle] = React.useState<React.CSSProperties | undefined>(
        undefined
    );

    const updatePortalPosition = React.useCallback(() => {
        if (!portal) return;

        const triggerEl = triggerRef.current;
        const popoverEl = popoverRef.current;
        if (!triggerEl) return;

        const rect = triggerEl.getBoundingClientRect();
        const triggerWidth = !insideField
            ? Math.max(140, Math.round(rect.width))
            : Math.max(140, Math.round(rect.width) + 27);

        const viewportWidth = window.innerWidth;
        const viewportPadding = 12;

        let computedWidth = triggerWidth;
        let computedMinWidth = triggerWidth;

        if (portalAllowContentWidth && popoverEl) {
            const previousWidth = popoverEl.style.width;
            const previousMinWidth = popoverEl.style.minWidth;
            const previousMaxWidth = popoverEl.style.maxWidth;

            popoverEl.style.width = "max-content";
            popoverEl.style.minWidth = `${triggerWidth}px`;
            popoverEl.style.maxWidth = `${Math.max(160, viewportWidth - viewportPadding * 2)}px`;

            const measuredWidth = Math.ceil(popoverEl.scrollWidth);

            popoverEl.style.width = previousWidth;
            popoverEl.style.minWidth = previousMinWidth;
            popoverEl.style.maxWidth = previousMaxWidth;

            computedWidth = Math.max(triggerWidth, measuredWidth);
        }

        const finalWidth = Math.min(
            computedWidth,
            Math.max(160, viewportWidth - viewportPadding * 2)
        );

        let left = align === "end" ? Math.round(rect.right - finalWidth) : Math.round(rect.left);
        left = clamp(left, viewportPadding, viewportWidth - finalWidth - viewportPadding);

        setPortalStyle({
            position: "fixed",
            left: `${!insideField ? left : left - 14}px`,
            top: `${Math.round(rect.bottom + (!insideField ? 8 : 12))}px`,
            minWidth: `${computedMinWidth}px`,
            width: `${finalWidth}px`,
            maxWidth: `${Math.max(160, viewportWidth - viewportPadding * 2)}px`,
            zIndex: 120,
        });
    }, [portal, align, portalAllowContentWidth]);

    React.useLayoutEffect(() => {
        if (!isOpen || !portal) return;
        updatePortalPosition();
    }, [
        isOpen,
        portal,
        updatePortalPosition,
        size,
        multiple,
        searchable,
        query,
        portalAllowContentWidth,
    ]);

    React.useEffect(() => {
        if (!isOpen || !portal) return;

        const onWin = () => updatePortalPosition();
        window.addEventListener("resize", onWin);
        window.addEventListener("scroll", onWin, true);

        return () => {
            window.removeEventListener("resize", onWin);
            window.removeEventListener("scroll", onWin, true);
        };
    }, [isOpen, portal, updatePortalPosition]);

    React.useEffect(() => {
        if (!isOpen || forceOpen) return;

        function onDocDown(e: MouseEvent | TouchEvent) {
            const target = e.target as Node | null;
            if (!target) return;

            if (rootRef.current?.contains(target)) return;
            if (popoverRef.current?.contains(target)) return;

            setOpen(false);
        }

        document.addEventListener("mousedown", onDocDown);
        document.addEventListener("touchstart", onDocDown, { passive: true });

        return () => {
            document.removeEventListener("mousedown", onDocDown);
            document.removeEventListener("touchstart", onDocDown);
        };
    }, [isOpen, forceOpen]);

    React.useEffect(() => {
        if (!isOpen) return;

        const nextIndex = multiple
            ? flatVisibleOptions.findIndex((o) => selectedSet.has(o.value))
            : singleValue !== null
              ? flatVisibleOptions.findIndex((o) => o.value === singleValue)
              : -1;

        setHighlightedIndex(nextIndex);

        window.setTimeout(() => {
            if (searchable) searchInputRef.current?.focus();
            else listRef.current?.focus();
        }, 0);
    }, [isOpen, searchable, flatVisibleOptions, multiple, selectedSet, singleValue]);

    React.useEffect(() => {
        if (forceOpen) return;
        if (!open) setQuery("");
    }, [open, forceOpen]);

    function moveHighlight(nextIndex: number) {
        const clamped = Math.max(-1, Math.min(nextIndex, flatVisibleOptions.length - 1));
        setHighlightedIndex(clamped);

        const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${clamped}"]`);
        el?.scrollIntoView({ block: "nearest" });
    }

    function nextEnabledIndex(from: number, dir: 1 | -1) {
        const len = flatVisibleOptions.length;
        if (len === 0) return -1;

        let i = from;

        for (let step = 0; step < len; step++) {
            i += dir;
            if (i < 0) i = len - 1;
            if (i >= len) i = 0;

            const opt = flatVisibleOptions[i];
            if (opt && !opt.disabled) return i;
        }

        return -1;
    }

    const typeaheadRef = React.useRef<{ buf: string; t: number }>({ buf: "", t: 0 });

    function selectHighlighted() {
        const opt = flatVisibleOptions[highlightedIndex];
        if (!opt || opt.disabled) return;
        if (multiple) commitMultiValue(opt.value);
        else commitSingleValue(opt.value);
    }

    function handleListKeyDown(e: React.KeyboardEvent) {
        if (readOnly || disabled) {
            if (e.key === "Escape") {
                e.preventDefault();
                closeAndRestoreFocus();
            }
            return;
        }

        if (e.key === "Escape") {
            e.preventDefault();
            closeAndRestoreFocus();
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            const start = highlightedIndex >= 0 ? highlightedIndex : -1;
            moveHighlight(nextEnabledIndex(start, 1));
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            const start = highlightedIndex >= 0 ? highlightedIndex : 0;
            moveHighlight(nextEnabledIndex(start, -1));
            return;
        }

        if (e.key === "Home") {
            e.preventDefault();
            moveHighlight(nextEnabledIndex(-1, 1));
            return;
        }

        if (e.key === "End") {
            e.preventDefault();
            moveHighlight(nextEnabledIndex(0, -1));
            return;
        }

        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectHighlighted();
            return;
        }

        if (searchable && e.key === "/") {
            e.preventDefault();
            searchInputRef.current?.focus();
            return;
        }

        if (isPrintableChar(e)) {
            const now = Date.now();
            const ref = typeaheadRef.current;
            ref.buf = now - ref.t > 650 ? e.key : ref.buf + e.key;
            ref.t = now;

            const q = ref.buf.toLowerCase();
            const start = highlightedIndex >= 0 ? highlightedIndex : -1;

            for (let step = 0; step < flatVisibleOptions.length; step++) {
                const idx = (start + 1 + step) % flatVisibleOptions.length;
                const opt = flatVisibleOptions[idx];
                if (!opt || opt.disabled) continue;

                const text = optionSearchText(opt).toLowerCase();
                if (text.startsWith(q)) {
                    moveHighlight(idx);
                    break;
                }
            }
        }
    }

    function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            const start = highlightedIndex >= 0 ? highlightedIndex : -1;
            moveHighlight(nextEnabledIndex(start, 1));
            listRef.current?.focus();
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            const start = highlightedIndex >= 0 ? highlightedIndex : 0;
            moveHighlight(nextEnabledIndex(start, -1));
            listRef.current?.focus();
            return;
        }

        if (e.key === "Escape") {
            e.preventDefault();
            closeAndRestoreFocus();
        }
    }

    function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
        triggerProps.onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (disabled || readOnly) return;

        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!forceOpen) setOpen(true);
        }
    }

    function renderDefaultOption(
        opt: IntentControlSelectOption,
        state: IntentControlSelectRenderState
    ) {
        return (
            <>
                <span className="intent-control-option-main">
                    <span className="intent-control-option-label">
                        {opt.emoji ? (
                            <span className="intent-control-option-emoji">{opt.emoji}</span>
                        ) : null}
                        {opt.label}
                    </span>

                    {opt.description ? (
                        <span className="intent-control-option-description">{opt.description}</span>
                    ) : null}
                </span>

                <span className="intent-control-option-meta">
                    {state.selected ? (
                        <span className="intent-control-option-check" aria-hidden>
                            ✓
                        </span>
                    ) : null}
                </span>
            </>
        );
    }

    function renderValueContent() {
        if (multiple) {
            if (!selectedOptions.length) return placeholder;

            return (
                <span className="intent-control-select-tags">
                    {selectedOptions.map((opt) => (
                        <span key={opt.value} className="intent-control-select-tag">
                            {opt.emoji ? (
                                <span className="intent-control-option-emoji">{opt.emoji}</span>
                            ) : null}
                            {opt.label}
                        </span>
                    ))}
                </span>
            );
        }

        if (!selectedOption) return placeholder;

        return (
            <>
                {selectedOption.emoji ? (
                    <span className="intent-control-option-emoji">{selectedOption.emoji}</span>
                ) : null}
                {selectedOption.label}
            </>
        );
    }

    const triggerRefComposed = useComposedRef<HTMLButtonElement>(
        triggerRef,
        (triggerProps as { ref?: React.Ref<HTMLButtonElement> }).ref
    );

    const popoverHostStyle: React.CSSProperties = {
        ...(portal ? (portalStyle ?? {}) : {}),
    };

    const popoverHostClassName = cn(
        "intent-control-popover",
        "intent-control-select-popoverHost",
        sizeClass(size),
        portal && "is-portal",
        portal && portalAllowContentWidth && "is-portal-content-width"
    );

    const resolvedMenuVariant =
        menuVariant ?? (resolved.variant === "ghost" ? "elevated" : resolved.variant);

    const menuSurfaceProps: IntentInput = {
        intent: resolved.intent,
        variant: resolvedMenuVariant,
        intensity: resolved.intensity,
        mode: resolved.mode,
        ...(resolved.toneStep !== undefined ? { toneStep: resolved.toneStep } : {}),
        ...(tone !== undefined ? { tone } : {}),
        ...(glow !== undefined ? { glow } : {}),
        disabled,
    };

    const popoverNode = isOpen ? (
        <div
            ref={popoverRef}
            className={popoverHostClassName}
            style={popoverHostStyle}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            <IntentSurface
                {...menuSurfaceProps}
                className={cn(
                    "intent-control-select-panel w-full rounded-ids-2xl_popover",
                    sizeClass(size),
                    portal && portalAllowContentWidth && "is-portal-content-width"
                )}
            >
                {searchable ? (
                    <div className="intent-control-select-search">
                        <input
                            ref={searchInputRef}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setHighlightedIndex(-1);
                            }}
                            onKeyDown={handleSearchKeyDown}
                            placeholder={searchPlaceholder}
                            className="intent-control-select-searchInput"
                        />
                    </div>
                ) : null}

                <ul
                    id={listboxId}
                    ref={listRef}
                    tabIndex={0}
                    role="listbox"
                    aria-label="Select options"
                    aria-multiselectable={multiple || undefined}
                    className="intent-control-listbox"
                    onKeyDown={handleListKeyDown}
                >
                    {groups.length === 0 ? (
                        <li
                            className="intent-control-option is-option-disabled"
                            aria-disabled="true"
                        >
                            <span className="intent-control-option-label">No results</span>
                        </li>
                    ) : (
                        groups.map((group) => (
                            <React.Fragment key={group.key || "ungrouped"}>
                                {group.label ? (
                                    <li
                                        className="intent-control-select-group-label"
                                        aria-hidden="true"
                                    >
                                        {group.label}
                                    </li>
                                ) : null}

                                {group.options.map((opt) => {
                                    const idx = optionIndexByValue.get(opt.value) ?? -1;
                                    const selected = multiple
                                        ? selectedSet.has(opt.value)
                                        : singleValue === opt.value;
                                    const highlighted = idx === highlightedIndex;

                                    const state: IntentControlSelectRenderState = {
                                        selected,
                                        highlighted,
                                        disabled: Boolean(opt.disabled),
                                        multiple,
                                    };

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
                                                if (multiple) commitMultiValue(opt.value);
                                                else commitSingleValue(opt.value);
                                            }}
                                        >
                                            {renderOption
                                                ? renderOption(opt, state)
                                                : renderDefaultOption(opt, state)}
                                        </li>
                                    );
                                })}
                            </React.Fragment>
                        ))
                    )}
                </ul>
            </IntentSurface>
        </div>
    ) : null;

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
                ref={triggerRefComposed}
                type={triggerProps.type ?? "button"}
                className={triggerClassName}
                disabled={disabled}
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-haspopup="listbox"
                aria-disabled={disabled || undefined}
                aria-invalid={invalid || undefined}
                aria-readonly={readOnly || undefined}
                onClick={(e) => {
                    triggerProps.onClick?.(e);
                    if (e.defaultPrevented) return;
                    if (disabled || readOnly || forceOpen) return;
                    setOpen((prev) => !prev);
                }}
                onKeyDown={handleTriggerKeyDown}
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

                <span className="intent-control-select-valueWrap relative z-10 min-w-0 flex-1 flex items-center gap-2">
                    {clearable && hasClearValue && !readOnly && !disabled ? (
                        <span
                            className="intent-control-select-clear"
                            role="button"
                            tabIndex={-1}
                            aria-label="Clear selection"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                clearValue();
                            }}
                        >
                            ✕
                        </span>
                    ) : null}

                    <span className={cn("intent-control-value", multiple ? "" : "truncate")}>
                        {renderValueContent()}
                    </span>

                    {!readOnly ? (
                        <span aria-hidden className={cn("intent-control-chevron", "shrink-0")}>
                            ▾
                        </span>
                    ) : null}
                </span>
            </button>

            {trailing && !insideField ? (
                <span className="intent-control-select-trailing" aria-hidden>
                    {trailing}
                </span>
            ) : null}

            {isOpen
                ? portal && typeof document !== "undefined"
                    ? createPortal(popoverNode, document.body)
                    : popoverNode
                : null}
        </div>
    );
}
