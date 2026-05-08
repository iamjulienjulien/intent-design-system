"use client";

// src/components/intent/IntentToast.tsx
// IntentToast
// - Intent-first transient notification
// - Auto-dismiss, optional action
// - Surface-light, non-blocking
// ✅ Fix: add glow layers like other surfaces
// ✅ Add: backdrop layer (opacity + blur) under toast content

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

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentToastPlacement = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export type IntentToastProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children" | "title"> & {
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

        /**
         * Backdrop “glass” layer under content.
         * - true uses defaults (CSS can tune)
         * - number sets opacity (0..1)
         */
        backdrop?: boolean | number; // default true
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
    {
        name: "backdrop",
        description: {
            fr: "Ajoute une couche backdrop (verre) sous le toast. true=par défaut, number=opacité (0..1).",
            en: "Adds a backdrop glass layer under the toast. true=default, number=opacity (0..1).",
        },
        type: "boolean | number",
        required: false,
        default: "true",
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
        backdrop: ".intent-toast-backdrop",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        icon: ".intent-toast-icon",
        content: ".intent-toast-content",
        title: ".intent-toast-title",
        description: ".intent-toast-description",
        action: ".intent-toast-action",
        close: ".intent-toast-close",
    },
    classHooks: [
        "intent-toast",
        "is-open",
        "intent-toast-backdrop",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
    ],
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

        backdrop = true,

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
    const surfaceClass = composeIntentClassName(resolved);

    // ✨ Glow logic (same rules as other surfaces/controls)
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

    if (!open) return null;

    const backdropOpacity =
        typeof backdrop === "number"
            ? Math.max(0, Math.min(1, backdrop))
            : backdrop
              ? undefined
              : 0;

    return (
        <div
            {...divProps}
            role="status"
            aria-live="polite"
            style={{
                ...layoutProps.style,
                ...(backdropOpacity !== undefined
                    ? ({
                          ["--intent-toast-backdrop-opacity" as any]: String(backdropOpacity),
                      } as any)
                    : null),
            }}
            className={cn(layoutProps.className, "intent-toast", `is-${placement}`, surfaceClass)}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-mode={resolved.mode}
        >
            {/* Backdrop glass layer (under content) */}
            {backdrop ? <span aria-hidden className="intent-toast-backdrop" /> : null}

            {/* Glow layers (under content, above backdrop) */}
            {glowAllowed ? (
                <>
                    {allowFillGlow ? (
                        <span
                            aria-hidden
                            className={cn("intent-glow-layer intent-glow-fill")}
                            style={{ opacity: readOpacity("--intent-glow-fill-opacity") }}
                        />
                    ) : null}

                    {allowBorderGlow ? (
                        <span
                            aria-hidden
                            className={cn("intent-glow-layer intent-glow-border")}
                            style={{
                                opacity: readOpacity("--intent-glow-border-opacity"),
                                borderRadius: "inherit",
                            }}
                        />
                    ) : null}
                </>
            ) : null}

            {/* Content (above all layers) */}
            <div className="intent-toast-inner">
                {leftIcon ? <div className="intent-toast-icon">{leftIcon}</div> : null}

                <div className="intent-toast-content">
                    {title ? <div className="intent-toast-title">{title}</div> : null}
                    {description ? (
                        <div className="intent-toast-description">{description}</div>
                    ) : null}
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
        </div>
    );
}
