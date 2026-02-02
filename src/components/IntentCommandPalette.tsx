"use client";

// src/components/intent/IntentCommandPalette.tsx
// IntentCommandPalette
// - Command palette (⌘K / Ctrl+K) intent-first
// - Overlay + panel surface + search field + results list
// - Keyboard navigation (↑/↓, Enter, Escape)
// - Stable hooks + resolver vars only

import * as React from "react";

import type { IntentInput } from "../lib/intent/types";
import {
    resolveIntent,
    getIntentLayoutProps,
    composeIntentClassName,
    composeIntentControlClassName,
} from "../lib/intent/resolve";

import type { DocsPropRow, ComponentIdentity } from "../lib/intent/types";
import { SYSTEM_PROPS_TABLE } from "../lib/intent/props";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function normalizeText(value: string) {
    return value.trim().toLowerCase();
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentCommandPaletteItem = {
    id: string;
    label: string;
    description?: string;
    keywords?: string[];
    leftIcon?: React.ReactNode;
    rightHint?: string; // ex: "⌘↵" or "Enter"
    disabled?: boolean;

    onSelect?: (item: IntentCommandPaletteItem) => void;
};

export type IntentCommandPaletteGroup = {
    id: string;
    label?: string;
    items: IntentCommandPaletteItem[];
};

export type IntentCommandPaletteProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
        className?: string;

        /** Controlled open (optional) */
        open?: boolean;
        defaultOpen?: boolean;
        onOpenChange?: (open: boolean) => void;

        /** Data */
        groups: IntentCommandPaletteGroup[];

        /** Search */
        query?: string;
        defaultQuery?: string;
        onQueryChange?: (query: string) => void;
        placeholder?: string; // default "Search…"

        /** Behavior */
        closeOnSelect?: boolean; // default true
        emptyLabel?: React.ReactNode; // default "No results"
        footer?: React.ReactNode;

        /** Shortcut */
        enableGlobalHotkey?: boolean; // default true
        hotkey?: "mod+k" | "mod+p"; // default "mod+k"
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_COMMAND_PALETTE_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "className",
        description: {
            fr: "Classes CSS additionnelles sur le root.",
            en: "Extra CSS classes on root.",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "open",
        description: {
            fr: "Contrôle l’ouverture (mode contrôlé).",
            en: "Controls open state (controlled).",
        },
        type: "boolean",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultOpen",
        description: {
            fr: "Ouverture par défaut (mode non-contrôlé).",
            en: "Default open (uncontrolled).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "onOpenChange",
        description: { fr: "Callback d’ouverture/fermeture.", en: "Open/close callback." },
        type: "(open: boolean) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "groups",
        description: { fr: "Groupes d’actions (items).", en: "Action groups (items)." },
        type: "IntentCommandPaletteGroup[]",
        required: true,
        fromSystem: false,
    },
    {
        name: "query",
        description: { fr: "Recherche contrôlée.", en: "Controlled query." },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultQuery",
        description: {
            fr: "Recherche par défaut (non-contrôlé).",
            en: "Default query (uncontrolled).",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "onQueryChange",
        description: { fr: "Callback de recherche.", en: "Query change callback." },
        type: "(query: string) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "placeholder",
        description: { fr: "Placeholder du champ recherche.", en: "Search input placeholder." },
        type: "string",
        required: false,
        default: "Search…",
        fromSystem: false,
    },
    {
        name: "closeOnSelect",
        description: { fr: "Ferme à la sélection.", en: "Closes on select." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "emptyLabel",
        description: { fr: "Affichage quand aucun résultat.", en: "Empty state label." },
        type: "React.ReactNode",
        required: false,
        default: "No results",
        fromSystem: false,
    },
    {
        name: "footer",
        description: {
            fr: "Zone footer (hints, shortcuts...).",
            en: "Footer area (hints, shortcuts...).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "enableGlobalHotkey",
        description: { fr: "Active le raccourci global.", en: "Enables global hotkey." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "hotkey",
        description: { fr: "Raccourci global.", en: "Global hotkey." },
        type: `"mod+k" | "mod+p"`,
        required: false,
        default: "mod+k",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: { fr: "Props natives sur le root.", en: "Native props on root." },
        type: "Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'children'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentCommandPalettePropsTable: DocsPropRow[] = [
    ...INTENT_COMMAND_PALETTE_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentCommandPaletteIdentity: ComponentIdentity = {
    name: "IntentCommandPalette",
    kind: "surface",
    description: {
        fr: "Palette de commandes intent-first (overlay + recherche + liste). Navigation clavier et sélection rapide.",
        en: "Intent-first command palette (overlay + search + list). Keyboard navigation and quick selection.",
    },
    since: "0.2.0",
    docs: { route: "/playground/components/intent-command-palette" },
    anatomy: {
        root: "<div>",
        overlay: ".intent-command-overlay",
        panel: ".intent-command-panel",
        header: ".intent-command-header",
        input: ".intent-command-input",
        list: ".intent-command-list",
        group: ".intent-command-group",
        groupLabel: ".intent-command-groupLabel",
        item: ".intent-command-item",
        itemIcon: ".intent-command-itemIcon",
        itemMain: ".intent-command-itemMain",
        itemLabel: ".intent-command-itemLabel",
        itemDescription: ".intent-command-itemDescription",
        itemHint: ".intent-command-itemHint",
        empty: ".intent-command-empty",
        footer: ".intent-command-footer",
    },
    classHooks: [
        "intent-command",
        "intent-command-overlay",
        "intent-command-panel",
        "intent-command-input",
        "intent-command-item",
        "is-open",
        "is-disabled",
        "is-active",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentCommandPalette(props: IntentCommandPaletteProps) {
    const {
        className,

        open: openProp,
        defaultOpen = false,
        onOpenChange,

        groups,

        query: queryProp,
        defaultQuery = "",
        onQueryChange,
        placeholder = "Search…",

        closeOnSelect = true,
        emptyLabel = "No results",
        footer,

        enableGlobalHotkey = true,
        hotkey = "mod+k",

        // DS props (removed from DOM)
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: dsDisabled,

        ...divProps
    } = props;

    const disabled = Boolean(dsDisabled);

    const [openUncontrolled, setOpenUncontrolled] = React.useState(defaultOpen);
    const isControlledOpen = openProp !== undefined;
    const open = isControlledOpen ? Boolean(openProp) : openUncontrolled;

    const setOpen = React.useCallback(
        (next: boolean) => {
            if (!isControlledOpen) setOpenUncontrolled(next);
            onOpenChange?.(next);
        },
        [isControlledOpen, onOpenChange]
    );

    const [queryUncontrolled, setQueryUncontrolled] = React.useState(defaultQuery);
    const isControlledQuery = queryProp !== undefined;
    const query = isControlledQuery ? String(queryProp ?? "") : queryUncontrolled;

    const setQuery = React.useCallback(
        (next: string) => {
            if (!isControlledQuery) setQueryUncontrolled(next);
            onQueryChange?.(next);
        },
        [isControlledQuery, onQueryChange]
    );

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

    // Root: vars only
    const layoutProps = getIntentLayoutProps(resolved, className);

    // Panel: surface recipe (bg/ring/shadow) using vars
    const panelClassName = composeIntentClassName(resolved);

    // Search input: control recipe (bg/ring/shadow) but we’ll use it as “field”
    const inputControlClassName = composeIntentControlClassName(resolved);

    const inputRef = React.useRef<HTMLInputElement | null>(null);

    // Global hotkey
    React.useEffect(() => {
        if (!enableGlobalHotkey || disabled) return;

        const isMac =
            typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
        const isMod = (e: KeyboardEvent) => (isMac ? e.metaKey : e.ctrlKey);

        const keyWanted = hotkey === "mod+p" ? "p" : "k";

        const onKeyDown = (e: KeyboardEvent) => {
            if (!isMod(e)) return;
            if (e.key.toLowerCase() !== keyWanted) return;

            e.preventDefault();
            setOpen(!open);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [enableGlobalHotkey, disabled, hotkey, open, setOpen]);

    // Focus input on open
    React.useEffect(() => {
        if (!open) return;
        const t = window.setTimeout(() => inputRef.current?.focus(), 10);
        return () => window.clearTimeout(t);
    }, [open]);

    // Flatten & filter
    const filtered = React.useMemo(() => {
        const q = normalizeText(query);
        if (!q) return groups;

        const includes = (item: IntentCommandPaletteItem) => {
            const hay = [item.label, item.description ?? "", ...(item.keywords ?? [])]
                .join(" ")
                .toLowerCase();

            return hay.includes(q);
        };

        return groups
            .map((g) => ({
                ...g,
                items: g.items.filter(includes),
            }))
            .filter((g) => g.items.length > 0);
    }, [groups, query]);

    const allItems = React.useMemo(() => {
        const out: Array<{ groupId: string; item: IntentCommandPaletteItem }> = [];
        for (const g of filtered) {
            for (const item of g.items) out.push({ groupId: g.id, item });
        }
        return out;
    }, [filtered]);

    const [activeIndex, setActiveIndex] = React.useState(0);

    // Reset active on query change/open
    React.useEffect(() => {
        if (!open) return;
        setActiveIndex(0);
    }, [open, query]);

    const onClose = React.useCallback(() => {
        setOpen(false);
        setQuery("");
    }, [setOpen, setQuery]);

    const selectItem = React.useCallback(
        (item: IntentCommandPaletteItem) => {
            if (item.disabled) return;

            item.onSelect?.(item);

            if (closeOnSelect) onClose();
        },
        [closeOnSelect, onClose]
    );

    // Keyboard nav inside palette
    React.useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
                return;
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((idx) => clamp(idx + 1, 0, Math.max(0, allItems.length - 1)));
                return;
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((idx) => clamp(idx - 1, 0, Math.max(0, allItems.length - 1)));
                return;
            }

            if (e.key === "Enter") {
                e.preventDefault();
                const entry = allItems[activeIndex];
                if (entry) selectItem(entry.item);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, allItems, activeIndex, selectItem, onClose]);

    // Scroll active into view
    const listRef = React.useRef<HTMLDivElement | null>(null);
    React.useEffect(() => {
        if (!open) return;
        const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-active="true"]`);
        el?.scrollIntoView({ block: "nearest" });
    }, [open, activeIndex]);

    const hasResults = allItems.length > 0;

    return (
        <div
            {...divProps}
            style={layoutProps.style}
            className={cn(
                layoutProps.className,
                "intent-command",
                open && "is-open",
                disabled && "is-disabled"
            )}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
            aria-hidden={!open}
        >
            {open ? (
                <div
                    className="intent-command-overlay"
                    role="presentation"
                    onMouseDown={(e) => {
                        // click outside closes
                        if (e.target === e.currentTarget) onClose();
                    }}
                >
                    <div
                        className={cn("intent-surface intent-command-panel", panelClassName)}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Command palette"
                    >
                        <div className="intent-command-header">
                            <div
                                className={cn(
                                    "intent-control intent-command-inputWrap",
                                    inputControlClassName
                                )}
                            >
                                <input
                                    ref={inputRef}
                                    className="intent-command-input"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={placeholder}
                                    disabled={disabled}
                                />

                                <div className="intent-command-kbdHint" aria-hidden="true">
                                    <span className="intent-command-kbd">Esc</span>
                                </div>
                            </div>
                        </div>

                        <div className="intent-command-list" ref={listRef} role="listbox">
                            {!hasResults ? (
                                <div className="intent-command-empty">{emptyLabel}</div>
                            ) : (
                                filtered.map((group) => {
                                    const groupHasLabel = Boolean(group.label);

                                    return (
                                        <div key={group.id} className="intent-command-group">
                                            {groupHasLabel ? (
                                                <div className="intent-command-groupLabel">
                                                    {group.label}
                                                </div>
                                            ) : null}

                                            {group.items.map((item) => {
                                                const entryIndex = allItems.findIndex(
                                                    (x) => x.item.id === item.id
                                                );
                                                const isActive = entryIndex === activeIndex;

                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        className={cn(
                                                            "intent-command-item",
                                                            isActive && "is-active",
                                                            item.disabled && "is-disabled"
                                                        )}
                                                        role="option"
                                                        aria-selected={isActive}
                                                        disabled={item.disabled}
                                                        data-cmd-active={
                                                            isActive ? "true" : "false"
                                                        }
                                                        onMouseEnter={() =>
                                                            setActiveIndex(entryIndex)
                                                        }
                                                        onClick={() => selectItem(item)}
                                                    >
                                                        {item.leftIcon ? (
                                                            <span className="intent-command-itemIcon">
                                                                {item.leftIcon}
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className="intent-command-itemDot"
                                                                aria-hidden="true"
                                                            />
                                                        )}

                                                        <span className="intent-command-itemMain">
                                                            <span className="intent-command-itemLabel">
                                                                {item.label}
                                                            </span>
                                                            {item.description ? (
                                                                <span className="intent-command-itemDescription">
                                                                    {item.description}
                                                                </span>
                                                            ) : null}
                                                        </span>

                                                        {item.rightHint ? (
                                                            <span
                                                                className="intent-command-itemHint"
                                                                aria-hidden="true"
                                                            >
                                                                {item.rightHint}
                                                            </span>
                                                        ) : null}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {footer ? <div className="intent-command-footer">{footer}</div> : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
