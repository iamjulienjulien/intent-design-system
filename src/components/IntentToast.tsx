"use client";

// src/components/intent/IntentToast.tsx
// IntentToast
// - Intent-first transient notification
// - Auto-dismiss, optional action
// - Surface-light, non-blocking

import * as React from "react";

import type { IntentInput } from "../lib/intent/types";
import { resolveIntent, getIntentLayoutProps, composeIntentClassName } from "../lib/intent/resolve";

import type { DocsPropRow, ComponentIdentity } from "../lib/intent/types";
import { SYSTEM_PROPS_TABLE } from "../lib/intent/props";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentToastPlacement = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export type IntentToastProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
        className?: string;

        title?: React.ReactNode;
        description?: React.ReactNode;

        leftIcon?: React.ReactNode;
        action?: React.ReactNode;

        open?: boolean;
        defaultOpen?: boolean;
        onOpenChange?: (open: boolean) => void;

        duration?: number; // ms
        dismissible?: boolean;

        placement?: IntentToastPlacement;
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_TOAST_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "title",
        description: { fr: "Titre du toast.", en: "Toast title." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "description",
        description: { fr: "Texte descriptif.", en: "Description text." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "leftIcon",
        description: { fr: "Icône à gauche.", en: "Left icon." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "action",
        description: { fr: "Action (bouton / lien).", en: "Action (button / link)." },
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
        name: "duration",
        description: {
            fr: "Durée avant fermeture automatique.",
            en: "Auto-dismiss duration.",
        },
        type: "number",
        required: false,
        default: "4000",
        fromSystem: false,
    },
    {
        name: "dismissible",
        description: {
            fr: "Affiche le bouton fermer.",
            en: "Shows dismiss button.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "placement",
        description: {
            fr: "Position à l’écran.",
            en: "Screen placement.",
        },
        type: `"top-right" | "top-left" | "bottom-right" | "bottom-left"`,
        required: false,
        default: "top-right",
        fromSystem: false,
    },
];

export const IntentToastPropsTable: DocsPropRow[] = [
    ...INTENT_TOAST_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentToastIdentity: ComponentIdentity = {
    name: "IntentToast",
    kind: "feedback",
    description: {
        fr: "Notification éphémère intent-first, non bloquante.",
        en: "Intent-first transient notification, non-blocking.",
    },
    since: "0.2.0",
    docs: { route: "/playground/components/intent-toast" },
    anatomy: {
        root: "<div>",
        icon: ".intent-toast-icon",
        content: ".intent-toast-content",
        title: ".intent-toast-title",
        description: ".intent-toast-description",
        action: ".intent-toast-action",
        close: ".intent-toast-close",
    },
    classHooks: ["intent-toast", "is-open"],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentToast(props: IntentToastProps) {
    const {
        className,

        title,
        description,
        leftIcon,
        action,

        open: openProp,
        defaultOpen = false,
        onOpenChange,

        duration = 4000,
        dismissible = true,
        placement = "top-right",

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

    React.useEffect(() => {
        if (!open || duration <= 0) return;
        const t = window.setTimeout(() => setOpen(false), duration);
        return () => window.clearTimeout(t);
    }, [open, duration, setOpen]);

    const intentInput: IntentInput = {
        ...(intent ? { intent } : {}),
        ...(variant ? { variant } : {}),
        ...(tone ? { tone } : {}),
        ...(glow ? { glow } : {}),
        ...(intensity ? { intensity } : {}),
        ...(mode ? { mode } : {}),
        disabled,
    };

    const resolved = resolveIntent(intentInput);

    const layoutProps = getIntentLayoutProps(resolved, className);
    const surfaceClass = composeIntentClassName(resolved);

    if (!open) return null;

    return (
        <div
            {...divProps}
            role="status"
            aria-live="polite"
            style={layoutProps.style}
            className={cn(layoutProps.className, "intent-toast", `is-${placement}`, surfaceClass)}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-mode={resolved.mode}
        >
            {leftIcon ? <div className="intent-toast-icon">{leftIcon}</div> : null}

            <div className="intent-toast-content">
                {title ? <div className="intent-toast-title">{title}</div> : null}
                {description ? <div className="intent-toast-description">{description}</div> : null}
            </div>

            {action ? <div className="intent-toast-action">{action}</div> : null}

            {dismissible ? (
                <button
                    type="button"
                    className="intent-toast-close"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                >
                    ×
                </button>
            ) : null}
        </div>
    );
}
