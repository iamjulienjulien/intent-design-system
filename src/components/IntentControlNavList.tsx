"use client";

// src/components/intent/IntentControlNavList.tsx
// IntentControlNavList
// - Intent-first vertical navigation list (sidebar-style)
// - Wrapper is an IntentControl surface (resolveIntent + getIntentControlProps)
// - Items are intent-resolved too (separate styling for active/inactive)
// - Optional href items (anchor) or action items (button)
// - Keyboard nav: ArrowUp/ArrowDown, Home/End, Enter/Space
// - Optional typeahead (starts-with)
// - Optional glow layers on wrapper + items
// - No dynamic Tailwind classes: only stable hooks

import * as React from "react";

import { resolveIntent, getIntentControlProps } from "CORE";
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

function isPrintableChar(e: React.KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    return e.key.length === 1;
}

type NavListSize = "xs" | "sm" | "md" | "lg";

function sizeClass(size: NavListSize) {
    switch (size) {
        case "xs":
            return "ids-navlist-xs";
        case "sm":
            return "ids-navlist-sm";
        case "lg":
            return "ids-navlist-lg";
        default:
            return "ids-navlist-md";
    }
}

type NavListDensity = "compact" | "comfortable";

function densityClass(density: NavListDensity) {
    return density === "compact" ? "is-compact" : "is-comfortable";
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentControlNavListItem = {
    id: string;
    label: React.ReactNode;

    /** Optional icon left */
    icon?: React.ReactNode;

    /** Optional right meta (badge, shortcut, count…) */
    meta?: React.ReactNode;

    /** Optional extra line */
    description?: React.ReactNode;

    /** Disabled item */
    disabled?: boolean;

    /** Optional dangerous styling hook */
    dangerous?: boolean;

    /**
     * Link behavior:
     * - If href is provided, item renders as <a>
     * - Otherwise item renders as <button>
     */
    href?: string;
    target?: React.HTMLAttributeAnchorTarget;
    rel?: string;

    /** Called when item is activated (click / Enter / Space) */
    onSelect?: (item: IntentControlNavListItem) => void;

    /** Optional typeahead text (when label is not a string) */
    searchText?: string;
};

type IntentOverrides = Partial<Omit<IntentInput, "disabled">>;

export type IntentControlNavListProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children" | "onChange"> & {
        className?: string;

        /** Navigation items */
        items: IntentControlNavListItem[];

        /** Controlled active item id */
        value?: string;

        /** Uncontrolled initial active item id (defaults to first enabled item) */
        defaultValue?: string;

        /** Called when active item changes */
        onValueChange?: (id: string) => void;

        /** If true, component is read-only (no activation) */
        readOnly?: boolean; // default false

        /** Wrapper layout */
        size?: NavListSize; // default "md"
        density?: NavListDensity; // default "comfortable"
        fullWidth?: boolean; // default true

        /** Optional header/footer inside wrapper */
        header?: React.ReactNode;
        footer?: React.ReactNode;
        divider?: boolean; // default true when header/footer exists

        /**
         * Item styling overrides:
         * - If not provided, items inherit wrapper's resolved intent.
         * - Provide different intent/tone/variant/glow for active/inactive items.
         */
        activeItem?: IntentOverrides;
        inactiveItem?: IntentOverrides;

        /**
         * If true, items may render glow layers when their resolved glow is enabled.
         * Default: false (keeps DOM light).
         */
        itemGlow?: boolean; // default false

        /**
         * If true, clicking a link item will not auto-navigate (you handle it).
         * Default: false (link navigates normally).
         */
        preventLinkNavigation?: boolean; // default false
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_NAVLIST_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "items",
        description: {
            fr: "Liste des entrées (label, icon, meta, href, disabled, onSelect…).",
            en: "Entries list (label, icon, meta, href, disabled, onSelect…).",
        },
        type: "IntentControlNavListItem[]",
        required: true,
        fromSystem: false,
    },
    {
        name: "value / defaultValue / onValueChange",
        description: {
            fr: "Contrôle de l’élément actif (controlled/uncontrolled).",
            en: "Active item control (controlled/uncontrolled).",
        },
        type: "string / string / (id:string)=>void",
        required: false,
        fromSystem: false,
    },
    {
        name: "readOnly",
        description: {
            fr: "Lecture seule: focusable mais pas d’activation.",
            en: "Read-only: focusable but cannot activate items.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "size / density / fullWidth",
        description: {
            fr: "Taille, densité et largeur du wrapper.",
            en: "Wrapper size, density and width.",
        },
        type: `"xs"|"sm"|"md"|"lg" / "compact"|"comfortable" / boolean`,
        required: false,
        default: "md / comfortable / true",
        fromSystem: false,
    },
    {
        name: "header / footer / divider",
        description: {
            fr: "Slots optionnels dans le wrapper + séparateurs.",
            en: "Optional wrapper slots + separators.",
        },
        type: "React.ReactNode / React.ReactNode / boolean",
        required: false,
        fromSystem: false,
    },
    {
        name: "activeItem / inactiveItem",
        description: {
            fr: "Overrides intent/tone/variant/glow pour items actifs/inactifs.",
            en: "Intent/tone/variant/glow overrides for active/inactive items.",
        },
        type: "Partial<IntentInput>",
        required: false,
        fromSystem: false,
    },
    {
        name: "itemGlow",
        description: {
            fr: "Autorise les glow layers sur les items (si glow résolu).",
            en: "Enables glow layers on items (if resolved glow is enabled).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "preventLinkNavigation",
        description: {
            fr: "Empêche la navigation automatique des items href (tu gères).",
            en: "Prevents automatic navigation for href items (you handle it).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Props natives du div (id, style, aria-*, data-*…).",
            en: "Native div props (id, style, aria-*, data-*…).",
        },
        type: "Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'onChange'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentControlNavListPropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_NAVLIST_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlNavListIdentity: ComponentIdentity = {
    name: "IntentControlNavList",
    emoji: "🧭",
    kind: "control",
    description: {
        fr: "Navigation verticale intent-first (style sidebar) avec items stylés via resolveIntent().",
        en: "Intent-first vertical navigation (sidebar-style) with items styled via resolveIntent().",
    },
    since: "0.2.8",
    docs: { route: "/playground/components/intent-control-navlist" },
    anatomy: {
        root: "<div>",
        header: ".intent-navlist-header",
        list: "<div role='listbox'>",
        item: ".intent-navlist-item (button/a)",
        itemIcon: ".intent-navlist-item-icon",
        itemLabel: ".intent-navlist-item-label",
        itemDesc: ".intent-navlist-item-desc",
        itemMeta: ".intent-navlist-item-meta",
        footer: ".intent-navlist-footer",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
    },
    classHooks: [
        "intent-control",
        "intent-control-navlist",
        "intent-bg",
        "intent-text",
        "intent-ring",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
        "intent-navlist-header",
        "intent-navlist-footer",
        "intent-navlist-separator",
        "intent-navlist-list",
        "intent-navlist-item",
        "intent-navlist-item-icon",
        "intent-navlist-item-label",
        "intent-navlist-item-desc",
        "intent-navlist-item-meta",
        "is-active",
        "is-disabled",
        "is-readonly",
        "is-dangerous",
        "ids-navlist-xs",
        "ids-navlist-sm",
        "ids-navlist-md",
        "ids-navlist-lg",
        "is-compact",
        "is-comfortable",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentControlNavList(props: IntentControlNavListProps) {
    const {
        className,
        items,

        value,
        defaultValue,
        onValueChange,

        readOnly = false,

        size = "md",
        density = "comfortable",
        fullWidth = true,

        header,
        footer,
        divider = true,

        activeItem,
        inactiveItem,
        itemGlow = false,

        preventLinkNavigation = false,

        // ✅ DS props OUT (never spread to DOM)
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: disabledProp,

        // ✅ Real DOM props
        ...divProps
    } = props;

    const disabled = Boolean(disabledProp);

    const baseIntentInput: IntentInput = {
        ...(intent !== undefined ? { intent } : {}),
        ...(variant !== undefined ? { variant } : {}),
        ...(tone !== undefined ? { tone } : {}),
        ...(glow !== undefined ? { glow } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),
        disabled,
    };

    const resolvedWrapper = resolveIntent(baseIntentInput);
    const wrapperProps = getIntentControlProps(resolvedWrapper, className);

    const isControlled = typeof value === "string";

    const firstEnabledId =
        items.find((it) => !it.disabled)?.id ??
        (items.length > 0 && typeof items[0]?.id === "string" ? items[0].id : "");

    const initialUncontrolled = defaultValue ?? firstEnabledId;
    const [uncontrolled, setUncontrolled] = React.useState<string>(initialUncontrolled);

    const activeId = isControlled ? (value as string) : uncontrolled;

    const hasHeader = Boolean(header);
    const hasFooter = Boolean(footer);

    /* ============================================================================
       ✨ Wrapper glow layers
    ============================================================================ */

    const hasGlow = Boolean(resolvedWrapper.glowBackground);
    const wv = resolvedWrapper.variant;

    const glowAllowed = hasGlow && wv !== "ghost";
    const isGlowed = resolvedWrapper.intent === "glowed";

    const allowFillGlow = glowAllowed && (isGlowed || wv === "flat" || wv === "elevated");
    const allowBorderGlow = glowAllowed && (wv === "outlined" || wv === "elevated");

    const readOpacity = (key: "--intent-glow-fill-opacity" | "--intent-glow-border-opacity") => {
        const raw = resolvedWrapper.style?.[key] ?? "0";
        const n = Number(raw.toString());
        return Number.isFinite(n) ? n : 0;
    };

    /* ============================================================================
       🧠 Actions
    ============================================================================ */

    function setActive(next: string) {
        if (disabled || readOnly) return;
        if (!isControlled) setUncontrolled(next);
        onValueChange?.(next);
    }

    const listRef = React.useRef<HTMLDivElement | null>(null);

    function findIndexById(id: string) {
        return items.findIndex((it) => it.id === id);
    }

    function findNextEnabled(from: number, dir: 1 | -1): number {
        if (items.length === 0) return -1;

        let i = from;
        for (let step = 0; step < items.length; step++) {
            i += dir;
            if (i < 0) i = items.length - 1;
            if (i >= items.length) i = 0;

            if (!items[i]?.disabled) return i;
        }
        return -1;
    }

    function focusItemIndex(idx: number) {
        const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${idx}"]`);
        el?.focus?.();
    }

    const typeaheadRef = React.useRef<{ buf: string; t: number }>({ buf: "", t: 0 });

    function handleListKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        divProps.onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (disabled || readOnly) return;

        const currentIdx = Math.max(0, findIndexById(activeId));

        if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = findNextEnabled(currentIdx, 1);
            if (next >= 0 && items[next]) {
                setActive(items[next].id);
                focusItemIndex(next);
            }
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            const next = findNextEnabled(currentIdx, -1);
            if (next >= 0 && items[next]) {
                setActive(items[next].id);
                focusItemIndex(next);
            }
            return;
        }

        if (e.key === "Home") {
            e.preventDefault();
            const next = findNextEnabled(-1, 1);
            if (next >= 0 && items[next]) {
                setActive(items[next].id);
                focusItemIndex(next);
            }
            return;
        }

        if (e.key === "End") {
            e.preventDefault();
            const next = findNextEnabled(0, -1);
            if (next >= 0 && items[next]) {
                setActive(items[next].id);
                focusItemIndex(next);
            }
            return;
        }

        // Typeahead (starts-with)
        if (isPrintableChar(e)) {
            const now = Date.now();
            const ref = typeaheadRef.current;
            ref.buf = now - ref.t > 650 ? e.key : ref.buf + e.key;
            ref.t = now;

            const q = ref.buf.toLowerCase();
            const start = currentIdx >= 0 ? currentIdx : -1;

            const itemText = (it: IntentControlNavListItem) => {
                if (it.searchText) return it.searchText;
                if (typeof it.label === "string") return it.label;
                return it.id;
            };

            for (let step = 0; step < items.length; step++) {
                const idx = (start + 1 + step) % items.length;
                const it = items[idx];
                if (!it || it.disabled) continue;

                const text = itemText(it).toLowerCase();
                if (text.startsWith(q)) {
                    setActive(it.id);
                    focusItemIndex(idx);
                    break;
                }
            }
        }
    }

    /* ============================================================================
       🧱 Class hooks (stable)
    ============================================================================ */

    const rootCls = cn(
        "intent-control intent-control-navlist",
        sizeClass(size),
        densityClass(density),
        fullWidth && "w-full",
        disabled && "is-disabled",
        readOnly && "is-readonly"
    );

    /* ============================================================================
       🧩 Item resolve helper
    ============================================================================ */

    function resolveItem(isActive: boolean): ReturnType<typeof resolveIntent> {
        const ov = (isActive ? activeItem : inactiveItem) ?? {};
        const input: IntentInput = {
            ...(intent !== undefined ? { intent } : {}),
            ...(variant !== undefined ? { variant } : {}),
            ...(tone !== undefined ? { tone } : {}),
            ...(glow !== undefined ? { glow } : {}),
            ...(intensity !== undefined ? { intensity } : {}),
            ...(mode !== undefined ? { mode } : {}),
            disabled: false,

            ...(ov.intent !== undefined ? { intent: ov.intent } : {}),
            ...(ov.variant !== undefined ? { variant: ov.variant } : {}),
            ...(ov.tone !== undefined ? { tone: ov.tone } : {}),
            ...(ov.glow !== undefined ? { glow: ov.glow } : {}),
            ...(ov.intensity !== undefined ? { intensity: ov.intensity } : {}),
            ...(ov.mode !== undefined ? { mode: ov.mode } : {}),
        };

        return resolveIntent(input);
    }

    /* ============================================================================
       ✅ Render
    ============================================================================ */

    return (
        <div
            {...divProps}
            {...wrapperProps}
            className={cn(wrapperProps.className, rootCls, className)}
            aria-disabled={disabled || undefined}
            data-intent={resolvedWrapper.intent}
            data-variant={resolvedWrapper.variant}
            data-intensity={resolvedWrapper.intensity}
            data-mode={resolvedWrapper.mode}
        >
            {/* Wrapper glow layers (under content) */}
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

            <div className="intent-navlist-inner">
                {hasHeader ? (
                    <>
                        <div className="intent-navlist-header">{header}</div>
                        {divider ? <div className="intent-navlist-separator" /> : null}
                    </>
                ) : null}

                <div
                    ref={listRef}
                    role="listbox"
                    aria-orientation="vertical"
                    tabIndex={0}
                    className="intent-navlist-list"
                    onKeyDown={handleListKeyDown}
                >
                    {items.map((it, idx) => {
                        const isActive = it.id === activeId;
                        const isItemDisabled = Boolean(it.disabled) || disabled;

                        const resolvedItem = resolveItem(isActive);
                        const itemProps = getIntentControlProps(resolvedItem);

                        const itemHasGlow = Boolean(resolvedItem.glowBackground);
                        const iv = resolvedItem.variant;

                        const itemGlowAllowed = itemHasGlow && iv !== "ghost";
                        const itemIsGlowed = resolvedItem.intent === "glowed";
                        const itemAllowFill =
                            itemGlowAllowed && (itemIsGlowed || iv === "flat" || iv === "elevated");
                        const itemAllowBorder =
                            itemGlowAllowed && (iv === "outlined" || iv === "elevated");

                        const itemCls = cn(
                            "intent-navlist-item",
                            itemProps.className,
                            isActive && "is-active",
                            isItemDisabled && "is-disabled",
                            it.dangerous && "is-dangerous"
                        );

                        const common = {
                            "data-idx": idx,
                            "data-id": it.id,
                            "aria-selected": isActive,
                            "aria-disabled": isItemDisabled || undefined,
                            tabIndex: isItemDisabled ? -1 : isActive ? 0 : -1,
                            className: itemCls,
                            onClick: (e: React.MouseEvent) => {
                                if (isItemDisabled || readOnly) {
                                    e.preventDefault();
                                    return;
                                }
                                setActive(it.id);
                                it.onSelect?.(it);
                            },
                            onKeyDown: (e: React.KeyboardEvent) => {
                                if (isItemDisabled || readOnly) return;
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setActive(it.id);
                                    it.onSelect?.(it);
                                }
                            },
                            style: itemProps.style,
                        };

                        const content = (
                            <>
                                {/* Optional item glow (under item content) */}
                                {itemGlow && itemGlowAllowed ? (
                                    <>
                                        {itemAllowFill ? (
                                            <span
                                                aria-hidden
                                                className="intent-glow-layer intent-glow-fill"
                                                style={{
                                                    opacity:
                                                        Number(
                                                            resolvedItem.style?.[
                                                                "--intent-glow-fill-opacity"
                                                            ] ?? 0
                                                        ) || 0,
                                                }}
                                            />
                                        ) : null}

                                        {itemAllowBorder ? (
                                            <span
                                                aria-hidden
                                                className="intent-glow-layer intent-glow-border"
                                                style={{
                                                    opacity:
                                                        Number(
                                                            resolvedItem.style?.[
                                                                "--intent-glow-border-opacity"
                                                            ] ?? 0
                                                        ) || 0,
                                                    borderRadius: "inherit",
                                                }}
                                            />
                                        ) : null}
                                    </>
                                ) : null}

                                <span className="intent-navlist-item-content">
                                    {it.icon ? (
                                        <span className="intent-navlist-item-icon" aria-hidden>
                                            {it.icon}
                                        </span>
                                    ) : (
                                        <span
                                            className="intent-navlist-item-icon is-empty"
                                            aria-hidden
                                        />
                                    )}

                                    <span className="intent-navlist-item-text">
                                        <span className="intent-navlist-item-label">
                                            {it.label}
                                        </span>
                                        {it.description ? (
                                            <span className="intent-navlist-item-desc">
                                                {it.description}
                                            </span>
                                        ) : null}
                                    </span>

                                    {it.meta ? (
                                        <span className="intent-navlist-item-meta">{it.meta}</span>
                                    ) : null}
                                </span>
                            </>
                        );

                        return it.href ? (
                            <a
                                key={it.id}
                                {...(common as any)}
                                role="option"
                                href={it.href}
                                target={it.target}
                                rel={it.rel}
                                onClick={(e) => {
                                    if (preventLinkNavigation) {
                                        e.preventDefault();
                                    }
                                    (common as any).onClick?.(e);
                                }}
                            >
                                {content}
                            </a>
                        ) : (
                            <button
                                key={it.id}
                                {...(common as any)}
                                role="option"
                                type="button"
                                disabled={isItemDisabled}
                            >
                                {content}
                            </button>
                        );
                    })}
                </div>

                {hasFooter ? (
                    <>
                        {divider ? <div className="intent-navlist-separator" /> : null}
                        <div className="intent-navlist-footer">{footer}</div>
                    </>
                ) : null}
            </div>
        </div>
    );
}
