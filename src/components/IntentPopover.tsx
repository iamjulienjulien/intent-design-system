"use client";

// src/components/intent/IntentPopover.tsx
// IntentPopover
// - Intent-first popover/tooltip surface (portal + positioned panel)
// - Content can be text or JSX
// - Controlled/uncontrolled open
// - Triggers: hover | click | manual
// - Positions: top/bottom/left/right + align start/center/end
// - Accessible: role tooltip/dialog, ESC close, outside click close, focus-friendly
// - Stable hooks + resolver vars only (no dynamic Tailwind classes)

import * as React from "react";
import { createPortal } from "react-dom";

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

function useEvent<T extends (...args: any[]) => any>(fn: T) {
    const ref = React.useRef(fn);
    ref.current = fn;
    return React.useCallback((...args: Parameters<T>) => ref.current(...args), []);
}

function safeId(prefix = "intent-popover") {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

type Rect = {
    left: number;
    top: number;
    width: number;
    height: number;
    right: number;
    bottom: number;
};

function rectOf(el: Element | null): Rect | null {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
        right: r.right,
        bottom: r.bottom,
    };
}

function resolveAlignX(
    align: IntentPopoverAlign,
    anchor: Rect,
    panelW: number
): { x: number; anchorX: number } {
    if (align === "start") return { x: anchor.left, anchorX: anchor.left };
    if (align === "end") return { x: anchor.right - panelW, anchorX: anchor.right };
    const center = anchor.left + anchor.width / 2;
    return { x: center - panelW / 2, anchorX: center };
}

function resolveAlignY(
    align: IntentPopoverAlign,
    anchor: Rect,
    panelH: number
): { y: number; anchorY: number } {
    if (align === "start") return { y: anchor.top, anchorY: anchor.top };
    if (align === "end") return { y: anchor.bottom - panelH, anchorY: anchor.bottom };
    const center = anchor.top + anchor.height / 2;
    return { y: center - panelH / 2, anchorY: center };
}

function isInteractiveElement(el: Element | null) {
    if (!el) return false;
    const tag = (el as HTMLElement).tagName?.toLowerCase?.() ?? "";
    return (
        tag === "button" ||
        tag === "a" ||
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        (el as HTMLElement).isContentEditable
    );
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentPopoverTrigger = "hover" | "click" | "manual";
export type IntentPopoverSide = "top" | "bottom" | "left" | "right";
export type IntentPopoverAlign = "start" | "center" | "end";

export type IntentPopoverProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLSpanElement>, "className" | "children" | "content"> & {
        className?: string;

        /** Trigger element (rendered in place) */
        trigger: React.ReactElement;

        /** Content */
        content?: React.ReactNode;
        text?: string; // sugar for simple tooltip text
        header?: React.ReactNode; // optional header area
        footer?: React.ReactNode; // optional footer area

        /** Controlled open (optional) */
        open?: boolean;
        defaultOpen?: boolean;
        onOpenChange?: (open: boolean) => void;

        /** Behavior */
        triggerMode?: IntentPopoverTrigger; // default "hover"
        interactive?: boolean; // default false (if true, keeps open when hovering panel)
        closeOnEscape?: boolean; // default true
        closeOnOutsideClick?: boolean; // default true
        closeOnScroll?: boolean; // default false (useful for tooltips)
        openDelayMs?: number; // default 120
        closeDelayMs?: number; // default 80

        /** Position */
        side?: IntentPopoverSide; // default "top"
        align?: IntentPopoverAlign; // default "center"
        offset?: number; // default 10
        collisionPadding?: number; // default 12
        maxWidth?: number; // default 320

        /** Visuals */
        showArrow?: boolean; // default true
        arrowSize?: number; // default 10

        /** Portal */
        portal?: boolean; // default true
        portalRoot?: Element | null;

        /** Accessibility */
        ariaLabel?: string; // used when content is not text and role=tooltip
        role?: "tooltip" | "dialog"; // default: tooltip (unless interactive => dialog)
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_POPOVER_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "trigger",
        description: {
            fr: "Élément déclencheur (ReactElement).",
            en: "Trigger element (ReactElement).",
        },
        type: "React.ReactElement",
        required: true,
        fromSystem: false,
    },
    {
        name: "content",
        description: { fr: "Contenu JSX du popover.", en: "Popover JSX content." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "text",
        description: { fr: "Texte simple (tooltip).", en: "Simple text (tooltip)." },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "header / footer",
        description: { fr: "Slots header/footer.", en: "Header/footer slots." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "open / defaultOpen / onOpenChange",
        description: {
            fr: "Ouverture contrôlée / non-contrôlée.",
            en: "Controlled/uncontrolled open.",
        },
        type: "boolean",
        required: false,
        default: "defaultOpen=false",
        fromSystem: false,
    },
    {
        name: "triggerMode",
        description: { fr: "Mode d’ouverture.", en: "Open trigger mode." },
        type: `"hover" | "click" | "manual"`,
        required: false,
        default: "hover",
        fromSystem: false,
    },
    {
        name: "interactive",
        description: {
            fr: "Si true, le popover reste ouvert quand on survole le panneau (utile avec boutons/liens).",
            en: "If true, keeps open while hovering the panel (useful for interactive content).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "side / align",
        description: { fr: "Placement du panneau.", en: "Panel placement." },
        type: `"top" | "bottom" | "left" | "right" / "start" | "center" | "end"`,
        required: false,
        default: "top / center",
        fromSystem: false,
    },
    {
        name: "offset",
        description: {
            fr: "Distance (px) entre trigger et panneau.",
            en: "Gap (px) between trigger and panel.",
        },
        type: "number",
        required: false,
        default: "10",
        fromSystem: false,
    },
    {
        name: "collisionPadding",
        description: {
            fr: "Padding (px) pour éviter les bords viewport.",
            en: "Viewport collision padding (px).",
        },
        type: "number",
        required: false,
        default: "12",
        fromSystem: false,
    },
    {
        name: "maxWidth",
        description: { fr: "Largeur max du panneau (px).", en: "Panel max width (px)." },
        type: "number",
        required: false,
        default: "320",
        fromSystem: false,
    },
    {
        name: "showArrow / arrowSize",
        description: { fr: "Affiche la flèche.", en: "Shows the arrow." },
        type: "boolean / number",
        required: false,
        default: "true / 10",
        fromSystem: false,
    },
    {
        name: "closeOnEscape / closeOnOutsideClick",
        description: {
            fr: "Fermeture via ESC / clic extérieur.",
            en: "Close on ESC / outside click.",
        },
        type: "boolean",
        required: false,
        default: "true / true",
        fromSystem: false,
    },
    {
        name: "closeOnScroll",
        description: {
            fr: "Ferme lors d’un scroll (optionnel).",
            en: "Close on scroll (optional).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "openDelayMs / closeDelayMs",
        description: { fr: "Delays hover (ms).", en: "Hover delays (ms)." },
        type: "number",
        required: false,
        default: "120 / 80",
        fromSystem: false,
    },
    {
        name: "portal / portalRoot",
        description: { fr: "Rendu en portal.", en: "Portal rendering." },
        type: "boolean / Element",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "role / ariaLabel",
        description: { fr: "Accessibilité.", en: "Accessibility." },
        type: `"tooltip" | "dialog" / string`,
        required: false,
        default: "tooltip",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: { fr: "Props natives sur le wrapper.", en: "Native props on wrapper." },
        type: "Omit<React.HTMLAttributes<HTMLSpanElement>, 'className' | 'children'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentPopoverPropsTable: DocsPropRow[] = [
    ...INTENT_POPOVER_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentPopoverIdentity: ComponentIdentity = {
    name: "IntentPopover",
    emoji: "🫧",
    kind: "surface",
    description: {
        fr: "Popover/tooltip intent-first (surface) avec portal et positionnement.",
        en: "Intent-first popover/tooltip (surface) with portal and positioning.",
    },
    since: "0.2.11",
    docs: { route: "/playground/components/intent-popover" },
    anatomy: {
        root: "<span>",
        trigger: ".intent-popover-trigger",
        portal: ".intent-popover-portal",
        panel: ".intent-popover-panel",
        arrow: ".intent-popover-arrow",
        header: ".intent-popover-header",
        body: ".intent-popover-body",
        footer: ".intent-popover-footer",
    },
    classHooks: [
        "intent-popover",
        "intent-popover-trigger",
        "intent-popover-portal",
        "intent-popover-panel",
        "intent-popover-arrow",
        "intent-popover-header",
        "intent-popover-body",
        "intent-popover-footer",
        "is-open",
        "is-disabled",
        "mode-hover",
        "mode-click",
        "side-top",
        "side-bottom",
        "side-left",
        "side-right",
        "align-start",
        "align-center",
        "align-end",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentPopover(props: IntentPopoverProps) {
    const {
        className,
        trigger,

        content,
        text,
        header,
        footer,

        open: openProp,
        defaultOpen = false,
        onOpenChange,

        triggerMode = "hover",
        interactive = false,
        closeOnEscape = true,
        closeOnOutsideClick = true,
        closeOnScroll = false,
        openDelayMs = 120,
        closeDelayMs = 80,

        side = "top",
        align = "center",
        offset = 10,
        collisionPadding = 12,
        maxWidth = 320,

        showArrow = true,
        arrowSize = 10,

        portal = true,
        portalRoot = null,

        ariaLabel,
        role: roleProp,

        // DS props (removed from DOM)
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: dsDisabled,

        ...spanProps
    } = props;

    const disabled = Boolean(dsDisabled);

    const [open, setOpen] = useControllableState<boolean>({
        ...(openProp !== undefined ? { value: openProp } : {}),
        defaultValue: defaultOpen,
        ...(onOpenChange ? { onChange: onOpenChange } : {}),
    });

    const canOpen = !disabled && (triggerMode !== "manual" || openProp !== undefined || open);

    const setOpenSafe = React.useCallback(
        (next: boolean) => {
            if (disabled) return;
            setOpen(next);
        },
        [disabled, setOpen]
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

    // Wrapper (vars only)
    const layoutProps = getIntentLayoutProps(resolved, className);

    // Panel surface recipe using vars
    const panelSurfaceClassName = composeIntentClassName(resolved);

    const triggerRef = React.useRef<HTMLElement | null>(null);
    const panelRef = React.useRef<HTMLDivElement | null>(null);

    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const popoverId = React.useMemo(() => safeId("intent-popover"), []);
    const role = roleProp ?? (interactive ? "dialog" : "tooltip");

    const body = content ?? (text ? <span>{text}</span> : null);
    const hasContent = Boolean(body || header || footer);

    // Delayed open/close timers (hover)
    const openTimer = React.useRef<number | null>(null);
    const closeTimer = React.useRef<number | null>(null);

    const clearTimers = React.useCallback(() => {
        if (openTimer.current) window.clearTimeout(openTimer.current);
        if (closeTimer.current) window.clearTimeout(closeTimer.current);
        openTimer.current = null;
        closeTimer.current = null;
    }, []);

    React.useEffect(() => () => clearTimers(), [clearTimers]);

    const scheduleOpen = React.useCallback(() => {
        if (!canOpen) return;
        clearTimers();
        openTimer.current = window.setTimeout(() => setOpenSafe(true), Math.max(0, openDelayMs));
    }, [canOpen, clearTimers, openDelayMs, setOpenSafe]);

    const scheduleClose = React.useCallback(() => {
        clearTimers();
        closeTimer.current = window.setTimeout(() => setOpenSafe(false), Math.max(0, closeDelayMs));
    }, [clearTimers, closeDelayMs, setOpenSafe]);

    const openNow = React.useCallback(() => {
        if (!canOpen) return;
        clearTimers();
        setOpenSafe(true);
    }, [canOpen, clearTimers, setOpenSafe]);

    const closeNow = React.useCallback(() => {
        clearTimers();
        setOpenSafe(false);
    }, [clearTimers, setOpenSafe]);

    // Positioning
    const [pos, setPos] = React.useState<{
        x: number;
        y: number;
        side: IntentPopoverSide;
        arrowX: number;
        arrowY: number;
        arrowRot: number;
    } | null>(null);

    const computePosition = useEvent(() => {
        const anchor = rectOf(triggerRef.current);
        const panelEl = panelRef.current;

        if (!anchor || !panelEl) return;

        // Measure panel (ensure maxWidth applied before measuring)
        const panelRect = panelEl.getBoundingClientRect();
        const panelW = panelRect.width || 1;
        const panelH = panelRect.height || 1;

        const vw = window.innerWidth || 1;
        const vh = window.innerHeight || 1;

        const pad = Math.max(0, collisionPadding);
        const gap = Math.max(0, offset);

        // Candidate placements
        const place = (s: IntentPopoverSide) => {
            let x = 0;
            let y = 0;
            let anchorX = 0;
            let anchorY = 0;

            if (s === "top" || s === "bottom") {
                const ax = resolveAlignX(align, anchor, panelW);
                x = ax.x;
                anchorX = ax.anchorX;

                y = s === "top" ? anchor.top - panelH - gap : anchor.bottom + gap;
                anchorY = s === "top" ? anchor.top : anchor.bottom;
            } else {
                const ay = resolveAlignY(align, anchor, panelH);
                y = ay.y;
                anchorY = ay.anchorY;

                x = s === "left" ? anchor.left - panelW - gap : anchor.right + gap;
                anchorX = s === "left" ? anchor.left : anchor.right;
            }

            // Clamp inside viewport (simple collision handling)
            const clampedX = clamp(x, pad, Math.max(pad, vw - pad - panelW));
            const clampedY = clamp(y, pad, Math.max(pad, vh - pad - panelH));

            // Arrow position relative to panel
            const axLocal = clamp(anchorX - clampedX, arrowSize + 6, panelW - arrowSize - 6);
            const ayLocal = clamp(anchorY - clampedY, arrowSize + 6, panelH - arrowSize - 6);

            // Arrow sits on the edge facing the anchor
            let arrowX = 0;
            let arrowY = 0;
            let arrowRot = 0;

            if (s === "top") {
                arrowX = axLocal;
                arrowY = panelH; // bottom edge
                arrowRot = 45;
            } else if (s === "bottom") {
                arrowX = axLocal;
                arrowY = 0; // top edge
                arrowRot = 45;
            } else if (s === "left") {
                arrowX = panelW;
                arrowY = ayLocal;
                arrowRot = 45;
            } else {
                arrowX = 0;
                arrowY = ayLocal;
                arrowRot = -45;
            }

            // Score: how far from ideal (less clamping = better)
            const score = Math.abs(clampedX - x) + Math.abs(clampedY - y);

            return { x: clampedX, y: clampedY, side: s, arrowX, arrowY, arrowRot, score };
        };

        const preferred = place(side);

        // Flip if heavily constrained
        const opposite: Record<IntentPopoverSide, IntentPopoverSide> = {
            top: "bottom",
            bottom: "top",
            left: "right",
            right: "left",
        };

        const flipped = place(opposite[side]);

        const best = flipped.score + 0.5 < preferred.score ? flipped : preferred;

        setPos({
            x: best.x,
            y: best.y,
            side: best.side,
            arrowX: best.arrowX,
            arrowY: best.arrowY,
            arrowRot: best.arrowRot,
        });
    });

    // Recompute position when opened, resized, scrolled, or content changes
    React.useLayoutEffect(() => {
        if (!open) return;
        if (!mounted) return;
        computePosition();
    }, [
        open,
        mounted,
        computePosition,
        text,
        content,
        header,
        footer,
        side,
        align,
        offset,
        collisionPadding,
        maxWidth,
        showArrow,
        arrowSize,
    ]);

    React.useEffect(() => {
        if (!open) return;

        const onResize = () => computePosition();
        const onScroll = () => {
            if (closeOnScroll) {
                closeNow();
                return;
            }
            computePosition();
        };

        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", onScroll, true);

        return () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("scroll", onScroll, true);
        };
    }, [open, computePosition, closeOnScroll, closeNow]);

    // Outside click + Escape
    React.useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (!closeOnEscape) return;
            if (e.key !== "Escape") return;
            e.preventDefault();
            closeNow();
        };

        const onPointerDown = (e: PointerEvent) => {
            if (!closeOnOutsideClick) return;
            const t = e.target as Element | null;

            const trig = triggerRef.current;
            const panel = panelRef.current;

            if (trig && t && trig.contains(t)) return;
            if (panel && t && panel.contains(t)) return;

            closeNow();
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("pointerdown", onPointerDown);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("pointerdown", onPointerDown);
        };
    }, [open, closeOnEscape, closeOnOutsideClick, closeNow]);

    // Hover interactions on panel (interactive mode)
    const onPanelEnter = React.useCallback(() => {
        if (!interactive) return;
        if (triggerMode !== "hover") return;
        openNow();
    }, [interactive, triggerMode, openNow]);

    const onPanelLeave = React.useCallback(() => {
        if (!interactive) return;
        if (triggerMode !== "hover") return;
        scheduleClose();
    }, [interactive, triggerMode, scheduleClose]);

    // Trigger handlers
    const onTriggerMouseEnter = React.useCallback(() => {
        if (triggerMode !== "hover") return;
        scheduleOpen();
    }, [triggerMode, scheduleOpen]);

    const onTriggerMouseLeave = React.useCallback(() => {
        if (triggerMode !== "hover") return;
        scheduleClose();
    }, [triggerMode, scheduleClose]);

    const onTriggerFocus = React.useCallback(() => {
        if (triggerMode !== "hover") return;
        scheduleOpen();
    }, [triggerMode, scheduleOpen]);

    const onTriggerBlur = React.useCallback(
        (e: React.FocusEvent) => {
            if (triggerMode !== "hover") return;

            if (!interactive) {
                scheduleClose();
                return;
            }

            // If focus goes into panel, keep open
            const next = e.relatedTarget as Element | null;
            if (panelRef.current && next && panelRef.current.contains(next)) return;

            scheduleClose();
        },
        [triggerMode, interactive, scheduleClose]
    );

    const onTriggerClick = React.useCallback(
        (e: React.MouseEvent) => {
            if (triggerMode !== "click") return;

            // Respect default behaviors (e.g. links) unless explicitly interactive.
            if (!interactive && isInteractiveElement(e.currentTarget as Element)) {
                // If it’s a link/button and not interactive, do not block.
            }

            e.preventDefault();
            e.stopPropagation();

            if (!hasContent) return;
            setOpenSafe(!open);
        },
        [triggerMode, interactive, hasContent, open, setOpenSafe]
    );

    // aria-describedby for tooltip semantics
    const describedBy = role === "tooltip" && (text || ariaLabel) ? popoverId : undefined;

    const triggerEl = React.cloneElement<any>(trigger, {
        ref: (node: HTMLElement | null) => {
            triggerRef.current = node;

            // Keep original ref intact if present
            const r: any = (trigger as any).ref;
            if (typeof r === "function") r(node);
            else if (r && typeof r === "object") r.current = node;
        },
        className: cn("intent-popover-trigger", (trigger.props as any)?.className),
        "data-popover-open": open ? "true" : "false",
        "aria-expanded": role === "dialog" ? (open ? "true" : "false") : undefined,
        "aria-controls": role === "dialog" ? popoverId : undefined,
        "aria-describedby": describedBy,
        onMouseEnter: (e: React.MouseEvent) => {
            (trigger.props as any)?.onMouseEnter?.(e);
            if (disabled) return;
            onTriggerMouseEnter();
        },
        onMouseLeave: (e: React.MouseEvent) => {
            (trigger.props as any)?.onMouseLeave?.(e);
            if (disabled) return;
            onTriggerMouseLeave();
        },
        onFocus: (e: React.FocusEvent) => {
            (trigger.props as any)?.onFocus?.(e);
            if (disabled) return;
            onTriggerFocus();
        },
        onBlur: (e: React.FocusEvent) => {
            (trigger.props as any)?.onBlur?.(e);
            if (disabled) return;
            onTriggerBlur(e);
        },
        onClick: (e: React.MouseEvent) => {
            (trigger.props as any)?.onClick?.(e);
            if (disabled) return;
            onTriggerClick(e);
        },
    });

    const show = Boolean(open && hasContent);

    const modeClass =
        triggerMode === "hover"
            ? "mode-hover"
            : triggerMode === "click"
              ? "mode-click"
              : "mode-manual";
    const sideClass = `side-${pos?.side ?? side}` as const;
    const alignClass = `align-${align}` as const;

    const panel =
        show && mounted ? (
            <div className="intent-popover-portal" data-state={show ? "open" : "closed"}>
                <div
                    ref={panelRef}
                    id={popoverId}
                    className={cn(
                        layoutProps.className,
                        "intent-popover-panel intent-surface",
                        panelSurfaceClassName,
                        role === "dialog" && "is-dialog"
                    )}
                    role={role}
                    aria-label={
                        role === "tooltip"
                            ? ariaLabel || (typeof text === "string" ? text : "Tooltip")
                            : undefined
                    }
                    aria-modal={role === "dialog" ? "false" : undefined}
                    data-side={pos?.side ?? side}
                    style={{
                        maxWidth: `${Math.max(160, Math.round(maxWidth))}px`,
                        left: pos ? `${Math.round(pos.x)}px` : "-9999px",
                        top: pos ? `${Math.round(pos.y)}px` : "-9999px",
                        ...layoutProps.style,
                    }}
                    onMouseEnter={onPanelEnter}
                    onMouseLeave={onPanelLeave}
                    tabIndex={interactive ? -1 : undefined}
                >
                    {showArrow && pos ? (
                        <div
                            className="intent-popover-arrow"
                            aria-hidden="true"
                            style={{
                                width: `${Math.max(6, Math.round(arrowSize))}px`,
                                height: `${Math.max(6, Math.round(arrowSize))}px`,
                                left: `${Math.round(pos.arrowX)}px`,
                                top: `${Math.round(pos.arrowY)}px`,
                                transform: `translate(-50%, -50%) rotate(${pos.arrowRot}deg)`,
                            }}
                        />
                    ) : null}

                    {header ? <div className="intent-popover-header">{header}</div> : null}

                    <div className="intent-popover-body">
                        {typeof text === "string" && !content ? <span>{text}</span> : body}
                    </div>

                    {footer ? <div className="intent-popover-footer">{footer}</div> : null}
                </div>
            </div>
        ) : null;

    const portalTarget = portalRoot ?? (typeof document !== "undefined" ? document.body : null);

    return (
        <span
            {...spanProps}
            style={layoutProps.style}
            className={cn(
                layoutProps.className,
                "intent-popover",
                show && "is-open",
                disabled && "is-disabled",
                modeClass,
                sideClass,
                alignClass,
                className
            )}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            {triggerEl}
            {portal && portalTarget ? createPortal(panel, portalTarget) : panel}
        </span>
    );
}

/* ============================================================================
   ✨ Notes CSS hooks (for your stylesheet)
============================================================================
.intent-popover { }
.intent-popover-trigger { }
.intent-popover-portal { }
.intent-popover-panel { }
.intent-popover-arrow { }
.intent-popover-header { }
.intent-popover-body { }
.intent-popover-footer { }
*/
