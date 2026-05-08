"use client";

// src/components/intent/IntentConfirmDialog.tsx
// IntentConfirmDialog
// - Intent-first confirmation dialog (modal)
// - Overlay + centered panel surface
// - Controlled/uncontrolled open
// - Keyboard: Escape closes, Enter confirms (optional)
// - Uses resolver vars + stable hooks only

import * as React from "react";
import { createPortal } from "react-dom";

import {
    resolveIntent,
    getIntentLayoutProps,
    composeIntentClassName,
    composeIntentControlClassName,
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

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
    if (!ref) return;
    if (typeof ref === "function") ref(value);
    else (ref as any).current = value;
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentConfirmDialogProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
        className?: string;

        /** Content */
        title?: React.ReactNode;
        description?: React.ReactNode;
        icon?: React.ReactNode;

        /** Controlled open (optional) */
        open?: boolean;
        defaultOpen?: boolean;
        onOpenChange?: (open: boolean) => void;

        /** Actions */
        confirmLabel?: React.ReactNode; // default "Confirm"
        cancelLabel?: React.ReactNode; // default "Cancel"
        onConfirm?: () => void | Promise<void>;
        onCancel?: () => void;

        /** Behavior */
        closeOnOverlay?: boolean; // default true
        closeOnEscape?: boolean; // default true
        confirmOnEnter?: boolean; // default true
        loading?: boolean; // default false (disables actions)
        dismissible?: boolean; // default true (shows top-right close)

        /** Advanced: custom actions */
        confirmAction?: React.ReactNode;
        cancelAction?: React.ReactNode;

        /** Portal container */
        portal?: Element | null; // default document.body
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONFIRM_DIALOG_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "title",
        description: { fr: "Titre du dialog.", en: "Dialog title." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "description",
        description: { fr: "Description / message.", en: "Description / message." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "icon",
        description: { fr: "Icône optionnelle.", en: "Optional icon." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "open",
        description: { fr: "Ouverture contrôlée.", en: "Controlled open state." },
        type: "boolean",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultOpen",
        description: { fr: "Ouverture par défaut.", en: "Default open state." },
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
        name: "confirmLabel",
        description: { fr: "Label du bouton confirmer.", en: "Confirm button label." },
        type: "React.ReactNode",
        required: false,
        default: "Confirm",
        fromSystem: false,
    },
    {
        name: "cancelLabel",
        description: { fr: "Label du bouton annuler.", en: "Cancel button label." },
        type: "React.ReactNode",
        required: false,
        default: "Cancel",
        fromSystem: false,
    },
    {
        name: "onConfirm",
        description: { fr: "Callback de confirmation.", en: "Confirm callback." },
        type: "() => void | Promise<void>",
        required: false,
        fromSystem: false,
    },
    {
        name: "onCancel",
        description: { fr: "Callback d’annulation.", en: "Cancel callback." },
        type: "() => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "closeOnOverlay",
        description: { fr: "Clique overlay = ferme.", en: "Click overlay closes." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "closeOnEscape",
        description: { fr: "Escape = ferme.", en: "Escape closes." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "confirmOnEnter",
        description: { fr: "Enter = confirme.", en: "Enter confirms." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "loading",
        description: { fr: "Désactive actions (chargement).", en: "Disables actions (loading)." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "dismissible",
        description: { fr: "Affiche un bouton fermer.", en: "Shows a close button." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "confirmAction",
        description: { fr: "Action confirm custom.", en: "Custom confirm action node." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "cancelAction",
        description: { fr: "Action cancel custom.", en: "Custom cancel action node." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "portal",
        description: { fr: "Container du portal.", en: "Portal container." },
        type: "Element | null",
        required: false,
        fromSystem: false,
    },
];

export const IntentConfirmDialogPropsTable: DocsPropRow[] = [
    ...INTENT_CONFIRM_DIALOG_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentConfirmDialogIdentity: ComponentIdentity = {
    name: "IntentConfirmDialog",
    kind: "feedback",
    description: {
        fr: "Dialog de confirmation intent-first (modal) : overlay + panel, clavier, actions confirm/cancel.",
        en: "Intent-first confirmation dialog (modal): overlay + panel, keyboard, confirm/cancel actions.",
    },
    since: "0.2.3",
    docs: { route: "/playground/components/intent-confirm-dialog" },
    anatomy: {
        root: "<div> (portal root)",
        overlay: ".intent-confirm-overlay",
        panel: ".intent-confirm-panel",
        header: ".intent-confirm-header",
        icon: ".intent-confirm-icon",
        title: ".intent-confirm-title",
        description: ".intent-confirm-description",
        actions: ".intent-confirm-actions",
        cancel: ".intent-confirm-cancel",
        confirm: ".intent-confirm-confirm",
        close: ".intent-confirm-close",
    },
    classHooks: [
        "intent-confirm",
        "intent-confirm-overlay",
        "intent-confirm-panel",
        "intent-confirm-actions",
        "is-open",
        "is-loading",
        "is-disabled",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentConfirmDialog(props: IntentConfirmDialogProps) {
    const {
        className,

        title,
        description,
        icon,

        open: openProp,
        defaultOpen = false,
        onOpenChange,

        confirmLabel = "Confirm",
        cancelLabel = "Cancel",
        onConfirm,
        onCancel,

        closeOnOverlay = true,
        closeOnEscape = true,
        confirmOnEnter = true,

        loading = false,
        dismissible = true,

        confirmAction,
        cancelAction,

        portal,

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

    const disabled = Boolean(dsDisabled) || Boolean(loading);

    const [openUncontrolled, setOpenUncontrolled] = React.useState(defaultOpen);
    const isControlled = openProp !== undefined;
    const open = isControlled ? Boolean(openProp) : openUncontrolled;

    const setOpen = React.useCallback(
        (next: boolean) => {
            if (!isControlled) setOpenUncontrolled(next);
            onOpenChange?.(next);
        },
        [isControlled, onOpenChange]
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

    // Vars live on the portal root wrapper
    const layoutProps = getIntentLayoutProps(resolved, className);

    // Panel uses surface recipe
    const panelSurfaceClass = composeIntentClassName(resolved);

    // Buttons use control recipe (same tone as the dialog unless overridden by user)
    const controlClass = composeIntentControlClassName(resolved);

    const portalTarget =
        portal ?? (typeof document !== "undefined" ? document.body : (null as any));

    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const confirmBtnRef = React.useRef<HTMLButtonElement | null>(null);
    const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);

    const close = React.useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    const handleCancel = React.useCallback(() => {
        onCancel?.();
        close();
    }, [onCancel, close]);

    const handleConfirm = React.useCallback(() => {
        if (disabled) return;
        onConfirm?.();
        close();
    }, [onConfirm, close, disabled]);

    // focus management + restore
    React.useEffect(() => {
        if (!open) return;

        previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

        const t = window.setTimeout(() => {
            // Prefer confirm button, else panel
            confirmBtnRef.current?.focus();
            if (!confirmBtnRef.current) panelRef.current?.focus();
        }, 10);

        return () => window.clearTimeout(t);
    }, [open]);

    React.useEffect(() => {
        if (open) return;

        const el = previouslyFocusedRef.current;
        if (el && typeof el.focus === "function") {
            window.setTimeout(() => el.focus(), 0);
        }
    }, [open]);

    // Keyboard
    React.useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && closeOnEscape) {
                e.preventDefault();
                handleCancel();
                return;
            }

            if (e.key === "Enter" && confirmOnEnter) {
                // avoid confirming when focused in an editable control
                const tag = (document.activeElement?.tagName ?? "").toLowerCase();
                if (tag === "textarea" || tag === "input") return;

                e.preventDefault();
                handleConfirm();
            }

            // minimal focus trap (Tab cycles inside panel)
            if (e.key === "Tab") {
                const root = panelRef.current;
                if (!root) return;

                const focusables = Array.from(
                    root.querySelectorAll<HTMLElement>(
                        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
                    )
                ).filter((x) => !x.hasAttribute("disabled") && !x.getAttribute("aria-hidden"));

                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (!first || !last) return;

                const active = document.activeElement as HTMLElement | null;

                if (!e.shiftKey && active === last) {
                    e.preventDefault();
                    first.focus();
                    return;
                }

                if (e.shiftKey && active === first) {
                    e.preventDefault();
                    last.focus();
                    return;
                }
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, closeOnEscape, confirmOnEnter, handleCancel, handleConfirm]);

    if (!open) return null;
    if (!portalTarget) return null;

    return createPortal(
        <div
            {...divProps}
            {...layoutProps}
            className={cn(
                layoutProps.className,
                "intent-confirm",
                open && "is-open",
                disabled && "is-disabled",
                loading && "is-loading"
            )}
            style={layoutProps.style}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            <div
                className="intent-confirm-overlay"
                role="presentation"
                onMouseDown={(e) => {
                    if (!closeOnOverlay) return;
                    if (e.target !== e.currentTarget) return;
                    handleCancel();
                }}
            >
                <div
                    ref={panelRef}
                    className={cn("intent-surface intent-confirm-panel", panelSurfaceClass)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={typeof title === "string" ? title : "Confirm action"}
                    tabIndex={-1}
                >
                    {dismissible ? (
                        <button
                            type="button"
                            className="intent-confirm-close"
                            aria-label="Close"
                            onClick={handleCancel}
                            disabled={disabled}
                        >
                            ×
                        </button>
                    ) : null}

                    <div className="intent-confirm-header">
                        {icon ? <div className="intent-confirm-icon">{icon}</div> : null}

                        <div className="intent-confirm-text">
                            {title ? <div className="intent-confirm-title">{title}</div> : null}
                            {description ? (
                                <div className="intent-confirm-description">{description}</div>
                            ) : null}
                        </div>
                    </div>

                    <div className="intent-confirm-actions">
                        {cancelAction ? (
                            cancelAction
                        ) : (
                            <button
                                type="button"
                                className={cn("intent-control intent-confirm-cancel", controlClass)}
                                onClick={handleCancel}
                                disabled={disabled}
                            >
                                {cancelLabel}
                            </button>
                        )}

                        {confirmAction ? (
                            confirmAction
                        ) : (
                            <button
                                ref={(n) => {
                                    confirmBtnRef.current = n;
                                    setRef(undefined, n as any);
                                }}
                                type="button"
                                className={cn(
                                    "intent-control intent-confirm-confirm",
                                    controlClass
                                )}
                                onClick={handleConfirm}
                                disabled={disabled}
                            >
                                {loading ? "…" : confirmLabel}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        portalTarget
    );
}
