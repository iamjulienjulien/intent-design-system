"use client";

// src/components/intent/IntentDialog.tsx
// IntentDialog
// - Intent-first modal dialog (overlay + centered panel)
// - Controlled/uncontrolled open
// - Sizes: xs/sm/md/lg/xl + maxWidthPx override
// - Accessible: role="dialog", aria-modal, aria-labelledby/aria-describedby
// - Focus: initial focus, trap focus, restore focus
// - Close: overlay, ESC, close button, preventClose
// - Scroll lock (optional)
// - Glow layers on panel (intent-glow-layer)
// - Stable hooks + resolver vars only (no dynamic Tailwind classes)

import * as React from "react";

import {
    resolveIntent,
    getIntentLayoutProps,
    getIntentSurfaceProps,
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

function focusables(root: HTMLElement | null): HTMLElement[] {
    if (!root) return [];
    return Array.from(
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
    ).filter((el) => !el.hasAttribute("data-focus-trap-ignore") && !el.getAttribute("aria-hidden"));
}

// function stableId(prefix: string) {
//     // React 18 useId is stable per tree. This helper just keeps ids readable.
//     const rid = React.useId().replace(/:/g, "");
//     return `${prefix}-${rid}`;
// }

export type IntentDialogSize = "xs" | "sm" | "md" | "lg" | "xl";

function sizeToMaxWidthPx(size: IntentDialogSize): number {
    const map: Record<IntentDialogSize, number> = {
        xs: 360,
        sm: 440,
        md: 560,
        lg: 720,
        xl: 900,
    };
    return map[size] ?? 560;
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentDialogProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children" | "title"> & {
        className?: string;

        /** Controlled open (optional) */
        open?: boolean;
        defaultOpen?: boolean;
        onOpenChange?: (open: boolean) => void;

        /** Behavior */
        overlay?: boolean; // default true
        closeOnOverlay?: boolean; // default true
        closeOnEscape?: boolean; // default true
        lockScroll?: boolean; // default true
        trapFocus?: boolean; // default true
        restoreFocus?: boolean; // default true
        preventClose?: boolean; // default false (disables overlay/ESC/close button interactions)

        /** Layout */
        size?: IntentDialogSize; // default "md"
        maxWidthPx?: number; // overrides size map
        centerY?: boolean; // default true (center vertically). false = top-ish with margin
        padded?: boolean; // default true (panel padding)
        scrollBehavior?: "inside" | "body"; // default "inside" (body scrolls inside panel)

        /** Backdrop */
        opaqueBackdrop?: boolean; // default false (adds a solid underlay behind panel for true modal separation)
        backdropOpacity?: number; // default 0.55 (applies to overlay only)

        /** Content */
        title?: React.ReactNode; // auto header title
        description?: React.ReactNode; // auto header description
        header?: React.ReactNode; // custom header override
        footer?: React.ReactNode; // footer slot
        children?: React.ReactNode;

        /** Controls */
        showClose?: boolean; // default true
        closeButton?: React.ReactNode; // override close button content (icon)
        closeButtonAriaLabel?: string; // default "Close"

        /** Accessibility */
        ariaLabel?: string; // fallback label when no title
        ariaLabelledby?: string; // override ids
        ariaDescribedby?: string; // override ids
        initialFocusRef?: React.RefObject<HTMLElement>;
        finalFocusRef?: React.RefObject<HTMLElement>;

        /**
         * Called when user tries to close via overlay/ESC/close button
         * (useful to show confirm logic). Return false to block.
         */
        onBeforeClose?: (reason: "overlay" | "escape" | "closeButton" | "api") => boolean | void;

        /**
         * Click outside callback (still respects preventClose/closeOnOverlay).
         */
        onInteractOutside?: (e: MouseEvent | React.MouseEvent) => void;
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_DIALOG_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "open / defaultOpen / onOpenChange",
        description: {
            fr: "Contrôle l’ouverture (controlled/uncontrolled).",
            en: "Controls open state (controlled/uncontrolled).",
        },
        type: "boolean / boolean / (open:boolean)=>void",
        required: false,
        default: "defaultOpen=false",
        fromSystem: false,
    },
    {
        name: "overlay / closeOnOverlay / closeOnEscape",
        description: {
            fr: "Overlay + fermeture via clic overlay / ESC.",
            en: "Overlay + close via overlay click / ESC.",
        },
        type: "boolean / boolean / boolean",
        required: false,
        default: "true / true / true",
        fromSystem: false,
    },
    {
        name: "lockScroll / trapFocus / restoreFocus",
        description: {
            fr: "Verrouille le scroll, piège le focus, restaure le focus.",
            en: "Locks scroll, traps focus, restores focus.",
        },
        type: "boolean / boolean / boolean",
        required: false,
        default: "true / true / true",
        fromSystem: false,
    },
    {
        name: "preventClose",
        description: {
            fr: "Désactive toutes les interactions de fermeture.",
            en: "Disables all closing interactions.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "size / maxWidthPx / centerY / padded / scrollBehavior",
        description: {
            fr: "Taille du panel, override px, centrage vertical, padding, scroll inside/body.",
            en: "Panel size, px override, vertical centering, padding, scroll inside/body.",
        },
        type: `"xs"|"sm"|"md"|"lg"|"xl" / number / boolean / boolean / "inside"|"body"`,
        required: false,
        default: "md / - / true / true / inside",
        fromSystem: false,
    },
    {
        name: "opaqueBackdrop / backdropOpacity",
        description: {
            fr: "Fond opaque sous le panel + opacité overlay.",
            en: "Opaque underlay under panel + overlay opacity.",
        },
        type: "boolean / number",
        required: false,
        default: "false / 0.55",
        fromSystem: false,
    },
    {
        name: "title / description / header / footer / children",
        description: {
            fr: "Contenu (header auto ou custom) + footer + body.",
            en: "Content (auto header or custom) + footer + body.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "showClose / closeButton / closeButtonAriaLabel",
        description: {
            fr: "Bouton fermer (afficher, override, aria-label).",
            en: "Close button (show, override, aria-label).",
        },
        type: "boolean / React.ReactNode / string",
        required: false,
        default: "true / - / Close",
        fromSystem: false,
    },
    {
        name: "ariaLabel / ariaLabelledby / ariaDescribedby",
        description: {
            fr: "Accessibilité: label fallback ou ids custom.",
            en: "A11y: fallback label or custom ids.",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "initialFocusRef / finalFocusRef",
        description: {
            fr: "Focus initial à l’ouverture, focus final à la fermeture.",
            en: "Initial focus on open, final focus on close.",
        },
        type: "React.RefObject<HTMLElement>",
        required: false,
        fromSystem: false,
    },
    {
        name: "onBeforeClose / onInteractOutside",
        description: {
            fr: "Hooks avancés avant fermeture + clic outside.",
            en: "Advanced hooks before close + outside click.",
        },
        type: "(...)=>boolean|void / (e)=>void",
        required: false,
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Props natives sur le root.",
            en: "Native props on root.",
        },
        type: "Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'title'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentDialogPropsTable: DocsPropRow[] = [
    ...INTENT_DIALOG_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentDialogIdentity: ComponentIdentity = {
    name: "IntentDialog",
    emoji: "🪟",
    kind: "surface",
    description: {
        fr: "Modal intent-first (overlay + panel centré), focus trap, fermeture ESC/overlay, slots header/footer.",
        en: "Intent-first modal (overlay + centered panel), focus trap, ESC/overlay close, header/footer slots.",
    },
    since: "0.2.9",
    docs: { route: "/playground/components/intent-dialog" },
    anatomy: {
        root: "<div>",
        overlay: ".intent-dialog-overlay",
        panel: ".intent-dialog-panel",
        backdrop: ".intent-dialog-underlay",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        header: ".intent-dialog-header",
        body: ".intent-dialog-body",
        footer: ".intent-dialog-footer",
        close: ".intent-dialog-close",
        title: ".intent-dialog-title",
        description: ".intent-dialog-description",
    },
    classHooks: [
        "intent-dialog",
        "intent-dialog-overlay",
        "intent-dialog-panel",
        "intent-dialog-underlay",
        "intent-dialog-header",
        "intent-dialog-body",
        "intent-dialog-footer",
        "intent-dialog-close",
        "is-open",
        "is-disabled",
        "is-centered",
        "is-top",
        "is-padded",
        "is-scroll-inside",
        "is-scroll-body",
        "has-overlay",
        "has-opaqueBackdrop",
        "size-xs",
        "size-sm",
        "size-md",
        "size-lg",
        "size-xl",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentDialog(props: IntentDialogProps) {
    const {
        className,

        open: openProp,
        defaultOpen = false,
        onOpenChange,

        overlay = true,
        closeOnOverlay = true,
        closeOnEscape = true,
        lockScroll = true,
        trapFocus = true,
        restoreFocus = true,
        preventClose = false,

        size = "md",
        maxWidthPx,
        centerY = true,
        padded = true,
        scrollBehavior = "inside",

        opaqueBackdrop = false,
        backdropOpacity = 0.55,

        title,
        description,
        header,
        footer,
        children,

        showClose = true,
        closeButton,
        closeButtonAriaLabel = "Close",

        ariaLabel = "Dialog",
        ariaLabelledby,
        ariaDescribedby,
        initialFocusRef,
        finalFocusRef,

        onBeforeClose,
        onInteractOutside,

        // DS props
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
        ...(onOpenChange ? { onChange: onOpenChange } : {}),
    });

    const canClose = open && !disabled && !preventClose;

    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const lastActive = React.useRef<HTMLElement | null>(null);

    // ✅ Call useId at top level (valid)
    const reactIdRaw = React.useId();
    const reactId = React.useMemo(() => reactIdRaw.replace(/:/g, ""), [reactIdRaw]);

    // ✅ Deterministic auto ids (no extra hooks)
    const autoTitleId = `intent-dialog-title-${reactId}`;
    const autoDescId = `intent-dialog-desc-${reactId}`;

    // ✅ Final ids (respect overrides)
    const titleId = ariaLabelledby ?? autoTitleId;
    const descId = ariaDescribedby ?? autoDescId;

    const hasAutoHeader = Boolean(title || description || showClose);
    const showHeader = Boolean(header) || hasAutoHeader;
    const showFooter = Boolean(footer);

    function attemptClose(reason: "overlay" | "escape" | "closeButton" | "api") {
        if (!canClose && reason !== "api") return;

        const ok = onBeforeClose?.(reason);
        if (ok === false) return;

        setOpen(false);
    }

    // Resolve intent once
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

    // Root vars
    const layoutProps = getIntentLayoutProps(resolved, className);

    // Panel surface (use surface recipe so it behaves like other surfaces)
    const surfaceProps = getIntentSurfaceProps(resolved);
    const panelSurfaceClass = composeIntentClassName(resolved);

    // Glow layers logic (same rules as surfaces)
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

    const computedMaxW =
        typeof maxWidthPx === "number" && Number.isFinite(maxWidthPx) && maxWidthPx > 0
            ? clamp(Math.round(maxWidthPx), 260, 1280)
            : sizeToMaxWidthPx(size);

    // Scroll lock
    React.useEffect(() => {
        if (!open || !lockScroll) return;
        const prev = document.documentElement.style.overflow;
        document.documentElement.style.overflow = "hidden";
        return () => {
            document.documentElement.style.overflow = prev;
        };
    }, [open, lockScroll]);

    // Remember focus before open
    React.useEffect(() => {
        if (!open) return;
        lastActive.current = document.activeElement as HTMLElement | null;
    }, [open]);

    // Initial focus
    React.useEffect(() => {
        if (!open) return;
        const t = window.setTimeout(() => {
            const target =
                initialFocusRef?.current ?? firstFocusable(panelRef.current) ?? panelRef.current;
            target?.focus?.();
        }, 10);
        return () => window.clearTimeout(t);
    }, [open, initialFocusRef]);

    // Restore focus
    React.useEffect(() => {
        if (open) return;
        if (!restoreFocus) return;
        const target = finalFocusRef?.current ?? lastActive.current;
        target?.focus?.();
    }, [open, restoreFocus, finalFocusRef]);

    // ESC close
    React.useEffect(() => {
        if (!open) return;
        if (!closeOnEscape) return;
        if (!canClose) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            e.preventDefault();
            attemptClose("escape");
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, closeOnEscape, canClose]);

    // Focus trap
    React.useEffect(() => {
        if (!open) return;
        if (!trapFocus) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;

            const root = panelRef.current;
            if (!root) return;

            const els = focusables(root);
            if (els.length === 0) {
                e.preventDefault();
                root.focus();
                return;
            }

            const first = els[0]!;
            const last = els[els.length - 1]!;
            const active = document.activeElement as HTMLElement | null;

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
            if (e.target !== e.currentTarget) return; // only outside panel
            onInteractOutside?.(e);
            if (!closeOnOverlay) return;
            if (!canClose) return;
            attemptClose("overlay");
        },
        [overlay, closeOnOverlay, canClose, onInteractOutside]
    );

    if (!open) return null;

    const rootCls = cn(
        "intent-dialog",
        "is-open",
        disabled && "is-disabled",
        overlay && "has-overlay",
        opaqueBackdrop && "has-opaqueBackdrop",
        centerY ? "is-centered" : "is-top",
        padded && "is-padded",
        scrollBehavior === "inside" ? "is-scroll-inside" : "is-scroll-body",
        `size-${size}`
    );

    return (
        <div
            {...divProps}
            style={{
                ...layoutProps.style,
                ...(overlay
                    ? ({
                          ["--intent-dialog-overlay-opacity" as any]: String(backdropOpacity),
                      } as any)
                    : null),
                ...(computedMaxW
                    ? ({ ["--intent-dialog-maxw" as any]: `${computedMaxW}px` } as any)
                    : null),
            }}
            className={cn(layoutProps.className, rootCls, className)}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
            aria-hidden={false}
        >
            <div
                className="intent-dialog-overlay"
                role="presentation"
                onMouseDown={onOverlayMouseDown}
            >
                {/* {opaqueBackdrop ? <span aria-hidden className="intent-dialog-underlay" /> : null} */}

                <div
                    ref={panelRef}
                    {...(surfaceProps as any)}
                    className={cn("intent-dialog-panel", surfaceProps.className, panelSurfaceClass)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={!ariaLabelledby && !title ? ariaLabel : undefined}
                    aria-labelledby={!ariaLabelledby && title ? titleId : ariaLabelledby}
                    aria-describedby={description ? descId : ariaDescribedby}
                    tabIndex={-1}
                >
                    {/* ✅ Opaque underlay BEHIND the panel only */}
                    {opaqueBackdrop ? (
                        <span aria-hidden className="intent-dialog-underlay" />
                    ) : null}
                    {/* Glow layers under content */}
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

                    <div className="intent-dialog-inner">
                        {showHeader ? (
                            <div className="intent-dialog-header">
                                {header ? (
                                    header
                                ) : (
                                    <>
                                        <div className="intent-dialog-headerMain">
                                            {title ? (
                                                <div id={titleId} className="intent-dialog-title">
                                                    {title}
                                                </div>
                                            ) : null}
                                            {description ? (
                                                <div
                                                    id={descId}
                                                    className="intent-dialog-description"
                                                >
                                                    {description}
                                                </div>
                                            ) : null}
                                        </div>

                                        {showClose ? (
                                            <button
                                                type="button"
                                                className="intent-dialog-close"
                                                onClick={() => attemptClose("closeButton")}
                                                disabled={!canClose}
                                                aria-label={closeButtonAriaLabel}
                                            >
                                                {closeButton ?? <span aria-hidden>✕</span>}
                                            </button>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        ) : null}

                        <div className="intent-dialog-body">{children}</div>

                        {showFooter ? <div className="intent-dialog-footer">{footer}</div> : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
