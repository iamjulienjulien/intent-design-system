"use client";

// src/components/intent/IntentControlDropdown.tsx
// IntentControlDropdown
// - Intent-first Dropdown / ButtonDropdown (actions menu)
// - Trigger can be:
//     1) A custom trigger via renderTrigger(props)  ✅ recommended
//     2) A built-in IntentControlButton trigger      ✅ quick use
// - Popover contains a menu (role="menu") with keyboard navigation
// - Uses resolveIntent() + getIntentLayoutProps() + getIntentControlProps()
// - Supports glow layers (popover only; trigger glow is handled by IntentControlButton)
// - No dynamic Tailwind classes: only stable hooks
//
// ✅ Portal fixes:
// - Anchor positioning uses a stable wrapper ref (triggerInner), not only the trigger element.
// - Two-pass measure (hidden -> positioned) so first open is correct.
// - Portal-safe outside click checks both root and popover.
// - Reposition on resize + scroll (capture=true).

import * as React from "react";
import { createPortal } from "react-dom";

import { resolveIntent, getIntentControlProps, getIntentLayoutProps } from "CORE";
import {
    SYSTEM_PROPS_TABLE,
    type IntentInput,
    type DocsPropRow,
    type ComponentIdentity,
} from "SYSTEM";

import { IntentControlButton, type IntentControlButtonProps } from "./IntentControlButton";

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

type DropdownAlign = "start" | "end";
type DropdownSide = "bottom" | "top";

export type IntentControlDropdownItem = {
    id: string;

    /** Main label (can be rich) */
    label: React.ReactNode;

    /** Optional text used for typeahead (recommended when label is not a string) */
    searchText?: string;

    /** Optional left icon */
    icon?: React.ReactNode;

    /** Optional right meta (shortcut / hint / badge) */
    meta?: React.ReactNode;

    /** Disable selection */
    disabled?: boolean;

    /** Marks as dangerous (styling hook only) */
    dangerous?: boolean;

    /** Optional separator before this item */
    separatorBefore?: boolean;

    /** Called when selected (Enter/click). Receives the item. */
    onSelect?: (item: IntentControlDropdownItem) => void;

    /**
     * Optional link behavior (simple anchor).
     * If provided, item becomes <a role="menuitem">.
     */
    href?: string;
    target?: React.HTMLAttributeAnchorTarget;
    rel?: string;
};

export type IntentControlDropdownTriggerRenderProps = {
    ref: React.RefCallback<HTMLElement>;
    open: boolean;
    disabled: boolean;
    readOnly: boolean;

    "aria-haspopup": "menu";
    "aria-expanded": boolean;
    "aria-controls": string;

    onClick: (e: React.MouseEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
};

export type IntentControlDropdownProps = IntentInput & {
    className?: string;

    /** Menu items */
    items: IntentControlDropdownItem[];

    /** Controlled open */
    open?: boolean;

    /** Uncontrolled initial open */
    defaultOpen?: boolean;

    /** Called on open state changes */
    onOpenChange?: (open: boolean) => void;

    /** Close after selecting an item */
    closeOnSelect?: boolean; // default true

    /** Trigger behavior */
    disabled?: boolean;
    readOnly?: boolean; // focusable, but won’t open/select (like Select)

    /** Layout */
    align?: DropdownAlign; // default "start"
    side?: DropdownSide; // default "bottom"
    offset?: number; // default 8
    matchTriggerWidth?: boolean; // default false
    portal?: boolean; // default false

    /** Optional header/footer inside the menu */
    header?: React.ReactNode;
    footer?: React.ReactNode;
    divider?: boolean; // default true when header/footer exists

    /** Highlights */
    initialHighlightedId?: string | null;

    /** Trigger: either renderTrigger or built-in button trigger */
    renderTrigger?: (props: IntentControlDropdownTriggerRenderProps) => React.ReactNode;

    /** Convenience: built-in IntentControlButton trigger */
    buttonLabel?: React.ReactNode;
    buttonProps?: Omit<IntentControlButtonProps, keyof IntentInput | "children" | "pressed">;

    /** Popover a11y label */
    menuLabel?: string; // default "Menu"
};

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_DROPDOWN_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "items",
        description: {
            fr: "Liste des actions (label, icon, meta, disabled, href, onSelect…).",
            en: "Actions list (label, icon, meta, disabled, href, onSelect…).",
        },
        type: "IntentControlDropdownItem[]",
        required: true,
        fromSystem: false,
    },
    {
        name: "open / defaultOpen / onOpenChange",
        description: {
            fr: "Contrôle de l’état d’ouverture (controlled/uncontrolled).",
            en: "Open state control (controlled/uncontrolled).",
        },
        type: "boolean / boolean / (open:boolean)=>void",
        required: false,
        fromSystem: false,
    },
    {
        name: "closeOnSelect",
        description: {
            fr: "Ferme le menu après sélection.",
            en: "Closes menu after selection.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "disabled",
        description: { fr: "Désactive le dropdown.", en: "Disables the dropdown." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "readOnly",
        description: {
            fr: "Focusable mais n’ouvre pas et ne sélectionne pas (aria-readonly + hook).",
            en: "Focusable but won’t open/select (aria-readonly + hook).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "align / side / offset",
        description: {
            fr: "Positionnement du popover (align start/end, side top/bottom, offset).",
            en: "Popover positioning (align start/end, side top/bottom, offset).",
        },
        type: `"start"|"end" / "bottom"|"top" / number`,
        required: false,
        default: `start / bottom / 8`,
        fromSystem: false,
    },
    {
        name: "matchTriggerWidth",
        description: {
            fr: "Force le popover à matcher la largeur du trigger.",
            en: "Forces popover to match trigger width.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "portal",
        description: {
            fr: "Rend le popover dans un portal (document.body) avec positionnement fixed.",
            en: "Renders the popover in a portal (document.body) with fixed positioning.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "header / footer / divider",
        description: {
            fr: "Slots optionnels dans le menu + séparateurs.",
            en: "Optional menu slots + dividers.",
        },
        type: "React.ReactNode / React.ReactNode / boolean",
        required: false,
        fromSystem: false,
    },
    {
        name: "renderTrigger",
        description: {
            fr: "Trigger custom (recommandé) via render props (ref + handlers + aria).",
            en: "Custom trigger (recommended) via render props (ref + handlers + aria).",
        },
        type: "(props: IntentControlDropdownTriggerRenderProps) => React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "buttonLabel / buttonProps",
        description: {
            fr: "Trigger IntentControlButton prêt à l’emploi (si renderTrigger absent).",
            en: "Built-in IntentControlButton trigger (when renderTrigger not provided).",
        },
        type: "React.ReactNode / IntentControlButtonProps",
        required: false,
        fromSystem: false,
    },
    {
        name: "menuLabel",
        description: { fr: "Label ARIA du menu.", en: "ARIA label for the menu." },
        type: "string",
        required: false,
        default: "Menu",
        fromSystem: false,
    },
    {
        name: "className",
        description: {
            fr: "Classes CSS additionnelles appliquées au root.",
            en: "Additional CSS classes applied to root.",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
];

export const IntentControlDropdownPropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_DROPDOWN_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlDropdownIdentity: ComponentIdentity = {
    name: "IntentControlDropdown",
    kind: "control",
    description: {
        fr: "Dropdown intent-first (menu d’actions en popover) avec trigger custom ou IntentControlButton.",
        en: "Intent-first dropdown (actions menu in popover) with custom trigger or IntentControlButton.",
    },
    since: "0.2.7",
    docs: { route: "/playground/components/intent-control-dropdown" },
    anatomy: {
        root: "<div>",
        trigger: "renderTrigger() or <IntentControlButton>",
        popover: ".intent-control-dropdown-popover",
        menu: "<div role='menu'>",
        item: ".intent-control-dropdown-item",
        separator: ".intent-control-dropdown-separator",
        header: ".intent-control-dropdown-header",
        footer: ".intent-control-dropdown-footer",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
    },
    classHooks: [
        "intent-control",
        "intent-control-dropdown",
        "intent-control-dropdown-trigger",
        "intent-control-dropdown-popover",
        "intent-control-dropdown-menu",
        "intent-control-dropdown-header",
        "intent-control-dropdown-footer",
        "intent-control-dropdown-separator",
        "intent-control-dropdown-item",
        "intent-control-dropdown-item-icon",
        "intent-control-dropdown-item-label",
        "intent-control-dropdown-item-meta",
        "is-open",
        "is-disabled",
        "is-readonly",
        "is-highlighted",
        "is-item-disabled",
        "is-dangerous",
        "ids-popover-align-start",
        "ids-popover-align-end",
        "ids-popover-side-bottom",
        "ids-popover-side-top",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentControlDropdown(props: IntentControlDropdownProps) {
    const {
        className,
        items,

        open: openProp,
        defaultOpen = false,
        onOpenChange,

        closeOnSelect = true,

        disabled: disabledProp = false,
        readOnly = false,

        align = "start",
        side = "bottom",
        offset = 8,
        matchTriggerWidth = false,
        portal = false,

        header,
        footer,
        divider = true,

        initialHighlightedId = null,

        renderTrigger,
        buttonLabel = "Menu",
        buttonProps,

        menuLabel = "Menu",

        // DS props
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,

        ...rest
    } = props as any;

    const disabled = Boolean(disabledProp);

    const isControlled = openProp !== undefined;
    const [openUnc, setOpenUnc] = React.useState<boolean>(defaultOpen);
    const open = isControlled ? Boolean(openProp) : openUnc;

    const setOpen = React.useCallback(
        (next: boolean) => {
            if (!isControlled) setOpenUnc(next);
            onOpenChange?.(next);
        },
        [isControlled, onOpenChange]
    );

    const rootRef = React.useRef<HTMLDivElement | null>(null);

    // 🔑 Two anchors:
    // - triggerRef: only if renderTrigger wires it correctly (custom)
    // - triggerInnerRef: always present (wrapper span around triggerNode)
    const triggerRef = React.useRef<HTMLElement | null>(null);
    const triggerInnerRef = React.useRef<HTMLSpanElement | null>(null);

    const menuRef = React.useRef<HTMLDivElement | null>(null);
    const popoverRef = React.useRef<HTMLDivElement | null>(null);

    const menuId = React.useId();
    const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);

    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const [portalStyle, setPortalStyle] = React.useState<React.CSSProperties | null>(null);
    const [portalReady, setPortalReady] = React.useState(false);

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

    /* ============================================================================
       ✨ Glow layers (popover)
    ============================================================================ */

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

    /* ============================================================================
       🔎 Derived
    ============================================================================ */

    const hasHeader = Boolean(header);
    const hasFooter = Boolean(footer);

    const firstEnabledIndex = React.useCallback(() => {
        for (let i = 0; i < items.length; i++) {
            if (!items[i]?.disabled) return i;
        }
        return -1;
    }, [items]);

    const indexById = React.useCallback(
        (id: string | null) => {
            if (!id) return -1;
            return items.findIndex((it: { id: string }) => it.id === id);
        },
        [items]
    );

    React.useEffect(() => {
        if (!open) return;

        const preferred = indexById(initialHighlightedId);
        if (preferred >= 0 && !items[preferred]?.disabled) {
            setHighlightedIndex(preferred);
        } else {
            setHighlightedIndex(firstEnabledIndex());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    React.useEffect(() => {
        if (readOnly && open) setOpen(false);
    }, [readOnly, open, setOpen]);

    /* ============================================================================
       📍 Portal positioning (fixed)
    ============================================================================ */

    const getAnchorRect = React.useCallback(() => {
        // Prefer custom triggerRef if provided, otherwise fallback to wrapper span
        const anchorEl = (triggerRef.current ?? triggerInnerRef.current) as HTMLElement | null;
        return anchorEl?.getBoundingClientRect?.() ?? null;
    }, []);

    const computePortalPosition = React.useCallback(() => {
        if (!portal) return;

        const tr = getAnchorRect();
        const popEl = popoverRef.current;
        if (!tr || !popEl) return;

        const pr = popEl.getBoundingClientRect();

        const minWidth = matchTriggerWidth ? tr.width : undefined;

        // Horizontal
        let left = tr.left;
        if (align === "end") left = tr.right - pr.width;

        const vw = window.innerWidth;
        left = Math.max(8, Math.min(left, vw - pr.width - 8));

        // Vertical
        let top = tr.bottom + offset;
        if (side === "top") top = tr.top - offset - pr.height;

        setPortalStyle({
            position: "fixed",
            top: Math.round(top),
            left: Math.round(left),
            zIndex: 70,
            minWidth,
        });

        setPortalReady(true);
    }, [portal, align, side, offset, matchTriggerWidth, getAnchorRect]);

    React.useEffect(() => {
        if (!open || !portal) return;

        // 1) first render: hide at (0,0) so we can measure popover size safely
        setPortalReady(false);
        setPortalStyle({
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 70,
            visibility: "hidden",
            pointerEvents: "none",
        });

        // 2) next frames: compute final
        const raf1 = requestAnimationFrame(() => {
            computePortalPosition();
            requestAnimationFrame(computePortalPosition);
        });

        function onReflow() {
            computePortalPosition();
        }

        window.addEventListener("resize", onReflow);
        window.addEventListener("scroll", onReflow, true);

        return () => {
            cancelAnimationFrame(raf1);
            window.removeEventListener("resize", onReflow);
            window.removeEventListener("scroll", onReflow, true);
        };
    }, [open, portal, computePortalPosition]);

    /* ============================================================================
       🖱 Outside click (portal-safe)
    ============================================================================ */

    React.useEffect(() => {
        if (!open) return;

        function onDocDown(e: MouseEvent | TouchEvent) {
            const t = e.target as Node | null;
            if (!t) return;

            if (rootRef.current?.contains(t)) return;
            if (popoverRef.current?.contains(t)) return;

            setOpen(false);
        }

        document.addEventListener("mousedown", onDocDown);
        document.addEventListener("touchstart", onDocDown, { passive: true });

        return () => {
            document.removeEventListener("mousedown", onDocDown);
            document.removeEventListener("touchstart", onDocDown);
        };
    }, [open, setOpen]);

    React.useEffect(() => {
        if (!open) return;
        window.setTimeout(() => menuRef.current?.focus(), 0);
    }, [open]);

    function closeAndReturnFocus() {
        setOpen(false);
        window.setTimeout(() => (triggerRef.current ?? triggerInnerRef.current)?.focus?.(), 0);
    }

    function nextEnabledIndex(from: number, dir: 1 | -1) {
        const len = items.length;
        if (len === 0) return -1;

        let i = from;
        for (let step = 0; step < len; step++) {
            i += dir;
            if (i < 0) i = len - 1;
            if (i >= len) i = 0;

            const it = items[i];
            if (it && !it.disabled) return i;
        }
        return -1;
    }

    function moveHighlight(next: number) {
        const clamped = Math.max(-1, Math.min(next, items.length - 1));
        setHighlightedIndex(clamped);

        const el = menuRef.current?.querySelector<HTMLElement>(`[data-idx="${clamped}"]`);
        el?.scrollIntoView({ block: "nearest" });
    }

    function activateItem(idx: number) {
        const it = items[idx];
        if (!it || it.disabled || disabled || readOnly) return;

        it.onSelect?.(it);
        if (closeOnSelect) closeAndReturnFocus();
    }

    /* ============================================================================
       ⌨️ Keyboard
    ============================================================================ */

    const typeaheadRef = React.useRef<{ buf: string; t: number }>({ buf: "", t: 0 });

    function handleMenuKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Escape") {
            e.preventDefault();
            closeAndReturnFocus();
            return;
        }

        if (e.key === "Tab") {
            setOpen(false);
            return;
        }

        if (disabled || readOnly) return;

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
            moveHighlight(firstEnabledIndex());
            return;
        }

        if (e.key === "End") {
            e.preventDefault();
            moveHighlight(nextEnabledIndex(0, -1));
            return;
        }

        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (highlightedIndex >= 0) activateItem(highlightedIndex);
            return;
        }

        if (isPrintableChar(e)) {
            const now = Date.now();
            const ref = typeaheadRef.current;
            ref.buf = now - ref.t > 650 ? e.key : ref.buf + e.key;
            ref.t = now;

            const q = ref.buf.toLowerCase();
            const start = highlightedIndex >= 0 ? highlightedIndex : -1;

            const itemText = (it: IntentControlDropdownItem) => {
                if (it.searchText) return it.searchText;
                if (typeof it.label === "string") return it.label;
                return it.id;
            };

            for (let step = 0; step < items.length; step++) {
                const idx = (start + 1 + step) % items.length;
                const it = items[idx];
                if (!it || it.disabled) continue;

                if (itemText(it).toLowerCase().startsWith(q)) {
                    moveHighlight(idx);
                    break;
                }
            }
        }
    }

    function handleTriggerKeyDown(e: React.KeyboardEvent) {
        if (disabled || readOnly) return;

        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
        }

        if (e.key === "Escape" && open) {
            e.preventDefault();
            closeAndReturnFocus();
        }
    }

    function handleTriggerClick(e: React.MouseEvent) {
        if (disabled || readOnly) return;
        setOpen(!open);
    }

    /* ============================================================================
       🧱 Class hooks (stable)
    ============================================================================ */

    const rootCls = cn(
        "intent-control intent-control-dropdown",
        className,
        open && "is-open",
        disabled && "is-disabled",
        readOnly && "is-readonly",
        align === "end" ? "ids-popover-align-end" : "ids-popover-align-start",
        side === "top" ? "ids-popover-side-top" : "ids-popover-side-bottom"
    );

    const popoverCls = cn(
        "intent-control-dropdown-popover",
        controlProps.className,
        matchTriggerWidth && "is-match-trigger",
        portal && "is-portal",
        portal && !portalReady && "is-measuring"
    );

    /* ============================================================================
       🎛 Trigger rendering
    ============================================================================ */

    const triggerRenderProps: IntentControlDropdownTriggerRenderProps = {
        ref: (el) => {
            triggerRef.current = el as any;
        },
        open,
        disabled,
        readOnly,

        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": menuId,

        onClick: handleTriggerClick,
        onKeyDown: handleTriggerKeyDown,
    };

    const triggerNode = renderTrigger ? (
        renderTrigger(triggerRenderProps)
    ) : (
        <IntentControlButton
            {...(buttonProps as any)}
            intent={intent as any}
            variant={variant as any}
            tone={tone as any}
            glow={glow as any}
            intensity={intensity as any}
            mode={mode as any}
            disabled={disabled}
            pressed={open}
            rightIcon={buttonProps?.rightIcon ?? <span aria-hidden>▾</span>}
            onClick={(e: any) => {
                buttonProps?.onClick?.(e);
                if (e.defaultPrevented) return;
                handleTriggerClick(e);
            }}
            onKeyDown={(e: any) => {
                buttonProps?.onKeyDown?.(e);
                if (e.defaultPrevented) return;
                handleTriggerKeyDown(e);
            }}
        >
            {buttonLabel}
        </IntentControlButton>
    );

    /* ============================================================================
       🧩 Base styles
    ============================================================================ */

    const popoverStyle: React.CSSProperties = {
        ["--ids-popover-offset" as any]: `${offset}px`,
    };

    const popoverNode = open ? (
        <div
            ref={popoverRef}
            // {...layoutProps}
            className={popoverCls}
            style={
                portal
                    ? { ...popoverStyle, ...(portalStyle ?? {}), ...layoutProps.style }
                    : popoverStyle
            }
            aria-hidden={disabled || undefined}
        >
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

            <div
                ref={menuRef}
                role="menu"
                aria-label={menuLabel}
                id={menuId}
                tabIndex={0}
                className="intent-control-dropdown-menu"
                onKeyDown={handleMenuKeyDown}
            >
                {hasHeader ? (
                    <>
                        <div className="intent-control-dropdown-header">{header}</div>
                        {divider ? <div className="intent-control-dropdown-separator" /> : null}
                    </>
                ) : null}

                <div className="intent-control-dropdown-items">
                    {items.map(
                        (
                            it: {
                                disabled: any;
                                dangerous: any;
                                id: React.Key | null | undefined;
                                separatorBefore: any;
                                href: string | URL | undefined;
                                target: string | (string & {}) | undefined;
                                rel: string | undefined;
                                onSelect: (arg0: any) => void;
                                icon:
                                    | string
                                    | number
                                    | bigint
                                    | boolean
                                    | React.ReactElement<
                                          unknown,
                                          string | React.JSXElementConstructor<any>
                                      >
                                    | Iterable<React.ReactNode>
                                    | Promise<
                                          | string
                                          | number
                                          | bigint
                                          | boolean
                                          | React.ReactPortal
                                          | React.ReactElement<
                                                unknown,
                                                string | React.JSXElementConstructor<any>
                                            >
                                          | Iterable<React.ReactNode>
                                          | null
                                          | undefined
                                      >
                                    | null
                                    | undefined;
                                label:
                                    | string
                                    | number
                                    | bigint
                                    | boolean
                                    | React.ReactElement<
                                          unknown,
                                          string | React.JSXElementConstructor<any>
                                      >
                                    | Iterable<React.ReactNode>
                                    | Promise<
                                          | string
                                          | number
                                          | bigint
                                          | boolean
                                          | React.ReactPortal
                                          | React.ReactElement<
                                                unknown,
                                                string | React.JSXElementConstructor<any>
                                            >
                                          | Iterable<React.ReactNode>
                                          | null
                                          | undefined
                                      >
                                    | null
                                    | undefined;
                                meta:
                                    | string
                                    | number
                                    | bigint
                                    | boolean
                                    | React.ReactElement<
                                          unknown,
                                          string | React.JSXElementConstructor<any>
                                      >
                                    | Iterable<React.ReactNode>
                                    | Promise<
                                          | string
                                          | number
                                          | bigint
                                          | boolean
                                          | React.ReactPortal
                                          | React.ReactElement<
                                                unknown,
                                                string | React.JSXElementConstructor<any>
                                            >
                                          | Iterable<React.ReactNode>
                                          | null
                                          | undefined
                                      >
                                    | null
                                    | undefined;
                            },
                            idx: React.SetStateAction<number>
                        ) => {
                            const highlighted = idx === highlightedIndex;

                            const itemCls = cn(
                                "intent-control-dropdown-item",
                                highlighted && "is-highlighted",
                                it.disabled && "is-item-disabled",
                                it.dangerous && "is-dangerous"
                            );

                            const commonProps = {
                                role: "menuitem" as const,
                                tabIndex: -1,
                                "data-idx": idx,
                                "aria-disabled": it.disabled || undefined,
                                className: itemCls,
                                onMouseEnter: () => setHighlightedIndex(idx),
                            };

                            return (
                                <React.Fragment key={it.id}>
                                    {it.separatorBefore ? (
                                        <div className="intent-control-dropdown-separator" />
                                    ) : null}

                                    {it.href ? (
                                        <a
                                            {...(commonProps as any)}
                                            href={it.href}
                                            target={it.target}
                                            rel={it.rel}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (disabled || readOnly || it.disabled) return;

                                                it.onSelect?.(it);
                                                if (closeOnSelect) closeAndReturnFocus();
                                                window.location.assign(it.href!);
                                            }}
                                        >
                                            {it.icon ? (
                                                <span className="intent-control-dropdown-item-icon">
                                                    {it.icon}
                                                </span>
                                            ) : (
                                                <span className="intent-control-dropdown-item-icon is-empty" />
                                            )}

                                            <span className="intent-control-dropdown-item-label">
                                                {it.label}
                                            </span>

                                            {it.meta ? (
                                                <span className="intent-control-dropdown-item-meta">
                                                    {it.meta}
                                                </span>
                                            ) : null}
                                        </a>
                                    ) : (
                                        <button
                                            {...(commonProps as any)}
                                            type="button"
                                            disabled={Boolean(it.disabled)}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (disabled || readOnly || it.disabled) return;

                                                it.onSelect?.(it);
                                                if (closeOnSelect) closeAndReturnFocus();
                                            }}
                                        >
                                            {it.icon ? (
                                                <span className="intent-control-dropdown-item-icon">
                                                    {it.icon}
                                                </span>
                                            ) : (
                                                <span className="intent-control-dropdown-item-icon is-empty" />
                                            )}

                                            <span className="intent-control-dropdown-item-label">
                                                {it.label}
                                            </span>

                                            {it.meta ? (
                                                <span className="intent-control-dropdown-item-meta">
                                                    {it.meta}
                                                </span>
                                            ) : null}
                                        </button>
                                    )}
                                </React.Fragment>
                            );
                        }
                    )}
                </div>

                {hasFooter ? (
                    <>
                        {divider ? <div className="intent-control-dropdown-separator" /> : null}
                        <div className="intent-control-dropdown-footer">{footer}</div>
                    </>
                ) : null}
            </div>
        </div>
    ) : null;

    // console.log("layoutProps", layoutProps);
    // console.log("controlProps", controlProps);

    return (
        <div
            ref={rootRef}
            {...layoutProps}
            className={cn(layoutProps.className, rootCls)}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            <div className="intent-control-dropdown-trigger">
                {/* ✅ Stable anchor used for portal positioning */}
                <span ref={triggerInnerRef} className="intent-control-dropdown-triggerInner">
                    {triggerNode}
                </span>
            </div>

            {portal
                ? mounted
                    ? popoverNode
                        ? createPortal(popoverNode, document.body)
                        : null
                    : null
                : popoverNode}
        </div>
    );
}
