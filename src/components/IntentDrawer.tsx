"use client";

// src/components/intent/IntentDrawer.tsx
// IntentDrawer
// - Intent-first sliding drawer (overlay + panel)
// - Controlled/uncontrolled open
// - Positions: left / right / top / bottom
// - Sizes: xs/sm/md/lg/xl (per side) + numeric override
// - Accessible: role="dialog", aria-modal, focus management, ESC close
// - Stable hooks + resolver vars only (no dynamic Tailwind classes)

import * as React from "react";

import { resolveIntent, getIntentLayoutProps, composeIntentClassName } from "CORE";
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

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function useControllableState<T>(opts: { value?: T; defaultValue: T; onChange?: (v: T) => void }) {
    const { value, defaultValue, onChange } = opts;
    const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
    const controlled = value !== undefined;
    const state = controlled ? (value as T) : uncontrolled;

    const setState = React.useCallback(
        (next: T) => {
            if (!controlled) setUncontrolled(next);
            onChange?.(next);
        },
        [controlled, onChange]
    );

    return [state, setState] as const;
}

function firstFocusable(root: HTMLElement | null) {
    if (!root) return null;
    const el = root.querySelector<HTMLElement>(
        [
            "[data-autofocus='true']",
            "button:not([disabled])",
            "a[href]",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            "[tabindex]:not([tabindex='-1'])",
        ].join(",")
    );
    return el;
}

function getDrawerSizePx(position: IntentDrawerPosition, size: IntentDrawerSize): number | null {
    const isHorizontal = position === "left" || position === "right";

    const map = isHorizontal
        ? { xs: 280, sm: 340, md: 420, lg: 520, xl: 640 }
        : { xs: 220, sm: 280, md: 340, lg: 420, xl: 520 };

    return map[size] ?? null;
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentDrawerPosition = "left" | "right" | "top" | "bottom";
export type IntentDrawerSize = "xs" | "sm" | "md" | "lg" | "xl";

export type IntentDrawerProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
        className?: string;

        /** Controlled open (optional) */
        open?: boolean;
        defaultOpen?: boolean;
        onOpenChange?: (open: boolean) => void;

        /** Behavior */
        closeOnOverlay?: boolean;
        closeOnEscape?: boolean;
        lockScroll?: boolean;
        trapFocus?: boolean;
        restoreFocus?: boolean;
        preventClose?: boolean;

        /** Layout */
        position?: IntentDrawerPosition;
        size?: IntentDrawerSize;
        sizePx?: number;
        inset?: boolean;
        overlay?: boolean;
        opaqueBackdrop?: boolean;

        /** Content */
        title?: React.ReactNode;
        description?: React.ReactNode;
        header?: React.ReactNode;
        footer?: React.ReactNode;
        children?: React.ReactNode;

        /** Accessibility */
        ariaLabel?: string;
        initialFocusRef?: React.RefObject<HTMLElement>;
        finalFocusRef?: React.RefObject<HTMLElement>;
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_DRAWER_LOCAL_PROPS_TABLE: DocsPropRow[] = [
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
            fr: "Ouverture par défaut (non-contrôlé).",
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
        name: "position",
        description: { fr: "Côté d’apparition du drawer.", en: "Drawer side/edge." },
        type: `"left" | "right" | "top" | "bottom"`,
        required: false,
        default: "right",
        fromSystem: false,
    },
    {
        name: "size",
        description: { fr: "Taille du panneau (preset).", en: "Panel size preset." },
        type: `"xs" | "sm" | "md" | "lg" | "xl"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "sizePx",
        description: {
            fr: "Override numérique (px) pour la largeur/hauteur du panel.",
            en: "Numeric override (px) for panel width/height.",
        },
        type: "number",
        required: false,
        fromSystem: false,
    },
    {
        name: "overlay",
        description: { fr: "Affiche un overlay cliquable.", en: "Shows a clickable overlay." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "opaqueBackdrop",
        description: {
            fr: "Ajoute un fond opaque uniquement derrière le panneau du drawer, sans couvrir toute la page.",
            en: "Adds an opaque underlay only behind the drawer panel, without covering the whole page.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "closeOnOverlay",
        description: { fr: "Ferme au clic sur l’overlay.", en: "Closes on overlay click." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "closeOnEscape",
        description: { fr: "Ferme via ESC.", en: "Closes on ESC." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "lockScroll",
        description: { fr: "Bloque le scroll du body.", en: "Locks body scroll." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "trapFocus",
        description: { fr: "Piège le focus dans le panel.", en: "Traps focus inside panel." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "restoreFocus",
        description: { fr: "Restaure le focus à la fermeture.", en: "Restores focus on close." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "preventClose",
        description: {
            fr: "Empêche toute fermeture (overlay/ESC/programmatique via interactions).",
            en: "Prevents closing interactions (overlay/ESC).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "inset",
        description: {
            fr: "Panel inset (laisse une marge au bord).",
            en: "Inset panel (leaves padding from edge).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "title",
        description: { fr: "Titre simple (header auto).", en: "Simple title (auto header)." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "description",
        description: {
            fr: "Description simple (header auto).",
            en: "Simple description (auto header).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "header",
        description: { fr: "Header custom (override).", en: "Custom header (override)." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "footer",
        description: { fr: "Footer slot.", en: "Footer slot." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "children",
        description: { fr: "Contenu du drawer.", en: "Drawer content." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "ariaLabel",
        description: { fr: "Label ARIA du dialog.", en: "ARIA label for the dialog." },
        type: "string",
        required: false,
        default: "Drawer",
        fromSystem: false,
    },
    {
        name: "initialFocusRef",
        description: { fr: "Élément à focus à l’ouverture.", en: "Element to focus on open." },
        type: "React.RefObject<HTMLElement>",
        required: false,
        fromSystem: false,
    },
    {
        name: "finalFocusRef",
        description: { fr: "Élément à focus à la fermeture.", en: "Element to focus on close." },
        type: "React.RefObject<HTMLElement>",
        required: false,
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

export const IntentDrawerPropsTable: DocsPropRow[] = [
    ...INTENT_DRAWER_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentDrawerIdentity: ComponentIdentity = {
    name: "IntentDrawer",
    kind: "surface",
    description: {
        fr: "Drawer intent-first (overlay + panneau glissant) avec gestion du focus et fermeture ESC/clic overlay.",
        en: "Intent-first drawer (overlay + sliding panel) with focus management and ESC/overlay close.",
    },
    since: "0.2.0",
    docs: { route: "/playground/components/intent-drawer" },
    anatomy: {
        root: "<div>",
        overlay: ".intent-drawer-overlay",
        panel: ".intent-drawer-panel",
        header: ".intent-drawer-header",
        body: ".intent-drawer-body",
        footer: ".intent-drawer-footer",
        close: ".intent-drawer-close",
    },
    classHooks: [
        "intent-drawer",
        "intent-drawer-overlay",
        "intent-drawer-panel",
        "intent-drawer-header",
        "intent-drawer-body",
        "intent-drawer-footer",
        "is-open",
        "is-disabled",
        "is-inset",
        "has-opaqueBackdrop",
        "pos-left",
        "pos-right",
        "pos-top",
        "pos-bottom",
        "size-xs",
        "size-sm",
        "size-md",
        "size-lg",
        "size-xl",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentDrawer(props: IntentDrawerProps) {
    const {
        className,

        open: openProp,
        defaultOpen = false,
        onOpenChange,

        position = "right",
        size = "md",
        sizePx,
        inset = false,
        opaqueBackdrop = false,
        overlay = true,
        closeOnOverlay = true,
        closeOnEscape = true,
        lockScroll = true,
        trapFocus = true,
        restoreFocus = true,
        preventClose = false,

        title,
        description,
        header,
        footer,
        children,

        ariaLabel = "Drawer",
        initialFocusRef,
        finalFocusRef,

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

    const [open, setOpen] = useControllableState<boolean>({
        ...(openProp !== undefined ? { value: openProp } : {}),
        defaultValue: defaultOpen,
        ...(onOpenChange !== undefined ? { onChange: onOpenChange } : {}),
    });

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
    const layoutProps = getIntentLayoutProps(resolved, className);
    const panelSurfaceClassName = composeIntentClassName(resolved);

    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const lastActiveElement = React.useRef<HTMLElement | null>(null);

    const sizeClass = `size-${size}` as const;
    const posClass = `pos-${position}` as const;

    const panelSizePx =
        typeof sizePx === "number" && Number.isFinite(sizePx) && sizePx > 0
            ? Math.round(sizePx)
            : getDrawerSizePx(position, size);

    const isHorizontal = position === "left" || position === "right";
    const panelStyle: React.CSSProperties =
        panelSizePx != null
            ? isHorizontal
                ? { width: `${panelSizePx}px` }
                : { height: `${panelSizePx}px` }
            : {};

    const canClose = open && !disabled && !preventClose;

    const onClose = React.useCallback(() => {
        if (!canClose) return;
        setOpen(false);
    }, [canClose, setOpen]);

    React.useEffect(() => {
        if (!open || !lockScroll) return;

        const prevOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = "hidden";

        return () => {
            document.documentElement.style.overflow = prevOverflow;
        };
    }, [open, lockScroll]);

    React.useEffect(() => {
        if (!open) return;
        lastActiveElement.current = document.activeElement as HTMLElement | null;
    }, [open]);

    React.useEffect(() => {
        if (!open) return;

        const t = window.setTimeout(() => {
            const target =
                initialFocusRef?.current ?? firstFocusable(panelRef.current) ?? panelRef.current;

            target?.focus?.();
        }, 10);

        return () => window.clearTimeout(t);
    }, [open, initialFocusRef]);

    React.useEffect(() => {
        if (open) return;
        if (!restoreFocus) return;

        const target = finalFocusRef?.current ?? lastActiveElement.current;
        target?.focus?.();
    }, [open, restoreFocus, finalFocusRef]);

    React.useEffect(() => {
        if (!open) return;
        if (!closeOnEscape) return;
        if (!canClose) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            e.preventDefault();
            onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, closeOnEscape, canClose, onClose]);

    React.useEffect(() => {
        if (!open) return;
        if (!trapFocus) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;

            const root = panelRef.current;
            if (!root) return;

            const focusables = Array.from(
                root.querySelectorAll<HTMLElement>(
                    [
                        "button:not([disabled])",
                        "a[href]",
                        "input:not([disabled])",
                        "select:not([disabled])",
                        "textarea:not([disabled])",
                        "[tabindex]:not([tabindex='-1'])",
                    ].join(",")
                )
            ).filter((el) => !el.hasAttribute("data-focus-trap-ignore"));

            if (focusables.length === 0) {
                e.preventDefault();
                root.focus();
                return;
            }

            const first = focusables[0] ?? null;
            const last = focusables[focusables.length - 1] ?? null;
            const active = document.activeElement as HTMLElement | null;

            if (!first || !last) {
                e.preventDefault();
                root.focus();
                return;
            }

            if (e.shiftKey) {
                if (!active || active === first || !root.contains(active)) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (!active || active === last || !root.contains(active)) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, trapFocus]);

    const onOverlayMouseDown = React.useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!overlay) return;
            if (!closeOnOverlay) return;
            if (!canClose) return;
            if (e.target !== e.currentTarget) return;
            onClose();
        },
        [overlay, closeOnOverlay, canClose, onClose]
    );

    const show = Boolean(open);

    return (
        <div
            {...divProps}
            style={layoutProps.style}
            className={cn(
                layoutProps.className,
                "intent-drawer",
                show && "is-open",
                disabled && "is-disabled",
                inset && "is-inset",
                opaqueBackdrop && "has-opaqueBackdrop",
                posClass,
                sizeClass
            )}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
            data-opaque-backdrop={opaqueBackdrop ? "true" : "false"}
            aria-hidden={!show}
        >
            {show ? (
                <div
                    className={cn("intent-drawer-overlay", overlay ? "has-overlay" : "no-overlay")}
                    role="presentation"
                    onMouseDown={onOverlayMouseDown}
                >
                    <div
                        ref={panelRef}
                        className={cn("intent-surface intent-drawer-panel", panelSurfaceClassName)}
                        style={panelStyle}
                        role="dialog"
                        aria-modal="true"
                        aria-label={ariaLabel}
                        tabIndex={-1}
                        data-position={position}
                    >
                        {header ? (
                            <div className="intent-drawer-header">{header}</div>
                        ) : title || description ? (
                            <div className="intent-drawer-header">
                                <div className="intent-drawer-headerMain">
                                    {title ? (
                                        <div className="intent-drawer-title">{title}</div>
                                    ) : null}
                                    {description ? (
                                        <div className="intent-drawer-description">
                                            {description}
                                        </div>
                                    ) : null}
                                </div>

                                <button
                                    type="button"
                                    className="intent-drawer-close"
                                    onClick={onClose}
                                    disabled={!canClose}
                                    aria-label="Close"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div className="intent-drawer-header intent-drawer-header--minimal">
                                <button
                                    type="button"
                                    className="intent-drawer-close"
                                    onClick={onClose}
                                    disabled={!canClose}
                                    aria-label="Close"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        <div className="intent-drawer-body">{children}</div>

                        {footer ? <div className="intent-drawer-footer">{footer}</div> : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
