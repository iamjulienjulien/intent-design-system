"use client";

// src/components/intent/IntentControlCombobox.tsx
// IntentControlCombobox
// - Intent-first combobox (input + dropdown listbox)
// - Typeahead filtering (default) + customizable filter
// - Keyboard nav (↑/↓/Home/End/Enter/Escape), mouse/touch selection
// - Accessible ARIA combobox/listbox/option with active-descendant
// - Standalone mode: renders control frame (like IntentControlInput)
// - InsideField mode: "naked" input (field owns the frame), dropdown still works
// - Controlled or uncontrolled:
//   - inputValue (text) + onInputValueChange
//   - open + onOpenChange
//   - selectedId + onSelectionChange
// - Supports:
//   - loading state + empty state
//   - minChars, maxResults
//   - allowCustomValue (freeSolo)
//   - closeOnSelect, openOnFocus
//   - clearable (optional button via trailing slot if desired)
// - No dynamic Tailwind classes: stable hooks only

import * as React from "react";
import { createPortal } from "react-dom";

import {
    resolveIntent,
    getIntentLayoutProps,
    getIntentControlProps,
    composeIntentClassName,
} from "CORE";
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

type ControlSize = "xs" | "sm" | "md" | "lg" | "xl";
function sizeClass(size: ControlSize) {
    return `ids-control-${size}`;
}

function toKey(v: unknown): string {
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (typeof v === "bigint") return String(v);
    return String(v ?? "");
}

function safeString(v: unknown): string {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (typeof v === "boolean") return String(v);
    try {
        return String(v);
    } catch {
        return "";
    }
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
    if (!ref) return;
    if (typeof ref === "function") ref(value);
    else (ref as any).current = value;
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function rafThrottle<T extends (...args: any[]) => void>(fn: T) {
    let raf = 0;
    let lastArgs: any[] | null = null;

    return (...args: any[]) => {
        lastArgs = args;
        if (raf) return;

        raf = window.requestAnimationFrame(() => {
            raf = 0;
            if (!lastArgs) return;
            fn(...lastArgs);
            lastArgs = null;
        });
    };
}

function scrollItemIntoView(container: HTMLElement, item: HTMLElement) {
    const cTop = container.scrollTop;
    const cBottom = cTop + container.clientHeight;

    const iTop = item.offsetTop;
    const iBottom = iTop + item.offsetHeight;

    if (iTop < cTop) container.scrollTop = iTop;
    else if (iBottom > cBottom) container.scrollTop = iBottom - container.clientHeight;
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentComboboxFilterFn<T> = (args: {
    query: string;
    items: T[];
    getText: (item: T) => string;
    getKeywords?: (item: T) => string[] | null | undefined;
}) => T[];

export type IntentComboboxCreateOption =
    | { kind: "none" }
    | { kind: "custom"; label: string; value: string };

type BaseProps<T> = IntentInput & {
    className?: string;

    /** Visual / layout */
    size?: ControlSize; // default "md"
    fullWidth?: boolean; // default false

    /** Slots (standalone only, insideField prefer Field slots) */
    leading?: React.ReactNode;
    trailing?: React.ReactNode;

    /** State */
    invalid?: boolean; // default false
    readOnly?: boolean; // default false
    insideField?: boolean; // default false

    /** Data */
    items: T[];
    getId: (item: T) => string | number;
    getText: (item: T) => string; // what appears in input / is used for filtering
    getSubtitle?: (item: T) => React.ReactNode; // optional right-side info
    getKeywords?: (item: T) => string[] | null | undefined; // optional search synonyms

    /** Optional custom renderer */
    renderItem?: (args: {
        item: T;
        isActive: boolean;
        isSelected: boolean;
        query: string;
    }) => React.ReactNode;

    /** Filtering */
    filterFn?: IntentComboboxFilterFn<T>;
    minChars?: number; // default 0
    maxResults?: number; // default 12

    /** UX */
    openOnFocus?: boolean; // default true
    closeOnSelect?: boolean; // default true
    clearOnSelect?: boolean; // default false (useful for "add tag" patterns)
    selectOnBlur?: boolean; // default false (commit active option on blur)
    loading?: boolean; // default false
    loadingLabel?: React.ReactNode; // default "Loading…"
    emptyLabel?: React.ReactNode; // default "No results"
    createOptionLabel?: (value: string) => string; // label for "create <value>"
    allowCustomValue?: boolean; // default false (freeSolo)

    /** Controlled / uncontrolled: open */
    open?: boolean;
    defaultOpen?: boolean; // default false
    onOpenChange?: (open: boolean) => void;

    /** Controlled / uncontrolled: input value (text) */
    inputValue?: string;
    defaultInputValue?: string; // default ""
    onInputValueChange?: (value: string) => void;

    /** Controlled / uncontrolled: selection */
    selectedId?: string | null;
    defaultSelectedId?: string | null;
    onSelectionChange?: (id: string | null, item?: T) => void;

    /** Called when user selects a custom (freeSolo) value */
    onCustomValue?: (value: string) => void;

    /** Native input props passthrough */
    name?: string;
    placeholder?: string;
    autoComplete?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];

    /** Dropdown positioning */
    portal?: boolean; // default false
    offset?: number; // default 8
};

export type IntentControlComboboxProps<T> = BaseProps<T> &
    Omit<
        React.InputHTMLAttributes<HTMLInputElement>,
        | "className"
        | "size"
        | "disabled"
        | "children"
        | "value"
        | "defaultValue"
        | "onChange"
        | "name"
        | "placeholder"
        | "autoComplete"
        | "inputMode"
    >;

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_COMBOBOX_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "items",
        description: { fr: "Liste d’options.", en: "Options list." },
        type: "T[]",
        required: true,
        fromSystem: false,
    },
    {
        name: "getId",
        description: { fr: "Id stable pour chaque option.", en: "Stable id per option." },
        type: "(item: T) => string | number",
        required: true,
        fromSystem: false,
    },
    {
        name: "getText",
        description: { fr: "Texte principal (input + filtre).", en: "Main text (input + filter)." },
        type: "(item: T) => string",
        required: true,
        fromSystem: false,
    },
    {
        name: "getSubtitle",
        description: { fr: "Sous-texte (menu).", en: "Subtitle (menu)." },
        type: "(item: T) => React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "renderItem",
        description: { fr: "Renderer custom d’une option.", en: "Custom option renderer." },
        type: "(args) => React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "filterFn",
        description: { fr: "Fonction de filtrage custom.", en: "Custom filter function." },
        type: "(args) => T[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "allowCustomValue",
        description: { fr: "Autorise une valeur libre (freeSolo).", en: "Allows freeSolo value." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "open / onOpenChange",
        description: { fr: "Contrôle l’ouverture du menu.", en: "Controls menu open state." },
        type: "boolean / (open:boolean)=>void",
        required: false,
        fromSystem: false,
    },
    {
        name: "inputValue / onInputValueChange",
        description: { fr: "Contrôle le texte de l’input.", en: "Controls input text." },
        type: "string / (value:string)=>void",
        required: false,
        fromSystem: false,
    },
    {
        name: "selectedId / onSelectionChange",
        description: { fr: "Contrôle la sélection.", en: "Controls selection." },
        type: "string | null / (id,item)=>void",
        required: false,
        fromSystem: false,
    },
    {
        name: "insideField",
        description: {
            fr: "Mode naked pour être wrappé par IntentControlField.",
            en: "Naked mode intended to be wrapped by IntentControlField.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "size",
        description: { fr: "Taille du contrôle.", en: "Control size." },
        type: `"xs" | "sm" | "md" | "lg" | "xl"`,
        required: false,
        default: "md",
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
        name: "readOnly",
        description: { fr: "Lecture seule (focusable).", en: "Read-only (focusable)." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "loading",
        description: { fr: "Affiche l’état loading.", en: "Shows loading state." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "portal",
        description: {
            fr: "Rend le menu dans un portal (document.body) avec positionnement fixed.",
            en: "Renders the menu in a portal (document.body) with fixed positioning.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "offset",
        description: {
            fr: "Décalage vertical entre le contrôle et le menu des résultats.",
            en: "Vertical offset between the control and the results menu.",
        },
        type: "number",
        required: false,
        default: "8",
        fromSystem: false,
    },
    {
        name: "(native input props)",
        description: { fr: "Props natives (placeholder, name, etc.).", en: "Native props." },
        type: "InputHTMLAttributes (filtered)",
        required: false,
        fromSystem: false,
    },
];

export const IntentControlComboboxPropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_COMBOBOX_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlComboboxIdentity: ComponentIdentity = {
    name: "IntentControlCombobox",
    kind: "control",
    description: {
        fr: "Combobox intent-first (typeahead/autocomplete) avec menu dropdown accessible, clavier complet, standalone ou dans IntentControlField.",
        en: "Intent-first combobox (typeahead/autocomplete) with accessible dropdown, full keyboard support, standalone or inside IntentControlField.",
    },
    since: "0.2.5",
    docs: { route: "/playground/components/intent-control-combobox" },
    anatomy: {
        root: "<div>",
        input: "input.intent-control-combobox-input",
        menu: "div.intent-control-combobox-menu",
        list: "div.intent-control-combobox-list",
        item: "button.intent-control-combobox-item",
        itemLabel: ".intent-control-combobox-itemLabel",
        itemSub: ".intent-control-combobox-itemSub",
    },
    classHooks: [
        "intent-control",
        "intent-control-combobox",
        "intent-control-combobox-standalone",
        "intent-control-combobox-naked",
        "intent-control-combobox-input",
        "intent-control-combobox-leading",
        "intent-control-combobox-trailing",
        "intent-control-combobox-menu",
        "intent-control-combobox-list",
        "intent-control-combobox-item",
        "intent-control-combobox-empty",
        "intent-control-combobox-loading",
        "is-open",
        "is-invalid",
        "is-disabled",
        "is-readonly",
        "is-active",
        "is-selected",
        "ids-control-xs",
        "ids-control-sm",
        "ids-control-md",
        "ids-control-lg",
        "ids-control-xl",
    ],
};

/* ============================================================================
   ✅ DEFAULT FILTER
============================================================================ */

function defaultFilter<T>(args: {
    query: string;
    items: T[];
    getText: (item: T) => string;
    getKeywords?: (item: T) => string[] | null | undefined;
    max: number;
}) {
    const q = args.query.trim().toLowerCase();
    if (!q) return args.items.slice(0, args.max);

    const out: T[] = [];
    for (const it of args.items) {
        const text = args.getText(it).toLowerCase();
        const kws = args.getKeywords?.(it) ?? null;

        const hitText = text.includes(q);
        const hitKw = kws ? kws.some((k) => k.toLowerCase().includes(q)) : false;

        if (hitText || hitKw) out.push(it);
        if (out.length >= args.max) break;
    }

    return out;
}

/* ============================================================================
   ✅ MAIN
============================================================================ */

export const IntentControlCombobox = React.forwardRef(function IntentControlComboboxInner<T>(
    props: IntentControlComboboxProps<T>,
    forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
    const {
        className,

        size = "md",
        fullWidth = false,

        leading,
        trailing,

        invalid = false,
        readOnly = false,
        insideField = false,

        items,
        getId,
        getText,
        getSubtitle,
        getKeywords,

        renderItem,

        filterFn,
        minChars = 0,
        maxResults = 12,

        openOnFocus = true,
        closeOnSelect = true,
        clearOnSelect = false,
        selectOnBlur = false,

        loading = false,
        loadingLabel = "Loading…",
        emptyLabel = "No results",

        allowCustomValue = false,
        createOptionLabel,

        open: openProp,
        defaultOpen = false,
        onOpenChange,

        inputValue: inputValueProp,
        defaultInputValue = "",
        onInputValueChange,

        selectedId: selectedIdProp,
        defaultSelectedId = null,
        onSelectionChange,

        onCustomValue,

        name,
        placeholder,
        autoComplete,
        inputMode,

        // DS props (removed from DOM)
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: disabledProp,

        portal = false,
        offset = 8,

        // remaining native props
        onKeyDown,
        onFocus,
        onBlur,
        onPointerDown,
        ...native
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
    const layoutProps = getIntentLayoutProps(resolved);
    const controlProps = getIntentControlProps(resolved);
    const surfaceClass = composeIntentClassName(resolved);

    /* --------------------------------------------
       Controlled/uncontrolled: open, inputValue, selectedId
    -------------------------------------------- */

    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const [portalStyle, setPortalStyle] = React.useState<React.CSSProperties | null>(null);
    const [portalReady, setPortalReady] = React.useState(false);

    const openControlled = openProp !== undefined;
    const [openUncontrolled, setOpenUncontrolled] = React.useState<boolean>(defaultOpen);
    const open = openControlled ? Boolean(openProp) : openUncontrolled;

    const setOpen = React.useCallback(
        (next: boolean) => {
            if (!openControlled) setOpenUncontrolled(next);
            onOpenChange?.(next);
        },
        [openControlled, onOpenChange]
    );

    const valueControlled = inputValueProp !== undefined;
    const [valueUncontrolled, setValueUncontrolled] = React.useState<string>(defaultInputValue);
    const inputValue = valueControlled ? String(inputValueProp ?? "") : valueUncontrolled;

    const setInputValue = React.useCallback(
        (next: string) => {
            if (!valueControlled) setValueUncontrolled(next);
            onInputValueChange?.(next);
        },
        [valueControlled, onInputValueChange]
    );

    const selectedControlled = selectedIdProp !== undefined;
    const [selectedUncontrolled, setSelectedUncontrolled] = React.useState<string | null>(
        defaultSelectedId
    );
    const selectedId = selectedControlled ? (selectedIdProp ?? null) : selectedUncontrolled;

    const setSelectedId = React.useCallback(
        (next: string | null, item?: T) => {
            if (!selectedControlled) setSelectedUncontrolled(next);
            onSelectionChange?.(next, item);
        },
        [selectedControlled, onSelectionChange]
    );

    /* --------------------------------------------
       Refs + ids (ARIA)
    -------------------------------------------- */

    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const menuRef = React.useRef<HTMLDivElement | null>(null);
    const listRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        setRef(forwardedRef as any, inputRef.current as any);
    }, [forwardedRef]);

    const reactId = React.useId();
    const listboxId = `ids-cb-listbox-${reactId}`;
    const labelId = `ids-cb-label-${reactId}`;

    /* --------------------------------------------
       Filtering + derived state
    -------------------------------------------- */

    const query = inputValue;
    const canSearch = query.trim().length >= minChars;

    // ✅ DEBUG (temp)
    React.useEffect(() => {
        console.log("🧪 [IDS Combobox] props snapshot", {
            query,
            minChars,
            canSearch,
            open,
            itemsLen: items?.length ?? 0,
            hasFilterFn: Boolean(filterFn),
            maxResults,
            loading,
        });
    }, [query, minChars, canSearch, open, items, filterFn, maxResults, loading]);

    const filtered = React.useMemo(() => {
        if (!canSearch) return [] as T[];

        const base = filterFn
            ? filterFn({ query, items, getText, getKeywords })
            : defaultFilter({ query, items, getText, getKeywords, max: maxResults });

        // ✅ DEBUG (temp)
        // if (process.env.NODE_ENV !== "production") {
        console.log("🧪 [IDS Combobox] filter result", {
            baseType: typeof base,
            isArray: Array.isArray(base),
            baseLen: Array.isArray(base) ? base.length : null,
            itemsLen: items.length,
            query,
        });
        // }

        // Safety (important)
        const safe = Array.isArray(base) ? base : [];

        // ✅ Fallback: if consumer provided items already filtered server-side
        // and our filter produced 0 while items exist and query is not empty,
        // keep items instead of showing empty state.
        // if (safe.length === 0 && items.length > 0 && query.trim().length > 0) {
        //     return items.slice(0, maxResults);
        // }

        return safe.slice(0, maxResults);
    }, [canSearch, filterFn, query, items, getText, getKeywords, maxResults]);

    const selectedKey = selectedId ? toKey(selectedId) : null;

    // Optional "create" row (freeSolo)
    const createRow: IntentComboboxCreateOption = React.useMemo(() => {
        if (!allowCustomValue) return { kind: "none" };
        const v = query.trim();
        if (!v) return { kind: "none" };

        // avoid offering create if already exact match
        const exact = items.some((it: any) => getText(it).trim().toLowerCase() === v.toLowerCase());
        if (exact) return { kind: "none" };

        const label = createOptionLabel ? createOptionLabel(v) : `Create “${v}”`;
        return { kind: "custom", label, value: v };
    }, [allowCustomValue, query, items, getText, createOptionLabel]);

    const resultsCount = filtered.length + (createRow.kind === "custom" ? 1 : 0);

    /* --------------------------------------------
       Active item (keyboard)
    -------------------------------------------- */

    const [activeIndex, setActiveIndex] = React.useState<number>(-1);

    // Reset active index when query changes
    React.useEffect(() => {
        setActiveIndex(resultsCount ? 0 : -1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, resultsCount, open]);

    function getRowAt(
        index: number
    ): { kind: "item"; item: T } | { kind: "create"; value: string } | null {
        const createFirst = createRow.kind === "custom";
        const offset = createFirst ? 1 : 0;

        if (createFirst) {
            if (index === 0) return { kind: "create", value: createRow.value };
        }

        const i = index - offset;
        if (i < 0 || i >= filtered.length) return null;
        return { kind: "item", item: filtered[i] };
    }

    const activeDescendantId = React.useMemo(() => {
        if (!open || activeIndex < 0) return undefined;
        const row = getRowAt(activeIndex);
        if (!row) return undefined;

        if (row.kind === "create") return `ids-cb-opt-create-${reactId}`;
        const id = toKey(getId(row.item));
        return `ids-cb-opt-${reactId}-${id}`;
    }, [open, activeIndex, filtered, createRow, reactId, getId]);

    const syncActiveIntoView = React.useMemo(
        () =>
            rafThrottle(() => {
                const list = listRef.current;
                if (!list) return;
                const active = list.querySelector<HTMLElement>("[data-active='true']");
                if (!active) return;
                scrollItemIntoView(list, active);
            }),
        []
    );

    React.useEffect(() => {
        if (!open) return;
        syncActiveIntoView();
    }, [open, activeIndex, syncActiveIntoView]);

    const computePortalPosition = React.useCallback(() => {
        if (!portal) return;

        const rootEl = rootRef.current;
        const menuEl = menuRef.current;

        if (!rootEl || !menuEl) return;

        const triggerRect = rootEl.getBoundingClientRect();
        const menuRect = menuEl.getBoundingClientRect();

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = triggerRect.left;
        let top = triggerRect.bottom + offset;

        // keep within viewport horizontally
        if (left + menuRect.width > viewportWidth - 8) {
            left = Math.max(8, viewportWidth - menuRect.width - 8);
        }

        // flip upward if needed
        if (top + menuRect.height > viewportHeight - 8) {
            const flippedTop = triggerRect.top - offset - menuRect.height;
            if (flippedTop >= 8) {
                top = flippedTop;
            }
        }

        setPortalStyle({
            position: "fixed",
            top: Math.round(top),
            left: Math.round(left),
            minWidth: Math.round(triggerRect.width),
            zIndex: 70,
        });
        setPortalReady(true);
    }, [portal, offset]);

    React.useEffect(() => {
        if (!open || !portal) return;

        setPortalReady(false);

        const update = () => computePortalPosition();

        requestAnimationFrame(() => {
            update();
            requestAnimationFrame(update);
        });

        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, true);

        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
        };
    }, [open, portal, computePortalPosition]);

    /* --------------------------------------------
       Open/close behavior
    -------------------------------------------- */

    function openMenu() {
        if (disabled || readOnly) return;
        setOpen(true);
    }
    function closeMenu() {
        setOpen(false);
    }

    // Close when clicking outside
    React.useEffect(() => {
        if (!open) return;

        function onDocDown(e: MouseEvent) {
            const t = e.target as Node | null;
            if (!t) return;

            if (rootRef.current?.contains(t)) return;
            if (menuRef.current?.contains(t)) return;

            closeMenu();
        }

        document.addEventListener("mousedown", onDocDown);
        return () => document.removeEventListener("mousedown", onDocDown);
    }, [open]);

    /* --------------------------------------------
       Commit selection
    -------------------------------------------- */

    function commitItem(item: T) {
        const id = toKey(getId(item));
        setSelectedId(id, item);

        if (!clearOnSelect) setInputValue(getText(item));
        else setInputValue("");

        if (closeOnSelect) closeMenu();
    }

    function commitCustom(value: string) {
        onCustomValue?.(value);

        if (clearOnSelect) setInputValue("");
        else setInputValue(value);

        if (closeOnSelect) closeMenu();
    }

    /* --------------------------------------------
       Keyboard
    -------------------------------------------- */

    function onKeyDownInternal(e: React.KeyboardEvent<HTMLInputElement>) {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (disabled) return;

        const hasMenu = open && resultsCount > 0;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!open) openMenu();
            if (!resultsCount) return;
            setActiveIndex((v) => clamp(v < 0 ? 0 : v + 1, 0, Math.max(0, resultsCount - 1)));
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) openMenu();
            if (!resultsCount) return;
            setActiveIndex((v) =>
                clamp(v < 0 ? resultsCount - 1 : v - 1, 0, Math.max(0, resultsCount - 1))
            );
            return;
        }

        if (e.key === "Home" && hasMenu) {
            e.preventDefault();
            setActiveIndex(0);
            return;
        }

        if (e.key === "End" && hasMenu) {
            e.preventDefault();
            setActiveIndex(resultsCount - 1);
            return;
        }

        if (e.key === "Escape") {
            if (open) {
                e.preventDefault();
                closeMenu();
            }
            return;
        }

        if (e.key === "Enter") {
            if (!open) return;

            const row = activeIndex >= 0 ? getRowAt(activeIndex) : null;
            if (!row) return;

            e.preventDefault();

            if (row.kind === "create") commitCustom(row.value);
            else commitItem(row.item);
            return;
        }
    }

    /* --------------------------------------------
       Blur behavior (optional selectOnBlur)
    -------------------------------------------- */

    function onBlurInternal(e: React.FocusEvent<HTMLInputElement>) {
        onBlur?.(e);

        // If focus moved inside the root (menu click), do nothing.
        const next = e.relatedTarget as HTMLElement | null;
        if (next && rootRef.current?.contains(next)) return;

        if (selectOnBlur && open && activeIndex >= 0) {
            const row = getRowAt(activeIndex);
            if (row?.kind === "item") {
                commitItem(row.item);
            } else if (row?.kind === "create") {
                commitCustom(row.value);
            }
        }

        closeMenu();
    }

    /* --------------------------------------------
       Classes (stable hooks) — aligned with IntentControlInput
    -------------------------------------------- */

    const rootBaseCls = cn(
        // ✅ IMPORTANT: in naked mode we do NOT want the generic `.intent-control` styling to apply
        insideField
            ? "intent-control intent-control-combobox"
            : "intent-control intent-control-combobox",
        insideField ? "intent-control-combobox-naked" : "intent-control-combobox-standalone",
        sizeClass(size),
        fullWidth && "w-full",
        invalid && "is-invalid",
        disabled && "is-disabled",
        readOnly && "is-readonly",
        open && "is-open",
        surfaceClass,
        className
    );

    // Root visuals:
    // - standalone => add control frame visuals
    // - naked => NO control frame visuals (Field owns them), but keep layout vars
    const rootVisualCls = insideField
        ? cn(layoutProps.className, rootBaseCls)
        : cn(layoutProps.className, controlProps.className, rootBaseCls);

    // Element contract mirrors IntentControlInput:
    const inputElCls = cn(
        "intent-control-combobox-input",
        insideField
            ? "intent-control-combobox-input-naked"
            : "intent-control-combobox-input-standalone",
        sizeClass(size),
        fullWidth && "w-full",
        invalid && "is-invalid",
        disabled && "is-disabled",
        readOnly && "is-readonly"
    );

    const menuCls = cn("intent-control-combobox-menu", open && "is-open");

    const menuStyle: React.CSSProperties | undefined = portal
        ? {
              ...(portalStyle ?? {
                  position: "fixed",
                  top: 0,
                  left: 0,
                  visibility: "hidden",
                  pointerEvents: "none",
                  zIndex: 70,
              }),
              ...(portal && !portalReady
                  ? {
                        visibility: "hidden",
                        pointerEvents: "none",
                    }
                  : {}),
          }
        : {
              ["--ids-combobox-offset" as string]: `${offset}px`,
          };

    const commonAria = {
        "aria-invalid": invalid || undefined,
        "aria-disabled": disabled || undefined,
        "aria-readonly": readOnly || undefined,
    };

    /* --------------------------------------------
       Render item row
    -------------------------------------------- */

    function renderRow(index: number) {
        const row = getRowAt(index);
        if (!row) return null;

        if (row.kind === "create") {
            const isActive = index === activeIndex;
            return (
                <button
                    key="__create__"
                    type="button"
                    id={`ids-cb-opt-create-${reactId}`}
                    className={cn("intent-control-combobox-item", isActive && "is-active")}
                    data-active={isActive ? "true" : "false"}
                    role="option"
                    aria-selected={false}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => commitCustom(row.value)}
                >
                    <span className="intent-control-combobox-itemLabel">
                        {createRow.kind === "custom" ? createRow.label : "Create"}
                    </span>
                </button>
            );
        }

        const item = row.item;
        const id = toKey(getId(item));
        const isSelected = selectedKey === id;
        const isActive = index === activeIndex;

        if (renderItem) {
            return (
                <button
                    key={id}
                    type="button"
                    id={`ids-cb-opt-${reactId}-${id}`}
                    className={cn(
                        "intent-control-combobox-item",
                        isActive && "is-active",
                        isSelected && "is-selected"
                    )}
                    data-active={isActive ? "true" : "false"}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => commitItem(item)}
                >
                    {renderItem({ item, isActive, isSelected, query })}
                </button>
            );
        }

        const label = getText(item);
        const sub = getSubtitle?.(item) ?? null;

        return (
            <button
                key={id}
                type="button"
                id={`ids-cb-opt-${reactId}-${id}`}
                className={cn(
                    "intent-control-combobox-item",
                    isActive && "is-active",
                    isSelected && "is-selected"
                )}
                data-active={isActive ? "true" : "false"}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commitItem(item)}
            >
                <span className="intent-control-combobox-itemLabel">{label}</span>
                {sub ? <span className="intent-control-combobox-itemSub">{sub}</span> : null}
            </button>
        );
    }

    const shouldShowMenu = open && !disabled && !readOnly;

    // ✅ Menu should render whenever it's open (so we can show empty/loading/minChars states)
    const showResults = shouldShowMenu;

    const minCharsMissing =
        minChars > 0 && query.trim().length > 0 && query.trim().length < minChars;

    const showTypeHint = minChars > 0 && query.trim().length < minChars;

    return (
        <div
            {...(layoutProps as any)}
            ref={rootRef}
            className={rootVisualCls}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            {leading ? (
                <span className="intent-control-combobox-leading" aria-hidden>
                    {leading}
                </span>
            ) : null}

            <input
                {...(native as React.InputHTMLAttributes<HTMLInputElement>)}
                ref={(n) => {
                    inputRef.current = n;
                    setRef(forwardedRef as any, n as any);
                }}
                className={inputElCls}
                name={name}
                placeholder={placeholder}
                autoComplete={autoComplete}
                inputMode={inputMode}
                disabled={disabled}
                readOnly={readOnly}
                value={inputValue}
                onChange={(e) => {
                    const v = e.target.value;
                    setInputValue(v);
                    if (!open && (openOnFocus || v.length >= minChars)) openMenu();
                }}
                onFocus={(e) => {
                    onFocus?.(e);
                    if (e.defaultPrevented) return;
                    if (openOnFocus) openMenu();
                }}
                onBlur={onBlurInternal}
                onPointerDown={(e) => {
                    onPointerDown?.(e);
                    if (e.defaultPrevented) return;
                    // click in input toggles menu open (but don't close if already open)
                    if (!open && openOnFocus) openMenu();
                }}
                onKeyDown={onKeyDownInternal}
                role="combobox"
                aria-expanded={shouldShowMenu ? Boolean(showResults) : false}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={activeDescendantId}
                aria-labelledby={labelId}
                {...commonAria}
            />

            {trailing ? (
                <span className="intent-control-combobox-trailing" aria-hidden>
                    {trailing}
                </span>
            ) : null}

            {/* Menu */}
            {(() => {
                const menuNode = showResults ? (
                    <div
                        ref={menuRef}
                        className={cn(menuCls, portal && "is-portal")}
                        style={menuStyle}
                        aria-hidden={!showResults}
                    >
                        <div
                            ref={listRef}
                            id={listboxId}
                            className="intent-control-combobox-list"
                            role="listbox"
                            tabIndex={-1}
                        >
                            {loading ? (
                                <div className="intent-control-combobox-loading">
                                    {loadingLabel}
                                </div>
                            ) : showTypeHint ? (
                                <div className="intent-control-combobox-empty">
                                    {query.trim().length === 0
                                        ? `Type at least ${minChars} character${minChars > 1 ? "s" : ""}…`
                                        : `Type ${minChars - query.trim().length} more…`}
                                </div>
                            ) : resultsCount === 0 ? (
                                <div className="intent-control-combobox-empty">{emptyLabel}</div>
                            ) : (
                                Array.from({ length: resultsCount }, (_, i) => renderRow(i))
                            )}
                        </div>
                    </div>
                ) : null;

                if (!menuNode) return null;
                if (!portal) return menuNode;
                if (!mounted) return null;

                return createPortal(menuNode, document.body);
            })()}

            {/* Hidden label anchor (for ARIA-labelledby without forcing a visible label) */}
            {/* <span id={labelId} className="sr-only">
                Combobox
            </span> */}
        </div>
    );
}) as <T>(
    props: IntentControlComboboxProps<T> & { ref?: React.Ref<HTMLInputElement> }
) => React.ReactElement;

/* ============================================================================
   Notes CSS hooks (no Tailwind dynamics)
   You’ll likely style:
   - .intent-control-combobox-menu as absolute dropdown under input
   - .intent-control-combobox-list with max-height + overflow
============================================================================ */
